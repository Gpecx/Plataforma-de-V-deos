"use client"

import { useState, useEffect } from 'react'
import Link from 'next/link'
import MuxPlayer from '@mux/mux-player-react'
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
    Lock
} from 'lucide-react'
import { useParams } from 'next/navigation'
import { ClassroomTabs } from './ClassroomTabs'

// Mock Data Expandido para Teste
const MOCK_MODULES = [
    {
        id: "m1",
        title: "01. Introdução e Mentalidade EXS",
        lessons: [
            { id: "l1", title: "Bem-vindo à Jornada de Excelência", duration: "05:20", playbackId: "DS00S01vK02M66B9P2f94902FhWcuxXvV", completed: true },
            { id: "l2", title: "O Manifesto da Engenharia de Ponta", duration: "12:45", playbackId: "DS00S01vK02M66B9P2f94902FhWcuxXvV", completed: true },
            { id: "l3", title: "Como utilizar o Suporte VIP", duration: "08:10", playbackId: "DS00S01vK02M66B9P2f94902FhWcuxXvV", completed: false },
        ]
    },
    {
        id: "m2",
        title: "02. Setup e Ferramentas Pro",
        lessons: [
            { id: "l4", title: "Configurando o Ambiente Fullstack", duration: "25:30", playbackId: "DS00S01vK02M66B9P2f94902FhWcuxXvV", completed: false },
            { id: "l5", title: "Extensões e Plugins Obrigatórios", duration: "15:15", playbackId: "DS00S01vK02M66B9P2f94902FhWcuxXvV", completed: false },
            { id: "l6", title: "Dominando o Terminal e CLI", duration: "18:20", playbackId: "DS00S01vK02M66B9P2f94902FhWcuxXvV", completed: false },
        ]
    },
    {
        id: "m3",
        title: "03. Mão na Massa: Engenharia Real",
        lessons: [
            { id: "l7", title: "Arquitetura do Projeto Principal", duration: "30:00", playbackId: "DS00S01vK02M66B9P2f94902FhWcuxXvV", completed: false },
            { id: "l8", title: "Desenvolvimento de UI com Tailwind 4", duration: "45:20", playbackId: "DS00S01vK02M66B9P2f94902FhWcuxXvV", completed: false },
            { id: "l9", title: "Integração Avançada com Supabase", duration: "38:15", playbackId: "DS00S01vK02M66B9P2f94902FhWcuxXvV", completed: false },
        ]
    },
    {
        id: "m4",
        title: "04. Performance e Deploy",
        lessons: [
            { id: "l10", title: "Otimização de Imagens e Assets", duration: "22:10", playbackId: "DS00S01vK02M66B9P2f94902FhWcuxXvV", completed: false },
            { id: "l11", title: "Deploy Contínuo com CI/CD", duration: "19:45", playbackId: "DS00S01vK02M66B9P2f94902FhWcuxXvV", completed: false },
        ]
    }
]

