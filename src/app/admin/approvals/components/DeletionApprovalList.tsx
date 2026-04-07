'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { approveCourseDeletion, rejectCourseDeletion, approveLessonDeletion, rejectLessonDeletion } from '@/app/actions/admin'
import { Trash2, PlaySquare, LayoutGrid, Loader2, AlertTriangle, X, Check, Play } from 'lucide-react'
import Logo from '@/components/Logo'
import SecureMuxPlayer from '@/components/SecureMuxPlayer'

export interface LessonData {
    id: string;
    title: string;
    video_url?: string | null;
    mux_playback_id?: string | null;
    mux_asset_id?: string | null;
    course_id: string;
    course_title?: string;
    status: 'APROVADO' | 'PENDENTE' | 'SOLICITADO_EXCLUSAO' | string;
    [key: string]: any;
}

interface DeletionApprovalListProps {
    pendingCourses: any[]
    pendingLessons: LessonData[]
    teachersMap: Record<string, string>
}

export default function DeletionApprovalList({ pendingCourses, pendingLessons, teachersMap }: DeletionApprovalListProps) {
    const [courses, setCourses] = useState(pendingCourses)
    const [lessons, setLessons] = useState<LessonData[]>(pendingLessons)
    const [loadingId, setLoadingId] = useState<string | null>(null)
    const [loadingType, setLoadingType] = useState<'course' | 'lesson' | null>(null)
    const [selectedLesson, setSelectedLesson] = useState<LessonData | null>(null)

    const isEmpty = courses.length === 0 && lessons.length === 0

    const handleApproveCourse = async (id: string) => {
        if (!confirm('Confirmar exclusão PERMANENTE deste curso? Esta ação não pode ser desfeita.')) return
        
        setLoadingId(id)
        setLoadingType('course')
        try {
            const res = await approveCourseDeletion(id)
            if (res.success) {
                setCourses(courses.filter(c => c.id !== id))
            } else {
                alert(res.error)
            }
        } catch (error) {
            alert('Erro ao excluir curso')
        } finally {
            setLoadingId(null)
            setLoadingType(null)
        }
    }

    const handleRejectCourse = async (id: string) => {
        if (!confirm('Rejeitar a solicitação de exclusão? O curso voltará a estar ativo.')) return
        
        setLoadingId(id)
        setLoadingType('course')
        try {
            const res = await rejectCourseDeletion(id)
            if (res.success) {
                setCourses(courses.filter(c => c.id !== id))
            } else {
                alert(res.error)
            }
        } catch (error) {
            alert('Erro ao rejeitar exclusão')
        } finally {
            setLoadingId(null)
            setLoadingType(null)
        }
    }

    const handleApproveLesson = async (id: string) => {
        if (!confirm('Confirmar exclusão PERMANENTE desta aula? Esta ação não pode ser desfeita.')) return
        
        setLoadingId(id)
        setLoadingType('lesson')
        try {
            const res = await approveLessonDeletion(id)
            if (res.success) {
                setLessons(lessons.filter(l => l.id !== id))
            } else {
                alert(res.error)
            }
        } catch (error) {
            alert('Erro ao excluir aula')
        } finally {
            setLoadingId(null)
            setLoadingType(null)
        }
    }

    const handleRejectLesson = async (id: string) => {
        if (!confirm('Rejeitar a solicitação de exclusão? A aula voltará a estar ativa.')) return
        
        setLoadingId(id)
        setLoadingType('lesson')
        try {
            const res = await rejectLessonDeletion(id)
            if (res.success) {
                setLessons(lessons.filter(l => l.id !== id))
            } else {
                alert(res.error)
            }
        } catch (error) {
            alert('Erro ao rejeitar exclusão')
        } finally {
            setLoadingId(null)
            setLoadingType(null)
        }
    }

    if (isEmpty) {
        return (
            <div className="flex flex-col items-center justify-center py-32 bg-white border border-black/20 rounded-xl animate-in fade-in duration-700 shadow-sm">
                <div className="w-20 h-20 bg-black/5 rounded-full flex items-center justify-center mb-8 border border-black/10 shadow-inner">
                    <Trash2 size={40} className="text-black/20" />
                </div>
                <p className="!text-[#000000] font-bold uppercase tracking-wider text-[10px]">Nenhuma solicitação de exclusão pendente</p>
            </div>
        )
    }

    return (
        <div className="space-y-12 animate-in fade-in duration-700 font-montserrat">
            {/* Courses Section */}
            {courses.length > 0 && (
                <div className="space-y-6">
                    <div className="flex items-center gap-3">
                        <LayoutGrid size={18} className="text-[#1D5F31]" />
                        <h2 className="text-[11px] font-bold uppercase tracking-wider !text-[#000000]">
                            Cursos para Exclusão ({courses.length})
                        </h2>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {courses.map((course) => (
                            <div
                                key={course.id}
                                className="group bg-white border border-red-200 hover:border-red-400 transition-all duration-500 relative flex flex-col rounded-xl overflow-hidden shadow-sm hover:shadow-lg"
                            >
                                <div className="absolute top-4 left-4 z-20">
                                    <div className="flex items-center gap-2 bg-red-50 backdrop-blur-md border border-red-200 px-3 py-1 rounded-full shadow-sm">
                                        <AlertTriangle size={12} className="text-red-500" />
                                        <span className="text-[8px] font-bold uppercase tracking-wider text-red-600">SOLICITADO EXCLUSÃO</span>
                                    </div>
                                </div>

                                <div className="relative aspect-video overflow-hidden bg-slate-100 flex items-center justify-center">
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
                                    <div className="absolute inset-0 bg-gradient-to-t from-red-900/30 to-transparent pointer-events-none" />
                                </div>

                                <div className="p-6 flex flex-col flex-1">
                                    <div className="flex-1 mb-4">
                                        <h3 className="text-base font-bold uppercase tracking-tighter leading-tight mb-2 !text-[#000000] group-hover:text-red-600 transition-colors">
                                            {course.title}
                                        </h3>
                                        <div className="flex items-center gap-2.5 mb-4">
                                            <div className="w-1 h-1 rounded-full bg-black/30" />
                                            <p className="text-[10px] !text-[#000000] font-bold uppercase tracking-wider">
                                                Por <span className="!text-[#000000]">{teachersMap[course.teacher_id] || 'Instrutor Desconhecido'}</span>
                                            </p>
                                        </div>
                                        <p className="text-[9px] !text-red-600 font-medium">
                                            O instructor solicitou a exclusão deste curso.
                                        </p>
                                    </div>

                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => handleApproveCourse(course.id)}
                                            disabled={loadingId === course.id && loadingType === 'course'}
                                            className="flex-1 py-3 bg-red-600 text-white text-[9px] font-bold uppercase tracking-wider hover:bg-red-700 transition-all duration-300 rounded-lg shadow-sm active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                                        >
                                            {loadingId === course.id && loadingType === 'course' ? (
                                                <Loader2 size={14} className="animate-spin" />
                                            ) : (
                                                <Trash2 size={14} />
                                            )}
                                            Excluir
                                        </button>
                                        <button
                                            onClick={() => handleRejectCourse(course.id)}
                                            disabled={loadingId === course.id && loadingType === 'course'}
                                            className="flex-1 py-3 bg-white border border-green-600 text-green-700 text-[9px] font-bold uppercase tracking-wider hover:bg-green-50 transition-all duration-300 rounded-lg shadow-sm active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                                        >
                                            {loadingId === course.id && loadingType === 'course' ? (
                                                <Loader2 size={14} className="animate-spin" />
                                            ) : (
                                                <Check size={14} />
                                            )}
                                            Manter
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Lessons Section */}
            {lessons.length > 0 && (
                <div className="space-y-6">
                    <div className="flex items-center gap-3">
                        <PlaySquare size={18} className="text-[#1D5F31]" />
                        <h2 className="text-[11px] font-bold uppercase tracking-wider !text-[#000000]">
                            Aulas para Exclusão ({lessons.length})
                        </h2>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {lessons.map((lesson) => (
                            <div
                                key={lesson.id}
                                className="group bg-white border border-red-200 hover:border-red-400 transition-all duration-500 relative flex flex-col rounded-xl overflow-hidden shadow-sm hover:shadow-lg"
                            >
                                <div className="absolute top-4 left-4 z-20">
                                    <div className="flex items-center gap-2 bg-red-50 backdrop-blur-md border border-red-200 px-3 py-1 rounded-full shadow-sm">
                                        <AlertTriangle size={12} className="text-red-500" />
                                        <span className="text-[8px] font-bold uppercase tracking-wider text-red-600">SOLICITADO EXCLUSÃO</span>
                                    </div>
                                </div>

                                <div 
                                    className="relative aspect-video overflow-hidden bg-slate-100 flex items-center justify-center cursor-pointer group/video"
                                    onClick={() => setSelectedLesson(lesson)}
                                >
                                    {lesson.video_url ? (
                                        <video
                                            src={lesson.video_url}
                                            className="w-full h-full object-cover transition-transform duration-700 group-hover/video:scale-105 opacity-90"
                                        />
                                    ) : (
                                        <div className="scale-75 origin-center">
                                            <Logo light />
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-black/20 group-hover/video:bg-black/40 transition-colors duration-300 pointer-events-none" />
                                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/video:opacity-100 transition-opacity duration-300 scale-90 group-hover/video:scale-100 pointer-events-none">
                                        <div className="w-16 h-16 bg-[#1D5F31]/90 rounded-full flex items-center justify-center shadow-lg backdrop-blur-sm">
                                            <Play size={24} className="text-white ml-1 fill-white" />
                                        </div>
                                    </div>
                                    <div className="absolute inset-0 bg-gradient-to-t from-red-900/30 to-transparent pointer-events-none" />
                                </div>

                                <div className="p-6 flex flex-col flex-1">
                                    <div className="flex-1 mb-4">
                                        <h3 className="text-base font-bold uppercase tracking-tighter leading-tight mb-2 !text-[#000000] group-hover:text-red-600 transition-colors">
                                            {lesson.title}
                                        </h3>
                                        <div className="flex items-center gap-2.5 mb-4">
                                            <div className="w-1 h-1 rounded-full bg-black/30" />
                                            <p className="text-[10px] !text-[#000000] font-bold uppercase tracking-wider">
                                                Curso: {lesson.course_title || 'N/A'}
                                            </p>
                                        </div>
                                        <p className="text-[9px] !text-red-600 font-medium">
                                            O instructor solicitou a exclusão desta aula.
                                        </p>
                                    </div>

                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => handleApproveLesson(lesson.id)}
                                            disabled={loadingId === lesson.id && loadingType === 'lesson'}
                                            className="flex-1 py-3 bg-red-600 text-white text-[9px] font-bold uppercase tracking-wider hover:bg-red-700 transition-all duration-300 rounded-lg shadow-sm active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                                        >
                                            {loadingId === lesson.id && loadingType === 'lesson' ? (
                                                <Loader2 size={14} className="animate-spin" />
                                            ) : (
                                                <Trash2 size={14} />
                                            )}
                                            Excluir
                                        </button>
                                        <button
                                            onClick={() => handleRejectLesson(lesson.id)}
                                            disabled={loadingId === lesson.id && loadingType === 'lesson'}
                                            className="flex-1 py-3 bg-white border border-green-600 text-green-700 text-[9px] font-bold uppercase tracking-wider hover:bg-green-50 transition-all duration-300 rounded-lg shadow-sm active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                                        >
                                            {loadingId === lesson.id && loadingType === 'lesson' ? (
                                                <Loader2 size={14} className="animate-spin" />
                                            ) : (
                                                <Check size={14} />
                                            )}
                                            Manter
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Video Player Modal */}
            <AnimatePresence>
                {selectedLesson && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8">
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedLesson(null)}
                            className="absolute inset-0 bg-black/90 backdrop-blur-md cursor-pointer"
                        />

                        {/* Modal Content */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative w-full max-w-5xl bg-[#061629] border border-slate-800 rounded-2xl overflow-hidden shadow-2xl z-10"
                        >
                            <button
                                onClick={() => setSelectedLesson(null)}
                                className="absolute top-4 right-4 z-50 p-2 bg-black/50 hover:bg-[#1D5F31] text-white rounded-full transition-colors"
                            >
                                <X size={20} />
                            </button>

                            <div className="p-1">
                                {selectedLesson.mux_playback_id ? (
                                    <SecureMuxPlayer
                                        cursoId={selectedLesson.course_id}
                                        playbackId={selectedLesson.mux_playback_id}
                                        className="w-full aspect-video rounded-xl"
                                    />
                                ) : selectedLesson.video_url ? (
                                    <video
                                        src={selectedLesson.video_url}
                                        controls
                                        autoPlay
                                        className="w-full aspect-video object-contain bg-black rounded-xl"
                                    />
                                ) : (
                                    <div className="w-full aspect-video flex flex-col items-center justify-center bg-slate-900 rounded-xl text-slate-400">
                                        <AlertTriangle size={32} className="mb-4 text-slate-500" />
                                        <p>Vídeo não disponível.</p>
                                    </div>
                                )}
                            </div>

                            <div className="p-6 bg-[#061629] border-t border-slate-800">
                                <h3 className="text-xl font-bold text-white mb-2 uppercase tracking-tighter">{selectedLesson.title}</h3>
                                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Curso: {selectedLesson.course_title || 'N/A'}</p>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    )
}
