'use server'
import { cookies } from 'next/headers'

export async function setMfaCookie(pending: boolean) {
    const cookieStore = await cookies()
    if (pending) {
        cookieStore.set('mfa_pending', 'true', {
            path: '/',
            maxAge: 3600,
            sameSite: 'lax',
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
        })
    } else {
        cookieStore.set('mfa_pending', '', {
            path: '/',
            maxAge: 0,
            sameSite: 'lax',
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
        })
    }
}
