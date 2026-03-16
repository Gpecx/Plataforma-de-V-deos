"use client"

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
    CheckCircle2,
    Circle,
    ChevronLeft,
    ChevronRight,
    Menu,
    X,
    PlayCircle,
    Settings,
    Volume2,
    Lock,
    Loader2,
    Lightbulb,
    Moon
} from 'lucide-react'
import { useParams, useRouter } from 'next/navigation'
import { ClassroomTabs } from './ClassroomTabs'
import { db, auth } from '@/lib/firebase'
import Logo from '@/components/Logo'
import { onAuthStateChanged } from 'firebase/auth'
import { doc, getDoc, collection, query, where, orderBy, getDocs } from 'firebase/firestore'

// ... (imports)

export default function ClassroomPage() {
    const params = useParams()
    const router = useRouter()

    const [sidebarOpen, setSidebarOpen] = useState(true)
    const [course, setCourse] = useState<any>(null)
    const [lessons, setLessons] = useState<any[]>([])
    const [currentLesson, setCurrentLesson] = useState<any>(null)
    const [completedLessons, setCompletedLessons] = useState<string[]>([])
    const [loading, setLoading] = useState(true)
    const [isDark, setIsDark] = useState(false)

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (!user) {
                setLoading(false)
                return
            }

            async function loadContent() {
                setLoading(true)
                const courseId = params.id as string

                try {
                    // 1. Busca curso
                    const courseDoc = await getDoc(doc(db, 'courses', courseId))
                    if (courseDoc.exists()) {
                        setCourse({ id: courseDoc.id, ...courseDoc.data() })
                    }

                    // 2. Busca lições
                    const lessonsRef = collection(db, 'lessons')
                    const q = query(
                        lessonsRef,
                        where('course_id', '==', courseId),
                        orderBy('position', 'asc')
                    )
                    const lessonsSnapshot = await getDocs(q)
                    const lessonsData = lessonsSnapshot.docs.map(doc => ({
                        id: doc.id,
                        ...doc.data()
                    }))

                    if (lessonsData.length > 0) {
                        setLessons(lessonsData)
                        setCurrentLesson(lessonsData[0])
                    }
                } catch (error) {
                    console.error("Erro ao carregar conteúdo:", error)
                } finally {
                    setLoading(false)
                }
            }
            loadContent()
        })

        return () => unsubscribe()
    }, [params.id])

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

    if (loading) {
        return (
            <div className="h-screen bg-[#F4F7F9] flex items-center justify-center">
                <Loader2 className="animate-spin text-[#00C402]" size={48} />
            </div>
        )
    }

    if (!course) {
        return (
            <div className="h-screen bg-[#F4F7F9] flex flex-col items-center justify-center p-8 text-center">
                <Lock size={64} className="text-slate-300 mb-6" />
                <h1 className="text-2xl font-black uppercase italic tracking-tighter text-slate-800">Treinamento não encontrado</h1>
                <Link href="/dashboard-student" className="mt-6 text-[#00C402] font-bold uppercase text-xs tracking-widest underline">Voltar para o Dashboard</Link>
            </div>
        )
    }

    const progressPercent = lessons.length > 0
        ? Math.round((completedLessons.length / lessons.length) * 100)
        : 0

    return (
        <div className={`flex flex-col h-screen overflow-hidden font-exo transition-colors duration-500 ${isDark ? 'bg-[#000000] text-white' : 'bg-[#0d2b17] text-white'}`}>
            {/* Header Imersivo */}
            <header className={`h-16 flex items-center justify-between px-6 border-b transition-all duration-500 z-50 bg-[#0d2b17] border-white/10 shadow-sm ${isDark ? 'opacity-30 hover:opacity-100' : 'opacity-100'}`}>
                {/* Lado Esquerdo: Logo */}
                <div className="flex items-center w-1/4">
                    <Logo href="/dashboard-student" className="h-12 md:h-14" />
                </div>

                {/* Centro: Título do Curso */}
                <div className="flex-1 flex justify-center items-center px-4">
                    <h1 className={`text-sm md:text-base font-bold font-exo tracking-tight text-center line-clamp-1 text-white`}>
                        {course?.title || 'Carregando...'}
                    </h1>
                </div>

                {/* Lado Direito: Progresso e Botões */}
                <div className="flex items-center justify-end gap-6 w-1/4">
                    <div className="hidden lg:flex items-center gap-3">
                        <div className="flex flex-col items-end">
                            <div className="flex items-center gap-2">
                                <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Progresso Final</span>
                                <span className="text-xs font-black text-[#00C402]">{progressPercent}%</span>
                            </div>
                            <div className="w-20 h-1 rounded-full overflow-hidden mt-1 bg-slate-100">
                                <div
                                    className="h-full bg-[#00C402] transition-all duration-1000 shadow-[0_0_10px_rgba(0,196,2,0.5)]"
                                    style={{ width: `${progressPercent}%` }}
                                ></div>
                            </div>
                        </div>
                        <div className="h-8 w-px bg-slate-100 mx-1"></div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setIsDark(!isDark)}
                            className={`group relative p-2 rounded-xl transition-all duration-300 border ${isDark
                                ? 'bg-[#00C402]/20 border-[#00C402]/30 text-[#00C402] shadow-[0_0_15px_rgba(0,196,2,0.2)]'
                                : 'bg-white/10 border-white/10 text-white/70 hover:bg-white/20 hover:text-white'
                                }`}
                            title={isDark ? "Apagar as luzes" : "Modo Cinema"}
                        >
                            <div className="relative">
                                {isDark ? (
                                    <Lightbulb size={18} className="fill-[#00C402]/20 animate-pulse" />
                                ) : (
                                    <Moon size={18} />
                                )}
                            </div>
                        </button>

                        <button
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            className="p-2 bg-white/10 text-white border border-white/10 rounded-none transition-colors hover:bg-white/20 flex items-center justify-center"
                        >
                            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
                        </button>
                    </div>
                </div>
            </header>

            <main className="flex flex-1 overflow-hidden">
                {/* Player Section */}
                <div className={`flex-1 overflow-y-auto flex flex-col transition-colors duration-500 ${isDark ? 'bg-[#050505]' : 'bg-[#0d2b17]'}`}>
                    <div className="flex-1 flex items-center justify-center p-0 md:p-6 lg:p-8">
                        <div className="w-full max-w-6xl aspect-video relative group animate-in zoom-in-95 duration-700">
                            <div className={`relative w-full h-full rounded-none overflow-hidden border transition-all duration-500 bg-black ${isDark
                                ? 'border-white/10 shadow-[0_0_80px_rgba(0,0,0,0.8)] scale-[1.02]'
                                : 'border-white/10 shadow-2xl'
                                }`}>
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
                                    className={`flex items-center gap-2 px-8 py-4 rounded-none font-black uppercase tracking-tighter transition-all shadow-sm border ${lessons.findIndex(l => l.id === currentLesson?.id) === 0
                                        ? isDark ? 'bg-white/5 text-slate-700 border-white/5 cursor-not-allowed' : 'bg-white/5 text-white/20 border-white/5 cursor-not-allowed'
                                        : isDark ? 'bg-white/5 text-slate-400 hover:text-white border-white/10 hover:border-[#00C402]/40' : 'bg-white/10 text-white/70 hover:text-white border-white/10 hover:border-[#32cd32]/40'
                                        }`}
                                >
                                    <ChevronLeft size={20} />
                                    <span className="text-xs">Anterior</span>
                                </button>

                                <button
                                    onClick={goToNextLesson}
                                    disabled={lessons.findIndex(l => l.id === currentLesson?.id) === lessons.length - 1}
                                    className={`flex items-center gap-2 px-8 py-4 rounded-none font-black uppercase tracking-tighter transition-all shadow-md ${lessons.findIndex(l => l.id === currentLesson?.id) === lessons.length - 1
                                        ? isDark ? 'bg-white/5 text-slate-700 border-white/5 cursor-not-allowed' : 'bg-white text-slate-200 border-slate-100 cursor-not-allowed'
                                        : 'bg-[#32cd32] text-white hover:bg-[#28b828] hover:scale-105 transition-all'
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
                        <div className="max-w-6xl mx-auto">
                            <ClassroomTabs
                                lessonTitle={currentLesson?.title || ''}
                                description={course?.description || "Esta aula aborda os fundamentos necessários para sua evolução técnica e estratégica."}
                                isDark={isDark}
                            />
                        </div>
                    </div>
                </div>

                {/* Sidebar Playlist */}
                <aside
                    className={`
                        fixed md:relative top-0 right-0 h-full w-full md:w-[420px] transition-all duration-500 ease-in-out z-40 shadow-xl border-l
                        ${sidebarOpen ? 'translate-x-0' : 'translate-x-full md:hidden'}
                        ${isDark ? 'bg-[#0a0a0a] border-white/5' : 'bg-[#0d2b17] border-white/5'}
                    `}
                >
                    <div className="flex flex-col h-full">
                        <div className={`p-8 border-b transition-colors duration-500 ${isDark ? 'bg-[#0f0f0f] border-white/5' : 'bg-white/5 border-white/5'}`}>
                            <h3 className="text-[10px] font-black uppercase tracking-[4px] text-[#00C402] mb-1">CONTEÚDO DO CURSO</h3>
                            <p className={`text-[11px] font-black uppercase truncate tracking-tight ${isDark ? 'text-slate-300' : 'text-white'}`}>{course?.title}</p>
                        </div>

                        <div className="flex-1 overflow-y-auto">
                            <div className="divide-y divide-slate-50">
                                {lessons.map((lesson) => (
                                    <button
                                        key={lesson.id}
                                        onClick={() => {
                                            setCurrentLesson(lesson)
                                            if (window.innerWidth < 768) setSidebarOpen(false)
                                        }}
                                        className={`
                                            w-full flex items-center gap-4 px-8 py-6 text-left transition-all relative group
                                            ${currentLesson?.id === lesson.id
                                                ? isDark ? 'bg-white/5' : 'bg-white/10 shadow-inner'
                                                : isDark ? 'hover:bg-white/5' : 'hover:bg-white/5'}
                                        `}
                                    >
                                        {/* Indicador de Aula Atual */}
                                        {currentLesson?.id === lesson.id && (
                                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#00C402]"></div>
                                        )}

                                        <div
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                toggleLessonStatus(lesson.id)
                                            }}
                                            className={`
                                                flex-shrink-0 w-6 h-6 rounded-full border flex items-center justify-center transition-all
                                                ${completedLessons.includes(lesson.id)
                                                    ? 'bg-[#00C402] border-[#00C402]'
                                                    : isDark
                                                        ? 'border-white/10 group-hover:border-[#00C402]/40 bg-[#000000]'
                                                        : 'border-white/20 group-hover:border-[#32cd32]/40 bg-white/5'}
                                            `}
                                        >
                                            {completedLessons.includes(lesson.id) ? (
                                                <CheckCircle2 size={12} className="text-white" />
                                            ) : (
                                                <PlayCircle size={10} className="text-slate-300 group-hover:text-[#00C402] opacity-0 group-hover:opacity-100 transition-opacity" />
                                            )}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <p className={`text-[13px] font-bold tracking-tight truncate ${currentLesson?.id === lesson.id
                                                ? isDark ? 'text-white' : 'text-white'
                                                : isDark ? 'text-slate-500 group-hover:text-slate-300' : 'text-white/50 group-hover:text-white'}`}>
                                                {lesson.title}
                                            </p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">VÍDEO AULA</span>
                                                {currentLesson?.id === lesson.id && (
                                                    <span className="flex h-1 w-1 rounded-full bg-[#00C402] animate-pulse"></span>
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
