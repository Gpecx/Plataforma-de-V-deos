"use client"

import { Zap, CheckCircle2, ArrowRight, ShieldCheck, Star } from 'lucide-react'

export default function SubscriptionsPage() {
    return (
        <div className="p-8 md:p-12 min-h-screen font-exo text-slate-800 animate-in fade-in duration-500">
            <header className="mb-12">
                <div className="flex items-center gap-3 mb-2">
                    <span className="text-[10px] font-black uppercase tracking-[5px] text-[#00C402]">PLANO ATUAL</span>
                </div>
                <h1 className="text-4xl font-black tracking-tighter text-slate-900 uppercase">
                    GESTÃO DE <span className="text-[#00C402]">ASSINATURA</span>
                </h1>
                <p className="text-slate-400 font-bold text-xs tracking-widest uppercase mt-2">Controle seus benefícios e detalhes do seu plano.</p>
            </header>

            <div className="max-w-4xl space-y-12">
                {/* Card do Plano Ativo */}
                <div className="bg-white rounded-[48px] border border-slate-100 p-12 md:p-16 shadow-xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-1/3 h-full bg-slate-50/50 -skew-x-12 translate-x-1/2 pointer-events-none transition-transform group-hover:translate-x-1/3 duration-1000"></div>

                    <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
                        <div className="space-y-8">
                            <div className="inline-flex items-center gap-3 bg-slate-900 text-white px-5 py-2.5 rounded-full">
                                <Star size={14} className="text-[#00C402] fill-[#00C402]" />
                                <span className="text-[10px] font-black uppercase tracking-[3px]">STATUS: ATIVA</span>
                            </div>

                            <div>
                                <h2 className="text-5xl font-black tracking-tighter text-slate-900 mb-2">PREMIUM <span className="text-[#00C402]">ELITE</span></h2>
                                <p className="text-slate-400 text-sm font-bold uppercase tracking-widest italic">Acesso total ao Ecossistema SPCS Academy</p>
                            </div>

                            <div className="flex items-baseline gap-2">
                                <span className="text-4xl font-black tracking-tighter text-slate-800">R$ 49,90</span>
                                <span className="text-slate-400 text-xs font-black uppercase tracking-widest">/ mês</span>
                            </div>

                            <div className="space-y-3">
                                {['Todos os Treinamentos', 'Certificados Ilimitados', 'Mentorias ao Vivo', 'Comunidade Exclusiva'].map(item => (
                                    <div key={item} className="flex items-center gap-3">
                                        <CheckCircle2 size={16} className="text-[#00C402]" />
                                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">{item}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="bg-[#F8F9FA] rounded-[32px] p-8 border border-slate-100 shadow-sm">
                                <div className="space-y-6">
                                    <div>
                                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Próxima Renovação</p>
                                        <p className="text-lg font-black tracking-tight text-slate-800">22 de Março, 2026</p>
                                    </div>
                                    <div className="h-px bg-slate-200" />
                                    <div>
                                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Método de Pagamento</p>
                                        <p className="text-sm font-bold text-slate-600 uppercase tracking-widest tracking-tighter">Cartão final 4242</p>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <button className="h-14 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-slate-800 transition shadow-lg">
                                    Fazer Upgrade
                                </button>
                                <button className="h-14 border border-slate-200 text-slate-400 text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition-all">
                                    Cancelar Plano
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Banner de Segurança */}
                <div className="bg-[#00C402]/5 rounded-[32px] p-8 flex flex-col md:flex-row items-center justify-between gap-8 border border-[#00C402]/10 transition-all hover:border-[#00C402]/20">
                    <div className="flex items-center gap-6">
                        <div className="w-16 h-16 rounded-[24px] bg-white flex items-center justify-center text-[#00C402] shadow-sm">
                            <ShieldCheck size={32} />
                        </div>
                        <div>
                            <h3 className="text-sm font-black uppercase tracking-widest text-slate-800">Pagamento 100% Seguro</h3>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Sua renovação é protegida pela criptografia SPCS Shield.</p>
                        </div>
                    </div>
                    <button className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[3px] text-[#00C402] hover:text-slate-900 transition-colors">
                        CONHECER POLÍTICA DE REEMBOLSO <ArrowRight size={14} />
                    </button>
                </div>
            </div>
        </div>
    )
}
