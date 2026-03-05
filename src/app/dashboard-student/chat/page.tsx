"use client"

import { useState, useRef, useEffect } from 'react'
import { ArrowLeft, Send, Mic, Paperclip, BookOpen, GraduationCap } from 'lucide-react'
import Link from 'next/link'

interface ChatMessage {
    id: string
    role: 'student' | 'teacher'
    content: string
    time: string
}

// Mock initial conversation — replace with real-time Firebase subscription later
const INITIAL_MESSAGES: ChatMessage[] = [
    {
        id: '1',
        role: 'student',
        content: 'Professor, tenho uma dúvida sobre a aula 4 do módulo 2. Não entendi como aplicar o funil de conversão na prática para produtos físicos.',
        time: 'Ontem, 14:22',
    },
    {
        id: '2',
        role: 'teacher',
        content: 'Ótima pergunta! Para produtos físicos o funil funciona de maneira quase idêntica ao digital, mas com atenção especial ao ponto de entrega. Você precisa mapear desde a descoberta até o pós-venda. Veja os exemplos na aula 5 — ficará mais claro.',
        time: 'Ontem, 16:05',
    },
    {
        id: '3',
        role: 'student',
        content: 'Entendi a aula 5! Mas ainda tenho dúvida sobre o topo do funil — no caso de produtos físicos como eu atrai leads frios?',
        time: 'Hoje, 10:11',
    },
    {
        id: '4',
        role: 'teacher',
        content: 'Para leads frios em produtos físicos, a melhor abordagem é o conteúdo de pauta — você "rouba" a atenção de quem ainda não te conhece com um problema que ele já tem. Tráfego pago nessa etapa tem uma performance muito melhor que orgânico. Pode tentar aplicar essa semana e me conta!',
        time: 'Hoje, 10:47',
    },
]

const TEACHERS = [
    { id: '1', name: 'Prof. Marco Aurelio', course: 'Dominando o Marketing Digital', initials: 'MA' },
    { id: '2', name: 'Prof. Rafael Menezes', course: 'Copywriting de Elite', initials: 'RM' },
    { id: '3', name: 'Prof. Fernanda Dias', course: 'Vendas High Ticket', initials: 'FD' },
]

