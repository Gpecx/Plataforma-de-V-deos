'use server'

import { getMuxClient } from '@/lib/mux'
import { getSessionUser } from './auth'

/**
 * Gera uma URL de Direct Upload no Mux para envio de vídeos.
 * @param context - 'intro' para vídeos de introdução (público), 'lesson' para aulas (signed)
 */
export async function getMuxUploadUrl(context?: 'intro' | 'lesson') {
    const user = await getSessionUser()

    if (!user || (user.role !== 'teacher' && user.role !== 'admin')) {
        return { error: 'Não autorizado. Apenas instrutores podem fazer upload de conteúdo.' }
    }

    let playbackPolicy: 'public'[] | 'signed'[]

    if (context === 'intro') {
        playbackPolicy = ['public']
        console.log('[MuxUpload]Criando upload PÚBLICO para vídeo de introdução')
    } else {
        playbackPolicy = ['signed']
        if (context) {
            console.log('[MuxUpload]Criando upload SIGNED para aulas')
        }
    }

    try {
        const mux = getMuxClient()

        const upload = await mux.video.uploads.create({
            new_asset_settings: {
                playback_policy: playbackPolicy,
            },
            cors_origin: '*',
        })

        return {
            success: true,
            url: upload.url,
            id: upload.id
        }
    } catch (error: any) {
        console.error('Mux Direct Upload Error:', error)
        return { error: 'Falha ao gerar URL de upload no Mux.' }
    }
}

/**
 * Busca o status de um upload no Mux para obter o asset_id e playback_id.
 */
export async function getMuxUploadStatus(uploadId: string) {
    const user = await getSessionUser()
    if (!user) return { error: 'Não autorizado' }

    try {
        const mux = getMuxClient()
        const upload = await mux.video.uploads.retrieve(uploadId)

        if (upload.status === 'asset_created') {
            const assetId = upload.asset_id
            if (assetId) {
                const asset = await mux.video.assets.retrieve(assetId)
                return {
                    status: 'ready',
                    asset_id: assetId,
                    playback_id: asset.playback_ids?.[0]?.id
                }
            }
        }

        return { status: upload.status }
    } catch (error: any) {
        console.error('Mux Retrieve Upload Error:', error)
        return { error: 'Falha ao buscar status do upload.' }
    }
}

/**
 * Garante que um asset do Mux tenha política pública.
 * Se o asset já tiver um playback ID público, retorna ele.
 * Se não tiver, cria um novo playback ID público e retorna.
 */
export async function ensurePublicPlaybackId(assetId: string) {
    const user = await getSessionUser()
    if (!user || (user.role !== 'teacher' && user.role !== 'admin')) {
        return { error: 'Não autorizado' }
    }

    try {
        const mux = getMuxClient()
        const asset = await mux.video.assets.retrieve(assetId)

        const existingPublic = asset.playback_ids?.find((p: any) => p.policy === 'public')
        if (existingPublic) {
            return { success: true, playback_id: existingPublic.id }
        }

        const updated = await mux.video.assets.update(assetId, {
            playback_policy: ['public', 'signed']
        })

        const newPublic = updated.playback_ids?.find((p: any) => p.policy === 'public')
        return {
            success: true,
            playback_id: newPublic?.id || asset.playback_ids?.[0]?.id
        }
    } catch (error: any) {
        console.error('Ensure Public Playback Error:', error)
        return { error: error.message }
    }
}
