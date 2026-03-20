import { getAllStudents } from '@/app/actions/admin'
import StudentManagement from './components/StudentManagement'

export default async function StudentsPage() {
    const students = await getAllStudents()

    return (
        <div className="space-y-12 animate-in fadeIn duration-700 font-exo p-8 md:p-12">
            <header>
                <div className="flex items-center gap-3 mb-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-[#1D5F31]" />
                    <span className="text-[10px] font-black uppercase tracking-[5px] text-slate-500">USER GOVERNANCE</span>
                </div>
                <h1 className="text-4xl md:text-5xl font-black tracking-tighter uppercase leading-none text-slate-900">
                    Gestão de <span className="text-[#1D5F31]">Alunos</span>
                </h1>
                <p className="text-slate-400 mt-4 text-[10px] font-bold uppercase tracking-[3px] max-w-xl leading-relaxed italic">
                    Administre a base de alunos da plataforma. Ative ou suspenda acessos conforme necessário para garantir a integridade da comunidade.
                </p>
            </header>

            <StudentManagement initialStudents={students} />
        </div>
    )
}
