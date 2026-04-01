"use client"

import { useState, useEffect, use } from 'react'
import Link from 'next/link'
import {
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    Menu,
    X,
    PlayCircle,
    Loader2,
    HelpCircle,
    AlertTriangle
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { getAdminClassroomData, adminSuspendLesson } from './actions'

const scrollbarHideStyle = {
    msOverflowStyle: 'none',
    scrollbarWidth: 'none',
} as const;

export default function AdminClassroomPage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = use(params)
    const router = useRouter()

    const [sidebarOpen, setSidebarOpen] = useState(true)
    const [course, setCourse] = useState<any>(null)
    const [lessons, setLessons] = useState<any[]>([])
    const [currentLesson, setCurrentLesson] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [suspeningId, setSuspendingId] = useState<string | null>(null)

    useEffect(() => {
        async function loadData() {
            try {
                const result = await getAdminClassroomData(resolvedParams.id)

                if (!result.success) {
                    if (result.error === 'COURSE_NOT_FOUND') {
                        setError("Treinamento não encontrado.")
                    } else {
                        setError("Erro ao carregar conteúdo.")
                    }
                    return
                }

                setCourse(result.course)
                setLessons(result.lessons || [])

                if (result.lessons && result.lessons.length > 0) {
                    setCurrentLesson(result.lessons[0])
                } else {
                    setError("Nenhuma aula encontrada para este curso.")
                }
            } catch (err) {
                console.error("Erro ao carregar classroom:", err)
                setError("Ocorreu um erro inesperado.")
            } finally {
                setLoading(false)
            }
        }

        loadData()
    }, [resolvedParams.id])

    const goToNextLesson = () => {
        const index = lessons.findIndex(l => l.id === currentLesson?.id)
        if (index < lessons.length - 1) {
            setCurrentLesson(lessons[index + 1])
        }
    }

    const goToPrevLesson = () => {
        const index = lessons.findIndex(l => l.id === currentLesson?.id)
        if (index > 0) {
            setCurrentLesson(lessons[index - 1])
        }
    }

    const handleSuspendLesson = async (lessonId: string) => {
        if (!confirm("Tem certeza que deseja SUSPENDER esta unidade? Os alunos não poderão mais vê-la.")) return
        
        setSuspendingId(lessonId)
        try {
            const result = await adminSuspendLesson(lessonId)
            if (result.success) {
                alert("Unidade suspensa com sucesso!")
                setLessons(prev => prev.map(l => l.id === lessonId ? { ...l, status: 'SUSPENSO' } : l))
                if (currentLesson?.id === lessonId) {
                    setCurrentLesson((prev: any) => prev ? { ...prev, status: 'SUSPENSO' } : null)
                }
            } else {
                alert(result.error || "Erro ao suspender.")
            }
        } catch (err) {
            alert("Erro ao suspender.")
        } finally {
            setSuspendingId(null)
        }
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'APROVADO':
                return <span className="text-green-500 text-[9px] font-black uppercase tracking-widest">APROVADO</span>
            case 'PENDENTE':
                return <span className="text-amber-500 text-[9px] font-black uppercase tracking-widest">PENDENTE</span>
            case 'REJEITADO':
                return <span className="text-red-500 text-[9px] font-black uppercase tracking-widest">REJEITADO</span>
            case 'SUSPENSO':
                return <span className="text-slate-500 text-[9px] font-black uppercase tracking-widest">SUSPENSO</span>
            default:
                return <span className="text-slate-400 text-[9px] font-black uppercase tracking-widest">{status}</span>
        }
    }

    if (loading) {
        return (
            <div className="h-screen bg-slate-900 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="animate-spin text-[#1D5F31]" size={48} />
                    <p className="text-xs font-black uppercase tracking-widest text-slate-400 animate-pulse">
                        Carregando Sala de Auditoria...
                    </p>
                </div>
            </div>
        )
    }

    if (error || !course) {
        return (
            <div className="h-screen bg-slate-900 flex flex-col items-center justify-center p-8 text-center font-exo">
                <h1 className="text-2xl font-black uppercase italic tracking-tighter text-white">
                    {error || 'Treinamento não encontrado'}
                </h1>
                <Link href="/admin/all-courses" className="mt-6 text-[#1D5F31] font-bold uppercase text-xs tracking-widest underline">
                    Voltar para Catálogo
                </Link>
            </div>
        )
    }

    return (
        <div className="flex flex-col h-screen overflow-hidden font-exo transition-colors duration-500 bg-slate-900 text-white classroom-theme">
            <style jsx global>{`
                .scrollbar-hide::-webkit-scrollbar {
                    display: none;
                }
                .scrollbar-hide {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
            `}</style>
            
            {/* Header */}
            <header className="h-16 flex items-center justify-between px-6 border-b border-slate-800 bg-slate-900 z-50 shadow-sm">
                <div className="flex items-center w-1/4">
                    <Link href="/admin/all-courses" className="flex items-center gap-3 text-slate-400 hover:text-white transition-colors group">
                        <ChevronLeft size={20} />
                        <span className="text-xs font-black uppercase tracking-widest group-hover:text-white transition-colors">
                            Voltar
                        </span>
                    </Link>
                </div>

                <div className="flex-1 flex justify-center items-center px-4">
                    <h1 className="text-sm md:text-base font-bold font-exo tracking-tight text-center line-clamp-1 text-white">
                        {course?.title || 'Carregando...'}
                    </h1>
                </div>

                <div className="flex items-center justify-end w-1/4">
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            className="p-2 bg-slate-800/50 text-slate-400 border border-slate-800 rounded-xl transition-colors hover:text-white flex items-center justify-center"
                        >
                            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
                        </button>
                    </div>
                </div>
            </header>

            <main className="flex flex-1 overflow-hidden h-full">
                {/* Player Section */}
                <div 
                    className="flex-1 overflow-y-auto flex flex-col transition-colors duration-500 bg-slate-900 scrollbar-hide"
                    style={scrollbarHideStyle}
                >
                    <div className="flex-1 flex items-center justify-center p-0 md:p-6 lg:p-8">
                        <div className="w-full max-w-[1440px] aspect-video relative group animate-in zoom-in-95 duration-700">
                            {currentLesson?.type === 'quiz' ? (
                                <div className="w-full h-full rounded-2xl overflow-hidden border border-slate-700 bg-slate-800 flex flex-col items-center justify-center p-8">
                                    <HelpCircle size={64} className="text-[#1D5F31] mb-4" />
                                    <h2 className="text-2xl font-black uppercase tracking-tighter text-white mb-2">
                                        {currentLesson?.title || 'Questionário'}
                                    </h2>
                                    <p className="text-slate-400 font-medium">
                                        {currentLesson?.quizData?.questions?.length || 0} questões cadastradas
                                    </p>
                                </div>
                            ) : currentLesson?.video_url ? (
                                <div className="relative w-full h-full rounded-2xl overflow-hidden border border-slate-100 shadow-2xl transition-all duration-500 bg-black">
                                    <video
                                        src={currentLesson?.video_url}
                                        controls
                                        className="w-full h-full object-contain"
                                        poster={course?.image_url}
                                    />
                                </div>
                            ) : (
                                <div className="w-full h-full rounded-2xl overflow-hidden border border-slate-700 bg-slate-800 flex flex-col items-center justify-center">
                                    <p className="text-slate-500 font-black uppercase tracking-widest text-xs">
                                        Nenhum vídeo cadastrado
                                    </p>
                                </div>
                            )}

                            <div className="flex items-center justify-between mt-2 px-4 md:px-0">
                                <button
                                    onClick={goToPrevLesson}
                                    disabled={lessons.findIndex(l => l.id === currentLesson?.id) === 0}
                                    className={`flex items-center gap-2 px-8 py-4 rounded-xl font-black font-exo uppercase tracking-tighter transition-all shadow-sm border ${lessons.findIndex(l => l.id === currentLesson?.id) === 0
                                        ? 'bg-slate-800/50 text-slate-500 border-slate-800 cursor-not-allowed'
                                        : 'bg-slate-800 text-white hover:bg-slate-700 hover:border-white/20 border-slate-700'
                                        }`}
                                >
                                    <ChevronLeft size={20} />
                                    <span className="text-xs">Anterior</span>
                                </button>

                                <button
                                    onClick={goToNextLesson}
                                    disabled={lessons.findIndex(l => l.id === currentLesson?.id) === lessons.length - 1}
                                    className={`flex items-center gap-2 px-8 py-4 rounded-xl font-black font-exo uppercase tracking-tighter transition-all shadow-md ${lessons.findIndex(l => l.id === currentLesson?.id) === lessons.length - 1
                                        ? 'bg-slate-800/50 text-slate-500 border-slate-800 cursor-not-allowed'
                                        : 'bg-green-600 text-white hover:bg-green-500 hover:scale-105 transition-all shadow-lg'
                                        }`}
                                >
                                    <span className="text-xs">Próxima Aula</span>
                                    <ChevronRight size={20} />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Lesson Info */}
                    <div className="px-6 md:px-12 pb-16">
                        <div className="max-w-[1440px] mx-auto">
                            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-xl font-black uppercase tracking-tighter text-white">
                                        {currentLesson?.title}
                                    </h2>
                                    <div className="flex items-center gap-3">
                                        {getStatusBadge(currentLesson?.status)}
                                        {currentLesson?.status !== 'SUSPENSO' && (
                                            <button
                                                onClick={() => handleSuspendLesson(currentLesson?.id)}
                                                disabled={suspeningId === currentLesson?.id}
                                                className="flex items-center gap-2 px-4 py-2 bg-red-500/10 text-red-500 border border-red-500/30 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all"
                                            >
                                                {suspeningId === currentLesson?.id ? (
                                                    <Loader2 size={14} className="animate-spin" />
                                                ) : (
                                                    <AlertTriangle size={14} />
                                                )}
                                                Suspender
                                            </button>
                                        )}
                                    </div>
                                </div>
                                <p className="text-slate-400 text-sm font-medium">
                                    {currentLesson?.description || 'Sem descrição'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sidebar */}
                <aside
                    className={`
                        fixed md:relative top-0 right-0 h-full w-full md:w-[420px] transition-all duration-500 ease-in-out z-40 shadow-xl border-l border-slate-800 bg-slate-900
                        ${sidebarOpen ? 'translate-x-0' : 'translate-x-full md:hidden'}
                    `}
                >
                    <div className="flex flex-col h-full">
                        <div className="p-8 border-b border-slate-800 bg-slate-900">
                            <h3 className="text-[10px] font-black uppercase tracking-[4px] text-[#1D5F31] mb-1 font-exo">CONTEÚDO DO CURSO</h3>
                            <p className="text-[11px] font-black uppercase truncate tracking-tight text-white font-exo">{course?.title}</p>
                        </div>

                        <div 
                            className="flex-1 overflow-y-auto scrollbar-hide"
                            style={scrollbarHideStyle}
                        >
                            <div className="divide-y divide-slate-800">
                                {lessons.map((lesson) => (
                                    <button
                                        key={lesson.id}
                                        onClick={() => setCurrentLesson(lesson)}
                                        className={`
                                            w-full flex items-center gap-4 px-8 py-6 text-left transition-all relative group border-b border-slate-800
                                            ${currentLesson?.id === lesson.id
                                                ? 'bg-slate-800/50'
                                                : 'hover:bg-slate-800/30'}
                                        `}
                                    >
                                        {currentLesson?.id === lesson.id && (
                                            <div className="absolute left-0 top-0 bottom-0 w-[4px] bg-[#1D5F31]"></div>
                                        )}

                                        <div
                                            className={`
                                                flex-shrink-0 w-6 h-6 rounded-full border flex items-center justify-center transition-all
                                                ${lesson.status === 'APROVADO' 
                                                    ? 'bg-[#1D5F31] border-[#1D5F31]'
                                                    : lesson.status === 'SUSPENSO'
                                                    ? 'bg-slate-600 border-slate-600'
                                                    : lesson.status === 'PENDENTE'
                                                    ? 'bg-amber-500 border-amber-500'
                                                    : 'border-slate-700 bg-slate-800'}
                                            `}
                                        >
                                            {lesson.type === 'quiz' ? (
                                                <HelpCircle size={12} className="text-white" />
                                            ) : lesson.status === 'APROVADO' ? (
                                                <CheckCircle2 size={12} className="text-white" />
                                            ) : null}
                                        </div>

                                        <div className="flex-1 min-w-0 font-exo">
                                            <p className={`text-[13px] font-bold tracking-tight truncate ${currentLesson?.id === lesson.id
                                                ? 'text-white'
                                                : 'text-slate-400 group-hover:text-white'}`}>
                                                {lesson.title}
                                            </p>
                                            <div className="flex items-center gap-2 mt-1">
                                                {lesson.type === 'quiz' ? (
                                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">QUESTIONÁRIO</span>
                                                ) : (
                                                    <span className="text-[9px] font-black text-slate-200 uppercase tracking-widest leading-none">VÍDEO AULA</span>
                                                )}
                                                <span className={`flex h-1 w-1 rounded-full ${
                                                    lesson.status === 'APROVADO' ? 'bg-green-500' : 
                                                    lesson.status === 'PENDENTE' ? 'bg-amber-500 animate-pulse' :
                                                    lesson.status === 'SUSPENSO' ? 'bg-slate-500' :
                                                    'bg-red-500'
                                                }`}></span>
                                                {getStatusBadge(lesson.status)}
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </aside>
            </main>
        </div>
    )
}
