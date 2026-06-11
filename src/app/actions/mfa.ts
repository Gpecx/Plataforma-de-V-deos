'use server'
import { cookies } from 'next/headers'

const MFA_TRUSTED_MAX_AGE = 30 * 24 * 60 * 60

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

export async function setMfaTrustedCookie(email: string) {
    const cookieStore = await cookies()
    if (email) {
        cookieStore.set('mfa_trusted', email, {
            path: '/',
            maxAge: MFA_TRUSTED_MAX_AGE,
            sameSite: 'strict',
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
        })
    } else {
        cookieStore.set('mfa_trusted', '', {
            path: '/',
            maxAge: 0,
            sameSite: 'strict',
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
        })
    }
}

export async function checkMfaTrusted(email: string): Promise<boolean> {
    const cookieStore = await cookies()
    const storedEmail = cookieStore.get('mfa_trusted')?.value

    if (!storedEmail || storedEmail !== email) {
        if (storedEmail) {
            cookieStore.set('mfa_trusted', '', {
                path: '/',
                maxAge: 0,
                sameSite: 'strict',
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
            })
        }
        return false
    }

    return true
}
