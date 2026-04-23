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

export async function updateTeacherSettings(prevState: any, formData: FormData) {
    const session = await getServerSession()
    if (!session || (session.role !== 'teacher' && session.role !== 'admin')) {
        return { success: false, error: 'Não autorizado' }
    }

    try {
        const pixKey = formData.get('pix_key') as string
        const cep = formData.get('cep') as string
        const logradouro = formData.get('logradouro') as string
        const numero = formData.get('numero') as string
        const bairro = formData.get('bairro') as string
        const cidade = formData.get('cidade') as string
        const estado = formData.get('estado') as string
        const notifications_email = formData.get('notifications_email') === 'on'
        const notifications_push = formData.get('notifications_push') === 'on'

        const updateData: Record<string, any> = {
            updated_at: new Date().toISOString(),
            notifications_email,
            notifications_push
        }

        if (pixKey) updateData.pix_key = pixKey
        if (cep) updateData.cep = cep
        if (logradouro) updateData.logradouro = logradouro
        if (numero) updateData.numero = numero
        if (bairro) updateData.bairro = bairro
        if (cidade) updateData.cidade = cidade
        if (estado) updateData.estado = estado

        await adminDb.collection('profiles').doc(session.uid).set(updateData, { merge: true })

        revalidatePath('/dashboard-teacher/settings')
        return { success: true }
    } catch (error) {
        console.error("Erro ao atualizar configurações do professor", error)
        return { success: false, error: 'Erro ao salvar configurações' }
    }
}
