"use client"

import { auth, db } from '@/lib/firebase'
import { onAuthStateChanged } from 'firebase/auth'
import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthProvider'
import { PlayCircle, CreditCard, BookOpen, Sparkles, Trophy, Users, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { AddToCartButton } from '@/components/AddToCartButton'
import { StudentCarousel } from '@/components/dashboard/StudentCarousel'
import { MyLearningSidebar } from '@/components/dashboard/MyLearningSidebar'

export default function StudentDashboard() {
    const router = useRouter()
    const { user, profile, role, loading: authLoading } = useAuth()

    const [meusCursos, setMeusCursos] = useState<any[]>([])
    const [cursosDisponiveis, setCursosDisponiveis] = useState<any[]>([])
    const [dataLoading, setDataLoading] = useState(true)

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login')
            return
        }

        // Se for professor ou admin tentando acessar o dashboard de aluno, redireciona
        if (!authLoading && user && (role === 'teacher' || role === 'admin')) {
            router.push('/dashboard-teacher')
            return
        }

        async function fetchDashboardData() {
            if (!user) return;

            try {
                // 1. Busca cursos disponíveis (seguro pela rule: status == 'published')
                const coursesQuery = query(collection(db, 'courses'), where('status', '==', 'published'))

                // 2. Busca matrículas do usuário logado
                const enrollmentsQuery = query(collection(db, 'enrollments'), where('user_id', '==', user.uid))

                const [allCoursesSnap, enrollmentsSnap] = await Promise.all([
                    getDocs(coursesQuery),
                    getDocs(enrollmentsQuery)
                ])

                const allCourses = allCoursesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() as any }))
                const enrolledIds = enrollmentsSnap.docs.map(doc => doc.data().course_id)

                setMeusCursos(allCourses.filter(c => enrolledIds.includes(c.id)))
                setCursosDisponiveis(allCourses.filter(c => !enrolledIds.includes(c.id)))

            } catch (error) {
                console.error("Error fetching dashboard data:", error)
            } finally {
                setDataLoading(false)
            }
        }

        if (user) {
            fetchDashboardData()
        }
    }, [user, authLoading, role, router])

    if (authLoading || dataLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-[#F4F7F9]">
                <Loader2 className="animate-spin text-[#00C402]" size={48} />
            </div>
        )
    }

    if (!user) return null

    return (
        <div className="p-8 md:p-12 xl:pr-72 min-h-screen bg-[#F4F7F9] text-slate-800 border-t border-slate-100 font-exo relative">

            {/* Sidebar de Progresso (Udemy Style) */}
            <MyLearningSidebar recentCourses={meusCursos} />

            {/* Header de Boas-vindas - Altura Reduzida */}
            <header className="mb-8">
                <div className="flex items-center gap-3 mb-1">
                    <span className="text-[9px] font-black uppercase tracking-[5px] text-[#00C402]">WORKSPACE STUDENT</span>
                </div>
                <h1 className="text-3xl font-black tracking-tighter text-slate-700">
                    BEM-VINDO, <span className="text-[#00C402] uppercase">{profile?.full_name?.split(' ')[0] || 'ALUNO'}!</span>
                </h1>
                <p className="text-slate-400 font-bold text-[10px] tracking-widest uppercase">Eleve sua carreira hoje.</p>
            </header>

            {/* Banner de Inspiração (Carrossel Dinâmico) */}
            <StudentCarousel />

            {/* Seção: Meus Cursos */}
            <section className="mb-24">
                <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-200/60">
                    <h2 className="text-xl font-black uppercase tracking-tighter flex items-center gap-3 text-slate-700">
                        <BookOpen size={20} className="text-[#00C402]" />
                        Seu Aprendizado
                    </h2>
                    <span className="text-[9px] font-black uppercase tracking-[2px] text-slate-400">{meusCursos.length} TREINAMENTOS ATIVOS</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {meusCursos.length > 0 ? (
                        meusCursos.map((curso) => (
                            <div key={curso.id} className="bg-white rounded-3xl overflow-hidden border border-slate-100 hover:border-[#00C402]/30 transition-all group shadow-sm hover:shadow-xl">
                                <div className="relative h-44 bg-slate-100">
                                    <img
                                        src={curso.image_url || "https://images.unsplash.com/photo-1627398242454-45a1465c2479?w=400"}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                                        alt={curso.title}
                                    />
                                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20 backdrop-blur-[2px]">
                                        <PlayCircle size={48} className="text-white drop-shadow-lg" />
                                    </div>
                                </div>
                                <div className="p-8">
                                    <h3 className="font-bold text-lg mb-4 tracking-tight text-slate-900 line-clamp-1 group-hover:text-[#00C402] transition">{curso.title}</h3>

                                    {/* Barra de Progresso com Popover Hover Effect */}
                                    <div className="relative group/progress mb-2">
                                        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                            <div className="bg-[#00C402] h-full" style={{ width: `45%` }}></div>
                                        </div>
                                        {/* Popover */}
                                        <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] font-black px-3 py-1.5 rounded-lg opacity-0 group-hover/progress:opacity-100 transition-opacity pointer-events-none shadow-xl">
                                            45% CONCLUÍDO
                                            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-900 rotate-45"></div>
                                        </div>
                                    </div>

                                    <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest text-[#00C402]">
                                        <span>Status</span>
                                        <span>45% COMPLETADO</span>
                                    </div>
                                    <Link href={`/classroom/${curso.id}`}>
                                        <button className="w-full mt-8 bg-slate-900 text-white font-bold uppercase tracking-widest py-4 rounded-2xl hover:bg-slate-800 transition shadow-sm">
                                            Acessar Aula
                                        </button>
                                    </Link>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="col-span-full py-20 border border-dashed border-slate-200 rounded-[32px] text-center bg-white/50">
                            <p className="text-slate-400 text-xs font-semibold uppercase tracking-widest">Sua estante está vazia. Comece algo novo hoje.</p>
                        </div>
                    )}
                </div>
            </section>

            {/* Seção Founders */}
            <section className="mb-24 bg-white rounded-[40px] border border-slate-100 p-12 overflow-hidden relative shadow-sm">
                <div className="absolute top-0 right-0 w-1/3 h-full opacity-5 pointer-events-none">
                    <img src="https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=600" alt="Tech" className="w-full h-full object-cover grayscale" />
                </div>
                <div className="relative z-10 flex flex-col md:flex-row gap-12 items-center">
                    <div className="flex -space-x-6">
                        <div className="w-24 h-24 rounded-full border-4 border-white shadow-xl overflow-hidden bg-slate-200">
                            <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200" alt="Founder 1" />
                        </div>
                        <div className="w-24 h-24 rounded-full border-4 border-white shadow-xl overflow-hidden bg-slate-200 translate-y-4">
                            <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200" alt="Founder 2" />
                        </div>
                    </div>
                    <div className="flex-1 text-center md:text-left">
                        <h2 className="text-2xl font-black uppercase tracking-tighter text-slate-800 mb-4 flex items-center justify-center md:justify-start gap-3">
                            <Trophy size={24} className="text-[#00C402]" />
                            Conteúdo Inovador SPCS Academy
                        </h2>
                        <p className="text-slate-500 font-medium italic text-sm leading-relaxed max-w-xl">
                            "Nossa missão nos Founders é garantir que cada aula seja uma ferramenta real de transformação. Unimos a precisão técnica dos relés de engenharia com a agilidade estratégica que o mercado exige."
                        </p>
                        <div className="mt-6 flex items-center justify-center md:justify-start gap-4">
                            <span className="text-[9px] font-black uppercase tracking-[3px] text-slate-400">FOUNDERS GROUP</span>
                            <div className="h-px w-12 bg-slate-200"></div>
                            <span className="text-[9px] font-black uppercase tracking-[3px] text-[#00C402]">ESTRATÉGIA & EXECUÇÃO</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* Seção: Vitrine de Cursos */}
            <section className="mb-20">
                <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-200/60">
                    <h2 className="text-xl font-black uppercase tracking-tighter flex items-center gap-3 text-slate-700">
                        <CreditCard size={20} className="text-[#00C402]" />
                        Recomendados para Você
                    </h2>
                    <span className="text-[9px] font-black uppercase tracking-[2px] text-slate-400">VITRINE SPCS ACADEMY</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {cursosDisponiveis.map((curso) => (
                        <div key={curso.id} className="bg-white rounded-3xl overflow-hidden border border-slate-100 hover:border-[#00C402]/30 transition-all flex flex-col group shadow-sm hover:shadow-lg">
                            <div className="relative h-48 overflow-hidden">
                                <img
                                    src={curso.image_url || "https://images.unsplash.com/photo-1558655146-d09347e92766?w=400"}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-all duration-700"
                                    alt={curso.title}
                                />
                                <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest text-[#00C402] border border-slate-100 shadow-sm">
                                    NEW
                                </div>
                            </div>
                            <div className="p-6 flex-grow flex flex-col justify-between">
                                <div className="mb-4">
                                    <h3 className="font-bold text-base mb-2 tracking-tight text-slate-900 line-clamp-1 group-hover:text-[#00C402] transition">{curso.title}</h3>
                                    <p className="text-slate-500 text-[10px] font-medium leading-relaxed line-clamp-2">{curso.description || 'Domine esta habilidade com o método SPCS Academy de alta performance.'}</p>
                                </div>
                                <div>
                                    <div className="flex items-center justify-between mb-6">
                                        <div className="flex flex-col">
                                            <span className="text-[7px] font-black uppercase text-slate-400 tracking-[2px]">Investimento</span>
                                            <span className="text-slate-900 font-black text-xl tracking-tighter">R$ 497,00</span>
                                        </div>
                                        <Link href={`/course/${curso.id}`} className="text-[8px] font-bold uppercase tracking-widest text-slate-400 hover:text-slate-900 transition underline underline-offset-4">
                                            Detalhes
                                        </Link>
                                    </div>

                                    <AddToCartButton
                                        course={{
                                            id: curso.id,
                                            title: curso.title,
                                            price: 497,
                                            image_url: curso.image_url
                                        }}
                                    />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    )
}
