'use client'

import { useState } from 'react'
import { approveLesson, rejectLesson } from '@/app/actions/admin'
import { X, PlaySquare, AlertCircle, Loader2 } from 'lucide-react'
import Logo from '@/components/Logo'

interface Lesson {
    id: string
    title: string
    video_url: string
    course_id: string
    course_title: string
    course_status: string
    teacher_id: string
}

interface LessonApprovalListProps {
    lessons: Lesson[]
    teachersMap: Record<string, string>
}

export default function LessonApprovalList({ lessons, teachersMap }: LessonApprovalListProps) {
    const [lessonList, setLessonList] = useState(lessons)
    const [loadingId, setLoadingId] = useState<string | null>(null)
    const [reviewingLesson, setReviewingLesson] = useState<Lesson | null>(null)
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
            const res = await approveLesson(id)
            if (res.success) {
                setLessonList(lessonList.filter(l => l.id !== id))
                setReviewingLesson(null)
            } else {
                alert(res.error)
            }
        } catch (error) {
            alert('Erro ao aprovar aula')
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
            const res = await rejectLesson(id, rejectionReason)
            if (res.success) {
                setLessonList(lessonList.filter(l => l.id !== id))
                setReviewingLesson(null)
                setRejectionReason('')
            } else {
                alert(res.error)
            }
        } catch (error) {
            alert('Erro ao rejeitar aula')
        } finally {
            setLoadingId(null)
        }
    }

    if (lessonList.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-32 bg-white border border-black/20 rounded-xl animate-in fade-in duration-700 shadow-sm">
                <div className="w-20 h-20 bg-black/5 rounded-full flex items-center justify-center mb-8 border border-black/10 shadow-inner">
                    <PlaySquare size={40} className="text-black/20" />
                </div>
                <p className="!text-[#000000] font-bold uppercase tracking-wider text-[10px]">Tudo em Dia: Nenhuma aula pendente</p>
            </div>
        )
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-700 font-exo">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-separate border-spacing-y-4">
                    <thead>
                        <tr className="text-[10px] font-black uppercase tracking-wider !text-[#000000] text-left">
                            <th className="px-8 py-4 font-black">Ficha Técnica</th>
                            <th className="px-8 py-4 font-black">Procedência</th>
                            <th className="px-8 py-4 text-right font-black">Protocolo</th>
                        </tr>
                    </thead>
                    <tbody>
                        {lessonList.map((lesson) => (
                            <tr key={lesson.id} className="group bg-white border border-black/10 hover:border-[#1D5F31]/30 transition-all duration-300 shadow-sm hover:shadow-md">
                                <td className="px-8 py-6 rounded-l-xl">
                                    <div className="flex flex-col">
                                        <h3 className="font-black !text-[#000000] uppercase tracking-tight text-sm group-hover:text-[#1D5F31] transition-colors">{lesson.title}</h3>
                                        <div className="flex items-center gap-2 mt-1.5">
                                            <div className="w-1 h-1 rounded-full bg-black/30"></div>
                                            <p className="text-[10px] !text-[#000000] font-bold uppercase tracking-wider">
                                                CURSO: <span className="!text-[#000000]">{lesson.course_title}</span>
                                            </p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-8 py-6">
                                    <div className="flex flex-col text-[10px] !text-[#000000] font-bold uppercase tracking-wider">
                                        <span className="text-[8px] !text-[#000000] mb-0.5">CRIADOR</span>
                                        <span className="!text-[#000000]">{teachersMap[lesson.teacher_id] || 'Instrutor Desconhecido'}</span>
                                    </div>
                                </td>
                                <td className="px-8 py-6 rounded-r-xl text-right">
                                    <button
                                        onClick={() => setReviewingLesson(lesson)}
                                        className="h-11 px-8 bg-[#1D5F31] text-white text-[10px] font-bold uppercase tracking-wider hover:bg-slate-900 rounded-lg transition-all duration-300 shadow-sm active:scale-95"
                                    >
                                        Revisar Aula
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {reviewingLesson && (
                <div className="fixed inset-0 z-[60] lg:pl-72 flex items-center justify-center p-4 sm:p-10 bg-slate-950/40 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="w-full max-w-[1200px] max-h-[90vh] bg-white rounded-xl border border-black/10 flex flex-col overflow-hidden shadow-2xl">
                        <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">

                            {/* Player Column */}
                            <div className="flex-1 bg-black/5 border-b lg:border-b-0 lg:border-r border-black/10 flex flex-col min-h-0">
                                <header className="p-6 flex justify-between items-center bg-white border-b border-black/5">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-lg bg-black/5 flex items-center justify-center border border-black/10">
                                            <PlaySquare size={18} className="text-[#1D5F31]" strokeWidth={2.5} />
                                        </div>
                                        <h2 className="text-[11px] font-bold uppercase tracking-wider !text-[#000000]">AUDITORIA DE VÍDEO-AULA</h2>
                                    </div>
                                    <button 
                                        onClick={() => setReviewingLesson(null)} 
                                        className="w-10 h-10 rounded-full bg-black/5 flex items-center justify-center text-slate-700 hover:text-slate-950 hover:bg-slate-100 transition-all active:scale-90"
                                    >
                                        <X size={20} />
                                    </button>
                                </header>

                                <div className="flex-1 flex items-center justify-center bg-slate-900 p-0 relative group" key={reviewingLesson.id}>
                                    {isExternalVideo(reviewingLesson.video_url) ? (
                                        <iframe
                                            src={getEmbedUrl(reviewingLesson.video_url)}
                                            className="w-full h-full aspect-video border-0"
                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                                            allowFullScreen
                                        ></iframe>
                                    ) : (
                                        <video
                                            src={reviewingLesson.video_url}
                                            controls
                                            autoPlay
                                            muted
                                            playsInline
                                            className="w-full h-full aspect-video object-contain"
                                        />
                                    )}
                                </div>
                            </div>

                            {/* Moderation Column */}
                            <div className="w-full lg:w-[450px] p-10 lg:p-12 flex flex-col bg-white overflow-y-auto custom-scrollbar">
                                <div className="mb-10">
                                    <div className="flex items-center gap-2 mb-4">
                                        <div className="w-1 h-1 rounded-full bg-[#1D5F31]"></div>
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#1D5F31]">DETALHES DA UNIDADE</span>
                                    </div>
                                    <h3 className="text-3xl font-black uppercase tracking-tighter leading-tight !text-[#000000]">{reviewingLesson.title}</h3>
                                    <div className="mt-8 p-6 bg-black/5 rounded-xl border border-black/10">
                                        <p className="text-[9px] !text-[#000000] font-bold uppercase tracking-wider mb-1">VINCULADA AO CURSO</p>
                                        <p className="text-[12px] !text-[#000000] font-bold uppercase tracking-wider leading-tight">{reviewingLesson.course_title}</p>
                                    </div>
                                </div>

                                <div className="space-y-8">
                                    <div className="space-y-4">
                                        <label className="text-[10px] font-bold uppercase tracking-wider !text-[#000000] flex items-center gap-2">
                                            <div className="w-1 h-1 bg-rose-500 rounded-full"></div>
                                            Feedback Técnico
                                        </label>
                                        <textarea
                                            value={rejectionReason}
                                            onChange={(e) => setRejectionReason(e.target.value)}
                                            placeholder="Detalhamento das correções técnicas necessárias..."
                                            className="w-full h-44 bg-black/5 border border-black/10 rounded-xl p-6 text-sm text-slate-900 focus:border-[#1D5F31]/30 focus:bg-white outline-none transition-all resize-none placeholder:text-black/30 font-bold shadow-inner"
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 gap-4 pt-4">
                                        <button
                                            onClick={() => handleApprove(reviewingLesson.id)}
                                            disabled={loadingId === reviewingLesson.id}
                                            className="h-16 bg-[#1D5F31] text-white text-[11px] font-bold uppercase tracking-wider hover:bg-slate-900 transition-all disabled:opacity-50 flex items-center justify-center rounded-xl active:scale-95 shadow-sm"
                                        >
                                            {loadingId === reviewingLesson.id ? <Loader2 size={24} className="animate-spin" /> : "APROVAR AULA"}
                                        </button>
                                        <button
                                            onClick={() => handleReject(reviewingLesson.id)}
                                            disabled={loadingId === reviewingLesson.id}
                                            className="h-14 border border-black/10 text-rose-500 text-[10px] font-bold uppercase tracking-wider hover:bg-rose-500 hover:text-white transition-all disabled:opacity-50 rounded-xl active:scale-95"
                                        >
                                            Reprovar Unidade
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