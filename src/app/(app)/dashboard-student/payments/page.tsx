"use client"

import { useEffect, useState } from 'react'
import { CreditCard, Calendar, ArrowUpRight, Clock, Zap, ShieldCheck, X, Copy, CheckCircle2 as CheckIcon, Download } from 'lucide-react'
import { getStudentTransactions, getPixDataAction, getBoletoDataAction, getPaymentStatusAction } from '../actions'
import { toast } from 'sonner'

export default function PaymentsPage() {
    const [isExporting, setIsExporting] = useState(false)
    const [transactions, setTransactions] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    // Estados para Recuperação de Pagamento
    const [selectedPayment, setSelectedPayment] = useState<any>(null)
    const [paymentData, setPaymentData] = useState<any>(null)
    const [isFetchingPayment, setIsFetchingPayment] = useState(false)
    const [copied, setCopied] = useState(false)

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
            transactions.forEach((t) => {
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

    const handleFetchPaymentData = async (t: any) => {
        if ((t.statusPagamento || '').toLowerCase() !== 'pendente') return
        
        setIsFetchingPayment(true)
        setSelectedPayment(t)
        setPaymentData(null)
        
        try {
            const paymentId = t.paymentId
            if (!paymentId) {
                toast.error("Referência de pagamento não encontrada.")
                return
            }

            // Busca detalhes reais no Asaas para garantir o tipo correto
            const asaasRes = await getPaymentStatusAction(paymentId)
            const asaasPayment = asaasRes.success ? asaasRes.data : null
            
            const paymentTypeRaw = asaasPayment?.billingType || t.asaasPaymentMethod || t.billingType || ''
            const paymentType = paymentTypeRaw.toUpperCase()
            
            if (paymentType === 'PIX') {
                const res = await getPixDataAction(paymentId)
                if (res.success) setPaymentData(res.data)
                else toast.error(res.error || "Erro ao buscar dados do PIX")
            } else if (paymentType === 'BOLETO') {
                const res = await getBoletoDataAction(paymentId)
                if (res.success) setPaymentData(res.data)
                else toast.error(res.error || "Erro ao buscar dados do Boleto")
            } else {
                console.log('Unsupported Payment Type:', paymentType)
                toast.info(`O método ${paymentType || 'desconhecido'} não suporta visualização direta.`)
            }
        } catch (error) {
            console.error(error)
            toast.error("Erro ao processar solicitação")
        } finally {
            setIsFetchingPayment(false)
        }
    }

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text)
        setCopied(true)
        toast.success("Código copiado com sucesso!")
        setTimeout(() => setCopied(false), 2000)
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

            <div className="space-y-8">
                {/* Tabela de Transações */}
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
                                            <tr 
                                                key={t.id} 
                                                className={`group hover:bg-slate-50 transition-colors ${(t.statusPagamento || '').toLowerCase() === 'pendente' ? 'cursor-pointer' : ''}`}
                                                onClick={() => (t.statusPagamento || '').toLowerCase() === 'pendente' && handleFetchPaymentData(t)}
                                            >
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
                                                        <div className={`w-1.5 h-1.5 rounded-full ${(t.statusPagamento || '').toLowerCase() === 'pendente' ? 'bg-amber-500' : 'bg-[#1D5F31]'}`} />
                                                        <span className={`text-[9px] font-bold uppercase tracking-widest ${(t.statusPagamento || '').toLowerCase() === 'pendente' ? 'text-amber-600' : 'text-[#1D5F31]'}`}>
                                                            {t.statusPagamento || 'Concluído'}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="py-6 text-right">
                                                    {(t.statusPagamento || '').toLowerCase() === 'pendente' ? (
                                                        <button 
                                                            onClick={(e) => {
                                                                e.stopPropagation()
                                                                handleFetchPaymentData(t)
                                                            }}
                                                            className="px-4 py-2 bg-slate-900 text-white text-[9px] font-bold uppercase tracking-widest rounded-md hover:bg-black transition-all"
                                                        >
                                                            Pagar Agora
                                                        </button>
                                                    ) : (
                                                        <button className="p-2 text-slate-400 hover:text-[#1D5F31] hover:bg-[#1D5F31]/10 rounded-md transition-all">
                                                            <ArrowUpRight size={18} />
                                                        </button>
                                                    )}
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

            {/* Modal de Pagamento Pendente - Premium Industrial */}
            {selectedPayment && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white border border-black rounded-none shadow-2xl w-full max-w-lg relative overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="absolute top-0 left-0 w-full h-1.5 bg-[#1D5F31]" />
                        
                        <div className="p-8">
                            <div className="flex justify-between items-start mb-8">
                                <div>
                                    <span className="text-[10px] font-bold uppercase tracking-[4px] text-[#1D5F31] block mb-1">Pagamento Pendente</span>
                                    <h3 className="text-2xl font-bold uppercase tracking-tighter text-[#1a1a1a]">Recuperar Fatura</h3>
                                </div>
                                <button 
                                    onClick={() => setSelectedPayment(null)}
                                    className="p-2 hover:bg-slate-100 rounded-md transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            {isFetchingPayment ? (
                                <div className="py-12 flex flex-col items-center justify-center gap-4">
                                    <div className="w-10 h-10 border-4 border-slate-200 border-t-[#1D5F31] rounded-full animate-spin" />
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Sincronizando com Asaas...</span>
                                </div>
                            ) : paymentData ? (
                                <div className="space-y-8">
                                    <div className="p-6 bg-slate-50 border border-slate-200 rounded-none flex items-center justify-between">
                                        <div>
                                            <p className="text-[9px] font-bold uppercase tracking-widest text-slate-500 mb-1">Valor Total</p>
                                            <p className="text-2xl font-bold tracking-tighter text-black">
                                                R$ {Number(selectedPayment.valorBruto).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[9px] font-bold uppercase tracking-widest text-slate-500 mb-1">Vencimento</p>
                                            <p className="text-sm font-bold text-black">{new Date(selectedPayment.dataCriacao).toLocaleDateString('pt-BR')}</p>
                                        </div>
                                    </div>

                                    {/* Exibição PIX */}
                                    {paymentData.encodedImage ? (
                                        <div className="flex flex-col items-center gap-6">
                                            <div className="p-4 bg-white border-2 border-[#1D5F31]/20 rounded-none shadow-sm">
                                                <img 
                                                    src={`data:image/png;base64,${paymentData.encodedImage}`} 
                                                    alt="QR Code PIX" 
                                                    className="w-48 h-48"
                                                />
                                            </div>
                                            
                                            <div className="w-full space-y-3">
                                                <p className="text-[10px] font-bold uppercase tracking-[2px] text-center text-slate-500">Código PIX (Copia e Cola)</p>
                                                <div className="flex gap-2">
                                                    <input 
                                                        readOnly 
                                                        value={paymentData.payload}
                                                        className="flex-1 bg-slate-100 border border-slate-200 px-4 py-3 text-xs font-mono rounded-none focus:outline-none"
                                                    />
                                                    <button 
                                                        onClick={() => copyToClipboard(paymentData.payload)}
                                                        className="px-6 bg-[#1D5F31] text-white rounded-none hover:bg-[#164a26] transition-all flex items-center justify-center group"
                                                    >
                                                        {copied ? <CheckIcon size={18} /> : <Copy size={18} className="group-hover:scale-110 transition-transform" />}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ) : paymentData.identificationField ? (
                                        /* Exibição Boleto */
                                        <div className="space-y-6">
                                            <div className="w-full space-y-3">
                                                <p className="text-[10px] font-bold uppercase tracking-[2px] text-slate-500">Linha Digitável do Boleto</p>
                                                <div className="flex gap-2">
                                                    <input 
                                                        readOnly 
                                                        value={paymentData.identificationField}
                                                        className="flex-1 bg-slate-100 border border-slate-200 px-4 py-3 text-xs font-mono rounded-none focus:outline-none"
                                                    />
                                                    <button 
                                                        onClick={() => copyToClipboard(paymentData.identificationField)}
                                                        className="px-6 bg-slate-900 text-white rounded-none hover:bg-black transition-all flex items-center justify-center group"
                                                    >
                                                        {copied ? <CheckIcon size={18} /> : <Copy size={18} className="group-hover:scale-110 transition-transform" />}
                                                    </button>
                                                </div>
                                            </div>
                                            <a 
                                                href={selectedPayment.invoiceUrl} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                className="w-full flex items-center justify-center gap-3 py-4 border-2 border-slate-900 text-slate-900 font-bold uppercase tracking-widest text-[10px] hover:bg-slate-50 transition-all"
                                            >
                                                <Download size={16} /> Baixar Boleto PDF
                                            </a>
                                        </div>
                                    ) : (
                                        <div className="py-8 text-center bg-amber-50 border border-amber-200 p-6">
                                            <p className="text-xs font-bold text-amber-800 uppercase tracking-widest">
                                                Não foi possível recuperar os dados dinâmicos.
                                            </p>
                                            <a 
                                                href={selectedPayment.invoiceUrl} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                className="mt-4 inline-block text-[10px] font-bold uppercase tracking-widest text-slate-900 underline"
                                            >
                                                Tentar via Link Direto do Asaas
                                            </a>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="py-12 text-center text-slate-400">
                                    <p className="text-xs font-bold uppercase tracking-widest">Falha ao carregar dados do pagamento.</p>
                                </div>
                            )}

                            <div className="mt-10 pt-6 border-t border-slate-100">
                                <p className="text-[9px] text-slate-400 font-medium uppercase tracking-[2px] leading-relaxed">
                                    Após realizar o pagamento, o status será atualizado automaticamente em alguns minutos. Caso tenha problemas, entre em contato com o suporte.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}