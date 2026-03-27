import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'
import { adminAuth } from '@/lib/firebase-admin'
// @ts-expect-error - Tipos do Mux não disponíveis
import { Mux } from '@mux/mux-node'

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface VideoAuthRequest {
    cursoId: string
    playbackId: string
}

// ─── Instância do Mux ─────────────────────────────────────────────────────────
// O SDK é inicializado com as chaves de assinatura JWT do Mux.
// MUX_TOKEN_ID  : "Signing Key ID"  no painel Mux → Settings → Signing Keys
// MUX_TOKEN_SECRET : "Private Key" (base64) correspondente
function getMuxClient(): Mux {
    const tokenId = process.env.MUX_TOKEN_ID
    const tokenSecret = process.env.MUX_TOKEN_SECRET

    if (!tokenId || !tokenSecret) {
        throw new Error('MUX_TOKEN_ID ou MUX_TOKEN_SECRET não configurados nas variáveis de ambiente')
    }

    return new Mux({ tokenId, tokenSecret })
}

// ─── Rota POST ────────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
    try {
        // ── 1. Autenticação ───────────────────────────────────────────────────
        // Extrai e verifica o Firebase ID Token enviado no header Authorization
        const authHeader = request.headers.get('Authorization')
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json(
                { error: 'Não autorizado: token ausente' },
                { status: 401 }
            )
        }

        const idToken = authHeader.split('Bearer ')[1]
        let uid: string

        try {
            const decoded = await adminAuth.verifyIdToken(idToken)
            uid = decoded.uid
        } catch {
            return NextResponse.json(
                { error: 'Não autorizado: token inválido ou expirado' },
                { status: 401 }
            )
        }

        // ── 2. Validação do payload ───────────────────────────────────────────
        const body = await request.json() as VideoAuthRequest
        const { cursoId, playbackId } = body

        if (!cursoId || !playbackId) {
            return NextResponse.json(
                { error: 'Payload inválido: cursoId e playbackId são obrigatórios' },
                { status: 400 }
            )
        }

        // ── 3. Validação de Compra (Firestore) ───────────────────────────────
        // Busca o perfil do usuário e verifica se o cursoId está em cursos_comprados.
        // Esta é a trava de segurança principal: sem compra, sem token.
        const profileDoc = await adminDb.collection('profiles').doc(uid).get()

        if (!profileDoc.exists) {
            return NextResponse.json(
                { error: 'Perfil de usuário não encontrado' },
                { status: 404 }
            )
        }

        const profileData = profileDoc.data()
        const cursos_comprados: string[] = profileData?.cursos_comprados ?? []

        if (!cursos_comprados.includes(cursoId)) {
            console.warn(`Mux Auth: Usuário ${uid} tentou acessar curso ${cursoId} sem ter comprado.`)
            return NextResponse.json(
                { error: 'Acesso negado: você não adquiriu este curso' },
                { status: 403 }
            )
        }

        // ── 4. Geração do Token Mux (JWT assinado) ───────────────────────────
        // Assina o token de reprodução para o playbackId especificado.
        // expiration: 21600 segundos = 6 horas
        // type: 'video' → token de reprodução de vídeo
        const mux = getMuxClient()
        const token = await mux.jwt.signPlaybackId(playbackId, {
            type: 'video',
            expiration: '6h',
            params: {
                // Vincula o token ao usuário solicitante para auditoria
                sub: uid,
            },
        })

        console.log(`Mux Auth: Token gerado para usuário ${uid}, curso ${cursoId}, playbackId ${playbackId}`)

        // ── 5. Retorno ────────────────────────────────────────────────────────
        return NextResponse.json({ token }, { status: 200 })

    } catch (error) {
        console.error('Mux Auth: Erro ao gerar token de reprodução:', error)
        return NextResponse.json(
            { error: 'Erro interno ao gerar token de vídeo' },
            { status: 500 }
        )
    }
}
