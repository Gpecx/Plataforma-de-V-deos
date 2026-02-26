import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { Search, MessageSquare, ArrowUpDown } from 'lucide-react'
import Link from 'next/link'

export default async function StudentsPage() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    // 1. Buscamos os IDs dos cursos vinculados ao professor
    const { data: teacherCourses, error: coursesError } = await supabase
        .from('courses')
        .select('id')
        .eq('teacher_id', user.id)

    if (coursesError) {
        // Fallback silencioso ou log seguro
        console.log('Erro ao buscar cursos:', coursesError.message)
    }

    const courseIds = teacherCourses?.map(c => c.id) || []

    // 2. Buscamos as matrículas filtrando por esses IDs de curso
    // Se não houver cursos, não há matrículas para buscar
    let enrollments: any[] = []
    if (courseIds.length > 0) {
        const { data, error: enrollError } = await supabase
            .from('enrollments')
            .select(`
                id,
                user_id,
                created_at,
                profiles (full_name, email)
            `)
            .in('course_id', courseIds)
            .order('created_at', { ascending: false })

        if (enrollError) {
            console.log('Erro ao buscar matrículas:', enrollError.message)
        } else {
            enrollments = data || []
        }
    }

    // Agregamos por aluno para evitar duplicatas
    const studentMap = new Map<string, any>()

    enrollments.forEach((e: any) => {
        // Tratamento da estrutura de profiles (Pode vir como objeto ou array)
        const profileData = Array.isArray(e.profiles) ? e.profiles[0] : e.profiles
        const userId = e.user_id

        const existing = studentMap.get(userId)
        if (existing) {
            existing.courseCount++
        } else {
            studentMap.set(userId, {
                id: userId,
                profiles: {
                    full_name: profileData?.full_name || 'Aluno sem Perfil',
                    email: profileData?.email || 'N/A'
                },
                joinedAt: e.created_at,
                courseCount: 1
            })
        }
    })

    const studentsData = Array.from(studentMap.values()).sort((a, b) =>
        (a.profiles?.full_name || '').localeCompare(b.profiles?.full_name || '')
    )

    return (
        <div className="p-8 md:p-12 space-y-12 bg-[#F4F7F9] min-h-screen text-slate-800 border-t border-slate-100 font-exo">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="text-2xl font-black tracking-tighter text-slate-800">
                        GESTÃO DE <span className="text-[#00C402]">ALUNOS</span>
                    </h1>
                    <p className="text-slate-500 mt-1 text-sm font-medium">Acompanhe o progresso de seus alunos e gerencie matrículas.</p>
                </div>
                <div className="flex gap-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                        <input
                            placeholder="Buscar aluno..."
                            className="bg-slate-50 border border-slate-100 rounded-xl px-10 py-2.5 text-xs text-slate-700 focus:border-[#00C402] outline-none transition-all w-64 font-bold uppercase tracking-widest placeholder:text-slate-400"
                        />
                    </div>
                </div>
            </header>

            <div className="bg-white border border-slate-100 rounded-2xl p-6 space-y-6 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-50 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                                <th className="pb-5 px-4">Aluno <ArrowUpDown size={12} className="inline ml-1 opacity-30" /></th>
                                <th className="pb-5 px-4">E-mail</th>
                                <th className="pb-5 px-4 text-center">Cursos</th>
                                <th className="pb-5 px-4">Inscrição</th>
                                <th className="pb-5 px-4 text-right">Ação</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm">
                            {studentsData.length > 0 ? (
                                studentsData.map((student) => (
                                    <tr key={student.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-all group">
                                        <td className="py-5 px-4">
                                            <div className="flex items-center gap-4">
                                                <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-700 border border-slate-200 uppercase text-xs">
                                                    {(student.profiles?.full_name || 'S').charAt(0)}
                                                </div>
                                                <span className="font-bold text-slate-900 text-sm tracking-tight">{student.profiles?.full_name}</span>
                                            </div>
                                        </td>
                                        <td className="py-5 px-4 text-slate-500 text-xs font-medium">{student.profiles?.email}</td>
                                        <td className="py-5 px-4 text-center">
                                            <span className="px-2.5 py-0.5 bg-slate-50 rounded-full text-[9px] font-black border border-slate-100 text-[#00C402] tracking-wider uppercase">
                                                {student.courseCount} {student.courseCount === 1 ? 'CURSO' : 'CURSOS'}
                                            </span>
                                        </td>
                                        <td className="py-5 px-4 text-[10px] text-slate-400 uppercase font-bold tracking-tight">
                                            {student.joinedAt ? new Date(student.joinedAt).toLocaleDateString('pt-BR') : '---'}
                                        </td>
                                        <td className="py-5 px-4 text-right">
                                            <Link href={`/dashboard-teacher/chat?userId=${student.id}`}>
                                                <button className="p-2.5 rounded-lg border border-slate-100 bg-white text-slate-400 hover:text-slate-900 hover:bg-slate-50 transition-all shadow-sm">
                                                    <MessageSquare size={16} />
                                                </button>
                                            </Link>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={5} className="py-20 text-center text-slate-300 italic font-medium uppercase tracking-widest text-[10px]">
                                        Nenhum aluno encontrado para os seus cursos.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}