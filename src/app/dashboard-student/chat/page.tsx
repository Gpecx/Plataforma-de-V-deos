"use client"

import { useState, useRef, useEffect, useCallback } from 'react'
import { ArrowLeft, Send, Paperclip, BookOpen, GraduationCap, MessageSquare, Users } from 'lucide-react'
import Link from 'next/link'
import { auth, db } from '@/lib/firebase'
import { collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp, getDocs, doc, getDoc } from 'firebase/firestore'
import { onAuthStateChanged } from 'firebase/auth'
import { getPublicProfile } from '@/app/actions/profile'
import { parseFirebaseDate } from '@/lib/date-utils'

interface ChatMessage {
    id: string
    role: 'student' | 'teacher'
    content: string
    time: string
    user_id: string
    teacher_id: string
}

interface Teacher {
    id: string
    name: string
    course: string
    initials: string
}

export default function StudentChatPage() {
    const [user, setUser] = useState<any>(null)
    const [teachers, setTeachers] = useState<Teacher[]>([])
    const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null)
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

    // 1. Initial Load: User & Teachers
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
            if (!authUser) {
                setLoading(false)
                return
            }
            setUser(authUser)
            setLoading(true)

            try {
                // Fetch enrollments
                const enrollRef = collection(db, 'enrollments')
                const q = query(enrollRef, where('user_id', '==', authUser.uid))
                const enrollSnapshot = await getDocs(q)

                const mappedTeachers: Teacher[] = []
                const teacherIdsSeen = new Set<string>()

                for (const enrollDoc of enrollSnapshot.docs) {
                    const enrollData = enrollDoc.data()
                    const courseId = enrollData.course_id

                    const courseDoc = await getDoc(doc(db, 'courses', courseId))
                    if (courseDoc.exists()) {
                        const courseData = courseDoc.data()
                        const teacherId = courseData.teacher_id

                        if (!teacherIdsSeen.has(teacherId)) {
                            const teacherData = await getPublicProfile(teacherId)
                            if (teacherData) {
                                mappedTeachers.push({
                                    id: teacherId,
                                    name: teacherData.full_name,
                                    course: courseData.title,
                                    initials: teacherData.full_name.split(' ').map((n: string) => n[0]).join('').toUpperCase().substring(0, 2)
                                })
                                teacherIdsSeen.add(teacherId)
                            }
                        }
                    }
                }

                setTeachers(mappedTeachers)
                if (mappedTeachers.length > 0) {
                    setSelectedTeacher(mappedTeachers[0])
                }
            } catch (error) {
                console.error("Erro ao carregar professores:", error)
            } finally {
                setLoading(false)
            }
        })

        return () => unsubscribe()
    }, [])

    // 2. Fetch Messages when teacher changes (using onSnapshot)
    useEffect(() => {
        if (!user || !selectedTeacher) return

        const q = query(
            collection(db, 'messages'),
            where('user_id', '==', user.uid),
            where('teacher_id', '==', selectedTeacher.id),
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
    }, [user, selectedTeacher])

    const handleSend = async () => {
        const text = input.trim()
        if (!text || !user || !selectedTeacher) return

        try {
            await addDoc(collection(db, 'messages'), {
                user_id: user.uid,
                teacher_id: selectedTeacher.id,
                role: 'student',
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

    if (loading) {
        return (
            <div className="h-screen flex items-center justify-center bg-[#F8FAFC]">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-[#00C402] border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-[10px] font-black uppercase tracking-[4px] text-slate-400">Iniciando Suporserver SPCS...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="h-[calc(100vh-20px)] bg-[#F8FAFC] flex flex-col overflow-hidden">
            <div className="max-w-full w-full mx-auto flex flex-col flex-1 pt-0 pb-1 px-2 gap-1 overflow-hidden">

                {/* Page Header */}
                <div className="flex items-center justify-between mt-0 scale-90 origin-left">
                    <div className="flex items-center gap-4">
                        <Link
                            href="/dashboard-student"
                            className="p-3 bg-white border-2 border-slate-100 rounded-2xl hover:border-black text-black transition shadow-sm"
                        >
                            <ArrowLeft size={20} />
                        </Link>
                        <div>
                            <h1 className="text-2xl font-black tracking-tighter uppercase text-black">
                                SUPORTE <span className="text-[#00C402]">ESPECIALIZADO</span>
                            </h1>
                            <p className="text-[9px] font-black uppercase tracking-[4px] text-black mt-0.5">Tira-dúvidas em tempo real com seus mentores</p>
                        </div>
                    </div>
                </div>

                <div className="flex flex-1 gap-4 overflow-hidden">
                    {/* Teacher List Sidebar */}
                    <aside className="w-64 shrink-0 hidden md:flex flex-col gap-3 overflow-y-auto pr-2 custom-scrollbar">
                        <div className="text-[9px] font-black uppercase tracking-[3px] text-black px-2 mb-1">CANAIS DE ATENDIMENTO</div>
                        {teachers.length > 0 ? (
                            teachers.map(teacher => (
                                <button
                                    key={`${teacher.id}-${teacher.course}`}
                                    onClick={() => setSelectedTeacher(teacher)}
                                    className={`flex items-center gap-4 p-5 rounded-3xl border-2 text-left transition-all ${selectedTeacher?.id === teacher.id && selectedTeacher?.course === teacher.course ? 'bg-white border-black shadow-md ring-1 ring-black/5' : 'bg-white/50 border-slate-100 hover:border-black/20'}`}
                                >
                                    <div className={`w-11 h-11 rounded-2xl flex items-center justify-center font-black text-xs shrink-0 ${selectedTeacher?.id === teacher.id ? 'bg-black text-white' : 'bg-slate-100 text-black'}`}>
                                        {teacher.initials}
                                    </div>
                                    <div className="min-w-0">
                                        <h4 className={`font-black uppercase text-[11px] tracking-tight truncate ${selectedTeacher?.id === teacher.id ? 'text-black' : 'text-slate-900'}`}>
                                            {teacher.name}
                                        </h4>
                                        <div className="flex items-center gap-1.5 mt-1">
                                            <BookOpen size={10} className="text-[#00C402] shrink-0" />
                                            <p className="text-[9px] font-bold uppercase tracking-wide text-slate-900 truncate italic">{teacher.course}</p>
                                        </div>
                                    </div>
                                </button>
                            ))
                        ) : (
                            <div className="p-6 bg-white/50 border-2 border-dashed border-slate-200 rounded-[32px] text-center">
                                <p className="text-[10px] font-black uppercase tracking-[2px] text-slate-400">Você ainda não tem cursos ativos para suporte.</p>
                                <Link href="/dashboard-student" className="inline-block mt-4 text-[9px] font-black uppercase tracking-widest text-[#00C402] hover:underline">Ver Cursos</Link>
                            </div>
                        )}
                    </aside>

                    {/* Chat Window */}
                    <section className="flex-1 flex flex-col bg-white border-2 border-slate-100 rounded-[32px] overflow-hidden shadow-2xl mb-2">
                        {selectedTeacher ? (
                            <>
                                {/* Chat Header */}
                                <div className="flex items-center gap-5 px-8 py-5 border-b-2 border-slate-50 bg-slate-50/10">
                                    <div className="w-11 h-11 rounded-2xl bg-black flex items-center justify-center text-white font-black text-sm shadow-sm">
                                        {selectedTeacher.initials}
                                    </div>
                                    <div>
                                        <h3 className="font-black uppercase tracking-tighter text-base text-black">{selectedTeacher.name}</h3>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <div className="w-1.5 h-1.5 rounded-full bg-[#00C402]"></div>
                                            <span className="text-[9px] font-black uppercase tracking-[3px] text-[#00C402]">Canal Online · Mentoria Ativa</span>
                                        </div>
                                    </div>
                                    <div className="ml-auto">
                                        <div className="hidden lg:flex items-center gap-2 text-[8px] font-black uppercase tracking-[2px] text-black border-2 border-black/5 px-4 py-2 rounded-full">
                                            <GraduationCap size={12} className="text-[#00C402]" />
                                            {selectedTeacher.course}
                                        </div>
                                    </div>
                                </div>

                                {/* Messages */}
                                <div className="flex-1 overflow-y-auto px-6 md:px-10 py-8 space-y-8 bg-white/50 custom-scrollbar">
                                    {messages.length > 0 ? (
                                        messages.map(msg => (
                                            <div
                                                key={msg.id}
                                                className={`flex gap-4 ${msg.role === 'student' ? 'flex-row-reverse' : 'flex-row'} animate-in fade-in slide-in-from-bottom-2 duration-300`}
                                            >
                                                <div className={`w-8 h-8 rounded-xl shrink-0 flex items-center justify-center font-black text-[9px] mt-1 ${msg.role === 'teacher' ? 'bg-slate-100 text-black border border-slate-200' : 'bg-black text-white'}`}>
                                                    {msg.role === 'teacher' ? selectedTeacher.initials : 'EU'}
                                                </div>

                                                <div className={`max-w-[75%] ${msg.role === 'student' ? 'items-end' : 'items-start'} flex flex-col gap-1.5`}>
                                                    <div className={`px-6 py-4 rounded-3xl text-[13px] md:text-sm font-bold leading-relaxed shadow-sm ${msg.role === 'teacher' ? 'bg-slate-50 border-2 border-slate-100 text-black rounded-tl-none' : 'bg-black text-white rounded-tr-none'}`}>
                                                        {msg.content}
                                                    </div>
                                                    <span className="text-[8px] font-black uppercase tracking-widest text-slate-500 px-2">{msg.time}</span>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="h-full flex flex-col items-center justify-center text-center p-12 space-y-4">
                                            <div className="w-20 h-20 bg-slate-50 rounded-[32px] flex items-center justify-center text-[#00C402] shadow-inner mb-2">
                                                <MessageSquare size={32} />
                                            </div>
                                            <h3 className="text-xl font-black uppercase tracking-tighter text-slate-800">Inicie uma conversa</h3>
                                            <p className="text-xs text-slate-400 font-bold leading-relaxed max-w-xs uppercase tracking-widest">Tire suas dúvidas agora com o {selectedTeacher.name}. O conhecimento não espera, guerreiro!</p>
                                        </div>
                                    )}
                                    <div ref={bottomRef} />
                                </div>

                                {/* Input Bar */}
                                <div className="px-6 md:px-8 py-6 border-t-2 border-slate-50 bg-slate-50/30">
                                    <div className="flex items-end gap-3 md:gap-5">
                                        <button className="p-3 text-black hover:scale-110 transition shrink-0">
                                            <Paperclip size={20} />
                                        </button>
                                        <div className="flex-1 bg-white border-2 border-slate-100 rounded-3xl flex items-end px-6 py-4 focus-within:border-black transition shadow-sm">
                                            <textarea
                                                value={input}
                                                onChange={e => setInput(e.target.value)}
                                                onKeyDown={handleKey}
                                                placeholder="Digite sua dúvida aqui..."
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
                                    <p className="text-[8px] font-black uppercase tracking-[3px] text-center text-slate-400 mt-4">Sua conversa é protegida por criptografia SPCS Shield</p>
                                </div>
                            </>
                        ) : (
                            <div className="flex-1 flex items-center justify-center p-12 text-center">
                                <div className="space-y-6">
                                    <div className="w-24 h-24 bg-slate-50 rounded-[40px] flex items-center justify-center text-slate-200 mx-auto shadow-inner">
                                        <Users size={40} />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-black uppercase tracking-tighter text-slate-800">Selecione um Mentor</h3>
                                        <p className="text-xs text-slate-400 font-bold mt-2 uppercase tracking-widest leading-relaxed">Seus mentores aparecerão aqui conforme você avança em seus cursos.</p>
                                    </div>
                                </div>
                            </div>
                        )}
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
