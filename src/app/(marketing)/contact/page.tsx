"use client"

import { useState } from 'react'
import { Mail, Phone, MapPin, Send, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Navbar from '@/components/Navbar'

export default function ContactPage() {
    const [isSubmitted, setIsSubmitted] = useState(false)

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        // Simulação de envio
        setIsSubmitted(true)
        setTimeout(() => setIsSubmitted(false), 5000)
    }

    return (
        <div className="min-h-screen bg-[#F4F7F9]">
            <Navbar />
            <div className="text-slate-700 pt-32 pb-20 px-4 md:px-8 font-exo">
                <div className="max-w-6xl mx-auto">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
                        {/* Lado Esquerdo: Texto e Informações */}
                        <div className="space-y-12">
                            <div>
                                <h1 className="text-5xl md:text-7xl font-black tracking-tighter uppercase leading-none mb-6">
                                    VAMOS <span className="text-[#00C402]">CONVERSAR?</span>
                                </h1>
                                <p className="text-slate-500 text-lg font-medium max-w-md leading-relaxed">
                                    Estamos aqui para ajudar você a transformar sua carreira. Entre em contato conosco e tire suas dúvidas.
                                </p>
                            </div>

                            <div className="space-y-8">
                                <div className="flex items-center gap-6 group">
                                    <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center border border-slate-100 group-hover:border-[#00C402]/50 shadow-sm transition-all duration-500">
                                        <Mail className="text-[#00C402]" size={24} />
                                    </div>
                                    <div className="relative">
                                        <p className="text-[10px] font-black uppercase tracking-[3px] text-slate-400 mb-1">E-mail</p>
                                        <p className="text-xl font-black tracking-tight text-slate-700">comercial@gpecx.com</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-6 group">
                                    <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center border border-slate-100 group-hover:border-[#00C402]/50 shadow-sm transition-all duration-500">
                                        <Phone className="text-[#00C402]" size={24} />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-[3px] text-slate-400 mb-1">Telefone</p>
                                        <p className="text-xl font-black tracking-tight text-slate-700">(19) 99913-2414</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-6 group">
                                    <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center border border-slate-100 group-hover:border-[#00C402]/50 shadow-sm transition-all duration-500">
                                        <MapPin className="text-[#00C402]" size={24} />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-[3px] text-slate-400 mb-1">Endereço</p>
                                        <p className="text-xl font-black tracking-tight text-slate-700">Campinas, São Paulo</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Lado Direito: Formulário */}
                        <div className="bg-white p-8 md:p-12 rounded-[40px] border border-slate-100 shadow-sm relative overflow-hidden">
                            <div className="absolute -top-10 -right-10 w-40 h-40 bg-[#00C402]/5 blur-[100px] pointer-events-none"></div>

                            <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
                                <div className="space-y-2">
                                    <Label htmlFor="name" className="text-[10px] font-black uppercase tracking-widest text-black">Nome Completo</Label>
                                    <Input
                                        id="name"
                                        placeholder="COMO PODEMOS TE CHAMAR?"
                                        required
                                        className="bg-slate-50 border-slate-100 text-black placeholder:text-slate-400 rounded-xl h-14 text-xs font-bold uppercase tracking-widest px-6 focus:border-[#00C402] focus:ring-0"
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="email" className="text-[10px] font-black uppercase tracking-widest text-black">E-mail</Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            placeholder="SEU MELHOR E-MAIL"
                                            required
                                            className="bg-slate-50 border-slate-100 text-black placeholder:text-slate-400 rounded-xl h-14 text-xs font-bold uppercase tracking-widest px-6 focus:border-[#00C402] focus:ring-0"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="phone" className="text-[10px] font-black uppercase tracking-widest text-black">Telefone</Label>
                                        <Input
                                            id="phone"
                                            placeholder="(00) 00000-0000"
                                            className="bg-slate-50 border-slate-100 text-black placeholder:text-slate-400 rounded-xl h-14 text-xs font-bold uppercase tracking-widest px-6 focus:border-[#00C402] focus:ring-0"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="message" className="text-[10px] font-black uppercase tracking-widest text-black">Mensagem</Label>
                                    <textarea
                                        id="message"
                                        placeholder="EM QUE PODEMOS AJUDAR?"
                                        required
                                        rows={4}
                                        className="w-full bg-slate-50 border border-slate-100 text-black placeholder:text-slate-400 rounded-xl p-6 text-xs font-bold uppercase tracking-widest focus:outline-none focus:border-[#00C402] transition-all"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    className="w-full h-16 bg-[#00A859] hover:brightness-110 text-black font-black uppercase italic tracking-[3px] rounded-2xl transition-all shadow-[0_0_30px_rgba(0,168,89,0.3)] flex items-center justify-center gap-3 disabled:opacity-50"
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
