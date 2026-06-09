"use server"

import { adminAuth, adminDb } from "@/lib/firebase-admin"
import { FieldValue } from "firebase-admin/firestore"
import { cookies } from "next/headers"

export async function deleteAccount() {
    const cookieStore = cookies()
    const token = (await cookieStore).get('session')?.value

    if (!token) {
        return { success: false, error: "Não autorizado" }
    }

    let decodedToken
    try {
        decodedToken = await adminAuth.verifySessionCookie(token, true)
    } catch (error) {
        return { success: false, error: "Token inválido" }
    }

    const uid = decodedToken.uid

    try {
        // 1. Deletar matrículas (enrollments) do próprio usuário (se ele comprou cursos)
        const enrollmentsSnapshot = await adminDb.collection('enrollments')
            .where('user_id', '==', uid)
            .get()

        const batch = adminDb.batch()
        enrollmentsSnapshot.docs.forEach(doc => {
            batch.delete(doc.ref)
        })

        // ====== LÓGICA DO PROFESSOR ======
        // 1. Buscar todos os cursos do professor
        const coursesSnapshot = await adminDb.collection('courses')
            .where('teacher_id', '==', uid)
            .get()

        if (!coursesSnapshot.empty) {
            // Importar utilitário do Mux somente se necessário
            const { deleteMuxAsset } = await import('@/app/actions/mux')
            const now = new Date()

            for (const courseDoc of coursesSnapshot.docs) {
                const courseId = courseDoc.id
                const courseData = courseDoc.data()

                // 2. Classificar o curso
                const courseEnrollmentsSnap = await adminDb.collection('enrollments')
                    .where('course_id', '==', courseId)
                    .where('payment_confirmed', '==', true)
                    .get()

                const hasValidEnrollment = courseEnrollmentsSnap.docs.some(eDoc => {
                    const eData = eDoc.data()
                    if (!eData.expiresAt) return false
                    const expiresAt = eData.expiresAt.toDate ? eData.expiresAt.toDate() : new Date(eData.expiresAt)
                    return expiresAt > now
                })

                if (hasValidEnrollment) {
                    // 4. Para cursos a ARQUIVAR
                    batch.update(courseDoc.ref, {
                        status: 'ARCHIVED',
                        teacher_deleted: true,
                        updated_at: new Date()
                    })
                } else {
                    // 3. Para cursos a DELETAR
                    const lessonsSnapshot = await adminDb.collection('lessons')
                        .where('course_id', '==', courseId)
                        .get()

                    // b. Deletar assets Mux das lessons
                    for (const lessonDoc of lessonsSnapshot.docs) {
                        const lessonData = lessonDoc.data()
                        if (lessonData.mux_asset_id) {
                            await deleteMuxAsset(lessonData.mux_asset_id).catch(err => console.error(`Erro Mux (lesson):`, err))
                        }
                        // d. Montar batch: deletar lessons
                        batch.delete(lessonDoc.ref)
                    }

                    // c. Deletar asset Mux do trailer do curso
                    if (courseData.intro_video_asset_id) {
                        await deleteMuxAsset(courseData.intro_video_asset_id).catch(err => console.error(`Erro Mux (trailer):`, err))
                    }

                    // d. Montar batch: deletar course
                    batch.delete(courseDoc.ref)
                }
            }
        }
        // ====== FIM LÓGICA DO PROFESSOR ======

        // 6. Deletar documento de perfil
        batch.delete(adminDb.collection('profiles').doc(uid))

        // 5. Executar batch de deleção no Firestore (único commit para todas as operações)
        await batch.commit()

        // 7. Deletar usuário do Firebase Auth
        await adminAuth.deleteUser(uid)

        // 4.5. LGPD (direito ao esquecimento): anonimizar conteúdo vinculável que
        // permanece em coleções compartilhadas (mensagens e comentários). Não
        // deletamos os documentos para não quebrar threads de terceiros — apenas
        // removemos o vínculo com a pessoa. Falha aqui não reverte a exclusão
        // (conta e perfil já foram removidos), então isolamos num try/catch.
        try {
            const [messagesAsUser, messagesAsTeacher, comments] = await Promise.all([
                adminDb.collection('messages').where('user_id', '==', uid).get(),
                adminDb.collection('messages').where('teacher_id', '==', uid).get(),
                adminDb.collection('comments').where('userId', '==', uid).get(),
            ])

            const updates: { ref: any; data: any }[] = []
            messagesAsUser.docs.forEach(doc => updates.push({
                ref: doc.ref,
                data: { user_id: 'deleted_user', sender_name: FieldValue.delete(), display_name: FieldValue.delete() },
            }))
            messagesAsTeacher.docs.forEach(doc => updates.push({
                ref: doc.ref,
                data: { teacher_id: 'deleted_user' },
            }))
            comments.docs.forEach(doc => updates.push({
                ref: doc.ref,
                data: { userId: 'deleted_user', userName: 'Usuário removido' },
            }))

            // Commit em lotes de 400 (limite do Firestore é 500 operações/batch).
            for (let i = 0; i < updates.length; i += 400) {
                const anonBatch = adminDb.batch()
                updates.slice(i, i + 400).forEach(u => anonBatch.update(u.ref, u.data))
                await anonBatch.commit()
            }
        } catch (anonError) {
            console.error('[deleteAccount] Falha ao anonimizar mensagens/comentários:', anonError instanceof Error ? anonError.message : anonError)
        }

        // 5. Limpar cookies
        const responseCookies = await cookies()
        responseCookies.delete('session')
        responseCookies.delete('active_session_id')

    } catch (error: any) {
        console.error("Erro ao deletar conta:", error)
        return { success: false, error: error.message || "Erro desconhecido ao deletar conta" }
    }

    // Sucesso: retorna para o cliente concluir a limpeza de sessão client-side
    // (signOut do Firebase Auth + stores) antes de navegar para /login.
    return { success: true }
}
