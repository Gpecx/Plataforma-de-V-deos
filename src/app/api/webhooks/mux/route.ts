// @ts-ignore - Garantir compatibilidade de tipos do Mux no build
import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'
import { getMuxClient } from '@/lib/mux'

interface MuxWebhookPayload {
    type: string
    data: {
        id: string
        uploader_id: string
        playback_ids?: Array<{ id: string; policy: string }>
        status: string
    }
}

export async function POST(request: NextRequest) {
    // 1. Captura o raw body ANTES de qualquer parse — obrigatório para validação HMAC
    const rawBody = await request.text()

    // 2. Valida a assinatura criptográfica do Mux (obrigatório em todos os ambientes)
    const webhookSecret = process.env.MUX_WEBHOOK_SECRET
    if (!webhookSecret) {
        console.error('Webhook Mux: MUX_WEBHOOK_SECRET não configurado')
        return new Response('Internal Server Error', { status: 500 })
    }

    try {
        // Na v12 do SDK, verifySignature está em muxClient.webhooks (APIResource)
        const mux = getMuxClient()
        mux.webhooks.verifySignature(rawBody, request.headers, webhookSecret)
    } catch (err) {
        console.error('Webhook Mux: Assinatura inválida —', err)
        return new Response('Invalid signature', { status: 401 })
    }

    // 3. Assinatura válida — processa o payload
    try {
        const payload: MuxWebhookPayload = JSON.parse(rawBody)

        if (!payload.type || !payload.data?.id) {
            console.error('Webhook Mux: Payload inválido', payload)
            return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
        }

        const { type, data } = payload
        console.log(`Webhook Mux: Recebido evento ${type} para asset ${data.id}`)

        if (type === 'video.asset.ready') {
            const playbackId = data.playback_ids?.[0]?.id
            const assetId = data.id

            if (!playbackId) {
                console.error('Webhook Mux: playback_id não encontrado no payload', data)
                return NextResponse.json({ error: 'playback_id not found' }, { status: 400 })
            }

            // 1. Busca o curso pelo intro_video_asset_id
            const coursesQuery = await adminDb.collection('courses')
                .where('intro_video_asset_id', '==', assetId)
                .limit(1)
                .get()

            if (!coursesQuery.empty) {
                const courseDoc = coursesQuery.docs[0]
                await courseDoc.ref.update({
                    intro_video_playback_id: playbackId,
                    updated_at: new Date()
                })
                console.log(`Webhook Mux: Curso ${courseDoc.id} atualizado com playback_id ${playbackId}`)
                return NextResponse.json({ success: true, updated: 'course' }, { status: 200 })
            }

            // 2. Busca o curso pelo pendingTrailerAssetId (trailer pendente de aprovação)
            const pendingTrailerQuery = await adminDb.collection('courses')
                .where('pendingTrailerAssetId', '==', assetId)
                .limit(1)
                .get()

            if (!pendingTrailerQuery.empty) {
                const courseDoc = pendingTrailerQuery.docs[0]
                await courseDoc.ref.update({
                    pendingTrailerPlaybackId: playbackId,
                    updated_at: new Date()
                })
                console.log(`Webhook Mux: Curso ${courseDoc.id} atualizado com pendingTrailerPlaybackId ${playbackId}`)
                return NextResponse.json({ success: true, updated: 'pending_trailer' }, { status: 200 })
            }

            // 3. Busca a aula pelo mux_asset_id
            const lessonsQuery = await adminDb.collection('lessons')
                .where('mux_asset_id', '==', assetId)
                .limit(1)
                .get()

            if (!lessonsQuery.empty) {
                const lessonDoc = lessonsQuery.docs[0]
                await lessonDoc.ref.update({
                    mux_playback_id: playbackId,
                    updated_at: new Date()
                })
                console.log(`Webhook Mux: Aula ${lessonDoc.id} atualizada com playback_id ${playbackId}`)
                return NextResponse.json({ success: true, updated: 'lesson' }, { status: 200 })
            }

            console.log(`Webhook Mux: Nenhum documento encontrado para asset_id ${assetId}`)
            return NextResponse.json({ success: true, message: 'No document found' }, { status: 200 })
        }

        if (type === 'video.asset.errored') {
            console.error(`Webhook Mux: Erro no processamento do asset ${data.id}`)
        }

        return NextResponse.json({ success: true }, { status: 200 })

    } catch (error) {
        console.error('Webhook Mux: Erro ao processar webhook:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}