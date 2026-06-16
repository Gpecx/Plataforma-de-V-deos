"use client"

import { useEffect, useState } from 'react'
import { auth, db } from '@/lib/firebase'
import { onAuthStateChanged } from 'firebase/auth'
import { Loader2, Send, MessageCircle, Clock, Trash2 } from 'lucide-react'
import { getCommentsByTeacher, replyToComment, deleteComment, TeacherComment } from '@/lib/lesson-comments'
import { toast } from 'sonner'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

export default function TeacherDuvidasPage() {
    const [comments, setComments] = useState<TeacherComment[]>([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState<'all' | 'pending' | 'answered'>('all')
    const [replyText, setReplyText] = useState<Record<string, string>>({})
    const [sending, setSending] = useState<Record<string, boolean>>({})
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [commentToDelete, setCommentToDelete] = useState<string | null>(null)

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, (user) => {
            if (user) {
                loadComments(user.uid)
            } else {
                setLoading(false)
            }
        })
        return () => unsub()
    }, [])

    async function loadComments(uid: string) {
        setLoading(true)
        try {
            const data = await getCommentsByTeacher(uid)
            setComments(data)
        } catch (err) {
            console.error('Erro ao carregar dúvidas:', err)
            toast.error('Erro ao carregar dúvidas')
        } finally {
            setLoading(false)
        }
    }

    async function handleReply(commentId: string) {
        const content = replyText[commentId]?.trim()
        if (!content || sending[commentId]) return

            setSending((prev) => ({ ...prev, [commentId]: true }))
            try {
                await replyToComment(commentId, content)
                setReplyText((prev) => ({ ...prev, [commentId]: '' }))
                toast.success('Resposta enviada com sucesso!')
            setComments((prev) =>
                prev.map((c) =>
                    c.id === commentId
                        ? {
                              ...c,
                              status: 'answered' as const,
                              replies: [
                                  ...c.replies,
                                  {
                                      id: 'temp-' + Date.now(),
                                      teacherId: auth.currentUser?.uid || '',
                                      teacherName: 'Professor',
                                      content,
                                      createdAt: undefined as any,
                                  },
                              ],
                          }
                        : c
                )
            )
        } catch (err) {
            console.error('Erro ao responder:', err)
            toast.error('Erro ao responder dúvida')
        } finally {
            setSending((prev) => ({ ...prev, [commentId]: false }))
        }
    }

    function openDeleteDialog(commentId: string) {
        setCommentToDelete(commentId)
        setDeleteDialogOpen(true)
    }

    async function confirmDelete() {
        if (!commentToDelete) return
        try {
            await deleteComment(commentToDelete)
            setComments((prev) => prev.filter((c) => c.id !== commentToDelete))
            toast.success('Dúvida apagada com sucesso!')
        } catch (err) {
            console.error('Erro ao apagar dúvida:', err)
            toast.error('Erro ao apagar dúvida')
        } finally {
            setDeleteDialogOpen(false)
            setCommentToDelete(null)
        }
    }

    function formatDate(timestamp: any): string {
        if (!timestamp) return ''
        try {
            const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
            return date.toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
            })
        } catch {
            return ''
        }
    }

    const filteredComments = comments.filter((c) => {
        if (filter === 'all') return true
        return c.status === filter
    })

    return (
        <div className="max-w-6xl w-full mx-auto px-6 md:px-8 py-8 font-montserrat animate-in fade-in duration-500">
            <header className="mb-10">
                <h1 className="text-2xl md:text-3xl font-bold tracking-tighter uppercase leading-none text-slate-900 max-w-xl">
                    Dúvidas dos <span className="text-[#1D5F31]">Alunos</span>
                </h1>
                <p className="text-slate-600 mt-3 text-[10px] font-bold uppercase tracking-[3px]">
                    Responda as dúvidas enviadas pelos alunos nas aulas.
                </p>
            </header>

            <div className="flex gap-2 mb-8">
                {(['all', 'pending', 'answered'] as const).map((f) => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`px-5 py-2 rounded-md text-[10px] font-bold uppercase tracking-widest transition-all ${
                            filter === f
                                ? 'bg-[#1D5F31] text-white shadow-sm'
                                : 'bg-white border border-gray-200 text-slate-600 hover:border-gray-400'
                        }`}
                    >
                        {f === 'all' ? 'Todas' : f === 'pending' ? 'Pendentes' : 'Respondidas'}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="flex justify-center py-20">
                    <Loader2 className="animate-spin text-[#1D5F31]" size={32} />
                </div>
            ) : filteredComments.length === 0 ? (
                <div className="text-center py-20">
                    <MessageCircle size={48} className="text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-500 font-bold uppercase tracking-widest text-sm">
                        Nenhuma dúvida encontrada
                    </p>
                </div>
            ) : (
                <div className="space-y-6">
                    {filteredComments.map((comment) => (
                        <div key={comment.id} className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm">
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-full bg-[#1D5F31]/10 flex items-center justify-center text-[#1D5F31] font-bold text-xs">
                                        {comment.studentName.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-sm text-slate-900">{comment.studentName}</h4>
                                        <div className="flex items-center gap-2 text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                                            <Clock size={10} />
                                            {formatDate(comment.createdAt)}
                                            <span className="text-slate-300 mx-1">|</span>
                                            {comment.lessonTitle}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span
                                        className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded ${
                                            comment.status === 'pending'
                                                ? 'bg-yellow-100 text-yellow-700 border border-yellow-300'
                                                : 'bg-green-100 text-green-700 border border-green-300'
                                        }`}
                                    >
                                        {comment.status === 'pending' ? 'Pendente' : 'Respondida'}
                                    </span>
                                    <button
                                        onClick={() => openDeleteDialog(comment.id)}
                                        className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded bg-red-100 text-red-700 border border-red-300 hover:bg-red-200 transition-colors"
                                    >
                                        Apagar
                                    </button>
                                </div>
                            </div>

                            <p className="text-sm text-slate-700 leading-relaxed mb-4">
                                {comment.content}
                            </p>

                            {comment.replies.length > 0 && (
                                <div className="border-l-4 border-green-500 pl-4 mb-4">
                                    <p className="text-green-600 font-semibold text-xs uppercase tracking-wider mb-1">
                                        Sua Resposta
                                    </p>
                                    {comment.replies.map((reply) => (
                                        <p key={reply.id} className="text-sm text-slate-600">
                                            {reply.content}
                                        </p>
                                    ))}
                                </div>
                            )}

                            {comment.status === 'pending' && (
                                <div>
                                    <textarea
                                        value={replyText[comment.id] || ''}
                                        onChange={(e) =>
                                            setReplyText((prev) => ({ ...prev, [comment.id]: e.target.value }))
                                        }
                                        placeholder="Digite sua resposta..."
                                        className="w-full border border-gray-200 rounded-md p-3 text-sm resize-none focus:outline-none focus:border-green-600 min-h-[80px]"
                                    />
                                    <div className="flex justify-end mt-3">
                                        <button
                                            onClick={() => handleReply(comment.id)}
                                            disabled={sending[comment.id] || !replyText[comment.id]?.trim()}
                                            className="bg-green-600 hover:bg-green-700 text-white font-semibold rounded-md px-5 py-2 text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                        >
                                            {sending[comment.id] ? (
                                                <Loader2 size={14} className="animate-spin" />
                                            ) : (
                                                <Send size={14} />
                                            )}
                                            Responder
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent className="bg-zinc-900 border border-zinc-700 rounded-2xl p-0 gap-0 w-full max-w-md">
                    <div className="flex flex-col items-center pt-10 pb-6 px-8">
                        <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-5">
                            <Trash2 size={32} className="text-red-400" />
                        </div>
                        <AlertDialogHeader className="text-center">
                            <AlertDialogTitle className="text-white text-xl font-semibold">
                                Apagar dúvida
                            </AlertDialogTitle>
                        </AlertDialogHeader>
                        <p className="text-zinc-400 text-sm text-center mt-2 leading-relaxed max-w-xs">
                            Tem certeza que deseja apagar esta dúvida? Ela será removida permanentemente para o aluno e o professor.
                        </p>
                    </div>
                    <AlertDialogFooter className="flex flex-row items-center justify-center gap-3 px-8 pb-8 pt-0 border-t border-zinc-800">
                        <AlertDialogCancel className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border-none rounded-xl py-2.5 text-sm font-semibold transition-all duration-200">
                            Cancelar
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmDelete}
                            className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl px-6 py-2.5 text-sm transition-all duration-200 flex items-center gap-2 justify-center"
                        >
                            <Trash2 size={16} />
                            Sim, apagar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
