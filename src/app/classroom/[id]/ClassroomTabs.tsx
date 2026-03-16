'use client'

import { useState } from 'react'
import {
    FileText,
    Download,
    MessageSquare,
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
        canEdit: true,
        replies: [
            {
                id: "r1",
                user: "Instrutor PowerPlay",
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
        <div className="mt-4 transition-colors duration-500">
            {/* Tab Headers - BORDAS REMOVIDAS */}
            <div className="flex gap-8 mb-8 transition-colors duration-500">
                <button
                    onClick={() => setActiveTab('overview')}
                    className={`pb-4 text-sm font-bold uppercase tracking-widest transition-all relative ${activeTab === 'overview' ? 'text-[#32cd32]' : isDark ? 'text-gray-600 hover:text-slate-300' : 'text-white/40 hover:text-white'}`}
                >
                    Visão Geral
                    {activeTab === 'overview' && (
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#32cd32] shadow-[0_0_10px_rgba(50,205,50,0.5)]"></div>
                    )}
                </button>
                <button
                    onClick={() => setActiveTab('comments')}
                    className={`pb-4 text-sm font-bold uppercase tracking-widest transition-all relative ${activeTab === 'comments' ? 'text-[#32cd32]' : isDark ? 'text-gray-600 hover:text-slate-300' : 'text-white/40 hover:text-white'}`}
                >
                    Comentários (Q&A)
                    {activeTab === 'comments' && (
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#32cd32] shadow-[0_0_10px_rgba(50,205,50,0.5)]"></div>
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
                            <div className={`p-6 rounded-none border transition-colors duration-500 ${isDark ? 'bg-white/5 border-white/5' : 'bg-white/5 border-white/5'}`}>
                                <h4 className="text-sm font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <FileText size={16} className="text-[#32cd32]" />
                                    Notas da Aula
                                </h4>
                                <ul className="text-sm text-white/40 space-y-2 list-disc list-inside">
                                    <li>Conceitos de Renderização no Servidor</li>
                                    <li>Setup inicial do Design System</li>
                                    <li>Boas práticas com Tailwind CSS 4.0</li>
                                </ul>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <h3 className={`text-xl font-bold uppercase italic tracking-tighter ${isDark ? 'text-white' : 'text-slate-800'}`}>Materiais</h3>
                            <div className="space-y-3">
                                <a href="#" className={`flex items-center justify-between p-4 border rounded-none hover:border-[#32cd32]/30 transition-all group ${isDark ? 'bg-white/5 border-white/5' : 'bg-white/5 border-white/10'}`}>
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-none transition-colors ${isDark ? 'bg-white/5 text-gray-400 group-hover:text-[#32cd32]' : 'bg-white/5 text-white/40 group-hover:text-[#32cd32]'}`}>
                                            <FileText size={18} />
                                        </div>
                                        <div>
                                            <p className={`text-sm font-bold ${isDark ? 'text-slate-300' : 'text-white'}`}>Resumo da Aula.pdf</p>
                                            <p className="text-[10px] text-white/40 uppercase tracking-widest">2.4 MB</p>
                                        </div>
                                    </div>
                                    <Download size={18} className="text-white/40 group-hover:text-[#32cd32]" />
                                </a>
                                <a href="#" className={`flex items-center justify-between p-4 border rounded-none hover:border-[#32cd32]/30 transition-all group ${isDark ? 'bg-white/5 border-white/5' : 'bg-white/5 border-white/10'}`}>
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-none transition-colors ${isDark ? 'bg-white/5 text-gray-400 group-hover:text-[#32cd32]' : 'bg-white/5 text-white/40 group-hover:text-[#32cd32]'}`}>
                                            <Download size={18} />
                                        </div>
                                        <div>
                                            <p className={`text-sm font-bold ${isDark ? 'text-slate-300' : 'text-white'}`}>Codigo_Fonte.zip</p>
                                            <p className="text-[10px] text-white/40 uppercase tracking-widest">15.8 MB</p>
                                        </div>
                                    </div>
                                    <Download size={18} className="text-white/40 group-hover:text-[#32cd32]" />
                                </a>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="max-w-4xl space-y-8">
                        <div className={`flex gap-4 p-6 rounded-none border transition-all ${isDark ? 'bg-white/5 border-white/10 focus-within:border-[#32cd32]/30' : 'bg-white/5 border-white/10 focus-within:border-[#32cd32]/50 shadow-sm'}`}>
                            <div className="w-10 h-10 rounded-full bg-[#32cd32]/10 flex-shrink-0 flex items-center justify-center text-[#32cd32]">
                                <User size={20} />
                            </div>
                            <div className="flex-1 space-y-4">
                                <textarea
                                    placeholder="Dúvida ou sugestão? Manda pra gente..."
                                    className={`w-full bg-transparent border-none focus:ring-0 text-sm resize-none min-h-[60px] ${isDark ? 'placeholder-gray-600 text-white' : 'placeholder-slate-400 text-slate-800'}`}
                                />
                                <div className="flex justify-end">
                                    <button className="px-6 py-2 bg-[#32cd32] text-white text-xs font-black uppercase italic rounded-none hover:scale-105 transition-all">
                                        Enviar Pergunta
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-8 pb-20">
                            {MOCK_COMMENTS.map((comment) => (
                                <div key={comment.id} className="space-y-4">
                                    <div className={`p-6 rounded-none border transition-all ${comment.isInstructor ? 'bg-[#32cd32]/5 border-[#32cd32]/20' : isDark ? 'bg-white/5 border-white/5' : 'bg-white/5 border-white/10 shadow-sm'}`}>
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="flex gap-4">
                                                <img src={comment.avatar} className={`w-10 h-10 rounded-full border ${isDark ? 'border-white/10' : 'border-white/10'}`} alt={comment.user} />
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <h4 className={`text-sm font-bold uppercase tracking-tight ${isDark ? 'text-white' : 'text-slate-800'}`}>{comment.user}</h4>
                                                        {comment.isInstructor && (
                                                            <span className="flex items-center gap-1 px-2 py-0.5 bg-[#32cd32] text-white text-[8px] font-black uppercase rounded tracking-widest">
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
                                        <p className="text-sm text-white/70 leading-relaxed pl-14">
                                            {comment.text}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}