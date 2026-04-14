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
        // ── 1. Autenticação (Token ou Sessão) ──────────────────────────────────
        let uid: string | undefined

        // Tenta pegar pelo header Authorization (ID Token)
        const authHeader = request.headers.get('Authorization')
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const idToken = authHeader.split('Bearer ')[1]
            try {
                const decoded = await adminAuth.verifyIdToken(idToken)
                uid = decoded.uid
            } catch (err) {
                console.warn('Mux Auth: ID Token inválido, tentando sessão...')
            }
        }

        // Se não pegou pelo token, tenta pelo cookie de sessão
        if (!uid) {
            const sessionCookie = request.cookies.get('session')?.value
            if (sessionCookie) {
                try {
                    const decodedSession = await adminAuth.verifySessionCookie(sessionCookie, true)
                    uid = decodedSession.uid
                } catch (err) {
                    console.warn('Mux Auth: Sessão inválida.')
                }
            }
        }

        if (!uid) {
            console.warn('Mux Auth: Usuário não identificado por Token ou Sessão.')
            return NextResponse.json(
                { error: 'Não autorizado: usuário não identificado' },
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

        // d) Busca na coleção de enrollments (fonte de verdade para matrículas manuais)
        let hasEnrollment = false
        if (!hasPurchased && !isAdmin && !isAuthor) {
            const enrollmentsSnapshot = await adminDb.collection('enrollments')
                .where('user_id', '==', uid)
                .where('course_id', '==', cursoId)
                .limit(1) // Otimização para busca rápida
                .get()
            hasEnrollment = !enrollmentsSnapshot.empty
        }

        // LOG DE DEPURAÇÃO PARA ALUNOS
        console.log(`[MUX AUTH] Solicitação de vídeo por usuário: ${uid} | Perfil: ${profileData?.role} | Curso: ${cursoId}`)
        console.log(`[MUX AUTH] Stats: isAdmin=${isAdmin}, isAuthor=${isAuthor}, hasPurchased=${hasPurchased}, hasEnrollment=${hasEnrollment}`)
        
        if (!hasPurchased && !hasEnrollment) {
            console.log(`[MUX AUTH] Cursos liberados para este usuário no perfil:`, cursos_comprados)
        }

        if (!isAdmin && !isAuthor && !hasPurchased && !hasEnrollment) {
            console.warn(`[MUX AUTH] ACESSO NEGADO: Usuário ${uid} tentou acessar curso ${cursoId} sem permissão (Perfil ou Enrollment).`)
            return NextResponse.json(
                { error: 'Acesso negado: você não tem permissão para ver este conteúdo' },
                { status: 403 }
            )
        }

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
