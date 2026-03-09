import { NextRequest, NextResponse } from 'next/server'

// Rotas que exigem que o usuário esteja autenticado
const PROTECTED_ROUTES = [
    '/dashboard-student',
    '/dashboard-teacher',
    '/classroom',
    '/cart',
    '/payouts',
]

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl

    const isProtectedRoute = PROTECTED_ROUTES.some((route) =>
        pathname.startsWith(route)
    )

    if (!isProtectedRoute) {
        return NextResponse.next()
    }

    // Para rotas protegidas: verifica apenas a existência do cookie no Edge Runtime
    const token = request.cookies.get('firebase-token')?.value

    if (!token) {
        const loginUrl = new URL('/login', request.url)
        loginUrl.searchParams.set('redirectTo', pathname)
        return NextResponse.redirect(loginUrl)
    }

    // A validação de token e role será feita via Server Components (getServerSession)
    // nos layouts/páginas, pois o middleware roda no Edge Runtime e não suporta firebase-admin.
    return NextResponse.next()
}

export const config = {
    matcher: [
        "/dashboard-student/:path*",
        "/dashboard-teacher/:path*",
        "/classroom/:path*",
        "/payouts/:path*",
        "/cart/:path*",
    ],
}

