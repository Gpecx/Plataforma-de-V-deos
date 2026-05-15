import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify, createRemoteJWKSet } from 'jose'

// =========================================================================
// M-02: Rate Limiting System (Industrial Hardening)
// =========================================================================
const RATE_LIMIT_WINDOW = 60 * 1000 // 1 minute
const MAX_REQUESTS = 10 // Max 10 requests per window
const rateLimitMap = new Map<string, { count: number; lastReset: number }>()

function isRateLimited(ip: string): boolean {
    const now = Date.now()
    const entry = rateLimitMap.get(ip)

    if (!entry || now - entry.lastReset > RATE_LIMIT_WINDOW) {
        rateLimitMap.set(ip, { count: 1, lastReset: now })
        return false
    }

    entry.count++
    return entry.count > MAX_REQUESTS
}

// Clean up stale entries periodically to prevent memory leaks
if (typeof setInterval !== 'undefined') {
    setInterval(() => {
        const now = Date.now()
        for (const [ip, entry] of rateLimitMap.entries()) {
            if (now - entry.lastReset > RATE_LIMIT_WINDOW) {
                rateLimitMap.delete(ip)
            }
        }
    }, 5 * 60 * 1000)
}

// =========================================================================
// Auth Configuration
// =========================================================================
// Firebase Session Cookie JWKS endpoint (public keys for Session Cookies)
const FIREBASE_JWKS_URL = 'https://identitytoolkit.googleapis.com/v1/sessionCookiePublicKeys'
const FIREBASE_PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID

/**
 * Singleton instance of the Remote JWK Set.
 * Declared globally to leverage in-memory caching across requests in the Edge Runtime.
 * [Industrial Hardening]: Added timeout and cooldown durations to prevent bottlenecks.
 */
const JWKS = createRemoteJWKSet(new URL(FIREBASE_JWKS_URL), {
    timeoutDuration: 5000,   // 5 seconds timeout for fetching keys
    cooldownDuration: 30000, // Wait 30s before retrying if a fetch fails
})

// Role-restricted routes: only users with the matching role are allowed
const ROLE_RESTRICTED_ROUTES: Record<string, string[]> = {
    '/admin': ['admin'],
    '/dashboard-teacher': ['teacher', 'admin'],
    '/payouts': ['teacher', 'admin'],
}

// Routes that require any valid authenticated session
const AUTHENTICATED_ROUTES = [
    '/dashboard-student',
    '/dashboard-teacher',
    '/classroom',
    '/cart',
    '/payouts',
    '/admin',
]

// Sensitive routes that need Rate Limiting
const RATE_LIMITED_ROUTES = [
    '/api/auth',
    '/api/videos/auth',
    '/login',
    '/register'
]

interface FirebaseTokenPayload {
    uid?: string
    sub?: string
    email?: string
    role?: string
    iss?: string
    aud?: string
    exp?: number
}

/**
 * Cryptographically validates a Firebase Session Cookie in the Edge Runtime.
 * Verifies against Google's public JWKS for Firebase Session Cookies.
 */
async function verifyFirebaseSessionCookie(
    token: string
): Promise<FirebaseTokenPayload | null> {
    if (!FIREBASE_PROJECT_ID) {
        console.error('[Middleware] NEXT_PUBLIC_FIREBASE_PROJECT_ID is not set.')
        return null
    }

    try {
        const { payload } = await jwtVerify(token, JWKS, {
            issuer: `https://session.firebase.google.com/${FIREBASE_PROJECT_ID}`,
            audience: FIREBASE_PROJECT_ID,
        })

        return payload as FirebaseTokenPayload
    } catch (error: any) {
        // [Fallback Logic] Differentiate between invalid tokens and network/fetch errors
        if (error.code === 'ERR_JWKS_FETCH_FAILED' || error.code === 'ERR_JWK_SET_TIMEOUT') {
            console.error('[Middleware] Critical JWKS Fetch Failure:', error.message)
            // In case of network failure, we fail-secure (deny access) but log as a system error
            return null
        }

        // Token is expired, tampered, or invalid — deny silently
        console.warn('[Middleware] JWT verification failed:', error.message)
        return null
    }
}

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl

    // ── 1. M-02: Check Rate Limit for sensitive routes ───────────────────
    const isRateLimitedRoute = RATE_LIMITED_ROUTES.some(route => pathname.startsWith(route))
    if (isRateLimitedRoute) {
        // Extração segura de IP compatível com TypeScript e NextRequest [M-02]
        const ip = (request as any).ip || request.headers.get('x-forwarded-for')?.split(',')[0] || '127.0.0.1';
        if (isRateLimited(ip)) {
            console.warn(`[M-02] Rate limit exceeded for IP: ${ip} on route: ${pathname}`)
            return new NextResponse(
                JSON.stringify({ error: 'Muitas tentativas. Tente novamente em um minuto.' }),
                { status: 429, headers: { 'Content-Type': 'application/json' } }
            )
        }
    }

    // ── 2. Authenticated Route Handling ──────────────────────────────────
    const isProtectedRoute = AUTHENTICATED_ROUTES.some((route) =>
        pathname.startsWith(route)
    )

    if (!isProtectedRoute) {
        return NextResponse.next()
    }

    // Block users stuck in MFA flow immediately
    const isMfaPending = request.cookies.get('mfa_pending')?.value === 'true'
    if (isMfaPending) {
        return redirectToLogin(request, pathname)
    }

    const sessionCookie = request.cookies.get('session')?.value

    // Fail secure: no cookie → redirect to login
    if (!sessionCookie) {
        return redirectToLogin(request, pathname)
    }

    // Cryptographic validation — existence alone is not sufficient
    const payload = await verifyFirebaseSessionCookie(sessionCookie)

    if (payload) {
        console.log(`[Auth Middleware] User UID: ${payload.uid || payload.sub} | Role no Token: ${payload.role || 'student'}`)
    }

    if (!payload) {
        // Invalid, expired, or tampered token → deny and clear the bad cookie
        const response = redirectToLogin(request, pathname)
        response.cookies.delete('session')
        return response
    }

    // Role-based access control
    const userRole = payload.role ?? 'student'

    for (const [route, allowedRoles] of Object.entries(ROLE_RESTRICTED_ROUTES)) {
        if (pathname.startsWith(route) && !allowedRoles.includes(userRole)) {
            // Authenticated but wrong role → redirect to their own dashboard
            const fallback = userRole === 'teacher' ? '/dashboard-teacher' : '/dashboard-student'
            return NextResponse.redirect(new URL(fallback, request.url))
        }
    }

    return NextResponse.next()
}

function redirectToLogin(request: NextRequest, pathname: string): NextResponse {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(loginUrl)
}

export const config = {
    matcher: [
        '/login',
        '/register',
        '/api/auth/:path*',
        '/api/videos/auth/:path*',
        '/dashboard-student/:path*',
        '/dashboard-teacher/:path*',
        '/classroom/:path*',
        '/payouts/:path*',
        '/cart/:path*',
        '/cart',
        '/admin/:path*',
    ],
}
