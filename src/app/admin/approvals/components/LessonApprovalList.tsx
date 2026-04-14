'use client'

import { useState } from 'react'
import { approveLesson, rejectLesson } from '@/app/actions/admin'
import { X, PlaySquare, AlertCircle, Loader2, HelpCircle, CheckCircle2, User } from 'lucide-react'
import Logo from '@/components/Logo'
import { Question } from '@/lib/types/quiz'
import SecureMuxPlayer from '@/components/SecureMuxPlayer'

interface Lesson {
    id: string
    title: string
    video_url?: string | null
    mux_playback_id?: string | null
    course_id: string
    course_title: string
    course_status: string
    teacher_id: string
    type?: 'lesson' | 'quiz'
    quizData?: {
        id?: string
        title?: string
        description?: string
        questions?: Question[]
    }
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

    const isExternalVideo = (url: string | null | undefined) => {
        if (!url) return false
        return url.includes('youtube.com') || url.includes('youtu.be') || url.includes('vimeo.com')
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
            <div className="flex flex-col items-center justify-center py-32 rounded-xl animate-in fade-in duration-700" style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0' }}>
                <div className="w-20 h-20 rounded-full flex items-center justify-center mb-8" style={{ backgroundColor: '#f1f5f9', border: '1px solid #e2e8f0' }}>
                    <PlaySquare size={40} style={{ color: '#94a3b8' }} />
                </div>
                <p className="font-bold uppercase tracking-wider text-[10px]" style={{ color: '#000000' }}>Tudo em Dia: Nenhuma aula pendente</p>
            </div>
        )
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-700 font-montserrat">
            <div className="overflow-x-auto rounded-xl border-2" style={{ borderColor: '#e2e8f0', backgroundColor: '#fff' }}>
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr style={{ backgroundColor: '#0f172a' }}>
                            <th className="p-6 text-[10px] font-bold uppercase tracking-wider text-left" style={{ color: '#fff' }}>Aula</th>
                            <th className="p-6 text-[10px] font-bold uppercase tracking-wider text-left" style={{ color: '#fff' }}>Curso</th>
                            <th className="p-6 text-[10px] font-bold uppercase tracking-wider text-left" style={{ color: '#fff' }}>Professor</th>
                            <th className="p-6 text-[10px] font-bold uppercase tracking-wider text-right" style={{ color: '#fff' }}>Ação</th>
                        </tr>
                    </thead>
                    <tbody>
                        {lessonList.map((lesson) => (
                            <tr 
                                key={lesson.id} 
                                className="border-b transition-all duration-300 hover:shadow-xl cursor-pointer"
                                style={{ borderColor: '#e2e8f0', backgroundColor: '#ffffff' }}
                            >
                                <td className="p-6">
                                    <div className="flex items-center gap-4">
                                        <div className="w-16 h-16 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#f1f5f9', border: '1px solid #e2e8f0' }}>
                                            {lesson.type === 'quiz' ? (
                                                <HelpCircle size={24} style={{ color: '#1D5F31' }} />
                                            ) : (
                                                <PlaySquare size={24} style={{ color: '#1D5F31' }} />
                                            )}
                                        </div>
                                        <div>
                                            <h3 className="font-bold uppercase tracking-tight text-sm" style={{ color: '#0f172a' }}>{lesson.title}</h3>
                                            <p className="text-[10px] font-bold uppercase tracking-wider mt-1" style={{ color: '#64748b' }}>
                                                {lesson.type === 'quiz' ? 'QUESTIONÁRIO' : 'VÍDEO-AULA'}
                                            </p>
                                        </div>
                                    </div>
                                </td>
                                <td className="p-6">
                                    <span className="text-xs font-bold" style={{ color: '#334155' }}>{lesson.course_title}</span>
                                </td>
                                <td className="p-6">
                                    <div className="flex items-center gap-2">
                                        <User size={14} style={{ color: '#94a3b8' }} />
                                        <span className="text-xs font-bold uppercase tracking-wide" style={{ color: '#334155' }}>
                                            {teachersMap[lesson.teacher_id] || 'Instrutor Desconhecido'}
                                        </span>
                                    </div>
                                </td>
                                <td className="p-6 text-right">
                                    <button
                                        onClick={() => setReviewingLesson(lesson)}
                                        className="h-11 px-8 text-white text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all duration-300 active:scale-95 hover:shadow-lg"
                                        style={{ backgroundColor: '#1D5F31' }}
                                    >
                                        Revisar
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
                                            {reviewingLesson.type === 'quiz' ? (
                                                <HelpCircle size={18} className="text-[#1D5F31]" strokeWidth={2.5} />
                                            ) : (
                                                <PlaySquare size={18} className="text-[#1D5F31]" strokeWidth={2.5} />
                                            )}
                                        </div>
                                        <h2 className="text-[11px] font-bold uppercase tracking-wider !text-[#000000]">
                                            {reviewingLesson.type === 'quiz' ? 'AUDITORIA DE QUESTIONÁRIO' : 'AUDITORIA DE VÍDEO-AULA'}
                                        </h2>
                                    </div>
                                    <button 
                                        onClick={() => setReviewingLesson(null)} 
                                        className="w-10 h-10 rounded-full bg-black/5 flex items-center justify-center text-slate-700 hover:text-slate-950 hover:bg-slate-100 transition-all active:scale-90"
                                    >
                                        <X size={20} />
                                    </button>
                                </header>

                                <div className="flex-1 flex items-center justify-center bg-slate-900 p-0 relative group overflow-y-auto" key={reviewingLesson.id}>
                                    {reviewingLesson.type === 'quiz' && reviewingLesson.quizData?.questions ? (
                                        <div className="w-full h-full p-8 overflow-y-auto bg-white">
                                            <div className="max-w-2xl mx-auto space-y-6">
                                                <h3 className="text-xl font-bold uppercase tracking-tighter text-slate-900 mb-6">
                                                    {reviewingLesson.quizData.title || reviewingLesson.title}
                                                </h3>
                                                {reviewingLesson.quizData.questions.map((question, qIndex) => (
                                                    <div key={qIndex} className="bg-slate-50 border border-slate-200 rounded-xl p-6">
                                                        <div className="flex items-start gap-3 mb-4">
                                                            <span className="bg-slate-900 text-white text-xs font-bold px-3 py-1 rounded-lg">
                                                                {qIndex + 1}
                                                            </span>
                                                            <p className="font-bold text-slate-900 flex-1">{question.text}</p>
                                                        </div>
                                                        <div className="space-y-2 ml-8">
                                                            {question.options?.map((option, oIndex) => (
                                                                <div 
                                                                    key={oIndex} 
                                                                    className={`flex items-center gap-3 p-3 rounded-lg border ${
                                                                        question.correctAnswer === oIndex 
                                                                            ? 'bg-green-50 border-green-500 text-green-700' 
                                                                            : 'bg-white border-slate-200 text-slate-600'
                                                                    }`}
                                                                >
                                                                    {question.correctAnswer === oIndex && (
                                                                        <CheckCircle2 size={16} className="text-green-500" />
                                                                    )}
                                                                    <span className="text-sm font-medium">{option}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ) : reviewingLesson.mux_playback_id ? (
                                        <div className="p-1 w-full h-full flex mt-4 items-center justify-center">
                                            <SecureMuxPlayer
                                                cursoId={reviewingLesson.course_id}
                                                playbackId={reviewingLesson.mux_playback_id}
                                                className="w-full h-full aspect-video border-0 rounded-md"
                                            />
                                        </div>
                                    ) : isExternalVideo(reviewingLesson.video_url || '') ? (
                                        <iframe
                                            src={getEmbedUrl(reviewingLesson.video_url || '')}
                                            className="w-full h-full aspect-video border-0"
                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                                            allowFullScreen
                                        ></iframe>
                                    ) : reviewingLesson.video_url ? (
                                        <video
                                            src={reviewingLesson.video_url}
                                            controls
                                            autoPlay
                                            muted
                                            playsInline
                                            className="w-full h-full aspect-video object-contain"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900 border-0 rounded-md text-slate-400">
                                            <p>Vídeo não disponível.</p>
                                        </div>
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
                                    <h3 className="text-3xl font-bold uppercase tracking-tighter leading-tight !text-[#000000]">{reviewingLesson.title}</h3>
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