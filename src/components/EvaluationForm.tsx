'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Star, Send, Loader2 } from 'lucide-react'
import { submitEvaluation, getUserCourseEvaluation } from '@/app/actions/evaluation-actions'

interface EvaluationFormProps {
    courseId: string
}

export function EvaluationForm({ courseId }: EvaluationFormProps) {
    const [rating, setRating] = useState(0)
    const [hoverRating, setHoverRating] = useState(0)
    const [comment, setComment] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [success, setSuccess] = useState(false)
    const [error, setError] = useState('')

    // Controle de Unicidade de Avaliação por Aluno
    const [existingEval, setExistingEval] = useState<{ rating: number; comment: string } | null>(null)
    const [loadingExisting, setLoadingExisting] = useState(true)
    const [isEditing, setIsEditing] = useState(false)

    useEffect(() => {
        async function checkExisting() {
            try {
                const res = await getUserCourseEvaluation(courseId)
                if (res.success && res.evaluation) {
                    setExistingEval(res.evaluation)
                    setRating(res.evaluation.rating)
                    setComment(res.evaluation.comment)
                }
            } catch (err) {
                console.error("Error checking existing evaluation:", err)
            } finally {
                setLoadingExisting(false)
            }
        }
        checkExisting()
    }, [courseId])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (rating === 0) {
            setError('Por favor, selecione uma avaliação.')
            return
        }

        setIsSubmitting(true)
        setError('')

        try {
            const result = await submitEvaluation(courseId, rating, comment)
            if (result.success) {
                setSuccess(true)
                setExistingEval({ rating, comment })
                setIsEditing(false)
            } else {
                setError(result.error || 'Erro ao enviar avaliação.')
            }
        } catch {
            setError('Erro ao enviar avaliação.')
        } finally {
            setIsSubmitting(false)
        }
    }

    if (loadingExisting) {
        return (
            <div className="flex flex-col items-center justify-center py-16 text-center space-y-4">
                <Loader2 className="animate-spin text-[#1D5F31] w-8 h-8" />
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Buscando avaliação...</p>
            </div>
        )
    }

    // Tela de Sucesso após Envio Recente (Perfeitamente integrada com o Fundo Azul Escuro)
    if (success) {
        return (
            <div className="flex flex-col items-center justify-center py-16 text-center max-w-xl mx-auto bg-slate-900/30 p-8 rounded-2xl border border-slate-800/80 shadow-xl backdrop-blur-md">
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-16 h-16 bg-[#1D5F31]/10 rounded-full flex items-center justify-center mb-6"
                >
                    <Star className="w-8 h-8 text-[#1D5F31] fill-[#1D5F31]" />
                </motion.div>
                <h3 className="text-xl font-bold text-white mb-2 uppercase tracking-tight">Obrigado!</h3>
                <p className="text-slate-300 mb-6 text-xs font-medium">Sua avaliação foi enviada com sucesso.</p>
                <button
                    onClick={() => setSuccess(false)}
                    className="text-[#1D5F31] font-bold uppercase text-xs tracking-widest hover:underline"
                >
                    Visualizar Minha Avaliação
                </button>
            </div>
        )
    }

    // Trava de UI: Visualização Premium Read-only Integrada no Fundo Azul Escuro
    if (existingEval && !isEditing) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-center max-w-xl mx-auto bg-slate-900/30 p-8 rounded-2xl border border-slate-800/80 shadow-xl backdrop-blur-md">
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-14 h-14 bg-[#1D5F31]/10 rounded-full flex items-center justify-center mb-5"
                >
                    <Star className="w-6 h-6 text-[#1D5F31] fill-[#1D5F31]" />
                </motion.div>
                <h3 className="text-lg font-bold text-white mb-2 uppercase tracking-tight">
                    Avaliação Enviada!
                </h3>
                <p className="text-slate-400 mb-5 text-[10px] font-semibold tracking-wide uppercase">
                    Obrigado! Sua avaliação foi enviada com sucesso.
                </p>

                {/* Exibição Detalhada da Nota Atual (Dark Style) */}
                <div className="w-full bg-slate-950/40 rounded-xl p-5 mb-6 border border-slate-800/60 text-center">
                    <div className="flex gap-1.5 mb-3 justify-center">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                                key={star}
                                size={20}
                                className={star <= existingEval.rating ? 'text-[#1D5F31] fill-[#1D5F31]' : 'text-slate-700'}
                            />
                        ))}
                    </div>
                    {existingEval.comment ? (
                        <p className="text-slate-200 text-sm font-medium italic text-center leading-relaxed">
                            &ldquo;{existingEval.comment}&rdquo;
                        </p>
                    ) : (
                        <p className="text-slate-500 text-xs font-medium italic">
                            Sem comentário inserido
                        </p>
                    )}
                </div>

                <button
                    onClick={() => setIsEditing(true)}
                    className="w-full py-3.5 px-8 rounded-xl font-bold uppercase tracking-widest text-[10px] bg-slate-950/50 text-[#1D5F31] border-2 border-[#1D5F31] hover:bg-[#1D5F31]/10 transition-all shadow-sm"
                >
                    Editar Minha Avaliação
                </button>
            </div>
        )
    }

    // Formulário de Avaliação Integrado no Fundo Azul Escuro
    return (
        <form onSubmit={handleSubmit} className="max-w-xl mx-auto py-8 bg-slate-900/10 p-8 rounded-2xl border border-slate-800/30 backdrop-blur-sm">
            <div className="text-center mb-8">
                <h3 className="text-lg font-bold uppercase tracking-tight text-white mb-2">
                    {existingEval ? 'Atualizar Avaliação' : 'Avalie seu Professor'}
                </h3>
                <p className="text-xs text-slate-400 font-medium">
                    {existingEval 
                        ? 'Edite sua nota e comentário para atualizar sua avaliação anterior.' 
                        : 'Sua avaliação ajuda outros alunos e incentiva o professor a melhorar.'}
                </p>
            </div>

            <div className="flex justify-center gap-3 mb-6">
                {[1, 2, 3, 4, 5].map((star) => (
                    <motion.button
                        key={star}
                        type="button"
                        whileHover={{ scale: 1.2 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        className="focus:outline-none"
                    >
                        <Star
                            size={36}
                            className={`transition-colors ${
                                star <= (hoverRating || rating)
                                    ? 'text-yellow-400 fill-yellow-400'
                                    : 'text-slate-700'
                            }`}
                        />
                    </motion.button>
                ))}
            </div>

            {rating > 0 && (
                <motion.div
                    initial={{ opacity: 0, maxHeight: 0 }}
                    animate={{ opacity: 1, maxHeight: 300 }}
                    className="mb-6 overflow-hidden"
                >
                    <label className="block text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-2">
                        Comentário (opcional)
                    </label>
                    <textarea
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="Conte sua experiência com este curso..."
                        className="w-full h-28 p-4 bg-slate-950/40 border-2 border-slate-800 text-white rounded-xl text-sm font-medium focus:border-[#1D5F31] focus:outline-none resize-none placeholder:text-slate-600"
                    />
                </motion.div>
            )}

            {error && (
                <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs font-semibold">
                    {error}
                </div>
            )}

            <div className="flex gap-4">
                {existingEval && (
                    <button
                        type="button"
                        onClick={() => {
                            setIsEditing(false)
                            setRating(existingEval.rating)
                            setComment(existingEval.comment)
                        }}
                        className="flex-1 py-3.5 px-6 rounded-xl font-bold uppercase tracking-widest text-[9px] text-slate-400 border-2 border-slate-800 hover:bg-slate-950/30 transition-all"
                    >
                        Cancelar
                    </button>
                )}
                <button
                    type="submit"
                    disabled={isSubmitting || rating === 0}
                    className={`flex-grow py-3.5 px-6 rounded-xl font-bold uppercase tracking-widest text-[9px] flex items-center justify-center gap-3 transition-all ${
                        rating === 0
                            ? 'bg-slate-950/40 text-slate-600 border border-slate-800/40 cursor-not-allowed'
                            : 'bg-[#1D5F31] text-white hover:bg-[#1D5F31]/90'
                    }`}
                >
                    {isSubmitting ? (
                        <>
                            <Loader2 className="animate-spin" size={14} />
                            Enviando...
                        </>
                    ) : (
                        <>
                            <Send size={14} />
                            {existingEval ? 'Salvar Alterações' : 'Enviar Avaliação'}
                        </>
                    )}
                </button>
            </div>
        </form>
    )
}