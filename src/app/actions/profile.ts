'use server'

import { adminDb } from '@/lib/firebase-admin'
import { getSessionUser } from '@/app/actions/auth'
import { logError } from '@/lib/logger'

export async function getPublicProfile(userId: string) {
    if (!userId) return null

    try {
        const profileDoc = await adminDb.collection('profiles').doc(userId).get()
        if (!profileDoc.exists) return null

        const data = profileDoc.data()
        // Retornamos apenas o que é público/necessário
        return {
            id: userId,
            full_name: data?.full_name || 'Usuário',
            role: data?.role || 'student',
            photoURL: data?.photoURL || data?.avatar_url || null,
            created_at: data?.created_at ? (typeof data.created_at.toDate === 'function' ? data.created_at.toDate().toISOString() : new Date(data.created_at).toISOString()) : null
        }
    } catch (error) {
        console.error('Erro ao buscar perfil público:', error)
        return null
    }
}

export async function getPurchasedCourseIds(): Promise<string[]> {
    try {
        const user = await getSessionUser()
        if (!user) return []
        const userId = user.uid

        // Buscamos na coleção de enrollments, filtrando por status válidos
        const enrollmentsSnapshot = await adminDb.collection('enrollments')
            .where('user_id', '==', userId)
            .get()

        // Filtramos apenas matrículas que NÃO estão canceladas, expiradas ou pendentes
        const purchasedIds = enrollmentsSnapshot.docs
            .map(doc => doc.data())
            .filter(data => data.status !== 'cancelled' && data.status !== 'expired' && data.status !== 'pending')
            .map(data => data.course_id)
        
        // Também verificamos o perfil para compatibilidade com dados legados
        const profileDoc = await adminDb.collection('profiles').doc(userId).get()
        if (profileDoc.exists) {
            const profileData = profileDoc.data()
            const profileIds = profileData?.cursos_comprados || []
            
            // Unificamos as listas removendo duplicatas
            return Array.from(new Set([...purchasedIds, ...profileIds]))
        }

        return purchasedIds
    } catch (error) {
        console.error('Erro ao buscar cursos comprados:', error)
        return []
    }
}

export async function getStudentPurchasedCoursesForAdmin(studentId: string): Promise<string[]> {
    try {
        const session = await getSessionUser()
        if (!session || (session.role !== 'admin' && session.role !== 'teacher')) {
            logError('UNAUTHORIZED', 'Apenas administradores ou instrutores podem consultar compras de terceiros.') // B4
            return [] // B4
        }

        if (!studentId) return []

        // Buscamos na coleção de enrollments, filtrando por status válidos
        const enrollmentsSnapshot = await adminDb.collection('enrollments')
            .where('user_id', '==', studentId)
            .get()

        // Filtramos apenas matrículas que NÃO estão canceladas, expiradas ou pendentes
        const purchasedIds = enrollmentsSnapshot.docs
            .map(doc => doc.data())
            .filter(data => data.status !== 'cancelled' && data.status !== 'expired' && data.status !== 'pending')
            .map(data => data.course_id)

        // Courses where the student is actually enrolled (all statuses except cancelled/expired/pending)
        return purchasedIds
    } catch (error) {
        console.error('Erro ao buscar cursos comprados para administrador:', error)
        return []
    }
}

export async function getCourseByIdAdmin(courseId: string) {
    if (!courseId) return null

    try {
        const courseDoc = await adminDb.collection('courses').doc(courseId).get()
        if (!courseDoc.exists) return null

        const data = courseDoc.data()
        return {
            id: courseId,
            teacher_id: data?.teacher_id || null,
            title: data?.title || '',
            status: data?.status || '',
        }
    } catch (error) {
        console.error('Erro ao buscar curso por ID:', error)
        return null
    }
}

export async function getConfirmedStudentIdsByCourses(courseIds: string[]): Promise<string[]> {
    if (courseIds.length === 0) return []

    try {
        const CHUNK_SIZE = 30
        const results = new Set<string>()

        if (courseIds.length <= CHUNK_SIZE) {
            const snapshot = await adminDb.collection('enrollments')
                .where('course_id', 'in', courseIds)
                .where('payment_confirmed', '==', true)
                .get()
            snapshot.forEach(doc => results.add(doc.data().user_id))
        } else {
            const queries = []
            for (let i = 0; i < courseIds.length; i += CHUNK_SIZE) {
                const chunk = courseIds.slice(i, i + CHUNK_SIZE)
                queries.push(
                    adminDb.collection('enrollments')
                        .where('course_id', 'in', chunk)
                        .where('payment_confirmed', '==', true)
                        .get()
                )
            }
            const snapshots = await Promise.all(queries)
            for (const snapshot of snapshots) {
                snapshot.forEach(doc => results.add(doc.data().user_id))
            }
        }

        return Array.from(results)
    } catch (error) {
        console.error('Erro ao buscar alunos confirmados por cursos:', error)
        return []
    }
}
