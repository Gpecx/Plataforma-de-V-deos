import { getSessionUser } from '@/app/actions/auth'
import { AuthProvider } from '@/components/AuthProvider'
import { redirect } from 'next/navigation'

export default async function ClassroomLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const user = await getSessionUser()

    if (!user) {
        redirect('/login')
    }

    if (!user.emailVerified) {
        redirect('/verify-email')
    }

    return (
        <AuthProvider user={user}>
            <div className="classroom-theme">
                {children}
            </div>
        </AuthProvider>
    )
}
