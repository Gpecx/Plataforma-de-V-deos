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
        <div className="flex flex-col">
            <ScrollToTop />
            {/* Navbar e Footer removidos pois já estão no layout pai (app)/layout.tsx */}
            <div className="px-4 md:px-8 lg:px-12">
                {children}
            </div>
        </div>
    )
}