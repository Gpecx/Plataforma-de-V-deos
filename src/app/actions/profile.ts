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
            avatar_url: data?.avatar_url || null
        }
    } catch (error) {
        console.error('Erro ao buscar perfil público:', error)
        return null
    }
}
