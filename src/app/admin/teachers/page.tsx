import { getAllTeachers } from '@/app/actions/admin'
import TeacherManagement from './components/TeacherManagement'

export default async function TeachersPage() {
    const teachers = await getAllTeachers()

    return (
        <div className="flex flex-col gap-8 animate-in fadeIn duration-700 font-montserrat p-8 md:p-12">
            <header className="flex flex-col items-center text-center mb-2">
                <div className="flex items-center gap-3 mb-4">


                </div>
                <h1 className="text-3xl font-bold tracking-tighter uppercase leading-none text-[#1D5F31] text-center max-w-2xl">
                    <span className="text-[#1D5F31]">Controle de Professores</span>
                </h1>

            </header>

            <TeacherManagement initialTeachers={teachers} />
        </div>
    )
}
