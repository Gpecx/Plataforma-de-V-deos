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
} from "lucide-react"
import { db } from "@/lib/firebase"
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore"
import { parseFirebaseDate } from '@/lib/date-utils'
import { CourseIntroPlayer } from "@/components/CourseIntroPlayer"

export default async function CourseDetailPage({ params }: { params: { slug: string } }) {
    const { slug } = await params

    // 1. Busca o curso por ID
    let course: any = null
    try {
        const courseRef = doc(db, 'courses', slug)
        const courseSnap = await getDoc(courseRef)

        if (courseSnap.exists()) {
            const data = courseSnap.data()
            course = {
                id: courseSnap.id,
                ...data,
                teacher_name: data.teacher_name || 'Equipe PowerPlay',
                created_at: parseFirebaseDate(data.created_at)?.toISOString() || data.created_at,
                updated_at: parseFirebaseDate(data.updated_at)?.toISOString() || data.updated_at
            }
        }
    } catch (error) {
        console.error("Erro ao buscar curso:", error)
    }

    if (!course) return notFound()

    // 2. Busca as lições
    let lessons: any[] = []
    try {
        const lessonsRef = collection(db, 'lessons')
        const q = query(lessonsRef, where('course_id', '==', slug))
        const lessonsSnap = await getDocs(q)

        lessons = lessonsSnap.docs.map(d => {
            const lData = d.data()
            return {
                id: d.id,
                ...lData,
                created_at: parseFirebaseDate(lData.created_at)?.toISOString() || lData.created_at
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
            <section className="relative pt-24 pb-0 overflow-hidden">
                <div className="max-w-[1440px] mx-auto w-full px-6 md:px-12 lg:px-16">
                    {/* INFO E TÍTULO */}
                    <div className="pb-10 space-y-4">
                        <Link
                            href="/course"
                            className="inline-flex items-center gap-2 text-[#061629] hover:text-[#1D5F31] transition text-[10px] font-black uppercase tracking-[3px]"
                        >
                            <ArrowLeft size={14} />
                            Voltar ao Catálogo
                        </Link>

                        <div className="flex items-center gap-3">
                            <span className="inline-block bg-[#1D5F31] text-white text-[9px] font-black px-3 py-1.5 uppercase tracking-[3px] rounded-xl">
                                {course.tag || "PREMIUM"}
                            </span>
                        </div>

                        <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-[#061629] leading-[0.85] uppercase max-w-5xl italic">
                            {course.title}
                        </h1>
                    </div>

                    <div className="grid lg:grid-cols-12 gap-12 items-start pb-24">
                        {/* LADO ESQUERDO: VÍDEO */}
                        <div className="lg:col-span-8 flex flex-col">
                            <div className="w-full bg-black/40 aspect-video shadow-2xl border border-[#1D5F31]/20 overflow-hidden relative group">
                                <CourseIntroPlayer
                                    videoUrl={course.intro_video_url}
                                    thumbnail={course.image_url}
                                />
                            </div>
                        </div>

                        {/* LADO DIREITO: INFORMAÇÕES DO CURSO */}
                        <div className="lg:col-span-4 flex flex-col space-y-10">
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
                                <Link href={`/classroom/${course.id}`} className="block w-full">
                                    <button className="btn-cta w-full flex items-center justify-center gap-3 group py-5 shadow-2xl shadow-[#1D5F31]/20 !text-white">
                                        <span className="relative z-10 flex items-center gap-3 text-[11px] tracking-[4px] !text-white">
                                            INICIAR TREINAMENTO <ArrowRight size={18} className="group-hover:translate-x-2 transition-transform !text-white" />
                                        </span>
                                    </button>
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* CURRÍCULO ESTILO INDUSTRIAL */}
            <section className="py-24 px-6 md:px-12 lg:px-16 bg-transparent border-t border-white/5">
                <div className="max-w-[1440px] mx-auto">
                    <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-px bg-[#1D5F31]" />
                                <span className="text-[10px] font-black uppercase tracking-[4px] text-[#1D5F31]">Cronograma</span>
                            </div>
                            <h2 className="text-3xl md:text-5xl font-black text-[#061629] uppercase tracking-tighter italic">Grade <br className="hidden md:block"/> Curricular</h2>
                        </div>
                        <p className="text-slate-500 text-sm max-w-md font-medium uppercase tracking-widest leading-loose">
                            Explore os módulos desenhados para levar seu conhecimento ao nível máximo de performance técnica.
                        </p>
                    </div>

                    <div className="grid lg:grid-cols-12 gap-0">
                        <div className="lg:col-span-8 space-y-1">
                            {curriculum[0].lessons.map((lesson: any, index: number) => (
                                <div key={index} className="flex items-center justify-between bg-white/[0.02] p-6 border border-white/5 hover:bg-[#1D5F31]/10 transition-all group cursor-default">
                                    <div className="flex items-center gap-6">
                                        <span className="text-[#1D5F31] font-black text-xs tabular-nums">{(index + 1).toString().padStart(2, '0')}</span>
                                        <span className="font-bold uppercase tracking-widest text-[11px] text-[#061629]/70 group-hover:text-black transition-colors">{lesson.title}</span>
                                    </div>
                                    <div className="flex items-center gap-4 text-white/20 group-hover:text-[#1D5F31] transition-colors">
                                        <span className="text-[9px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">Visualizar</span>
                                        <PlayCircle size={18} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            <MotivationalBanner />
        </div>
    )
}