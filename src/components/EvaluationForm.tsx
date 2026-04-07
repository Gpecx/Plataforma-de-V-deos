'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Star, Send, Loader2 } from 'lucide-react'
import { submitEvaluation } from '@/app/actions/evaluation-actions'

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
                setRating(0)
                setComment('')
            } else {
                setError(result.error || 'Erro ao enviar avaliação.')
            }
        } catch (err) {
            setError('Erro ao enviar avaliação.')
        } finally {
            setIsSubmitting(false)
        }
    }

    if (success) {
        return (
            <div className="flex flex-col items-center justify-center py-16 text-center">
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-20 h-20 bg-[#1D5F31]/10 rounded-full flex items-center justify-center mb-6"
                >
                    <Star className="w-10 h-10 text-[#1D5F31] fill-[#1D5F31]" />
                </motion.div>
                <h3 className="text-2xl font-bold text-slate-900 mb-2">Obrigado!</h3>
                <p className="text-slate-600 mb-6">Sua avaliação foi enviada com sucesso.</p>
                <button
                    onClick={() => setSuccess(false)}
                    className="text-[#1D5F31] font-bold uppercase text-sm tracking-widest hover:underline"
                >
                    Fazer nova avaliação
                </button>
            </div>
        )
    }

    return (
        <form onSubmit={handleSubmit} className="max-w-xl mx-auto py-8">
            <div className="text-center mb-10">
                <h3 className="text-xl font-bold uppercase tracking-tight text-slate-900 mb-2">
                    Avalie seu Professor
                </h3>
                <p className="text-sm text-slate-600">
                    Sua avaliação ajuda outros alunos e incentiva o professor a melhorar.
                </p>
            </div>

            <div className="flex justify-center gap-3 mb-8">
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
                            size={40}
                            className={`transition-colors ${
                                star <= (hoverRating || rating)
                                    ? 'text-yellow-400 fill-yellow-400'
                                    : 'text-slate-300'
                            }`}
                        />
                    </motion.button>
                ))}
            </div>

            {rating > 0 && (
                <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mb-8"
                >
                    <label className="block text-xs font-bold uppercase tracking-widest text-slate-700 mb-3">
                        Comentário (opcional)
                    </label>
                    <textarea
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="Conte sua experiência com este curso..."
                        className="w-full h-32 p-4 border-2 border-slate-200 rounded-xl text-sm font-medium focus:border-[#1D5F31] focus:outline-none resize-none placeholder:text-slate-400"
                    />
                </motion.div>
            )}

            {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm font-medium">
                    {error}
                </div>
            )}

            <button
                type="submit"
                disabled={isSubmitting || rating === 0}
                className={`w-full py-4 px-8 rounded-xl font-bold uppercase tracking-widest text-sm flex items-center justify-center gap-3 transition-all ${
                    rating === 0
                        ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                        : 'bg-[#1D5F31] text-white hover:bg-[#1D5F31]/90'
                }`}
            >
                {isSubmitting ? (
                    <>
                        <Loader2 className="animate-spin" size={20} />
                        Enviando...
                    </>
                ) : (
                    <>
                        <Send size={20} />
                        Enviar Avaliação
                    </>
                )}
            </button>
        </form>
    )
}