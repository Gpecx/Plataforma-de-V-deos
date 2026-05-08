'use server'

import { adminAuth, adminDb } from '@/lib/firebase-admin'
import { getSessionUser } from '@/app/actions/auth'
import { revalidatePath } from 'next/cache'

/**
 * Cria um novo administrador do zero.
 * Apenas administradores podem realizar esta ação.
 */
export async function createAdminUser(formData: {
    fullName: string
    email: string
    password?: string
}) {
    try {
        const session = await getSessionUser()
        if (!session || session.role !== 'admin') {
            return { success: false, error: 'Não autorizado. Apenas administradores podem criar novos admins.' }
        }

        const { fullName, email, password } = formData

        if (!fullName || !email) {
            return { success: false, error: 'Nome e E-mail são obrigatórios.' }
        }

        // 1. Criar usuário no Firebase Auth
        // Se a senha não for fornecida, usamos uma temporária ou geramos uma.
        // O requisito pede Senha Temporária.
        const authUser = await adminAuth.createUser({
            email,
            password: password || 'Mudar@123',
            displayName: fullName,
            emailVerified: true
        })

        // 2. Definir Role como ADMIN nos Custom Claims
        await adminAuth.setCustomUserClaims(authUser.uid, { role: 'admin' })

        // 3. Criar documento do perfil no Firestore (coleção profiles)
        await adminDb.collection('profiles').doc(authUser.uid).set({
            uid: authUser.uid,
            full_name: fullName,
            email: email,
            role: 'admin',
            mfaEnabled: true, // Padronizado conforme solicitado
            ativo: true,
            created_at: new Date(),
            updated_at: new Date(),
            created_by: session.uid
        })

        revalidatePath('/admin/management')
        
        return { 
            success: true, 
            message: `Administrador ${fullName} criado com sucesso!` 
        }
    } catch (error: any) {
        console.error('[createAdminUser] Erro ao criar admin:', error)
        if (error.code === 'auth/email-already-exists') {
            return { success: false, error: 'Este e-mail já está em uso.' }
        }
        return { success: false, error: error.message || 'Erro interno ao criar administrador.' }
    }
}

/**
 * Lista todos os administradores.
 */
export async function getAdmins() {
    try {
        const session = await getSessionUser()
        if (!session || session.role !== 'admin') {
            throw new Error('Não autorizado')
        }

        const adminsSnap = await adminDb.collection('profiles')
            .where('role', '==', 'admin')
            .get()

        const admins = adminsSnap.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            created_at: doc.data().created_at?.toDate ? doc.data().created_at.toDate().toISOString() : null
        }))

        return JSON.parse(JSON.stringify(admins))
    } catch (error) {
        console.error('[getAdmins] Erro ao buscar admins:', error)
        return []
    }
}
