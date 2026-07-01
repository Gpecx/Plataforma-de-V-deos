import { adminAuth, adminDb } from '@/lib/firebase-admin'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { PlayCircle, BookOpen, Sparkles, Trophy, Clock, Lock, Radio, Calendar } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { StudentCarousel } from '@/components/dashboard/StudentCarousel'
import { StoreInitializer } from '@/components/dashboard/StoreInitializer'
import { parseFirebaseDate } from '@/lib/date-utils'
import { getBanners } from '@/app/admin/settings/actions'
import { ContinueLessonButton } from '@/components/dashboard/ContinueLessonButton'
import { BannerWrapper } from '@/components/ui/BannerWrapper'
import { CourseProgressBar } from '@/components/dashboard/CourseProgressBar'
import { ProgressInitializer } from '@/components/dashboard/ProgressInitializer'
import { getStudentStats } from './actions'

export default async function StudentDashboard() {
    const cookieStore = await cookies()
    const token = cookieStore.get('session')?.value

    if (!token) {
        redirect('/login')
    }

    let user;
    try {
        user = await adminAuth.verifySessionCookie(token, true)
    } catch (error) {
        redirect('/login')
    }

    const [profileDoc, coursesSnapshot, enrollmentsSnapshot, lessonsSnapshot, banners, statsResult] = await Promise.all([
        adminDb.collection('profiles').doc(user.uid).get(),
        adminDb.collection('courses').get(),
        adminDb.collection('enrollments').where('user_id', '==', user.uid).get(),
        adminDb.collection('lessons').get(),
        getBanners(),
        getStudentStats()
    ])

    const stats = statsResult.success ? statsResult.data : { 
        concludedCount: 0, 
        totalEnrollments: 0, 
        studyTime: { hours: 0, minutes: 0 }, 
        streak: 0 
    }

    const profile = profileDoc.data()
    const allCourses = coursesSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
            id: doc.id,
            ...data,
            created_at: parseFirebaseDate(data.created_at)?.toISOString() || data.created_at,
            updated_at: parseFirebaseDate(data.updated_at)?.toISOString() || data.updated_at
        };
    }) as any[]
    const allLessons = lessonsSnapshot.docs.map(doc => doc.data()) as any[]

    const now = new Date()
    // FASE 2: Exclui enrollments com status de expirado/cancelado (para não mostrar cards no dashboard)
    const activeEnrollments = enrollmentsSnapshot.docs.filter(doc => {
        const data = doc.data()
        const status = data.status || ''
        if (status === 'expired' || status === 'canceled' || status === 'overdue') return false
        if (!data.expiresAt) return true
        const expiresAt = data.expiresAt.toDate ? data.expiresAt.toDate() : new Date(data.expiresAt)
        return expiresAt > now
    })

    const purchasedCourseIds = activeEnrollments.map(doc => doc.data().course_id)
    const enrollmentStatusMap: Record<string, string> = {}
    const expiresAtMap: Record<string, string> = {}
    activeEnrollments.forEach(doc => {
        const data = doc.data()
        if (data.course_id) {
            enrollmentStatusMap[data.course_id] = data.status || 'active'
            if (data.expiresAt) {
                const d = data.expiresAt.toDate ? data.expiresAt.toDate() : new Date(data.expiresAt)
                expiresAtMap[data.course_id] = d.toLocaleDateString('pt-BR')
            }
        }
    })
    
    const userProgressMap: Record<string, { completedLessons: string[], totalLessons: number }> = {}
    activeEnrollments.forEach(doc => {
        const data = doc.data()
        const courseId = data.course_id
        if (courseId) {
            const courseLessons = allLessons.filter((l: any) => l.course_id === courseId)
            userProgressMap[courseId] = {
                completedLessons: data.completed_lessons || [],
                totalLessons: courseLessons.length
            }
        }
    })

    const courseLessonsCount: Record<string, number> = {}
    allLessons.forEach((lesson: any) => {
        if (lesson.course_id) {
            courseLessonsCount[lesson.course_id] = (courseLessonsCount[lesson.course_id] || 0) + 1
        }
    })

    const meusCursos = allCourses.filter(c => purchasedCourseIds.includes(c.id))
    const cursosDisponiveis = allCourses.filter(c => !purchasedCourseIds.includes(c.id) && c.status === 'APROVADO')

    return (
        <div className="bg-[#F5F5F7] text-slate-900 font-montserrat min-h-full flex flex-col">
            <StoreInitializer purchasedCourseIds={purchasedCourseIds} />
            <ProgressInitializer 
                purchasedCourseIds={purchasedCourseIds}
                courseLessonsCount={courseLessonsCount}
            />

            <BannerWrapper>
                <div className="absolute top-10 left-8 md:left-20 z-20 pointer-events-none">
                    <h1 className="text-2xl md:text-3xl font-bold tracking-tighter !text-white uppercase max-w-xl">
                        Olá, <span className="!text-white bg-[#1D5F31] px-2 py-0.5 rounded-md">{profile?.full_name?.split(' ')[0] || 'Daniel'}!</span>
                    </h1>
                </div>
                <StudentCarousel heroBanners={banners.hero_dashboard} />
            </BannerWrapper>

            {/* 2. CONTEÚDO COM PADDING LATERAL E GRID FORTE */}
            <div className="px-4 md:px-12 mt-10 md:mt-16 space-y-10 md:space-y-16 max-w-[1600px] mx-auto">

                {/* Seção: Meus Cursos (Seu Aprendizado) */}
                {meusCursos.length > 0 && (
                    <section>
                        <div className="flex items-center justify-between mb-10 pb-4 border-b-2 border-slate-900/5">
                            <h2 className="text-xl font-bold uppercase tracking-tight flex items-center gap-3">
                                <BookOpen size={22} className="text-[#1D5F31]" />
                                Seu Aprendizado
                            </h2>
                            <span className="text-sm font-bold uppercase tracking-tight bg-white border border-black px-4 py-2 rounded-xl shadow-sm">
                                {meusCursos.length} TREINAMENTOS
                            </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                            {meusCursos.map((curso) => {
                                const courseLessons = allLessons.filter((l: any) => l.course_id === curso.id).sort((a: any, b: any) => (a.position || 0) - (b.position || 0))
                                const totalLessons = courseLessons.length
                                const progress = userProgressMap[curso.id] || { completedLessons: [], totalLessons }
                                const completedLessons = progress.completedLessons.length

                                const nextLesson = courseLessons.find((lesson: any) => !progress.completedLessons.includes(lesson.id))
                                const nextLessonId = nextLesson?.id || courseLessons[courseLessons.length - 1]?.id
                                
                                const isPending = enrollmentStatusMap[curso.id] === 'pending'
                                
                                return (
                                <div key={curso.id} className={`group bg-white rounded-xl overflow-hidden border border-gray-200 transition-all duration-300 shadow-sm flex flex-col ${isPending ? 'opacity-85 saturate-50' : 'hover:shadow-xl hover:-translate-y-1'}`}>
                                    <div className="relative h-48 bg-slate-100 overflow-hidden">
                                        <Image
                                            src={curso.image_url || "https://images.unsplash.com/photo-1627398242454-45a1465c2479?w=400"}
                                            fill
                                            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 25vw"
                                            className="object-cover transition-transform duration-700"
                                            alt={curso.title}
                                        />
                                        {isPending ? (
                                            <>
                                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center backdrop-blur-[2px]">
                                                    <div className="flex flex-col items-center gap-2">
                                                        <Lock size={32} className="text-white/90" />
                                                        <span className="text-white text-[10px] font-bold uppercase tracking-widest">Aguardando Pagamento</span>
                                                    </div>
                                                </div>
                                                <div className="absolute top-3 left-3 bg-amber-500 text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-md shadow-md">
                                                    Aguardando Compensação
                                                </div>
                                            </>
                                        ) : (
                                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-[2px]">
                                                <PlayCircle size={48} className="text-white" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="p-6 md:p-8 flex-1 flex flex-col">
                                        <h3 className={`font-bold text-lg mb-4 line-clamp-2 leading-tight uppercase transition-colors ${isPending ? '' : 'group-hover:text-[#1D5F31]'}`}>{curso.title}</h3>
                                        <div className="mt-auto space-y-4">
                                            {isPending ? (
                                                <>
                                                    <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                                        <div className="h-full bg-slate-300 rounded-full" style={{ width: '0%' }}></div>
                                                    </div>
                                                    <button disabled className="w-full bg-slate-200 !text-slate-700 font-bold uppercase text-[11px] tracking-widest py-4 rounded-xl cursor-not-allowed shadow-none">
                                                        Aguardando Pagamento
                                                    </button>
                                                </>
                                            ) : (
                                                <>
                                                    <CourseProgressBar 
                                                        completedLessons={completedLessons} 
                                                        totalLessons={totalLessons} 
                                                    />
                                                    <ContinueLessonButton courseId={curso.id} lessonId={nextLessonId} />
                                                    {expiresAtMap[curso.id] && (
                                                        <p className="text-[10px] font-mono text-slate-400 uppercase tracking-wider text-center">
                                                            Acesso válido até: {expiresAtMap[curso.id]}
                                                        </p>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                )
                            })}
                        </div>
                    </section>
                )}

                {/* Seção: Lives (Ao Vivo e Em Breve) */}
                <section>
                    <div className="flex items-center justify-between mb-10 pb-4 border-b-2 border-slate-900/5">
                        <h2 className="text-xl font-bold uppercase tracking-tight flex items-center gap-3">
                            <Radio size={22} className="text-[#1D5F31]" />
                            Ao Vivo & Em Breve
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {/* Mock Live Ao Vivo */}
                        <Link href={"/dashboard-student/live/1" as any} className="group relative bg-white rounded-xl overflow-hidden border-2 border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.2)] hover:shadow-[0_0_25px_rgba(239,68,68,0.4)] hover:-translate-y-1 transition-all duration-300 flex flex-col">
                            <div className="relative h-48 bg-slate-900 overflow-hidden flex items-center justify-center">
                                <div className="absolute top-3 left-3 z-10 flex items-center gap-2 bg-red-600 text-white px-3 py-1.5 rounded-md shadow-md">
                                    <span className="relative flex h-2 w-2 mr-1">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                                    </span>
                                    <span className="text-[10px] font-bold uppercase tracking-widest">Ao Vivo</span>
                                </div>
                                <Radio size={48} className="text-white/20" />
                                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent opacity-80" />
                            </div>
                            <div className="p-6 md:p-8 flex-1 flex flex-col relative">
                                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Formação PowerPlay</div>
                                <h3 className="font-bold text-lg mb-2 line-clamp-2 leading-tight uppercase group-hover:text-red-600 transition-colors">Aula de Revisão - Módulo 1</h3>
                                <p className="text-sm font-medium text-slate-600 mb-6">Prof. PowerPlay</p>
                                
                                <div className="mt-auto">
                                    <button className="w-full bg-red-600 text-white font-bold uppercase text-[11px] tracking-widest py-4 rounded-xl shadow-lg shadow-red-600/20 group-hover:bg-red-700 transition-colors">
                                        Assistir Agora
                                    </button>
                                </div>
                            </div>
                        </Link>

                        {/* Mock Live Agendada */}
                        <div className="group bg-white rounded-xl overflow-hidden border border-gray-200 transition-all duration-300 shadow-sm flex flex-col">
                            <div className="relative h-48 bg-slate-100 overflow-hidden flex items-center justify-center">
                                <div className="absolute top-3 left-3 z-10 bg-amber-500 text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-md shadow-md">
                                    Em Breve
                                </div>
                                <Calendar size={48} className="text-slate-300" />
                            </div>
                            <div className="p-6 md:p-8 flex-1 flex flex-col">
                                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Bônus Exclusivos</div>
                                <h3 className="font-bold text-lg mb-2 line-clamp-2 leading-tight uppercase group-hover:text-[#1D5F31] transition-colors">Mentoria de Carreira</h3>
                                <p className="text-sm font-medium text-slate-600 mb-4">Prof. Mentor</p>
                                
                                <div className="flex items-center gap-2 mb-6">
                                    <Clock size={14} className="text-amber-600" />
                                    <span className="text-xs font-bold text-amber-700 uppercase tracking-widest">Em 2 dias</span>
                                    <span className="text-xs text-slate-400 font-medium ml-auto">15/08/2026 às 19:00</span>
                                </div>
                                
                                <div className="mt-auto">
                                    <button className="w-full border-2 border-[#1D5F31] text-[#1D5F31] hover:bg-[#1D5F31] hover:text-white font-bold uppercase text-[11px] tracking-widest py-3.5 rounded-xl transition-colors">
                                        Lembrar-me
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Seção Founders (Banner Centralizado) */}
                <section className="bg-white rounded-xl p-6 sm:p-10 md:p-14 overflow-hidden relative shadow-xl border border-gray-200">
                    <div className="relative z-10">
                        <div className="inline-flex items-center gap-3 px-4 py-2 bg-slate-100 rounded-xl mb-6 border border-black/10">
                            <Trophy size={18} className="text-[#1D5F31]" />
                            <span className="text-sm font-bold text-[#1D5F31] uppercase tracking-tight">Excelência PowerPlay</span>
                        </div>
                        <h2 className="text-3xl md:text-4xl font-bold uppercase tracking-tighter mb-4">
                            Conteúdo <span className="opacity-60">Inovador</span>
                        </h2>
                        <p className="font-medium text-sm md:text-base leading-relaxed max-w-2xl !text-slate-600">
                            "Transformando a precisão técnica em resultados estratégicos para sua carreira."
                        </p>
                    </div>
                </section>

                {/* Seção: Metas de Acessos e Estudos */}
                <section className="pb-20">
                    <div className="flex items-center justify-between mb-10 pb-4 border-b-2 border-slate-900/5">
                        <h2 className="text-xl font-bold uppercase tracking-tight flex items-center gap-3">
                            <Trophy size={22} className="text-[#1D5F31]" />
                            Metas de Acessos e Estudos
                        </h2>
                        <span className="hidden md:block text-sm font-bold uppercase tracking-tight text-slate-900">Seu Desempenho</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <Card className="border-gray-200 rounded-xl transition-all duration-300 shadow-sm hover:shadow-xl hover:-translate-y-1 flex flex-col bg-white">
                            <CardHeader className="p-6 md:p-8 pb-0">
                                <div className="flex items-center gap-4 mb-2">
                                    <div className="p-3 bg-[#1D5F31]/10 rounded-xl">
                                        <Clock size={24} className="text-[#1D5F31]" />
                                    </div>
                                    <CardTitle className="text-sm font-bold text-black uppercase tracking-tight">Tempo de Estudo</CardTitle>
                                </div>
                            </CardHeader>
                            <CardContent className="p-6 md:p-8 pt-4 flex-grow flex flex-col justify-end">
                                <div className="text-4xl font-black text-black mb-2 leading-none">
                                    {stats?.studyTime?.hours ?? 0}h {stats?.studyTime?.minutes ?? 0}m
                                </div>
                                <p className="text-xs font-bold !text-slate-600 uppercase tracking-widest leading-relaxed">Total acumulado na plataforma</p>
                                <div className="mt-6 w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                    <div 
                                        className="h-full bg-[#1D5F31] rounded-full opacity-30" 
                                        style={{ width: `${Math.min(((stats?.studyTime?.hours ?? 0) / 100) * 100, 100)}%` }}
                                    ></div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-gray-200 rounded-xl transition-all duration-300 shadow-sm hover:shadow-xl hover:-translate-y-1 flex flex-col bg-white">
                            <CardHeader className="p-8 pb-0">
                                <div className="flex items-center gap-4 mb-2">
                                    <div className="p-3 bg-[#1D5F31]/10 rounded-xl">
                                        <BookOpen size={24} className="text-[#1D5F31]" />
                                    </div>
                                    <CardTitle className="text-sm font-bold text-black uppercase tracking-tight">Cursos Concluídos</CardTitle>
                                </div>
                            </CardHeader>
                            <CardContent className="p-8 pt-4 flex-grow flex flex-col justify-end">
                                <div className="text-4xl font-black text-black mb-2 leading-none">{stats?.concludedCount ?? 0}/{stats?.totalEnrollments ?? 0}</div>
                                <p className="text-xs font-bold !text-slate-600 uppercase tracking-widest leading-relaxed">Treinamentos finalizados</p>
                                <div className="mt-6 w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                    <div 
                                        className="h-full bg-[#1D5F31] rounded-full transition-all duration-1000" 
                                        style={{ width: `${(stats?.totalEnrollments ?? 0) > 0 ? ((stats?.concludedCount ?? 0) / (stats?.totalEnrollments ?? 1)) * 100 : 0}%` }}
                                    ></div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-gray-200 rounded-xl transition-all duration-300 shadow-sm hover:shadow-xl hover:-translate-y-1 flex flex-col bg-white">
                            <CardHeader className="p-8 pb-0">
                                <div className="flex items-center gap-4 mb-2">
                                    <div className="p-3 bg-[#1D5F31]/10 rounded-xl">
                                        <Sparkles size={24} className="text-[#1D5F31]" />
                                    </div>
                                    <CardTitle className="text-sm font-bold text-black uppercase tracking-tight">Dias Seguidos</CardTitle>
                                </div>
                            </CardHeader>
                            <CardContent className="p-8 pt-4 flex-grow flex flex-col justify-end">
                                <div className="text-4xl font-black text-black mb-2 leading-none">{stats?.streak ?? 0} {(stats?.streak ?? 0) === 1 ? 'dia' : 'dias'}</div>
                                <p className="text-xs font-bold !text-slate-600 uppercase tracking-widest leading-relaxed">Frequência de acesso consecutiva</p>
                                <div className="mt-6 flex gap-1">
                                    {[1, 2, 3, 4, 5, 6, 7].map((d) => (
                                        <div 
                                            key={d} 
                                            className={`flex-1 h-1.5 rounded-full ${d <= (stats?.streak ?? 0) ? 'bg-[#1D5F31]' : 'bg-slate-100'}`}
                                        ></div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </section>
            </div>
        </div>
    )
}