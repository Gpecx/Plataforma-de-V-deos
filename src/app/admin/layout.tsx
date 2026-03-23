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
        <div className="min-h-screen relative overflow-hidden text-slate-900" style={{ background: '#ffffffff' }}>
            {/* Override global gradient background for admin area */}
            <div className="fixed inset-0 bg-white -z-10" />
            <AdminSidebar />

            <main className="relative z-10 pl-72 min-h-screen bg-white">
                <div className="p-8 md:p-12">
                    {children}
                </div>
            </main>
        </div>
    )
}

