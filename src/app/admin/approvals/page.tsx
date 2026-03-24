import { getPendingCourses, getPendingLessons, getAllTeachers } from '@/app/actions/admin'
import { ApprovalsContent } from '@/app/admin/approvals/components/ApprovalsContent'

export default async function ApprovalsPage() {
    const pendingCourses = await getPendingCourses()
    const pendingLessons = await getPendingLessons()
    const teachers = await getAllTeachers()

    const teachersMap = teachers.reduce((acc: any, t: any) => {
        acc[t.id] = t.full_name || t.email
        return acc
    }, {})

    const lessonsInActiveCourses = pendingLessons.filter((l: any) => l.course_status === 'APROVADO')

    return (
        <div className="flex flex-col animate-in fadeIn duration-700 font-exo bg-white min-h-screen">
            {/* Header Clean e Profissional */}
            <header className="w-full pt-12 pb-10 px-6 border-b border-black/10">
                <div className="max-w-6xl mx-auto flex flex-col items-start text-left">
                    <div className="flex items-center gap-3 mb-4">
                        <span className="text-[11px] font-medium uppercase tracking-widest text-slate-900">Admin • Controle</span>
                        <div className="h-[1px] w-8 bg-slate-200" />
                    </div>
                    <h1 className="text-4xl md:text-5xl font-[900] tracking-tighter uppercase leading-none text-slate-950">
                        <span className="text-[#1D5F31]">Moderação de Conteúdo</span>
                    </h1>
                    <p className="text-black text-[13px] font-medium mt-4 max-w-2xl leading-relaxed uppercase tracking-widest">
                        Auditoria técnica e pedagógica
                    </p>
                </div>
            </header>

            {/* Área de Gestão */}
            <main className="w-full max-w-6xl mx-auto p-6 md:p-10 pb-24">
                <ApprovalsContent
                    pendingCourses={pendingCourses}
                    lessonsInActiveCourses={lessonsInActiveCourses}
                    teachersMap={teachersMap}
                />
            </main>
        </div>
    )
}