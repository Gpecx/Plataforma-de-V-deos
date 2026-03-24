import { getAllTeachers } from '@/app/actions/admin'
import TeacherManagement from './components/TeacherManagement'

export default async function TeachersPage() {
    const teachers = await getAllTeachers()

    return (
        <div className="flex flex-col gap-8 animate-in fadeIn duration-700 font-exo p-8 md:p-12">
            <header className="flex flex-col items-center text-center mb-2">
                <div className="flex items-center gap-3 mb-4">
                    <div className="h-[1px] w-8 bg-black" />
                    <span className="text-black[11px] font-medium uppercase tracking-widest text-black">ADMINISTRADOR</span>
                    <div className="h-[1px] w-8 bg-black" />
                </div>
                <h1 className="text-5xl font-[900] tracking-tighter uppercase leading-none text-[#1D5F31] text-center">
                    <span className="text-black">Controle de Professores</span>
                </h1>
                <p className="text-black mt-4 text-[11px] font-medium uppercase tracking-widest max-w-xl leading-tight">
                    Visualize todos os instrutores da plataforma e audite seus respectivos alunos e turmas em tempo real.
                </p>
            </header>

            <TeacherManagement initialTeachers={teachers} />
        </div>
    )
}
