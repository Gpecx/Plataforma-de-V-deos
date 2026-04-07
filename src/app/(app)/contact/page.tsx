"use client"

import { useState, Suspense } from 'react'
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
        <div className="min-h-screen bg-white"> {/* Fundo branco unificado com o tema clean */}
            <Suspense fallback={null}>
                <Navbar light={true} />
            </Suspense>
            <div className="pt-32 pb-20 px-4 md:px-8 font-montserrat">
                <div className="w-full max-w-7xl mx-auto">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">

                        {/* Lado Esquerdo: Texto e Informações */}
                        <div className="flex flex-col justify-between space-y-12 bg-white p-8 md:p-12 rounded-2xl shadow-sm border border-black">
                            <div>
                                <h1 className="text-3xl md:text-5xl font-bold tracking-tighter uppercase leading-none mb-6 text-slate-900 max-w-2xl">
                                    VAMOS <span className="text-[#1D5F31]">CONVERSAR?</span>
                                </h1>
                                <p className="text-slate-600 text-lg font-medium max-w-md leading-relaxed">
                                    Estamos aqui para ajudar você a transformar sua carreira. Entre em contato conosco e tire suas dúvidas.
                                </p>
                            </div>

                            <div className="grid grid-cols-1 gap-8">
                                {/* Item de Contato */}
                                <div className="flex items-center gap-6 group">
                                    <div className="w-14 h-14 bg-slate-50 flex items-center justify-center rounded-xl border border-slate-200 group-hover:border-[#1D5F31] transition-all duration-300">
                                        <Mail className="text-[#1D5F31]" size={24} />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold uppercase tracking-[3px] text-slate-400 mb-1">E-mail</p>
                                        <p className="text-lg font-bold tracking-tight text-slate-900">comercial@gpecx.com</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-6 group">
                                    <div className="w-14 h-14 bg-slate-50 flex items-center justify-center rounded-xl border border-black group-hover:border-[#1D5F31] transition-all duration-300">
                                        <Phone className="text-[#1D5F31]" size={24} />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold uppercase tracking-[3px] text-slate-400 mb-1">Telefone</p>
                                        <p className="text-lg font-bold tracking-tight text-slate-900">(19) 99913-2414</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-6 group">
                                    <div className="w-14 h-14 bg-slate-50 flex items-center justify-center rounded-xl border border-black group-hover:border-[#1D5F31] transition-all duration-300">
                                        <MapPin className="text-[#1D5F31]" size={24} />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold uppercase tracking-[3px] text-slate-400 mb-1">Endereço</p>
                                        <p className="text-lg font-bold tracking-tight text-slate-900">Campinas, São Paulo</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Lado Direito: Formulário */}
                        <div className="bg-white p-8 md:p-12 rounded-2xl shadow-xl border border-black relative overflow-hidden flex flex-col justify-center">
                            <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
                                <div className="space-y-2">
                                    <Label htmlFor="name" className="text-[10px] font-bold uppercase tracking-widest text-slate-900">Nome Completo</Label>
                                    <Input
                                        id="name"
                                        placeholder="COMO PODEMOS TE CHAMAR?"
                                        required
                                        className="bg-slate-50 border-black text-slate-900 placeholder:text-slate-400 rounded-lg h-14 text-xs font-bold uppercase tracking-widest px-6 focus:border-[#1D5F31] focus:ring-1 focus:ring-[#1D5F31] transition-all"
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="email" className="text-[10px] font-bold uppercase tracking-widest text-slate-900">E-mail</Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            placeholder="SEU MELHOR E-MAIL"
                                            required
                                            className="bg-slate-50 border-black text-slate-900 placeholder:text-slate-400 rounded-lg h-14 text-xs font-bold uppercase tracking-widest px-6 focus:border-[#1D5F31] focus:ring-1 focus:ring-[#1D5F31]"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="phone" className="text-[10px] font-bold uppercase tracking-widest text-slate-900">Telefone</Label>
                                        <Input
                                            id="phone"
                                            placeholder="(00) 00000-0000"
                                            className="bg-slate-50 border-black text-slate-900 placeholder:text-slate-400 rounded-lg h-14 text-xs font-bold uppercase tracking-widest px-6 focus:border-[#1D5F31] focus:ring-1 focus:ring-[#1D5F31]"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="message" className="text-[10px] font-bold uppercase tracking-widest text-slate-900">Mensagem</Label>
                                    <textarea
                                        id="message"
                                        placeholder="EM QUE PODEMOS AJUDAR?"
                                        required
                                        rows={5}
                                        className="w-full bg-slate-50 border border-black text-slate-900 placeholder:text-slate-400 rounded-lg p-6 text-xs font-bold uppercase tracking-widest focus:outline-none focus:border-[#1D5F31] focus:ring-1 focus:ring-[#1D5F31] transition-all"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    className="w-full h-16 bg-[#1D5F31] border border-black hover:bg-[#164a26] text-white font-bold uppercase  tracking-[3px] rounded-lg transition-all shadow-lg shadow-green-900/10 flex items-center justify-center gap-3 disabled:opacity-50"
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