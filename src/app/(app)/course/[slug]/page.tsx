import { notFound } from "next/navigation"
import { Suspense } from "react"
import Link from "next/link"
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
import { CourseHeroClient } from "./CourseHeroClient"
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
        <div className="min-h-screen bg-gradient-to-br from-[#061629] via-[#0A2E16] to-[#1D5F31] bg-fixed text-white font-montserrat">
            <CourseHeroClient
                course={course}
                isAdmin={isAdmin}
                hasAccess={hasAccess}
                purchasedCourseIds={profile?.cursos_comprados || []}
            />

            {/* CURRÍCULO ESTILO INDUSTRIAL / STREAMING */}
            <section className="py-24 px-6 md:px-12 bg-transparent border-t border-white/5">
                <div className="max-w-[1600px] mx-auto">
                    <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-px bg-[#1D5F31]" />
                                <span className="text-[10px] font-bold uppercase tracking-[4px] text-[#1D5F31]">Cronograma</span>
                            </div>
                            <h2 className="text-2xl md:text-3xl font-bold text-white uppercase tracking-tighter max-w-xl">Grade <br className="hidden md:block"/> Curricular</h2>
                        </div>
                        <p className="text-white/60 text-sm max-w-md font-medium uppercase tracking-widest leading-loose">
                            Explore os módulos desenhados para levar seu conhecimento ao nível máximo de performance técnica.
                        </p>
                    </div>

                    <div className="grid lg:grid-cols-12 gap-0">
                        <div className="lg:col-span-8 space-y-3">
                            {(!course.curriculum || course.curriculum.length === 0) ? (
                                <div className="bg-[#0f172a]/50 backdrop-blur-md rounded-md border-l-4 border-l-[#1D5F31] p-5 border border-white/5">
                                    <div className="flex items-center gap-4">
                                        <FileText className="text-[#1D5F31] shrink-0" size={24} />
                                        <span className="font-bold font-montserrat text-white/90 text-base">
                                            Conteúdo programático em atualização por nossa equipe técnica.
                                        </span>
                                    </div>
                                </div>
                            ) : (
                                course.curriculum.map((topic: string, index: number) => (
                                    <div key={index} className="bg-[#0f172a]/50 backdrop-blur-md rounded-md border-l-4 border-l-[#1D5F31] p-5 transition-all duration-300 hover:bg-[#1e293b]/50 border border-white/5 flex items-center gap-4 group cursor-default">
                                        <PlayCircle className="text-[#1D5F31] shrink-0 opacity-80 group-hover:opacity-100 transition-opacity" size={24} />
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-bold uppercase text-[#1D5F31] tracking-widest mb-1">MÓDULO {(index + 1).toString().padStart(2, '0')}</span>
                                            <span className="font-bold font-montserrat text-white/90 text-base tracking-tight leading-snug">
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