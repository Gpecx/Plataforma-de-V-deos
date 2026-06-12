"use client"

import { useState, useRef, useEffect, useCallback } from 'react'
import { ArrowLeft, Send, Users, MessageSquare } from 'lucide-react'
import Link from 'next/link'
import { auth, db } from '@/lib/firebase'
import { collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp, getDocs } from 'firebase/firestore'
import { useAuth } from '@/context/AuthProvider'
import { parseFirebaseDate } from '@/lib/date-utils'
import { toast } from 'sonner'

interface ChatMessage {
    id: string
    role: 'teacher' | 'student'
    content: string
    time: string
    user_id: string
    teacher_id: string
    created_at?: any
    status?: 'sending' | 'sent' | 'error'
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
                )

                const snapshot = await getDocs(q)


                // ordenar no cliente para pegar a última mensagem por aluno
                const sortedDocs = snapshot.docs.sort((a, b) => {
                    const aTime = parseFirebaseDate(a.data().created_at)?.getTime() || 0
                    const bTime = parseFirebaseDate(b.data().created_at)?.getTime() || 0
                    return bTime - aTime
                })

                const studentIdsSeen = new Set<string>()
                const mappedStudents: Student[] = []

                for (const msgDoc of sortedDocs) {
                    const msgData = msgDoc.data()
                    const studentId = msgData.user_id

                    if (!studentIdsSeen.has(studentId)) {
                        studentIdsSeen.add(studentId)
                        // LGPD: prioriza display_name (novo). Mantém sender_name (mensagens
                        // antigas) e cai para um ID abreviado quando nenhum nome existe
                        // (ex.: conta excluída → user_id 'deleted_user').
                        const senderName = msgData.display_name || msgData.sender_name || `Aluno ${String(studentId).substring(0, 6)}`
                        mappedStudents.push({
                            id: studentId,
                            name: senderName,
                            course: 'Treinamento Ativo',
                            initials: senderName.split(' ').map((n: string) => n[0]).join('').toUpperCase().substring(0, 2),
                            status: 'online',
                            lastMsg: msgData.content
                        })
                    }
                }

                // Filtra apenas alunos com matrícula confirmada
                const coursesSnap = await getDocs(query(
                    collection(db, 'courses'),
                    where('teacher_id', '==', user.uid)
                ))
                const teacherCourseIds = coursesSnap.docs.map(d => d.id)
                const confirmedStudentIds = new Set<string>()
                for (let i = 0; i < teacherCourseIds.length; i += 10) {
                    const chunk = teacherCourseIds.slice(i, i + 10)
                    const enrollSnap = await getDocs(query(
                        collection(db, 'enrollments'),
                        where('course_id', 'in', chunk),
                        where('payment_confirmed', '==', true)
                    ))
                    enrollSnap.forEach(d => confirmedStudentIds.add(d.data().user_id))
                }
                const filteredStudents = mappedStudents.filter(s => confirmedStudentIds.has(s.id))
                setStudents(filteredStudents)
                if (filteredStudents.length > 0 && !selectedStudent) {
                    setSelectedStudent(filteredStudents[0])
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
            where('teacher_id', '==', user.uid),
            where('user_id', '==', selectedStudent.id),
        )

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const serverMsgs = snapshot.docs
                .map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                    time: formatTime(doc.data().created_at),
                    status: 'sent' as const,
                } as ChatMessage))
                .filter(msg => msg.user_id === selectedStudent.id)
                .sort((a, b) => {
                    const aTime = parseFirebaseDate(a.created_at)?.getTime() || 0
                    const bTime = parseFirebaseDate(b.created_at)?.getTime() || 0
                    return aTime - bTime
                })

            setMessages(prev => {
                const optimistic = prev.filter(m => m.id.startsWith('temp_'))
                const remainingOptimistic = optimistic.filter(opt =>
                    !serverMsgs.some(sm =>
                        sm.content === opt.content &&
                        sm.user_id === opt.user_id &&
                        sm.teacher_id === opt.teacher_id
                    )
                )
                return [...serverMsgs, ...remainingOptimistic]
            })
        }, (error) => {
            console.error('Erro no listener de mensagens:', error)
        })

        return () => unsubscribe()
    }, [user, selectedStudent])

    const handleSend = async () => {
        const text = input.trim()
        if (!text || !user || !selectedStudent) return

        const tempId = `temp_${Date.now()}`
        const optimisticMessage: ChatMessage = {
            id: tempId,
            role: 'teacher',
            content: text,
            time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
            user_id: selectedStudent.id,
            teacher_id: user.uid,
            status: 'sending',
        }

        setMessages(prev => [...prev, optimisticMessage])
        setInput('')

        try {
            await addDoc(collection(db, 'messages'), {
                user_id: selectedStudent.id,
                teacher_id: user.uid,
                role: 'teacher',
                content: text,
                created_at: serverTimestamp(),
            })

            // Notifica o aluno por e-mail (side-effect, não bloqueante)
            fetch('/api/notify/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'teacher',
                    teacherId: user.uid,
                    studentId: selectedStudent.id,
                    courseName: selectedStudent.course,
                    messageContent: text,
                }),
            }).catch(() => {})
        } catch (error) {
            console.error('Erro ao enviar:', error)
            setMessages(prev => prev.map(m =>
                m.id === tempId ? { ...m, status: 'error' } : m
            ))
            setInput(text)
            toast.error('Erro ao enviar mensagem. Tente novamente.')
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
            <div className="h-screen flex items-center justify-center bg-[#F5F5F7]">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-[#1d5f31] border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-xs font-medium text-[#061629] animate-pulse">Carregando Conversas...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="h-[calc(100vh-120px)] bg-[#F5F5F7] text-slate-900 flex flex-col overflow-hidden font-sans animate-in fade-in duration-500">
            <div className="max-w-full w-full mx-auto flex flex-col flex-1 pt-4 pb-4 px-6 gap-6 overflow-hidden">

                {/* Header Simples */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link
                            href="/dashboard-teacher"
                            className="p-2 text-[#061629] hover:bg-[#F1F3F4] rounded-lg transition-colors border border-[#D1D7DC]"
                        >
                            <ArrowLeft size={18} />
                        </Link>
                        <div>
                            <h1 className="text-xl font-bold text-[#061629]">Central de Mensagens</h1>
                            <p className="text-sm text-gray-500 font-normal">Gerencie e responda seus alunos</p>
                        </div>
                    </div>
                </div>

                <div className="flex flex-1 gap-6 overflow-hidden">
                    {/* Sidebar de Alunos */}
                    <aside className="w-80 shrink-0 hidden md:flex flex-col gap-4 overflow-y-auto pr-2 custom-scrollbar-premium">
                        <div className="text-[11px] font-bold uppercase tracking-wider text-gray-400 px-2">Conversas Ativas</div>
                        {students.length > 0 ? (
                            students.map(student => (
                                <button
                                    key={student.id}
                                    onClick={() => setSelectedStudent(student)}
                                    className={`group flex items-center gap-4 p-4 rounded-lg border transition-all text-left ${selectedStudent?.id === student.id 
                                        ? 'bg-white border-[#D1D7DC] border-l-4 border-l-[#1d5f31]' 
                                        : 'bg-white border-[#D1D7DC] hover:bg-[#F1F3F4]'}`}
                                >
                                    <div className="relative shrink-0">
                                        <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm ${selectedStudent?.id === student.id ? 'bg-[#1d5f31] text-white' : 'bg-[#F1F3F4] text-[#061629]'}`}>
                                            {student.initials}
                                        </div>
                                        <div className={`absolute bottom-0 right-0 w-3 h-3 border-2 border-white rounded-full ${student.status === 'online' ? 'bg-[#00C402]' : 'bg-gray-300'}`}></div>
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <h4 className="font-bold text-sm text-[#061629] truncate">{student.name}</h4>
                                        <p className="text-xs text-gray-500 truncate mt-0.5">{student.course}</p>
                                    </div>
                                </button>
                            ))
                        ) : (
                            <div className="p-8 bg-white border border-[#D1D7DC] rounded-lg text-center">
                                <p className="text-sm text-gray-500">Nenhuma conversa encontrada.</p>
                            </div>
                        )}
                    </aside>

                    {/* Área de Chat Principal */}
                    <section className="flex-1 flex flex-col bg-[#F5F5F7] border border-[#D1D7DC] rounded-xl overflow-hidden shadow-none">
                        {selectedStudent ? (
                            <>
                                {/* Chat Header */}
                                <div className="flex items-center gap-4 px-8 py-4 border-b border-[#D1D7DC] bg-white">
                                    <div className="relative">
                                        <div className="w-10 h-10 rounded-full bg-[#F1F3F4] flex items-center justify-center text-[#1d5f31] font-bold text-sm border border-[#D1D7DC]">
                                            {selectedStudent.initials}
                                        </div>
                                        <div className={`absolute bottom-0 right-0 w-3 h-3 border-2 border-white rounded-full ${selectedStudent.status === 'online' ? 'bg-[#00C402]' : 'bg-gray-300'}`}></div>
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-[#061629] text-base">{selectedStudent.name}</h3>
                                        <span className={`text-[10px] font-medium uppercase tracking-[1px] ${selectedStudent.status === 'online' ? 'text-[#00C402]' : 'text-gray-500'}`}>
                                            {selectedStudent.status === 'online' ? 'Conectado agora' : 'Desconectado'}
                                        </span>
                                    </div>
                                    <div className="ml-auto hidden lg:block">
                                        <div className="text-[11px] font-medium text-gray-500 py-1.5 px-3 rounded-full bg-[#F1F3F4] border border-[#D1D7DC]">
                                            {selectedStudent.course}
                                        </div>
                                    </div>
                                </div>

                                {/* Mensagens */}
                                <div className="flex-1 overflow-y-auto px-8 py-10 space-y-6 bg-[#F5F5F7] custom-scrollbar-premium">
                                    {messages.length > 0 ? (
                                        messages.map(msg => (
                                            <div
                                                key={msg.id}
                                                className={`flex flex-col ${msg.role === 'teacher' ? 'items-end' : 'items-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}
                                            >
                                                <div className={`max-w-[70%] flex flex-col gap-1`}>
                                                    <div className={`px-5 py-3.5 rounded-2xl text-[14px] leading-relaxed ${
                                                        msg.role === 'teacher' 
                                                        ? 'bg-white border border-[#D1D7DC] text-[#061629]' 
                                                        : 'bg-[#F1F3F4] text-[#061629]'
                                                    }`}>
                                                        {msg.content}
                                                    </div>
                                                    <span className={`text-[10px] text-gray-400 mt-1 font-medium flex items-center gap-1 ${msg.role === 'teacher' ? 'text-right mr-2 justify-end' : 'ml-2'}`}>
                                                        {msg.id.startsWith('temp_') && msg.status === 'sending' && (
                                                            <span className="text-gray-400 italic">Enviando...</span>
                                                        )}
                                                        {msg.status === 'error' && (
                                                            <span className="text-red-500">Erro</span>
                                                        )}
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
                                            <p className="text-sm text-gray-500 max-w-xs">Olá! Responda ao seu aluno {selectedStudent.name}.</p>
                                        </div>
                                    )}
                                    <div ref={bottomRef} />
                                </div>

                                {/* Input de Mensagem */}
                                <div className="px-8 py-6 border-t border-[#D1D7DC] bg-white">
                                    <div className="flex items-center gap-4">
                                        <div className="flex-1 flex items-center bg-[#F5F5F7] border border-[#D1D7DC] rounded-lg px-4 py-3 focus-within:border-[#1d5f31] transition-all group ring-offset-2">
                                            <input
                                                type="text"
                                                value={input}
                                                onChange={e => setInput(e.target.value)}
                                                onKeyDown={handleKey}
                                                placeholder="Digite sua resposta aqui..."
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
                                    <p className="text-[10px] text-center text-gray-400 mt-4 font-normal">PowerPlay Creator Ecosystem • Secure Mentorship</p>
                                </div>
                            </>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-center p-20 space-y-6 bg-[#F1F3F4]/30">
                                <div className="max-w-xs space-y-4">
                                    <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center text-[#D1D7DC] mx-auto border border-[#D1D7DC]">
                                        <Users size={32} />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-[#061629]">Selecione uma Mentoria</h3>
                                        <p className="text-sm text-gray-500 mt-2">Aguardando interação com aluno real</p>
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