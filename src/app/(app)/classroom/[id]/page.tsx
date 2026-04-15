"use client"

import { useState, useEffect, useRef } from 'react'
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
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { ClassroomTabs } from './ClassroomTabs'
import { auth } from '@/lib/firebase'
import Logo from '@/components/Logo'
import { onAuthStateChanged } from 'firebase/auth'
import { getClassroomData, toggleLessonCompletion, processCertificateIssuance, saveLessonProgress } from './actions'
import { QuizPlayer } from './QuizPlayer'
import { useProgressStore } from '@/store/useProgressStore'
import SecureMuxPlayer from '@/components/SecureMuxPlayer'
import { VideoWatermark } from '@/components/VideoWatermark'

const scrollbarHideStyle = {
    msOverflowStyle: 'none',
    scrollbarWidth: 'none',
} as const;

export default function ClassroomPage() {
    const params = useParams()
    const router = useRouter()
    const searchParams = useSearchParams()

    // Desktop: sidebar aberta por padrão. Mobile: fechada (vídeo é prioridade)
    const [sidebarOpen, setSidebarOpen] = useState(() => {
        if (typeof window !== 'undefined') return window.innerWidth >= 1024
        return true
    })
    const [course, setCourse] = useState<any>(null)
    const [lessons, setLessons] = useState<any[]>([])
    const [currentLesson, setCurrentLesson] = useState<any>(null)
    const [completedLessons, setCompletedLessons] = useState<string[]>([])
    const [loading, setLoading] = useState(true)
    const [isCheckingAccess, setIsCheckingAccess] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [autoNextCountdown, setAutoNextCountdown] = useState<number | null>(null)
    const [certificateIssued, setCertificateIssued] = useState(false)
    const [isToggling, setIsToggling] = useState(false)
    const [currentUser, setCurrentUser] = useState<any>(null)
    const [lastTimestamp, setLastTimestamp] = useState(0)
    const [redirectDone, setRedirectDone] = useState(false)
    const videoRef = useRef<HTMLVideoElement>(null)
    const saveProgressRef = useRef<NodeJS.Timeout | null>(null)
    const isMountedRef = useRef(true)
    const touchStartX = useRef(0)
    const sidebarRef = useRef<HTMLDivElement>(null)

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
            return `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`
        }
        if (url.includes('vimeo.com')) {
            const videoId = url.split('/').pop()?.split('?')[0]
            return `https://player.vimeo.com/video/${videoId}?title=0&byline=0&portrait=0`
        }
        return url
    }

    const courseProgress = useProgressStore(state => state.courseProgress[params.id as string])

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (!user) {
                setLoading(false)
                setIsCheckingAccess(false)
                return
            }

            setCurrentUser(user)

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
                setCompletedLessons(result.completedLessons || [])

                if (result.lessons && result.lessons.length > 0) {
                    const lessonIdParam = searchParams.get('lessonId')
                    let targetLesson = result.lessons[0]

                    if (lessonIdParam) {
                        const foundLesson = result.lessons.find((l: any) => l.id === lessonIdParam)
                        if (foundLesson) {
                            targetLesson = foundLesson
                        }
                    } else if (result.progress?.lastLessonId) {
                        const lastLesson = result.lessons.find((l: any) => l.id === result.progress.lastLessonId)
                        if (lastLesson) {
                            targetLesson = lastLesson
                        }
                    }

                    setCurrentLesson(targetLesson)
                    setLastTimestamp(result.progress?.lastTimestamp || 0)
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

    useEffect(() => {
        return () => {
            isMountedRef.current = false
        }
    }, [])

    useEffect(() => {
        if (!loading && !isCheckingAccess && !redirectDone && currentLesson && searchParams.get('lessonId') === null) {
            const progressLessonId = courseProgress?.lastLessonId
            if (progressLessonId && progressLessonId !== currentLesson.id) {
                const foundLesson = lessons.find((l: any) => l.id === progressLessonId)
                if (foundLesson && isMountedRef.current) {
                    setRedirectDone(true)
                    router.replace(`/classroom/${params.id}?lessonId=${progressLessonId}`, { scroll: false })
                }
            }
        }
    }, [loading, isCheckingAccess, redirectDone, currentLesson, courseProgress, lessons, params.id, router, searchParams])

    useEffect(() => {
        let timer: NodeJS.Timeout
        if (autoNextCountdown !== null && autoNextCountdown > 0) {
            timer = setTimeout(() => {
                setAutoNextCountdown(autoNextCountdown - 1)
            }, 1000)
        } else if (autoNextCountdown === 0) {
            goToNextLesson()
            setAutoNextCountdown(null)
        }
        return () => clearTimeout(timer)
    }, [autoNextCountdown])

    const cancelAutoNext = () => {
        setAutoNextCountdown(null)
    }

    // Bloqueia scroll do body quando drawer mobile está aberto
    useEffect(() => {
        const isMobile = window.innerWidth < 1024
        if (sidebarOpen && isMobile) {
            document.body.style.overflow = 'hidden'
        } else {
            document.body.style.overflow = ''
        }
        return () => { document.body.style.overflow = '' }
    }, [sidebarOpen])

    // Swipe left para fechar sidebar (mobile gesture)
    const handleTouchStart = (e: React.TouchEvent) => {
        touchStartX.current = e.touches[0].clientX
    }
    const handleTouchEnd = (e: React.TouchEvent) => {
        const deltaX = touchStartX.current - e.changedTouches[0].clientX
        if (deltaX > 50) setSidebarOpen(false)
    }

    const goToNextLesson = () => {
        cancelAutoNext()
        const index = lessons.findIndex(l => l.id === currentLesson?.id)
        if (index < lessons.length - 1) {
            const nextLesson = lessons[index + 1]
            setCurrentLesson(nextLesson)
            if (currentUser && course) {
                saveProgress(nextLesson.id, 0)
            }
        }
    }

    const goToPrevLesson = () => {
        cancelAutoNext()
        const index = lessons.findIndex(l => l.id === currentLesson?.id)
        if (index > 0) {
            const prevLesson = lessons[index - 1]
            setCurrentLesson(prevLesson)
            if (currentUser && course) {
                saveProgress(prevLesson.id, 0)
            }
        }
    }

    const toggleLessonStatus = async (id: string, autoNext: boolean = false) => {
        if (!currentUser) return
        
        const isCompleted = completedLessons.includes(id)
        
        setIsToggling(true)
        
        try {
            await toggleLessonCompletion(course?.id, id, currentUser.uid, !isCompleted)
            
            const newCompletedLessons = (prev: string[]) =>
                prev.includes(id) ? prev.filter((item: string) => item !== id) : [...prev, id]
            setCompletedLessons(newCompletedLessons)
            
            if (autoNext) {
                const index = lessons.findIndex(l => l.id === id)
                if (index < lessons.length - 1) {
                    setAutoNextCountdown(3)
                }
            }

            const updatedLessons = newCompletedLessons(completedLessons)
            const progressPercent = lessons.length > 0 ? Math.round((updatedLessons.length / lessons.length) * 100) : 0

            if (progressPercent === 100 && !certificateIssued) {
                const certResult = await processCertificateIssuance(course?.id, currentUser.uid)
                if (certResult.success && certResult.data) {
                    setCertificateIssued(true)
                    setTimeout(() => {
                        alert(`Parabéns! Certificado emitido com sucesso!\n\nCurso: ${certResult.data?.courseTitle}\nCódigo de Verificação: ${certResult.data?.verificationCode}`)
                    }, 500)
                }
            }
        } catch (err) {
            console.error("Erro ao salvar conclusão:", err)
        } finally {
            setIsToggling(false)
        }
    }

    const saveProgress = async (lessonId: string, timestamp: number) => {
        if (!currentUser || !course) return

        try {
            await saveLessonProgress(course.id, lessonId, currentUser.uid, timestamp)
        } catch (err: any) {
            console.error('saveProgress: error', err?.message || err)
        }
    }

    if (loading || isCheckingAccess) {
        return (
            <div className="h-screen bg-[#061629] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="animate-spin text-[#1D5F31]" size={48} />
                    <p className="text-xs font-bold uppercase tracking-widest text-white animate-pulse">
                        Verificando Acesso...
                    </p>
                </div>
            </div>
        )
    }

    if (error || !course) {
        return (
            <div className="h-screen flex flex-col items-center justify-center p-8 text-center font-montserrat bg-[#061629]">
                <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tighter text-white">
                    {error || 'Treinamento não encontrado'}
                </h1>
                <div className="mt-6 flex flex-col gap-3">
                    <button 
                        onClick={() => window.location.reload()}
                        className="px-6 py-3 bg-[#1D5F31] text-white font-bold uppercase text-xs tracking-widest rounded-xl hover:bg-[#1D5F31]/90 transition-all"
                    >
                        Tentar Novamente
                    </button>
                    <Link href="/dashboard-student" className="text-[#1D5F31] font-bold uppercase text-xs tracking-widest underline">
                        Voltar para o Dashboard
                    </Link>
                </div>
            </div>
        )
    }

    const progressPercent = lessons.length > 0
        ? Math.round((completedLessons.length / lessons.length) * 100)
        : 0

    return (
        <div className="flex flex-col h-screen overflow-hidden font-montserrat bg-[#061629] text-white">


            {/* Header */}
            <header className="h-14 md:h-16 flex-shrink-0 flex items-center justify-between px-4 md:px-6 border-b border-slate-800 bg-[#061629] z-50 shadow-sm">
                {/* Esquerda: Logo */}
                <div className="flex items-center gap-3 text-slate-400 group min-w-0">
                    <Logo />
                    <Link
                        href="/course"
                        className="text-xs font-bold uppercase tracking-widest group-hover:text-white transition-colors hidden md:block"
                    >
                        Sair
                    </Link>
                </div>

                {/* Centro: Titulo - escondido em telas muito pequenas */}
                <div className="flex-1 flex justify-center items-center px-2 min-w-0 overflow-hidden">
                    <h1 className="hidden sm:block text-sm md:text-base font-bold font-montserrat tracking-tight text-center line-clamp-1 text-white">
                        {course?.title || 'Carregando...'}
                    </h1>
                </div>

                {/* Direita: Progresso + Botão sidebar (apenas desktop lg+) */}
                <div className="flex items-center justify-end gap-4">
                    <div className="hidden lg:flex flex-col items-end">
                        <div className="flex items-center gap-2">
                            <span className="text-[9px] font-bold uppercase tracking-widest text-slate-200">Progresso</span>
                            <span className="text-xs font-bold text-[#1D5F31]">{progressPercent}%</span>
                        </div>
                        <div className="w-20 h-1 rounded-full overflow-hidden mt-1 bg-slate-800">
                            <div
                                className="h-full bg-[#1D5F31] transition-all duration-1000 shadow-[0_0_10px_rgba(0,196,2,0.5)]"
                                style={{ width: `${progressPercent}%` }}
                            />
                        </div>
                    </div>

                    {/* Botão lista aulas — APENAS para desktop lg+ */}
                    <button
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        className="hidden lg:flex min-w-[44px] min-h-[44px] items-center justify-center bg-slate-800/50
                                   text-slate-400 border border-slate-800 rounded-xl transition-colors hover:text-white"
                        aria-label="Alternar lista de aulas"
                    >
                        {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
                    </button>
                </div>
            </header>

            {/* Layout Principal */}
            {/*
                Mobile (<lg):  flex-col - player no topo, list de aulas abaixo (sem drawer)
                Desktop (lg+): flex-row - player a esquerda, sidebar drawer a direita
            */}
            <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">

                {/* Coluna Esquerda: Player + Tabs */}
                <div
                    className="flex-1 flex flex-col overflow-y-auto scrollbar-hide"
                    style={scrollbarHideStyle}
                >
                    {/* Player */}
                    <div className="w-full lg:p-6 lg:pb-0">
                        <div
                            key={currentLesson?.id}
                            className="w-full aspect-video relative animate-in fade-in-0 zoom-in-95 duration-300"
                        >
                            <div className="relative w-full h-full lg:rounded-2xl overflow-hidden shadow-2xl bg-black border-0 lg:border lg:border-slate-700">
                                {currentLesson?.type === 'quiz' ? (
                                    <QuizPlayer
                                        quizData={currentLesson.quizData || {}}
                                        onComplete={() => toggleLessonStatus(currentLesson.id)}
                                    />
                                ) : currentLesson?.mux_playback_id ? (
                                    <SecureMuxPlayer
                                        cursoId={course?.id}
                                        playbackId={currentLesson.mux_playback_id}
                                        startTime={lastTimestamp}
                                        onTimeUpdate={(time) => {
                                            const currentTime = Math.round(time)
                                            if (currentTime > 0 && currentTime % 10 === 0) {
                                                saveProgress(currentLesson.id, currentTime)
                                            }
                                        }}
                                        onEnded={() => toggleLessonStatus(currentLesson?.id, true)}
                                        className="w-full h-full"
                                    />
                                ) : isExternalVideo(currentLesson?.video_url) ? (
                                    <div className="w-full h-full">
                                        <iframe
                                            src={getEmbedUrl(currentLesson?.video_url || '')}
                                            className="w-full h-full border-0"
                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                                            allowFullScreen
                                        />
                                    </div>
                                ) : (
                                    <>
                                        <video
                                            ref={videoRef}
                                            src={currentLesson?.video_url}
                                            controls
                                            autoPlay
                                            className="w-full h-full object-contain"
                                            poster={course?.image_url}
                                            onLoadedMetadata={() => {
                                                if (lastTimestamp > 0 && videoRef.current) {
                                                    videoRef.current.currentTime = lastTimestamp
                                                }
                                            }}
                                            onTimeUpdate={() => {
                                                if (videoRef.current && currentLesson && currentUser) {
                                                    const currentTime = Math.floor(videoRef.current.currentTime)
                                                    if (currentTime > 0 && currentTime % 10 === 0) {
                                                        saveProgress(currentLesson.id, currentTime)
                                                    }
                                                }
                                            }}
                                            onEnded={() => toggleLessonStatus(currentLesson?.id, true)}
                                        />
                                        {autoNextCountdown !== null && (
                                            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center z-20 animate-in fade-in duration-300">
                                                <div className="text-center space-y-6">
                                                    <div className="relative w-24 h-24 mx-auto">
                                                        <svg className="w-full h-full -rotate-90">
                                                            <circle cx="48" cy="48" r="44" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-slate-800" />
                                                            <circle cx="48" cy="48" r="44" stroke="currentColor" strokeWidth="4" fill="transparent"
                                                                strokeDasharray={276.46}
                                                                strokeDashoffset={276.46 * (1 - autoNextCountdown / 3)}
                                                                className="text-green-500 transition-all duration-1000 ease-linear"
                                                            />
                                                        </svg>
                                                        <span className="absolute inset-0 flex items-center justify-center text-4xl font-bold text-white">
                                                            {autoNextCountdown}
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold uppercase tracking-[4px] text-green-500 mb-2">Próxima Aula em Instantes</p>
                                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                                                            {lessons[lessons.findIndex(l => l.id === currentLesson?.id) + 1]?.title}
                                                        </p>
                                                    </div>
                                                    <button
                                                        onClick={cancelAutoNext}
                                                        className="px-8 min-h-[44px] bg-slate-800 text-white text-[10px] font-bold uppercase tracking-widest rounded-xl hover:bg-slate-700 transition-all"
                                                    >
                                                        Cancelar
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </>
                                )}

                                {/* Watermark */}
                                {currentLesson?.type !== 'quiz' && (
                                    <VideoWatermark userEmail={currentUser?.email} userId={currentUser?.uid} />
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Info da Aula Atual + Botoes Nav */}
                    <div className="px-4 md:px-6 lg:px-8 pt-4 pb-3 border-b border-slate-800">
                        {/* Titulo e badge da aula */}
                        <p className="text-[10px] font-bold uppercase tracking-[3px] text-[#1D5F31] mb-1">
                            {currentLesson?.type === 'quiz' ? 'Questionário' : 'Vídeo Aula'}
                        </p>
                        <h2 className="text-lg md:text-xl font-bold font-montserrat tracking-tight text-white line-clamp-2">
                            {currentLesson?.title || ''}
                        </h2>

                        {/* Barra de progresso mobile */}
                        <div className="flex items-center gap-3 mt-3 lg:hidden">
                            <div className="flex-1 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                                <div
                                    className="h-full bg-[#1D5F31] transition-all duration-700"
                                    style={{ width: `${progressPercent}%` }}
                                />
                            </div>
                            <span className="text-xs font-bold text-[#1D5F31] shrink-0">{progressPercent}%</span>
                        </div>
                    </div>

                    {/* Botoes de Navegacao Entre Aulas */}
                    <div className="flex items-center justify-between gap-2 px-4 md:px-6 lg:px-8 py-3 border-b border-slate-800">
                        <button
                            onClick={goToPrevLesson}
                            disabled={lessons.findIndex(l => l.id === currentLesson?.id) === 0}
                            className={`flex items-center justify-center gap-2 flex-1 min-h-[44px] px-4
                                rounded-xl font-bold font-montserrat uppercase tracking-tighter text-xs
                                transition-all border
                                ${
                                    lessons.findIndex(l => l.id === currentLesson?.id) === 0
                                        ? 'bg-slate-800/40 text-slate-600 border-slate-800 cursor-not-allowed'
                                        : 'bg-slate-800 text-white hover:bg-slate-700 border-slate-700 active:scale-95'
                                }`}
                        >
                            <ChevronLeft size={18} />
                            <span>Anterior</span>
                        </button>

                        <button
                            onClick={() => toggleLessonStatus(currentLesson?.id)}
                            disabled={isToggling}
                            className={`flex items-center justify-center gap-2 flex-1 min-h-[44px] px-4
                                rounded-xl font-bold font-montserrat uppercase tracking-tighter text-xs
                                transition-all border
                                ${
                                    completedLessons.includes(currentLesson?.id)
                                        ? 'bg-[#00c853]/20 text-[#00c853] border-[#00c853]/30'
                                        : 'bg-slate-800 text-white hover:bg-slate-700 border-slate-700 active:scale-95'
                                }`}
                        >
                            {isToggling ? (
                                <span>Carregando...</span>
                            ) : completedLessons.includes(currentLesson?.id) ? (
                                <><CheckCircle2 size={16} /><span>Concluída</span></>
                            ) : (
                                <span>Marcar Concluída</span>
                            )}
                        </button>

                        <button
                            onClick={goToNextLesson}
                            disabled={lessons.findIndex(l => l.id === currentLesson?.id) === lessons.length - 1}
                            className={`flex items-center justify-center gap-2 flex-1 min-h-[44px] px-4
                                rounded-xl font-bold font-montserrat uppercase tracking-tighter text-xs
                                transition-all
                                ${
                                    lessons.findIndex(l => l.id === currentLesson?.id) === lessons.length - 1
                                        ? 'bg-slate-800/40 text-slate-600 border border-slate-800 cursor-not-allowed'
                                        : 'bg-[#1D5F31] text-white hover:bg-green-500 border border-[#1D5F31] shadow-lg active:scale-95'
                                }`}
                        >
                            <span>Próxima</span>
                            <ChevronRight size={18} />
                        </button>
                    </div>

                    {/* Lista de Aulas Embutida (APENAS mobile <lg) */}
                    <div className="lg:hidden">
                        <div className="px-4 pt-4 pb-2 flex items-center justify-between">
                            <h3 className="text-[10px] font-bold uppercase tracking-[4px] text-[#1D5F31]">
                                Conteúdo do Curso
                            </h3>
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                {completedLessons.length}/{lessons.length} aulas
                            </span>
                        </div>
                        <div className="divide-y divide-slate-800/60">
                            {lessons.map((lesson) => (
                                <button
                                    key={lesson.id}
                                    onClick={() => {
                                        cancelAutoNext()
                                        setCurrentLesson(lesson)
                                        // Scroll suave ao topo para ver o player
                                        window.scrollTo({ top: 0, behavior: 'smooth' })
                                    }}
                                    className={`
                                        w-full flex items-center gap-4 px-4 py-5 text-left transition-all
                                        relative border-b border-slate-800/60 touch-manipulation
                                        ${currentLesson?.id === lesson.id
                                            ? 'bg-slate-800/50'
                                            : 'active:bg-slate-800/30'}
                                    `}
                                >
                                    {/* Indicador aula ativa */}
                                    {currentLesson?.id === lesson.id && (
                                        <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-[#1D5F31] rounded-r-full" />
                                    )}

                                    {/* Botão de conclusão com 44px de área */}
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            toggleLessonStatus(lesson.id)
                                        }}
                                        className={`
                                            flex-shrink-0 w-11 h-11 -mx-1.5 rounded-full flex items-center justify-center
                                            transition-all touch-manipulation
                                            ${completedLessons.includes(lesson.id)
                                                ? 'bg-[#1D5F31]/20 text-[#1D5F31]'
                                                : 'bg-slate-800/50 text-slate-500'}
                                        `}
                                        aria-label={completedLessons.includes(lesson.id) ? 'Desmarcar aula' : 'Marcar como concluída'}
                                    >
                                        {completedLessons.includes(lesson.id)
                                            ? <CheckCircle2 size={20} />
                                            : <PlayCircle size={18} />
                                        }
                                    </button>

                                    <div className="flex-1 min-w-0">
                                        <p className={`text-sm font-bold tracking-tight line-clamp-2 leading-snug
                                            ${currentLesson?.id === lesson.id ? 'text-white' : 'text-slate-400'}`}
                                        >
                                            {lesson.title}
                                        </p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                                                {lesson.type === 'quiz' ? 'Questionário' : 'Vídeo Aula'}
                                            </span>
                                            {currentLesson?.id === lesson.id && (
                                                <span className="flex h-1.5 w-1.5 rounded-full bg-[#1D5F31] animate-pulse" />
                                            )}
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Tabs de info (descrição, Q&A etc.) */}
                    <div className="px-4 md:px-6 lg:px-8 pb-16">
                        <ClassroomTabs
                            lessonId={currentLesson?.id}
                            lessonTitle={currentLesson?.title || ''}
                            description={course?.description || ''}
                            courseId={course?.id}
                        />
                    </div>
                </div>

                {/* Sidebar Drawer (APENAS desktop lg+) */}
                {/* Backdrop */}
                {sidebarOpen && (
                    <div
                        className="fixed inset-0 bg-black/50 z-30 lg:hidden"
                        onClick={() => setSidebarOpen(false)}
                    />
                )}

                <aside
                    ref={sidebarRef}
                    onTouchStart={handleTouchStart}
                    onTouchEnd={handleTouchEnd}
                    style={{ willChange: 'transform' }}
                    className={`
                        fixed top-14 md:top-16 right-0
                        h-[calc(100%-3.5rem)] md:h-[calc(100%-4rem)]
                        lg:static lg:h-full
                        w-[85vw] max-w-[360px] lg:w-[400px] xl:w-[440px]
                        flex-shrink-0
                        transition-transform duration-300 ease-in-out
                        z-40 shadow-2xl border-l border-slate-800 bg-[#061629]
                        ${
                            sidebarOpen
                                ? 'translate-x-0'
                                : 'translate-x-full lg:translate-x-0'
                        }
                        ${!sidebarOpen ? 'lg:hidden' : ''}
                    `}
                >
                    {/* Drag handle (mobile) */}
                    <div className="lg:hidden flex justify-center pt-3 pb-1">
                        <div className="w-10 h-1 rounded-full bg-slate-700" />
                    </div>

                    <div className="flex flex-col h-full">
                        {/* Header da Sidebar */}
                        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
                            <div>
                                <h3 className="text-[10px] font-bold uppercase tracking-[4px] text-[#1D5F31] mb-0.5">
                                    Conteúdo do Curso
                                </h3>
                                <p className="text-xs font-bold uppercase truncate tracking-tight text-white max-w-[220px]">
                                    {course?.title}
                                </p>
                            </div>
                            <span className="text-[10px] font-bold text-slate-500 shrink-0">
                                {completedLessons.length}/{lessons.length}
                            </span>
                        </div>

                        {/* Lista de Aulas */}
                        <div
                            className="flex-1 overflow-y-auto scrollbar-hide"
                            style={scrollbarHideStyle}
                        >
                            {lessons.map((lesson) => (
                                <button
                                    key={lesson.id}
                                    onClick={() => {
                                        cancelAutoNext()
                                        setCurrentLesson(lesson)
                                        if (window.innerWidth < 1024) setSidebarOpen(false)
                                    }}
                                    className={`
                                        w-full flex items-center gap-4 px-6 py-5 text-left
                                        transition-all relative border-b border-slate-800/60
                                        touch-manipulation
                                        ${currentLesson?.id === lesson.id
                                            ? 'bg-slate-800/50'
                                            : 'hover:bg-slate-800/30 active:bg-slate-800/40'}
                                    `}
                                >
                                    {currentLesson?.id === lesson.id && (
                                        <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-[#1D5F31] rounded-r-full" />
                                    )}

                                    {/* Botão de conclusão 44px */}
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            toggleLessonStatus(lesson.id)
                                        }}
                                        className={`
                                            flex-shrink-0 w-11 h-11 -mx-1 rounded-full flex items-center justify-center
                                            transition-all touch-manipulation
                                            ${completedLessons.includes(lesson.id)
                                                ? 'bg-[#1D5F31]/20 text-[#1D5F31]'
                                                : 'bg-slate-800/60 text-slate-500 hover:text-[#1D5F31]'}
                                        `}
                                        aria-label={completedLessons.includes(lesson.id) ? 'Desmarcar aula' : 'Marcar como concluída'}
                                    >
                                        {completedLessons.includes(lesson.id)
                                            ? <CheckCircle2 size={18} />
                                            : <PlayCircle size={16} />
                                        }
                                    </button>

                                    <div className="flex-1 min-w-0">
                                        <p className={`text-[13px] font-bold tracking-tight line-clamp-2 leading-snug
                                            ${currentLesson?.id === lesson.id ? 'text-white' : 'text-slate-400 hover:text-white'}`}
                                        >
                                            {lesson.title}
                                        </p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                                                {lesson.type === 'quiz' ? 'Questionário' : 'Vídeo Aula'}
                                            </span>
                                            {currentLesson?.id === lesson.id && (
                                                <span className="flex h-1 w-1 rounded-full bg-[#1D5F31] animate-pulse" />
                                            )}
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </aside>
            </div>
        </div>
    )
}
