import { notFound } from "next/navigation"
import Link from "next/link"
import { BuyButton } from "@/components/BuyButton"
import Navbar from "@/components/Navbar"
import { MotivationalBanner } from "@/components/MotivationalBanner"
import {
    CheckCircle2,
    PlayCircle,
    Clock,
    ShieldCheck,
    ArrowLeft,
} from "lucide-react"
import { db } from "@/lib/firebase"
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore"
import { cookies } from "next/headers"
import { parseFirebaseDate } from '@/lib/date-utils'
import { adminAuth, adminDb } from "@/lib/firebase-admin"
import { CourseIntroPlayer } from "@/components/CourseIntroPlayer"

export default async function CourseDetailPage({ params }: { params: { slug: string } }) {
    const { slug } = await params

    // 0. Verifica se o usuário está logado e já possui o curso
    let purchasedCourseIds: string[] = []
    const cookieStore = cookies()
    const token = (await cookieStore).get('firebase-token')?.value

    if (token) {
        try {
            const decodedToken = await adminAuth.verifyIdToken(token)
            const enrollmentSnap = await adminDb.collection('enrollments')
                .where('user_id', '==', decodedToken.uid)
                .where('course_id', '==', slug)
                .get()

            if (!enrollmentSnap.empty) {
                purchasedCourseIds = [slug]
            }
        } catch (error) {
            console.error("Erro ao verificar matrícula:", error)
        }
    }

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
    const rawPrice = course?.price ?? 157
    const coursePrice = typeof rawPrice === 'number' ? rawPrice : parseFloat(rawPrice)

    // O RETURN QUE ESTAVA FALTANDO COMEÇA AQUI:
    return (
        <div className="min-h-screen bg-transparent text-white/90 font-exo">
            <Navbar />

            {/* HERO & VIDEO SECTION - BORDAS QUADRADAS E ALINHAMENTO RIGOROSO */}
            <section className="relative pt-16 pb-0 overflow-hidden">
                <div className="max-w-none mx-auto w-full">
                    {/* INFO E TÍTULO - ALINHADO COM O PADDING PADRÃO */}
                    <div className="px-6 md:px-12 lg:px-16 pb-10 space-y-3 border-b border-white/10">
                        <Link
                            href="/course"
                            className="inline-flex items-center gap-2 text-white/40 hover:text-[#1D5F31] transition text-[10px] font-black uppercase tracking-[3px]"
                        >
                            <ArrowLeft size={14} />
                            Voltar ao Catálogo
                        </Link>

                        <div className="flex items-center gap-3">
                            <span className="inline-block bg-[#1D5F31] text-white text-[9px] font-black px-3 py-1 uppercase tracking-widest rounded-none">
                                {course.tag || "PREMIUM"}
                            </span>
                        </div>

                        <h1 className="text-3xl md:text-5xl font-black tracking-tighter text-white leading-[0.9] uppercase max-w-4xl">
                            {course.title}
                        </h1>
                    </div>

                    <div className="grid lg:grid-cols-12 gap-0 items-stretch border-b border-white/10 px-6 md:px-12 lg:px-16">
                        {/* LADO ESQUERDO: VÍDEO */}
                        <div className="lg:col-span-8 flex flex-col border-r border-white/10">
                            {/* Player de Vídeo sem arredondamento */}
                            <div className="w-full bg-black/20 aspect-video">
                                <CourseIntroPlayer
                                    videoUrl={course.intro_video_url}
                                    thumbnail={course.image_url}
                                />
                            </div>
                        </div>

                        {/* LADO DIREITO: COMPRA E BENEFÍCIOS (ALINHADO AO TOPO DO VÍDEO) */}
                        <div className="lg:col-span-4 bg-white/5 backdrop-blur-sm flex flex-col">
                            <div className="p-10 md:p-12 space-y-10 flex-grow">
                                <div className="space-y-2 pb-8 border-b border-white/10">
                                    <p className="text-[10px] text-white/40 uppercase tracking-[5px] font-black">Investimento único</p>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-2xl font-bold text-white">R$</span>
                                        <span className="text-7xl font-black text-white tracking-tighter">
                                            {coursePrice.toFixed(0)}
                                        </span>
                                        <span className="text-2xl font-bold text-white/40">,00</span>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <BuyButton
                                        course={course}
                                        label="Matricular-se Agora"
                                        className="w-full py-8 text-sm tracking-[4px] font-black bg-[#1D5F31] hover:bg-white hover:text-black transition-all uppercase rounded-none"
                                        purchasedCourseIds={purchasedCourseIds}
                                    />
                                    <div className="flex items-center gap-2 text-white/40 text-[9px] font-bold uppercase tracking-widest pt-2">
                                        <ShieldCheck size={16} className="text-[#1D5F31]" />
                                        <span>Garantia de 7 Dias Incondicional</span>
                                    </div>
                                </div>

                                <div className="space-y-6 pt-4">
                                    {[
                                        { icon: <Clock size={18} />, text: `${course.duration || 24}H de Conteúdo` },
                                        { icon: <PlayCircle size={18} />, text: `${totalLessons} Aulas Práticas` },
                                        { icon: <CheckCircle2 size={18} />, text: "Material Complementar" },
                                    ].map((item, i) => (
                                        <div key={i} className="flex items-center gap-4 text-white/60 font-bold text-[11px] uppercase tracking-widest">
                                            <div className="text-[#1D5F31]">{item.icon}</div>
                                            {item.text}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* DESCRIÇÃO E EMENTA */}
            <section className="py-24 px-6 md:px-12 lg:px-16 bg-[#061629]">
                <div className="max-w-none mx-auto grid lg:grid-cols-12 gap-0">
                    <div className="lg:col-span-8 space-y-8">
                        <h3 className="text-3xl font-black text-white uppercase tracking-tighter border-l-4 border-[#1D5F31] pl-6">Sobre o treinamento</h3>
                        <p className="text-white/60 text-lg leading-relaxed font-medium pl-6 max-w-none">
                            {course.description}
                        </p>

                        {/* Ementa Estilo Industrial */}
                        <div className="mt-16 space-y-1">
                            {curriculum[0].lessons.map((lesson: any, index: number) => (
                                <div key={index} className="flex items-center justify-between bg-white/5 p-6 border border-white/5 hover:bg-[#1D5F31]/10 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <span className="text-[#1D5F31] font-black text-xs">{(index + 1).toString().padStart(2, '0')}</span>
                                        <span className="font-bold uppercase tracking-tight text-white/80">{lesson.title}</span>
                                    </div>
                                    <PlayCircle size={16} className="text-white/20" />
                                </div>
                            ))}
                        </div>
                    </div>
                    {/* Placeholder para a coluna 4 da ementa (opcional) */}
                    <div className="lg:col-span-4 hidden lg:block"></div>
                </div>
            </section>

            <MotivationalBanner />
        </div>
    )
}