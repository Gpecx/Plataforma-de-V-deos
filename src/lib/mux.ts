// @ts-ignore - Garantir compatibilidade de tipos do Mux no build
import { Mux } from '@mux/mux-node'

/**
 * Instância do Mux Client.
 * Inicializado com MUX_TOKEN_ID e MUX_TOKEN_SECRET das variáveis de ambiente.
 */
export function getMuxClient(): Mux {
    const tokenId = process.env.MUX_TOKEN_ID
    const tokenSecret = process.env.MUX_TOKEN_SECRET
    const signingKeyId = process.env.MUX_SIGNING_KEY_ID
    const signingKey = process.env.MUX_SIGNING_KEY

    if (!tokenId || !tokenSecret) {
        throw new Error('MUX_TOKEN_ID ou MUX_TOKEN_SECRET não configurados')
    }

    if (!signingKeyId || !signingKey) {
        console.warn('Mux: MUX_SIGNING_KEY_ID ou MUX_SIGNING_KEY não configurados. Assinatura de tokens falhará.')
    }

    return new Mux({ tokenId, tokenSecret })
}
