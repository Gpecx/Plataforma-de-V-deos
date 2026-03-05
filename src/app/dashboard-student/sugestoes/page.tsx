"use client"

import { useState } from 'react'
import { Send, CheckCircle2, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function SugestoesPage() {
    const [isSubmitted, setIsSubmitted] = useState(false)
    const [message, setMessage] = useState('')

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        setIsSubmitted(true)
        // Simulando envio
        setTimeout(() => {
            setIsSubmitted(false)
            setMessage('')
        }, 5000)
    }

    return (
        <div className="min-h-screen bg-slate-50 font-exo text-slate-800 p-6 md:p-12">
            <div className="max-w-3xl mx-auto mt-10">
                <Link
                    href="/dashboard-student"
                    className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-colors mb-8 outline-none group"
                >
                    <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                    Voltar ao Painel
                </Link>

                <div className="bg-white rounded-[48px] shadow-sm border border-slate-100 overflow-hidden">
                    <div className="p-8 md:p-16">
                        <div className="mb-12">
                            <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tighter text-slate-900 mb-4">
                                MELHORIAS & <span className="text-[#00C402]">SUGESTÕES</span>
                            </h1>
                            <p className="text-xs md:text-sm font-bold uppercase tracking-widest text-slate-400 leading-relaxed max-w-xl">
                                Sua voz ajuda a construir o futuro da SPCS Academy. Compartilhe suas ideias para tornarmos nossa ferramenta ainda mais potente.
                            </p>
                        </div>

                        {!isSubmitted ? (
                            <form onSubmit={handleSubmit} className="space-y-8">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">
                                        Como podemos melhorar sua experiência?
                                    </label>
                                    <textarea
                                        required
                                        rows={6}
                                        value={message}
                                        onChange={(e) => setMessage(e.target.value)}
                                        placeholder="ESCREVA AQUI SUA IDEIA OU SUGESTÃO..."
                                        className="w-full bg-slate-50 border border-slate-100 text-slate-700 placeholder:text-slate-300 rounded-[32px] p-8 text-sm font-bold uppercase tracking-widest focus:outline-none focus:border-[#00C402] transition-all resize-none min-h-[240px] shadow-inner"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    className="w-full h-18 bg-[#00C402] hover:bg-[#00a302] text-white font-black uppercase tracking-[4px] rounded-[24px] transition-all shadow-[0_10px_30px_-5px_rgba(0,196,2,0.3)] flex items-center justify-center gap-4 active:scale-[0.98] py-6"
                                >
                                    <Send size={20} strokeWidth={3} />
                                    ENVIAR AGORA
                                </button>
                            </form>
                        ) : (
                            <div className="py-20 flex flex-col items-center text-center animate-in fade-in slide-in-from-bottom-8 duration-700">
                                <div className="w-24 h-24 rounded-full bg-[#00C402]/10 flex items-center justify-center text-[#00C402] mb-8">
                                    <CheckCircle2 size={48} strokeWidth={2.5} />
                                </div>
                                <h2 className="text-2xl font-black uppercase tracking-tighter text-slate-900 mb-4">SUGESTÃO RECEBIDA!</h2>
                                <p className="text-xs font-bold uppercase tracking-widest text-slate-400 max-w-md">
                                    Obrigado, guerreiro! Recebemos sua mensagem e nossa equipe vai analisar com carinho para as próximas atualizações.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
