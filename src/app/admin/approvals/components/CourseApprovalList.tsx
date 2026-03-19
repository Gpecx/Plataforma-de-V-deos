'use client'

import { useState } from 'react'
import { approveCourse, rejectCourse } from '@/app/actions/admin'
import { X, Play, AlertCircle, Loader2, LayoutGrid, PlaySquare } from 'lucide-react'

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

    const handleApprove = async (id: string) => {
        setLoadingId(id)
        try {
            const res = await approveCourse(id)
            if (res.success) {
                setCourses(courses.filter(c => c.id !== id))
                setReviewingCourse(null)
            } else {
                alert(res.error)
            }
        } catch (error) {
            alert('Erro ao aprovar curso')
        } finally {
            setLoadingId(null)
        }
    }

    const handleReject = async (id: string) => {
        if (!rejectionReason.trim()) {
            alert('Por favor, informe o motivo da rejeição.')
            return
        }

        setLoadingId(id)
        try {
            const res = await rejectCourse(id, rejectionReason)
            if (res.success) {
                setCourses(courses.filter(c => c.id !== id))
                setReviewingCourse(null)
                setRejectionReason('')
            } else {
                alert(res.error)
            }
        } catch (error) {
            alert('Erro ao rejeitar curso')
        } finally {
            setLoadingId(null)
        }
    }

    if (courses.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 border border-white/5 bg-white/[0.02] animate-in fade-in duration-700">
                <LayoutGrid size={48} className="text-slate-800 mb-6" />
                <p className="text-slate-500 font-black uppercase tracking-[4px] text-[10px]">Portal Limpo: Nenhum curso aguardando revisão</p>
            </div>
        )
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Grid de Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {courses.map((course) => (
                    <div
                        key={course.id}
                        className="group bg-black/40 border border-white/5 hover:border-[#00FF00]/30 transition-all duration-500 relative flex flex-col"
                    >
                        <div className="absolute top-4 left-4 z-20">
                            <div className="flex items-center gap-2 bg-black/80 border border-white/10 px-3 py-1 scale-90 origin-left">
                                <div className="w-1.5 h-1.5 bg-amber-500 animate-pulse" />
                                <span className="text-[9px] font-black uppercase tracking-widest text-amber-500">Aguardando Auditoria</span>
                            </div>
                        </div>

                        <div className="relative aspect-video overflow-hidden">
                            <img
                                src={course.image_url}
                                alt=""
                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-40 group-hover:opacity-60"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
                        </div>

                        <div className="p-6 flex flex-col flex-1">
                            <div className="flex-1">
                                <h3 className="text-lg font-black uppercase italic tracking-tighter leading-tight mb-2 group-hover:text-[#00FF00] transition-colors">
                                    {course.title}
                                </h3>
                                <div className="flex items-center gap-2 mb-4">
                                    <div className="w-4 h-[1px] bg-[#00FF00]" />
                                    <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">
                                        By {teachersMap[course.teacher_id] || 'Instrutor Desconhecido'}
                                    </p>
                                </div>
                            </div>

                            <button
                                onClick={() => setReviewingCourse(course)}
                                className="w-full py-4 bg-white/5 border border-white/10 text-white text-[10px] font-black uppercase tracking-[3px] hover:bg-[#00FF00] hover:text-black hover:border-transparent hover:shadow-[0_0_20px_rgba(0,255,0,0.3)] transition-all duration-300"
                            >
                                Revisar Conteúdo
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Modal de Revisão */}
            {reviewingCourse && (
                <div className="fixed inset-0 z-[60] lg:pl-72 flex items-center justify-center p-2 sm:p-6 bg-black/95 backdrop-blur-xl animate-in fade-in duration-300">
                    <div className="w-[95%] max-w-[1200px] max-h-[92vh] bg-[#061629] border border-white/10 flex flex-col overflow-y-auto shadow-2xl custom-scrollbar">

                        <div className="flex flex-col lg:flex-row">
                            {/* Player Column */}
                            <div className="flex-1 bg-black border-b lg:border-b-0 lg:border-r border-white/5 flex flex-col sticky top-0 z-10 lg:static">
                                <header className="p-4 lg:p-6 flex justify-between items-center bg-white/[0.02] border-b border-white/5">
                                    <div className="flex items-center gap-3">
                                        <Play size={16} className="text-[#00FF00]" />
                                        <h2 className="text-[10px] lg:text-xs font-black uppercase tracking-widest text-[#00FF00]">Vídeo de Introdução</h2>
                                    </div>
                                    <button
                                        onClick={() => setReviewingCourse(null)}
                                        className="p-2 hover:bg-white/5 transition-colors"
                                    >
                                        <X size={20} className="text-slate-500 hover:text-white" />
                                    </button>
                                </header>

                                <div className="flex-1 flex items-center justify-center bg-black p-0" key={reviewingCourse.id}>
                                    {reviewingCourse.intro_video_url ? (
                                        isExternalVideo(reviewingCourse.intro_video_url) ? (
                                            <iframe
                                                src={getEmbedUrl(reviewingCourse.intro_video_url)}
                                                className="w-full aspect-video border-0 shadow-2xl"
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
                                                className="w-full aspect-video object-contain bg-black shadow-2xl"
                                            />
                                        )
                                    ) : (
                                        <div className="flex flex-col items-center gap-4 text-slate-600 py-20 lg:py-0">
                                            <AlertCircle size={48} />
                                            <p className="text-[10px] font-black uppercase tracking-widest">Sem vídeo de introdução</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Moderation Column */}
                            <div className="w-full lg:w-[400px] p-6 lg:p-8 flex flex-col bg-white/[0.01]">
                                <div className="mb-8">
                                    <span className="text-[10px] font-black uppercase tracking-[4px] text-[#00FF00] block mb-2">Detalhes do Curso</span>
                                    <h3 className="text-xl lg:text-2xl font-black uppercase italic tracking-tighter leading-tight break-words">{reviewingCourse.title}</h3>
                                    <p className="text-[11px] text-slate-400 mt-4 leading-relaxed line-clamp-4 font-bold border-l border-white/10 pl-4 uppercase tracking-tighter italic">
                                        {reviewingCourse.subtitle || 'Sem subtítulo disponível.'}
                                    </p>
                                </div>

                                <div className="space-y-6 lg:mt-auto">
                                    <div>
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 block mb-3">Feedback para o Instrutor</label>
                                        <textarea
                                            value={rejectionReason}
                                            onChange={(e) => setRejectionReason(e.target.value)}
                                            placeholder="Detalhe os motivos técnicos ou pedagógicos..."
                                            className="w-full h-32 bg-black border border-white/5 p-4 text-xs text-white focus:border-[#00FF00] outline-none transition-colors resize-none placeholder:text-slate-700"
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <button
                                            onClick={() => handleReject(reviewingCourse.id)}
                                            disabled={loadingId === reviewingCourse.id}
                                            className="h-14 border border-rose-600/30 bg-rose-950/20 text-rose-500 text-[10px] font-black uppercase tracking-widest hover:bg-rose-600 hover:text-white transition-all disabled:opacity-50"
                                        >
                                            Reprovar
                                        </button>
                                        <button
                                            onClick={() => handleApprove(reviewingCourse.id)}
                                            disabled={loadingId === reviewingCourse.id}
                                            className="h-14 bg-[#00FF00] text-black text-[10px] font-black uppercase tracking-widest hover:brightness-110 hover:shadow-[0_0_20px_#00FF00] transition-all disabled:opacity-50 flex items-center justify-center"
                                        >
                                            {loadingId === reviewingCourse.id ? <Loader2 size={20} className="animate-spin" /> : "Aprovar Conteúdo"}
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