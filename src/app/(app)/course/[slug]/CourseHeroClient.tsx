"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, Clock, Globe, ShieldCheck, Play, Plus, Check } from "lucide-react"
import SecureMuxPlayer from "@/components/SecureMuxPlayer"
import { useCartStore } from '@/store/useCartStore'
import { useRouter } from 'next/navigation'

interface CourseHeroClientProps {
    course: any
    isAdmin: boolean
    hasAccess: boolean
    purchasedCourseIds: string[]
}

export function CourseHeroClient({ course, isAdmin, hasAccess, purchasedCourseIds }: CourseHeroClientProps) {
    const [showTrailer, setShowTrailer] = useState(false)
    const { addItem, items } = useCartStore()
    const router = useRouter()

    const isInCart = items.some((item) => item.id === course.id)

    const handleAction = () => {
        if (hasAccess) {
            router.push(`/classroom/${course.id}`)
            return
        }
        if (isInCart) {
            router.push('/cart')
            return
        }
        addItem({
            id: course.id,
            title: course.title,
            price: course.price,
            image_url: course.image_url,
        })
        setTimeout(() => router.push('/cart'), 800)
    }

    const actionText = hasAccess ? "Assistir Agora" : isInCart ? "Ir ao Carrinho" : "Adicionar ao Carrinho"

    return (
        <section className="relative w-full h-[85vh] min-h-[600px] flex items-end pb-16 md:pb-24 bg-transparent overflow-hidden group">
            {/* BACKGROUND MANAGER */}
            <div className="absolute inset-0 z-0">
                {showTrailer && course.intro_video_url ? (
                    <div className="w-full h-full animate-in fade-in duration-1000">
                        <SecureMuxPlayer 
                            cursoId={course.id} 
                            playbackId={course.intro_video_url} 
                            className="w-full h-full object-cover [&_mux-player]:object-cover border-none shadow-none rounded-none !aspect-auto"
                        />
                    </div>
                ) : (
                    <img
                        src={course.image_url || "https://images.unsplash.com/photo-1633356122544-f134324a6cee?q=80&w=2070"}
                        className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                        alt="Course Background"
                    />
                )}

                {/* POWERPLAY ATMOSPHERIC GRADIENT — Title 'inside' the light, Tone down green */}
                {/* Camada 1: Base de legibilidade (Grounding) */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#041E10] via-[#041E10]/40 to-transparent opacity-90 pointer-events-none" />
                
                {/* Camada 2: Brilho Radial (Spotlight no Título) */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_40%,rgba(29,95,49,0.15),transparent_70%)] pointer-events-none" />
                
                {/* Camada 3: Transição de Identidade (To Bottom Right) — Subtle accent */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#041E10]/50 via-transparent to-[#1D5F31]/10 pointer-events-none" />
            </div>

            <div className="relative z-10 max-w-[1600px] mx-auto w-full px-6 md:px-12 transition-all duration-700">
                <Link
                    href="/course"
                    className="inline-flex items-center gap-2 text-white/50 hover:text-white transition text-xs font-bold uppercase tracking-[3px] mb-8"
                >
                    <ArrowLeft size={14} />
                    Catálogo
                </Link>

                <div className="max-w-4xl space-y-6">
                    <h1 className="text-5xl md:text-7xl lg:text-[6rem] font-bold tracking-tighter text-white leading-[0.9] drop-shadow-2xl uppercase" style={{ textShadow: '0 2px 20px rgba(0,0,0,0.7)' }}>
                        {course.title}
                    </h1>

                    {/* META INFO — força branco puro com sombra para garantir contraste */}
                    <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-white text-xs font-bold tracking-widest uppercase drop-shadow-lg">
                        {course.tag && (
                            <span className="text-white border border-white/60 bg-white/10 px-2 py-0.5 rounded-sm backdrop-blur-md">
                                {course.tag}
                            </span>
                        )}
                        <span className="flex items-center gap-1.5 text-white"><Clock size={16} /> {course.duration || 12}H</span>
                        <span className="flex items-center gap-1.5 text-white"><Globe size={16} /> PT-BR</span>
                        <span className="flex items-center gap-1.5 text-white"><ShieldCheck size={16} /> CERTIFICADO</span>
                    </div>

                    <p className="text-white text-sm md:text-lg leading-relaxed font-medium line-clamp-3 md:line-clamp-4 max-w-2xl" style={{ textShadow: '0 1px 12px rgba(0,0,0,0.6)' }}>
                        {course.description || 'Explore técnicas avançadas e domine o mercado com este treinamento exclusivo da PowerPlay. Conteúdo focado em performance e resultados reais.'}
                    </p>

                    <div className="flex flex-col sm:flex-row items-center gap-4 pt-6">
                        {/* CTA NETFLIX STYLE - BOLD AND PROMINENT */}
                        <button
                            onClick={handleAction}
                            className="w-full sm:w-auto bg-[#FFFFFF] hover:bg-gray-100 text-[#041E10] px-8 py-4 rounded-md font-bold text-base flex items-center justify-center gap-3 transition-colors shrink-0 shadow-2xl"
                        >
                            {hasAccess ? <Play size={20} className="fill-[#041E10]" /> : isInCart ? <Check size={20} /> : <Plus size={20} />}
                            {actionText}
                        </button>

                        {/* BTN ASSISTIR TRAILER */}
                        {course.intro_video_url && !showTrailer && (
                            <button
                                onClick={() => setShowTrailer(true)}
                                className="w-full sm:w-auto bg-transparent hover:bg-white/10 border border-[#FFFFFF] text-[#FFFFFF] px-8 py-4 rounded-md font-bold text-base flex items-center justify-center gap-3 transition-colors shrink-0"
                            >
                                <Play size={20} className="fill-transparent" />
                                Assistir Trailer
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </section>
    )
}
