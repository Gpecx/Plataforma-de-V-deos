'use server'

import { cookies } from 'next/headers'
import { adminAuth, adminDb } from '@/lib/firebase-admin'
import { FieldValue } from 'firebase-admin/firestore'
import { logError } from '@/lib/logger'

export async function getSessionUser() {
    const cookieStore = await cookies()
    const token = cookieStore.get('session')?.value

    if (!token) return null

    try {
        const decodedToken = await adminAuth.verifySessionCookie(token, true)
        const uid = decodedToken.uid
        const tokenRole = decodedToken.role

        const userRecord = await adminAuth.getUser(uid)

        const profileDoc = await adminDb.collection('profiles').doc(uid).get()
        const profileData = profileDoc.data()

        // Bloqueio de acesso para usuários inativos ou banidos
        if (profileData?.ativo === false || (profileData?.role === 'teacher' && profileData?.teacher_status === 'banned')) {
            console.warn(`[getSessionUser] Acesso bloqueado: Usuário ${uid} está inativo ou banido.`);
            return null;
        }

        // [Industrial Hardening]: Firestore Profile is the EXCLUSIVE source of truth for Roles.
        // This ensures that promotions/demotions are reflected immediately after the profile update.
        const activeRole = profileData?.role || 'student'

        return {
            uid: uid,
            email: decodedToken.email,
            role: activeRole,
            emailVerified: userRecord.emailVerified || false
        }
    } catch (error) {
        console.error('getSessionUser Error:', error)
        return null
    }
}

export async function removeSessionCookie() {
    try {
        const cookieStore = await cookies()
        cookieStore.set('session', '', {
            path: '/',
            maxAge: 0,
            sameSite: 'lax',
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
        })
        cookieStore.set('active_session_id', '', {
            path: '/',
            maxAge: 0,
            sameSite: 'lax',
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
        })
        cookieStore.delete('firebase-token')
    } catch (e) { logError('removeSessionCookie', e) }
}

export async function syncGoogleAuthAction(idToken: string) {
    try {
        const decodedToken = await adminAuth.verifyIdToken(idToken)
        const { uid, email, name, picture } = decodedToken

        const profileRef = adminDb.collection('profiles').doc(uid)
        const profileDoc = await profileRef.get()

        if (!profileDoc.exists) {
            const payload: Record<string, any> = {
                role: 'student',
                mfaEnabled: true,
                displayName: name || email?.split('@')[0] || 'Usuário',
                email: email || '',
                photoURL: picture || '',
                created_at: FieldValue.serverTimestamp(),
                updated_at: FieldValue.serverTimestamp(),
            }
            await profileRef.set(payload)
        }

        const role = (profileDoc.exists ? profileDoc.data()?.role : 'student') || 'student'
        return { success: true, role }
    } catch (error) {
        console.error('[syncGoogleAuthAction] Erro:', error)
        return { success: false, error: 'Falha na autenticação com Google' }
    }
}
