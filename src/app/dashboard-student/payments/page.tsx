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
        // Simulate API call
        setTimeout(() => {
            setIsSaving(false)
            setIsModalOpen(false)
        }, 2000)
    }

    return (
        <div className="p-8 md:p-12 min-h-screen font-exo text-slate-800 animate-in fade-in duration-500">
            <header className="mb-12">
                <div className="flex items-center gap-3 mb-2">
                    <span className="text-[10px] font-black uppercase tracking-[5px] text-[#00C402]">FINANCEIRO</span>
                </div>
                <h1 className="text-4xl font-black tracking-tighter text-slate-900 uppercase">
                    PAGAMENTOS <span className="text-[#00C402]">& FATURAS</span>
                </h1>
                <p className="text-slate-400 font-bold text-xs tracking-widest uppercase mt-2">Gerencie seus métodos e histórico de compras.</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                {/* Tabela de Transações */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="bg-white rounded-[40px] border border-slate-100 p-8 md:p-10 shadow-sm relative overflow-hidden">
                        <div className="flex items-center justify-between mb-10">
                            <h2 className="text-lg font-black uppercase tracking-tighter text-slate-800">Histórico de Transações</h2>
                            <button className="text-[10px] font-black uppercase tracking-widest text-[#00C402] hover:text-slate-900 transition-colors">
                                Exportar PDF
                            </button>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="border-b border-slate-50 uppercase text-[9px] font-black text-slate-900 tracking-[2px]">
                                        <th className="pb-6">Data</th>
                                        <th className="pb-6">Valor</th>
                                        <th className="pb-6">Método</th>
                                        <th className="pb-6">Status</th>
                                        <th className="pb-6 text-right">Ação</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {TRANSACTIONS.map((t) => (
                                        <tr key={t.id} className="group hover:bg-slate-50/50 transition-colors">
                                            <td className="py-6 text-xs font-bold text-slate-900 tracking-tight">{t.date}</td>
                                            <td className="py-6 text-sm font-black text-slate-800 tracking-tighter">{t.value}</td>
                                            <td className="py-6">
                                                <div className="flex items-center gap-3">
                                                    <t.icon size={14} className="text-slate-400" />
                                                    <span className="text-[10px] font-bold text-slate-900 uppercase tracking-widest">{t.method}</span>
                                                </div>
                                            </td>
                                            <td className="py-6">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-[#00C402]" />
                                                    <span className="text-[9px] font-black text-[#00C402] uppercase tracking-widest">{t.status}</span>
                                                </div>
                                            </td>
                                            <td className="py-6 text-right">
                                                <button className="p-2 text-slate-300 hover:text-slate-900 transition-colors">
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
                    <div className="bg-slate-900 rounded-[40px] p-10 text-white shadow-2xl relative overflow-hidden group">
                        <div className="absolute -top-10 -right-10 w-40 h-40 bg-[#00C402]/20 blur-[100px] pointer-events-none"></div>

                        <div className="relative z-10">
                            <h3 className="text-sm font-black uppercase tracking-[3px] text-slate-400 mb-8">Cartão Principal</h3>
                            <div className="mb-12">
                                <p className="text-2xl font-black tracking-[4px] mb-2 leading-none">•••• •••• •••• 4242</p>
                                <div className="flex justify-between items-end">
                                    <div>
                                        <p className="text-[8px] font-black uppercase tracking-widest text-slate-400">Expiração</p>
                                        <p className="text-xs font-bold tracking-widest">12/28</p>
                                    </div>
                                    <div className="w-12 h-8 bg-white/10 rounded-lg flex items-center justify-center">
                                        <CreditCard size={20} className="text-[#00C402]" />
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsModalOpen(true)}
                                className="w-full h-14 border border-white/10 rounded-2xl flex items-center justify-center gap-3 text-[10px] font-black uppercase tracking-widest hover:bg-white hover:text-slate-900 transition-all shadow-sm"
                            >
                                <Plus size={16} /> Adicionar Novo Cartão
                            </button>
                        </div>
                    </div>

                    <div className="bg-white rounded-[32px] border border-slate-100 p-8 shadow-sm">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-10 h-10 rounded-xl bg-[#00C402]/5 flex items-center justify-center text-[#00C402]">
                                <Calendar size={20} />
                            </div>
                            <div>
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-800">Próxima Cobrança</h4>
                                <p className="text-sm font-black tracking-tighter text-slate-400">22 de Março, 2026</p>
                            </div>
                        </div>
                        <p className="text-[9px] font-medium text-slate-400 leading-relaxed uppercase tracking-widest">A renovação será processada automaticamente no seu cartão final 4242.</p>
                    </div>
                </div>
            </div>

            {/* Modal de Adicionar Cartão */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-lg rounded-[48px] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
                        <div className="p-10 relative">
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="absolute top-8 right-8 p-2 text-slate-300 hover:text-slate-900 transition-colors"
                            >
                                <X size={20} />
                            </button>

                            <div className="mb-10">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="w-8 h-1 bg-[#00C402] rounded-full"></div>
                                    <span className="text-[9px] font-black uppercase tracking-[4px] text-[#00C402]">Secure Payment</span>
                                </div>
                                <h2 className="text-2xl font-black uppercase tracking-tighter text-slate-900">Novo Cartão de Crédito</h2>
                                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">Seus dados são criptografados e protegidos.</p>
                            </div>

                            <form onSubmit={handleSaveCard} className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 pl-2">Número do Cartão</label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            placeholder="0000 0000 0000 0000"
                                            className="w-full h-16 bg-slate-50 border border-slate-100 rounded-2xl px-6 text-sm font-bold tracking-[2px] placeholder:text-slate-200 focus:border-[#00C402]/30 outline-none transition-all"
                                            required
                                        />
                                        <CreditCard className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-200" size={20} />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 pl-2">Nome no Cartão</label>
                                    <input
                                        type="text"
                                        placeholder="COMO IMPRESSO NO CARTÃO"
                                        className="w-full h-16 bg-slate-50 border border-slate-100 rounded-2xl px-6 text-[10px] font-black uppercase tracking-[1px] placeholder:text-slate-200 focus:border-[#00C402]/30 outline-none transition-all"
                                        required
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 pl-2">Validade</label>
                                        <input
                                            type="text"
                                            placeholder="MM / YY"
                                            className="w-full h-16 bg-slate-50 border border-slate-100 rounded-2xl px-6 text-sm font-bold tracking-widest placeholder:text-slate-200 focus:border-[#00C402]/30 outline-none transition-all"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 pl-2">CVV</label>
                                        <input
                                            type="text"
                                            placeholder="000"
                                            className="w-full h-16 bg-slate-50 border border-slate-100 rounded-2xl px-6 text-sm font-bold tracking-widest placeholder:text-slate-200 focus:border-[#00C402]/30 outline-none transition-all"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="pt-4 space-y-4">
                                    <button
                                        type="submit"
                                        disabled={isSaving}
                                        className="w-full h-16 bg-[#00C402] text-white text-[11px] font-black uppercase tracking-[3px] rounded-2xl shadow-lg shadow-[#00C402]/20 hover:bg-[#00C402]/90 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isSaving ? (
                                            <>
                                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                                Processando...
                                            </>
                                        ) : (
                                            'Confirmar e Salvar'
                                        )}
                                    </button>

                                    <div className="flex items-center justify-center gap-2 text-[8px] font-black text-slate-300 uppercase tracking-widest">
                                        <ShieldCheck size={12} className="text-[#00C402]" />
                                        Pagamento 100% Seguro & Criptografado
                                    </div>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
