import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify, createRemoteJWKSet } from 'jose'

// =========================================================================
// M-02: Rate Limiting System (Industrial Hardening)
// =========================================================================
const RATE_LIMIT_WINDOW = 60 * 1000
const MAX_REQUESTS = 60
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
const FIREBASE_JWKS_URL = 'https://identitytoolkit.googleapis.com/v1/sessionCookiePublicKeys'
const FIREBASE_PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID

const JWKS = createRemoteJWKSet(new URL(FIREBASE_JWKS_URL), {
    timeoutDuration: 5000,
    cooldownDuration: 30000,
})

// Routes restricted by role (only matching roles allowed)
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

// Routes that should redirect TEACHERS away to their dashboard
const TEACHER_BLOCKED_ROUTES = [
    '/course',
    '/cart',
    '/dashboard-student',
]

// Routes that should redirect ADMINS away
const ADMIN_BLOCKED_ROUTES = [
    '/course',
    '/cart',
    '/dashboard-student',
    '/dashboard-teacher',
]

// Sensitive routes that need Rate Limiting
const RATE_LIMITED_ROUTES = [
    '/api/auth',
    '/api/videos/auth',
    '/login',
    '/register',
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

async function verifyFirebaseSessionCookie(
    token: string
): Promise<FirebaseTokenPayload | null> {
    if (!FIREBASE_PROJECT_ID) {
        console.error('[Proxy] NEXT_PUBLIC_FIREBASE_PROJECT_ID is not set.')
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
            console.error('[Proxy] Critical JWKS Fetch Failure:', error.message)
            return null
        }
        console.warn('[Proxy] JWT verification failed:', error.message)
        return null
    }
}

function redirectToLogin(request: NextRequest, pathname: string): NextResponse {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(loginUrl)
}

export async function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl

    // ── Skip static / internal Next.js paths ───────────────────────────
    if (
        pathname.startsWith('/_next') ||
        pathname.startsWith('/api/') ||
        pathname.startsWith('/favicon') ||
        pathname.startsWith('/images/') ||
        pathname.startsWith('/fonts/') ||
        pathname.startsWith('/icons/') ||
        pathname === '/manifest.json' ||
        pathname === '/robots.txt' ||
        pathname === '/service-worker.js'
    ) {
        return NextResponse.next()
    }

    // ── 1. Rate Limit ──────────────────────────────────────────────────
    const isRateLimitedRoute = RATE_LIMITED_ROUTES.some(route => pathname.startsWith(route))
    if (isRateLimitedRoute) {
        const forwardedFor = request.headers.get('x-forwarded-for')
        let realIp = '127.0.0.1'

        if (forwardedFor) {
            realIp = forwardedFor.split(',')[0].trim()
        } else {
            realIp = (request as any).ip ?? '127.0.0.1'
        }

        if (isRateLimited(realIp)) {
            console.warn(`[M-02] Rate limit exceeded for IP: ${realIp} on route: ${pathname}`)
            return new NextResponse(
                JSON.stringify({ error: 'Muitas tentativas. Tente novamente em um minuto.' }),
                { status: 429, headers: { 'Content-Type': 'application/json' } }
            )
        }
    }

    // ── 2. Session verification ────────────────────────────────────────
    const sessionCookie = request.cookies.get('session')?.value

    // Block MFA
    const isMfaPending = request.cookies.get('mfa_pending')?.value === 'true'
    if (isMfaPending) {
        return redirectToLogin(request, pathname)
    }

    let payload: FirebaseTokenPayload | null = null
    if (sessionCookie) {
        payload = await verifyFirebaseSessionCookie(sessionCookie)
        if (payload) {
            console.log(`[Proxy] User UID: ${payload.uid || payload.sub} | Role: ${payload.role || 'student'}`)
        } else {
            const response = redirectToLogin(request, pathname)
            response.cookies.delete('session')
            return response
        }
    }

    const userRole = payload?.role ?? null

    // ── 3. Admin Bypass: admins have unrestricted access to all routes ──
    if (userRole === 'admin') {
        return NextResponse.next()
    }

    // ── 4. Unauthenticated: protect authenticated routes ────────────────
    const isProtectedRoute = AUTHENTICATED_ROUTES.some((route) =>
        pathname.startsWith(route)
    )

    if (isProtectedRoute && !payload) {
        return redirectToLogin(request, pathname)
    }

    // ── 5. Teacher: block public/student routes ─────────────────────────
    if (userRole === 'teacher') {
        const isTeacherBlocked = TEACHER_BLOCKED_ROUTES.some(route =>
            pathname === route || pathname.startsWith(route + '/')
        )
        if (isTeacherBlocked || pathname === '/') {
            return NextResponse.redirect(new URL('/dashboard-teacher', request.url))
        }
    }

    // ── 6. Role-restricted routes ──────────────────────────────────────
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
        '/((?!_next/static|_next/image|api/|favicon|images/|fonts/|icons/).*)',
    ],
}
