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
            <div className="flex flex-col items-center justify-center py-32 bg-white border border-black rounded-[40px] animate-in fade-in duration-700 shadow-sm">
                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-8 border border-slate-100 shadow-inner">
                    <LayoutGrid size={40} className="text-slate-200" />
                </div>
                <p className="text-slate-900 font-black uppercase tracking-[4px] text-[10px] italic">Portal Limpo: Nenhum curso aguardando revisão</p>
            </div>
        )
    }

    return (
        <div className="space-y-10 animate-in fade-in duration-700 font-exo">
            {/* Grid de Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {courses.map((course) => (
                    <div
                        key={course.id}
                        className="group bg-white border border-black hover:border-[#1D5F31] transition-all duration-500 relative flex flex-col rounded-[32px] overflow-hidden shadow-sm hover:shadow-2xl"
                    >
                        <div className="absolute top-6 left-6 z-20">
                            <div className="flex items-center gap-2 bg-white/90 backdrop-blur-md border border-slate-100 px-4 py-1.5 rounded-full shadow-lg">
                                <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
                                <span className="text-[9px] font-black uppercase tracking-widest text-slate-900">PENDENTE</span>
                            </div>
                        </div>

                        <div className="relative aspect-video overflow-hidden">
                            <img
                                src={course.image_url}
                                alt=""
                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-90 group-hover:opacity-100"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 to-transparent" />
                        </div>

                        <div className="p-10 flex flex-col flex-1">
                            <div className="flex-1">
                                <h3 className="text-xl font-black uppercase tracking-tighter leading-tight mb-3 text-slate-900 group-hover:text-[#1D5F31] transition-colors">
                                    {course.title}
                                </h3>
                                <div className="flex items-center gap-3 mb-8">
                                    <div className="w-1.5 h-1.5 rounded-full bg-[#1D5F31]" />
                                    <p className="text-[10px] text-slate-900 font-black uppercase tracking-widest">
                                        Por <span className="text-black font-black">{teachersMap[course.teacher_id] || 'Instrutor Desconhecido'}</span>
                                    </p>
                                </div>
                            </div>

                            <button
                                onClick={() => setReviewingCourse(course)}
                                className="w-full py-5 bg-slate-900 text-white text-[10px] font-black uppercase tracking-[3px] hover:bg-[#1D5F31] transition-all duration-300 rounded-2xl shadow-lg shadow-slate-900/10 hover:shadow-[#1D5F31]/20 active:scale-95"
                            >
                                Revisar Conteúdo
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Modal de Revisão */}
            {reviewingCourse && (
                <div className="fixed inset-0 z-[60] lg:pl-72 flex items-center justify-center p-4 sm:p-10 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="w-full max-w-[1200px] max-h-[90vh] bg-white rounded-[40px] border border-black flex flex-col overflow-hidden shadow-[0_40px_100px_rgba(0,0,0,0.1)]">
                        
                        <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">
                            {/* Player Column */}
                            <div className="flex-1 bg-slate-50 border-b lg:border-b-0 lg:border-r border-slate-100 flex flex-col min-h-0">
                                <header className="p-8 flex justify-between items-center bg-white border-b border-slate-50">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-100">
                                            <Play size={18} className="text-[#1D5F31]" strokeWidth={2.5} />
                                        </div>
                                        <h2 className="text-xs font-black uppercase tracking-[3px] text-slate-900">VÍDEO DE INTRODUÇÃO</h2>
                                    </div>
                                    <button
                                        onClick={() => setReviewingCourse(null)}
                                        className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-900 hover:text-black hover:bg-slate-100 transition-all active:scale-90"
                                    >
                                        <X size={20} />
                                    </button>
                                </header>

                                <div className="flex-1 flex items-center justify-center bg-slate-900 p-0 relative group" key={reviewingCourse.id}>
                                    {reviewingCourse.intro_video_url ? (
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
                                        <div className="flex flex-col items-center gap-6 text-slate-900 text-center px-10">
                                            <AlertCircle size={64} strokeWidth={1.5} className="text-slate-900" />
                                            <p className="text-[10px] font-black uppercase tracking-[5px] text-slate-900">NENHUM VÍDEO DISPONÍVEL</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Moderation Column */}
                            <div className="w-full lg:w-[450px] p-10 lg:p-14 flex flex-col bg-white overflow-y-auto custom-scrollbar">
                                <div className="mb-12">
                                    <div className="flex items-center gap-2 mb-4">
                                        <div className="w-1 h-1 rounded-full bg-[#1D5F31]"></div>
                                        <span className="text-[10px] font-black uppercase tracking-[4px] text-[#1D5F31]">DETALHES DA AUDITORIA</span>
                                    </div>
                                    <h3 className="text-3xl font-black uppercase tracking-tighter leading-none text-slate-900">{reviewingCourse.title}</h3>
                                    <p className="text-[12px] text-slate-900 mt-6 leading-relaxed font-black border-l-4 border-slate-200 pl-6 uppercase tracking-tight italic">
                                        {reviewingCourse.subtitle || 'Nenhum subtítulo fornecido pelo instrutor.'}
                                    </p>
                                </div>

                                <div className="space-y-10">
                                    <div className="space-y-5">
                                        <label className="text-[10px] font-black uppercase tracking-[3px] text-slate-900 flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 bg-[#1D5F31] rounded-full"></div>
                                            Feedback para o Criador
                                        </label>
                                        <textarea
                                            value={rejectionReason}
                                            onChange={(e) => setRejectionReason(e.target.value)}
                                            placeholder="Detalhamento técnico ou pedagógico para correções..."
                                            className="w-full h-44 bg-slate-50 border border-black rounded-[24px] p-8 text-sm !text-black focus:border-black focus:bg-white outline-none transition-all resize-none placeholder:text-slate-500 font-bold shadow-inner"
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 gap-4">
                                        <button
                                            onClick={() => handleApprove(reviewingCourse.id)}
                                            disabled={loadingId === reviewingCourse.id}
                                            className="h-20 bg-[#1D5F31] text-white text-[11px] font-black uppercase tracking-[4px] hover:opacity-90 hover:shadow-2xl hover:shadow-[#1D5F31]/30 transition-all disabled:opacity-50 flex items-center justify-center rounded-[24px] active:scale-95"
                                        >
                                            {loadingId === reviewingCourse.id ? <Loader2 size={24} className="animate-spin" /> : "APROVAR CONTEÚDO"}
                                        </button>
                                        <button
                                            onClick={() => handleReject(reviewingCourse.id)}
                                            disabled={loadingId === reviewingCourse.id}
                                            className="h-16 border-2 border-black !text-rose-500 text-[10px] font-black uppercase tracking-[4px] hover:bg-rose-500 hover:text-white hover:border-rose-500 transition-all disabled:opacity-50 rounded-[20px] active:scale-95"
                                        >
                                            Reprovar Acesso
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