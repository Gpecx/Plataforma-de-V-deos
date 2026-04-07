"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { MessageSquare, ArrowLeft, ArrowRight, Clock, BookOpen, Reply } from 'lucide-react'
import Link from 'next/link'

interface Message {
    id: string
    from: string
    course: string
    lesson: string
    preview: string
    fullText: string
    time: string
    read: boolean
    avatarInitials: string
}

// Mock data — wire up to Firebase as needed
const MOCK_MESSAGES: Message[] = [
    {
        id: '1',
        from: 'Prof. Marco Aurelio',
        course: 'Dominando o Marketing Digital',
        lesson: 'Aula 4 — Funis de Conversão',
        preview: 'Ótima pergunta! Vou explicar o funil mais detalhadamente...',
        fullText: 'Ótima pergunta! Vou explicar o funil mais detalhadamente. O conceito principal é que cada etapa deve reduzir o atrito do lead. Veja os exemplos que deixei no material complementar da aula 5. Qualquer dúvida, pode mandar mensagem aqui mesmo!',
        time: '5 min atrás',
        read: false,
        avatarInitials: 'MA',
    },
    {
        id: '2',
        from: 'Prof. Rafael Menezes',
        course: 'Copywriting de Elite',
        lesson: 'Aula 7 — Gatilhos Mentais Avançados',
        preview: 'Excelente! A técnica do "loop aberto" é...',
        fullText: 'Excelente! A técnica do "loop aberto" é uma das mais poderosas no arsenal do copywriter. Você a aplica criando expectativa no início, mas só entregando a resolução no final. Isso mantém o leitor preso até o CTA.',
        time: '3h atrás',
        read: false,
        avatarInitials: 'RM',
    },
    {
        id: '3',
        from: 'Prof. Fernanda Dias',
        course: 'Vendas High Ticket',
        lesson: 'Aula 2 — Qualificação de Leads',
        preview: 'Boa observação sobre o BANT Framework...',
        fullText: 'Boa observação sobre o BANT Framework! O erro mais comum é focar só em Budget quando na verdade Authority é o que realmente fecha a venda. Se você não fala com o decisor, está reféns de um intermediário.',
        time: 'Ontem, 18:42',
        read: true,
        avatarInitials: 'FD',
    },
]

