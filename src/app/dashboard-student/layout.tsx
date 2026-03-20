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
        <div className="min-h-screen bg-slate-50 text-slate-900 font-exo flex flex-col">
            <ScrollToTop />
            <Navbar light={true} />

            {/* Main Content Area - Full Width optimized */}
            <main className="flex-1 pt-24 transition-all duration-300 w-full px-4 md:px-8 lg:px-12">
                {children}
            </main>

            <Footer />
        </div>
    )
}
