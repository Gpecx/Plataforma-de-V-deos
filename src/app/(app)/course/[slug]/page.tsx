import { notFound } from "next/navigation"
import Link from "next/link"
import Navbar from "@/components/Navbar"
import { MotivationalBanner } from "@/components/MotivationalBanner"
import {
    CheckCircle2,
    PlayCircle,
    Clock,
    ShieldCheck,
    ArrowLeft,
    ArrowRight,
    Globe,
    Info,
    FileText,
} from "lucide-react"
import { CourseIntroPlayer } from "@/components/CourseIntroPlayer"
import { CourseActionButton } from "@/components/CourseActionButton"
import { adminDb } from "@/lib/firebase-admin"
import { getProfile } from "@/app/(app)/dashboard-student/actions"
import { getSessionUser } from "@/app/actions/auth"

export default async function CourseDetailPage({ params }: { params: { slug: string } }) {
    const { slug } = await params

    // 1. Busca o curso por ID
    let course: any = null
    try {
        const courseSnap = await adminDb.collection('courses').doc(slug).get()

        if (courseSnap.exists) {
            const data = courseSnap.data() as any
            course = {
                id: courseSnap.id,
                ...data,
                teacher_name: data.teacher_name || 'Equipe PowerPlay',
                created_at: data.created_at?.toDate?.()?.toISOString() || data.created_at,
                updated_at: data.updated_at?.toDate?.()?.toISOString() || data.updated_at
            }
        }
    } catch (error) {
        console.error("Erro ao buscar curso:", error)
    }

    if (!course) return notFound()

    // 2. Verifica permissão de acesso
    const sessionUser = await getSessionUser()
    const profileRes = await getProfile()
    const profile = profileRes.success ? profileRes.data : null
    const isAdmin = profile?.role === 'admin'
    const isTeacher = course.teacher_id === sessionUser?.uid
    
    // Verifica se o curso está aprovado ou se o usuário tem permissão
    if (course.status !== 'APROVADO' && !isAdmin && !isTeacher) {
        return notFound()
    }
    
    // Busca na coleção de enrollments (fonte de verdade)
    let hasEnrollment = false
    if (sessionUser?.uid) {
        const enrollSnap = await adminDb.collection('enrollments')
            .where('user_id', '==', sessionUser.uid)
            .where('course_id', '==', course.id)
            .get()
        hasEnrollment = !enrollSnap.empty
    }

    const hasAccess = isAdmin || hasEnrollment || (profile?.cursos_comprados && profile.cursos_comprados.includes(course.id))

    // 3. Busca as lições
    let lessons: any[] = []
    try {
        const lessonsSnap = await adminDb.collection('lessons')
            .where('course_id', '==', slug)
            .get()

        lessons = lessonsSnap.docs.map(d => {
            const lData = d.data()
            return {
                id: d.id,
                ...lData,
                created_at: lData.created_at?.toDate?.()?.toISOString() || lData.created_at
            }
        }).sort((a: any, b: any) => (a.position || 0) - (b.position || 0))
    } catch (error) {
        console.error("Erro ao buscar lições:", error)
    }

    const curriculum = [{ title: "Grade Curricular Completa", lessons: lessons || [] }]
    const totalLessons = lessons?.length || 0

    return (
        <div className="min-h-screen bg-transparent text-[#061629] font-exo">
            <Navbar light={true} />

            {/* HERO & VIDEO SECTION - BORDAS QUADRADAS E ALINHAMENTO RIGOROSO */}
            <section className="relative pt-4 md:pt-6 pb-0 overflow-hidden">
                <div className="max-w-[1600px] mx-auto w-full px-6 md:px-12">
                    {/* INFO E TÍTULO */}
                    <div className="pb-6 space-y-4">
                        <Link
                            href="/course"
                            className="inline-flex items-center gap-2 mt-4 text-[#061629] hover:text-[#1D5F31] transition text-[10px] font-black uppercase tracking-[3px]"
                        >
                            <ArrowLeft size={14} />
                            Voltar ao Catálogo
                        </Link>

                        <div className="flex items-center gap-3">
                            <span className="inline-block bg-[#1D5F31] text-white text-[9px] font-black px-3 py-1.5 uppercase tracking-[3px] rounded-xl no-theme-override">
                                {course.tag || "PREMIUM"}
                            </span>
                        </div>

                        <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-[#061629] leading-[0.85] uppercase max-w-5xl">
                            {course.title}
                        </h1>
                    </div>

                    <div className="grid lg:grid-cols-12 gap-12 items-start pb-24">
                        {/* LADO ESQUERDO: VÍDEO */}
                        <div className="lg:col-span-8 flex flex-col">
                            <div className="w-full bg-black/40 aspect-video shadow-2xl border border-[#1D5F31]/20 overflow-hidden relative group rounded-xl">
                                <CourseIntroPlayer
                                    videoUrl={course.intro_video_url}
                                    thumbnail={course.image_url}
                                />
                            </div>
                        </div>

                        {/* LADO DIREITO: INFORMAÇÕES DO CURSO */}
                        <div className="lg:col-span-4 flex flex-col space-y-6">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-px bg-[#1D5F31]" />
                                <span className="text-[10px] font-black uppercase tracking-[4px] text-[#1D5F31]">
                                    Detalhes da Formação
                                </span>
                            </div>

                            <div className="space-y-6">
                                <h3 className="text-lg font-black text-[#061629] uppercase tracking-tight flex items-center gap-2">
                                    <Info size={18} className="text-[#1D5F31]" />
                                    Sobre este treinamento
                                </h3>
                                <p className="text-slate-600 text-sm leading-relaxed font-medium line-clamp-6">
                                    {course.description || 'Explore técnicas avançadas e domine o mercado com este treinamento exclusivo da PowerPlay. Conteúdo focado em performance e resultados reais.'}
                                </p>
                            </div>

                            {/* Info Grid Minimalista */}
                            <div className="grid grid-cols-2 gap-y-8 gap-x-4 py-8 border-y border-white/10">
                                {[
                                    { icon: <Clock size={16} />, label: "Duração", text: `${course.duration || 12} Horas` },
                                    { icon: <Globe size={16} />, label: "Idioma", text: "Português" },
                                    { icon: <PlayCircle size={16} />, label: "Aulas", text: `${totalLessons} Práticas` },
                                    { icon: <ShieldCheck size={16} />, label: "Certificado", text: "Incluso" },
                                ].map((item, i) => (
                                    <div key={i} className="flex gap-3 items-start">
                                        <div className="text-[#1D5F31] mt-0.5">{item.icon}</div>
                                        <div className="flex flex-col">
                                            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-widest mb-1">{item.label}</span>
                                            <span className="text-sm font-black text-[#061629] uppercase tracking-tighter leading-none">{item.text}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="pt-4">
                                <CourseActionButton
                                    courseId={course.id}
                                    courseTitle={course.title}
                                    coursePrice={course.price || 0}
                                    courseImageUrl={course.image_url}
                                    isAdmin={isAdmin}
                                    purchasedCourseIds={profile?.cursos_comprados || []}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* CURRÍCULO ESTILO INDUSTRIAL */}
            <section className="py-24 px-6 md:px-12 bg-transparent border-t border-white/5">
                <div className="max-w-[1600px] mx-auto">
                    <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-px bg-[#1D5F31]" />
                                <span className="text-[10px] font-black uppercase tracking-[4px] text-[#1D5F31]">Cronograma</span>
                            </div>
                            <h2 className="text-3xl md:text-5xl font-black text-[#061629] uppercase tracking-tighter">Grade <br className="hidden md:block"/> Curricular</h2>
                        </div>
                        <p className="text-slate-500 text-sm max-w-md font-medium uppercase tracking-widest leading-loose">
                            Explore os módulos desenhados para levar seu conhecimento ao nível máximo de performance técnica.
                        </p>
                    </div>

                    <div className="grid lg:grid-cols-12 gap-0">
                        <div className="lg:col-span-8 space-y-3">
                            {(!course.curriculum || course.curriculum.length === 0) ? (
                                <div className="bg-[#FFFFFF] rounded-none border-l-4 border-l-[#1D5F31] p-5 border-y border-r border-[#E2E8F0]">
                                    <div className="flex items-center gap-4">
                                        <FileText className="text-[#1D5F31] shrink-0" size={24} />
                                        <span className="font-bold font-exo text-[#1a1a1a] text-base">
                                            Conteúdo programático em atualização por nossa equipe técnica.
                                        </span>
                                    </div>
                                </div>
                            ) : (
                                course.curriculum.map((topic: string, index: number) => (
                                    <div key={index} className="bg-[#FFFFFF] rounded-none border-l-4 border-l-[#1D5F31] p-5 transition-all duration-300 hover:translate-x-1 hover:shadow-sm border-y border-r border-[#E2E8F0] flex items-center gap-4 group cursor-default">
                                        <PlayCircle className="text-[#1D5F31] shrink-0 opacity-80 group-hover:opacity-100 transition-opacity" size={24} />
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-black uppercase text-[#1D5F31] tracking-widest mb-1">MÓDULO {(index + 1).toString().padStart(2, '0')}</span>
                                            <span className="font-bold font-exo text-[#1a1a1a] text-base tracking-tight leading-snug">
                                                {topic}
                                            </span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </section>

            <MotivationalBanner />
        </div>
    )
}