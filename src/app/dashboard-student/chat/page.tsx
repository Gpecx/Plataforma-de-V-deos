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
                    <p className="text-[10px] font-black uppercase tracking-[4px] text-slate-500">Iniciando Suporserver PowerPlay...</p>
                </div>
            </div>
        )
    }
    return (
        <div className="h-[calc(100vh-120px)] bg-slate-50 flex flex-col overflow-hidden">
            <div className="max-w-full w-full mx-auto flex flex-col flex-1 pt-0 pb-1 px-2 gap-4 overflow-hidden">

                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-4">
                        <Link
                            href="/dashboard-student"
                            className="p-3 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600 transition shadow-sm"
                        >
                            <ArrowLeft size={20} />
                        </Link>
                        <div>
                            <h1 className="text-2xl font-black tracking-tighter uppercase text-slate-900">
                                SUPORTE <span className="text-[#1D5F31]">ESPECIALIZADO</span>
                            </h1>
                            <p className="text-[9px] font-black uppercase tracking-[4px] text-slate-500 mt-0.5">Tira-dúvidas em tempo real com seus mentores</p>
                        </div>
                    </div>
                </div>

                <div className="flex flex-1 gap-6 overflow-hidden">
                    <aside className="w-72 shrink-0 hidden md:flex flex-col gap-3 overflow-y-auto pr-2 custom-scrollbar">
                        <div className="text-[9px] font-black uppercase tracking-[3px] text-slate-500 px-2 mb-1">CANAIS DE ATENDIMENTO</div>
                        {teachers.length > 0 ? (
                            teachers.map(teacher => (
                                <button
                                    key={`${teacher.id}-${teacher.course}`}
                                    onClick={() => setSelectedTeacher(teacher)}
                                    className={`flex items-center gap-4 p-5 rounded-xl border transition-all ${selectedTeacher?.id === teacher.id && selectedTeacher?.course === teacher.course ? 'bg-white border-[#1D5F31] shadow-md ring-1 ring-[#1D5F31]/5' : 'bg-white border-slate-200 hover:border-slate-300'}`}
                                >
                                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${selectedTeacher?.id === teacher.id ? 'bg-[#1D5F31] text-white' : 'bg-slate-100 text-slate-500'}`}>
                                        {teacher.initials}
                                    </div>
                                    <div className="min-w-0">
                                        <h4 className={`font-black uppercase text-[11px] tracking-tight truncate ${selectedTeacher?.id === teacher.id ? 'text-slate-900' : 'text-slate-600'}`}>
                                            {teacher.name}
                                        </h4>
                                        <div className="flex items-center gap-1.5 mt-1">
                                            <BookOpen size={10} className="text-[#1D5F31] shrink-0" />
                                            <p className="text-[9px] font-bold uppercase tracking-wide text-slate-600 truncate italic">{teacher.course}</p>
                                        </div>
                                    </div>
                                </button>
                            ))
                        ) : (
                            <div className="p-6 bg-white border border-dashed border-slate-200 rounded-xl text-center">
                                <p className="text-[10px] font-black uppercase tracking-[2px] text-slate-600">Você ainda não tem cursos ativos para suporte.</p>
                                <Link href="/dashboard-student" className="inline-block mt-4 text-[9px] font-black uppercase tracking-widest text-[#1D5F31] hover:underline">Ver Cursos</Link>
                            </div>
                        )}
                    </aside>

                    <section className="flex-1 flex flex-col bg-white border border-slate-200 rounded-[32px] overflow-hidden shadow-sm mb-2">
                        {selectedTeacher ? (
                            <>
                                <div className="flex items-center gap-5 px-8 py-5 border-b border-slate-100 bg-white">
                                    <div className="w-11 h-11 rounded-xl bg-slate-50 flex items-center justify-center text-[#1D5F31] font-black text-sm shadow-sm border border-slate-100">
                                        {selectedTeacher.initials}
                                    </div>
                                    <div>
                                        <h3 className="font-black uppercase tracking-tighter text-base text-slate-900">{selectedTeacher.name}</h3>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <div className="w-1.5 h-1.5 rounded-full bg-[#1D5F31]"></div>
                                            <span className="text-[9px] font-black uppercase tracking-[3px] text-[#1D5F31]">Canal Online · Mentoria Ativa</span>
                                        </div>
                                    </div>
                                    <div className="ml-auto">
                                        <div className="hidden lg:flex items-center gap-2 text-[8px] font-black uppercase tracking-[2px] text-slate-500 border border-slate-100 px-4 py-2 rounded-xl bg-slate-50">
                                            <GraduationCap size={12} className="text-[#1D5F31]" />
                                            {selectedTeacher.course}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex-1 overflow-y-auto px-6 md:px-10 py-8 space-y-8 bg-slate-50/30 custom-scrollbar">
                                    {messages.length > 0 ? (
                                        messages.map(msg => (
                                            <div
                                                key={msg.id}
                                                className={`flex gap-4 ${msg.role === 'student' ? 'flex-row-reverse' : 'flex-row'} animate-in fade-in slide-in-from-bottom-2 duration-300`}
                                            >
                                                <div className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center font-black text-[9px] mt-1 ${msg.role === 'teacher' ? 'bg-[#1D5F31] text-white' : 'bg-slate-200 text-slate-600'}`}>
                                                    {msg.role === 'teacher' ? selectedTeacher.initials : 'EU'}
                                                </div>

                                                <div className={`max-w-[75%] ${msg.role === 'student' ? 'items-end' : 'items-start'} flex flex-col gap-1.5`}>
                                                    <div className={`px-6 py-4 rounded-2xl text-[13px] md:text-sm font-medium leading-relaxed shadow-sm ${msg.role === 'teacher' ? 'bg-white border border-slate-100 text-slate-800' : 'bg-[#1D5F31] text-white'}`}>
                                                        {msg.content}
                                                    </div>
                                                    <span className="text-[8px] font-black uppercase tracking-widest text-slate-500 px-2">{msg.time}</span>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="h-full flex flex-col items-center justify-center text-center p-12 space-y-4">
                                            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center text-slate-300 shadow-inner mb-2 border border-slate-200">
                                                <MessageSquare size={32} />
                                            </div>
                                            <h3 className="text-xl font-black uppercase tracking-tighter text-slate-900">Inicie uma conversa</h3>
                                            <p className="text-xs text-slate-600 font-bold leading-relaxed max-w-xs uppercase tracking-widest">Tire suas dúvidas agora com o {selectedTeacher.name}. O conhecimento não espera!</p>
                                        </div>
                                    )}
                                    <div ref={bottomRef} />
                                </div>

                                <div className="px-6 md:px-8 py-6 border-t border-slate-100 bg-white">
                                    <div className="flex items-end gap-3 md:gap-5">
                                        <button className="p-3 text-slate-400 hover:text-[#1D5F31] transition shrink-0">
                                            <Paperclip size={20} />
                                        </button>
                                        <div className="flex-1 bg-slate-50 border border-slate-200 rounded-xl flex items-end px-6 py-4 focus-within:border-[#1D5F31] transition shadow-sm">
                                            <textarea
                                                value={input}
                                                onChange={e => setInput(e.target.value)}
                                                onKeyDown={handleKey}
                                                placeholder="Digite sua dúvida aqui..."
                                                rows={2}
                                                className="flex-1 bg-transparent outline-none resize-none font-medium text-sm text-slate-900 placeholder:text-slate-400 placeholder:font-bold max-h-40"
                                                style={{ lineHeight: '1.6' }}
                                            />
                                        </div>
                                        <button
                                            onClick={handleSend}
                                            disabled={!input.trim()}
                                            className="w-14 h-14 bg-[#1D5F31] text-white rounded-xl flex items-center justify-center hover:opacity-90 disabled:opacity-20 transition-all shadow-md shrink-0 group"
                                        >
                                            <Send size={20} strokeWidth={2.5} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                                        </button>
                                    </div>
                                    <p className="text-[8px] font-black uppercase tracking-[3px] text-center text-slate-500 mt-4">Sua conversa é protegida por criptografia PowerPlay Shield</p>
                                </div>
                            </>
                        ) : (
                            <div className="flex-1 flex items-center justify-center p-12 text-center">
                                <div className="space-y-6">
                                    <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mx-auto shadow-inner border border-slate-100">
                                        <Users size={40} />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-black uppercase tracking-tighter text-slate-900">Selecione um Mentor</h3>
                                        <p className="text-xs text-slate-600 font-bold mt-2 uppercase tracking-widest leading-relaxed">Seus mentores aparecerão aqui conforme você avança em seus cursos.</p>
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