export default function StudentChatPage() {
    const [selectedTeacher, setSelectedTeacher] = useState(TEACHERS[0])
    const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES)
    const [input, setInput] = useState('')
    const bottomRef = useRef<HTMLDivElement>(null)
    const isInitialMount = useRef(true)

    // Force absolute scroll to top on mount with a slight delay to beat browser scroll restoration
    useEffect(() => {
        const timeout = setTimeout(() => {
            window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
        }, 0)
        return () => clearTimeout(timeout)
    }, [])

    useEffect(() => {
        if (isInitialMount.current) {
            isInitialMount.current = false
            return
        }

        // Ensure scroll only happens on new messages, not on mount
        if (bottomRef.current) {
            bottomRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' })
        }
    }, [messages])

    const now = () => {
        const d = new Date()
        return `Hoje, ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
    }

    const handleSend = () => {
        const text = input.trim()
        if (!text) return
        const newMsg: ChatMessage = {
            id: Date.now().toString(),
            role: 'student',
            content: text,
            time: now(),
        }
        setMessages(prev => [...prev, newMsg])
        setInput('')

        // Simulate teacher typing response
        setTimeout(() => {
            const autoReply: ChatMessage = {
                id: (Date.now() + 1).toString(),
                role: 'teacher',
                content: 'Recebi sua mensagem! Vou analisar e te responder em breve. Obrigado por estudar com dedicação, guerreiro! 💪',
                time: now(),
            }
            setMessages(prev => [...prev, autoReply])
        }, 1500)
    }

    const handleKey = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSend()
        }
    }

    return (
        <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col border-t border-slate-100">
            <div className="max-w-6xl w-full mx-auto flex flex-col flex-1 p-6 md:p-10 gap-6">

                {/* Page Header */}
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-4">
                        <Link
                            href="/dashboard-student/messages"
                            className="p-3 bg-white border border-slate-100 rounded-2xl hover:border-slate-300 text-slate-400 hover:text-slate-900 transition shadow-sm"
                        >
                            <ArrowLeft size={20} />
                        </Link>
                        <div>
                            <h1 className="text-2xl font-black tracking-tighter uppercase text-slate-900">
                                SUPORTE <span className="text-[#00C402]">ESPECIALIZADO</span>
                            </h1>
                            <p className="text-[9px] font-black uppercase tracking-[4px] text-slate-400 mt-0.5">Tira-dúvidas em tempo real com seus mentores</p>
                        </div>
                    </div>
                </div>

                <div className="flex flex-1 gap-8 h-[calc(100vh-220px)]">
                    {/* Teacher List Sidebar */}
                    <aside className="w-72 shrink-0 flex flex-col gap-3">
                        <div className="text-[9px] font-black uppercase tracking-[3px] text-slate-400 px-2 mb-1">CANAIS DE ATENDIMENTO</div>
                        {TEACHERS.map(teacher => (
                            <button
                                key={teacher.id}
                                onClick={() => setSelectedTeacher(teacher)}
                                className={`flex items-center gap-4 p-5 rounded-3xl border text-left transition-all ${selectedTeacher.id === teacher.id ? 'bg-white border-[#00C402]/30 shadow-md ring-1 ring-[#00C402]/5' : 'bg-white/50 border-slate-100 hover:border-slate-300'}`}
                            >
                                <div className={`w-11 h-11 rounded-2xl flex items-center justify-center font-black text-xs shrink-0 ${selectedTeacher.id === teacher.id ? 'bg-[#00C402] text-white' : 'bg-slate-100 text-slate-400'}`}>
                                    {teacher.initials}
                                </div>
                                <div className="min-w-0">
                                    <h4 className={`font-bold uppercase text-[11px] tracking-tight truncate ${selectedTeacher.id === teacher.id ? 'text-slate-900' : 'text-slate-400'}`}>
                                        {teacher.name}
                                    </h4>
                                    <div className="flex items-center gap-1.5 mt-1">
                                        <BookOpen size={10} className="text-[#00C402] shrink-0" />
                                        <p className="text-[9px] font-bold uppercase tracking-wide text-slate-400 truncate italic">{teacher.course}</p>
                                    </div>
                                </div>
                            </button>
                        ))}
                    </aside>

                    {/* Chat Window */}
                    <section className="flex-1 flex flex-col bg-white border border-slate-100 rounded-[32px] overflow-hidden shadow-sm">
                        {/* Chat Header */}
                        <div className="flex items-center gap-5 px-8 py-6 border-b border-slate-50 bg-slate-50/30">
                            <div className="w-11 h-11 rounded-2xl bg-slate-900 flex items-center justify-center text-white font-black text-sm shadow-sm">
                                {selectedTeacher.initials}
                            </div>
                            <div>
                                <h3 className="font-black uppercase tracking-tighter text-base text-slate-900">{selectedTeacher.name}</h3>
                                <div className="flex items-center gap-2 mt-0.5">
                                    <div className="w-1.5 h-1.5 rounded-full bg-[#00C402]"></div>
                                    <span className="text-[9px] font-black uppercase tracking-[3px] text-[#00C402]">Canal Online · Mentoria Ativa</span>
                                </div>
                            </div>
                            <div className="ml-auto">
                                <div className="hidden lg:flex items-center gap-2 text-[8px] font-black uppercase tracking-[2px] text-slate-400 border border-slate-100 px-4 py-2 rounded-full">
                                    <GraduationCap size={12} className="text-[#00C402]" />
                                    {selectedTeacher.course}
                                </div>
                            </div>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto px-10 py-8 space-y-8 bg-white/50">
                            {messages.map(msg => (
                                <div
                                    key={msg.id}
                                    className={`flex gap-4 ${msg.role === 'student' ? 'flex-row-reverse' : 'flex-row'} animate-in fade-in slide-in-from-bottom-2 duration-300`}
                                >
                                    {/* Avatar */}
                                    <div className={`w-8 h-8 rounded-xl shrink-0 flex items-center justify-center font-black text-[9px] mt-1 ${msg.role === 'teacher' ? 'bg-slate-100 text-slate-400' : 'bg-slate-900 text-white'}`}>
                                        {msg.role === 'teacher' ? selectedTeacher.initials : 'EU'}
                                    </div>

                                    {/* Bubble */}
                                    <div className={`max-w-[70%] ${msg.role === 'student' ? 'items-end' : 'items-start'} flex flex-col gap-1.5`}>
                                        <div className={`px-6 py-4 rounded-3xl text-sm font-medium leading-relaxed shadow-sm ${msg.role === 'teacher' ? 'bg-slate-50 border border-slate-100 text-slate-700 rounded-tl-none' : 'bg-slate-900 text-white rounded-tr-none'}`}>
                                            {msg.content}
                                        </div>
                                        <span className="text-[8px] font-black uppercase tracking-widest text-slate-300 px-2">{msg.time}</span>
                                    </div>
                                </div>
                            ))}
                            <div ref={bottomRef} />
                        </div>

                        {/* Input Bar */}
                        <div className="px-8 py-6 border-t border-slate-50 bg-slate-50/50">
                            <div className="flex items-end gap-5">
                                <button className="p-3 text-slate-300 hover:text-slate-900 transition shrink-0">
                                    <Paperclip size={20} />
                                </button>
                                <div className="flex-1 bg-white border border-slate-100 rounded-3xl flex items-end px-6 py-4 focus-within:border-[#00C402]/40 transition shadow-sm">
                                    <textarea
                                        value={input}
                                        onChange={e => setInput(e.target.value)}
                                        onKeyDown={handleKey}
                                        placeholder="Digite sua dúvida aqui..."
                                        rows={1}
                                        className="flex-1 bg-transparent outline-none resize-none font-medium text-sm text-slate-900 placeholder:text-slate-300 placeholder:font-bold max-h-28"
                                        style={{ lineHeight: '1.6' }}
                                    />
                                </div>
                                <button
                                    onClick={handleSend}
                                    disabled={!input.trim()}
                                    className="w-14 h-14 bg-slate-900 text-white rounded-2xl flex items-center justify-center hover:bg-slate-800 disabled:opacity-20 active:scale-95 transition-all shadow-md shrink-0"
                                >
                                    <Send size={20} strokeWidth={2.5} />
                                </button>
                            </div>
                            <p className="text-[8px] font-black uppercase tracking-[3px] text-center text-slate-300 mt-4">Sua conversa é protegida por criptografia SPCS Shield</p>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    )
}
