'use server'

import { adminAuth, adminDb } from '@/lib/firebase-admin'

interface CreateProfileData {
    uid: string
    email: string
    full_name: string
    cpf_cnpj: string
    person_type: 'CPF' | 'CNPJ'
    birth_date: string
    role: 'student' | 'teacher'
}

export async function createProfile(data: CreateProfileData) {
    try {
        await adminDb.collection('profiles').doc(data.uid).set({
            ...data,
            id: data.uid,
            created_at: new Date()
        })
        return { success: true }
    } catch (error) {
        console.error('Error creating profile:', error)
        try {
            await adminAuth.deleteUser(data.uid)
            console.log(`User ${data.uid} deleted from Auth due to profile creation failure.`)
        } catch (authError) {
            console.error('Failed to delete orphaned user from Auth:', authError)
        }
        return { success: false, error: 'Erro ao criar perfil. Tente novamente.' }
    }
}
