"use client"

import { useState } from 'react'
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
    Filter
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
]

const MOCK_MESSAGES_BY_STUDENT: Record<number, any[]> = {
    1: [
        { id: 1, sender: 'student', text: 'Oi Professor, tudo bem? Assisti a aula sobre Hooks, mas fiquei com uma dúvida no useEffect.', time: '14:15' },
        { id: 2, sender: 'student', text: 'Quando eu passo o array de dependências vazio, ele só executa uma vez, certo?', time: '14:16' },
        { id: 3, sender: 'student', text: 'Tenho uma dúvida sobre o módulo 2...', time: '14:20' },
    ],
    2: [
        { id: 1, sender: 'student', text: 'Olá! Muito obrigado pela aula de ontem.', time: 'Ontem 10:00' },
        { id: 2, sender: 'teacher', text: 'Por nada, João! Fico feliz que tenha gostado.', time: 'Ontem 10:05' },
        { id: 3, sender: 'student', text: 'Obrigado pela explicação!', time: 'Ontem 10:10' },
    ],
    3: [
        { id: 1, sender: 'student', text: 'Professor, o curso está sensacional!', time: 'Ontem 18:00' },
        { id: 2, sender: 'student', text: 'Quando sai a próxima aula?', time: 'Ontem 18:01' },
    ],
    4: [
        { id: 1, sender: 'student', text: 'Boa tarde. Não consegui baixar o material da aula 3.', time: '2 dias atrás' },
        { id: 2, sender: 'student', text: 'Não consegui baixar o material.', time: '2 dias atrás' },
    ],
    5: [
        { id: 1, sender: 'student', text: 'Aula excelente, parabéns!', time: '1 sem atrás' },
    ]
}

