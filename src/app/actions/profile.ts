'use server'

import { adminDb } from '@/lib/firebase-admin'

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
            photoURL: data?.photoURL || data?.avatar_url || null
        }
    } catch (error) {
        console.error('Erro ao buscar perfil público:', error)
        return null
    }
}

export async function getPurchasedCourseIds(userId: string): Promise<string[]> {
    if (!userId) return []

    try {
        // Buscamos na coleção de enrollments, filtrando por status válidos
        const enrollmentsSnapshot = await adminDb.collection('enrollments')
            .where('user_id', '==', userId)
            .get()

        // Filtramos apenas matrículas que NÃO estão canceladas ou expiradas
        const purchasedIds = enrollmentsSnapshot.docs
            .map(doc => doc.data())
            .filter(data => data.status !== 'cancelled' && data.status !== 'expired')
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
