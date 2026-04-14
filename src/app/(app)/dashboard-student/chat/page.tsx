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
            <div className="h-screen flex items-center justify-center bg-white">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-[#1d5f31] border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-xs font-medium text-[#061629] animate-pulse">Carregando suporte...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="h-[calc(100vh-120px)] bg-white flex flex-col overflow-hidden font-sans">
            <div className="max-w-full w-full mx-auto flex flex-col flex-1 pt-4 pb-4 px-6 gap-6 overflow-hidden">

                {/* Header Simples */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link
                            href="/dashboard-student"
                            className="p-2 text-[#061629] hover:bg-[#F1F3F4] rounded-lg transition-colors border border-[#D1D7DC]"
                        >
                            <ArrowLeft size={18} />
                        </Link>
                        <div>
                            <h1 className="text-xl font-bold text-[#061629]">Suporte ao Aluno</h1>
                            <p className="text-sm text-gray-500 font-normal">Fale diretamente com seus mentores</p>
                        </div>
                    </div>
                </div>

                <div className="flex flex-1 gap-6 overflow-hidden">
                    {/* Sidebar de Mentores */}
                    <aside className="w-80 shrink-0 hidden md:flex flex-col gap-4 overflow-y-auto pr-2 custom-scrollbar-premium">
                        <div className="text-[11px] font-bold uppercase tracking-wider text-gray-400 px-2">Meus Mentores</div>
                        {teachers.length > 0 ? (
                            teachers.map(teacher => (
                                <button
                                    key={`${teacher.id}-${teacher.course}`}
                                    onClick={() => setSelectedTeacher(teacher)}
                                    className={`group flex items-center gap-4 p-4 rounded-lg border transition-all text-left ${selectedTeacher?.id === teacher.id && selectedTeacher?.course === teacher.course 
                                        ? 'bg-white border-[#D1D7DC] border-l-4 border-l-[#1d5f31]' 
                                        : 'bg-white border-[#D1D7DC] hover:bg-[#F1F3F4]'}`}
                                >
                                    <div className="relative shrink-0">
                                        <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm ${selectedTeacher?.id === teacher.id ? 'bg-[#1d5f31] text-white' : 'bg-[#F1F3F4] text-[#061629]'}`}>
                                            {teacher.initials}
                                        </div>
                                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-[#00C402] border-2 border-white rounded-full"></div>
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <h4 className="font-bold text-sm text-[#061629] truncate">{teacher.name}</h4>
                                        <p className="text-xs text-gray-500 truncate mt-0.5">{teacher.course}</p>
                                    </div>
                                </button>
                            ))
                        ) : (
                            <div className="p-8 bg-white border border-[#D1D7DC] rounded-lg text-center">
                                <p className="text-sm text-gray-500">Nenhum mentor disponível no momento.</p>
                                <Link href="/dashboard-student" className="inline-block mt-4 text-xs font-bold text-[#1d5f31] hover:underline">Explorar Cursos</Link>
                            </div>
                        )}
                    </aside>

                    {/* Área de Chat Principal */}
                    <section className="flex-1 flex flex-col bg-white border border-[#D1D7DC] rounded-xl overflow-hidden shadow-none">
                        {selectedTeacher ? (
                            <>
                                {/* Chat Header */}
                                <div className="flex items-center gap-4 px-8 py-4 border-b border-[#D1D7DC] bg-white">
                                    <div className="relative">
                                        <div className="w-10 h-10 rounded-full bg-[#F1F3F4] flex items-center justify-center text-[#1d5f31] font-bold text-sm border border-[#D1D7DC]">
                                            {selectedTeacher.initials}
                                        </div>
                                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-[#00C402] border-2 border-white rounded-full"></div>
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-[#061629] text-base">{selectedTeacher.name}</h3>
                                        <span className="text-[10px] font-medium text-[#00C402] uppercase tracking-[1px]">Online • Mentor Disponível</span>
                                    </div>
                                    <div className="ml-auto hidden lg:block">
                                        <div className="text-[11px] font-medium text-gray-500 py-1.5 px-3 rounded-full bg-[#F1F3F4] border border-[#D1D7DC]">
                                            {selectedTeacher.course}
                                        </div>
                                    </div>
                                </div>

                                {/* Mensagens */}
                                <div className="flex-1 overflow-y-auto px-8 py-10 space-y-6 bg-white custom-scrollbar-premium">
                                    {messages.length > 0 ? (
                                        messages.map(msg => (
                                            <div
                                                key={msg.id}
                                                className={`flex flex-col ${msg.role === 'student' ? 'items-end' : 'items-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}
                                            >
                                                <div className={`max-w-[70%] flex flex-col gap-1`}>
                                                    <div className={`px-5 py-3.5 rounded-2xl text-[14px] leading-relaxed ${
                                                        msg.role === 'teacher' 
                                                        ? 'bg-white border border-[#D1D7DC] text-[#061629]' 
                                                        : 'bg-[#F1F3F4] text-[#061629]'
                                                    }`}>
                                                        {msg.content}
                                                    </div>
                                                    <span className={`text-[10px] text-gray-400 mt-1 font-medium ${msg.role === 'student' ? 'text-right mr-2' : 'ml-2'}`}>
                                                        {msg.time}
                                                    </span>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="h-full flex flex-col items-center justify-center text-center p-12 space-y-4">
                                            <div className="w-16 h-16 bg-[#F1F3F4] rounded-full flex items-center justify-center text-gray-400 border border-[#D1D7DC]">
                                                <MessageSquare size={28} />
                                            </div>
                                            <h3 className="text-lg font-bold text-[#061629]">Inicie uma conversa</h3>
                                            <p className="text-sm text-gray-500 max-w-xs">Olá! Sou seu mentor em {selectedTeacher.course}. Como posso te ajudar hoje?</p>
                                        </div>
                                    )}
                                    <div ref={bottomRef} />
                                </div>

                                {/* Input de Mensagem */}
                                <div className="px-8 py-6 border-t border-[#D1D7DC] bg-white">
                                    <div className="flex items-center gap-4">
                                        <button className="p-2 text-[#1d5f31] hover:bg-[#F1F3F4] rounded-full transition-colors shrink-0">
                                            <Paperclip size={20} />
                                        </button>
                                        <div className="flex-1 flex items-center bg-white border border-[#D1D7DC] rounded-lg px-4 py-3 focus-within:border-[#1d5f31] transition-all group ring-offset-2">
                                            <input
                                                type="text"
                                                value={input}
                                                onChange={e => setInput(e.target.value)}
                                                onKeyDown={handleKey}
                                                placeholder="Escreva sua mensagem aqui..."
                                                className="flex-1 bg-transparent outline-none text-sm text-[#061629] placeholder:text-gray-400"
                                            />
                                        </div>
                                        <button
                                            onClick={handleSend}
                                            disabled={!input.trim()}
                                            className="h-11 px-6 bg-[#1d5f31] text-white rounded-lg flex items-center gap-2 font-bold text-sm hover:opacity-90 disabled:opacity-30 transition-all shadow-none shrink-0"
                                        >
                                            <span>Enviar</span>
                                            <Send size={16} />
                                        </button>
                                    </div>
                                    <p className="text-[10px] text-center text-gray-400 mt-4 font-normal">Sua comunicação com o mentor é direta e privada.</p>
                                </div>
                            </>
                        ) : (
                            <div className="flex-1 flex items-center justify-center p-12 text-center bg-[#F1F3F4]/30">
                                <div className="max-w-xs space-y-4">
                                    <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center text-[#D1D7DC] mx-auto border border-[#D1D7DC]">
                                        <Users size={32} />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-[#061629]">Selecione um Mentor</h3>
                                        <p className="text-sm text-gray-500 mt-2">Escolha na lista ao lado com quem você deseja falar agora.</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </section>
                </div>
            </div>

            <style jsx>{`
                .custom-scrollbar-premium::-webkit-scrollbar {
                    width: 5px;
                }
                .custom-scrollbar-premium::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar-premium::-webkit-scrollbar-thumb {
                    background: #D1D7DC;
                    border-radius: 10px;
                }
                .custom-scrollbar-premium::-webkit-scrollbar-thumb:hover {
                    background: #94A3B8;
                }
            `}</style>
        </div>
    )
}