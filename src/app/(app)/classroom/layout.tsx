import { getSessionUser } from '@/app/actions/auth'
import { AuthProvider } from '@/context/AuthProvider'
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
        <AuthProvider>
            <div className="classroom-theme">
                {children}
            </div>
        </AuthProvider>
    )
}
