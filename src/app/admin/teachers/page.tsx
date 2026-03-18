import { getAllTeachers } from '@/app/actions/admin'
import TeacherManagement from './components/TeacherManagement'

export default async function TeachersPage() {
    const teachers = await getAllTeachers()

    return (
        <div className="space-y-12 animate-in slide-in-from-bottom-4 duration-700">
            <header>
                <div className="flex items-center gap-3 mb-2">
                    <div className="h-[2px] w-8 bg-[#1D5F31]" />
                    <span className="text-[10px] font-black uppercase tracking-[5px] text-[#1D5F31]">Gestão Hierárquica</span>
                </div>
                <h1 className="text-4xl font-black tracking-tighter uppercase leading-none">
                    Controle de <span className="text-[#1D5F31]">Professores</span>
                </h1>
                <p className="text-slate-400 mt-4 text-[10px] font-bold uppercase tracking-[3px] max-w-xl leading-relaxed">
                    Visualize todos os instrutores da plataforma e audite seus respectivos alunos e turmas em tempo real.
                </p>
            </header>

            <TeacherManagement initialTeachers={teachers} />
        </div>
    )
}
