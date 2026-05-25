'use server'

import { getMuxClient, signMuxPlaybackToken, sanitizeKey } from '@/lib/mux'
import { getSessionUser } from './auth'
import { adminDb } from '@/lib/firebase-admin'

/**
 * Gera uma URL de Direct Upload no Mux para envio de vídeos.
 * @param context - 'intro' para vídeos de introdução (público), 'lesson' para aulas (signed)
 * @param courseId - ID do curso (opcional). Se o curso estiver APROVADO, força signed policy mesmo para intro.
 */
export async function getMuxUploadUrl(context?: 'intro' | 'lesson', courseId?: string) {
    const user = await getSessionUser()

    if (!user || (user.role !== 'teacher' && user.role !== 'admin')) {
        return { error: 'Não autorizado. Apenas instrutores podem fazer upload de conteúdo.' }
    }

    let playbackPolicy: 'public'[] | 'signed'[]

    if (context === 'intro' && courseId) {
        const courseDoc = await adminDb.collection('courses').doc(courseId).get()
        const courseData = courseDoc.data()
        if (courseData?.status === 'APROVADO') {
            playbackPolicy = ['signed']
        } else {
            playbackPolicy = ['public']
        }
    } else if (context === 'intro') {
        playbackPolicy = ['public']
    } else {
        playbackPolicy = ['signed']
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
        // HIGHLIGHT: Log Industrial (Transparência Total)
        console.error("MUX_UPLOAD_ERROR:", {
            context,
            status: error.status,
            message: error.message,
            isAuthError: error.status === 401,
            details: error.response?.data?.errors || 'No detailed error from Mux'
        });

        if (error.status === 401) {
            return { error: 'Erro de autenticação com o Mux. Verifique as credenciais no servidor.' }
        }

        return { error: `Falha ao gerar URL de upload no Mux: ${error.message}` }
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

        if (upload.status === 'errored') {
            console.error("MUX_ASSET_ERROR:", {
                uploadId,
                error: upload.error
            });
            return { status: 'errored', error: upload.error?.message || 'Erro no processamento do vídeo pelo Mux.' }
        }

        return { status: upload.status }
    } catch (error: any) {
        // HIGHLIGHT: Log Industrial
        console.error("MUX_RETRIEVE_ERROR:", {
            uploadId,
            status: error.status,
            isAuthError: error.status === 401
        });

        if (error.status === 401) {
            return { error: 'Erro de autenticação ao consultar status do upload.' }
        }

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

        // Em vez de usar .update, criamos o novo ID com a política correta
        await mux.video.assets.createPlaybackId(assetId, {
            policy: 'public'
        });

        // Depois, busque o asset atualizado para manter o fluxo do seu código
        const updated = await mux.video.assets.retrieve(assetId);

        const newPublic = updated.playback_ids?.find((p: any) => p.policy === 'public')
        return {
            success: true,
            playback_id: newPublic?.id || asset.playback_ids?.[0]?.id
        }
    } catch (error: any) {
        // HIGHLIGHT: Log Industrial
        console.error("MUX_PLAYBACK_ERROR:", {
            assetId,
            status: error.status,
            message: error.message,
            isAuthError: error.status === 401
        });

        if (error.status === 401) {
            return { error: 'Erro de autenticação com o Mux.' }
        }

        return { error: error.message }
    }
}

/**
 * Exclui um asset do Mux pelo asset_id.
 * Retorna { success: true } se deletado com sucesso ou se o asset não existir (404).
 * Retorna erro em caso de falha na infraestrutura.
 */
export async function deleteMuxAsset(assetId: string) {
    const user = await getSessionUser()
    if (!user || (user.role !== 'teacher' && user.role !== 'admin')) {
        return { error: 'Não autorizado' }
    }

    if (!assetId) {
        return { error: 'asset_id inválido' }
    }

    try {
        const mux = getMuxClient()
        
        await mux.video.assets.delete(assetId)
        console.log(`[deleteMuxAsset] Asset ${assetId} deletado com sucesso do Mux`)
        
        return { success: true }
    } catch (error: any) {
        // HIGHLIGHT: Log Industrial
        console.error(`MUX_DELETE_ERROR:`, {
            assetId,
            status: error.status,
            message: error.message,
            isAuthError: error.status === 401
        });
        
        if (error.status === 404 || error.response?.status === 404) {
            console.log(`[deleteMuxAsset] Asset ${assetId} não encontrado no Mux (já foi deletado?)`)
            return { success: true }
        }

        if (error.status === 401) {
            return { error: 'Erro de autenticação ao tentar deletar asset no Mux.' }
        }
        
        return { error: `Falha ao deletar asset no Mux: ${error.message}` }
    }
}

/**
 * Gera um token de visualização assinado para um playback_id.
 * Usado para permitir que o professor visualize aulas (que são signed) no dashboard.
 */
export async function getLessonPlaybackToken(playbackId: string) {
    const user = await getSessionUser()
    if (!user || (user.role !== 'teacher' && user.role !== 'admin')) {
        return { error: 'Não autorizado' }
    }

    try {
        const token = await signMuxPlaybackToken(playbackId, {
            aud: 'v',
            keyId: sanitizeKey(process.env.MUX_SIGNING_KEY_ID),
            keySecret: sanitizeKey(process.env.MUX_SIGNING_KEY),
            expiration: '1h',
        })
        
        return { success: true, token }
    } catch (error: any) {
        console.error("MUX_TOKEN_ERROR:", error)
        return { error: `Falha ao gerar token: ${error.message}` }
    }
}
