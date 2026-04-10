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

            // 1. Busca da Venda por paymentId
            const vendasLogsQuery = await adminDb.collection('vendas_logs')
                .where('paymentId', '==', payment.id)
                .limit(1)
                .get()

            if (vendasLogsQuery.empty) {
                console.error(`Webhook Asaas: Venda não encontrada para paymentId ${payment.id}`)
                return NextResponse.json({ success: true, message: 'Venda não encontrada, ignorando.' }, { status: 200 })
            }

            const saleDoc = vendasLogsQuery.docs[0]
            const saleData = saleDoc.data()

            // 2. Idempotência: já foi processado?
            if (saleData.status === 'PAID') {
                console.log(`Webhook Asaas: Pagamento ${payment.id} já foi processado anteriormente. Ignorando.`)
                return NextResponse.json({ success: true, message: 'Já processado.' }, { status: 200 })
            }

            const { userId, cursoId } = saleData

            // 3. Liberação do Curso: adiciona cursoId ao perfil do usuário
            const profileRef = adminDb.collection('profiles').doc(userId)
            await profileRef.update({
                cursos_comprados: FieldValue.arrayUnion(cursoId),
                updated_at: FieldValue.serverTimestamp(),
            })
            console.log(`Webhook Asaas: Curso ${cursoId} liberado para o usuário ${userId}`)

            // 4. Baixa no Pagamento: atualiza o status da venda para PAID
            await saleDoc.ref.update({
                status: 'PAID',
                paymentDate: FieldValue.serverTimestamp(),
            })
            console.log(`Webhook Asaas: Venda ${saleDoc.id} marcada como PAID.`)

        } else {
            console.log(`Webhook Asaas: Evento ${event} ignorado`)
        }

        return NextResponse.json({ success: true }, { status: 200 })

    } catch (error) {
        console.error('Webhook Asaas: Erro ao processar webhook:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
