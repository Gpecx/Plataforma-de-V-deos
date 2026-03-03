import { getSessionUser } from '@/app/actions/auth'
import { AuthProvider } from '@/components/AuthProvider'

export default async function ClassroomLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const user = await getSessionUser()

    return (
        <AuthProvider user={user}>
            {children}
        </AuthProvider>
    )
}
