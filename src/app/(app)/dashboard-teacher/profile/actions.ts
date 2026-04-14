'use server'

import { adminDb } from '@/lib/firebase-admin'
import { getServerSession } from '@/lib/auth-utils'

export async function updateTeacherProfile(data: any) {
    const session = await getServerSession()
    if (!session || (session.role !== 'teacher' && session.role !== 'admin')) {
        throw new Error('Não autorizado')
    }

    try {
        await adminDb.collection('profiles').doc(session.uid).update({
            full_name: data.full_name,
            specialty: data.specialty,
            bio: data.bio,
            avatar_url: data.avatar_url,
            linkedin: data.linkedin,
            website: data.website,
            twitter: data.twitter,
            youtube: data.youtube,
            updated_at: new Date().toISOString()
        })
        return { success: true }
    } catch (error) {
        console.error("Erro ao atualizar perfil do professor", error)
        throw new Error("Erro ao salvar o perfil")
    }
}
