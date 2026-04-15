"use client"

import { useEffect } from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import MuxPlayer from "@mux/mux-player-react"
import { ArrowLeft, Clock, Globe, ShieldCheck, Play, Plus, Check, X } from "lucide-react"
import SecureMuxPlayer from "@/components/SecureMuxPlayer"
import { useCartStore } from '@/store/useCartStore'
import { useTrailerStore } from '@/store/useTrailerStore'
import { useRouter } from 'next/navigation'

interface CourseHeroClientProps {
    course: any
    isAdmin: boolean
    hasAccess: boolean
    purchasedCourseIds: string[]
}

function PublicMuxPlayer({ playbackId, onClose }: { playbackId: string; onClose: () => void }) {
    return (
        <div className="relative w-full h-full flex items-center justify-center bg-black">
            <button
                onClick={onClose}
                className="absolute top-4 right-4 z-50 w-12 h-12 flex items-center justify-center rounded-full bg-black/50 hover:bg-white/20 text-white transition-colors"
            >
                <X size={24} />
            </button>
            <div className="w-full max-w-6xl aspect-video">
                <MuxPlayer
                    playbackId={playbackId}
                    autoPlay="any"
                    muted={false}
                    streamType="on-demand"
                    metadata={{
                        video_id: playbackId,
                        video_title: "Trailer do Curso",
                    }}
                    primaryColor="#FFFFFF"
                    className="w-full h-full"
                    style={{
                        "--controls-backdrop-color": "transparent",
                        "--media-control-button-icon-color": "#FFFFFF",
                        "--media-range-thumb-background": "#FFFFFF",
                        "--media-range-track-active-background": "#FFFFFF",
                        "--media-icon-color": "#FFFFFF",
                        "--media-current-time-color": "#FFFFFF",
                        "--media-duration-color": "#FFFFFF",
                    } as any}
                />
            </div>
        </div>
    )
}

function SecureTrailerPlayer({ cursoId, playbackId, onClose }: { cursoId: string; playbackId: string; onClose: () => void }) {
    return (
        <div className="relative w-full h-full flex items-center justify-center bg-black">
            <button
                onClick={onClose}
                className="absolute top-4 right-4 z-50 w-12 h-12 flex items-center justify-center rounded-full bg-black/50 hover:bg-white/20 text-white transition-colors"
            >
                <X size={24} />
            </button>
            <div className="w-full max-w-6xl aspect-video">
                <SecureMuxPlayer
                    cursoId={cursoId}
                    playbackId={playbackId}
                    className="w-full h-full"
                />
            </div>
        </div>
    )
}

export function CourseHeroClient({ course, isAdmin, hasAccess, purchasedCourseIds }: CourseHeroClientProps) {
    const { addItem, items } = useCartStore()
    const { isOpen: showTrailer, open: openTrailer, close: closeTrailer } = useTrailerStore()
    const router = useRouter()

    const isInCart = items.some((item) => item.id === course.id)
    const hasIntroVideoPlaybackId = course.intro_video_playback_id && course.intro_video_playback_id.length > 0
    const hasVideo = hasIntroVideoPlaybackId || course.intro_video_url

    useEffect(() => {
        if (showTrailer) {
            document.body.style.overflow = 'hidden'
        } else {
            document.body.style.overflow = 'unset'
        }
        return () => {
            document.body.style.overflow = 'unset'
        }
    }, [showTrailer])

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
        <>
            <AnimatePresence>
                {showTrailer && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-sm"
                    >
                        {hasIntroVideoPlaybackId ? (
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.9, opacity: 0 }}
                                transition={{ duration: 0.3 }}
                                className="w-full h-full max-w-7xl flex items-center justify-center p-4 md:p-8"
                            >
                                <PublicMuxPlayer
                                    playbackId={course.intro_video_playback_id}
                                    onClose={closeTrailer}
                                />
                            </motion.div>
                        ) : (
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.9, opacity: 0 }}
                                transition={{ duration: 0.3 }}
                                className="w-full h-full max-w-7xl flex items-center justify-center p-4 md:p-8"
                            >
                                <SecureTrailerPlayer
                                    cursoId={course.id}
                                    playbackId={course.intro_video_url}
                                    onClose={closeTrailer}
                                />
                            </motion.div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            <section className="relative w-full h-[85vh] min-h-[600px] flex items-end pb-16 md:pb-24 bg-transparent overflow-hidden group">
                <div className="absolute inset-0 z-0">
                    <img
                        src={course.image_url || "https://images.unsplash.com/photo-1633356122544-f134324a6cee?q=80&w=2070"}
                        className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105 group-hover:backdrop-blur-[2px]"
                        alt="Course Background"
                    />

                    <div className="absolute inset-0 bg-gradient-to-t from-[#041E10] via-[#041E10]/40 to-transparent opacity-90 pointer-events-none" />
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_40%,rgba(29,95,49,0.15),transparent_70%)] pointer-events-none" />
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
                            <button
                                onClick={handleAction}
                                className="w-full sm:w-auto bg-[#FFFFFF] hover:bg-gray-100 text-[#041E10] px-8 py-4 rounded-md font-bold text-base flex items-center justify-center gap-3 transition-colors shrink-0 shadow-2xl"
                            >
                                {hasAccess ? <Play size={20} className="fill-[#041E10]" /> : isInCart ? <Check size={20} /> : <Plus size={20} />}
                                {actionText}
                            </button>

                            {hasVideo && !showTrailer && (
                                <button
                                    onClick={openTrailer}
                                    className="w-full sm:w-auto bg-transparent hover:bg-white/10 border border-[#FFFFFF] text-[#FFFFFF] px-8 py-4 rounded-md font-bold text-base flex items-center justify-center gap-3 transition-colors shrink-0"
                                >
                                    <Play size={20} className="fill-transparent" />
                                    Assistir Trailer
                                </button>
                            )}

                            {hasVideo && showTrailer && (
                                <button
                                    onClick={closeTrailer}
                                    className="w-full sm:w-auto bg-transparent hover:bg-white/10 border border-[#FFFFFF] text-[#FFFFFF] px-8 py-4 rounded-md font-bold text-base flex items-center justify-center gap-3 transition-colors shrink-0"
                                >
                                    <X size={20} />
                                    Fechar Trailer
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </section>
        </>
    )
}