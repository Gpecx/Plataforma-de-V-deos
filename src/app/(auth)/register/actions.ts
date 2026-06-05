'use server'

import { headers } from 'next/headers'
import { adminAuth, adminDb } from '@/lib/firebase-admin'

interface CreateProfileData {
    idToken: string
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
    // ── 1. Autenticação: amarra a criação ao próprio usuário ──────────────────
    // O perfil ainda não tem sessão (o cookie só é criado depois, em
    // /api/auth/session). Verificamos o ID Token do Firebase Auth — emitido no
    // ato do registro client-side — para provar que quem chama é o dono do uid.
    if (!data.idToken || typeof data.idToken !== 'string') {
        return { success: false, error: 'Não autorizado' }
    }

    let uid: string
    let verifiedEmail: string | undefined
    try {
        const decoded = await adminAuth.verifyIdToken(data.idToken)
        uid = decoded.uid
        verifiedEmail = decoded.email
    } catch (authError) {
        console.warn('createProfile: ID Token inválido.', authError)
        return { success: false, error: 'Não autorizado' }
    }

    // O uid efetivo vem SEMPRE do token verificado, nunca do corpo enviado pelo cliente.
    if (data.uid && data.uid !== uid) {
        console.warn(`createProfile: uid do corpo (${data.uid}) difere do token (${uid}).`)
        return { success: false, error: 'Não autorizado' }
    }

    try {
        // ── 2. Impede sobrescrever um perfil já existente ─────────────────────
        const ref = adminDb.collection('profiles').doc(uid)
        if ((await ref.get()).exists) {
            return { success: false, error: 'Perfil já existe.' }
        }

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

        // ── 3. NUNCA confie no role do cliente. Só 'student' ou 'teacher'. ────
        // 'admin' jamais pode ser concedido pelo auto-cadastro: o role é a fonte
        // de verdade copiada para os custom claims e lida pelas firestore.rules.
        const role: 'student' | 'teacher' = data.role === 'teacher' ? 'teacher' : 'student'

        // ── 4. Whitelist explícita de campos — sem spread de { ...data } ──────
        // Campos sensíveis (role, teacher_status, cursos_comprados, mfaEnabled,
        // active_session_id, ativo, asaas_customer_id) são derivados no servidor.
        const payload: any = {
            id: uid,
            email: verifiedEmail || data.email,
            full_name: data.full_name,
            phone: sanitizedPhone,
            cpf_cnpj: sanitizedCpfCnpj,
            person_type: data.person_type,
            birth_date: data.birth_date,
            role,
            // Professor nasce 'pending' — só vira 'approved' após o admin revisar
            // (handleTeacherApproval). Antes disso o dashboard mostra o
            // TeacherStatusGuard e as actions de curso são bloqueadas no servidor.
            teacher_status: role === 'teacher' ? 'pending' : undefined,
            cursos_comprados: [],
            mfaEnabled: true,
            created_at: new Date(),
        }

        if (data.cep !== undefined) payload.cep = sanitizedCep
        if (data.rua !== undefined) payload.rua = data.rua
        if (data.numero !== undefined) payload.numero = data.numero
        if (data.complemento !== undefined) payload.complemento = data.complemento
        if (data.bairro !== undefined) payload.bairro = data.bairro
        if (data.cidade !== undefined) payload.cidade = data.cidade
        if (data.estado !== undefined) payload.estado = data.estado
        if (data.razao_social !== undefined) payload.razao_social = data.razao_social
        if (data.username !== undefined) payload.username = data.username.toLowerCase()
        if (role === 'teacher' && data.teacher_application_data !== undefined) {
            payload.teacher_application_data = data.teacher_application_data
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

        await ref.set(payload)
        return { success: true }
    } catch (error) {
        console.error('Error creating profile:', error)
        try {
            await adminAuth.deleteUser(uid)
            console.log(`User ${uid} deleted from Auth due to profile creation failure.`)
        } catch (authError) {
            console.error('Failed to delete orphaned user from Auth:', authError)
        }
        return { success: false, error: 'Erro ao criar perfil. Tente novamente.' }
    }
}
