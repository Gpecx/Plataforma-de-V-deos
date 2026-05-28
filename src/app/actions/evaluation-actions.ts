'use server'

import { adminDb } from '@/lib/firebase-admin'
import { getSessionUser } from '@/app/actions/auth'
import { revalidatePath } from 'next/cache'

export async function submitEvaluation(courseId: string, rating: number, comment?: string) {
    try {
        const user = await getSessionUser()
        if (!user || !user.uid) {
            return { success: false, error: 'Usuário não autenticado.' }
        }

        // Valida rating
        if (rating < 1 || rating > 5) {
            return { success: false, error: 'Avaliação deve ser entre 1 e 5 estrelas.' }
        }

        // Verifica se o usuário tem enrollment para o curso
        const enrollmentSnapshot = await adminDb.collection('enrollments')
            .where('user_id', '==', user.uid)
            .where('course_id', '==', courseId)
            .get()

        if (enrollmentSnapshot.empty || enrollmentSnapshot.docs[0].data().status === 'pending') {
            return { success: false, error: 'Você precisa ter adquirido este curso para avaliá-lo.' }
        }

        // Busca dados do curso para obter o teacher_id
        const courseDoc = await adminDb.collection('courses').doc(courseId).get()
        const courseData = courseDoc.data()

        if (!courseData) {
            return { success: false, error: 'Curso não encontrado.' }
        }

        // Caminho único e previsível para garantir unicidade absoluta física no banco
        const docId = `${user.uid}_${courseId}`
        const evalDocRef = adminDb.collection('evaluations').doc(docId)
        const evalDoc = await evalDocRef.get()

        if (evalDoc.exists) {
            // Atualiza avaliação existente fazendo merge
            await evalDocRef.set({
                rating,
                comment: comment || '',
                updated_at: new Date()
            }, { merge: true })
        } else {
            // Cria nova avaliação com ID único
            await evalDocRef.set({
                course_id: courseId,
                teacher_id: courseData.teacher_id,
                student_id: user.uid,
                rating,
                comment: comment || '',
                created_at: new Date(),
                updated_at: new Date()
            })
        }

        // Revalida os caminhos para atualizar os dados
        revalidatePath('/dashboard-teacher')
        revalidatePath(`/classroom/${courseId}`)

        return { success: true }
    } catch (error) {
        console.error("Error submitting evaluation:", error)
        return { success: false, error: 'Falha ao enviar avaliação.' }
    }
}

export async function getUserCourseEvaluation(courseId: string) {
    try {
        const user = await getSessionUser()
        if (!user || !user.uid) {
            return { success: false, error: 'Usuário não autenticado.' }
        }

        const docId = `${user.uid}_${courseId}`
        const evalDoc = await adminDb.collection('evaluations').doc(docId).get()

        if (evalDoc.exists) {
            const data = evalDoc.data()
            return { 
                success: true, 
                evaluation: {
                    rating: Number(data?.rating) || 0,
                    comment: data?.comment || '',
                    created_at: data?.created_at?.toDate ? data.created_at.toDate().toISOString() : null
                } 
            }
        }

        return { success: true, evaluation: null }
    } catch (error) {
        console.error("Error getting user course evaluation:", error)
        return { success: false, error: 'Falha ao buscar avaliação existente.' }
    }
}

export async function getTeacherRating(teacherId: string) {
    try {
        const evaluationsSnapshot = await adminDb.collection('evaluations')
            .where('teacher_id', '==', teacherId)
            .get()

        if (evaluationsSnapshot.empty) {
            return { success: true, rating: 0, count: 0 }
        }

        const evaluations = evaluationsSnapshot.docs.map(doc => doc.data())
        const totalRating = evaluations.reduce((sum: number, e: { rating?: number }) => sum + (e.rating || 0), 0)
        const average = totalRating / evaluations.length

        return { 
            success: true, 
            rating: Math.round(average * 10) / 10, 
            count: evaluations.length 
        }
    } catch (error) {
        console.error("Error getting teacher rating:", error)
        return { success: false, rating: 0, count: 0 }
    }
}

export async function getCourseEvaluations(courseId: string) {
    try {
        const evaluationsSnapshot = await adminDb.collection('evaluations')
            .where('course_id', '==', courseId)
            .orderBy('created_at', 'desc')
            .get()

        const evaluations = evaluationsSnapshot.docs.map(doc => {
            const data = doc.data()
            return {
                id: doc.id,
                ...data,
                created_at: data.created_at?.toDate ? data.created_at.toDate().toISOString() : null,
            }
        })

        return { success: true, evaluations }
    } catch (error) {
        console.error("Error getting course evaluations:", error)
        return { success: false, evaluations: [] }
    }
}