export default function ClassroomPage() {
    const params = useParams()
    const [sidebarOpen, setSidebarOpen] = useState(true)
    const [currentLesson, setCurrentLesson] = useState(MOCK_MODULES[0].lessons[0])
    const [completedLessons, setCompletedLessons] = useState<string[]>(["l1", "l2"])

    // Lista plana de todas as aulas para navegação linear
    const allLessons = MOCK_MODULES.flatMap(m => m.lessons)
    const currentLessonIndex = allLessons.findIndex(l => l.id === currentLesson.id)

    const goToNextLesson = () => {
        if (currentLessonIndex < allLessons.length - 1) {
            setCurrentLesson(allLessons[currentLessonIndex + 1])
        }
    }

    const goToPrevLesson = () => {
        if (currentLessonIndex > 0) {
            setCurrentLesson(allLessons[currentLessonIndex - 1])
        }
    }

    const toggleLessonStatus = (id: string) => {
        setCompletedLessons(prev =>
            prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
        )
    }

    // Calcular progresso total
    const totalLessons = MOCK_MODULES.reduce((acc, m) => acc + m.lessons.length, 0)
    const progressPercent = Math.round((completedLessons.length / totalLessons) * 100)

    return (
        <div className="flex flex-col h-screen bg-[#061629] text-white overflow-hidden font-exo">
            {/* Header Imersivo */}
            <header className="h-16 flex items-center justify-between px-6 border-b border-white/5 bg-black/60 shadow-2xl z-50">
                <div className="flex items-center gap-6">
                    <Link
                        href="/dashboard-student"
                        className="flex items-center gap-3 group text-gray-400 hover:text-white transition-all"
                    >
                        <div className="p-1.5 bg-white/5 rounded-lg group-hover:bg-[#00C402]/20 transition-colors">
                            <ChevronLeft size={20} className="group-hover:text-[#00C402]" />
                        </div>
                        <span className="text-xs font-bold uppercase tracking-widest hidden md:block">Sair da Sala</span>
                    </Link>
                    <div className="h-6 w-px bg-white/10"></div>
                    <div>
                        <h1 className="text-sm md:text-base font-black uppercase italic tracking-tighter truncate max-w-[150px] md:max-w-md">
                            {currentLesson.title}
                        </h1>
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    <div className="hidden lg:flex flex-col items-end">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Seu Progresso</span>
                            <span className="text-xs font-black text-[#00C402]">{progressPercent}%</span>
                        </div>
                        <div className="w-32 h-1 bg-white/10 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-[#00C402] transition-all duration-1000 shadow-[0_0_10px_rgba(0,196,2,0.5)]"
                                style={{ width: `${progressPercent}%` }}
                            ></div>
                        </div>
                    </div>
                    <button
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        className="p-2 bg-[#00C402]/10 border border-[#00C402]/20 rounded-lg transition-colors text-[#00C402] hover:bg-[#00C402] hover:text-black"
                    >
                        {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
                    </button>
                </div>
            </header>

            <main className="flex flex-1 overflow-hidden">
                {/* Player Section */}
                <div className="flex-1 overflow-y-auto bg-black flex flex-col">
                    <div className="flex-1 flex items-center justify-center p-0 md:p-12 lg:p-16">
                        <div className="w-full max-w-6xl aspect-video relative group">
                            {/* Glow decorativo atrás do player */}
                            <div className="absolute -inset-1 bg-[#00C402]/10 rounded-2xl blur-3xl opacity-0 group-hover:opacity-100 transition duration-1000"></div>

                            <div className="relative w-full h-full rounded-none md:rounded-2xl overflow-hidden border border-white/5 shadow-[0_0_80px_rgba(0,0,0,0.9)] bg-[#0a1f3a]/20">
                                <MuxPlayer
                                    playbackId={currentLesson.playbackId}
                                    metadataVideoTitle={currentLesson.title}
                                    className="w-full h-full"
                                    accentColor="#00C402"
                                    primaryColor="#00C402"
                                    onEnded={() => toggleLessonStatus(currentLesson.id)}
                                />
                            </div>

                            {/* Controles de Navegação de Aula */}
                            <div className="flex items-center justify-between mt-6 px-4 md:px-0">
                                <button
                                    onClick={goToPrevLesson}
                                    disabled={currentLessonIndex === 0}
                                    className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold uppercase italic tracking-tighter transition-all shadow-xl ${currentLessonIndex === 0
                                            ? 'bg-white/5 text-gray-600 cursor-not-allowed border border-white/5'
                                            : 'bg-white/5 text-gray-400 hover:bg-[#00C402]/20 hover:text-[#00C402] border border-white/10 hover:border-[#00C402]/40'
                                        }`}
                                >
                                    <ChevronLeft size={20} />
                                    <span>Aula Anterior</span>
                                </button>

                                <button
                                    onClick={goToNextLesson}
                                    disabled={currentLessonIndex === allLessons.length - 1}
                                    className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold uppercase italic tracking-tighter transition-all shadow-xl ${currentLessonIndex === allLessons.length - 1
                                            ? 'bg-white/5 text-gray-600 cursor-not-allowed border border-white/5'
                                            : 'bg-[#00C402] text-black hover:brightness-110 shadow-[0_0_20px_rgba(0,196,2,0.3)]'
                                        }`}
                                >
                                    <span>Próxima Aula</span>
                                    <ChevronRight size={20} />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Aula Info (Abaixo do Vídeo) */}
                    <div className="px-6 md:px-12 pb-16">
                        <div className="max-w-6xl mx-auto">
                            <ClassroomTabs
                                lessonTitle={currentLesson.title}
                                description="Esta aula aborda os fundamentos da arquitetura EXS, focando em performance e escalabilidade. Explore os materiais complementares e tire suas dúvidas no fórum abaixo."
                            />
                        </div>
                    </div>
                </div>

                {/* Sidebar Playlist */}
                <aside
                    className={`
                        fixed md:relative top-0 right-0 h-full w-full md:w-[420px] bg-[#0a1f3a]/95 backdrop-blur-3xl md:bg-[#0a1f3a] border-l border-white/10 transition-all duration-500 ease-in-out z-40 shadow-2xl
                        ${sidebarOpen ? 'translate-x-0' : 'translate-x-full md:hidden'}
                    `}
                >
                    <div className="flex flex-col h-full">
                        <div className="p-8 border-b border-white/10">
                            <h3 className="text-sm font-black uppercase tracking-[5px] text-[#00C402] mb-1 italic">Conteúdo do Curso</h3>
                            <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest leading-none">Engenharia de Software EXS</p>
                        </div>

                        <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-[#00C402]/20 hover:scrollbar-thumb-[#00C402]/40 scrollbar-track-transparent">
                            {MOCK_MODULES.map((module) => (
                                <div key={module.id} className="border-b border-white/5">
                                    <div className="px-8 py-4 bg-white/5 flex items-center justify-between group">
                                        <span className="text-[11px] font-black uppercase tracking-widest text-gray-400">{module.title}</span>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] font-bold text-gray-600">{module.lessons.filter(l => completedLessons.includes(l.id)).length}/{module.lessons.length}</span>
                                        </div>
                                    </div>
                                    <div className="divide-y divide-white/5">
                                        {module.lessons.map((lesson) => (
                                            <button
                                                key={lesson.id}
                                                onClick={() => {
                                                    setCurrentLesson(lesson)
                                                    if (window.innerWidth < 768) setSidebarOpen(false)
                                                }}
                                                className={`
                                                    w-full flex items-center gap-4 px-8 py-6 text-left transition-all relative group
                                                    ${currentLesson.id === lesson.id ? 'bg-[#00C402]/5' : 'hover:bg-white/5'}
                                                `}
                                            >
                                                {/* Indicador de Aula Atual */}
                                                {currentLesson.id === lesson.id && (
                                                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#00C402] shadow-[0_0_15px_rgba(0,196,2,0.8)]"></div>
                                                )}

                                                <div
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        toggleLessonStatus(lesson.id)
                                                    }}
                                                    className={`
                                                        flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all
                                                        ${completedLessons.includes(lesson.id)
                                                            ? 'bg-[#00C402] border-[#00C402] shadow-[0_0_10px_rgba(0,196,2,0.5)]'
                                                            : 'border-white/10 group-hover:border-[#00C402]/40'}
                                                    `}
                                                >
                                                    {completedLessons.includes(lesson.id) ? (
                                                        <CheckCircle2 size={14} className="text-black" />
                                                    ) : (
                                                        <PlayCircle size={10} className="text-gray-600 group-hover:text-[#00C402] opacity-0 group-hover:opacity-100 transition-opacity" />
                                                    )}
                                                </div>

                                                <div className="flex-1 min-w-0">
                                                    <p className={`text-sm font-bold uppercase italic tracking-tighter truncate ${currentLesson.id === lesson.id ? 'text-[#00C402]' : 'text-gray-400 group-hover:text-gray-200'}`}>
                                                        {lesson.title}
                                                    </p>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">{lesson.duration}</span>
                                                        {currentLesson.id === lesson.id && (
                                                            <span className="flex h-1 w-1 rounded-full bg-[#00C402] animate-pulse"></span>
                                                        )}
                                                    </div>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </aside>
            </main>
        </div>
    )
}
