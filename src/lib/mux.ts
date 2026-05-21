// @ts-ignore - Garantir compatibilidade de tipos do Mux no build
import { Mux } from '@mux/mux-node'
import { SignJWT, importPKCS8 } from 'jose'

/**
 * Sanitiza chaves de ambiente para evitar problemas com Docker/GCP Secret Manager.
 * Remove escapes de shell (\) e espaços em branco.
 */
export function sanitizeKey(key: string | undefined): string {
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

// ─── DER helpers (PKCS#1 → PKCS#8) ──────────────────────────────────────────

function unwrapPem(pem: string): Uint8Array {
    const b64 = pem
        .trim()
        .replace(/\n/g, '')
        .replace(/^-----[A-Z ]+-----|-----[A-Z ]+-----$/g, '')
    return Uint8Array.from(atob(b64), c => c.charCodeAt(0))
}

function toBase64(u8: Uint8Array): string {
    return btoa(Array.from(u8, byte => String.fromCharCode(byte)).join(''))
}

const RSA_ALGORITHM_ID = Uint8Array.of(
    0x30, 0x0d, 0x06, 0x09, 0x2a, 0x86, 0x48, 0x86, 0xf7, 0x0d,
    0x01, 0x01, 0x01, 0x05, 0x00,
)

function derLength(length: number): Uint8Array {
    if (length <= 0x7f) return Uint8Array.of(length)
    const bytes: number[] = []
    let n = length
    while (n) { bytes.push(n & 0xff); n >>>= 8 }
    bytes.reverse()
    return Uint8Array.of(0x80 | bytes.length, ...bytes)
}

function derSequence(...elements: Uint8Array[]): Uint8Array {
    const total = elements.reduce((a, b) => {
        const r = new Uint8Array(a.length + b.length)
        r.set(a); r.set(b, a.length); return r
    })
    const len = derLength(total.length)
    const out = new Uint8Array(1 + len.length + total.length)
    out[0] = 0x30; out.set(len, 1); out.set(total, 1 + len.length)
    return out
}

function derOctetString(data: Uint8Array): Uint8Array {
    const len = derLength(data.length)
    const out = new Uint8Array(1 + len.length + data.length)
    out[0] = 0x04; out.set(len, 1); out.set(data, 1 + len.length)
    return out
}

function pkcs1ToPkcs8(pkcs1: Uint8Array): Uint8Array {
    const version = Uint8Array.of(0x02, 0x01, 0x00)
    return derSequence(version, RSA_ALGORITHM_ID, derOctetString(pkcs1))
}

function toPkcs8Pem(key: Uint8Array): string {
    const b64 = toBase64(key)
    const lines = ['-----BEGIN PRIVATE KEY-----']
    for (let i = 0; i < b64.length; i += 64) lines.push(b64.substring(i, i + 64))
    lines.push('-----END PRIVATE KEY-----')
    return lines.join('\n')
}

// ─── Mux JWT signing with explicit audience ─────────────────────────────────

export async function signMuxPlaybackToken(
    playbackId: string,
    options: {
        aud: 'v' | 's'
        keyId: string
        keySecret: string
        expiration?: string
        sub?: string
    },
): Promise<string> {
    const { aud, keyId, keySecret, sub } = options
    const expiration = options.expiration ?? '1h'

    let pem = keySecret.trim()
    if (!pem.startsWith('-----BEGIN')) {
        const cleaned = pem.replace(/\s/g, '')
        const decoded = Buffer.from(cleaned, 'base64').toString('utf-8')
        if (decoded.includes('-----BEGIN')) {
            pem = decoded.trim()
        }
    }
    if (pem.startsWith('-----BEGIN RSA PRIVATE KEY-----')) {
        const der = unwrapPem(pem)
        const pkcs8 = pkcs1ToPkcs8(der)
        pem = toPkcs8Pem(pkcs8)
    } else if (!pem.startsWith('-----BEGIN PRIVATE KEY-----')) {
        console.log("CONTEÚDO DA VARIÁVEL PEM:", JSON.stringify(pem));
        throw new TypeError('MUX_SIGNING_KEY must be a PEM-encoded private key (PKCS#1 or PKCS#8)')
    }

    const privateKey = await importPKCS8(pem, 'RS256')

    const token = await new SignJWT({ aud })
        .setProtectedHeader({ alg: 'RS256', kid: keyId })
        .setSubject(playbackId)
        .setExpirationTime(expiration)
        .sign(privateKey)

    return token
}
