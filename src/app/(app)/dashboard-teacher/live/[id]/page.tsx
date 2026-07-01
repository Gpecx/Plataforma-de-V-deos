"use client"

import { useState, useEffect, useRef } from 'react'
import { useLiveStore } from '@/store/useLiveStore'
import { Button } from '@/components/ui/button'
import {
    Play,
    Square,
    Video,
    VideoOff,
    Mic,
    MicOff,
    MonitorUp,
    Users,
    MessageSquare,
    Clock,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { ConfirmModal } from '@/components/ConfirmModal'
import { LiveHeader } from '@/components/live/LiveHeader'
import { LiveStatusBadge } from '@/components/live/LiveStatusBadge'
import { LiveChatPanel } from '@/components/live/LiveChatPanel'
import { ChatMessage, Participant } from '@/types/live'

// Formata segundos para HH:MM:SS
const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = seconds % 60
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}

export default function LiveRoomPage({ params }: { params: { id: string } }) {
    const { isLiveActive, setLiveActive, viewers, setViewers, liveDurationSeconds, incrementDuration, resetDuration } = useLiveStore()
    const router = useRouter()
    
    const [cameraOn, setCameraOn] = useState(false)
    const [micOn, setMicOn] = useState(false)
    const [showEndModal, setShowEndModal] = useState(false)
    
    // Empty state data
    const [messages, setMessages] = useState<ChatMessage[]>([])
    
    const participants: Participant[] = []

    useEffect(() => { window.scrollTo(0, 0) }, [])

    // Timer effect
    useEffect(() => {
        let interval: NodeJS.Timeout
        if (isLiveActive) {
            interval = setInterval(() => {
                incrementDuration()
            }, 1000)
        }
        return () => clearInterval(interval)
    }, [isLiveActive, incrementDuration])

    const handleStartLive = () => {
        setLiveActive(true)
        setCameraOn(true)
        setMicOn(true)
        setViewers(0)
    }

    const handleEndLive = () => {
        setShowEndModal(true)
    }

    const confirmEndLive = () => {
        setShowEndModal(false)
        setLiveActive(false)
        resetDuration()
        setViewers(0)
        setCameraOn(false)
        setMicOn(false)
        router.push('/dashboard-teacher/live' as any)
    }

    const handleSendMessage = (text: string) => {
        const now = new Date()
        const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
        
        setMessages(prev => [...prev, {
            id: Date.now(),
            name: 'Prof. PowerPlay',
            text: text,
            time: timeStr,
            isTeacher: true
        }])
    }

    return (
        <div className="min-h-screen lg:h-screen pb-16 lg:pb-0 bg-transparent font-montserrat animate-in fade-in duration-500 flex flex-col lg:overflow-hidden">
            <LiveHeader
                title="Aula de Revisão - Módulo 1"
                subtitle="Sala de Transmissão"
                backUrl="/dashboard-teacher/live"
                isLiveActive={isLiveActive}
            />

            <div className="max-w-[1600px] w-full mx-auto px-4 md:px-8 flex-1 min-h-0 mb-4">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6 h-auto lg:h-full">
                    
                    {/* COLUNA ESQUERDA: VÍDEO E CONTROLES (70% -> col-span-8) */}
                    <div className="lg:col-span-8 flex flex-col gap-4 h-full min-h-0">
                        {/* Video Box */}
                        <div className="relative w-full aspect-video lg:aspect-auto lg:flex-1 bg-slate-950 rounded-xl overflow-hidden border border-black/20 shadow-lg flex items-center justify-center min-h-0">
                            {isLiveActive && (
                                <LiveStatusBadge variant="video" />
                            )}
                            
                            {!isLiveActive ? (
                                <div className="flex flex-col items-center gap-4 !text-white opacity-70">
                                    <VideoOff size={48} strokeWidth={1.5} />
                                    <span className="text-sm font-medium uppercase tracking-widest text-center px-4 !text-white">Câmera não iniciada</span>
                                </div>
                            ) : (
                                <div className="absolute inset-0 bg-slate-950">
                                </div>
                            )}
                        </div>

                        {/* Controls Bar */}
                        <div className="bg-white rounded-xl border border-black/10 p-4 shadow-sm flex flex-wrap items-center justify-between gap-4 shrink-0">
                            <div className="flex items-center gap-3">
                                <Button
                                    variant={cameraOn ? "default" : "outline"}
                                    onClick={() => setCameraOn(!cameraOn)}
                                    className={`w-12 h-12 rounded-full p-0 flex items-center justify-center transition-colors ${cameraOn ? 'bg-slate-900 text-white hover:bg-slate-800' : 'text-slate-600 border-slate-300 hover:bg-slate-50'}`}
                                >
                                    {cameraOn ? <Video size={20} /> : <VideoOff size={20} />}
                                </Button>
                                <Button
                                    variant={micOn ? "default" : "outline"}
                                    onClick={() => setMicOn(!micOn)}
                                    className={`w-12 h-12 rounded-full p-0 flex items-center justify-center transition-colors ${micOn ? 'bg-slate-900 text-white hover:bg-slate-800' : 'text-slate-600 border-slate-300 hover:bg-slate-50'}`}
                                >
                                    {micOn ? <Mic size={20} /> : <MicOff size={20} />}
                                </Button>
                                <Button
                                    variant="outline"
                                    className="w-12 h-12 rounded-full p-0 flex items-center justify-center text-slate-600 border-slate-300 hover:bg-slate-100 transition-colors"
                                    title="Compartilhar Tela"
                                >
                                    <MonitorUp size={20} />
                                </Button>
                            </div>

                            <div className="flex items-center gap-3">
                                {!isLiveActive ? (
                                    <Button onClick={handleStartLive} className="bg-slate-900 text-white font-bold uppercase text-[10px] tracking-widest h-12 px-8 rounded-lg hover:bg-slate-800 shadow-xl shadow-slate-900/20 active:scale-95 transition-all">
                                        <Play size={16} className="mr-2" strokeWidth={3} /> Iniciar Transmissão
                                    </Button>
                                ) : (
                                    <Button onClick={handleEndLive} className="bg-red-600 text-white font-bold uppercase text-[10px] tracking-widest h-12 px-8 rounded-lg hover:bg-red-700 shadow-xl shadow-red-600/20 active:scale-95 transition-all">
                                        <Square size={16} className="mr-2" strokeWidth={3} fill="currentColor" /> Encerrar
                                    </Button>
                                )}
                            </div>
                        </div>

                        {/* Metrics */}
                        <div className="grid grid-cols-3 gap-4 shrink-0">
                            <div className="bg-white rounded-xl border border-black/10 p-4 shadow-sm flex flex-col items-center justify-center gap-1 hover:border-slate-300 transition-colors">
                                <Users size={20} className="text-slate-400 mb-1" />
                                <span className="text-2xl font-black text-slate-900 leading-none">{viewers}</span>
                                <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Espectadores</span>
                            </div>
                            <div className="bg-white rounded-xl border border-black/10 p-4 shadow-sm flex flex-col items-center justify-center gap-1 hover:border-slate-300 transition-colors">
                                <Clock size={20} className="text-slate-400 mb-1" />
                                <span className="text-2xl font-black text-slate-900 leading-none">{formatTime(liveDurationSeconds)}</span>
                                <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Tempo ao Vivo</span>
                            </div>
                            <div className="bg-white rounded-xl border border-black/10 p-4 shadow-sm flex flex-col items-center justify-center gap-1 hover:border-slate-300 transition-colors">
                                <MessageSquare size={20} className="text-slate-400 mb-1" />
                                <span className="text-2xl font-black text-slate-900 leading-none">{messages.length}</span>
                                <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Mensagens</span>
                            </div>
                        </div>
                    </div>

                    {/* COLUNA DIREITA: CHAT E PARTICIPANTES (30% -> col-span-4) */}
                    <div className="lg:col-span-4 flex flex-col h-[500px] lg:h-full">
                        <LiveChatPanel
                            role="teacher"
                            isLiveActive={isLiveActive}
                            messages={messages}
                            participants={participants}
                            onSendMessage={handleSendMessage}
                        />
                    </div>

                </div>
            </div>

            <ConfirmModal
                open={showEndModal}
                onClose={() => setShowEndModal(false)}
                onConfirm={confirmEndLive}
                title="Encerrar Transmissão"
                description="Tem certeza que deseja encerrar esta transmissão? Os alunos não poderão mais acessar a sala."
                confirmLabel="Encerrar Transmissão"
                cancelLabel="Cancelar"
                variant="danger"
            />
        </div>
    )
}
