"use client"

import { useState, useRef, useEffect } from 'react'
import { ArrowLeft, Send, Search, Users, MessageSquare, GraduationCap } from 'lucide-react'
import Link from 'next/link'

interface ChatMessage {
    id: string
    role: 'teacher' | 'student'
    content: string
    time: string
    studentName?: string
}

// Mock initial data for teachers - List of students with active doubts
const STUDENTS = [
    { id: '1', name: 'Daniel Siqueira', course: 'Dominando o Marketing Digital', initials: 'DS', lastMsg: 'Professor, tenho uma dúvida...', status: 'online' },
    { id: '2', name: 'Ana Carolina', course: 'Copywriting de Elite', initials: 'AC', lastMsg: 'Pode revisar meu headline?', status: 'offline' },
    { id: '3', name: 'Lucas Ferreira', course: 'Vendas High Ticket', initials: 'LF', lastMsg: 'Como fechar o lead frio?', status: 'online' },
]

const INITIAL_MESSAGES: ChatMessage[] = [
    {
        id: '1',
        role: 'student',
        studentName: 'Daniel Siqueira',
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
        studentName: 'Daniel Siqueira',
        content: 'Entendi a aula 5! Mas ainda tenho dúvida sobre o topo do funil — no caso de produtos físicos como eu atrai leads frios?',
        time: 'Hoje, 10:11',
    },
]

