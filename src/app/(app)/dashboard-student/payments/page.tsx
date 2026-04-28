"use client"

import { useEffect, useState } from 'react'
import { CreditCard, Calendar, ArrowUpRight, Plus, Clock, Zap, X, ShieldCheck } from 'lucide-react'
import { getStudentTransactions } from '../actions'

export default function PaymentsPage() {
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [isExporting, setIsExporting] = useState(false)
    const [transactions, setTransactions] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    // TODO: fetch actual saved card status from API later
    const hasSavedCard = false

    useEffect(() => {
        async function fetchTransactions() {
            const res = await getStudentTransactions()
            if (res.success && res.data) {
                setTransactions(res.data)
            }
            setLoading(false)
        }
        fetchTransactions()
    }, [])

    const handleSaveCard = (e: React.FormEvent) => {
        e.preventDefault()
        setIsSaving(true)
        setTimeout(() => {
            setIsSaving(false)
            setIsModalOpen(false)
        }, 2000)
    }

    const handleExportPDF = async () => {
        if (transactions.length === 0) return
        setIsExporting(true)
        try {
            const { default: jsPDF } = await import('jspdf')
            const doc = new jsPDF()

            // Cabeçalho Industrial PowerPlay
            doc.setFontSize(22)
            doc.setTextColor(29, 95, 49) // #1D5F31
            doc.setFont('helvetica', 'bold')
            doc.text('POWERPLAY', 14, 20)
            
            doc.setFontSize(10)
            doc.setTextColor(100, 100, 100)
            doc.text('EXTRATO DE TRANSAÇÕES FINANCEIRAS', 14, 28)
            doc.text(`DATA DE EMISSÃO: ${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR')}`, 14, 34)

            // Linha Divisória
            doc.setDrawColor(0, 0, 0)
            doc.setLineWidth(0.5)
            doc.line(14, 40, 196, 40)

            // Cabeçalhos da Tabela
            doc.setFontSize(9)
            doc.setTextColor(0, 0, 0)
            doc.setFont('helvetica', 'bold')
            doc.text('DATA', 14, 50)
            doc.text('VALOR', 45, 50)
            doc.text('MÉTODO', 80, 50)
            doc.text('STATUS', 140, 50)

            doc.setLineWidth(0.1)
            doc.line(14, 52, 196, 52)

            // Linhas de Dados
            doc.setFont('helvetica', 'normal')
            let y = 60
            transactions.forEach((t, index) => {
                if (y > 270) {
                    doc.addPage()
                    y = 20
                }
                
                const date = new Date(t.dataCriacao).toLocaleDateString('pt-BR')
                const isFree = t.valorBruto === 0
                const value = isFree ? 'GRATUITO' : `R$ ${Number(t.valorBruto).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                const method = t.asaasPaymentMethod || t.billingType || 'PROCESSAMENTO EXTERNO'
                const status = (t.statusPagamento || 'CONCLUÍDO').toUpperCase()
                
                doc.text(date, 14, y)
                doc.text(value, 45, y)
                doc.text(method, 80, y)
                doc.text(status, 140, y)
                
                // Linha sutil entre registros
                doc.setDrawColor(240, 240, 240)
                doc.line(14, y + 2, 196, y + 2)
                
                y += 10
            })

            // Rodapé
            doc.setFontSize(8)
            doc.setTextColor(150, 150, 150)
            doc.text('ESTE DOCUMENTO É UM REGISTRO OFICIAL DE TRANSAÇÕES DA PLATAFORMA POWERPLAY.', 14, 285)

            doc.save(`extrato-financeiro-powerplay-${new Date().getTime()}.pdf`)
        } catch (error) {
            console.error('Erro ao exportar PDF:', error)
        } finally {
            setIsExporting(false)
        }
    }

    return (
        <div className="p-8 md:p-12 min-h-screen font-montserrat bg-white text-[#1a1a1a] animate-in fade-in duration-500">
            <header className="mb-12">
                <div className="flex items-center gap-3 mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-[5px] text-[#1D5F31]">FINANCEIRO</span>
                </div>
                <h1 className="text-4xl font-bold tracking-tighter text-[#1a1a1a] uppercase">
                    PAGAMENTOS <span className="text-[#1D5F31]">& FATURAS</span>
                </h1>
                <p className="text-slate-500 font-bold text-xs tracking-widest uppercase mt-2">Gerencie seus métodos e histórico de compras.</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                {/* Tabela de Transações */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="bg-white border border-black rounded-xl shadow-sm p-8 md:p-10 relative overflow-hidden">
                        <div className="flex items-center justify-between mb-10">
                            <h2 className="text-lg font-bold uppercase tracking-tighter text-[#1a1a1a]">Histórico de Transações</h2>
                            <button 
                                onClick={handleExportPDF}
                                disabled={isExporting || transactions.length === 0}
                                className="text-[10px] font-bold uppercase tracking-widest text-gray-700 hover:text-gray-900 border border-black hover:border-black hover:bg-gray-50 px-6 py-3 rounded-xl transition-all shadow-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isExporting && <Zap size={14} className="animate-pulse text-[#1D5F31]" />}
                                {isExporting ? 'GERANDO PDF...' : 'Exportar PDF'}
                            </button>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="border-b border-slate-200 uppercase text-[9px] font-bold text-slate-500 tracking-[2px]">
                                        <th className="pb-6">Data</th>
                                        <th className="pb-6">Valor</th>
                                        <th className="pb-6">Método</th>
                                        <th className="pb-6">Status</th>
                                        <th className="pb-6 text-right">Ação</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {loading ? (
                                        <tr><td colSpan={5} className="py-8 text-center text-xs font-bold text-slate-400 uppercase tracking-widest">Carregando transações...</td></tr>
                                    ) : transactions.length === 0 ? (
                                        <tr><td colSpan={5} className="py-8 text-center text-xs font-bold text-slate-400 uppercase tracking-widest">Nenhuma transação encontrada.</td></tr>
                                    ) : (
                                        transactions.map((t) => {
                                            let methodText = 'Processado via Asaas'
                                            let MethodIcon = ShieldCheck
                                            const paymentType = t.asaasPaymentMethod || t.billingType || ''
                                            
                                            if (paymentType === 'CREDIT_CARD') {
                                                methodText = 'Cartão de Crédito'
                                                MethodIcon = CreditCard
                                            } else if (paymentType === 'PIX') {
                                                methodText = 'PIX'
                                                MethodIcon = Zap
                                            } else if (paymentType === 'BOLETO') {
                                                methodText = 'Boleto Bancário'
                                                MethodIcon = Clock
                                            }

                                            const isFree = t.valorBruto === 0
                                            if (isFree) {
                                                methodText = 'Bolsa / Gratuito'
                                            }

                                            const dateFormatted = new Date(t.dataCriacao).toLocaleDateString('pt-BR')
                                            const valueFormatted = isFree ? 'Gratuito' : `R$ ${Number(t.valorBruto).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

                                            return (
                                                <tr key={t.id} className="group hover:bg-slate-50 transition-colors">
                                                    <td className="py-6 text-xs font-bold text-[#1a1a1a] tracking-tight">{dateFormatted}</td>
                                                    <td className="py-6 text-sm font-bold text-[#1a1a1a] tracking-tighter">{valueFormatted}</td>
                                                    <td className="py-6">
                                                        <div className="flex items-center gap-3">
                                                            <MethodIcon size={14} className="text-[#1D5F31]" />
                                                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{methodText}</span>
                                                        </div>
                                                    </td>
                                                    <td className="py-6">
                                                        <div className="flex items-center gap-2">
                                                            <div className={`w-1.5 h-1.5 rounded-full ${t.statusPagamento === 'pendente' ? 'bg-amber-500' : 'bg-[#1D5F31]'}`} />
                                                            <span className={`text-[9px] font-bold uppercase tracking-widest ${t.statusPagamento === 'pendente' ? 'text-amber-600' : 'text-[#1D5F31]'}`}>
                                                                {t.statusPagamento || 'Concluído'}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="py-6 text-right">
                                                        <button className="p-2 text-slate-400 hover:text-[#1D5F31] hover:bg-[#1D5F31]/10 rounded-md transition-all">
                                                            <ArrowUpRight size={18} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            )
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Métodos de Pagamento Sidebar */}
                <div className="space-y-8">
                    <div className="bg-white border border-black shadow-sm rounded-xl p-10 text-[#1a1a1a] relative overflow-hidden group">
                        <div className="relative z-10">
                            <h3 className="text-sm font-bold uppercase tracking-[3px] text-slate-500 mb-8">Cartão Principal</h3>
                            {hasSavedCard ? (
                                <div className="mb-12">
                                    <p className="text-2xl font-bold tracking-[4px] mb-2 leading-none text-[#1a1a1a]">•••• •••• •••• 4242</p>
                                    <div className="flex justify-between items-end">
                                        <div>
                                            <p className="text-[8px] font-bold uppercase tracking-widest text-slate-500">Expiração</p>
                                            <p className="text-xs font-bold tracking-widest text-[#1a1a1a]">12/28</p>
                                        </div>
                                        <div className="w-12 h-8 bg-slate-50 border border-black rounded-xl flex items-center justify-center shadow-sm">
                                            <CreditCard size={16} className="text-[#1D5F31]" />
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="mb-12 flex flex-col items-center justify-center text-center py-4">
                                    <div className="w-16 h-16 bg-gray-50 border border-black rounded-full flex items-center justify-center mb-4 shadow-sm">
                                        <CreditCard size={28} className="text-gray-400" />
                                    </div>
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-relaxed">
                                        Nenhum cartão salvo.<br/>Adicione um método de pagamento para checkouts mais rápidos.
                                    </p>
                                </div>
                            )}
                            <button
                                onClick={() => setIsModalOpen(true)}
                                className="w-full h-14 border border-black rounded-xl flex items-center justify-center gap-3 text-[10px] bg-gray-50 font-bold uppercase tracking-widest text-gray-800 hover:border-black hover:text-gray-900 hover:bg-white transition-all shadow-sm"
                            >
                                <Plus size={16} /> Adicionar Novo Cartão
                            </button>
                        </div>
                    </div>


                </div>
            </div>

            {/* Modal de Adicionar Cartão */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white border border-black shadow-2xl rounded-xl w-full max-w-lg p-10 relative">
                        <button
                            onClick={() => setIsModalOpen(false)}
                            className="absolute top-8 right-8 p-2 text-slate-400 hover:text-[#1a1a1a] hover:bg-slate-100 rounded-xl transition-all"
                        >
                            <X size={20} />
                        </button>

                        <div className="mb-10">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="w-8 h-1 bg-[#1D5F31] rounded-full"></div>
                                <span className="text-[9px] font-bold uppercase tracking-[4px] text-[#1D5F31]">Secure Payment</span>
                            </div>
                            <h2 className="text-2xl font-bold uppercase tracking-tighter text-[#1a1a1a]">Novo Cartão de Crédito</h2>
                        </div>

                        <form onSubmit={handleSaveCard} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[9px] font-bold uppercase tracking-widest text-slate-500 pl-1">Número do Cartão</label>
                                <input type="text" placeholder="0000 0000 0000 0000" className="w-full h-14 bg-gray-50 border border-black rounded-xl px-5 text-sm font-bold tracking-[2px] text-[#1a1a1a] outline-none focus:border-[#1D5F31] focus:bg-white shadow-sm transition-all placeholder:text-gray-400 placeholder:font-medium placeholder:tracking-normal" required />
                            </div>
                            
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[9px] font-bold uppercase tracking-widest text-slate-500 pl-1">Validade</label>
                                    <input type="text" placeholder="MM/AA" className="w-full h-14 bg-gray-50 border border-black rounded-xl px-5 text-sm font-bold tracking-[2px] text-[#1a1a1a] outline-none focus:border-[#1D5F31] focus:bg-white shadow-sm transition-all placeholder:text-gray-400 placeholder:font-medium placeholder:tracking-normal" required />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[9px] font-bold uppercase tracking-widest text-slate-500 pl-1">CVC</label>
                                    <input type="text" placeholder="123" className="w-full h-14 bg-gray-50 border border-black rounded-xl px-5 text-sm font-bold tracking-[2px] text-[#1a1a1a] outline-none focus:border-[#1D5F31] focus:bg-white shadow-sm transition-all placeholder:text-gray-400 placeholder:font-medium placeholder:tracking-normal" required />
                                </div>
                            </div>
                            
                            <div className="pt-4">
                                <button type="submit" disabled={isSaving} className="w-full h-14 bg-[#1D5F31] border border-black hover:brightness-110 text-white rounded-xl font-bold uppercase tracking-[2px] text-[10px] transition-all shadow-md flex items-center justify-center disabled:opacity-50">
                                    {isSaving ? 'SALVANDO...' : 'SALVAR CARTÃO'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}