export default function StudentsManagementPage() {
    const [selectedStudent, setSelectedStudent] = useState(MOCK_STUDENTS[0])
    const [newMessage, setNewMessage] = useState('')

    const messages = MOCK_MESSAGES_BY_STUDENT[selectedStudent.id] || []

    return (
        <div className="h-[calc(100vh-20px)] flex flex-col p-4 md:p-8 space-y-6">
            <header>
                <h1 className="text-3xl font-black italic uppercase tracking-tighter">
                    Gestão de <span className="text-[#00FF00]">Alunos</span>
                </h1>
                <p className="text-gray-400 mt-1">Acompanhe seus estudantes e responda dúvidas em tempo real.</p>
            </header>

            <div className="flex-grow flex bg-[#0a1f3a]/40 border border-white/5 rounded-3xl overflow-hidden backdrop-blur-md">

                {/* Lateral: Lista de Alunos/Conversas */}
                <aside className="w-full md:w-80 border-r border-white/5 flex flex-col">
                    <div className="p-6 border-b border-white/5">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={14} />
                            <Input
                                placeholder="Buscar aluno..."
                                className="bg-black/20 border-white/10 pl-10 text-xs h-10 focus:border-[#00FF00]"
                            />
                        </div>
                    </div>

                    <div className="flex-grow overflow-y-auto">
                        {MOCK_STUDENTS.map((student) => (
                            <div
                                key={student.id}
                                onClick={() => setSelectedStudent(student)}
                                className={`p-5 flex items-center gap-4 cursor-pointer transition-all border-l-2 hover:bg-white/5 ${selectedStudent.id === student.id ? 'bg-white/5 border-[#00FF00]' : 'border-transparent'}`}
                            >
                                <div className="relative">
                                    <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center font-bold text-gray-400 border border-white/10 group-hover:border-[#00FF00]/50 transition-colors uppercase">
                                        {student.name.charAt(0)}
                                    </div>
                                    {student.online && (
                                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-[#00FF00] rounded-full border-2 border-[#061629]"></div>
                                    )}
                                </div>
                                <div className="flex-grow min-w-0">
                                    <div className="flex justify-between items-center mb-1">
                                        <h4 className="font-bold text-sm truncate">{student.name}</h4>
                                        <span className="text-[10px] text-gray-500 font-bold uppercase">{student.time}</span>
                                    </div>
                                    <p className="text-xs text-gray-500 truncate italic">"{student.lastMessage}"</p>
                                </div>
                                {student.unread > 0 && (
                                    <div className="w-5 h-5 bg-[#00FF00] text-black rounded-full flex items-center justify-center text-[10px] font-black">
                                        {student.unread}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </aside>

                {/* Área de Chat */}
                <main className="hidden md:flex flex-grow flex-col">

                    {/* Chat Header */}
                    <div className="p-6 border-b border-white/5 flex justify-between items-center bg-black/10">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-[#00FF00]/10 flex items-center justify-center font-bold text-[#00FF00]">
                                {selectedStudent.name.charAt(0)}
                            </div>
                            <div>
                                <h3 className="font-bold leading-tight">{selectedStudent.name}</h3>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                    <div className={`w-2 h-2 rounded-full ${selectedStudent.online ? 'bg-[#00FF00]' : 'bg-gray-600'}`}></div>
                                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">
                                        {selectedStudent.online ? 'Disponível agora' : 'Offline'}
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <button className="text-gray-500 hover:text-white transition p-2 hover:bg-white/5 rounded-full outline-none">
                                        <MoreVertical size={20} />
                                    </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="bg-[#0a1f3a]/95 backdrop-blur-lg border-white/10 text-white w-56 shadow-2xl" align="end">
                                    <DropdownMenuLabel className="font-bold text-[#00FF00] uppercase tracking-wider text-[10px] px-4 py-3">Ações da Conversa</DropdownMenuLabel>
                                    <DropdownMenuSeparator className="bg-white/10" />

                                    <DropdownMenuItem className="cursor-pointer hover:bg-white/5 transition-colors px-4 py-3 gap-3">
                                        <LucideImage size={18} className="text-blue-400" />
                                        <div className="flex flex-col">
                                            <span className="text-sm">Enviar Imagem</span>
                                            <span className="text-[10px] text-gray-500">PNG, JPG ou GIF</span>
                                        </div>
                                    </DropdownMenuItem>

                                    <DropdownMenuItem className="cursor-pointer hover:bg-white/5 transition-colors px-4 py-3 gap-3">
                                        <FileText size={18} className="text-yellow-400" />
                                        <div className="flex flex-col">
                                            <span className="text-sm">Enviar PDF</span>
                                            <span className="text-[10px] text-gray-500">Documentos e materiais</span>
                                        </div>
                                    </DropdownMenuItem>

                                    <DropdownMenuItem className="cursor-pointer hover:bg-white/5 transition-colors px-4 py-3 gap-3">
                                        <Film size={18} className="text-purple-400" />
                                        <div className="flex flex-col">
                                            <span className="text-sm">Enviar Vídeo</span>
                                            <span className="text-[10px] text-gray-500">MP4 ou MOV</span>
                                        </div>
                                    </DropdownMenuItem>

                                    <DropdownMenuSeparator className="bg-white/10" />

                                    <DropdownMenuItem className="cursor-pointer hover:bg-red-500/20 text-red-500 transition-colors px-4 py-3 gap-3">
                                        <Trash2 size={18} />
                                        <span>Apagar Conversa</span>
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>

                    {/* Mensagens */}
                    <div className="flex-grow p-8 overflow-y-auto space-y-6 flex flex-col">
                        <div className="text-center">
                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-600 bg-white/5 px-4 py-1.5 rounded-full border border-white/5">Hoje, 20 de Fevereiro</span>
                        </div>

                        {messages.map((msg) => (
                            <div key={msg.id} className={`flex ${msg.sender === 'teacher' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[70%] p-5 rounded-3xl ${msg.sender === 'teacher' ? 'bg-white/10 text-white rounded-tr-none border border-[#00FF00]/20' : 'bg-white/5 text-gray-300 rounded-tl-none border border-white/5'}`}>
                                    <p className="text-sm leading-relaxed">{msg.text}</p>
                                    <div className={`mt-2 text-[10px] font-bold uppercase ${msg.sender === 'teacher' ? 'text-[#00FF00]/60' : 'text-gray-600'}`}>
                                        {msg.time}
                                    </div>
                                </div>
                            </div>
                        ))}

                        <div className="flex justify-start">
                            <div className="bg-white/5 border border-[#00FF00]/20 p-4 rounded-2xl max-w-sm">
                                <span className="text-[10px] font-black uppercase tracking-widest text-[#00FF00] mb-2 block">Dúvida anexada:</span>
                                <div className="flex items-center gap-3 text-sm text-gray-300">
                                    <div className="p-2 bg-black/40 rounded text-[#00FF00]"><Hash size={14} /></div>
                                    Aula 04 - Fundamentos do useEffect
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Input de Mensagem */}
                    <div className="p-6 border-t border-white/5">
                        <form className="flex gap-4" onSubmit={(e) => e.preventDefault()}>
                            <div className="relative flex-grow">
                                <Input
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    placeholder="Digite sua resposta aqui..."
                                    className="bg-black/40 border-white/10 focus:border-[#00FF00] h-14 pl-6 pr-12"
                                />
                                <button type="button" className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-[#00FF00] transition-colors">
                                    <Mic size={20} />
                                </button>
                            </div>
                            <Button
                                type="submit"
                                className="h-14 w-14 rounded-2xl bg-[#00FF00] text-black hover:brightness-110 shadow-[0_0_20px_rgba(0,255,0,0.3)] transition-all p-0"
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
