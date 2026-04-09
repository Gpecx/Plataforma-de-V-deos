'use server'

import { cookies } from 'next/headers'
import { adminAuth } from '@/lib/firebase-admin'

export async function refreshSession() {
    const cookieStore = await cookies()
    const token = cookieStore.get('session')?.value

    if (!token) {
        return { success: false, error: 'Sessão não encontrada' }
    }

    try {
        const decodedToken = await adminAuth.verifySessionCookie(token, true)
        
        return {
            success: true,
            emailVerified: decodedToken.emailVerified
        }
    } catch (error) {
        console.error('refreshSession error:', error)
        return { success: false, error: 'Erro ao atualizar sessão' }
    }
}