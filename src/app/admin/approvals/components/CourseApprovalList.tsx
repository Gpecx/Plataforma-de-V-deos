'use client'

import { useState } from 'react'
import { approveCourse, rejectCourse, approveTrailerAction, rejectTrailerAction } from '@/app/actions/admin'
import { X, Play, AlertCircle, Loader2, LayoutGrid, PlaySquare, ShieldCheck, XCircle, AlertTriangle } from 'lucide-react'
import Logo from '@/components/Logo'
import SecureMuxPlayer from '@/components/SecureMuxPlayer'

import { toast } from 'sonner'

interface CourseApprovalListProps {
    initialCourses: any[]
    teachersMap: Record<string, string>
}

export default function CourseApprovalList({ initialCourses, teachersMap }: CourseApprovalListProps) {
    const [courses, setCourses] = useState(initialCourses)
    const [loadingId, setLoadingId] = useState<string | null>(null)
    const [reviewingCourse, setReviewingCourse] = useState<any | null>(null)
    const [rejectionReason, setRejectionReason] = useState('')
    
    const isExternalVideo = (url: string) => {
        return url?.includes('youtube.com') || url?.includes('youtu.be') || url?.includes('vimeo.com')
    }

    const getEmbedUrl = (url: string) => {
        if (!url) return ''
        if (url.includes('youtube.com') || url.includes('youtu.be')) {
            const videoId = url.includes('v=')
                ? url.split('v=')[1].split('&')[0]
                : url.split('/').pop()?.split('?')[0]
            return `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1&autoplay=1&mute=1`
        }
        if (url.includes('vimeo.com')) {
            const videoId = url.split('/').pop()?.split('?')[0]
            return `https://player.vimeo.com/video/${videoId}?autoplay=1&muted=1&title=0&byline=0&portrait=0`
        }
        return url
    }

    const handleApprove = async (course: any) => {
        const id = course.id
        const isTrailerReview = course.trailer_review_status === 'trailer_pending_review'
        setLoadingId(id)
        try {
            const res = isTrailerReview ? await approveTrailerAction(id) : await approveCourse(id)
            if (res.success) {
                setCourses(courses.filter(c => c.id !== id))
                setReviewingCourse(null)
                toast.success(isTrailerReview ? 'Trailer aprovado com sucesso!' : 'Curso aprovado com sucesso! Já está disponível na plataforma.')
            } else {
                toast.error(res.error || 'Erro ao aprovar')
            }
        } catch (error) {
            toast.error('Erro técnico ao processar aprovação')
        } finally {
            setLoadingId(null)
        }
    }

    const handleReject = async (course: any) => {
        const id = course.id
        const isTrailerReview = course.trailer_review_status === 'trailer_pending_review'
        if (!isTrailerReview && !rejectionReason.trim()) {
            toast.warning('Por favor, informe o motivo da rejeição para orientar o instrutor.')
            return
        }

        setLoadingId(id)
        try {
            const res = isTrailerReview ? await rejectTrailerAction(id, rejectionReason) : await rejectCourse(id, rejectionReason)
            if (res.success) {
                setCourses(courses.filter(c => c.id !== id))
                setReviewingCourse(null)
                setRejectionReason('')
                toast.success(isTrailerReview ? 'Trailer rejeitado.' : 'Conteúdo reprovado. O instrutor receberá o feedback.')
            } else {
                toast.error(res.error || 'Erro ao rejeitar')
            }
        } catch (error) {
            toast.error('Erro técnico ao processar reprovação')
        } finally {
            setLoadingId(null)
        }
    }

    if (courses.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-32 bg-white border border-black/20 rounded-xl animate-in fade-in duration-700 shadow-sm">
                <div className="w-20 h-20 bg-black/5 rounded-full flex items-center justify-center mb-8 border border-black/10 shadow-inner">
                    <LayoutGrid size={40} className="text-black/20" />
                </div>
                <p className="!text-[#000000] font-bold uppercase tracking-wider text-[10px]">Portal Limpo: Nenhum curso aguardando revisão</p>
            </div>
        )
    }

    return (
        <div className="space-y-10 animate-in fade-in duration-700 font-montserrat">
            {/* Grid de Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {courses.map((course) => (
                    <div
                        key={course.id}
                        className="group bg-white border border-black/20 hover:border-[#1D5F31]/30 transition-all duration-500 relative flex flex-col rounded-xl overflow-hidden shadow-sm hover:shadow-lg"
                    >
                        <div className="absolute top-4 left-4 z-20 flex flex-col gap-1">
                            {course.status === 'PENDENTE' && (
                                <div className="flex items-center gap-2 bg-white/90 backdrop-blur-md border border-black/10 px-3 py-1 rounded-full shadow-sm">
                                    <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />
                                    <span className="text-[8px] font-bold uppercase tracking-wider !text-[#000000]">PENDENTE</span>
                                </div>
                            )}
                            {course.trailer_review_status === 'trailer_pending_review' && (
                                <div className="flex items-center gap-2 bg-amber-50 backdrop-blur-md border border-amber-300 px-3 py-1 rounded-full shadow-sm">
                                    <AlertTriangle size={10} className="text-amber-600" />
                                    <span className="text-[8px] font-bold uppercase tracking-wider text-amber-700">TRAILER PENDENTE</span>
                                </div>
                            )}
                        </div>

                        <div className="relative aspect-video overflow-hidden bg-slate-950 flex items-center justify-center">
                            {course.image_url ? (
                                <img
                                    src={course.image_url}
                                    alt=""
                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-90 group-hover:opacity-100"
                                />
                            ) : (
                                <div className="scale-75 origin-center">
                                    <Logo light />
                                </div>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 to-transparent pointer-events-none" />
                        </div>

                        <div className="p-8 flex flex-col flex-1">
                            <div className="flex-1">
                                <h3 className="text-lg font-bold uppercase tracking-tighter leading-tight mb-2 !text-[#000000] group-hover:text-[#1D5F31] transition-colors">
                                    {course.title}
                                </h3>
                                <div className="flex items-center gap-2.5 mb-6">
                                    <div className="w-1 h-1 rounded-full bg-black/30" />
                                    <p className="text-[10px] !text-[#000000] font-bold uppercase tracking-wider">
                                        Por <span className="!text-[#000000]">{teachersMap[course.teacher_id] || 'Instrutor Desconhecido'}</span>
                                    </p>
                                </div>
                            </div>

                            <button
                                onClick={() => setReviewingCourse(course)}
                                className="w-full py-4 bg-[#1D5F31] text-white text-[10px] font-bold uppercase tracking-wider hover:bg-slate-900 transition-all duration-300 rounded-xl shadow-sm active:scale-95"
                            >
                                Revisar Conteúdo
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Modal de Revisão */}
            {reviewingCourse && (
                <div className="fixed inset-0 z-[60] lg:pl-72 flex items-center justify-center p-4 sm:p-10 bg-slate-950/40 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="w-full max-w-[1200px] max-h-[90vh] bg-white rounded-xl border border-black/10 flex flex-col overflow-hidden shadow-2xl">
                        
                        <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">
                            {/* Player Column */}
                            <div className="flex-1 bg-black/5 border-b lg:border-b-0 lg:border-r border-black/10 flex flex-col min-h-0">
                                <header className="p-6 flex justify-between items-center bg-white border-b border-black/5">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-lg bg-black/5 flex items-center justify-center border border-black/10">
                                            <Play size={18} className="text-[#1D5F31]" strokeWidth={2.5} />
                                        </div>
                                        <h2 className="text-[11px] font-bold uppercase tracking-wider !text-[#000000]">
                                            {reviewingCourse.trailer_review_status === 'trailer_pending_review' ? 'TRAILER PENDENTE (PRIVADO)' : 'VÍDEO DE INTRODUÇÃO'}
                                        </h2>
                                    </div>
                                    <button
                                        onClick={() => setReviewingCourse(null)}
                                        className="w-10 h-10 rounded-full bg-black/5 flex items-center justify-center text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-all active:scale-90"
                                    >
                                        <X size={20} />
                                    </button>
                                </header>

                                <div className="flex-1 flex items-center justify-center bg-slate-900 p-0 relative group" key={reviewingCourse.id}>
                                    {reviewingCourse.trailer_review_status === 'trailer_pending_review' && reviewingCourse.pendingTrailerPlaybackId ? (
                                        <div className="w-full h-full">
                                            <SecureMuxPlayer
                                                cursoId={reviewingCourse.id}
                                                playbackId={reviewingCourse.pendingTrailerPlaybackId}
                                                className="w-full h-full"
                                                isPublic={false}
                                            />
                                        </div>
                                    ) : reviewingCourse.intro_video_url ? (
                                        isExternalVideo(reviewingCourse.intro_video_url) ? (
                                            <iframe
                                                src={getEmbedUrl(reviewingCourse.intro_video_url)}
                                                className="w-full h-full aspect-video border-0"
                                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                                                allowFullScreen
                                            ></iframe>
                                        ) : (
                                            <video
                                                src={reviewingCourse.intro_video_url}
                                                controls
                                                autoPlay
                                                muted
                                                playsInline
                                                className="w-full h-full aspect-video object-contain"
                                            />
                                        )
                                    ) : (
                                        <div className="flex flex-col items-center gap-6 text-white text-center px-10">
                                            <div className="scale-125 origin-center mb-4">
                                                <Logo />
                                            </div>
                                            <p className="text-[10px] font-bold uppercase tracking-wider text-white/60">NENHUM VÍDEO DISPONÍVEL PARA AUDITORIA</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Moderation Column */}
                            <div className="w-full lg:w-[450px] p-10 lg:p-12 flex flex-col bg-white overflow-y-auto custom-scrollbar">
                            <div className="mb-10">
                                <div className="flex items-center gap-2 mb-4">
                                    <div className="w-1 h-1 rounded-full bg-[#1D5F31]"></div>
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#1D5F31]">
                                        {reviewingCourse.trailer_review_status === 'trailer_pending_review' ? 'REVISÃO DE TRAILER' : 'DETALHES DA AUDITORIA'}
                                    </span>
                                </div>
                                <h3 className="text-3xl font-bold uppercase tracking-tighter leading-tight !text-[#000000]">{reviewingCourse.title}</h3>
                                    <p className="text-[12px] !text-[#000000] mt-6 leading-tight font-bold uppercase tracking-wider">
                                        {reviewingCourse.subtitle || 'Nenhum subtítulo fornecido pelo instrutor.'}
                                    </p>
                                </div>

                                <div className="space-y-8">
                                    <div className="space-y-4">
                                        <label className="text-[10px] font-bold uppercase tracking-wider !text-[#000000] flex items-center gap-2">
                                            <div className="w-1 h-1 bg-rose-500 rounded-full"></div>
                                            Feedback para o Criador
                                        </label>
                                        <textarea
                                            value={rejectionReason}
                                            onChange={(e) => setRejectionReason(e.target.value)}
                                            placeholder="Detalhamento técnico ou pedagógico para correções..."
                                            className="w-full h-44 bg-black/5 border border-black/10 rounded-xl p-6 text-sm text-slate-900 focus:border-[#1D5F31]/30 focus:bg-white outline-none transition-all resize-none placeholder:text-black/30 font-bold shadow-inner"
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 gap-4 pt-4">
                                        <button
                                            onClick={() => handleApprove(reviewingCourse)}
                                            disabled={loadingId === reviewingCourse.id}
                                            className="h-16 bg-[#1D5F31] text-white text-[11px] font-bold uppercase tracking-wider hover:bg-slate-900 transition-all disabled:opacity-50 flex items-center justify-center rounded-xl active:scale-95 shadow-sm"
                                        >
                                            {loadingId === reviewingCourse.id ? <Loader2 size={24} className="animate-spin" /> : (reviewingCourse.trailer_review_status === 'trailer_pending_review' ? "APROVAR TRAILER" : "APROVAR CONTEÚDO")}
                                        </button>
                                        <button
                                            onClick={() => handleReject(reviewingCourse)}
                                            disabled={loadingId === reviewingCourse.id}
                                            className="h-14 border border-black/10 text-rose-500 text-[10px] font-bold uppercase tracking-wider hover:bg-rose-500 hover:text-white transition-all disabled:opacity-50 rounded-xl active:scale-95"
                                        >
                                            {reviewingCourse.trailer_review_status === 'trailer_pending_review' ? 'Rejeitar Trailer' : 'Reprovar Acesso'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}