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

// Mock initial conversation — replace with real-time Supabase subscription later
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

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
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
        <div className="min-h-screen bg-[#061629] text-white flex flex-col">
            <div className="max-w-6xl w-full mx-auto flex flex-col flex-1 p-6 md:p-10 gap-6">

                {/* Page Header */}
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-4">
                        <Link
                            href="/dashboard-student/messages"
                            className="p-3 bg-white/5 border border-white/10 rounded-2xl hover:border-white/30 text-gray-500 hover:text-white transition"
                        >
                            <ArrowLeft size={20} />
                        </Link>
                        <div>
                            <h1 className="text-3xl font-black italic tracking-tighter uppercase">
                                Chat com <span className="text-[#00C402]">Professores</span>
                            </h1>
                            <p className="text-[9px] font-black uppercase tracking-[4px] text-gray-600 mt-0.5">Tire suas dúvidas em tempo real</p>
                        </div>
                    </div>
                </div>

                <div className="flex flex-1 gap-6 h-[calc(100vh-220px)]">
                    {/* Teacher List Sidebar */}
                    <aside className="w-72 shrink-0 flex flex-col gap-3">
                        <div className="text-[9px] font-black uppercase tracking-[3px] text-gray-600 px-2 mb-1">Seus Professores</div>
                        {TEACHERS.map(teacher => (
                            <button
                                key={teacher.id}
                                onClick={() => setSelectedTeacher(teacher)}
                                className={`flex items-center gap-4 p-5 rounded-[20px] border text-left transition-all ${selectedTeacher.id === teacher.id ? 'bg-[#00C402]/10 border-[#00C402]/40' : 'bg-white/5 border-white/5 hover:border-white/20'}`}
                            >
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-sm shrink-0 ${selectedTeacher.id === teacher.id ? 'bg-[#00C402] text-black' : 'bg-[#00C402]/20 text-[#00C402]'}`}>
                                    {teacher.initials}
                                </div>
                                <div className="min-w-0">
                                    <h4 className={`font-black uppercase text-[11px] tracking-tight truncate ${selectedTeacher.id === teacher.id ? 'text-white' : 'text-gray-400'}`}>
                                        {teacher.name}
                                    </h4>
                                    <div className="flex items-center gap-1.5 mt-1">
                                        <BookOpen size={9} className="text-[#00C402] shrink-0" />
                                        <p className="text-[9px] font-bold uppercase tracking-wide text-gray-600 truncate italic">{teacher.course}</p>
                                    </div>
                                </div>
                            </button>
                        ))}
                    </aside>

                    {/* Chat Window */}
                    <section className="flex-1 flex flex-col bg-white/5 border border-white/10 rounded-[32px] overflow-hidden">
                        {/* Chat Header */}
                        <div className="flex items-center gap-5 px-8 py-5 border-b border-white/5 bg-black/20">
                            <div className="w-12 h-12 rounded-2xl bg-[#00C402] flex items-center justify-center text-black font-black shadow-[0_0_20px_rgba(0,196,2,0.3)]">
                                {selectedTeacher.initials}
                            </div>
                            <div>
                                <h3 className="font-black uppercase italic tracking-tighter text-base">{selectedTeacher.name}</h3>
                                <div className="flex items-center gap-2 mt-0.5">
                                    <div className="w-1.5 h-1.5 rounded-full bg-[#00C402]"></div>
                                    <span className="text-[9px] font-black uppercase tracking-[3px] text-[#00C402]">Online · Responde em até 2h</span>
                                </div>
                            </div>
                            <div className="ml-auto">
                                <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[2px] text-gray-600 border border-white/5 px-4 py-2 rounded-xl">
                                    <GraduationCap size={12} className="text-[#00C402]" />
                                    {selectedTeacher.course}
                                </div>
                            </div>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6">
                            {messages.map(msg => (
                                <div
                                    key={msg.id}
                                    className={`flex gap-4 ${msg.role === 'student' ? 'flex-row-reverse' : 'flex-row'} animate-in fade-in slide-in-from-bottom-2 duration-300`}
                                >
                                    {/* Avatar */}
                                    <div className={`w-9 h-9 rounded-xl shrink-0 flex items-center justify-center font-black text-[10px] mt-1 ${msg.role === 'teacher' ? 'bg-[#00C402]/20 text-[#00C402]' : 'bg-white/10 text-gray-400'}`}>
                                        {msg.role === 'teacher' ? selectedTeacher.initials : 'EU'}
                                    </div>

                                    {/* Bubble */}
                                    <div className={`max-w-[70%] ${msg.role === 'student' ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                                        <div className={`px-6 py-4 rounded-3xl text-sm font-medium leading-relaxed ${msg.role === 'teacher' ? 'bg-white/[0.07] border border-white/5 text-gray-200 rounded-tl-sm' : 'bg-[#00C402] text-black rounded-tr-sm'}`}>
                                            {msg.content}
                                        </div>
                                        <span className="text-[9px] font-black uppercase tracking-widest text-gray-700 px-2">{msg.time}</span>
                                    </div>
                                </div>
                            ))}
                            <div ref={bottomRef} />
                        </div>

                        {/* Input Bar */}
                        <div className="px-6 py-5 border-t border-white/5 bg-black/10">
                            <div className="flex items-end gap-4">
                                <button className="p-3 text-gray-600 hover:text-[#00C402] transition shrink-0">
                                    <Paperclip size={18} />
                                </button>
                                <div className="flex-1 bg-black/20 border border-white/10 rounded-[20px] flex items-end px-5 py-3 focus-within:border-[#00C402]/40 transition">
                                    <textarea
                                        value={input}
                                        onChange={e => setInput(e.target.value)}
                                        onKeyDown={handleKey}
                                        placeholder="Escreva sua dúvida para o mestre..."
                                        rows={1}
                                        className="flex-1 bg-transparent outline-none resize-none font-medium text-sm text-white placeholder:text-gray-600 placeholder:italic max-h-28"
                                        style={{ lineHeight: '1.6' }}
                                    />
                                </div>
                                <button className="p-3 text-gray-600 hover:text-[#00C402] transition shrink-0">
                                    <Mic size={18} />
                                </button>
                                <button
                                    onClick={handleSend}
                                    disabled={!input.trim()}
                                    className="w-12 h-12 bg-[#00C402] text-black rounded-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-[0_0_20px_rgba(0,196,2,0.3)] disabled:opacity-30 disabled:cursor-not-allowed shrink-0"
                                >
                                    <Send size={18} strokeWidth={3} />
                                </button>
                            </div>
                            <p className="text-[8px] font-black uppercase tracking-[3px] text-center text-gray-700 mt-3">Enter para enviar • Shift+Enter para nova linha</p>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    )
}
