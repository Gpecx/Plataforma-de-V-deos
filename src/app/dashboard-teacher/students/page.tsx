import { adminAuth, adminDb } from '@/lib/firebase-admin'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { Search, MessageSquare, ArrowUpDown } from 'lucide-react'
import Link from 'next/link'
import { parseFirebaseDate } from '@/lib/date-utils'

export default async function StudentsPage() {
    const cookieStore = cookies()
    const token = (await cookieStore).get('firebase-token')?.value
    if (!token) redirect('/login')

    let decodedToken
    try {
        decodedToken = await adminAuth.verifyIdToken(token)
    } catch (error) {
        redirect('/login')
    }

    const teacherId = decodedToken.uid

    // 1. Buscamos os cursos deste professor
    const coursesSnapshot = await adminDb.collection('courses')
        .where('teacher_id', '==', teacherId)
        .get()

    const courseIds = coursesSnapshot.docs.map(doc => doc.id)

    if (courseIds.length === 0) {
        return <NoStudents />
    }

    // 2. Buscamos as matrículas para esses cursos (em chunks de 10 porque Firestore 'in' limita a 10)
    const courseChunks = []
    for (let i = 0; i < courseIds.length; i += 10) {
        courseChunks.push(courseIds.slice(i, i + 10))
    }

    const enrollmentPromises = courseChunks.map(chunk =>
        adminDb.collection('enrollments')
            .where('course_id', 'in', chunk)
            .get()
    )

    const enrollmentSnapshots = await Promise.all(enrollmentPromises)
    const enrollments = enrollmentSnapshots.flatMap(snap =>
        snap.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }))
    ).sort((a: any, b: any) => {
        const dateA = parseFirebaseDate(a.created_at)?.getTime() || 0
        const dateB = parseFirebaseDate(b.created_at)?.getTime() || 0
        return (dateB as any) - (dateA as any)
    })

    // 3. Extraímos os user_ids únicos (removendo nulos/indefinidos)
    const userIds = Array.from(new Set(enrollments.map((e: any) => e.user_id).filter(id => !!id)))

    // 4. Buscamos perfis (em chunks de 10 porque Firestore 'in' limita a 10)
    let profiles: any[] = []
    if (userIds.length > 0) {
        // Para simplificar agora, assumimos menos de 10 ou fazemos um loop
        const userChunks = []
        for (let i = 0; i < userIds.length; i += 10) {
            userChunks.push(userIds.slice(i, i + 10))
        }

        const profilePromises = userChunks.map(chunk =>
            adminDb.collection('profiles').where('__name__', 'in', chunk).get()
        )
        const profileSnapshots = await Promise.all(profilePromises)
        profiles = profileSnapshots.flatMap(snap => snap.docs.map(doc => ({ id: doc.id, ...doc.data() })))
    }

    const profileMap = new Map(profiles.map(p => [p.id, p]))

    const studentMap = new Map<string, any>()
    enrollments.forEach((e: any) => {
        const userId = e.user_id
        const profileData = profileMap.get(userId)

        const existing = studentMap.get(userId)
        if (existing) {
            existing.courseCount++
        } else {
            studentMap.set(userId, {
                id: userId,
                profiles: {
                    full_name: profileData?.full_name || 'Aluno Sem Perfil',
                    email: profileData?.email || 'N/A'
                },
                joinedAt: parseFirebaseDate(e.created_at),
                courseCount: 1
            })
        }
    })

    const studentsData = Array.from(studentMap.values()).sort((a, b) =>
        (a.profiles?.full_name || '').localeCompare(b.profiles?.full_name || '')
    )

    return (
        <div className="p-8 md:p-12 space-y-12 bg-transparent min-h-screen text-white/90 border-t border-white/5 font-exo">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="text-2xl font-black tracking-tighter text-white">
                        GESTÃO DE <span className="text-[#1D5F31]">ALUNOS</span>
                    </h1>
                    <p className="text-white/80 mt-1 text-sm font-medium">Acompanhe o progresso de seus alunos e gerencie matrículas.</p>
                </div>
                <div className="flex gap-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={14} />
                        <input
                            placeholder="Buscar aluno..."
                            className="bg-white/5 border border-white/10 rounded-none px-10 py-2.5 text-xs text-white focus:border-[#1D5F31] placeholder:text-white/50 outline-none transition-all w-64 font-bold uppercase tracking-widest"
                        />
                    </div>
                </div>
            </header>

            <div className="bg-[#061629] border border-[#1D5F31] rounded-none p-6 space-y-6 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-white/10 text-[10px] font-black uppercase tracking-[0.2em] text-white">
                                <th className="pb-5 px-4 font-black">Aluno <ArrowUpDown size={12} className="inline ml-1 opacity-50" /></th>
                                <th className="pb-5 px-4 font-black">E-mail</th>
                                <th className="pb-5 px-4 text-center font-black">Cursos</th>
                                <th className="pb-5 px-4 font-black">Inscrição</th>
                                <th className="pb-5 px-4 text-right font-black">Ação</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm">
                            {studentsData.length > 0 ? (
                                studentsData.map((student) => (
                                    <tr key={student.id} className="border-b border-white/5 hover:bg-white/5 transition-all group">
                                        <td className="py-5 px-4">
                                            <div className="flex items-center gap-4">
                                                <div className="w-9 h-9 rounded-none bg-white/10 flex items-center justify-center font-bold text-white border border-white/20 uppercase text-xs">
                                                    {(student.profiles?.full_name || 'S').charAt(0)}
                                                </div>
                                                <span className="font-bold text-white text-sm tracking-tight">{student.profiles?.full_name}</span>
                                            </div>
                                        </td>
                                        <td className="py-5 px-4 text-white text-xs font-bold">{student.profiles?.email}</td>
                                        <td className="py-5 px-4 text-center">
                                            <span className="px-2.5 py-1 bg-[#1D5F31] rounded-none text-[9px] font-black border border-[#1D5F31] text-white tracking-[0.1em] uppercase shadow-sm">
                                                {student.courseCount} {student.courseCount === 1 ? 'CURSO' : 'CURSOS'}
                                            </span>
                                        </td>
                                        <td className="py-5 px-4 text-[10px] text-white uppercase font-black tracking-tight">
                                            {student.joinedAt ? new Date(student.joinedAt).toLocaleDateString('pt-BR') : '---'}
                                        </td>
                                        <td className="py-5 px-4 text-right">
                                            <Link href={`/dashboard-teacher/chat?userId=${student.id}`}>
                                                <button className="p-2.5 rounded-none border-2 border-[#1D5F31] bg-[#1D5F31] text-white hover:bg-[#1D5F31]/90 transition-all shadow-md">
                                                    <MessageSquare size={16} strokeWidth={3} />
                                                </button>
                                            </Link>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={5} className="py-20 text-center text-white/30 italic font-medium uppercase tracking-widest text-[10px]">
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

function NoStudents() {
    return (
        <div className="p-8 md:p-12 space-y-12 bg-transparent min-h-screen text-white/90 border-t border-white/5 font-exo">
            <header>
                <h1 className="text-2xl font-black tracking-tighter text-white uppercase">
                    GESTÃO DE <span className="text-[#1D5F31]">ALUNOS</span>
                </h1>
            </header>
            <div className="bg-[#061629] border border-[#1D5F31] rounded-none p-20 text-center shadow-sm">
                <p className="text-white/30 italic font-medium uppercase tracking-widest text-[10px]">
                    Você ainda não possui cursos ou alunos cadastrados.
                </p>
                <Link href="/dashboard-teacher/courses" className="inline-block mt-6 text-[10px] font-black uppercase tracking-[3px] text-[#1D5F31] hover:underline">
                    Criar meu Primeiro Curso
                </Link>
            </div>
        </div>
    )
}