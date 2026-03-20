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
        <div className="min-h-screen bg-slate-50 text-slate-900 font-exo relative overflow-hidden">
            <AdminSidebar />
            
            <main className="relative z-10 pl-72 min-h-screen">
                <div className="p-8 md:p-12">
                    {children}
                </div>
            </main>
        </div>
    )
}

