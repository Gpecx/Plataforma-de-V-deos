"use client"

import { auth, db } from '@/lib/firebase'
import { onAuthStateChanged } from 'firebase/auth'
import { collection, query, where, getDocs, doc, getDoc, orderBy } from 'firebase/firestore'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Search, MessageSquare, ArrowUpDown, Loader2 } from 'lucide-react'
import Link from 'next/link'

export default function StudentsPage() {
    const router = useRouter()
    const [user, setUser] = useState<any>(null)
    const [studentsData, setStudentsData] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (!currentUser) {
                router.push('/login')
                return
            }
            setUser(currentUser)

            try {
                // 1. Buscamos os IDs dos cursos vinculados ao professor
                const coursesRef = collection(db, 'courses')
                const qCourses = query(coursesRef, where('teacher_id', '==', currentUser.uid))
                const coursesSnap = await getDocs(qCourses)
                const courseIds = coursesSnap.docs.map(doc => doc.id)

                if (courseIds.length > 0) {
                    // 2. Buscamos as matrículas filtrando por esses IDs de curso
                    // Nota: Firestore 'in' limit é 10/30. Se o professor tiver muitos cursos, 
                    // poderíamos precisar de múltiplas queries ou filtrar em memória se o volume for baixo.
                    // Para simplificar, buscamos todas as matrículas e filtramos em memória.
                    const enrollmentsSnap = await getDocs(collection(db, 'enrollments'))
                    const allEnrollments = enrollmentsSnap.docs
                        .map(doc => ({ id: doc.id, ...doc.data() as any }))
                        .filter(e => courseIds.includes(e.course_id))

                    // Agregamos por aluno para evitar duplicatas e buscamos perfis
                    const studentMap = new Map<string, any>()
                    const uniqueUserIds = Array.from(new Set(allEnrollments.map(e => e.user_id)))

                    // Buscamos os perfis necessários
                    const profilesMap = new Map<string, any>()
                    await Promise.all(uniqueUserIds.map(async (uid) => {
                        const profileSnap = await getDoc(doc(db, 'profiles', uid))
                        if (profileSnap.exists()) {
                            profilesMap.set(uid, profileSnap.data())
                        }
                    }))

                    allEnrollments.forEach((e: any) => {
                        const userId = e.user_id
                        const profileData = profilesMap.get(userId)
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

                    const data = Array.from(studentMap.values()).sort((a, b) =>
                        (a.profiles?.full_name || '').localeCompare(b.profiles?.full_name || '')
                    )
                    setStudentsData(data)
                }
            } catch (error) {
                console.error("Error loading students data:", error)
            } finally {
                setLoading(false)
            }
        })
        return () => unsubscribe()
    }, [router])

    const filteredStudents = studentsData.filter(student =>
        student.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.profiles?.email?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-[#F4F7F9]">
                <Loader2 className="animate-spin text-[#00C402]" size={48} />
            </div>
        )
    }

    if (!user) return null

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
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
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
                            {filteredStudents.length > 0 ? (
                                filteredStudents.map((student) => (
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