export default function StudentMessagesPage() {
    const router = useRouter()
    const [selected, setSelected] = useState<Message | null>(null)
    const [messages, setMessages] = useState(MOCK_MESSAGES)

    const handleSelect = (msg: Message) => {
        setSelected(msg)
        setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, read: true } : m))
    }

    const unread = messages.filter(m => !m.read).length

    return (
        <div className="min-h-screen bg-transparent text-white">
            <div className="max-w-6xl mx-auto p-8 md:p-12">
                {/* Header */}
                <div className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-5">
                        <div className="w-14 h-14 bg-[#1D5F31] rounded-2xl flex items-center justify-center text-black shadow-[0_0_30px_rgba(0,196,2,0.4)]">
                            <MessageSquare size={28} strokeWidth={3} />
                        </div>
                        <div>
                            <h1 className="text-4xl font-bold  tracking-tighter uppercase mb-1">
                                Mensagens <span className="text-[#1D5F31]">dos Professores</span>
                            </h1>
                            <p className="text-[10px] font-bold uppercase tracking-[4px] text-gray-500">
                                {unread > 0 ? `${unread} respostas não lidas` : 'Tudo em dia, guerreiro!'}
                            </p>
                        </div>
                    </div>
                    <Link
                        href="/dashboard-student"
                        className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gray-500 hover:text-white transition border border-white/5 bg-white/5 px-5 py-3 rounded-xl"
                    >
                        <ArrowLeft size={16} />
                        Voltar
                    </Link>
                </div>

                <div className="grid md:grid-cols-5 gap-8">
                    {/* Message List */}
                    <div className="md:col-span-2 space-y-3">
                        {messages.map(msg => (
                            <button
                                key={msg.id}
                                onClick={() => handleSelect(msg)}
                                className={`w-full text-left p-6 rounded-[24px] border transition-all group ${selected?.id === msg.id ? 'bg-[#1D5F31]/10 border-[#1D5F31]/40' : msg.read ? 'bg-white/3 border-white/5 opacity-60 hover:opacity-100 hover:border-white/20' : 'bg-white/5 border-white/10 hover:border-[#1D5F31]/30'}`}
                            >
                                <div className="flex items-center gap-4 mb-3">
                                    <div className="w-10 h-10 rounded-xl bg-[#1D5F31]/20 flex items-center justify-center text-[#1D5F31] font-bold text-xs shrink-0">
                                        {msg.avatarInitials}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-bold uppercase text-[11px] tracking-tight truncate">{msg.from}</h4>
                                        <p className="text-[9px] font-bold uppercase tracking-widest text-[#1D5F31]/70 truncate">{msg.course}</p>
                                    </div>
                                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                                        <span className="text-[9px] font-bold uppercase tracking-wider text-gray-600">{msg.time}</span>
                                        {!msg.read && <div className="w-2 h-2 rounded-full bg-[#1D5F31]" />}
                                    </div>
                                </div>
                                <p className="text-[10px] text-gray-500 font-medium  leading-relaxed line-clamp-1">"{msg.preview}"</p>
                            </button>
                        ))}
                    </div>

                    {/* Message Detail */}
                    <div className="md:col-span-3">
                        {selected ? (
                            <div className="bg-white/5 border border-white/10 rounded-[32px] p-8 animate-in fade-in slide-in-from-right-2 duration-300">
                                {/* Meta */}
                                <div className="flex items-start gap-5 mb-8 pb-8 border-b border-white/5">
                                    <div className="w-16 h-16 rounded-2xl bg-[#1D5F31]/20 flex items-center justify-center text-[#1D5F31] font-bold text-base shrink-0 shadow-[0_0_20px_rgba(0,196,2,0.2)]">
                                        {selected.avatarInitials}
                                    </div>
                                    <div className="flex-1">
                                        <h2 className="text-xl font-bold uppercase  tracking-tighter">{selected.from}</h2>
                                        <div className="flex flex-wrap gap-4 mt-2">
                                            <span className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[2px] text-gray-500">
                                                <BookOpen size={11} className="text-[#1D5F31]" />
                                                {selected.course}
                                            </span>
                                            <span className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[2px] text-gray-500">
                                                <Clock size={11} className="text-[#1D5F31]" />
                                                {selected.time}
                                            </span>
                                        </div>
                                        <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 bg-white/5 rounded-lg border border-white/5 text-[8px] font-bold uppercase tracking-widest text-gray-500 ">
                                            Re: {selected.lesson}
                                        </div>
                                    </div>
                                </div>

                                {/* Message Body */}
                                <div className="bg-black/20 rounded-2xl p-6 mb-8">
                                    <p className="text-sm text-gray-300 leading-relaxed font-medium ">"{selected.fullText}"</p>
                                </div>

                                {/* Actions */}
                                <div className="flex gap-4">
                                    <button
                                        onClick={() => router.push('/dashboard-student/chat')}
                                        className="flex items-center gap-3 px-8 py-4 bg-[#1D5F31] text-black font-bold uppercase text-[10px] tracking-widest rounded-2xl hover:scale-105 transition-all shadow-lg"
                                    >
                                        <Reply size={16} />
                                        Responder Professor
                                        <ArrowRight size={16} />
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="h-full flex items-center justify-center py-24 bg-white/[0.02] border border-white/5 rounded-[32px]">
                                <div className="text-center">
                                    <MessageSquare size={40} className="mx-auto text-gray-700 mb-4 opacity-30" />
                                    <p className="text-xs font-bold uppercase tracking-widest text-gray-600 ">Selecione uma mensagem</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
