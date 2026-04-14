import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'
import { adminAuth } from '@/lib/firebase-admin'
// @ts-ignore - Garantir compatibilidade de tipos do Mux no build
import { Mux } from '@mux/mux-node'

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface VideoAuthRequest {
    cursoId: string
    playbackId: string
}

import { getMuxClient } from '@/lib/mux'

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

        // ── 3. Validação de Acesso (Admin, Autor ou Aluno com Compra) ─────────
        // Esta é a trava de segurança: admin sempre acessa, autor sempre acessa seu curso, 
        // e alunos só acessam se tiverem comprado.
        
        // a) Busca o perfil do usuário para checar a ROLE
        const profileDoc = await adminDb.collection('profiles').doc(uid).get()
        if (!profileDoc.exists) {
            return NextResponse.json({ error: 'Perfil não encontrado' }, { status: 404 })
        }
        const profileData = profileDoc.data()
        const isAdmin = profileData?.role === 'admin'

        // b) Busca o curso para checar a AUTORIA
        const courseDoc = await adminDb.collection('courses').doc(cursoId).get()
        if (!courseDoc.exists) {
            return NextResponse.json({ error: 'Curso não encontrado' }, { status: 404 })
        }
        const courseData = courseDoc.data()
        const isAuthor = courseData?.teacher_id === uid

        // c) Verifica permissão
        const cursos_comprados: string[] = profileData?.cursos_comprados ?? []
        const hasPurchased = cursos_comprados.includes(cursoId)

        if (!isAdmin && !isAuthor && !hasPurchased) {
            console.warn(`Mux Auth: Acesso Negado para usuário ${uid} no curso ${cursoId}`)
            return NextResponse.json(
                { error: 'Acesso negado: você não tem permissão para ver este conteúdo' },
                { status: 403 }
            )
        }

        console.log(`Mux Auth: Acesso liberado para ${uid} (Admin: ${isAdmin}, Autor: ${isAuthor}, Compra: ${hasPurchased})`)

        // ── 4. Geração do Token Mux (JWT assinado) ───────────────────────────
        // Assina o token de reprodução usando as Signing Keys configuradas.
        const mux = getMuxClient()
        
        const keyId = process.env.MUX_SIGNING_KEY_ID
        const keySecret = process.env.MUX_SIGNING_KEY

        if (!keyId || !keySecret) {
            console.error('Mux Auth: Falha na assinatura - MUX_SIGNING_KEY_ID ou MUX_SIGNING_KEY ausentes.')
            throw new Error('Configuração de segurança do Mux incompleta')
        }

        const token = await mux.jwt.signPlaybackId(playbackId, {
            keyId,
            keySecret,
            type: 'video',
            expiration: '6h',
            params: {
                sub: uid, // Identificador do usuário
            },
        })

        console.log(`Mux Auth: Token assinado gerado para ${uid} (Curso: ${cursoId})`)

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
