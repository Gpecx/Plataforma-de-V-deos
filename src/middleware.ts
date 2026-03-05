import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Mapeamento de rotas protegidas pelo papel (role)
const protectedRoutes = {
    '/dashboard-student': 'student' as const,
    '/dashboard-teacher': 'teacher' as const,
    // Add other roles and routes here if needed, like admin
}

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl

    // 1. Identificar se a rota atual é protegida
    const isProtectedRoute = Object.keys(protectedRoutes).some(route => pathname.startsWith(route))

    if (!isProtectedRoute) {
        return NextResponse.next()
    }

    // 2. Verificar se o usuário está autenticado
    // O Firebase Auth usa cookies ou tokens no header. O middleware do Next.js edge-runtime não consegue 
    // ler o estado do Firebase Auth Client diretamente. Precisamos verificar a presença de um cookie de sessão
    // ou redirecionar e deixar o layout/páginas lidarem com a autorização baseada em onAuthStateChanged.
    // 
    // Como estamos no meio da migração e a autorização baseada em tokens pode não estar totalmente configurada,
    // vamos garantir que as páginas cliente tenham a proteção principal, 
    // mas também podemos adicionar um redirecionamento simples se soubermos que não há cookie.
    // 
    // Para uma implementação mais robusta usando firebase-admin ou service workers, ver a documentação do Firebase.
    // 
    // A abordagem mais segura agora é confiar no AuthProvider no lado do cliente para o redirecionamento preciso 
    // com base no perfil (role) real lido do Firestore.

    // No entanto, podemos fazer uma verificação de primeira linha. Se o Firebase tiver criado um cookie (opcional na sua config):
    // const authCookie = request.cookies.get('__session')
    // if (!authCookie) {
    //     return NextResponse.redirect(new URL('/login', request.url))
    // }

    // Deixaremos o Next.js continuar e a proteção final com base na Rule e no AuthProvider cuidará disso.
    // Mas para o escopo inicial pedido (middleware de rota), vamos configurar um placeholder que você pode expandir
    // futuramente com cookies de sessão do Firebase.

    return NextResponse.next()
}

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
