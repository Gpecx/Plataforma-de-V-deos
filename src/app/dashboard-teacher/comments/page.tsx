"use client"

import { useState } from 'react'
import {
    Search,
    Filter,
    MessageSquare,
    CheckCircle2,
    ArrowRight,
    MoreHorizontal,
    User,
    BookOpen,
    Clock,
    Send
} from 'lucide-react'
import Link from 'next/link'

interface Comment {
    id: string
    user: string
    course: string
    lesson: string
    content: string
    date: string
    status: 'unanswered' | 'answered'
}

const MOCK_COMMENTS: Comment[] = [
    {
        id: '1',
        user: 'Gabriel Mendes',
        course: 'Engenharia de Software PowerPlay',
        lesson: '03. Arquitetura do Projeto Principal',
        content: 'Professor, não entendi muito bem a parte de injeção de dependência no Node. Pode dar mais um exemplo prático?',
        date: 'há 10 minutos',
        status: 'unanswered'
    },
    {
        id: '2',
        user: 'Juliana Rocha',
        course: 'UI/UX Design Profissional',
        lesson: '02. Princípios de Design Visual',
        content: 'Como definir a paleta de cores primárias baseada no logo do cliente se ele não tem manual de marca?',
        date: 'há 2 horas',
        status: 'unanswered'
    },
    {
        id: '3',
        user: 'Rafael Souza',
        course: 'Engenharia de Software PowerPlay',
        lesson: '01. Mentalidade de Excelência',
        content: 'Excelente aula! Já estou aplicando esses conceitos no meu trabalho atual.',
        date: 'há 5 horas',
        status: 'answered'
    },
    {
        id: '4',
        user: 'Camila Lima',
        course: 'Fullstack React & Next.js',
        lesson: '05. Server Actions no Next.js',
        content: 'Dá erro de serialização quando tento passar um objeto complexo. Como resolver?',
        date: 'há 1 dia',
        status: 'unanswered'
    }
]

export default function CommentInbox() {
    const [filter, setFilter] = useState<'all' | 'unanswered' | 'answered'>('unanswered')
    const [searchQuery, setSearchQuery] = useState('')

    const filteredComments = MOCK_COMMENTS.filter(comment => {
        const matchesFilter = filter === 'all' || comment.status === filter
        const matchesSearch = comment.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
            comment.user.toLowerCase().includes(searchQuery.toLowerCase())
        return matchesFilter && matchesSearch
    })

    return (
        <div className="p-8 md:p-12 min-h-screen bg-[#061629] text-white font-exo">
            <header className="mb-12">
                <div className="flex items-center gap-3 mb-2">
                    <span className="text-[10px] font-black uppercase tracking-[5px] text-[#00C402] italic">Suporte ao Aluno</span>
                </div>
                <h1 className="text-4xl font-black italic tracking-tighter uppercase">Inbox de <span className="text-[#00C402]">Dúvidas</span></h1>
                <p className="text-gray-400 mt-2 font-medium uppercase text-xs tracking-widest">Responda seus alunos com agilidade e mantenha a qualidade PowerPlay.</p>
            </header>

            {/* Filtros e Busca */}
            <div className="flex flex-col md:flex-row gap-6 mb-10 items-center justify-between">
                <div className="flex items-center gap-2 p-1 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-md">
                    <button
                        onClick={() => setFilter('unanswered')}
                        className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filter === 'unanswered' ? 'bg-[#00C402] text-black shadow-lg' : 'text-gray-500 hover:text-white'}`}
                    >
                        Não Respondidas
                    </button>
                    <button
                        onClick={() => setFilter('answered')}
                        className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filter === 'answered' ? 'bg-[#00C402] text-black shadow-lg' : 'text-gray-500 hover:text-white'}`}
                    >
                        Respondidas
                    </button>
                    <button
                        onClick={() => setFilter('all')}
                        className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filter === 'all' ? 'bg-[#00C402] text-black shadow-lg' : 'text-gray-500 hover:text-white'}`}
                    >
                        Ver Todas
                    </button>
                </div>

                <div className="relative w-full md:w-96">
                    <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                    <input
                        type="text"
                        placeholder="Buscar por aluno ou conteúdo..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-4 outline-none focus:border-[#00C402]/50 transition-all font-medium text-sm"
                    />
                </div>
            </div>

            {/* Lista de Comentários */}
            <div className="space-y-6">
                {filteredComments.length > 0 ? (
                    filteredComments.map((comment) => (
                        <div key={comment.id} className="bg-white/5 border border-white/10 rounded-[32px] overflow-hidden hover:border-[#00C402]/30 transition-all shadow-xl group">
                            <div className="p-8">
                                <div className="flex flex-col md:flex-row gap-8">
                                    {/* Sidebar do Comentário */}
                                    <div className="md:w-64 shrink-0 space-y-4">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-full bg-[#00C402]/10 flex items-center justify-center text-[#00C402] border border-[#00C402]/20 shadow-inner">
                                                <User size={20} />
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-black uppercase tracking-tight">{comment.user}</h4>
                                                <div className="flex items-center gap-1.5 text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                                                    <Clock size={10} />
                                                    {comment.date}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-2 pt-4">
                                            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#00C402]/70">
                                                <BookOpen size={12} />
                                                <span>Curso</span>
                                            </div>
                                            <p className="text-xs font-bold text-white line-clamp-1">{comment.course}</p>
                                        </div>

                                        <div className="space-y-2 pt-2">
                                            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-blue-400/70">
                                                <MessageSquare size={12} />
                                                <span>Aula</span>
                                            </div>
                                            <p className="text-xs font-bold text-gray-400 line-clamp-1">{comment.lesson}</p>
                                        </div>
                                    </div>

                                    {/* Conteúdo e Ações */}
                                    <div className="flex-grow space-y-6">
                                        <div className="bg-black/20 p-6 rounded-2xl relative">
                                            <div className="absolute top-0 right-0 p-4">
                                                <button className="text-gray-600 hover:text-white transition">
                                                    <MoreHorizontal size={18} />
                                                </button>
                                            </div>
                                            <p className="text-sm text-gray-300 leading-relaxed italic font-medium">
                                                "{comment.content}"
                                            </p>
                                        </div>

                                        <div className="flex items-center gap-4">
                                            <div className="relative flex-grow">
                                                <input
                                                    type="text"
                                                    placeholder="Digite sua resposta mestre..."
                                                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 pr-14 outline-none focus:border-[#00C402]/30 transition-all font-medium text-sm italic"
                                                />
                                                <button className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-[#00C402] text-black rounded-xl hover:scale-105 transition-transform">
                                                    <Send size={18} />
                                                </button>
                                            </div>
                                            <button className="flex items-center gap-2 px-6 py-4 border border-white/5 bg-white/5 rounded-2xl text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-white hover:bg-white/10 transition-all">
                                                <CheckCircle2 size={16} />
                                                Arquivar
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="py-24 border-2 border-dashed border-white/5 rounded-[40px] text-center bg-white/[0.02] flex flex-col items-center justify-center">
                        <CheckCircle2 size={48} className="text-[#00C402] opacity-20 mb-4" />
                        <p className="text-gray-500 italic font-medium">Parabéns! Nenhuma dúvida pendente no momento.</p>
                    </div>
                )}
            </div>
        </div>
    )
}
