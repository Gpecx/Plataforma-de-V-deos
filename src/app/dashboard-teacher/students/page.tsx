import { adminAuth, adminDb } from '@/lib/firebase-admin'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { Search, MessageSquare, ArrowUpDown, Users } from 'lucide-react'
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
        <div className="p-8 md:p-12 space-y-12 bg-transparent min-h-screen font-exo animate-in fade-in duration-500">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#1D5F31]"></div>
                        <span className="text-[10px] font-black uppercase tracking-[4px] text-slate-500">STUDENT MANAGEMENT</span>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-slate-900 uppercase leading-none">
                        Gestão de <span className="text-[#1D5F31]">Alunos</span>
                    </h1>
                    <p className="text-slate-600 mt-3 text-[10px] font-bold uppercase tracking-[3px] italic">Acompanhe o progresso de seus alunos e gerencie matrículas.</p>
                </div>
                <div className="flex gap-4 w-full md:w-auto">
                    <div className="relative flex-grow md:flex-initial group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 transition-colors group-focus-within:text-[#1D5F31]" size={16} />
                        <input
                            placeholder="Buscar aluno por nome..."
                            className="bg-white border border-slate-200 rounded-2xl px-12 py-4 text-xs text-slate-900 focus:border-[#1D5F31] placeholder:text-slate-600 outline-none transition-all w-full md:w-80 font-bold uppercase tracking-widest shadow-sm"
                        />
                    </div>
                </div>
            </header>

            <div className="bg-white border border-slate-200 rounded-[32px] p-8 shadow-xl overflow-hidden relative">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-100 text-[10px] font-black uppercase tracking-[0.2em] text-slate-600">
                                <th className="pb-6 px-4">Aluno <ArrowUpDown size={12} className="inline ml-2 opacity-30" /></th>
                                <th className="pb-6 px-4">E-mail</th>
                                <th className="pb-6 px-4 text-center">Cursos</th>
                                <th className="pb-6 px-4">Inscrição</th>
                                <th className="pb-6 px-4 text-right">Ação</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm">
                            {studentsData.length > 0 ? (
                                studentsData.map((student) => (
                                    <tr key={student.id} className="border-b border-slate-50 hover:bg-slate-50 transition-all group">
                                        <td className="py-6 px-4">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center font-black text-white border-2 border-white shadow-md uppercase text-xs">
                                                    {(student.profiles?.full_name || 'S').charAt(0)}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="font-black text-slate-900 text-sm tracking-tight uppercase group-hover:text-[#1D5F31] transition-colors">{student.profiles?.full_name}</span>
                                                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">ID: {student.id.substring(0, 8)}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-6 px-4 text-slate-500 text-xs font-bold">{student.profiles?.email}</td>
                                        <td className="py-6 px-4 text-center">
                                            <span className="px-3 py-1.5 bg-slate-50 rounded-lg text-[9px] font-black border border-slate-100 text-slate-900 tracking-[1px] uppercase shadow-sm">
                                                {student.courseCount} {student.courseCount === 1 ? 'UNIDADE' : 'UNIDADES'}
                                            </span>
                                        </td>
                                        <td className="py-6 px-4 text-[10px] text-slate-600 uppercase font-bold tracking-widest">
                                            {student.joinedAt ? new Date(student.joinedAt).toLocaleDateString('pt-BR') : '---'}
                                        </td>
                                        <td className="py-6 px-4 text-right">
                                            <Link href={`/dashboard-teacher/chat?userId=${student.id}`}>
                                                <button className="p-3 rounded-xl border border-slate-200 bg-white text-slate-600 hover:text-[#1D5F31] hover:border-[#1D5F31]/30 hover:shadow-md transition-all active:scale-90">
                                                    <MessageSquare size={18} strokeWidth={2.5} />
                                                </button>
                                            </Link>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={5} className="py-24 text-center">
                                        <div className="flex flex-col items-center gap-4">
                                            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center">
                                                <Users size={24} className="text-slate-300" />
                                            </div>
                                            <p className="text-slate-600 font-bold uppercase tracking-[3px] text-[10px]">Nenhum aluno identificado em sua base.</p>
                                        </div>
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
        <div className="p-8 md:p-12 space-y-12 bg-transparent min-h-screen text-slate-900 font-exo animate-in fade-in duration-500">
            <header>
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#1D5F31]"></div>
                    <span className="text-[10px] font-black uppercase tracking-[4px] text-slate-500">VACANT STUDIO</span>
                </div>
                <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-slate-900 uppercase">
                    Gestão de <span className="text-[#1D5F31]">Alunos</span>
                </h1>
            </header>
            <div className="bg-white border border-slate-200 rounded-[40px] p-24 text-center shadow-xl">
                <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner border border-slate-100">
                    <Users size={32} className="text-slate-200" />
                </div>
                <h3 className="text-xl font-black uppercase tracking-tighter text-slate-900 mb-2">Sua base de alunos está vazia</h3>
                <p className="text-slate-600 font-bold uppercase tracking-[3px] text-[10px] italic">
                    Publique seu primeiro curso para começar a atrair talentos.
                </p>
                <Link href="/dashboard-teacher/courses/new" className="inline-block mt-10 bg-[#1D5F31] text-white px-10 py-5 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-[#1D5F31]/10 hover:opacity-90 transition active:scale-95">
                    Criar meu Primeiro Curso
                </Link>
            </div>
        </div>
    )
}