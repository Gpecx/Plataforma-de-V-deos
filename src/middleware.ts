import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify, createRemoteJWKSet } from 'jose'

// =========================================================================
// M-02: Rate Limiting System
// Nota: Em produção com múltiplas instâncias, substituir por Upstash Redis
// para garantir estado compartilhado entre instâncias (ex: @upstash/ratelimit).
// =========================================================================
const RATE_LIMIT_WINDOW = 60 * 1000
const MAX_REQUESTS = 60
const rateLimitMap = new Map<string, { count: number; lastReset: number }>()

function isRateLimited(ip: string): boolean {
    const now = Date.now()
    let entry = rateLimitMap.get(ip)

    if (!entry || now - entry.lastReset > RATE_LIMIT_WINDOW) {
        rateLimitMap.set(ip, { count: 1, lastReset: now })
        return false
    }

    entry.count++
    if (entry.count > MAX_REQUESTS) {
        return true
    }

    return false
}

// Cleanup de entradas expiradas a cada requisição (sem setInterval)
function cleanupRateLimitMap(): void {
    const now = Date.now()
    for (const [ip, entry] of rateLimitMap.entries()) {
        if (now - entry.lastReset > RATE_LIMIT_WINDOW) {
            rateLimitMap.delete(ip)
        }
    }
}

// =========================================================================
// Auth Configuration
// =========================================================================
const FIREBASE_JWKS_URL = 'https://identitytoolkit.googleapis.com/v1/sessionCookiePublicKeys'
const FIREBASE_PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID

const JWKS = createRemoteJWKSet(new URL(FIREBASE_JWKS_URL), {
    timeoutDuration: 5000,
    cooldownDuration: 30000,
})

interface FirebaseTokenPayload {
    uid?: string
    sub?: string
    email?: string
    role?: string
    iss?: string
    aud?: string
    exp?: number
}

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
        if (error.code === 'ERR_JWKS_FETCH_FAILED' || error.code === 'ERR_JWK_SET_TIMEOUT') {
            console.error('[Middleware] Critical JWKS Fetch Failure:', error.message)
            return null
        }
        return null
    }
}

// Routes restricted by role
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

// Routes that redirect teachers to their dashboard
const TEACHER_BLOCKED_ROUTES = [
    '/course',
    '/cart',
    '/dashboard-student',
]

// Routes that redirect admins away
const ADMIN_BLOCKED_ROUTES = [
    '/course',
    '/cart',
    '/dashboard-student',
    '/dashboard-teacher',
]

// Rotas que exigem rate limiting
const RATE_LIMITED_ROUTES = [
    '/api/auth',
    '/api/videos/auth',
    '/login',
    '/register',
]

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl

    // ── 1. Rate Limit ───────────────────────────────────────────────
    const isRateLimitedRoute = RATE_LIMITED_ROUTES.some(route => pathname.startsWith(route))
    if (isRateLimitedRoute) {
        cleanupRateLimitMap()

        const forwardedFor = request.headers.get('x-forwarded-for')
        const realIp = forwardedFor
            ? forwardedFor.split(',')[0].trim()
            : request.headers.get('x-real-ip') || '127.0.0.1'

        if (isRateLimited(realIp)) {
            console.warn(`[RateLimit] IP ${realIp} excedeu limite em ${pathname}`)
            return new NextResponse(
                JSON.stringify({ error: 'Muitas tentativas. Tente novamente em um minuto.' }),
                { status: 429, headers: { 'Content-Type': 'application/json' } }
            )
        }
    }

    // ── 2. Session verification ────────────────────────────────────
    const sessionCookie = request.cookies.get('session')?.value

    const isMfaPending = request.cookies.get('mfa_pending')?.value === 'true'
    if (isMfaPending) {
        const loginUrl = new URL('/login', request.url)
        loginUrl.searchParams.set('redirectTo', pathname)
        return NextResponse.redirect(loginUrl)
    }

    let payload: FirebaseTokenPayload | null = null
    if (sessionCookie) {
        payload = await verifyFirebaseSessionCookie(sessionCookie)
        if (!payload) {
            const loginUrl = new URL('/login', request.url)
            loginUrl.searchParams.set('redirectTo', pathname)
            const response = NextResponse.redirect(loginUrl)
            response.cookies.delete('session')
            return response
        }
    }

    const userRole = payload?.role ?? null

    // ── 3. Admin bypass ─────────────────────────────────────────────
    if (userRole === 'admin') {
        return NextResponse.next()
    }

    // ── 4. Unauthenticated: protect authenticated routes ───────────
    const isProtectedRoute = AUTHENTICATED_ROUTES.some(route =>
        pathname.startsWith(route)
    )

    if (isProtectedRoute && !payload) {
        const loginUrl = new URL('/login', request.url)
        loginUrl.searchParams.set('redirectTo', pathname)
        return NextResponse.redirect(loginUrl)
    }

    // ── 5. Teacher: block public/student routes ────────────────────
    if (userRole === 'teacher') {
        const isTeacherBlocked = TEACHER_BLOCKED_ROUTES.some(route =>
            pathname === route || pathname.startsWith(route + '/')
        )
        if (isTeacherBlocked || pathname === '/') {
            return NextResponse.redirect(new URL('/dashboard-teacher', request.url))
        }
    }

    // ── 6. Role-restricted routes ─────────────────────────────────
    if (payload && userRole) {
        for (const [route, allowedRoles] of Object.entries(ROLE_RESTRICTED_ROUTES)) {
            if (pathname.startsWith(route) && !allowedRoles.includes(userRole)) {
                const fallback = userRole === 'teacher' ? '/dashboard-teacher' : '/dashboard-student'
                return NextResponse.redirect(new URL(fallback, request.url))
            }
        }
    }

    return NextResponse.next()
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon|images/|fonts/|icons/).*)',
    ],
}
