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
        <div className="min-h-screen bg-[#F4F7F9] text-slate-800">
            <ScrollToTop />
            <Navbar />

            {/* Main Content Area */}
            <main>
                {children}
            </main>

            <TeacherFooter />
        </div>
    )
}
