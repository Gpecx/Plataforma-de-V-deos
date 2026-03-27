import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import ScrollToTop from '@/components/ScrollToTop'
import { getServerSession } from '@/lib/auth-utils'
import { redirect } from 'next/navigation'

export default async function StudentLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const session = await getServerSession()

    if (!session) {
        redirect('/login')
    }

    // Se for professor, redireciona para o dashboard de professor
    if (session.role === 'teacher') {
        redirect('/dashboard-teacher')
    }

    return (
        <>
            <ScrollToTop />
            {children}
        </>
    )
}
