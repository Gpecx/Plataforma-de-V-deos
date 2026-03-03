'use server'

import { cookies } from 'next/headers'
import { adminAuth, adminDb } from '@/lib/firebase-admin'

export async function getSessionUser() {
    const cookieStore = await cookies()
    const token = cookieStore.get('firebase-token')?.value

    if (!token) return null

    try {
        const decodedToken = await adminAuth.verifyIdToken(token)
        const uid = decodedToken.uid

        // Buscar o papel (role) no Firestore
        const profileDoc = await adminDb.collection('profiles').doc(uid).get()
        const profileData = profileDoc.data()

        return {
            uid: uid,
            email: decodedToken.email,
            role: profileData?.role || 'student'
        }
    } catch (error) {
        console.error('getSessionUser Error:', error)
        return null
    }
}

export async function setSessionCookie(idToken: string) {
    const cookieStore = await cookies()

    // Define o cookie com o ID Token do Firebase
    // Nota: Em uma implementação de produção mais robusta, você usaria 'firebase-admin' para
    // criar um Session Cookie (que pode durar até 2 semanas), mas o ID Token
    // funciona para verificação se renovado ou se a sessão for curta.
    cookieStore.set('firebase-token', idToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 5, // 5 dias
    })
}

export async function removeSessionCookie() {
    const cookieStore = await cookies()
    cookieStore.delete('firebase-token')
}
