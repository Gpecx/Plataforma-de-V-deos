'use client'

import { useState } from 'react'
import {
    FileText,
    Download,
    MessageSquare,
    MoreVertical,
    Trash2,
    Edit3,
    Reply,
    User,
    CheckCircle2
} from 'lucide-react'

interface ClassroomTabsProps {
    lessonTitle: string;
    description?: string;
    isDark?: boolean;
}

const MOCK_COMMENTS = [
    {
        id: "c1",
        user: "João Silva",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Joao",
        text: "Professor, como faço para configurar o Firebase Localmente? Tentei seguir a doc mas me perdi na parte das credenciais.",
        date: "há 2 horas",
        isInstructor: false,
        canEdit: true, // Mock para o usuário atual
        replies: [
            {
                id: "r1",
                user: "Instrutor SPCS Academy",
                avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Instructor",
                text: "Olá João! Você precisa configurar o Firebase CLI. Depois disso, basta rodar 'firebase init' no terminal.",
                date: "há 1 hora",
                isInstructor: true,
                canEdit: false
            }
        ]
    },
    {
        id: "c2",
        user: "Maria Souza",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Maria",
        text: "A aula foi excelente! O conteúdo de Tailwind 4 está economizando muito tempo. Ansiosa para as próximas aulas!",
        date: "há 5 horas",
        isInstructor: false,
        canEdit: false,
        replies: []
    }
]

