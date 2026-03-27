"use client"

import { Zap, CheckCircle2, ArrowRight, ShieldCheck, Star } from 'lucide-react'
import { getFinancialSettings, PlanData } from '@/app/actions/financial'
import { useState, useEffect } from 'react'

export default function SubscriptionsPage() {
    const [premiumPlan, setPremiumPlan] = useState<PlanData | null>(null)

    useEffect(() => {
        getFinancialSettings().then(settings => {
            const elite = settings.plans.find(p => p.id === 'premium') || settings.plans[0]
            if (elite) setPremiumPlan(elite)
        })
    }, [])

    return (
        <div className="p-8 md:p-12 min-h-screen font-exo text-slate-900 bg-slate-50 animate-in fade-in duration-500">
            <header className="mb-12">
                <div className="flex items-center gap-3 mb-2">
                    <span className="text-[10px] font-black uppercase tracking-[5px] text-[#1D5F31]">PLANO ATUAL</span>
                </div>
                <h1 className="text-4xl font-black tracking-tighter text-slate-900 uppercase">
                    GESTÃO DE <span className="text-[#1D5F31]">ASSINATURA</span>
                </h1>
                <p className="text-slate-500 font-bold text-xs tracking-widest uppercase mt-2">Controle seus benefícios e detalhes do seu plano.</p>
            </header>

            {/* Layout em grid para preencher a largura */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                {/* Card do Plano Ativo */}
                <div className="bg-white border border-black shadow-sm p-12 md:p-16 relative overflow-hidden rounded-xl group transition-all duration-300 hover:shadow-md hover:border-black">
                    <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
                        <div className="space-y-8">
                            <div className="inline-flex items-center gap-3 bg-white text-slate-900 px-5 py-2.5 border border-black rounded-md shadow-sm">
                                <Star size={14} className="text-[#1D5F31] fill-[#1D5F31]" />
                                <span className="text-[10px] font-black uppercase tracking-[3px]">STATUS: ATIVA</span>
                            </div>

                            <div>
                                <h2 className="text-5xl font-black tracking-tighter text-slate-900 mb-2">
                                    {premiumPlan?.name.split(' ')[0] || 'PREMIUM'} <span className="text-[#1D5F31]">{premiumPlan?.name.split(' ').slice(1).join(' ') || 'ELITE'}</span>
                                </h2>
                                <p className="text-slate-500 text-sm font-bold uppercase tracking-widest italic">Acesso total ao Ecossistema PowerPlay</p>
                            </div>

                            <div className="flex items-baseline gap-2">
                                <span className="text-4xl font-black tracking-tighter text-slate-900">
                                    R$ {premiumPlan?.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '49,90'}
                                </span>
                                <span className="text-slate-500 text-xs font-black uppercase tracking-widest">/ mês</span>
                            </div>

                            <div className="space-y-3">
                                {(premiumPlan?.features || ['Todos os Treinamentos', 'Certificados Ilimitados', 'Mentorias ao Vivo', 'Comunidade Exclusiva']).map(item => (
                                    <div key={item} className="flex items-center gap-3">
                                        <CheckCircle2 size={16} className="text-[#1D5F31]" />
                                        <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">{item}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="bg-slate-50 p-8 border border-black rounded-lg">
                                <div className="space-y-6">
                                    <div>
                                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1">Próxima Renovação</p>
                                        <p className="text-lg font-black tracking-tight text-slate-900">22 de Março, 2026</p>
                                    </div>
                                    <div className="h-px bg-slate-200" />
                                    <div>
                                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1">Método de Pagamento</p>
                                        <p className="text-sm font-bold text-slate-700 uppercase tracking-widest tracking-tighter">Cartão final 4242</p>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <button className="h-14 bg-slate-900 border border-black text-white rounded-md text-[10px] font-black uppercase tracking-widest hover:bg-[#1D5F31] hover:border-black transition-all shadow-sm">
                                    Fazer Upgrade
                                </button>
                                <button className="h-14 border border-black bg-white rounded-md text-slate-500 text-[10px] font-black uppercase tracking-widest hover:border-red-500 hover:text-red-500 transition-all shadow-sm">
                                    Cancelar Plano
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Banner de Segurança - Posicionado ao lado no XL */}
                <div className="bg-white border border-black shadow-sm p-8 flex flex-col justify-center rounded-xl group transition-all duration-300 hover:shadow-md hover:border-black">
                    <div className="flex items-center gap-6">
                        <div className="w-16 h-16 bg-slate-50 border border-black flex items-center justify-center text-[#1D5F31] rounded-lg">
                            <ShieldCheck size={32} />
                        </div>
                        <div>
                            <h3 className="text-sm font-black uppercase tracking-widest text-slate-900">Pagamento 100% Seguro</h3>
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Sua renovação é protegida pela criptografia PowerPlay Shield.</p>
                        </div>
                    </div>
                    <button className="mt-8 flex items-center gap-2 text-[10px] font-black uppercase tracking-[3px] text-[#1D5F31] hover:text-slate-900 transition-colors">
                        CONHECER POLÍTICA DE REEMBOLSO <ArrowRight size={14} />
                    </button>
                </div>
            </div>
        </div>
    )
}