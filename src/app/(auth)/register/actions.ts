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
    // Novos campos de endereço
    cep?: string
    rua?: string
    numero?: string
    complemento?: string
    bairro?: string
    cidade?: string
    estado?: string
}

function sanitize(value: string): string {
    return value.replace(/\D/g, '')
}

export async function getAddressByCep(cep: string) {
    const cleanCep = sanitize(cep)
    if (cleanCep.length !== 8) return { success: false, error: 'CEP inválido' }

    try {
        const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`)
        const data = await response.json()

        if (data.erro) {
            return { success: false, error: 'CEP não encontrado' }
        }

        return {
            success: true,
            data: {
                rua: data.logradouro,
                bairro: data.bairro,
                cidade: data.localidade,
                estado: data.uf
            }
        }
    } catch (error) {
        console.error('ViaCEP Error:', error)
        return { success: false, error: 'Erro ao consultar CEP. Preencha manualmente.' }
    }
}

export async function createProfile(data: CreateProfileData) {
    try {
        const sanitizedCpfCnpj = sanitize(data.cpf_cnpj)
        const sanitizedCep = data.cep ? sanitize(data.cep) : undefined

        await adminDb.collection('profiles').doc(data.uid).set({
            ...data,
            cpf_cnpj: sanitizedCpfCnpj,
            cep: sanitizedCep,
            id: data.uid,
            mfaEnabled: true, // Padronização PowerPlay: MFA Ativado por padrão
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
