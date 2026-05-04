import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'
import { FieldValue } from 'firebase-admin/firestore'

interface AsaasWebhookPayload {
    event: string
    payment: {
        id: string
        customer: string
        billingType: string
        value: number
        status: string
        externalReference?: string
    }
}

export async function POST(request: NextRequest) {
    try {
        const token = request.headers.get('asaas-access-token')

        if (!token || token !== process.env.ASAAS_WEBHOOK_TOKEN) {
            console.error('Webhook Asaas: Token inválido ou ausente')
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const payload: AsaasWebhookPayload = await request.json()

        if (!payload.event || !payload.payment?.id) {
            console.error('Webhook Asaas: Payload inválido', payload)
            return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
        }

        const { event, payment } = payload

        if (event === 'PAYMENT_RECEIVED' || event === 'PAYMENT_CONFIRMED') {
            // 1. Busca todas as linhas de vendas_logs com este paymentId (pode ser compra multi-curso)
            const vendasLogsQuery = await adminDb.collection('vendas_logs')
                .where('paymentId', '==', payment.id)
                .get()

            if (vendasLogsQuery.empty) {
                console.error(`Webhook Asaas: Nenhuma venda encontrada para paymentId ${payment.id}`)
                return NextResponse.json({ success: true, message: 'Venda não encontrada, ignorando.' }, { status: 200 })
            }

            // 2. Idempotência: verifica se ao menos um já foi processado
            const alreadyProcessed = vendasLogsQuery.docs.some(d => d.data().statusPagamento === 'pago')
            if (alreadyProcessed) {
                return NextResponse.json({ success: true, message: 'Já processado.' }, { status: 200 })
            }

            // 3. Confirma cada venda e atualiza o enrollment correspondente
            const batch = adminDb.batch()

            for (const saleDoc of vendasLogsQuery.docs) {
                const saleData = saleDoc.data()
                const userId: string = saleData.userId || saleData.alunoId
                const cursoId: string = saleData.cursoId

                // Marca a venda como paga
                batch.update(saleDoc.ref, {
                    statusPagamento: 'pago',
                    paymentDate: FieldValue.serverTimestamp(),
                })

                // Confirma o enrollment (muda status para confirmado se existir o campo)
                const enrollmentQuery = await adminDb.collection('enrollments')
                    .where('user_id', '==', userId)
                    .where('course_id', '==', cursoId)
                    .limit(1)
                    .get()

                if (!enrollmentQuery.empty) {
                    batch.update(enrollmentQuery.docs[0].ref, {
                        payment_confirmed: true,
                        payment_id: payment.id,
                        updated_at: FieldValue.serverTimestamp(),
                    })
                } else {
                    // Fallback: cria enrollment se não existir (edge case)
                    const newEnrollRef = adminDb.collection('enrollments').doc()
                    batch.set(newEnrollRef, {
                        user_id: userId,
                        course_id: cursoId,
                        payment_confirmed: true,
                        payment_id: payment.id,
                        created_at: FieldValue.serverTimestamp(),
                    })
                }
            }

            await batch.commit()

        } else {
            // Eventos ignorados não precisam ser logados em produção
        }

        return NextResponse.json({ success: true }, { status: 200 })

    } catch (error) {
        console.error('Webhook Asaas: Erro ao processar webhook:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
