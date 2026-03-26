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

        if (enrollmentSnapshot.empty) {
            return { success: false, error: 'Você precisa ter adquirido este curso para avaliá-lo.' }
        }

        // Busca dados do curso para obter o teacher_id
        const courseDoc = await adminDb.collection('courses').doc(courseId).get()
        const courseData = courseDoc.data()

        if (!courseData) {
            return { success: false, error: 'Curso não encontrado.' }
        }

        // Verifica se já existe avaliação deste usuário para este curso
        const existingEvalSnapshot = await adminDb.collection('evaluations')
            .where('course_id', '==', courseId)
            .where('student_id', '==', user.uid)
            .get()

        if (!existingEvalSnapshot.empty) {
            // Atualiza avaliação existente
            const existingEvalDoc = existingEvalSnapshot.docs[0]
            await adminDb.collection('evaluations').doc(existingEvalDoc.id).update({
                rating,
                comment: comment || '',
                updated_at: new Date()
            })
        } else {
            // Cria nova avaliação
            await adminDb.collection('evaluations').add({
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

export async function getTeacherRating(teacherId: string) {
    try {
        const evaluationsSnapshot = await adminDb.collection('evaluations')
            .where('teacher_id', '==', teacherId)
            .get()

        if (evaluationsSnapshot.empty) {
            return { success: true, rating: 0, count: 0 }
        }

        const evaluations = evaluationsSnapshot.docs.map(doc => doc.data())
        const totalRating = evaluations.reduce((sum: number, e: any) => sum + (e.rating || 0), 0)
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