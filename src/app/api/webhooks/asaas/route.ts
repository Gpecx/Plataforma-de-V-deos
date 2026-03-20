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
            console.log(`Webhook Asaas: Processando evento ${event} para payment ${payment.id}`)

            const vendasLogsQuery = await adminDb.collection('vendas_logs')
                .where('idTransacao', '==', payment.id)
                .limit(1)
                .get()

            if (vendasLogsQuery.empty) {
                console.warn(`Webhook Asaas: Venda não encontrada para transactionId ${payment.id}`)
                return NextResponse.json({ success: true, message: 'Sale not found' }, { status: 200 })
            }

            const saleDoc = vendasLogsQuery.docs[0]
            const saleData = saleDoc.data()
            const { alunoId, cursoId } = saleData

            await saleDoc.ref.update({
                statusPagamento: 'pago',
                dataAtualizacao: FieldValue.serverTimestamp(),
                paymentStatus: payment.status,
                paymentReceivedAt: FieldValue.serverTimestamp()
            })

            console.log(`Webhook Asaas: Status atualizado para 'pago' na venda ${saleDoc.id}`)

            const existingEnrollment = await adminDb.collection('enrollments')
                .where('user_id', '==', alunoId)
                .where('course_id', '==', cursoId)
                .limit(1)
                .get()

            if (!existingEnrollment.empty) {
                console.log(`Webhook Asaas: Enrollment já existe para aluno ${alunoId} no curso ${cursoId}`)
            } else {
                await adminDb.collection('enrollments').add({
                    user_id: alunoId,
                    course_id: cursoId,
                    created_at: FieldValue.serverTimestamp(),
                    source: 'asaas_webhook',
                    transaction_id: payment.id
                })

                console.log(`Webhook Asaas: Enrollment criado para aluno ${alunoId} no curso ${cursoId}`)
            }
        } else {
            console.log(`Webhook Asaas: Evento ${event} ignorado`)
        }

        return NextResponse.json({ success: true }, { status: 200 })

    } catch (error) {
        console.error('Webhook Asaas: Erro ao processar webhook:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
