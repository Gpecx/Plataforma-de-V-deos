'use server'

import { adminDb } from '@/lib/firebase-admin'
import { parseFirebaseDate } from '@/lib/date-utils'

/**
 * Busca o perfil público de um instrutor
 */
export async function getInstructorProfile(instructorId: string) {
    if (!instructorId) return null

    try {
        const profileDoc = await adminDb.collection('profiles').doc(instructorId).get()
        if (!profileDoc.exists) return null

        const data = profileDoc.data()
        // Verifica se é realmente um instrutor ou admin
        if (data?.role !== 'teacher' && data?.role !== 'admin') return null

        return {
            id: instructorId,
            full_name: data?.full_name || 'Instrutor',
            role: data?.role,
            avatar_url: data?.avatar_url || null,
            bio: data?.bio || 'Este instrutor ainda não adicionou uma biografia.',
            specialty: data?.specialty || 'Especialista PowerPlay',
            social: {
                linkedin: data?.linkedin || null,
                twitter: data?.twitter || null,
                website: data?.website || null,
                youtube: data?.youtube || null
            }
        }
    } catch (error) {
        console.error('getInstructorProfile Error:', error)
        return null
    }
}

/**
 * Busca estatísticas agregadas do instrutor
 */
export async function getInstructorStats(instructorId: string) {
    try {
        // 1. Busca todos os IDs de cursos deste instrutor
        const coursesSnap = await adminDb.collection('courses')
            .where('teacher_id', '==', instructorId)
            .select('id')
            .get()
        
        const courseIds = coursesSnap.docs.map(doc => doc.id)
        const totalCourses = courseIds.length

        if (totalCourses === 0) {
            return { totalStudents: 0, totalReviews: 0, totalCourses: 0, averageRating: 0 }
        }

        // 2. Calcula total de alunos (enrollments)
        // Nota: O Firebase tem limite de 30 no 'in' operator. 
        // Se houverem muitos cursos, precisaremos de múltiplas queries ou outra estratégia.
        // Para este MVP, vamos assumir que o professor não tem centenas de cursos ou fracionar.
        
        let totalStudents = 0
        // Fracionando se necessário (limite do 'in' é 30)
        for (let i = 0; i < courseIds.length; i += 30) {
            const chunk = courseIds.slice(i, i + 30)
            const enrollmentsSnap = await adminDb.collection('enrollments')
                .where('course_id', 'in', chunk)
                .count()
                .get()
            totalStudents += enrollmentsSnap.data().count
        }

        // 3. Avaliações (Mock/Future-proofing)
        // Como o sistema ainda não tem coleção de reviews robusta, retornamos valores base
        const averageRating = 4.8 // Base PowerPlay

        return {
            totalStudents,
            totalReviews: Math.floor(totalStudents * 0.4), // Estimativa de 40% de reviews
            totalCourses,
            averageRating
        }
    } catch (error) {
        console.error('getInstructorStats Error:', error)
        return { totalStudents: 0, totalReviews: 0, totalCourses: 0, averageRating: 0 }
    }
}

/**
 * Busca cursos do instrutor com paginação
 */
export async function getInstructorCourses(instructorId: string, limitCount: number = 10, lastDocId?: string) {
    try {
        let query = adminDb.collection('courses')
            .where('teacher_id', '==', instructorId)
            .where('status', '==', 'published')
            .orderBy('created_at', 'desc')
            .limit(limitCount)

        if (lastDocId) {
            const lastDoc = await adminDb.collection('courses').doc(lastDocId).get()
            if (lastDoc.exists) {
                query = query.startAfter(lastDoc)
            }
        }

        const snapshot = await query.get()
        
        const courses = snapshot.docs.map(doc => {
            const data = doc.data()
            return {
                id: doc.id,
                title: data.title,
                subtitle: data.subtitle,
                price: data.price,
                image_url: data.image_url,
                category: data.category,
                tag: data.tag,
                created_at: parseFirebaseDate(data.created_at)?.toISOString()
            }
        })

        const lastId = snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1].id : null
        const hasMore = snapshot.docs.length === limitCount

        return { courses, lastId, hasMore }
    } catch (error) {
        console.error('getInstructorCourses Error:', error)
        return { courses: [], lastId: null, hasMore: false }
    }
}
