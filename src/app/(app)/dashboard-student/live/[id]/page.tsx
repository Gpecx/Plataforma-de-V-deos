"use client"

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { LiveHeader } from '@/components/live/LiveHeader'
import { LiveStatusBadge } from '@/components/live/LiveStatusBadge'
import { LiveChatPanel } from '@/components/live/LiveChatPanel'
import { ChatMessage, Participant } from '@/types/live'
import { Users, Clock, MessageSquare, VideoOff } from 'lucide-react'

// Formata segundos para HH:MM:SS
const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = seconds % 60
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}

export default function StudentLiveRoomPage({ params }: { params: { id: string } }) {
    // Simulando estado de live para o aluno. Na vida real isso viria do Firestore/LiveKit
    const [isLiveActive, setLiveActive] = useState(true)
    const [liveDurationSeconds, setLiveDurationSeconds] = useState(3600) // 1 hora
    const [viewers, setViewers] = useState(142)
    
    // Empty state data
    const [messages, setMessages] = useState<ChatMessage[]>([
        {
            id: 1,
            name: 'Prof. PowerPlay',
            text: 'Bem-vindos à nossa aula de revisão! Mandem suas dúvidas no chat.',
            time: '19:00',
            isTeacher: true
        }
    ])
    
    const participants: Participant[] = [
        { id: 1, name: 'João Silva', online: true },
        { id: 2, name: 'Maria Souza', online: true },
        { id: 3, name: 'Carlos Santos', online: false },
    ]

    useEffect(() => { window.scrollTo(0, 0) }, [])

    // Timer effect
    useEffect(() => {
        let interval: NodeJS.Timeout
        if (isLiveActive) {
            interval = setInterval(() => {
                setLiveDurationSeconds(prev => prev + 1)
            }, 1000)
        }
        return () => clearInterval(interval)
    }, [isLiveActive])

    const handleSendMessage = (text: string) => {
        const now = new Date()
        const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
        
        setMessages(prev => [...prev, {
            id: Date.now(),
            name: 'Aluno Estudioso',
            text: text,
            time: timeStr,
            isTeacher: false
        }])
    }

    return (
        <div className="min-h-screen lg:h-screen pb-16 lg:pb-0 bg-[#F5F5F7] font-montserrat animate-in fade-in duration-500 flex flex-col lg:overflow-hidden">
            <LiveHeader
                title="Aula de Revisão - Módulo 1"
                subtitle="Sala de Transmissão"
                backUrl="/dashboard-student"
                isLiveActive={isLiveActive}
            />

            <div className="max-w-[1600px] w-full mx-auto px-4 md:px-8 flex-1 min-h-0 mb-4">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6 h-auto lg:h-full">
                    
                    {/* COLUNA ESQUERDA: VÍDEO (70% -> col-span-8) */}
                    <div className="lg:col-span-8 flex flex-col gap-4 h-full min-h-0">
                        {/* Video Box */}
                        <div className="relative w-full aspect-video lg:aspect-auto lg:flex-1 bg-slate-950 rounded-xl overflow-hidden border border-black/20 shadow-lg flex items-center justify-center min-h-0">
                            {isLiveActive && (
                                <LiveStatusBadge variant="video" />
                            )}
                            
                            {!isLiveActive ? (
                                <div className="flex flex-col items-center gap-4 !text-white opacity-70">
                                    <VideoOff size={48} strokeWidth={1.5} />
                                    <span className="text-sm font-medium uppercase tracking-widest text-center px-4 !text-white">Aguardando o professor iniciar...</span>
                                </div>
                            ) : (
                                <div className="absolute inset-0 bg-slate-950 flex flex-col items-center justify-center">
                                    {/* Simulação do stream */}
                                    <span className="text-white/40 text-sm font-medium uppercase tracking-widest text-center px-4">
                                        Transmissão em andamento...
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Sair da Live Button */}
                        <div className="flex justify-end shrink-0">
                            <Link href="/dashboard-student">
                                <Button variant="outline" className="text-slate-600 border-slate-300 hover:bg-slate-100 uppercase text-[10px] tracking-widest font-bold px-6 h-10 rounded-lg">
                                    Sair da live
                                </Button>
                            </Link>
                        </div>

                        {/* Informações da Live (Abaixo do player) */}
                        <div className="bg-white rounded-xl border border-black/10 p-6 shadow-sm flex flex-col gap-4 shrink-0">
                            <h2 className="text-xl font-bold uppercase tracking-tight text-slate-900">
                                Aula de Revisão - Módulo 1
                            </h2>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-sm font-bold text-slate-600 border border-slate-200">
                                    PP
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-sm font-bold text-slate-800">Prof. PowerPlay</span>
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Especialista</span>
                                </div>
                            </div>
                            <p className="text-sm font-medium text-slate-600 leading-relaxed">
                                Revisão completa dos conceitos de design e interface do Módulo 1. Traga suas dúvidas sobre espaçamento, tipografia e hierarquia visual.
                            </p>
                        </div>

                    </div>

                    {/* COLUNA DIREITA: CHAT E PARTICIPANTES (30% -> col-span-4) */}
                    <div className="lg:col-span-4 flex flex-col h-[500px] lg:h-full">
                        <LiveChatPanel
                            role="student"
                            isLiveActive={isLiveActive}
                            messages={messages}
                            participants={participants}
                            onSendMessage={handleSendMessage}
                        />
                    </div>

                </div>
            </div>
        </div>
    )
}
