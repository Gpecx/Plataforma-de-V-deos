'use server'

import { headers } from 'next/headers'
import { adminAuth, adminDb } from '@/lib/firebase-admin'

interface CreateProfileData {
    uid: string
    email: string
    full_name: string
    phone: string // Novo campo
    cpf_cnpj: string
    person_type: 'CPF' | 'CNPJ'
    birth_date: string
    role: 'student' | 'teacher'
    cep?: string
    rua?: string
    numero?: string
    complemento?: string
    bairro?: string
    cidade?: string
    estado?: string
    razao_social?: string
    username?: string
    teacher_application_data?: any
    terms_accepted?: boolean
}

async function getClientIp(): Promise<string> {
    const headersList = await headers()
    const forwarded = headersList.get('x-forwarded-for')
    if (forwarded) {
        return forwarded.split(',')[0].trim()
    }
    return headersList.get('x-real-ip') || 'unknown'
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

export async function getDataByCnpj(cnpj: string) {
    const cleanCnpj = sanitize(cnpj)
    if (cleanCnpj.length !== 14) return { success: false, error: 'CNPJ inválido' }

    try {
        const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cleanCnpj}`)
        
        if (!response.ok) {
            if (response.status === 404) return { success: false, error: 'CNPJ não encontrado' }
            return { success: false, error: 'Erro na BrasilAPI' }
        }

        const data = await response.json()

        return {
            success: true,
            data: {
                razao_social: data.razao_social || data.nome_fantasia || '',
                cep: data.cep,
                logradouro: data.logradouro,
                numero: data.numero,
                complemento: data.complemento,
                bairro: data.bairro,
                municipio: data.municipio,
                uf: data.uf
            }
        }
    } catch (error) {
        console.error('BrasilAPI Error:', error)
        return { success: false, error: 'Erro ao consultar CNPJ. Preencha manualmente.' }
    }
}

export async function checkUsernameAvailability(username: string) {
    try {
        const snapshot = await adminDb.collection('profiles')
            .where('username', '==', username.toLowerCase())
            .limit(1)
            .get()
        
        return { 
            success: true, 
            available: snapshot.empty 
        }
    } catch (error) {
        console.error('Check username error:', error)
        return { success: false, error: 'Erro ao validar ID' }
    }
}

export async function createProfile(data: CreateProfileData) {
    try {
        const sanitizedCpfCnpj = sanitize(data.cpf_cnpj)
        const sanitizedCep = data.cep ? sanitize(data.cep) : undefined
        const sanitizedPhone = sanitize(data.phone)

        // Verificação obrigatória de unicidade do username no backend
        if (data.username) {
            const usernameLower = data.username.toLowerCase()
            const existing = await adminDb.collection('profiles')
                .where('username', '==', usernameLower)
                .limit(1)
                .get()
            
            if (!existing.empty) {
                return { success: false, error: 'Este ID público já está em uso.' }
            }
        }

        const payload: any = {
            ...data,
            cpf_cnpj: sanitizedCpfCnpj,
            cep: sanitizedCep,
            phone: sanitizedPhone,
            id: data.uid,
            mfaEnabled: true,
            created_at: new Date(),
            teacher_status: data.role === 'teacher' ? 'active' : undefined
        }

        // Consent Log (LGPD)
        if (data.terms_accepted) {
            const ipAddress = await getClientIp()
            payload.consent_log = {
                accepted_at: new Date().toISOString(),
                ip_address: ipAddress,
                version: 'v1.0',
                form_source: 'registration_page'
            }
        }

        // Firestore nao aceita undefined
        Object.keys(payload).forEach(key => {
            if (payload[key] === undefined) {
                delete payload[key]
            }
        })

        await adminDb.collection('profiles').doc(data.uid).set(payload)
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