export default function TeacherChatPage() {
    const [selectedStudent, setSelectedStudent] = useState(STUDENTS[0])
    const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES)
    const [input, setInput] = useState('')
    const bottomRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (bottomRef.current) {
            bottomRef.current.scrollIntoView({ behavior: 'auto', block: 'nearest' })
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
            role: 'teacher',
            content: text,
            time: now(),
        }
        setMessages(prev => [...prev, newMsg])
        setInput('')
    }

    const handleKey = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSend()
        }
    }

    return (
        <div className="h-[calc(100vh-20px)] bg-[#F8FAFC] flex flex-col overflow-hidden">
            <div className="max-w-full w-full mx-auto flex flex-col flex-1 pt-0 pb-1 px-2 gap-1 overflow-hidden">

                {/* Page Header */}
                <div className="flex items-center justify-between mt-0 scale-90 origin-left">
                    <div className="flex items-center gap-4">
                        <Link
                            href="/dashboard-teacher"
                            className="p-3 bg-white border-2 border-slate-100 rounded-2xl hover:border-black text-black transition shadow-sm"
                        >
                            <ArrowLeft size={20} />
                        </Link>
                        <div>
                            <h1 className="text-2xl font-black tracking-tighter uppercase text-black">
                                CENTRAL DE <span className="text-[#00C402]">MENSAGENS</span>
                            </h1>
                            <p className="text-[9px] font-black uppercase tracking-[4px] text-black mt-0.5">Gestão de suporte e dúvidas dos alunos em tempo real</p>
                        </div>
                    </div>
                </div>

                <div className="flex flex-1 gap-4 overflow-hidden">
                    {/* Student List Sidebar */}
                    <aside className="w-64 shrink-0 hidden md:flex flex-col gap-3 overflow-y-auto pr-2 custom-scrollbar">
                        <div className="text-[9px] font-black uppercase tracking-[3px] text-black px-2 mb-1">CONVERSAS ATIVAS</div>
                        {STUDENTS.map(student => (
                            <button
                                key={student.id}
                                onClick={() => setSelectedStudent(student)}
                                className={`flex items-center gap-4 p-5 rounded-3xl border-2 text-left transition-all ${selectedStudent.id === student.id ? 'bg-white border-black shadow-md ring-1 ring-black/5' : 'bg-white/50 border-slate-100 hover:border-black/20'}`}
                            >
                                <div className={`w-11 h-11 rounded-2xl flex items-center justify-center font-black text-xs shrink-0 ${selectedStudent.id === student.id ? 'bg-black text-white' : 'bg-slate-100 text-black'}`}>
                                    {student.initials}
                                </div>
                                <div className="min-w-0">
                                    <h4 className={`font-black uppercase text-[11px] tracking-tight truncate ${selectedStudent.id === student.id ? 'text-black' : 'text-slate-900'}`}>
                                        {student.name}
                                    </h4>
                                    <p className="text-[9px] font-bold uppercase tracking-wide text-slate-500 truncate mt-1 italic">{student.course}</p>
                                </div>
                            </button>
                        ))}
                    </aside>

                    {/* Chat Window */}
                    <section className="flex-1 flex flex-col bg-white border-2 border-slate-100 rounded-[32px] overflow-hidden shadow-2xl mb-2">
                        {/* Chat Header */}
                        <div className="flex items-center gap-5 px-8 py-5 border-b-2 border-slate-50 bg-slate-50/10">
                            <div className="w-11 h-11 rounded-2xl bg-black flex items-center justify-center text-white font-black text-sm shadow-sm">
                                {selectedStudent.initials}
                            </div>
                            <div>
                                <h3 className="font-black uppercase tracking-tighter text-base text-black">{selectedStudent.name}</h3>
                                <div className="flex items-center gap-2 mt-0.5">
                                    <div className={`w-1.5 h-1.5 rounded-full ${selectedStudent.status === 'online' ? 'bg-[#00C402]' : 'bg-slate-300'}`}></div>
                                    <span className={`text-[9px] font-black uppercase tracking-[3px] ${selectedStudent.status === 'online' ? 'text-[#00C402]' : 'text-slate-400'}`}>
                                        {selectedStudent.status === 'online' ? 'Aluno Online' : 'Aluno Offline'}
                                    </span>
                                </div>
                            </div>
                            <div className="ml-auto">
                                <div className="hidden lg:flex items-center gap-2 text-[8px] font-black uppercase tracking-[2px] text-black border-2 border-black/5 px-4 py-2 rounded-full">
                                    <Users size={12} className="text-[#00C402]" />
                                    Matriculado em: {selectedStudent.course}
                                </div>
                            </div>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto px-6 md:px-10 py-8 space-y-8 bg-white/50 custom-scrollbar">
                            {messages.map(msg => (
                                <div
                                    key={msg.id}
                                    className={`flex gap-4 ${msg.role === 'teacher' ? 'flex-row-reverse' : 'flex-row'} animate-in fade-in slide-in-from-bottom-2 duration-300`}
                                >
                                    {/* Avatar */}
                                    <div className={`w-8 h-8 rounded-xl shrink-0 flex items-center justify-center font-black text-[9px] mt-1 ${msg.role === 'student' ? 'bg-slate-100 text-black border border-slate-200' : 'bg-black text-white'}`}>
                                        {msg.role === 'student' ? selectedStudent.initials : 'EU'}
                                    </div>

                                    {/* Bubble */}
                                    <div className={`max-w-[75%] ${msg.role === 'teacher' ? 'items-end' : 'items-start'} flex flex-col gap-1.5`}>
                                        <div className={`px-6 py-4 rounded-3xl text-[13px] md:text-sm font-bold leading-relaxed shadow-sm ${msg.role === 'student' ? 'bg-slate-50 border-2 border-slate-100 text-black rounded-tl-none' : 'bg-black text-white rounded-tr-none'}`}>
                                            {msg.content}
                                        </div>
                                        <span className="text-[8px] font-black uppercase tracking-widest text-slate-500 px-2">{msg.time}</span>
                                    </div>
                                </div>
                            ))}
                            <div ref={bottomRef} />
                        </div>

                        {/* Input Bar */}
                        <div className="px-6 md:px-8 py-6 border-t-2 border-slate-50 bg-slate-50/30">
                            <div className="flex items-end gap-3 md:gap-5">
                                <button className="p-3 text-black hover:scale-110 transition shrink-0">
                                    <MessageSquare size={20} />
                                </button>
                                <div className="flex-1 bg-white border-2 border-slate-100 rounded-3xl flex items-end px-6 py-4 focus-within:border-black transition shadow-sm">
                                    <textarea
                                        value={input}
                                        onChange={e => setInput(e.target.value)}
                                        onKeyDown={handleKey}
                                        placeholder="Responda seu aluno aqui..."
                                        rows={2}
                                        className="flex-1 bg-transparent outline-none resize-none font-bold text-sm text-black placeholder:text-slate-300 placeholder:font-black max-h-40"
                                        style={{ lineHeight: '1.6' }}
                                    />
                                </div>
                                <button
                                    onClick={handleSend}
                                    disabled={!input.trim()}
                                    className="w-14 h-14 bg-black text-white rounded-2xl flex items-center justify-center hover:bg-[#00C402] disabled:opacity-20 active:scale-95 transition-all shadow-xl shrink-0 group"
                                >
                                    <Send size={20} strokeWidth={2.5} className="group-hover:rotate-12 transition-transform" />
                                </button>
                            </div>
                            <p className="text-[8px] font-black uppercase tracking-[3px] text-center text-slate-400 mt-4">Sistema de Mentoria SPCS Academy</p>
                        </div>
                    </section>
                </div>
            </div>

            <style jsx>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #E2E8F0;
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #CBD5E0;
                }
            `}</style>
        </div>
    )
}