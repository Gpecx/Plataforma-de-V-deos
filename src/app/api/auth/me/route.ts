export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { adminAuth, adminDb } from '@/lib/firebase-admin'

export async function GET() {
    try {
        const { cookies } = await import('next/headers')
        const cookieStore = await cookies()
        const sessionCookie = cookieStore.get('session')?.value

        if (!sessionCookie) {
            return NextResponse.json({ error: 'No session' }, { status: 401 })
        }

        const decodedToken = await adminAuth.verifySessionCookie(sessionCookie, true)
        const { uid, email } = decodedToken

        const userRecord = await adminAuth.getUser(uid)

        const profileDoc = await adminDb.collection('profiles').doc(uid).get()
        const profileData = profileDoc.exists ? profileDoc.data() : null

        if (profileData?.ativo === false || (profileData?.role === 'teacher' && profileData?.teacher_status === 'banned')) {
            return NextResponse.json({ error: 'ACCOUNT_SUSPENDED' }, { status: 403 })
        }

        return NextResponse.json({
            uid,
            email,
            emailVerified: userRecord.emailVerified || false,
            role: decodedToken.role || profileData?.role || 'student',
            profile: profileData || null,
        })
    } catch (error) {
        console.error('[/api/auth/me] Error:', error)
        return NextResponse.json({ error: 'Invalid session' }, { status: 401 })
    }
}
