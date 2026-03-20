import { getPendingCourses, getPendingLessons, getAllTeachers } from '@/app/actions/admin'
import { ApprovalsContent } from '@/app/admin/approvals/components/ApprovalsContent'

export default async function ApprovalsPage() {
    const pendingCourses = await getPendingCourses()
    const pendingLessons = await getPendingLessons()
    const teachers = await getAllTeachers()

    // Mapeia os professores para facilitar a exibição dos nomes
    const teachersMap = teachers.reduce((acc: any, t: any) => {
        acc[t.id] = t.full_name || t.email
        return acc
    }, {})

    // Filtra lições apenas de cursos que já estão aprovados (Novas aulas em cursos ativos)
    const lessonsInActiveCourses = pendingLessons.filter((l: any) => l.course_status === 'APROVADO')

    return (
        <div className="space-y-12 animate-in fadeIn duration-700 font-exo p-8 md:p-12 pb-24">
            <header className="relative">
                <div className="flex items-center gap-3 mb-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-[#1D5F31]" />
                    <span className="text-[10px] font-black uppercase tracking-[5px] text-slate-500">CURATORIAL BOARD</span>
                </div>
                <h1 className="text-4xl md:text-5xl font-black tracking-tighter uppercase leading-none text-slate-900">
                    Moderação de <span className="text-[#1D5F31]">Conteúdo</span>
                </h1>
                <p className="text-slate-400 mt-4 text-[11px] font-bold uppercase tracking-[3px] max-w-2xl leading-relaxed italic border-l-4 border-slate-100 pl-6">
                    Módulo de auditoria técnica e pedagógica. Valide a qualidade dos treinamentos 
                    antes da exposição na vitrine principal.
                </p>
            </header>

            <ApprovalsContent 
                pendingCourses={pendingCourses}
                lessonsInActiveCourses={lessonsInActiveCourses}
                teachersMap={teachersMap}
            />
        </div>
    )
}
