import { getSessionUser } from '@/app/actions/auth'
import { redirect } from 'next/navigation'
import AdminSidebar from '@/components/AdminSidebar'

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const user = await getSessionUser()

    if (!user || user.role !== 'admin') {
        redirect('/dashboard-student')
    }

    return (
        <div className="min-h-screen bg-[#061629] text-white font-exo relative overflow-hidden">
            {/* Background Gradient Layer */}
            <div className="fixed inset-0 bg-gradient-to-br from-[#061629] via-[#061629] to-[#1D5F31]/30 z-0 pointer-events-none" />
            
            <AdminSidebar />
            
            <main className="relative z-10 pl-72 min-h-screen">
                <div className="p-8 md:p-12">
                    {children}
                </div>
            </main>

            {/* Aesthetic Lines/Accents */}
            <div className="fixed top-0 right-0 w-1/3 h-[1px] bg-gradient-to-r from-transparent to-[#1D5F31]/50 z-20" />
            <div className="fixed bottom-0 left-72 w-[1px] h-1/3 bg-gradient-to-b from-transparent to-[#1D5F31]/50 z-20" />
        </div>
    )
}

