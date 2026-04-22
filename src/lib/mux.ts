// @ts-ignore - Garantir compatibilidade de tipos do Mux no build
import { Mux } from '@mux/mux-node'

/**
 * Sanitiza chaves de ambiente para evitar problemas com Docker/GCP Secret Manager.
 * Remove escapes de shell (\) e espaços em branco.
 */
function sanitizeKey(key: string | undefined): string {
    if (!key) return ''
    return key.replace(/\\/g, '').trim()
}

/**
 * Instância do Mux Client.
 * Inicializado com MUX_TOKEN_ID e MUX_TOKEN_SECRET das variáveis de ambiente.
 */
export function getMuxClient(): Mux {
    const tokenId = sanitizeKey(process.env.MUX_TOKEN_ID)
    const tokenSecret = sanitizeKey(process.env.MUX_TOKEN_SECRET)
    const signingKeyId = sanitizeKey(process.env.MUX_SIGNING_KEY_ID)
    const signingKey = sanitizeKey(process.env.MUX_SIGNING_KEY)

    if (!tokenId || !tokenSecret) {
        throw new Error('MUX_TOKEN_ID ou MUX_TOKEN_SECRET não configurados ou vazios após sanitização')
    }

    if (!signingKeyId || !signingKey) {
        console.warn('Mux: MUX_SIGNING_KEY_ID ou MUX_SIGNING_KEY não configurados. Assinatura de tokens falhará.')
    }

    return new Mux({ tokenId, tokenSecret })
}
