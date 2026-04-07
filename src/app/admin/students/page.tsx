import { getAllStudents } from '@/app/actions/admin'
import StudentManagement from './components/StudentManagement'

export default async function StudentsPage() {
    const students = await getAllStudents()

    return (
        <div className="space-y-12 animate-in fadeIn duration-700 font-montserrat p-8 md:p-12">
            <header>
                <h1 className="text-2xl md:text-3xl font-bold tracking-tighter uppercase leading-none max-w-xl" style={{ color: '#1D5F31' }}>
                    Controle de Alunos
                </h1>
            </header>

            <StudentManagement initialStudents={students} />
        </div>
    )
}
