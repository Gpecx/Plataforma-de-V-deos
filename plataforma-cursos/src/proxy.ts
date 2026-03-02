import { NextRequest, NextResponse } from 'next/server'
import { adminAuth, adminDb } from '@/lib/firebase-admin'

// Rotas que exigem que o usuário esteja autenticado
const PROTECTED_ROUTES = [
    '/dashboard-student',
    '/dashboard-teacher',
    '/classroom',
    '/cart',
]

export default async function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl

    const isProtectedRoute = PROTECTED_ROUTES.some((route) =>
        pathname.startsWith(route)
    )

    if (!isProtectedRoute) {
        return NextResponse.next()
    }

    // Para rotas protegidas: verifica o ID Token no cookie
    const token = request.cookies.get('firebase-token')?.value

    if (!token) {
        const loginUrl = new URL('/login', request.url)
        loginUrl.searchParams.set('redirectTo', pathname)
        return NextResponse.redirect(loginUrl)
    }

    try {
        // Verifica o token com o Firebase Admin SDK
        const decodedToken = await adminAuth.verifyIdToken(token)
        const uid = decodedToken.uid

        // Buscar o papel (role) no Firestore
        const profileDoc = await adminDb.collection('profiles').doc(uid).get()
        const profileData = profileDoc.data()
        const role = profileData?.role

        // Proteção baseada em Role
        if (pathname.startsWith('/dashboard-teacher') && role !== 'teacher' && role !== 'admin') {
            return NextResponse.redirect(new URL('/dashboard-student', request.url))
        }

        if (pathname.startsWith('/dashboard-student') && role === 'teacher') {
            return NextResponse.redirect(new URL('/dashboard-teacher', request.url))
        }

        return NextResponse.next()
    } catch (error) {
        console.error('Proxy: Erro ao verificar token:', error)
        const loginUrl = new URL('/login', request.url)
        return NextResponse.redirect(loginUrl)
    }
}

