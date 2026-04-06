'use client'

import { useState, useEffect } from 'react'
import {
    FileText,
    Download,
    Trash2,
    Edit3,
    Reply,
    CheckCircle2,
    Star
} from 'lucide-react'
import { useAuth } from '@/context/AuthProvider'
import { EvaluationForm } from '@/components/EvaluationForm'
import { db } from '@/lib/firebase'
import { collection, addDoc, onSnapshot, query, where, orderBy, serverTimestamp, deleteDoc, doc } from 'firebase/firestore'

interface ClassroomTabsProps {
    lessonId: string;
    lessonTitle: string;
    description?: string;
    courseId?: string;
}

interface Comment {
    id: string;
    user: string;
    avatar: string;
    text: string;
    date: string;
    isInstructor: boolean;
    canEdit: boolean;
    replies?: Comment[];
    userId?: string;
    createdAt?: unknown;
}

const MOCK_COMMENTS: Comment[] = [
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

export function ClassroomTabs({ lessonId, description, courseId }: ClassroomTabsProps) {
    const [activeTab, setActiveTab] = useState<'overview' | 'comments' | 'evaluate'>('overview')
    const [comments, setComments] = useState<Comment[]>([])
    const [commentText, setCommentText] = useState('')
    const [isSending, setIsSending] = useState(false)
    const [isHydrated, setIsHydrated] = useState(false)
    const { user } = useAuth()

    useEffect(() => {
        setIsHydrated(true)
    }, [])

    useEffect(() => {
        if (!lessonId || !isHydrated) return

        let unsubscribe: (() => void) | undefined

        try {
            const commentsRef = collection(db, 'comments')
            const q = query(
                commentsRef,
                where('lessonId', '==', lessonId),
                orderBy('createdAt', 'desc')
            )

            unsubscribe = onSnapshot(q, (snapshot) => {
                const loadedComments: Comment[] = snapshot.docs.map((doc) => {
                    const data = doc.data()
                    return {
                        id: doc.id,
                        user: data.userName || data.user || 'Usuário',
                        avatar: data.avatar || '',
                        text: data.content || data.text || '',
                        date: data.createdAt ? 'Agora mesmo' : '',
                        isInstructor: data.isInstructor || false,
                        canEdit: data.userId === user?.uid || false,
                        userId: data.userId,
                        createdAt: data.createdAt
                    }
                })
                setComments(loadedComments)
            }, (error) => {
                console.error('Erro ao carregar comentários:', error)
            })
        } catch (error) {
            console.error('Erro ao inicializar listener de comentários:', error)
        }

        return () => {
            if (unsubscribe) {
                unsubscribe()
            }
        }
    }, [lessonId, isHydrated, user?.uid])

    const getUserName = () => {
        if (user?.displayName) return user.displayName
        if (user?.email) return user.email.split('@')[0]
        return "Usuário"
    }

    const getUserAvatar = () => {
        return user?.photoURL || ""
    }

    const getUserInitial = () => {
        const name = getUserName()
        return name.charAt(0).toUpperCase()
    }

    const handleSendComment = async () => {
        if (!commentText.trim() || !user || !courseId || !lessonId) return

        setIsSending(true)
        try {
            await addDoc(collection(db, 'comments'), {
                courseId,
                lessonId,
                userId: user.uid,
                userName: getUserName(),
                avatar: getUserAvatar(),
                content: commentText.trim(),
                createdAt: serverTimestamp(),
                isInstructor: false
            })
            setCommentText('')
        } catch (error) {
            console.error('Erro ao enviar comentário:', error)
        } finally {
            setIsSending(false)
        }
    }

    const handleDeleteComment = async (commentId: string) => {
        if (!confirm('Tem certeza que deseja excluir este comentário?')) return
        
        try {
            await deleteDoc(doc(db, 'comments', commentId))
        } catch (error) {
            console.error('Erro ao excluir comentário:', error)
        }
    }

    return (
        <div className="mt-4 transition-colors duration-500 font-exo">
            {/* Tab Headers */}
            <div className="flex gap-8 mb-8 transition-colors duration-500 border-b border-slate-800">
                <button
                    onClick={() => setActiveTab('overview')}
                    className={`pb-4 text-sm font-bold uppercase tracking-widest transition-all relative ${activeTab === 'overview' ? 'text-green-500' : 'text-slate-300 hover:text-white'}`}
                >
                    Visão Geral
                    {activeTab === 'overview' && (
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]"></div>
                    )}
                </button>
                <button
                    onClick={() => setActiveTab('comments')}
                    className={`pb-4 text-sm font-bold uppercase tracking-widest transition-all relative ${activeTab === 'comments' ? 'text-green-500' : 'text-slate-300 hover:text-white'}`}
                >
                    Comentários (Q&A)
                    {activeTab === 'comments' && (
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]"></div>
                    )}
                </button>
                {courseId && (
                    <button
                        onClick={() => setActiveTab('evaluate')}
                        className={`pb-4 text-sm font-bold uppercase tracking-widest transition-all relative ${activeTab === 'evaluate' ? 'text-green-500' : 'text-slate-300 hover:text-white'}`}
                    >
                        <div className="flex items-center gap-2">
                            <Star size={16} />
                            Avaliar
                        </div>
                        {activeTab === 'evaluate' && (
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]"></div>
                        )}
                    </button>
                )}
            </div>

            {/* Tab Content */}
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                {activeTab === 'evaluate' ? (
                    courseId ? <EvaluationForm courseId={courseId} /> : null
                ) : activeTab === 'overview' ? (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                        <div className="lg:col-span-2 space-y-6">
                            <h3 className="text-xl font-black uppercase tracking-tighter text-white">Sobre esta aula</h3>
                            <p className="leading-relaxed text-white">
                                {description || "Nesta aula vamos explorar os conceitos fundamentais para o desenvolvimento de alta performance. Preste atenção em cada detalhe da implementação e utilize o código fonte disponível nos materiais."}
                            </p>
                            <div className="p-6 rounded-xl border border-slate-800 bg-slate-800/30">
                                <h4 className="text-sm font-bold uppercase tracking-widest mb-4 flex items-center gap-2 text-white">
                                    <FileText size={16} className="text-green-500" />
                                    Notas da Aula
                                </h4>
                                <ul className="text-sm text-white space-y-2 list-disc list-inside">
                                    <li>Conceitos de Renderização no Servidor</li>
                                    <li>Setup inicial do Design System</li>
                                    <li>Boas práticas com Tailwind CSS 4.0</li>
                                </ul>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <h3 className="text-xl font-black uppercase tracking-tighter text-white">Materiais</h3>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between p-4 border border-slate-800 bg-slate-800/30 rounded-xl opacity-60 cursor-not-allowed">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-xl bg-[#061629] text-slate-500 shadow-sm">
                                            <FileText size={18} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-slate-400">Resumo da Aula.pdf</p>
                                            <p className="text-[10px] text-slate-500 uppercase tracking-widest">2.4 MB</p>
                                        </div>
                                    </div>
                                    <span className="px-3 py-1 bg-[#00c853] text-black text-[10px] font-black uppercase tracking-widest rounded-full">
                                        Em Breve
                                    </span>
                                </div>
                                <div className="flex items-center justify-between p-4 border border-slate-800 bg-slate-800/30 rounded-xl opacity-60 cursor-not-allowed">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-xl bg-[#061629] text-slate-500 shadow-sm">
                                            <Download size={18} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-slate-400">Codigo_Fonte.zip</p>
                                            <p className="text-[10px] text-slate-500 uppercase tracking-widest">15.8 MB</p>
                                        </div>
                                    </div>
                                    <span className="px-3 py-1 bg-[#00c853] text-black text-[10px] font-black uppercase tracking-widest rounded-full">
                                        Em Breve
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="max-w-4xl space-y-8">
                        <div className="flex gap-4 p-6 rounded-md border border-gray-800 bg-[#111827] focus-within:border-[#1D5F31]/30 transition-all">
                                {user?.photoURL ? (
                                    <img src={user.photoURL} className="w-10 h-10 rounded-full border border-gray-800 flex-shrink-0" alt={user.displayName || "Usuário"} />
                                ) : (
                                    <div className="w-10 h-10 rounded-full bg-green-500/10 flex-shrink-0 flex items-center justify-center text-green-500 font-bold font-exo">
                                        {getUserInitial()}
                                    </div>
                                )}
                            <div className="flex-1 space-y-4">
                                <textarea
                                    placeholder="Dúvida ou sugestão? Manda pra gente..."
                                    value={commentText}
                                    onChange={(e) => setCommentText(e.target.value)}
                                    className="w-full bg-transparent border-none focus:ring-0 text-sm resize-none min-h-[60px] placeholder-slate-400 text-white font-exo"
                                />
                                <div className="flex justify-end">
                                    <button 
                                        onClick={handleSendComment}
                                        disabled={isSending || !user}
                                        className="px-6 py-2 bg-[#00c853] text-black text-xs font-bold uppercase rounded-md hover:scale-105 transition-all font-exo disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                                    >
                                        {isSending ? 'Enviando...' : 'Enviar Pergunta'}
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-8 pb-20">
                            {comments.length === 0 ? (
                                <div className="text-center py-12">
                                    <p className="text-slate-400 text-sm font-exo">NENHUMA DÚVIDA REGISTRADA NESTA AULA</p>
                                </div>
                            ) : (
                                comments.map((comment) => (
                                    <div key={comment.id} className="space-y-4">
                                        <div className={`p-6 rounded-md border transition-all ${comment.isInstructor ? 'bg-green-500/5 border-green-500/10' : 'bg-[#111827] border-gray-800 shadow-sm'}`}>
                                            <div className="flex justify-between items-start mb-4">
                                                <div className="flex gap-4">
                                                    {comment.avatar ? (
                                                        <img src={comment.avatar} className="w-10 h-10 rounded-full border border-gray-800" alt={comment.user} />
                                                    ) : (
                                                        <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center text-green-500 font-bold font-exo flex-shrink-0">
                                                            {comment.user.charAt(0).toUpperCase()}
                                                        </div>
                                                    )}
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <h4 className="text-sm font-bold uppercase tracking-tight text-white font-exo">{comment.user}</h4>
                                                            {comment.isInstructor && (
                                                                <span className="flex items-center gap-1 px-2 py-0.5 bg-green-600 text-white text-[8px] font-black uppercase rounded tracking-widest font-exo">
                                                                    <CheckCircle2 size={8} />
                                                                    Instrutor
                                                                </span>
                                                            )}
                                                        </div>
                                                        <span className="text-[10px] text-slate-300 uppercase font-bold font-exo">{comment.date}</span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    {comment.canEdit && (
                                                        <div className="flex gap-2">
                                                            <button className="p-1.5 text-slate-400 hover:text-[#1D5F31] transition-colors"><Edit3 size={14} /></button>
                                                            <button 
                                                                onClick={() => handleDeleteComment(comment.id)}
                                                                className="p-1.5 text-slate-400 hover:text-red-500 transition-colors"
                                                            >
                                                                <Trash2 size={14} />
                                                            </button>
                                                        </div>
                                                    )}
                                                    <button className="p-1.5 text-slate-400 hover:text-[#1D5F31] transition-colors"><Reply size={16} /></button>
                                                </div>
                                            </div>
                                            <p className="text-sm text-white leading-relaxed pl-14 font-exo">
                                                {comment.text}
                                            </p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}