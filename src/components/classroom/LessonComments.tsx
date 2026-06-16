'use client'

import { useState, useEffect } from 'react'
import { MessageCircle, Send, Loader2 } from 'lucide-react'
import { auth } from '@/lib/firebase'
import { onAuthStateChanged } from 'firebase/auth'
import { Timestamp } from 'firebase/firestore'
import { createComment, getCommentsByLesson } from '@/lib/lesson-comments'
import { toast } from 'sonner'

interface Reply {
    id: string
    teacherId: string
    teacherName: string
    content: string
    createdAt: Timestamp
}

interface Comment {
    id: string
    lessonId: string
    courseId: string
    studentId: string
    studentName: string
    studentAvatar: string | null
    content: string
    status: 'pending' | 'answered'
    createdAt: Timestamp
    updatedAt: Timestamp
    replies: Reply[]
}

export function LessonComments({ lessonId, courseId }: { lessonId: string; courseId: string }) {
    const [comments, setComments] = useState<Comment[]>([])
    const [loading, setLoading] = useState(true)
    const [sending, setSending] = useState(false)
    const [text, setText] = useState('')
    const [userId, setUserId] = useState<string | null>(null)

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, (user) => {
            if (user) {
                setUserId(user.uid)
                loadComments(user.uid)
            } else {
                setLoading(false)
            }
        })
        return () => unsub()
    }, [lessonId])

    async function loadComments(_uid: string) {
        if (!lessonId) return
        setLoading(true)
        try {
            const data = await getCommentsByLesson(lessonId, courseId)
            setComments(data)
        } catch (err) {
            console.error('Erro ao carregar dúvidas:', err)
            toast.error('Erro ao carregar dúvidas')
        } finally {
            setLoading(false)
        }
    }

    async function handleSend() {
        if (!text.trim() || sending || !lessonId || !courseId) return
        setSending(true)
        try {
            await createComment(lessonId, courseId, text.trim())
            setText('')
            toast.success('Dúvida enviada com sucesso!')
            if (userId) {
                await loadComments(userId)
            }
        } catch (err) {
            console.error('Erro ao enviar dúvida:', err)
            const message = err instanceof Error ? err.message : 'Erro ao enviar dúvida'
            toast.error(message)
        } finally {
            setSending(false)
        }
    }

    function formatDate(timestamp: Timestamp | null | undefined): string {
        if (!timestamp) return ''
        try {
            const date = timestamp.toDate()
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

    return (
        <div>
            <h4 className="text-sm font-bold uppercase tracking-widest mb-4 flex items-center gap-2 text-white">
                <MessageCircle size={16} className="text-green-500" />
                Dúvidas e Comentários
            </h4>

            <div className="mb-6">
                <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Tem alguma dúvida sobre esta aula? Compartilhe aqui..."
                    className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white placeholder:text-gray-500 resize-none focus:outline-none focus:border-green-600 min-h-[100px]"
                />
                <div className="flex justify-end mt-3">
                    <button
                        onClick={handleSend}
                        disabled={sending || !text.trim()}
                        className="bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg px-6 py-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {sending ? (
                            <Loader2 size={16} className="animate-spin" />
                        ) : (
                            <Send size={16} />
                        )}
                        ENVIAR DÚVIDA
                    </button>
                </div>
            </div>

            {loading && (
                <div className="flex justify-center py-8">
                    <Loader2 size={24} className="animate-spin text-slate-400" />
                </div>
            )}

            {!loading && comments.length === 0 && (
                <p className="text-sm text-gray-400 text-center py-8">
                    Nenhuma dúvida registrada para esta aula ainda.
                </p>
            )}

            {!loading && comments.length > 0 && (
                <div className="space-y-4">
                    {comments.map((comment, index) => (
                        <div key={comment.id}>
                            <div className="bg-white/5 rounded-xl border border-white/10 p-4">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <span className="font-semibold text-white text-sm">
                                            {comment.studentName}
                                        </span>
                                        <span className="text-gray-400 text-xs">
                                            {formatDate(comment.createdAt)}
                                        </span>
                                    </div>
                                    <span
                                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                                            comment.status === 'pending'
                                                ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                                                : 'bg-green-500/10 text-green-400 border border-green-500/20'
                                        }`}
                                    >
                                        {comment.status === 'pending' ? 'AGUARDANDO RESPOSTA' : 'RESPONDIDA'}
                                    </span>
                                </div>
                                <p className="text-white text-sm leading-relaxed">
                                    {comment.content}
                                </p>
                            </div>

                            {comment.replies.length > 0 && (
                                <div className="ml-6 mt-3 border-l-4 border-green-600 pl-4 space-y-3">
                                    {comment.replies.map((reply) => (
                                        <div key={reply.id}>
                                            <div className="text-green-500 font-semibold text-xs uppercase tracking-wider mb-1">
                                                RESPOSTA DO PROFESSOR
                                            </div>
                                            <p className="text-gray-300 text-sm">
                                                {reply.content}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {index < comments.length - 1 && (
                                <div className="border-t border-white/5 mt-4" />
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
