import { adminAuth, adminDb } from '@/lib/firebase-admin'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { PlayCircle, BookOpen, Sparkles, Trophy, Users } from 'lucide-react'
import Link from 'next/link'
import { AddToCartButton } from '@/components/AddToCartButton'
import { StudentCarousel } from '@/components/dashboard/StudentCarousel'
import { StoreInitializer } from '@/components/dashboard/StoreInitializer'
import { parseFirebaseDate } from '@/lib/date-utils'
import { getBanners } from '@/app/admin/settings/actions'
import { ContinueLessonButton } from '@/components/dashboard/ContinueLessonButton'
import { BannerWrapper } from '@/components/ui/BannerWrapper'
import { CourseProgressBar } from '@/components/dashboard/CourseProgressBar'

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

    const [profileDoc, coursesSnapshot, enrollmentsSnapshot, lessonsSnapshot, banners] = await Promise.all([
        adminDb.collection('profiles').doc(user.uid).get(),
        adminDb.collection('courses').get(),
        adminDb.collection('enrollments').where('user_id', '==', user.uid).get(),
        adminDb.collection('lessons').get(),
        getBanners()
    ])

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
    const purchasedCourseIds = enrollmentsSnapshot.docs.map(doc => doc.data().course_id)

    const meusCursos = allCourses.filter(c => purchasedCourseIds.includes(c.id))
    const cursosDisponiveis = allCourses.filter(c => !purchasedCourseIds.includes(c.id))

    return (
        <div className="min-h-screen bg-white font-exo relative pb-16">
            <StoreInitializer purchasedCourseIds={purchasedCourseIds} />

            <BannerWrapper>
                <div className="absolute top-10 left-8 md:left-20 z-20 pointer-events-none">
                    <h1 className="text-3xl md:text-4xl lg:text-5xl font-black tracking-tighter !text-white uppercase shadow-lg">
                        Olá, <span className="!text-white bg-[#1D5F31] px-2 py-0.5 rounded-md">{profile?.full_name?.split(' ')[0] || 'Daniel'}!</span>
                    </h1>
                </div>
                <StudentCarousel heroBanners={banners.hero_dashboard} />
            </BannerWrapper>

            {/* 2. CONTEÚDO COM PADDING LATERAL E GRID FORTE */}
            <div className="px-6 md:px-12 mt-16 space-y-16 max-w-[1600px] mx-auto">

                {/* Seção: Meus Cursos (Seu Aprendizado) */}
                {meusCursos.length > 0 && (
                    <section>
                        <div className="flex items-center justify-between mb-10 pb-4 border-b-2 border-slate-900/5">
                            <h2 className="text-xl font-black uppercase tracking-tighter flex items-center gap-3 !text-black">
                                <BookOpen size={22} className="text-[#1D5F31]" />
                                Seu Aprendizado
                            </h2>
                            <span className="text-[10px] font-black uppercase tracking-[2px] !text-black bg-white border border-black px-4 py-2 rounded-xl shadow-sm">
                                {meusCursos.length} TREINAMENTOS
                            </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                            {meusCursos.map((curso) => {
                                const courseLessons = allLessons.filter((l: any) => l.course_id === curso.id)
                                const totalLessons = courseLessons.length
                                const completedLessons = 0 // TODO: Implement progress tracking
                                
                                return (
                                <div key={curso.id} className="group bg-white rounded-[24px] overflow-hidden border border-black transition-all duration-300 shadow-sm hover:shadow-xl hover:-translate-y-1 flex flex-col">
                                    <div className="relative h-48 bg-slate-100 overflow-hidden">
                                        <img
                                            src={curso.image_url || "https://images.unsplash.com/photo-1627398242454-45a1465c2479?w=400"}
                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                            alt={curso.title}
                                        />
                                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-[2px]">
                                            <PlayCircle size={48} className="text-white" />
                                        </div>
                                    </div>
                                    <div className="p-8 flex-1 flex flex-col">
                                        {/* TÍTULO DO CURSO - Garanti que está PRETO e VISÍVEL */}
                                        <h3 className="font-black text-lg mb-4 !text-black line-clamp-2 leading-tight uppercase group-hover:text-[#1D5F31] transition-colors">{curso.title}</h3>
                                        <div className="mt-auto space-y-4">
                                            <CourseProgressBar 
                                                completedLessons={completedLessons} 
                                                totalLessons={totalLessons} 
                                            />
                                            <ContinueLessonButton courseId={curso.id} />
                                        </div>
                                    </div>
                                </div>
                                )
                            })}
                        </div>
                    </section>
                )}

                {/* Seção Founders (Banner Centralizado) */}
                <section className="bg-white rounded-[32px] p-10 md:p-14 overflow-hidden relative shadow-xl border border-black">
                    <div className="relative z-10">
                        <div className="inline-flex items-center gap-3 px-4 py-2 bg-slate-100 rounded-xl mb-6 border border-black/10">
                            <Trophy size={18} className="text-[#1D5F31]" />
                            <span className="text-[10px] font-black text-[#1D5F31] uppercase tracking-widest">Excelência PowerPlay</span>
                        </div>
                        <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tighter !text-black mb-4">
                            Conteúdo <span className="opacity-60">Inovador</span>
                        </h2>
                        <p className="!text-black font-medium text-sm md:text-base leading-relaxed max-w-2xl opacity-90">
                            "Transformando a precisão técnica em resultados estratégicos para sua carreira."
                        </p>
                    </div>
                </section>

                {/* Seção: Vitrine (Recomendados) */}
                <section className="pb-20">
                    <div className="flex items-center justify-between mb-10 pb-4 border-b-2 border-slate-900/5">
                        <h2 className="text-xl font-black uppercase tracking-tighter flex items-center gap-3 !text-black">
                            <Sparkles size={22} className="text-[#1D5F31]" />
                            Recomendados para você
                        </h2>
                        <span className="hidden md:block text-[9px] font-black uppercase tracking-[3px] text-slate-900">Vitrine Exclusiva</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                        {cursosDisponiveis.map((curso) => (
                            <div key={curso.id} className="group bg-white rounded-[24px] overflow-hidden border border-black shadow-sm hover:shadow-2xl transition-all duration-500 flex flex-col">
                                <div className="relative h-48 overflow-hidden bg-slate-100">
                                    <img
                                        src={curso.image_url || "https://images.unsplash.com/photo-1558655146-d09347e92766?w=400"}
                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                        alt={curso.title}
                                    />
                                    <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-black shadow-sm">
                                        <span className="text-[8px] font-black text-[#1D5F31] tracking-widest uppercase">Lançamento</span>
                                    </div>
                                </div>

                                <div className="p-6 flex-grow flex flex-col">
                                    {/* TÍTULO DO CURSO - Garanti que está PRETO e VISÍVEL */}
                                    <h3 className="font-black text-base mb-2 !text-black uppercase leading-tight line-clamp-2 group-hover:text-[#1D5F31] transition-colors">{curso.title}</h3>
                                    <p className="!text-black text-[10px] font-black uppercase line-clamp-2 mb-6">
                                        {curso.description || 'Domine esta habilidade com o método PowerPlay.'}
                                    </p>

                                    <div className="mt-auto pt-4 border-t border-black flex items-center justify-between mb-4">
                                        <div className="flex flex-col">
                                            <span className="text-[8px] font-bold !text-black uppercase tracking-tighter">Investimento</span>
                                            <span className="!text-black font-black text-xl tracking-tight">
                                                R$ {Number(curso.price || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                            </span>
                                        </div>
                                        <Link href={`/course/${curso.id}`} className="p-2.5 bg-slate-50 border border-black rounded-xl !text-black hover:text-[#1D5F31] transition-colors">
                                            <Users size={18} />
                                        </Link>
                                    </div>
                                </div>

                                {/* Botão Carrinho - Encostado na borda inferior do card */}
                                <div className="w-full">
                                    <AddToCartButton
                                        course={{
                                            id: curso.id,
                                            title: curso.title,
                                            price: Number(curso.price || 0),
                                            image_url: curso.image_url
                                        }}
                                        purchasedCourseIds={purchasedCourseIds}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            </div>
        </div>
    )
}