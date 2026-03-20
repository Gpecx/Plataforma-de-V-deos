import Navbar from '@/components/Navbar'
import TeacherFooter from '@/components/TeacherFooter'
import ScrollToTop from '@/components/ScrollToTop'
import { getServerSession } from '@/lib/auth-utils'
import { redirect } from 'next/navigation'

export default async function TeacherLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const session = await getServerSession()

    if (!session) {
        redirect('/login')
    }

    // Apenas professores ou admins podem acessar esta área
    if (session.role !== 'teacher' && session.role !== 'admin') {
        redirect('/dashboard-student')
    }

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
            <ScrollToTop />
            <Navbar light={true} />

            {/* A classe 'pt-24' garante que o conteúdo não fique escondido 
                atrás do Navbar que está com posição 'fixed' */}
            <main className="flex-1 pt-24 px-4 md:px-8 lg:px-12">
                {children}
            </main>

            <TeacherFooter />
        </div>
    )
}