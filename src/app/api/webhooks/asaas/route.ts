import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'
import { FieldValue } from 'firebase-admin/firestore'
import { getPayment } from '@/services/asaasService'

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
            // A-04: Validação cruzada com a API do Asaas.
            // Se a consulta falhar (timeout/rate-limit), usa como fallback o status do próprio payload
            // para não travar a conciliação automática.
            let asaasPayment = null
            try {
                asaasPayment = await getPayment(payment.id)
            } catch (err) {
                console.warn(`Webhook Asaas: Consulta à API falhou para ${payment.id}, usando fallback do payload.`, err)
            }
            const confirmedStatuses = ['RECEIVED', 'CONFIRMED']
            const isConfirmed = asaasPayment
                ? confirmedStatuses.includes(asaasPayment.status)
                : confirmedStatuses.includes(payment.status)
            if (!isConfirmed) {
                const statusForLog = asaasPayment?.status ?? payment.status
                console.error(`Webhook Asaas: Status não confirmado (${statusForLog}) para o evento ${event}`)
                return NextResponse.json({ error: 'Integrity check failed' }, { status: 400 })
            }
            const invoiceUrl = asaasPayment?.invoiceUrl || null

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
                    invoiceUrl: invoiceUrl || saleData.invoiceUrl || null,
                })

                // Confirma o enrollment (muda status para ativo)
                let enrollmentQuery = await adminDb.collection('enrollments')
                    .where('payment_id', '==', payment.id)
                    .where('course_id', '==', cursoId)
                    .limit(1)
                    .get()

                // Fallback: se o webhook chegou antes do payment_id ser atualizado,
                // busca pelo par user_id + course_id (enrollment foi criado antes do Asaas)
                if (enrollmentQuery.empty && userId && cursoId) {
                    enrollmentQuery = await adminDb.collection('enrollments')
                        .where('user_id', '==', userId)
                        .where('course_id', '==', cursoId)
                        .limit(1)
                        .get()
                }

                if (!enrollmentQuery.empty) {
                    const enrollmentRef = enrollmentQuery.docs[0].ref
                    batch.update(enrollmentRef, {
                        payment_confirmed: true,
                        payment_id: payment.id,
                        updated_at: FieldValue.serverTimestamp(),
                        paid_at: new Date(),
                        status: 'active'
                    })

                    // Remove da lista de desejos, se existir
                    const wishlistRef = adminDb.collection('profiles').doc(userId).collection('wishlist').doc(cursoId)
                    batch.delete(wishlistRef)
                } else {
                    console.warn(`Webhook Asaas: Tentativa de confirmar matrícula inexistente para user ${userId} e curso ${cursoId}`)
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
