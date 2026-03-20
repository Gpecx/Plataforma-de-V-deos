"use client"

import { useState } from 'react'
import { CreditCard, Calendar, ArrowUpRight, Plus, CheckCircle2, Clock, Zap, X, ShieldCheck } from 'lucide-react'

const TRANSACTIONS = [
    { id: 1, date: '22/02/2026', value: 'R$ 497,00', method: 'Cartão •••• 4242', status: 'Pago', icon: CreditCard },
    { id: 2, date: '15/01/2026', value: 'R$ 497,00', method: 'Boleto Bancário', status: 'Pago', icon: Clock },
    { id: 3, date: '10/12/2025', value: 'R$ 297,00', method: 'PIX', status: 'Pago', icon: Zap },
]

export default function PaymentsPage() {
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [isSaving, setIsSaving] = useState(false)

    const handleSaveCard = (e: React.FormEvent) => {
        e.preventDefault()
        setIsSaving(true)
        setTimeout(() => {
            setIsSaving(false)
            setIsModalOpen(false)
        }, 2000)
    }

    return (
        <div className="p-8 md:p-12 min-h-screen font-exo text-white bg-transparent animate-in fade-in duration-500">
            <header className="mb-12">
                <div className="flex items-center gap-3 mb-2">
                    <span className="text-[10px] font-black uppercase tracking-[5px] text-[#1D5F31]">FINANCEIRO</span>
                </div>
                <h1 className="text-4xl font-black tracking-tighter text-white uppercase">
                    PAGAMENTOS <span className="text-[#1D5F31]">& FATURAS</span>
                </h1>
                <p className="text-slate-400 font-bold text-xs tracking-widest uppercase mt-2">Gerencie seus métodos e histórico de compras.</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                {/* Tabela de Transações */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="bg-[#061629] border-2 border-[#1D5F31] p-8 md:p-10 relative overflow-hidden">
                        <div className="flex items-center justify-between mb-10">
                            <h2 className="text-lg font-black uppercase tracking-tighter text-white">Histórico de Transações</h2>
                            <button className="text-[10px] font-black uppercase tracking-widest text-[#1D5F31] hover:text-white transition-colors">
                                Exportar PDF
                            </button>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="border-b-2 border-[#1D5F31] uppercase text-[9px] font-black text-slate-400 tracking-[2px]">
                                        <th className="pb-6">Data</th>
                                        <th className="pb-6">Valor</th>
                                        <th className="pb-6">Método</th>
                                        <th className="pb-6">Status</th>
                                        <th className="pb-6 text-right">Ação</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#1D5F31]">
                                    {TRANSACTIONS.map((t) => (
                                        <tr key={t.id} className="group hover:bg-[#1D5F31]/20 transition-colors">
                                            <td className="py-6 text-xs font-bold text-white tracking-tight">{t.date}</td>
                                            <td className="py-6 text-sm font-black text-white tracking-tighter">{t.value}</td>
                                            <td className="py-6">
                                                <div className="flex items-center gap-3">
                                                    <t.icon size={14} className="text-[#1D5F31]" />
                                                    <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">{t.method}</span>
                                                </div>
                                            </td>
                                            <td className="py-6">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-[#1D5F31]" />
                                                    <span className="text-[9px] font-black text-[#1D5F31] uppercase tracking-widest">{t.status}</span>
                                                </div>
                                            </td>
                                            <td className="py-6 text-right">
                                                <button className="p-2 text-slate-500 hover:text-white transition-colors">
                                                    <ArrowUpRight size={18} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Métodos de Pagamento Sidebar */}
                <div className="space-y-8">
                    <div className="bg-[#061629] border-2 border-[#1D5F31] p-10 text-white relative overflow-hidden group">
                        <div className="relative z-10">
                            <h3 className="text-sm font-black uppercase tracking-[3px] text-slate-400 mb-8">Cartão Principal</h3>
                            <div className="mb-12">
                                <p className="text-2xl font-black tracking-[4px] mb-2 leading-none">•••• •••• •••• 4242</p>
                                <div className="flex justify-between items-end">
                                    <div>
                                        <p className="text-[8px] font-black uppercase tracking-widest text-slate-400">Expiração</p>
                                        <p className="text-xs font-bold tracking-widest">12/28</p>
                                    </div>
                                    <div className="w-12 h-8 bg-[#1D5F31] flex items-center justify-center">
                                        <CreditCard size={20} className="text-[#1D5F31]" />
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsModalOpen(true)}
                                className="w-full h-14 border-2 border-[#1D5F31] flex items-center justify-center gap-3 text-[10px] font-black uppercase tracking-widest hover:border-[#1D5F31] hover:text-[#1D5F31] transition-all"
                            >
                                <Plus size={16} /> Adicionar Novo Cartão
                            </button>
                        </div>
                    </div>

                    <div className="bg-[#061629] border-2 border-[#1D5F31] p-8">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-10 h-10 bg-[#1D5F31] flex items-center justify-center text-[#1D5F31]">
                                <Calendar size={20} />
                            </div>
                            <div>
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-white">Próxima Cobrança</h4>
                                <p className="text-sm font-black tracking-tighter text-slate-400">22 de Março, 2026</p>
                            </div>
                        </div>
                        <p className="text-[9px] font-medium text-slate-400 leading-relaxed uppercase tracking-widest">A renovação será processada automaticamente no seu cartão final 4242.</p>
                    </div>
                </div>
            </div>

            {/* Modal de Adicionar Cartão */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-[#061629]/90 backdrop-blur-sm">
                    <div className="bg-[#061629] border-2 border-[#1D5F31] w-full max-w-lg p-10 relative">
                        <button
                            onClick={() => setIsModalOpen(false)}
                            className="absolute top-8 right-8 p-2 text-slate-400 hover:text-white"
                        >
                            <X size={20} />
                        </button>

                        <div className="mb-10">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="w-8 h-1 bg-[#1D5F31]"></div>
                                <span className="text-[9px] font-black uppercase tracking-[4px] text-[#1D5F31]">Secure Payment</span>
                            </div>
                            <h2 className="text-2xl font-black uppercase tracking-tighter text-white">Novo Cartão de Crédito</h2>
                        </div>

                        <form onSubmit={handleSaveCard} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 pl-2">Número do Cartão</label>
                                <input type="text" className="w-full h-16 bg-[#061629] border-2 border-[#1D5F31] px-6 text-sm font-bold tracking-[2px] text-white outline-none focus:border-[#1D5F31]" required />
                            </div>
                            {/* Repita o padrão de border-2 e bg-[#061629] nos outros inputs */}
                            {/* ... */}
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}