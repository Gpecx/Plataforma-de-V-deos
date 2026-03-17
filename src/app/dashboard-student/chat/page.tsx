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

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
            if (!authUser) {
                setLoading(false)
                return
            }
            setUser(authUser)
            setLoading(true)

            try {
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
            <div className="h-screen flex items-center justify-center bg-transparent">
                <div className="flex flex-col items-center gap-4">
                    {/* A alteração deve ser aqui, voltando para rounded-full */}
                    <div className="w-12 h-12 border-4 border-[#1D5F31] border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-[10px] font-black uppercase tracking-[4px] text-slate-400">Iniciando Suporserver PowerPlay...</p>
                </div>
            </div>
        )
    }
    return (
        <div className="h-[calc(100vh-20px)] bg-[#061629] flex flex-col overflow-hidden">
            <div className="max-w-full w-full mx-auto flex flex-col flex-1 pt-0 pb-1 px-2 gap-1 overflow-hidden">

                <div className="flex items-center justify-between mt-0 scale-90 origin-left">
                    <div className="flex items-center gap-4">
                        <Link
                            href="/dashboard-student"
                            className="p-3 bg-[#061629] border-2 border-[#1D5F31] rounded-none hover:border-[#1D5F31] text-white transition shadow-sm"
                        >
                            <ArrowLeft size={20} />
                        </Link>
                        <div>
                            <h1 className="text-2xl font-black tracking-tighter uppercase text-white">
                                SUPORTE <span className="text-[#1D5F31]">ESPECIALIZADO</span>
                            </h1>
                            <p className="text-[9px] font-black uppercase tracking-[4px] text-slate-400 mt-0.5">Tira-dúvidas em tempo real com seus mentores</p>
                        </div>
                    </div>
                </div>

                <div className="flex flex-1 gap-4 overflow-hidden">
                    <aside className="w-64 shrink-0 hidden md:flex flex-col gap-3 overflow-y-auto pr-2 custom-scrollbar">
                        <div className="text-[9px] font-black uppercase tracking-[3px] text-slate-400 px-2 mb-1">CANAIS DE ATENDIMENTO</div>
                        {teachers.length > 0 ? (
                            teachers.map(teacher => (
                                <button
                                    key={`${teacher.id}-${teacher.course}`}
                                    onClick={() => setSelectedTeacher(teacher)}
                                    className={`flex items-center gap-4 p-5 rounded-none border-2 text-left transition-all ${selectedTeacher?.id === teacher.id && selectedTeacher?.course === teacher.course ? 'bg-[#1D5F31]/20 border-[#1D5F31] shadow-md ring-1 ring-[#1D5F31]/5' : 'bg-[#061629]/50 border-[#1D5F31] hover:border-[#1D5F31]/20'}`}
                                >
                                    <div className={`w-11 h-11 rounded-none flex items-center justify-center font-black text-xs shrink-0 ${selectedTeacher?.id === teacher.id ? 'bg-[#1D5F31] text-white' : 'bg-[#1D5F31] text-slate-300'}`}>
                                        {teacher.initials}
                                    </div>
                                    <div className="min-w-0">
                                        <h4 className={`font-black uppercase text-[11px] tracking-tight truncate ${selectedTeacher?.id === teacher.id ? 'text-white' : 'text-slate-400'}`}>
                                            {teacher.name}
                                        </h4>
                                        <div className="flex items-center gap-1.5 mt-1">
                                            <BookOpen size={10} className="text-[#1D5F31] shrink-0" />
                                            <p className="text-[9px] font-bold uppercase tracking-wide text-slate-500 truncate italic">{teacher.course}</p>
                                        </div>
                                    </div>
                                </button>
                            ))
                        ) : (
                            <div className="p-6 bg-[#061629]/50 border-2 border-dashed border-[#1D5F31] rounded-none text-center">
                                <p className="text-[10px] font-black uppercase tracking-[2px] text-slate-500">Você ainda não tem cursos ativos para suporte.</p>
                                <Link href="/dashboard-student" className="inline-block mt-4 text-[9px] font-black uppercase tracking-widest text-[#1D5F31] hover:underline">Ver Cursos</Link>
                            </div>
                        )}
                    </aside>

                    <section className="flex-1 flex flex-col bg-[#061629] border-2 border-[#1D5F31] rounded-none overflow-hidden shadow-2xl mb-2">
                        {selectedTeacher ? (
                            <>
                                <div className="flex items-center gap-5 px-8 py-5 border-b-2 border-[#1D5F31] bg-[#061629]/50">
                                    <div className="w-11 h-11 rounded-none bg-[#1D5F31] flex items-center justify-center text-white font-black text-sm shadow-sm border border-[#1D5F31]/20">
                                        {selectedTeacher.initials}
                                    </div>
                                    <div>
                                        <h3 className="font-black uppercase tracking-tighter text-base text-white">{selectedTeacher.name}</h3>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <div className="w-1.5 h-1.5 rounded-none bg-[#1D5F31]"></div>
                                            <span className="text-[9px] font-black uppercase tracking-[3px] text-[#1D5F31]">Canal Online · Mentoria Ativa</span>
                                        </div>
                                    </div>
                                    <div className="ml-auto">
                                        <div className="hidden lg:flex items-center gap-2 text-[8px] font-black uppercase tracking-[2px] text-slate-300 border-2 border-[#1D5F31] px-4 py-2 rounded-none bg-[#1D5F31]/20">
                                            <GraduationCap size={12} className="text-[#1D5F31]" />
                                            {selectedTeacher.course}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex-1 overflow-y-auto px-6 md:px-10 py-8 space-y-8 bg-[#061629]/30 custom-scrollbar">
                                    {messages.length > 0 ? (
                                        messages.map(msg => (
                                            <div
                                                key={msg.id}
                                                className={`flex gap-4 ${msg.role === 'student' ? 'flex-row-reverse' : 'flex-row'} animate-in fade-in slide-in-from-bottom-2 duration-300`}
                                            >
                                                <div className={`w-8 h-8 rounded-none shrink-0 flex items-center justify-center font-black text-[9px] mt-1 ${msg.role === 'teacher' ? 'bg-[#1D5F31] text-white border border-[#1D5F31]/20' : 'bg-[#1D5F31] text-white'}`}>
                                                    {msg.role === 'teacher' ? selectedTeacher.initials : 'EU'}
                                                </div>

                                                <div className={`max-w-[75%] ${msg.role === 'student' ? 'items-end' : 'items-start'} flex flex-col gap-1.5`}>
                                                    <div className={`px-6 py-4 rounded-none text-[13px] md:text-sm font-bold leading-relaxed shadow-sm ${msg.role === 'teacher' ? 'bg-[#1D5F31]/40 border-2 border-[#1D5F31] text-white' : 'bg-[#1D5F31] text-white'}`}>
                                                        {msg.content}
                                                    </div>
                                                    <span className="text-[8px] font-black uppercase tracking-widest text-slate-500 px-2">{msg.time}</span>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="h-full flex flex-col items-center justify-center text-center p-12 space-y-4">
                                            <div className="w-20 h-20 bg-[#1D5F31]/20 rounded-none flex items-center justify-center text-[#1D5F31] shadow-inner mb-2 border border-[#1D5F31]">
                                                <MessageSquare size={32} />
                                            </div>
                                            <h3 className="text-xl font-black uppercase tracking-tighter text-white">Inicie uma conversa</h3>
                                            <p className="text-xs text-slate-400 font-bold leading-relaxed max-w-xs uppercase tracking-widest">Tire suas dúvidas agora com o {selectedTeacher.name}. O conhecimento não espera, guerreiro!</p>
                                        </div>
                                    )}
                                    <div ref={bottomRef} />
                                </div>

                                <div className="px-6 md:px-8 py-6 border-t-2 border-[#1D5F31] bg-[#061629]/80">
                                    <div className="flex items-end gap-3 md:gap-5">
                                        <button className="p-3 text-slate-400 hover:text-[#1D5F31] hover:scale-110 transition shrink-0">
                                            <Paperclip size={20} />
                                        </button>
                                        <div className="flex-1 bg-[#1D5F31]/20 border-2 border-[#1D5F31] rounded-none flex items-end px-6 py-4 focus-within:border-[#1D5F31]/50 transition shadow-sm">
                                            <textarea
                                                value={input}
                                                onChange={e => setInput(e.target.value)}
                                                onKeyDown={handleKey}
                                                placeholder="Digite sua dúvida aqui..."
                                                rows={2}
                                                className="flex-1 bg-transparent outline-none resize-none font-bold text-sm text-white placeholder:text-slate-600 placeholder:font-black max-h-40"
                                                style={{ lineHeight: '1.6' }}
                                            />
                                        </div>
                                        <button
                                            onClick={handleSend}
                                            disabled={!input.trim()}
                                            className="w-14 h-14 bg-[#1D5F31] text-white rounded-none flex items-center justify-center hover:bg-[#28b828] disabled:opacity-20 active:scale-95 transition-all shadow-xl shrink-0 group"
                                        >
                                            <Send size={20} strokeWidth={2.5} className="group-hover:rotate-12 transition-transform" />
                                        </button>
                                    </div>
                                    <p className="text-[8px] font-black uppercase tracking-[3px] text-center text-slate-400 mt-4">Sua conversa é protegida por criptografia PowerPlay Shield</p>
                                </div>
                            </>
                        ) : (
                            <div className="flex-1 flex items-center justify-center p-12 text-center">
                                <div className="space-y-6">
                                    <div className="w-24 h-24 bg-[#1D5F31]/20 rounded-none flex items-center justify-center text-slate-700 mx-auto shadow-inner border border-[#1D5F31]">
                                        <Users size={40} />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-black uppercase tracking-tighter text-white">Selecione um Mentor</h3>
                                        <p className="text-xs text-slate-500 font-bold mt-2 uppercase tracking-widest leading-relaxed">Seus mentores aparecerão aqui conforme você avança em seus cursos.</p>
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
                    background: #1D5F31;
                    border-radius: 0px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #1D5F31;
                }
            `}</style>
        </div>
    )
}