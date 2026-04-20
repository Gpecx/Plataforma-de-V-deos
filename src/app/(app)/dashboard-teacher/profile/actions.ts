'use server'

import { adminDb } from '@/lib/firebase-admin'
import { getServerSession } from '@/lib/auth-utils'
import { revalidatePath } from 'next/cache'

export async function updateTeacherProfile(data: any) {
    const session = await getServerSession()
    if (!session || (session.role !== 'teacher' && session.role !== 'admin')) {
        throw new Error('Não autorizado')
    }

    try {
        const updateData: Record<string, any> = {
            full_name: data.full_name,
            specialty: data.specialty,
            bio: data.bio,
            avatar_url: data.avatar_url,
            linkedin: data.linkedin,
            website: data.website,
            twitter: data.twitter,
            youtube: data.youtube,
            updated_at: new Date().toISOString()
        }

        await adminDb.collection('profiles').doc(session.uid).update(updateData)
        return { success: true }
    } catch (error) {
        console.error("Erro ao atualizar perfil do professor", error)
        throw new Error("Erro ao salvar o perfil")
    }
}

export async function getTeacherProfile() {
    const session = await getServerSession()
    if (!session || (session.role !== 'teacher' && session.role !== 'admin')) {
        return { success: false, error: 'Não autorizado' }
    }

    try {
        const profileDoc = await adminDb.collection('profiles').doc(session.uid).get()
        const data = profileDoc.data()
        if (!data) return { success: true, data: null }

        const plainData = Object.fromEntries(
            Object.entries(data).map(([key, value]) => {
                if (value && typeof value === 'object' && typeof (value as any).toDate === 'function') {
                    return [key, (value as any).toDate().toISOString()]
                }
                return [key, value]
            })
        )

        return { success: true, data: plainData }
    } catch (error) {
        return { success: false, error: 'Erro ao buscar perfil' }
    }
}

export async function updateTeacherSettings(data: any) {
    const session = await getServerSession()
    if (!session || (session.role !== 'teacher' && session.role !== 'admin')) {
        throw new Error('Não autorizado')
    }

    try {
        const updateData: Record<string, any> = {
            pix_key: data.pix_key,
            updated_at: new Date().toISOString()
        }

        if (data.cep) updateData.cep = data.cep
        if (data.logradouro) updateData.logradouro = data.logradouro
        if (data.numero) updateData.numero = data.numero
        if (data.bairro) updateData.bairro = data.bairro
        if (data.cidade) updateData.cidade = data.cidade
        if (data.estado) updateData.estado = data.estado

        await adminDb.collection('profiles').doc(session.uid).set(updateData, { merge: true })

        revalidatePath('/dashboard-teacher/settings')
        return { success: true }
    } catch (error) {
        console.error("Erro ao atualizar configurações do professor", error)
        throw new Error("Erro ao salvar configurações")
    }
}
