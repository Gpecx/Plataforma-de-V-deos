"use client"

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    Menu,
    X,
    PlayCircle,
    Loader2,
    Lightbulb,
    Moon
} from 'lucide-react'
import { useParams, useRouter } from 'next/navigation'
import { ClassroomTabs } from './ClassroomTabs'
import { auth } from '@/lib/firebase'
import Logo from '@/components/Logo'
import { onAuthStateChanged } from 'firebase/auth'
import { getClassroomData } from './actions'

const scrollbarHideStyle = {
    msOverflowStyle: 'none',
    scrollbarWidth: 'none',
} as const;

export default function ClassroomPage() {
    const params = useParams()
    const router = useRouter()

    const [sidebarOpen, setSidebarOpen] = useState(true)
    const [course, setCourse] = useState<any>(null)
    const [lessons, setLessons] = useState<any[]>([])
    const [currentLesson, setCurrentLesson] = useState<any>(null)
    const [completedLessons, setCompletedLessons] = useState<string[]>([])
    const [loading, setLoading] = useState(true)
    const [isCheckingAccess, setIsCheckingAccess] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (!user) {
                setLoading(false)
                setIsCheckingAccess(false)
                return
            }

            const courseId = params.id as string
            
            try {
                setIsCheckingAccess(true)
                const result = await getClassroomData(courseId, user.uid)
                
                if (!result.success) {
                    if (result.error === 'ACCESS_DENIED') {
                        router.push(`/course/${courseId}`)
                    } else if (result.error === 'COURSE_NOT_FOUND') {
                        setError("Treinamento não encontrado.")
                    } else {
                        setError("Erro ao carregar conteúdo. Tente novamente.")
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
                setIsCheckingAccess(false)
                setLoading(false)
            }
        })

        return () => unsubscribe()
    }, [params.id, router])

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

    const toggleLessonStatus = (id: string) => {
        setCompletedLessons(prev =>
            prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
        )
    }

    if (loading || isCheckingAccess) {
        return (
            <div className="h-screen bg-[#F4F7F9] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="animate-spin text-[#1D5F31]" size={48} />
                    <p className="text-xs font-black uppercase tracking-widest text-slate-400 animate-pulse">
                        Verificando Acesso...
                    </p>
                </div>
            </div>
        )
    }

    if (error || !course) {
        return (
            <div className="h-screen bg-[#F4F7F9] flex flex-col items-center justify-center p-8 text-center font-exo">
                <h1 className="text-2xl font-black uppercase italic tracking-tighter text-slate-800">
                    {error || 'Treinamento não encontrado'}
                </h1>
                <Link href="/dashboard-student" className="mt-6 text-[#1D5F31] font-bold uppercase text-xs tracking-widest underline">
                    Voltar para o Dashboard
                </Link>
            </div>
        )
    }

    const progressPercent = lessons.length > 0
        ? Math.round((completedLessons.length / lessons.length) * 100)
        : 0

    return (
        <div className="flex flex-col h-screen overflow-hidden font-exo transition-colors duration-500 bg-[#061629] text-white">
            <style jsx global>{`
                .scrollbar-hide::-webkit-scrollbar {
                    display: none;
                }
                .scrollbar-hide {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
            `}</style>
            {/* Header Imersivo */}
            <header className="h-16 flex items-center justify-between px-6 border-b border-slate-800 bg-[#061629] z-50 shadow-sm">
                {/* Lado Esquerdo: Logo para sair da classroom */}
                <div className="flex items-center w-1/4">
                    <Link href="/courses" className="flex items-center gap-3 text-slate-400 hover:text-white transition-colors group">
                        <Logo />
                        <span className="text-xs font-black uppercase tracking-widest group-hover:text-white transition-colors hidden md:block">
                            Sair
                        </span>
                    </Link>
                </div>

                {/* Centro: Título do Curso */}
                <div className="flex-1 flex justify-center items-center px-4">
                    <h1 className="text-sm md:text-base font-bold font-exo tracking-tight text-center line-clamp-1 text-white">
                        {course?.title || 'Carregando...'}
                    </h1>
                </div>

                {/* Lado Direito: Progresso e Botões */}
                <div className="flex items-center justify-end gap-6 w-1/4">
                    <div className="hidden lg:flex items-center gap-3">
                        <div className="flex flex-col items-end">
                            <div className="flex items-center gap-2">
                                <span className="text-[9px] font-black uppercase tracking-widest text-slate-200">Progresso Final</span>
                                <span className="text-xs font-black text-[#1D5F31]">{progressPercent}%</span>
                            </div>
                            <div className="w-20 h-1 rounded-full overflow-hidden mt-1 bg-slate-100">
                                <div
                                    className="h-full bg-[#1D5F31] transition-all duration-1000 shadow-[0_0_10px_rgba(0,196,2,0.5)]"
                                    style={{ width: `${progressPercent}%` }}
                                ></div>
                            </div>
                        </div>
                    </div>

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
                    className="flex-1 overflow-y-auto flex flex-col transition-colors duration-500 bg-[#061629] scrollbar-hide"
                    style={scrollbarHideStyle}
                >
                    <div className="flex-1 flex items-center justify-center p-0 md:p-6 lg:p-8">
                        <div className="w-full max-w-[1440px] aspect-video relative group animate-in zoom-in-95 duration-700">
                            <div className="relative w-full h-full rounded-2xl overflow-hidden border border-slate-100 shadow-2xl transition-all duration-500 bg-black">
                                <video
                                    src={currentLesson?.video_url}
                                    controls
                                    className="w-full h-full object-contain"
                                    poster={course?.image_url}
                                    onEnded={() => toggleLessonStatus(currentLesson?.id)}
                                />
                            </div>

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

                    {/* Aula Info (Abaixo do Vídeo) */}
                    <div className="px-6 md:px-12 pb-16">
                        <div className="max-w-[1440px] mx-auto">
                            <ClassroomTabs
                                lessonTitle={currentLesson?.title || ''}
                                description={course?.description || "Esta aula aborda os fundamentos necessários para sua evolução técnica e estratégica."}
                                courseId={course?.id}
                            />
                        </div>
                    </div>
                </div>

                {/* Sidebar Playlist */}
                <aside
                    className={`
                        fixed md:relative top-0 right-0 h-full w-full md:w-[420px] transition-all duration-500 ease-in-out z-40 shadow-xl border-l border-slate-800 bg-[#061629]
                        ${sidebarOpen ? 'translate-x-0' : 'translate-x-full md:hidden'}
                    `}
                >
                    <div className="flex flex-col h-full">
                        <div className="p-8 border-b border-slate-800 bg-[#061629]">
                            <h3 className="text-[10px] font-black uppercase tracking-[4px] text-green-500 mb-1 font-exo">CONTEÚDO DO CURSO</h3>
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
                                        onClick={() => {
                                            setCurrentLesson(lesson)
                                            if (window.innerWidth < 768) setSidebarOpen(false)
                                        }}
                                        className={`
                                            w-full flex items-center gap-4 px-8 py-6 text-left transition-all relative group border-b border-slate-800
                                            ${currentLesson?.id === lesson.id
                                                ? 'bg-slate-800/50'
                                                : 'hover:bg-slate-800/30'}
                                        `}
                                    >
                                        {/* Indicador de Aula Atual */}
                                        {currentLesson?.id === lesson.id && (
                                            <div className="absolute left-0 top-0 bottom-0 w-[4px] bg-[#1D5F31]"></div>
                                        )}

                                        <div
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                toggleLessonStatus(lesson.id)
                                            }}
                                            className={`
                                                flex-shrink-0 w-6 h-6 rounded-full border flex items-center justify-center transition-all
                                                ${completedLessons.includes(lesson.id)
                                                    ? 'bg-[#1D5F31] border-[#1D5F31]'
                                                    : 'border-slate-700 group-hover:border-[#1D5F31]/40 bg-[#061629]'}
                                            `}
                                        >
                                            {completedLessons.includes(lesson.id) ? (
                                                <CheckCircle2 size={12} className="text-white" />
                                            ) : (
                                                <PlayCircle size={10} className="text-slate-300 group-hover:text-[#1D5F31] opacity-0 group-hover:opacity-100 transition-opacity" />
                                            )}
                                        </div>

                                        <div className="flex-1 min-w-0 font-exo">
                                            <p className={`text-[13px] font-bold tracking-tight truncate ${currentLesson?.id === lesson.id
                                                ? 'text-white'
                                                : 'text-slate-400 group-hover:text-white'}`}>
                                                {lesson.title}
                                            </p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="text-[9px] font-black text-slate-200 uppercase tracking-widest leading-none">VÍDEO AULA</span>
                                                {currentLesson?.id === lesson.id && (
                                                    <span className="flex h-1 w-1 rounded-full bg-[#1D5F31] animate-pulse"></span>
                                                )}
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
