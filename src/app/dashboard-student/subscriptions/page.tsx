"use client"

import { Zap, CheckCircle2, ArrowRight, ShieldCheck, Star } from 'lucide-react'

export default function SubscriptionsPage() {
    return (
        <div className="p-8 md:p-12 min-h-screen font-exo text-white bg-[#0d2b17] animate-in fade-in duration-500">
            <header className="mb-12">
                <div className="flex items-center gap-3 mb-2">
                    <span className="text-[10px] font-black uppercase tracking-[5px] text-[#00C402]">PLANO ATUAL</span>
                </div>
                <h1 className="text-4xl font-black tracking-tighter text-white uppercase">
                    GESTÃO DE <span className="text-[#00C402]">ASSINATURA</span>
                </h1>
                <p className="text-slate-400 font-bold text-xs tracking-widest uppercase mt-2">Controle seus benefícios e detalhes do seu plano.</p>
            </header>

            {/* Layout em grid para preencher a largura */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                {/* Card do Plano Ativo */}
                <div className="bg-[#0f1f14] border-2 border-[#1e4d2b] p-12 md:p-16 relative overflow-hidden">
                    <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
                        <div className="space-y-8">
                            <div className="inline-flex items-center gap-3 bg-[#0d2b17] text-white px-5 py-2.5 border border-[#1e4d2b]">
                                <Star size={14} className="text-[#00C402] fill-[#00C402]" />
                                <span className="text-[10px] font-black uppercase tracking-[3px]">STATUS: ATIVA</span>
                            </div>

                            <div>
                                <h2 className="text-5xl font-black tracking-tighter text-white mb-2">PREMIUM <span className="text-[#00C402]">ELITE</span></h2>
                                <p className="text-slate-400 text-sm font-bold uppercase tracking-widest italic">Acesso total ao Ecossistema PowerPlay</p>
                            </div>

                            <div className="flex items-baseline gap-2">
                                <span className="text-4xl font-black tracking-tighter text-white">R$ 49,90</span>
                                <span className="text-slate-400 text-xs font-black uppercase tracking-widest">/ mês</span>
                            </div>

                            <div className="space-y-3">
                                {['Todos os Treinamentos', 'Certificados Ilimitados', 'Mentorias ao Vivo', 'Comunidade Exclusiva'].map(item => (
                                    <div key={item} className="flex items-center gap-3">
                                        <CheckCircle2 size={16} className="text-[#00C402]" />
                                        <span className="text-xs font-bold text-slate-300 uppercase tracking-wide">{item}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="bg-[#0d2b17] p-8 border-2 border-[#1e4d2b]">
                                <div className="space-y-6">
                                    <div>
                                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Próxima Renovação</p>
                                        <p className="text-lg font-black tracking-tight text-white">22 de Março, 2026</p>
                                    </div>
                                    <div className="h-px bg-[#1e4d2b]" />
                                    <div>
                                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Método de Pagamento</p>
                                        <p className="text-sm font-bold text-slate-300 uppercase tracking-widest tracking-tighter">Cartão final 4242</p>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <button className="h-14 bg-white text-black text-[10px] font-black uppercase tracking-widest hover:bg-[#00C402] hover:text-white transition-all">
                                    Fazer Upgrade
                                </button>
                                <button className="h-14 border-2 border-[#1e4d2b] text-slate-400 text-[10px] font-black uppercase tracking-widest hover:border-red-500 hover:text-red-500 transition-all">
                                    Cancelar Plano
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Banner de Segurança - Posicionado ao lado no XL */}
                <div className="bg-[#0f1f14] border-2 border-[#1e4d2b] p-8 flex flex-col justify-center">
                    <div className="flex items-center gap-6">
                        <div className="w-16 h-16 bg-[#0d2b17] border-2 border-[#1e4d2b] flex items-center justify-center text-[#00C402]">
                            <ShieldCheck size={32} />
                        </div>
                        <div>
                            <h3 className="text-sm font-black uppercase tracking-widest text-white">Pagamento 100% Seguro</h3>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Sua renovação é protegida pela criptografia PowerPlay Shield.</p>
                        </div>
                    </div>
                    <button className="mt-8 flex items-center gap-2 text-[10px] font-black uppercase tracking-[3px] text-[#00C402] hover:text-white transition-colors">
                        CONHECER POLÍTICA DE REEMBOLSO <ArrowRight size={14} />
                    </button>
                </div>
            </div>
        </div>
    )
}