export function ClassroomTabs({ lessonTitle, description, isDark }: ClassroomTabsProps) {
    const [activeTab, setActiveTab] = useState<'overview' | 'comments'>('overview')

    return (
        <div className={`mt-8 border-t transition-colors duration-500 ${isDark ? 'border-white/5' : 'border-slate-100'}`}>
            {/* Tab Headers */}
            <div className={`flex gap-8 border-b mb-8 transition-colors duration-500 ${isDark ? 'border-white/5' : 'border-slate-100'}`}>
                <button
                    onClick={() => setActiveTab('overview')}
                    className={`pb-4 text-sm font-bold uppercase tracking-widest transition-all relative ${activeTab === 'overview' ? 'text-[#00C402]' : isDark ? 'text-gray-600 hover:text-slate-300' : 'text-gray-500 hover:text-slate-900'}`}
                >
                    Visão Geral
                    {activeTab === 'overview' && (
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#00C402] shadow-[0_0_10px_rgba(0,196,2,0.5)]"></div>
                    )}
                </button>
                <button
                    onClick={() => setActiveTab('comments')}
                    className={`pb-4 text-sm font-bold uppercase tracking-widest transition-all relative ${activeTab === 'comments' ? 'text-[#00C402]' : isDark ? 'text-gray-600 hover:text-slate-300' : 'text-gray-500 hover:text-slate-900'}`}
                >
                    Comentários (Q&A)
                    {activeTab === 'comments' && (
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#00C402] shadow-[0_0_10px_rgba(0,196,2,0.5)]"></div>
                    )}
                </button>
            </div>

            {/* Tab Content */}
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                {activeTab === 'overview' ? (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                        <div className="lg:col-span-2 space-y-6">
                            <h3 className={`text-xl font-bold uppercase italic tracking-tighter ${isDark ? 'text-white' : 'text-slate-800'}`}>Sobre esta aula</h3>
                            <p className={`leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                                {description || "Nesta aula vamos explorar os conceitos fundamentais para o desenvolvimento de alta performance. Preste atenção em cada detalhe da implementação e utilize o código fonte disponível nos materiais."}
                            </p>
                            <div className={`p-6 rounded-2xl border transition-colors duration-500 ${isDark ? 'bg-white/5 border-white/5' : 'bg-slate-50 border-slate-100'}`}>
                                <h4 className="text-sm font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <FileText size={16} className="text-[#00C402]" />
                                    Notas da Aula
                                </h4>
                                <ul className="text-sm text-gray-400 space-y-2 list-disc list-inside">
                                    <li>Conceitos de Renderização no Servidor</li>
                                    <li>Setup inicial do Design System</li>
                                    <li>Boas práticas com Tailwind CSS 4.0</li>
                                </ul>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <h3 className={`text-xl font-bold uppercase italic tracking-tighter ${isDark ? 'text-white' : 'text-slate-800'}`}>Materiais</h3>
                            <div className="space-y-3">
                                <a href="#" className={`flex items-center justify-between p-4 border rounded-xl hover:border-[#00C402]/30 transition-all group ${isDark ? 'bg-white/5 border-white/5' : 'bg-slate-50 border-slate-100'}`}>
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-lg transition-colors ${isDark ? 'bg-white/5 text-gray-400 group-hover:text-[#00C402]' : 'bg-white text-slate-400 group-hover:text-[#00C402]'}`}>
                                            <FileText size={18} />
                                        </div>
                                        <div>
                                            <p className={`text-sm font-bold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Resumo da Aula.pdf</p>
                                            <p className="text-[10px] text-gray-500 uppercase tracking-widest">2.4 MB</p>
                                        </div>
                                    </div>
                                    <Download size={18} className="text-gray-600 group-hover:text-[#00C402]" />
                                </a>
                                <a href="#" className={`flex items-center justify-between p-4 border rounded-xl hover:border-[#00C402]/30 transition-all group ${isDark ? 'bg-white/5 border-white/5' : 'bg-slate-50 border-slate-100'}`}>
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-lg transition-colors ${isDark ? 'bg-white/5 text-gray-400 group-hover:text-[#00C402]' : 'bg-white text-slate-400 group-hover:text-[#00C402]'}`}>
                                            <Download size={18} />
                                        </div>
                                        <div>
                                            <p className={`text-sm font-bold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Codigo_Fonte.zip</p>
                                            <p className="text-[10px] text-gray-500 uppercase tracking-widest">15.8 MB</p>
                                        </div>
                                    </div>
                                    <Download size={18} className="text-gray-600 group-hover:text-[#00C402]" />
                                </a>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="max-w-4xl space-y-8">
                        {/* Novo Comentário Input */}
                        <div className="flex gap-4 p-6 bg-white/5 rounded-3xl border border-white/10 group focus-within:border-[#00C402]/30 transition-all">
                            <div className="w-10 h-10 rounded-full bg-[#00C402]/10 flex-shrink-0 flex items-center justify-center text-[#00C402]">
                                <User size={20} />
                            </div>
                            <div className="flex-1 space-y-4">
                                <textarea
                                    placeholder="Dúvida ou sugestão? Manda pra gente..."
                                    className="w-full bg-transparent border-none focus:ring-0 placeholder-gray-600 text-sm resize-none min-h-[60px]"
                                />
                                <div className="flex justify-end">
                                    <button className="px-6 py-2 bg-[#00C402] text-black text-xs font-black uppercase italic rounded-full hover:scale-105 transition-all">
                                        Enviar Pergunta
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Lista de Comentários */}
                        <div className="space-y-8 pb-20">
                            {MOCK_COMMENTS.map((comment) => (
                                <div key={comment.id} className="space-y-4">
                                    {/* Card Principal do Comentário */}
                                    <div className={`p-6 rounded-3xl border transition-all ${comment.isInstructor ? 'bg-[#00C402]/5 border-[#00C402]/20' : isDark ? 'bg-white/5 border-white/5' : 'bg-white border-slate-100 shadow-sm'}`}>
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="flex gap-4">
                                                <img src={comment.avatar} className={`w-10 h-10 rounded-full border ${isDark ? 'border-white/10' : 'border-slate-100'}`} alt={comment.user} />
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <h4 className={`text-sm font-bold uppercase tracking-tight ${isDark ? 'text-white' : 'text-slate-800'}`}>{comment.user}</h4>
                                                        {comment.isInstructor && (
                                                            <span className="flex items-center gap-1 px-2 py-0.5 bg-[#00C402] text-black text-[8px] font-black uppercase rounded tracking-widest">
                                                                <CheckCircle2 size={8} />
                                                                Instrutor
                                                            </span>
                                                        )}
                                                    </div>
                                                    <span className="text-[10px] text-gray-500 uppercase font-bold">{comment.date}</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {comment.canEdit && (
                                                    <div className="flex gap-2">
                                                        <button className="p-1.5 text-gray-500 hover:text-white transition-colors"><Edit3 size={14} /></button>
                                                        <button className="p-1.5 text-gray-500 hover:text-red-500 transition-colors"><Trash2 size={14} /></button>
                                                    </div>
                                                )}
                                                <button className="p-1.5 text-gray-500 hover:text-white transition-colors"><Reply size={16} /></button>
                                            </div>
                                        </div>
                                        <p className="text-sm text-gray-300 leading-relaxed pl-14">
                                            {comment.text}
                                        </p>
                                    </div>

                                    {/* Respostas Aninhadas */}
                                    {comment.replies.length > 0 && (
                                        <div className={`space-y-4 pl-12 border-l ${isDark ? 'border-white/5' : 'border-slate-100'}`}>
                                            {comment.replies.map((reply) => (
                                                <div key={reply.id} className={`p-6 rounded-3xl border transition-all ${reply.isInstructor ? 'bg-[#00C402]/5 border-[#00C402]/20 shadow-[0_0_30px_rgba(0,196,2,0.05)]' : isDark ? 'bg-white/5 border-white/5' : 'bg-white border-slate-100 shadow-sm'}`}>
                                                    <div className="flex justify-between items-start mb-4">
                                                        <div className="flex gap-4">
                                                            <img src={reply.avatar} className={`w-10 h-10 rounded-full border ${isDark ? 'border-white/10' : 'border-slate-100'}`} alt={reply.user} />
                                                            <div>
                                                                <div className="flex items-center gap-2">
                                                                    <h4 className={`text-sm font-bold uppercase tracking-tight ${isDark ? 'text-white' : 'text-slate-800'}`}>{reply.user}</h4>
                                                                    {reply.isInstructor && (
                                                                        <span className="flex items-center gap-1 px-2 py-0.5 bg-[#00C402] text-black text-[8px] font-black uppercase rounded tracking-widest">
                                                                            <CheckCircle2 size={8} />
                                                                            Resposta do Instrutor
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <span className="text-[10px] text-gray-500 uppercase font-bold">{reply.date}</span>
                                                            </div>
                                                        </div>
                                                        {reply.canEdit && (
                                                            <div className="flex gap-2">
                                                                <button className="p-1.5 text-gray-500 hover:text-white transition-colors"><Edit3 size={14} /></button>
                                                                <button className="p-1.5 text-gray-500 hover:text-red-500 transition-colors"><Trash2 size={14} /></button>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <p className="text-sm text-gray-300 leading-relaxed pl-14">
                                                        {reply.text}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
