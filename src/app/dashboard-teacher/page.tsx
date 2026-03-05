"use client"

import { auth, db } from '@/lib/firebase'
import { onAuthStateChanged } from 'firebase/auth'
import { collection, doc, getDoc, getDocs, query, where, orderBy } from 'firebase/firestore'
import { parseFirebaseDate } from '@/lib/date-utils'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Plus, Users, Star, DollarSign, TrendingUp, Edit, MoreVertical, MessageSquare, Loader2 } from 'lucide-react'
import { SalesChart } from './components/SalesChart'

export default function TeacherDashboard() {
    const router = useRouter()
    const [user, setUser] = useState<any>(null)
    const [profile, setProfile] = useState<any>(null)
    const [courses, setCourses] = useState<any[]>([])
    const [chartData, setChartData] = useState<any[]>([])
    const [metrics, setMetrics] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (!currentUser) {
                router.push('/login')
                return
            }
            setUser(currentUser)

            try {
                // 1. Fetch Profile
                const profileSnap = await getDoc(doc(db, 'profiles', currentUser.uid))
                const profileData = profileSnap.data()
                setProfile(profileData)

                // 2. Fetch Teacher Courses
                const coursesRef = collection(db, 'courses')
                const qCourses = query(coursesRef, where('teacher_id', '==', currentUser.uid))
                const coursesSnap = await getDocs(qCourses)
                const teacherCourses = coursesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() as any }))
                setCourses(teacherCourses)

                const courseIds = teacherCourses.map(c => c.id)
                const coursesPriceMap = new Map(teacherCourses.map(c => [c.id, c.price || 0]))

                if (courseIds.length > 0) {
                    // 3. Fetch Enrollments for these courses
                    // Firestore 'in' limit is 10. If more than 10 courses, this might need batching. 
                    // For now, assuming reasonable number or fetching all and filtering in memory if necessary.
                    // But simpler to fetch all enrollments and check course_id in memory if 'in' is not viable.
                    // Let's fetch all enrollments for now (optimize later if needed)
                    const enrollmentsSnap = await getDocs(collection(db, 'enrollments'))
                    const allEnrollments = enrollmentsSnap.docs
                        .map(doc => ({ id: doc.id, ...doc.data() as any }))
                        .filter(e => courseIds.includes(e.course_id))

                    // Calculations
                    const now = new Date()
                    const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000))
                    const todayStart = new Date(now.setHours(0, 0, 0, 0))

                    const totalStudents = new Set(allEnrollments.map(e => e.user_id)).size
                    const monthlyRevenue = allEnrollments
                        .filter(e => {
                            const d = parseFirebaseDate(e.created_at)
                            return d ? d >= thirtyDaysAgo : false
                        })
                        .reduce((acc, e) => acc + (coursesPriceMap.get(e.course_id) || 0), 0)

                    const todaySales = allEnrollments
                        .filter(e => {
                            const d = parseFirebaseDate(e.created_at)
                            return d ? d >= todayStart : false
                        })
                        .reduce((acc, e) => acc + (coursesPriceMap.get(e.course_id) || 0), 0)

                    setMetrics([
                        { label: 'Receita Mensal', value: `R$ ${monthlyRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, icon: DollarSign, color: 'text-[#00C402]' },
                        { label: 'Total Alunos', value: totalStudents.toString(), icon: Users, color: 'text-blue-500' },
                        { label: 'Avaliação Média', value: '4.8', icon: Star, color: 'text-yellow-500' },
                        { label: 'Vendas Hoje', value: `R$ ${todaySales.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, icon: TrendingUp, color: 'text-purple-500' },
                    ])

                    // Chart Data
                    const last7DaysStrings = Array.from({ length: 7 }, (_, i) => {
                        const d = new Date()
                        d.setDate(d.getDate() - i)
                        return d.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '')
                    }).reverse()

                    const formattedChartData = last7DaysStrings.map(day => {
                        const salesForDay = allEnrollments.filter(e => {
                            const parsedDate = parseFirebaseDate(e.created_at)
                            if (!parsedDate) return false;
                            const saleDay = parsedDate.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '')
                            return saleDay === day
                        })
                        const totalValue = salesForDay.reduce((acc, s) => acc + (coursesPriceMap.get(s.course_id) || 0), 0)
                        return { name: day.charAt(0).toUpperCase() + day.slice(1), vendas: totalValue }
                    })
                    setChartData(formattedChartData)
                } else {
                    setMetrics([
                        { label: 'Receita Mensal', value: 'R$ 0,00', icon: DollarSign, color: 'text-[#00C402]' },
                        { label: 'Total Alunos', value: '0', icon: Users, color: 'text-blue-500' },
                        { label: 'Avaliação Média', value: '4.8', icon: Star, color: 'text-yellow-500' },
                        { label: 'Vendas Hoje', value: 'R$ 0,00', icon: TrendingUp, color: 'text-purple-500' },
                    ])
                    setChartData([])
                }
            } catch (error) {
                console.error("Error fetching teacher dashboard data:", error)
            } finally {
                setLoading(false)
            }
        })
        return () => unsubscribe()
    }, [router])

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-[#F4F7F9]">
                <Loader2 className="animate-spin text-[#00C402]" size={48} />
            </div>
        )
    }

    if (!user) return null

    const recentActivities = [
        { id: 1, user: 'Ana Silva', comment: 'Tenho uma dúvida sobre a aula 4...', date: 'há 2 horas' },
        { id: 2, user: 'João Pereira', comment: 'O material de apoio está excelente!', date: 'há 5 horas' },
        { id: 3, user: 'Maria Santos', comment: 'Não consegui baixar o certificado.', date: 'há 1 dia' },
    ]

    return (
        <div className="p-8 md:p-12 min-h-screen bg-[#F4F7F9] text-slate-800 font-exo border-t border-slate-100">
            {/* Header com Boas-vindas e Botão Criar */}
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-16 gap-8">
                <div>
                    <h1 className="text-4xl font-black tracking-tighter uppercase leading-none text-slate-700">
                        Bem-vindo, <span className="text-[#00C402]">{profile?.full_name || 'Professor'}!</span>
                    </h1>
                    <p className="text-slate-500 mt-2 font-bold uppercase text-[10px] tracking-[3px]">Gerencie seus cursos e acompanhe seus resultados com o Creator Studio.</p>
                </div>
                <Link href="/dashboard-teacher/courses/new">
                    <button className="flex items-center gap-3 bg-slate-900 text-white font-black uppercase tracking-widest px-10 py-5 rounded-2xl hover:bg-slate-800 transition shadow-lg shadow-slate-200 shrink-0 group">
                        <Plus size={20} strokeWidth={3} className="group-hover:rotate-90 transition-transform" />
                        Criar Novo Curso
                    </button>
                </Link>
            </header>

            {/* Grid de Métricas */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
                {metrics.map((metric, idx) => (
                    <div key={idx} className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm group">
                        <div className="flex justify-between items-start mb-6">
                            <div className={`p-4 rounded-2xl bg-slate-50 border border-slate-100 ${metric.color}`}>
                                <metric.icon size={22} />
                            </div>
                        </div>
                        <p className="text-slate-500 text-[10px] font-black uppercase tracking-[2px]">{metric.label}</p>
                        <h3 className="text-3xl font-black mt-1 tracking-tighter text-slate-700">{metric.value}</h3>
                    </div>
                ))}
            </div>

            {/* Gráfico de Desempenho */}
            <section className="bg-white p-10 rounded-[48px] border border-slate-100 mb-20 shadow-sm relative overflow-hidden group">
                <div className="relative z-10">
                    <div className="flex items-center justify-between mb-12">
                        <h2 className="text-2xl font-black uppercase tracking-tighter flex items-center gap-4 text-slate-700">
                            <TrendingUp size={24} className="text-[#00C402]" />
                            Desempenho de Vendas <span className="text-slate-300 font-bold text-sm tracking-widest ml-4">(ÚLTIMOS 7 DIAS)</span>
                        </h2>
                    </div>
                    <SalesChart data={chartData} />
                </div>
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
                {/* Seção: Meus Cursos (2 colunas) */}
                <section className="lg:col-span-2 space-y-10">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-6">
                        <h2 className="text-2xl font-black uppercase tracking-tighter text-slate-700">Meus Cursos</h2>
                        <Link href="/dashboard-teacher/courses" className="text-[10px] text-slate-500 hover:text-slate-700 font-black uppercase tracking-[3px] transition-colors">Ver todos os cursos</Link>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        {courses.length > 0 ? (
                            courses.map((curso) => (
                                <div key={curso.id} className="bg-white rounded-[40px] overflow-hidden border border-slate-100 hover:border-[#00C402]/40 transition-all group shadow-sm flex flex-col">
                                    <div className="relative h-60 bg-slate-50 overflow-hidden">
                                        <img
                                            src={curso.image_url || "https://images.unsplash.com/photo-1627398242454-45a1465c2479?w=400"}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                                            alt={curso.title}
                                        />
                                        <div className="absolute top-6 left-6">
                                            <span className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-[2px] shadow-sm backdrop-blur-md ${curso.status === 'published' ? 'bg-[#00C402] text-white' : 'bg-yellow-500 text-white'}`}>
                                                {curso.status === 'published' ? 'Publicado' : 'Rascunho'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="p-8 flex-grow flex flex-col">
                                        <h3 className="font-black text-2xl mb-4 tracking-tighter text-slate-700 line-clamp-1">{curso.title}</h3>
                                        <div className="flex items-center gap-6 text-[10px] text-slate-500 mb-8 font-black uppercase tracking-widest">
                                            <div className="flex items-center gap-2">
                                                <Users size={16} className="text-[#00C402]" />
                                                <span>450 Alunos</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Star size={16} className="text-yellow-500 fill-yellow-500" />
                                                <span>4.8 Rating</span>
                                            </div>
                                        </div>
                                        <Link href={`/dashboard-teacher/courses/${curso.id}/edit`} className="mt-auto">
                                            <button className="w-full flex items-center justify-center gap-3 bg-slate-50 hover:bg-slate-800 hover:text-white border border-slate-100 text-slate-700 font-black uppercase tracking-widest py-5 rounded-2xl transition-all duration-300">
                                                <Edit size={18} />
                                                Editar no Studio
                                            </button>
                                        </Link>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="col-span-full py-24 border-2 border-dashed border-slate-100 rounded-[48px] text-center bg-white">
                                <p className="text-slate-400 font-bold uppercase text-xs tracking-[4px]">O Studio está pronto. Comece criando seu primeiro treinamento!</p>
                            </div>
                        )}
                    </div>
                </section>

                {/* Seção: Dúvidas Recentes (1 coluna) */}
                <section className="space-y-10">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-6">
                        <h2 className="text-2xl font-black uppercase tracking-tighter text-slate-700">Dúvidas Inbox</h2>
                        <Link href="/dashboard-teacher/comments" className="text-[10px] text-slate-500 hover:text-slate-700 font-black uppercase tracking-[2px] transition-colors">Acessar Inbox</Link>
                    </div>

                    <div className="space-y-6">
                        {recentActivities.map((activity) => (
                            <div key={activity.id} className="bg-white p-7 rounded-[32px] border border-slate-100 hover:border-slate-200 transition-all flex gap-5 shadow-sm group">
                                <div className="h-14 w-14 rounded-2xl bg-slate-50 flex items-center justify-center shrink-0 border border-slate-100 group-hover:border-[#00C402]/30 transition-colors">
                                    <MessageSquare size={20} className="text-slate-400 group-hover:text-[#00C402] transition-colors" />
                                </div>
                                <div className="flex-grow min-w-0">
                                    <div className="flex justify-between items-start mb-2">
                                        <h4 className="font-black text-[11px] uppercase tracking-widest text-slate-800 truncate mr-2">{activity.user}</h4>
                                        <span className="text-[9px] font-bold text-slate-500 uppercase shrink-0">{activity.date}</span>
                                    </div>
                                    <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed font-medium italic">
                                        "{activity.comment}"
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            </div>
        </div>
    );
}
