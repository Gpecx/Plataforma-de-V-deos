'use server'

import { cookies } from 'next/headers'
import { adminAuth, adminDb } from '@/lib/firebase-admin'

export async function getSessionUser() {
    const cookieStore = await cookies()
    const token = cookieStore.get('session')?.value

    if (!token) return null

    try {
        const decodedToken = await adminAuth.verifySessionCookie(token, true)
        const uid = decodedToken.uid
        const tokenRole = decodedToken.role

        const profileDoc = await adminDb.collection('profiles').doc(uid).get()
        const profileData = profileDoc.data()

        const activeRole = tokenRole || profileData?.role || 'student'

        return {
            uid: uid,
            email: decodedToken.email,
            role: activeRole
        }
    } catch (error) {
        console.error('getSessionUser Error:', error)
        return null
    }
}

export async function removeSessionCookie() {
    const cookieStore = await cookies()
    cookieStore.delete('session')
    cookieStore.delete('active_session_id')
    // Also clean up any legacy firebase-token cookies
    cookieStore.delete('firebase-token')
}
