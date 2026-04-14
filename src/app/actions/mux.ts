'use server'

import { getMuxClient } from '@/lib/mux'
import { getSessionUser } from './auth'

/**
 * Gera uma URL de Direct Upload no Mux para envio seguro de vídeos pelo front-end.
 */
export async function getMuxUploadUrl() {
    const user = await getSessionUser()

    // Validação básica de permissão (deve ser professor ou admin)
    if (!user || (user.role !== 'teacher' && user.role !== 'admin')) {
        return { error: 'Não autorizado. Apenas instrutores podem fazer upload de conteúdo.' }
    }

    try {
        const mux = getMuxClient()

        const upload = await mux.video.uploads.create({
            new_asset_settings: {
                playback_policy: ['signed'],
            },
            cors_origin: '*', // Permitir uploads de qualquer origem em dev ou configurar domínio específico em prod
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
