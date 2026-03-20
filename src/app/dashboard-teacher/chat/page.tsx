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
        <div className="h-[calc(100vh-40px)] bg-transparent flex flex-col overflow-hidden font-exo animate-in fade-in duration-500">
            <div className="max-w-full w-full mx-auto flex flex-col flex-1 pt-4 pb-2 px-4 gap-6 overflow-hidden">

                {/* Page Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <Link
                            href="/dashboard-teacher"
                            className="p-4 bg-white border border-slate-200 rounded-2xl hover:border-[#1D5F31]/30 text-slate-600 hover:text-[#1D5F31] transition shadow-sm active:scale-95"
                        >
                            <ArrowLeft size={20} />
                        </Link>
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <div className="w-1 h-1 rounded-full bg-[#1D5F31]"></div>
                                <span className="text-[9px] font-black uppercase tracking-[3px] text-slate-500">CREATOR CHAT</span>
                            </div>
                            <h1 className="text-3xl font-black tracking-tighter uppercase text-slate-900 leading-none">
                                Central de <span className="text-[#1D5F31]">Mensagens</span>
                            </h1>
                        </div>
                    </div>
                </div>

                <div className="flex flex-1 gap-8 overflow-hidden">
                    {/* Student List Sidebar */}
                    <aside className="w-80 shrink-0 hidden lg:flex flex-col gap-4 overflow-y-auto pr-2 custom-scrollbar">
                        <div className="text-[10px] font-black uppercase tracking-[4px] text-slate-600 px-4 mb-2">CONVERSAS ATIVAS</div>
                        {STUDENTS.map(student => (
                            <button
                                key={student.id}
                                onClick={() => setSelectedStudent(student)}
                                className={`flex items-center gap-5 p-6 rounded-[24px] border transition-all duration-300 group ${selectedStudent.id === student.id ? 'bg-[#1D5F31] border-[#1D5F31] shadow-xl shadow-[#1D5F31]/20' : 'bg-white border-slate-200 hover:border-[#1D5F31]/30 hover:shadow-md'}`}
                            >
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center font-black text-xs shrink-0 transition-all ${selectedStudent.id === student.id ? 'bg-white text-[#1D5F31] shadow-inner' : 'bg-slate-900 text-white'}`}>
                                    {student.initials}
                                </div>
                                <div className="min-w-0 text-left">
                                    <h4 className={`font-black uppercase text-xs tracking-tight truncate mb-1 ${selectedStudent.id === student.id ? 'text-white' : 'text-slate-900'}`}>
                                        {student.name}
                                    </h4>
                                    <p className={`text-[9px] font-bold uppercase tracking-widest truncate italic ${selectedStudent.id === student.id ? 'text-white/70' : 'text-slate-600'}`}>{student.course}</p>
                                </div>
                            </button>
                        ))}
                    </aside>

                    {/* Chat Window */}
                    <section className="flex-1 flex flex-col bg-white border border-slate-200 rounded-[40px] overflow-hidden shadow-2xl shadow-slate-200/50 mb-4 relative">
                        {/* Chat Header */}
                        <div className="flex items-center gap-6 px-10 py-6 border-b border-slate-50 bg-white/50 backdrop-blur-md">
                            <div className="w-12 h-12 rounded-full bg-[#1D5F31] flex items-center justify-center text-white font-black text-sm shadow-lg shadow-[#1D5F31]/20">
                                {selectedStudent.initials}
                            </div>
                            <div>
                                <h3 className="font-black uppercase tracking-tighter text-lg text-slate-900">{selectedStudent.name}</h3>
                                <div className="flex items-center gap-2 mt-1">
                                    <div className={`w-1.5 h-1.5 rounded-full ${selectedStudent.status === 'online' ? 'bg-[#1D5F31] animate-pulse' : 'bg-slate-300'}`}></div>
                                    <span className={`text-[10px] font-black uppercase tracking-[3px] ${selectedStudent.status === 'online' ? 'text-[#1D5F31]' : 'text-slate-600'}`}>
                                        {selectedStudent.status === 'online' ? 'Conectado agora' : 'Desconectado'}
                                    </span>
                                </div>
                            </div>
                            <div className="ml-auto flex items-center gap-4">
                                <div className="hidden xl:flex items-center gap-3 text-[9px] font-black uppercase tracking-[2px] text-slate-900 bg-slate-50 px-5 py-2.5 rounded-xl border border-slate-100">
                                    <GraduationCap size={16} className="text-[#1D5F31]" />
                                    {selectedStudent.course}
                                </div>
                            </div>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto px-8 md:px-12 py-10 space-y-10 bg-transparent custom-scrollbar">
                            {messages.map(msg => (
                                <div
                                    key={msg.id}
                                    className={`flex gap-5 ${msg.role === 'teacher' ? 'flex-row-reverse' : 'flex-row'} animate-in fade-in slide-in-from-bottom-4 duration-500`}
                                >
                                    {/* Avatar */}
                                    <div className={`w-10 h-10 rounded-full shrink-0 flex items-center justify-center font-black text-[10px] mt-1 shadow-sm ${msg.role === 'student' ? 'bg-slate-900 text-white' : 'bg-[#1D5F31] text-white border-2 border-white'}`}>
                                        {msg.role === 'student' ? selectedStudent.initials : 'EU'}
                                    </div>

                                    {/* Bubble */}
                                    <div className={`max-w-[70%] ${msg.role === 'teacher' ? 'items-end' : 'items-start'} flex flex-col gap-2.5`}>
                                        <div className={`px-8 py-5 rounded-[24px] text-sm font-medium leading-relaxed shadow-sm ${msg.role === 'student' ? 'bg-slate-50 border border-slate-100 text-slate-900 rounded-tl-none' : 'bg-slate-900 text-white rounded-tr-none'}`}>
                                            {msg.content}
                                        </div>
                                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 px-3">{msg.time}</span>
                                    </div>
                                </div>
                            ))}
                            <div ref={bottomRef} />
                        </div>

                        {/* Input Bar */}
                        <div className="px-10 py-8 border-t border-slate-50 bg-white/50 backdrop-blur-md">
                            <div className="flex items-end gap-5">
                                <button className="p-4 bg-slate-50 rounded-2xl text-slate-600 hover:text-[#1D5F31] transition-all active:scale-95 shadow-inner">
                                    <MessageSquare size={20} />
                                </button>
                                <div className="flex-1 bg-white border border-slate-200 rounded-[28px] flex items-end px-8 py-5 focus-within:border-[#1D5F31]/30 transition-all shadow-xl shadow-slate-100/50">
                                    <textarea
                                        value={input}
                                        onChange={e => setInput(e.target.value)}
                                        onKeyDown={handleKey}
                                        placeholder="Digite sua resposta aqui..."
                                        rows={1}
                                        className="flex-1 bg-transparent outline-none resize-none font-bold text-sm text-slate-900 placeholder:text-slate-600 placeholder:font-black max-h-40"
                                        style={{ lineHeight: '1.6' }}
                                    />
                                </div>
                                <button
                                    onClick={handleSend}
                                    disabled={!input.trim()}
                                    className="w-16 h-16 bg-[#1D5F31] text-white rounded-[24px] flex items-center justify-center hover:opacity-90 disabled:opacity-20 active:scale-95 transition-all shadow-xl shadow-[#1D5F31]/20 group shrink-0"
                                >
                                    <Send size={22} strokeWidth={3} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                                </button>
                            </div>
                            <p className="text-[10px] font-black uppercase tracking-[4px] text-center text-slate-500 mt-6 italic">PowerPlay Creator Ecosystem • Secure Mentorship</p>
                        </div>
                    </section>
                </div>
            </div>

            <style jsx>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(0,0,0,0.05);
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(0,0,0,0.1);
                }
            `}</style>
        </div>
    )
}