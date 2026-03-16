import { getSessionUser } from '@/app/actions/auth'
import { redirect } from 'next/navigation'
import Navbar from '@/components/Navbar'

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const user = await getSessionUser()

    if (!user || user.role !== 'admin') {
        redirect('/')
    }

    return (
        <div className="min-h-screen bg-[var(--background-color)] text-[var(--foreground)]">
            <Navbar />
            <main>
                {children}
            </main>
        </div>
    )
}
