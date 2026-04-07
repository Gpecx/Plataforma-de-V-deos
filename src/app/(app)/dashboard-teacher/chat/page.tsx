"use client"

import { useState, useRef, useEffect, useCallback } from 'react'
import { ArrowLeft, Send, Search, Users, MessageSquare, GraduationCap, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { auth, db } from '@/lib/firebase'
import { collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp, getDocs, doc, getDoc, limit } from 'firebase/firestore'
import { useAuth } from '@/context/AuthProvider'
import { parseFirebaseDate } from '@/lib/date-utils'

interface ChatMessage {
    id: string
    role: 'teacher' | 'student'
    content: string
    time: string
    user_id: string
    teacher_id: string
}

interface Student {
    id: string
    name: string
    course: string
    initials: string
    lastMsg?: string
    status: 'online' | 'offline'
}

export default function TeacherChatPage() {
    const { user } = useAuth()
    const [students, setStudents] = useState<Student[]>([])
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
    const [messages, setMessages] = useState<ChatMessage[]>([])
    const [input, setInput] = useState('')
    const [loading, setLoading] = useState(true)
    const bottomRef = useRef<HTMLDivElement>(null)

    const scrollToBottom = useCallback(() => {
        if (bottomRef.current) {
            bottomRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
        }
    }, [])

    useEffect(() => {
        scrollToBottom()
    }, [messages, scrollToBottom])

    const formatTime = (date: any) => {
        const d = parseFirebaseDate(date)
        if (!d) return ''
        return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    }

    // Fetch Unique Students that have messaged this teacher
    useEffect(() => {
        if (!user) return

        const fetchStudents = async () => {
            setLoading(true)
            try {
                // To get "Conversas Ativas", we query the messages collection for this teacher
                // In a production app, a 'conversations' collection would be better
                const q = query(
                    collection(db, 'messages'),
                    where('teacher_id', '==', user.uid),
                    orderBy('created_at', 'desc')
                )

                const snapshot = await getDocs(q)
                const studentIdsSeen = new Set<string>()
                const mappedStudents: Student[] = []

                for (const msgDoc of snapshot.docs) {
                    const msgData = msgDoc.data()
                    const studentId = msgData.user_id

                    if (!studentIdsSeen.has(studentId)) {
                        studentIdsSeen.add(studentId)
                        // Fetch student profile
                        const profileDoc = await getDoc(doc(db, 'profiles', studentId))
                        if (profileDoc.exists()) {
                            const profileData = profileDoc.data()
                            mappedStudents.push({
                                id: studentId,
                                name: profileData.full_name || 'Aluno',
                                course: 'Treinamento Ativo', // Simplification or fetch from enrollments
                                initials: (profileData.full_name || 'A').split(' ').map((n: string) => n[0]).join('').toUpperCase().substring(0, 2),
                                status: 'online', // Mock status for now
                                lastMsg: msgData.content
                            })
                        }
                    }
                }

                setStudents(mappedStudents)
                if (mappedStudents.length > 0 && !selectedStudent) {
                    setSelectedStudent(mappedStudents[0])
                }
            } catch (error) {
                console.error("Erro ao carregar alunos:", error)
            } finally {
                setLoading(false)
            }
        }

        fetchStudents()
    }, [user])

    // Real-time messages for selected student
    useEffect(() => {
        if (!user || !selectedStudent) return

        const q = query(
            collection(db, 'messages'),
            where('user_id', '==', selectedStudent.id),
            where('teacher_id', '==', user.uid),
            orderBy('created_at', 'asc')
        )

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const msgs = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                time: formatTime(doc.data().created_at)
            })) as any[]
            setMessages(msgs)
        })

        return () => unsubscribe()
    }, [user, selectedStudent])

    const handleSend = async () => {
        const text = input.trim()
        if (!text || !user || !selectedStudent) return

        try {
            await addDoc(collection(db, 'messages'), {
                user_id: selectedStudent.id,
                teacher_id: user.uid,
                role: 'teacher',
                content: text,
                created_at: serverTimestamp()
            })
            setInput('')
        } catch (error) {
            console.error('Erro ao enviar:', error)
        }
    }

    const handleKey = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSend()
        }
    }

    if (loading && students.length === 0) {
        return (
            <div className="h-screen flex items-center justify-center bg-white">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="animate-spin text-black" size={48} />
                    <p className="text-xs font-bold uppercase tracking-widest text-black animate-pulse">
                        Carregando Conversas...
                    </p>
                </div>
            </div>
        )
    }

    return (
        <div className="h-[calc(100vh-40px)] bg-transparent flex flex-col overflow-hidden font-montserrat animate-in fade-in duration-500">
            <div className="max-w-full w-full mx-auto flex flex-col flex-1 pt-4 pb-2 px-4 gap-6 overflow-hidden">

                {/* Page Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <Link
                            href="/dashboard-teacher"
                            className="p-4 bg-white border border-black rounded-2xl hover:bg-black hover:text-white transition shadow-none active:scale-95"
                        >
                            <ArrowLeft size={20} />
                        </Link>
                        <div>
                            <div className="flex items-center gap-2 mb-1">

                            </div>
                            <h1 className="text-2xl font-bold tracking-tighter uppercase text-black leading-none max-w-xl">
                                Central de <span className="text-[#1D5F31]">Mensagens</span>
                            </h1>
                        </div>
                    </div>
                </div>

                <div className="flex flex-1 gap-8 overflow-hidden">
                    {/* Student List Sidebar */}
                    <aside className="w-80 shrink-0 hidden lg:flex flex-col gap-4 overflow-y-auto pr-2 custom-scrollbar">
                        <div className="text-[10px] font-bold uppercase tracking-[4px] text-black px-4 mb-2">CONVERSAS ATIVAS</div>
                        {students.length > 0 ? (
                            students.map(student => (
                                <button
                                    key={student.id}
                                    onClick={() => setSelectedStudent(student)}
                                    className={`flex items-center gap-5 p-6 rounded-[24px] border transition-all duration-300 group ${selectedStudent?.id === student.id ? 'bg-black border-black shadow-xl shadow-black/10' : 'bg-white border-black hover:border-black/50 hover:bg-gray-50'}`}
                                >
                                    <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-xs shrink-0 transition-all ${selectedStudent?.id === student.id ? 'bg-white text-black shadow-inner' : 'bg-black text-white'}`}>
                                        {student.initials}
                                    </div>
                                    <div className="min-w-0 text-left">
                                        <h4 className={`font-bold uppercase text-xs tracking-tight truncate mb-1 ${selectedStudent?.id === student.id ? 'text-white' : 'text-black'}`}>
                                            {student.name}
                                        </h4>
                                        <p className={`text-[9px] font-bold uppercase tracking-widest truncate  ${selectedStudent?.id === student.id ? 'text-white/70' : 'text-gray-500'}`}>{student.course}</p>
                                    </div>
                                </button>
                            ))
                        ) : (
                            <div className="p-8 bg-white border border-black rounded-[24px] text-center">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Nenhuma conversa encontrada</p>
                            </div>
                        )}
                    </aside>

                    {/* Chat Window */}
                    <section className="flex-1 flex flex-col bg-white border border-black rounded-[40px] overflow-hidden shadow-none mb-4 relative">
                        {selectedStudent ? (
                            <>
                                {/* Chat Header */}
                                <div className="flex items-center gap-6 px-10 py-6 border-b border-black/10 bg-white">
                                    <div className="w-12 h-12 rounded-full bg-black flex items-center justify-center text-white font-bold text-sm">
                                        {selectedStudent.initials}
                                    </div>
                                    <div>
                                        <h3 className="font-bold uppercase tracking-tighter text-lg text-black">{selectedStudent.name}</h3>
                                        <div className="flex items-center gap-2 mt-1">
                                            <div className={`w-1.5 h-1.5 rounded-full ${selectedStudent.status === 'online' ? 'bg-[#1D5F31]' : 'bg-gray-300'}`}></div>
                                            <span className={`text-[10px] font-bold uppercase tracking-[3px] ${selectedStudent.status === 'online' ? 'text-[#1D5F31]' : 'text-gray-500'}`}>
                                                {selectedStudent.status === 'online' ? 'Conectado agora' : 'Desconectado'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="ml-auto flex items-center gap-4">
                                        <div className="hidden xl:flex items-center gap-3 text-[9px] font-bold uppercase tracking-[2px] text-black bg-gray-50 px-5 py-2.5 rounded-xl border border-black">
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
                                            <div className={`w-10 h-10 rounded-full shrink-0 flex items-center justify-center font-bold text-[10px] mt-1 shadow-sm ${msg.role === 'student' ? 'bg-black text-white' : 'bg-[#1D5F31] text-white border-2 border-white'}`}>
                                                {msg.role === 'student' ? selectedStudent.initials : 'EU'}
                                            </div>

                                            {/* Bubble */}
                                            <div className={`max-w-[70%] ${msg.role === 'teacher' ? 'items-end' : 'items-start'} flex flex-col gap-2.5`}>
                                                <div className={`px-8 py-5 rounded-[24px] text-sm font-medium leading-relaxed ${msg.role === 'student' ? 'bg-white border border-black text-black rounded-tl-none shadow-none' : 'bg-black text-white rounded-tr-none shadow-none'}`}>
                                                    {msg.content}
                                                </div>
                                                <span className="text-[9px] font-bold uppercase tracking-widest text-gray-500 px-3">{msg.time}</span>
                                            </div>
                                        </div>
                                    ))}
                                    <div ref={bottomRef} />
                                </div>

                                {/* Input Bar */}
                                <div className="px-10 py-8 border-t border-black/10 bg-white">
                                    <div className="flex items-end gap-5">
                                        <button className="p-4 bg-gray-50 border border-black rounded-2xl text-black hover:bg-black hover:text-white transition-all active:scale-95">
                                            <MessageSquare size={20} />
                                        </button>
                                        <div className="flex-1 bg-white border border-black rounded-[28px] flex items-end px-8 py-5 focus-within:ring-2 ring-black/5 transition-all">
                                            <textarea
                                                value={input}
                                                onChange={e => setInput(e.target.value)}
                                                onKeyDown={handleKey}
                                                placeholder="Digite sua resposta aqui..."
                                                rows={1}
                                                className="flex-1 bg-transparent outline-none resize-none font-bold text-sm text-black placeholder:text-gray-400 placeholder:font-bold max-h-40"
                                                style={{ lineHeight: '1.6' }}
                                            />
                                        </div>
                                        <button
                                            onClick={handleSend}
                                            disabled={!input.trim()}
                                            className="w-16 h-16 bg-black text-white rounded-[24px] flex items-center justify-center hover:bg-gray-900 disabled:opacity-20 active:scale-95 transition-all shadow-none group shrink-0"
                                        >
                                            <Send size={22} strokeWidth={3} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                                        </button>
                                    </div>
                                    <p className="text-[10px] font-bold uppercase tracking-[4px] text-center text-gray-400 mt-6 ">PowerPlay Creator Ecosystem • Secure Mentorship</p>
                                </div>
                            </>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-center p-20 space-y-6">
                                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center border border-black text-black/20">
                                    <Users size={32} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold uppercase tracking-tighter text-black">Selecione uma Mentoria</h3>
                                    <p className="text-[11px] font-bold uppercase tracking-[3px] text-gray-400 mt-2 ">Aguardando interação com aluno real</p>
                                </div>
                            </div>
                        )}
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
                    background: rgba(0,0,0,0.1);
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(0,0,0,0.2);
                }
            `}</style>
        </div>
    )
}