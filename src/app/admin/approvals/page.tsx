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
        <div className="space-y-12 animate-in slide-in-from-bottom-4 duration-700 pb-20">
            <header className="relative">
                <div className="flex items-center gap-3 mb-4">
                    <div className="h-[2px] w-12 bg-[#00FF00] shadow-[0_0_10px_#00FF00]" />
                    <span className="text-[10px] font-black uppercase tracking-[5px] text-[#00FF00]">Comitê de Governança PowerPlay</span>
                </div>
                <h1 className="text-5xl font-black tracking-tighter uppercase leading-none">
                    Moderação de <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00FF00] to-[#1D5F31]">Conteúdo</span>
                </h1>
                <p className="text-slate-400 mt-6 text-[11px] font-bold uppercase tracking-[3px] max-w-2xl leading-relaxed border-l-2 border-white/5 pl-6">
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
