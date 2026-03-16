"use client"

import { useState } from 'react'
import { Mail, Phone, MapPin, Send, CheckCircle2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Navbar from '@/components/Navbar'

export default function ContactPage() {
    const [isSubmitted, setIsSubmitted] = useState(false)

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        setIsSubmitted(true)
        setTimeout(() => setIsSubmitted(false), 5000)
    }

    return (
        <div className="min-h-screen bg-[#0d2b17]">
            <Navbar />
            <div className="text-white pt-32 pb-20 px-4 md:px-8 font-exo">
                {/* Removido o max-w-6xl para ocupar mais largura da tela */}
                <div className="w-full max-w-7xl mx-auto">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-stretch">

                        {/* Lado Esquerdo: Texto e Informações */}
                        <div className="flex flex-col justify-between space-y-12 bg-[#0f1f14] p-8 md:p-12 border border-[#1e4d2b]">
                            <div>
                                <h1 className="text-5xl md:text-7xl font-black tracking-tighter uppercase leading-none mb-6">
                                    VAMOS <span className="text-[#00C402]">CONVERSAR?</span>
                                </h1>
                                <p className="text-slate-400 text-lg font-medium max-w-md leading-relaxed">
                                    Estamos aqui para ajudar você a transformar sua carreira. Entre em contato conosco e tire suas dúvidas.
                                </p>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 gap-8">
                                <div className="flex items-center gap-6 group">
                                    <div className="w-14 h-14 bg-[#0d2b17] flex items-center justify-center border border-[#1e4d2b] group-hover:border-[#00C402] transition-all duration-300">
                                        <Mail className="text-[#00C402]" size={24} />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-[3px] text-slate-400 mb-1">E-mail</p>
                                        <p className="text-lg font-black tracking-tight text-white">comercial@gpecx.com</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-6 group">
                                    <div className="w-14 h-14 bg-[#0d2b17] flex items-center justify-center border border-[#1e4d2b] group-hover:border-[#00C402] transition-all duration-300">
                                        <Phone className="text-[#00C402]" size={24} />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-[3px] text-slate-400 mb-1">Telefone</p>
                                        <p className="text-lg font-black tracking-tight text-white">(19) 99913-2414</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-6 group">
                                    <div className="w-14 h-14 bg-[#0d2b17] flex items-center justify-center border border-[#1e4d2b] group-hover:border-[#00C402] transition-all duration-300">
                                        <MapPin className="text-[#00C402]" size={24} />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-[3px] text-slate-400 mb-1">Endereço</p>
                                        <p className="text-lg font-black tracking-tight text-white">Campinas, São Paulo</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Lado Direito: Formulário */}
                        <div className="bg-[#0f1f14] p-8 md:p-12 border-2 border-[#1e4d2b] relative overflow-hidden flex flex-col justify-center">
                            <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
                                <div className="space-y-2">
                                    <Label htmlFor="name" className="text-[10px] font-black uppercase tracking-widest text-[#00C402]">Nome Completo</Label>
                                    <Input
                                        id="name"
                                        placeholder="COMO PODEMOS TE CHAMAR?"
                                        required
                                        className="bg-[#0d2b17] border-[#1e4d2b] text-white placeholder:text-slate-700 rounded-none h-14 text-xs font-bold uppercase tracking-widest px-6 focus:border-[#00C402] focus:ring-0"
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="email" className="text-[10px] font-black uppercase tracking-widest text-[#00C402]">E-mail</Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            placeholder="SEU MELHOR E-MAIL"
                                            required
                                            className="bg-[#0d2b17] border-[#1e4d2b] text-white placeholder:text-slate-700 rounded-none h-14 text-xs font-bold uppercase tracking-widest px-6 focus:border-[#00C402] focus:ring-0"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="phone" className="text-[10px] font-black uppercase tracking-widest text-[#00C402]">Telefone</Label>
                                        <Input
                                            id="phone"
                                            placeholder="(00) 00000-0000"
                                            className="bg-[#0d2b17] border-[#1e4d2b] text-white placeholder:text-slate-700 rounded-none h-14 text-xs font-bold uppercase tracking-widest px-6 focus:border-[#00C402] focus:ring-0"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="message" className="text-[10px] font-black uppercase tracking-widest text-[#00C402]">Mensagem</Label>
                                    <textarea
                                        id="message"
                                        placeholder="EM QUE PODEMOS AJUDAR?"
                                        required
                                        rows={6}
                                        className="w-full bg-[#0d2b17] border border-[#1e4d2b] text-white placeholder:text-slate-700 rounded-none p-6 text-xs font-bold uppercase tracking-widest focus:outline-none focus:border-[#00C402] transition-all"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    className="w-full h-16 bg-[#00C402] hover:bg-[#00e602] text-white font-black uppercase italic tracking-[3px] rounded-none transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                                    disabled={isSubmitted}
                                >
                                    {isSubmitted ? (
                                        <>
                                            <CheckCircle2 size={24} strokeWidth={3} />
                                            MENSAGEM ENVIADA
                                        </>
                                    ) : (
                                        <>
                                            <Send size={24} strokeWidth={3} />
                                            ENVIAR AGORA
                                        </>
                                    )}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}