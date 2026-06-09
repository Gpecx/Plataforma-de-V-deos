import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify, createRemoteJWKSet } from 'jose'

// =========================================================================
// M-02: Rate Limiting System (Map em memória — estado por instância)
// Para multi-instância em produção, substituir por Redis/Upstash.
// =========================================================================
const RATE_LIMIT_WINDOW = 60_000
const MAX_REQUESTS = 100
const rateLimitMap = new Map<string, { count: number; lastReset: number }>()

let lastCleanup = Date.now()

function cleanupRateLimitMap(): void {
    const now = Date.now()
    for (const [ip, entry] of rateLimitMap.entries()) {
        if (now - entry.lastReset > RATE_LIMIT_WINDOW * 2) {
            rateLimitMap.delete(ip)
        }
    }
    lastCleanup = now
}

function isRateLimited(ip: string): boolean {
    const now = Date.now()

    if (now - lastCleanup > RATE_LIMIT_WINDOW * 5) {
        cleanupRateLimitMap()
    }

    const entry = rateLimitMap.get(ip)

    if (!entry || now - entry.lastReset > RATE_LIMIT_WINDOW) {
        rateLimitMap.set(ip, { count: 1, lastReset: now })
        return false
    }

    entry.count++
    return entry.count > MAX_REQUESTS
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
    '/api/cnpj',
    '/login',
    '/register',
]

// =========================================================================
// BUG-02 FIX: Exportado como `middleware` — único nome reconhecido pelo Next.js
// O arquivo proxy.ts exportava como `proxy`, por isso nunca era executado.
// =========================================================================
export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl

    // ── 1. Rate Limit ────────────────────────────────────────────
    // LGPD: IP é usado apenas para rate limiting em memória volátil,
    // nunca persistido em logs ou banco de dados.
    const isRateLimitedRoute = RATE_LIMITED_ROUTES.some(route => pathname.startsWith(route))
    if (isRateLimitedRoute) {
        const forwardedFor = request.headers.get('x-forwarded-for')
        const ip = forwardedFor
            ? forwardedFor.split(',')[0].trim()
            : request.headers.get('x-real-ip') ?? '127.0.0.1'

        if (isRateLimited(ip)) {
            return new NextResponse(
                JSON.stringify({ error: 'Too Many Requests' }),
                { status: 429, headers: { 'Content-Type': 'application/json' } }
            )
        }
    }

    // ── 2. Webhook routes ─────────────────────────────────────────
    // Validação de assinatura feita aqui para garantir que o handler
    // receba apenas requisições legítimas do Asaas. O matcher NÃO exclui
    // /api/webhooks/ para que este guard seja efetivo.
    // A validação de corpo (HMAC) deve ser feita no route handler
    // onde o body bruto ainda está disponível.
    const isWebhookRoute = pathname.startsWith('/api/webhooks/')
    if (isWebhookRoute) {
        const webhookSecret = process.env.WEBHOOK_SECRET
        if (!webhookSecret) {
            console.error('[Middleware] WEBHOOK_SECRET não configurado.')
            return new NextResponse(
                JSON.stringify({ error: 'Webhook not configured' }),
                { status: 403, headers: { 'Content-Type': 'application/json' } }
            )
        }
        const signature = request.headers.get('x-webhook-signature')
        if (!signature || signature !== webhookSecret) {
            return new NextResponse(
                JSON.stringify({ error: 'Invalid signature' }),
                { status: 401, headers: { 'Content-Type': 'application/json' } }
            )
        }
        return NextResponse.next()
    }

    // ── 3. Session verification ───────────────────────────────────
    const sessionCookie = request.cookies.get('session')?.value
    const isAuthRoute = pathname.startsWith('/login') || pathname.startsWith('/register')
    const isApiRoute = pathname.startsWith('/api/')

    // MFA pendente: nunca bloquear rotas de API
    const isMfaPending = request.cookies.get('mfa_pending')?.value === 'true'
    if (isMfaPending && !isAuthRoute && !isApiRoute) {
        const loginUrl = new URL('/login', request.url)
        loginUrl.searchParams.set('redirectTo', pathname)
        return NextResponse.redirect(loginUrl)
    }

    let payload: FirebaseTokenPayload | null = null
    if (sessionCookie) {
        payload = await verifyFirebaseSessionCookie(sessionCookie)
        if (!payload && !isAuthRoute && !isApiRoute) {
            // Sessão inválida (cookie expirado ou usuário removido do Firebase Auth).
            // Rotas públicas (ex: landing page /): apenas deleta o cookie, sem redirect.
            // Rotas protegidas: redireciona para login com redirectTo.
            const isProtected = AUTHENTICATED_ROUTES.some(route =>
                pathname.startsWith(route)
            )
            if (isProtected) {
                const loginUrl = new URL('/login', request.url)
                loginUrl.searchParams.set('redirectTo', pathname)
                const response = NextResponse.redirect(loginUrl)
                response.cookies.delete('session')
                return response
            }
            // Rota pública: apenas limpa o cookie e deixa passar
            const response = NextResponse.next()
            response.cookies.delete('session')
            return response
        }
    }

    const userRole = payload?.role ?? null

    // ── 4. Admin bypass ───────────────────────────────────────────
    if (userRole === 'admin') {
        return NextResponse.next()
    }

    // ── 5. Unauthenticated: protect authenticated routes ──────────
    const isProtectedRoute = AUTHENTICATED_ROUTES.some(route =>
        pathname.startsWith(route)
    )
    if (isProtectedRoute && !payload) {
        const loginUrl = new URL('/login', request.url)
        loginUrl.searchParams.set('redirectTo', pathname)
        return NextResponse.redirect(loginUrl)
    }

    // ── 6. Teacher: block public/student routes ───────────────────
    if (userRole === 'teacher') {
        const isTeacherBlocked = TEACHER_BLOCKED_ROUTES.some(route =>
            pathname === route || pathname.startsWith(route + '/')
        )
        if (isTeacherBlocked) {
            return NextResponse.redirect(new URL('/dashboard-teacher', request.url))
        }
    }

    // ── 7. Role-restricted routes ──────────────────────────────────
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
    // Inclui /api/webhooks/ no matcher para que o guard do step 2 seja executado.
    // _next/static, imagens e assets estáticos permanecem excluídos por performance.
    matcher: [
        '/((?!_next/static|_next/image|favicon|images/|fonts/|icons/).*)',
    ],
}