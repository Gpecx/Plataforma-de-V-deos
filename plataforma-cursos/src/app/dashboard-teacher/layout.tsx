import Navbar from '@/components/Navbar'
import TeacherFooter from '@/components/TeacherFooter'

export default function TeacherLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="min-h-screen bg-[#F4F7F9] text-slate-800">
            <Navbar />

            {/* Main Content Area */}
            <main className="pt-24">
                {children}
            </main>

            <TeacherFooter />
        </div>
    )
}
