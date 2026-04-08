import ScrollToTop from '@/components/ScrollToTop'
import { getServerSession } from '@/lib/auth-utils'
import { redirect } from 'next/navigation'
import { adminDb } from '@/lib/firebase-admin'
import { TeacherStatusGuard } from './components/TeacherStatusGuard'

export default async function TeacherLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const session = await getServerSession()

    if (!session) {
        redirect('/login')
    }

    // Apenas professores ou admins podem acessar esta área
    if (session.role !== 'teacher' && session.role !== 'admin') {
        redirect('/dashboard-student')
    }

    // Buscar status do professor
    let teacherStatus = 'approved'
    let profileData: any = null
    try {
        const profileDoc = await adminDb.collection('profiles').doc(session.uid).get()
        profileData = profileDoc.data()
        teacherStatus = profileData?.teacher_status || 'approved'
    } catch (error) {
        console.error('Error fetching teacher status:', error)
    }

    // Se pending ou rejected, mostrar tela de status
    if (teacherStatus === 'pending' || teacherStatus === 'rejected') {
        return (
            <div className="flex flex-col">
                <ScrollToTop />
                <TeacherStatusGuard 
                    status={teacherStatus} 
                    userName={profileData?.full_name || profileData?.name || ''}
                />
            </div>
        )
    }

    return (
        <div className="flex flex-col">
            <ScrollToTop />
            {/* Navbar e Footer removidos pois já estão no layout pai (app)/layout.tsx */}
            <div className="px-4 md:px-8 lg:px-12">
                {children}
            </div>
        </div>
    )
}
