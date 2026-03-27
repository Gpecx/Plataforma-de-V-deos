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
        setTimeout(() => {
            setIsSubmitted(false)
            setMessage('')
        }, 5000)
    }

    return (
        <div className="min-h-screen bg-transparent font-exo text-slate-900 p-6 md:p-12">
            {/* Aumentei a largura máxima para preencher melhor a tela */}
            <div className="max-w-5xl mx-auto mt-10">
                <Link
                    href="/dashboard-student"
                    className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-[#1D5F31] transition-colors mb-8 outline-none group"
                >
                    <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                    Voltar ao Painel
                </Link>

                {/* Removido rounded e adicionado borda mais forte */}
                <div className="bg-white border border-black shadow-sm rounded-xl overflow-hidden">
                    <div className="p-8 md:p-16">
                        <div className="mb-12">
                            <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tighter text-[#1a1a1a] mb-6">
                                MELHORIAS & <span className="text-[#1D5F31]">SUGESTÕES</span>
                            </h1>
                            <p className="text-xs md:text-sm font-bold uppercase tracking-widest text-slate-500 leading-relaxed max-w-2xl">
                                Sua voz ajuda a construir o futuro da PowerPlay. Compartilhe suas ideias para tornarmos nossa ferramenta ainda mais potente.
                            </p>
                        </div>

                        {!isSubmitted ? (
                            <form onSubmit={handleSubmit} className="space-y-8">
                                <div className="space-y-4">
                                    <label className="text-xs font-black uppercase tracking-[2px] text-[#1D5F31] ml-1">
                                        Como podemos melhorar sua experiência?
                                    </label>
                                    {/* Removido rounded-[40px] e ajustado foco */}
                                    <textarea
                                        required
                                        rows={8}
                                        value={message}
                                        onChange={(e) => setMessage(e.target.value)}
                                        placeholder="DESCREVA AQUI SUA IDEIA, SUGESTÃO OU FEEDBACK..."
                                        className="w-full bg-slate-50 border border-black text-slate-900 placeholder:text-slate-400 rounded-xl p-10 text-sm font-bold uppercase tracking-widest focus:outline-none focus:border-[#1D5F31] focus:ring-1 focus:ring-[#1D5F31] transition-all resize-none min-h-[300px]"
                                    />
                                </div>

                                {/* Botão Retangular com efeito de brilho PowerPlay */}
                                <button
                                    type="submit"
                                    className="w-full h-20 bg-[#1D5F31] hover:bg-[#00e602] border border-black text-white font-black uppercase tracking-[4px] rounded-xl transition-all flex items-center justify-center gap-4 active:scale-[0.99] py-6 shadow-lg shadow-[#1D5F31]/10"
                                >
                                    <Send size={20} strokeWidth={3} />
                                    ENVIAR AGORA
                                </button>
                            </form>
                        ) : (
                            <div className="py-20 flex flex-col items-center text-center animate-in fade-in slide-in-from-bottom-8 duration-700">
                                <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center text-[#1D5F31] mb-8">
                                    <CheckCircle2 size={48} strokeWidth={2.5} />
                                </div>
                                <h2 className="text-2xl font-black uppercase tracking-tighter text-[#1a1a1a] mb-4">SUGESTÃO RECEBIDA!</h2>
                                <p className="text-xs font-bold uppercase tracking-widest text-slate-500 max-w-md">
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