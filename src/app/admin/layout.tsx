import { getSessionUser } from '@/app/actions/auth'
import { redirect } from 'next/navigation'
import AdminSidebar from '@/components/AdminSidebar'
import AdminMainWrapper from '@/components/AdminMainWrapper'

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
        <div className="min-h-screen relative overflow-hidden text-slate-900" style={{ background: '#ffffff' }}>
            <div className="fixed inset-0 bg-white -z-10" />
            <AdminSidebar />

            <AdminMainWrapper>
                {children}
            </AdminMainWrapper>
        </div>
    )
}

