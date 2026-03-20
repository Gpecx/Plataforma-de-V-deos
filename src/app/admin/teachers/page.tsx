import { getAllTeachers } from '@/app/actions/admin'
import TeacherManagement from './components/TeacherManagement'

export default async function TeachersPage() {
    const teachers = await getAllTeachers()

    return (
        <div className="space-y-12 animate-in fadeIn duration-700 font-exo p-8 md:p-12">
            <header>
                <div className="flex items-center gap-3 mb-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-[#1D5F31]" />
                    <span className="text-[10px] font-black uppercase tracking-[5px] text-slate-900">FACULTY GOVERNANCE</span>
                </div>
                <h1 className="text-4xl md:text-5xl font-black tracking-tighter uppercase leading-none text-slate-900">
                    Controle de <span className="text-[#1D5F31]">Professores</span>
                </h1>
                <p className="text-slate-900 mt-4 text-[10px] font-black uppercase tracking-[3px] max-w-xl leading-relaxed italic">
                    Visualize todos os instrutores da plataforma e audite seus respectivos alunos e turmas em tempo real.
                </p>
            </header>

            <TeacherManagement initialTeachers={teachers} />
        </div>
    )
}
