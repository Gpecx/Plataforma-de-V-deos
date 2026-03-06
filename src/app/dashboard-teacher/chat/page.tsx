"use client"

import { useState, useEffect, Suspense } from 'react' // Adicionado useEffect e Suspense
import { useSearchParams, useRouter } from 'next/navigation' // Adicionado para ler a URL
import { auth } from '@/lib/firebase'
import { onAuthStateChanged } from 'firebase/auth'
import {
    Search,
    MessageSquare,
    User,
    Send,
    MoreVertical,
    Mic,
    Paperclip,
    FileText,
    Image as LucideImage,
    Film,
    Trash2,
    Hash,
    Filter,
    Sparkles // Ícone novo para o alerta
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const MOCK_STUDENTS = [
    { id: 1, name: 'Ana Silva', email: 'ana.silva@email.com', avatar: null, lastMessage: 'Tenho uma dúvida sobre o módulo 2...', time: '14:20', unread: 2, online: true },
    { id: 2, name: 'João Pereira', email: 'joao.p@email.com', avatar: null, lastMessage: 'Obrigado pela explicação!', time: 'Ontem', unread: 0, online: false },
    { id: 3, name: 'Maria Santos', email: 'mariasan@email.com', avatar: null, lastMessage: 'Quando sai a próxima aula?', time: 'Ontem', unread: 0, online: true },
    { id: 4, name: 'Ricardo Dias', email: 'ric.dias@email.com', avatar: null, lastMessage: 'Não consegui baixar o material.', time: '2 dias atrás', unread: 0, online: false },
    { id: 5, name: 'Beatriz Lino', email: 'bea.lino@email.com', avatar: null, lastMessage: 'Aula excelente, parabéns!', time: '1 sem atrás', unread: 0, online: false },
    // Simulação de novo aluno que a notificação focaria
    { id: 99, name: 'Daniel Araujo', email: 'daniel@email.com', avatar: null, lastMessage: 'Acabei de entrar no curso!', time: 'Agora', unread: 1, online: true },
]

const MOCK_MESSAGES_BY_STUDENT: Record<number, any[]> = {
    1: [{ id: 1, sender: 'student', text: 'Oi Professor, tudo bem? Assisti a aula sobre Hooks...', time: '14:15' }],
    99: [{ id: 1, sender: 'student', text: 'Olá professor! Acabei de me matricular e estou ansioso para começar!', time: 'Agora' }]
    // ... outros mocks simplificados para o exemplo
}

function ChatManagementContent() {
    const searchParams = useSearchParams()
    const isNewStudentAction = searchParams.get('new') === 'true'
    const userIdParam = searchParams.get('userId')

    const [selectedStudent, setSelectedStudent] = useState(MOCK_STUDENTS[0])
    const [newMessage, setNewMessage] = useState('')
    const [showNewAlert, setShowNewAlert] = useState(false)
    const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null)
    const router = useRouter()

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (!user) {
                router.push('/')
                return
            }

            try {
                const { doc, getDoc } = await import('firebase/firestore')
                const { db } = await import('@/lib/firebase')
                const snap = await getDoc(doc(db, 'profiles', user.uid))

                if (snap.exists() && (snap.data().role === 'teacher' || snap.data().role === 'admin')) {
                    setIsAuthorized(true)
                } else {
                    router.push('/')
                }
            } catch (err) {
                console.error("Auth check error:", err)
                router.push('/')
            }
        })
        return () => unsubscribe()
    }, [router])

    useEffect(() => {
        if (!isAuthorized) return
        if (userIdParam) {
            const student = MOCK_STUDENTS.find(s => s.id.toString() === userIdParam)
            if (student) setSelectedStudent(student)
        } else if (isNewStudentAction) {
            // Simula selecionar o aluno Daniel Araujo (ID 99) que veio da notificação
            const newStudent = MOCK_STUDENTS.find(s => s.id === 99)
            if (newStudent) {
                setSelectedStudent(newStudent)
                setShowNewAlert(true)

                // Remove o alerta após 5 segundos
                const timer = setTimeout(() => setShowNewAlert(false), 5000)
                return () => clearTimeout(timer)
            }
        }
    }, [isNewStudentAction, userIdParam])

    const messages = MOCK_MESSAGES_BY_STUDENT[selectedStudent.id] || []

    if (isAuthorized === null) {
        return <div className="h-screen flex items-center justify-center font-black uppercase text-[10px] tracking-widest text-slate-400">Verificando permissões...</div>
    }

    return (
        <div className="h-[calc(100vh-20px)] flex flex-col p-4 md:p-8 space-y-6">
            <header className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-black uppercase tracking-tighter text-slate-700">
                        Gestão de <span className="text-[#00C402]">Chat</span>
                    </h1>
                    <p className="text-slate-500 mt-1 font-medium italic">Acompanhe seus estudantes e responda dúvidas em tempo real.</p>
                </div>

                {/* Alerta de Novo Aluno flutuante ou fixo */}
                {showNewAlert && (
                    <div className="flex items-center gap-3 bg-[#00C402] text-white px-4 py-2 rounded-full font-black text-xs uppercase italic animate-bounce shadow-sm">
                        <Sparkles size={16} />
                        Novo aluno acabou de entrar!
                    </div>
                )}
            </header>

            <div className="flex-grow flex bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-sm">

                {/* Lateral: Lista de Alunos */}
                <aside className="w-full md:w-80 border-r border-slate-100 flex flex-col">
                    <div className="p-6 border-b border-slate-100">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                            <Input
                                placeholder="Buscar aluno..."
                                className="bg-slate-50 border-slate-100 pl-10 text-xs h-10 focus:border-[#00C402] text-slate-700"
                            />
                        </div>
                    </div>

                    <div className="flex-grow overflow-y-auto">
                        {MOCK_STUDENTS.map((student) => (
                            <div
                                key={student.id}
                                onClick={() => {
                                    setSelectedStudent(student)
                                    if (student.id === 99) setShowNewAlert(false)
                                }}
                                className={`p-5 flex items-center gap-4 cursor-pointer transition-all border-l-4 hover:bg-slate-50 
                                    ${selectedStudent.id === student.id ? 'bg-[#00C402]/5 border-[#00C402]' : 'border-transparent'}
                                    ${showNewAlert && student.id === 99 ? 'animate-pulse bg-[#00C402]/10' : ''}
                                `}
                            >
                                <div className="relative">
                                    <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold border transition-colors uppercase
                                        ${selectedStudent.id === student.id ? 'bg-[#00C402] text-white border-[#00C402]' : 'bg-slate-50 text-slate-400 border-slate-200'}
                                    `}>
                                        {student.name.charAt(0)}
                                    </div>
                                    {student.online && (
                                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-[#00C402] rounded-full border-2 border-white"></div>
                                    )}
                                </div>
                                <div className="flex-grow min-w-0">
                                    <div className="flex justify-between items-center mb-1">
                                        <h4 className={`font-bold text-sm truncate ${selectedStudent.id === student.id ? 'text-slate-900' : 'text-slate-700'}`}>{student.name}</h4>
                                        <span className="text-[10px] text-slate-400 font-bold uppercase">{student.time}</span>
                                    </div>
                                    <p className="text-xs text-slate-500 truncate italic">"{student.lastMessage}"</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </aside>

                {/* Área de Chat */}
                <main className="hidden md:flex flex-grow flex-col">
                    {/* Header do Chat */}
                    <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/30">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-[#00C402]/10 flex items-center justify-center font-bold text-[#00C402] border border-[#00C402]/20">
                                {selectedStudent.name.charAt(0)}
                            </div>
                            <div>
                                <h3 className="font-black text-slate-700 uppercase tracking-tight leading-tight">{selectedStudent.name}</h3>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                    <div className={`w-2 h-2 rounded-full ${selectedStudent.online ? 'bg-[#00C402]' : 'bg-slate-300'}`}></div>
                                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                                        {selectedStudent.online ? 'Disponível agora' : 'Offline'}
                                    </p>
                                </div>
                            </div>
                        </div>
                        {/* ... Restante dos ícones do header (DropdownMenu) permanece igual ... */}
                    </div>

                    {/* Mensagens */}
                    <div className="flex-grow p-8 overflow-y-auto space-y-6 flex flex-col bg-[#F4F7F9]">
                        {messages.length > 0 ? (
                            messages.map((msg) => (
                                <div key={msg.id} className={`flex ${msg.sender === 'teacher' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[70%] p-5 rounded-3xl shadow-sm ${msg.sender === 'teacher' ? 'bg-slate-900 text-white rounded-tr-none' : 'bg-white text-slate-700 rounded-tl-none border border-slate-200'}`}>
                                        <p className="text-sm leading-relaxed font-medium">{msg.text}</p>
                                        <div className={`mt-2 text-[10px] font-black uppercase tracking-widest ${msg.sender === 'teacher' ? 'text-slate-400' : 'text-slate-300'}`}>
                                            {msg.time}
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="flex-grow flex items-center justify-center text-slate-400 italic text-sm font-bold uppercase tracking-widest">
                                Nenhuma mensagem com este aluno ainda.
                            </div>
                        )}
                    </div>

                    {/* Input de Mensagem */}
                    <div className="p-6 border-t border-slate-100 bg-white">
                        <form className="flex gap-4" onSubmit={(e) => e.preventDefault()}>
                            <div className="relative flex-grow">
                                <Input
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    placeholder={`Responder para ${selectedStudent.name}...`}
                                    className="bg-slate-50 border-slate-200 focus:border-[#00C402] h-14 pl-6 pr-12 text-slate-700 font-medium"
                                />
                                <button type="button" className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#00C402] transition-colors">
                                    <Mic size={20} />
                                </button>
                            </div>
                            <Button
                                type="submit"
                                className="h-14 w-14 rounded-2xl bg-[#00C402] text-white hover:brightness-105 shadow-sm transition-all p-0"
                            >
                                <Send size={24} />
                            </Button>
                        </form>
                    </div>
                </main>
            </div>
        </div>
    )
}

export default function ChatManagementPage() {
    return (
        <Suspense fallback={<div className="h-screen flex items-center justify-center font-black uppercase text-[10px] tracking-widest text-slate-400">Carregando painel de mensagens...</div>}>
            <ChatManagementContent />
        </Suspense>
    )
}