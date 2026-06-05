import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'
import { adminAuth } from '@/lib/firebase-admin'

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface VideoAuthRequest {
    cursoId: string
    playbackId: string
}

import { signMuxPlaybackToken, sanitizeKey } from '@/lib/mux'

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

        // M-01: Bloqueia acesso se o usuário estiver inativo ou banido
        if (profileData?.ativo === false) {
            console.warn(`[MUX AUTH] ACESSO NEGADO: Usuário ${uid} está inativo ou banido.`)
            return NextResponse.json(
                { error: 'Acesso negado: sua conta está inativa ou suspensa.' }, 
                { status: 403 }
            )
        }

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
            hasEnrollment = !enrollmentsSnapshot.empty && enrollmentsSnapshot.docs[0].data().status !== 'pending'
        }

        if (!isAdmin && !isAuthor && !hasPurchased && !hasEnrollment) {
            console.warn(`[MUX AUTH] ACESSO NEGADO: Usuário ${uid} tentou acessar curso ${cursoId} sem permissão (Perfil ou Enrollment).`)
            return NextResponse.json(
                { error: 'Acesso negado: você não tem permissão para ver este conteúdo' },
                { status: 403 }
            )
        }

        // ── 3.5. O playbackId PERTENCE a este curso? ──────────────────────────
        // Ter acesso ao curso A não pode liberar um vídeo do curso B. Confirmamos
        // que o playbackId é de uma aula deste cursoId OU do trailer do curso,
        // antes de assinar qualquer token. Caso contrário, um aluno legítimo de A
        // poderia obter token para vídeos de cursos que não comprou.
        const isTrailer =
            courseData?.intro_video_playback_id === playbackId
            || courseData?.pendingTrailerPlaybackId === playbackId

        let belongsToCourse = isTrailer
        if (!belongsToCourse) {
            const lessonSnap = await adminDb.collection('lessons')
                .where('course_id', '==', cursoId)
                .where('mux_playback_id', '==', playbackId)
                .limit(1)
                .get()
            belongsToCourse = !lessonSnap.empty
        }

        if (!belongsToCourse) {
            console.warn(`[MUX AUTH] ACESSO NEGADO: playbackId ${playbackId} não pertence ao curso ${cursoId} (uid ${uid}).`)
            return NextResponse.json(
                { error: 'Acesso negado: vídeo não pertence a este curso' },
                { status: 403 }
            )
        }

        // ── 4. Geração do Token Mux (JWT assinado) ───────────────────────────
        // Assina o token de reprodução usando as Signing Keys configuradas.
        const keyId = sanitizeKey(process.env.MUX_SIGNING_KEY_ID)
        const keySecret = sanitizeKey(process.env.MUX_SIGNING_KEY)

        if (!keyId || !keySecret) {
            console.error('Mux Auth: Falha na assinatura - MUX_SIGNING_KEY_ID ou MUX_SIGNING_KEY ausentes.')
            throw new Error('Configuração de segurança do Mux incompleta')
        }

        const token = await signMuxPlaybackToken(playbackId, {
            aud: 'v',     // video playback — Mux exige 'v' para playback de vídeo (não confundir com 's' de storyboard)
            keyId,
            keySecret,
            expiration: '1h',
            sub: uid,     // Identificador do usuário
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
