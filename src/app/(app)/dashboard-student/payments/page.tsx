"use client"

import { useEffect, useState } from 'react'
import { CreditCard, Calendar, ArrowUpRight, Clock, Zap, ShieldCheck, X, Copy, CheckCircle2 as CheckIcon, Download, Loader2, CheckCircle, XCircle, ShoppingCart, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { getStudentTransactions, getPixDataAction, getBoletoDataAction, getPaymentStatusAction, payPendingCreditCardAction, syncPaymentStatusAction } from '../actions'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import Logo from '@/components/Logo'

function maskCardNumber(value: string): string {
    const digits = value.replace(/\D/g, '').slice(0, 16)
    return digits.replace(/(\d{4})(?=\d)/g, '$1 ')
}

function maskExpiry(value: string): string {
    const digits = value.replace(/\D/g, '').slice(0, 4)
    if (digits.length > 2) return digits.slice(0, 2) + '/' + digits.slice(2)
    return digits
}

function maskCvc(value: string): string {
    return value.replace(/\D/g, '').slice(0, 4)
}

function maskCpf(value: string): string {
    const digits = value.replace(/\D/g, '').slice(0, 11)
    return digits
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
}

function maskPhone(value: string): string {
    const digits = value.replace(/\D/g, '').slice(0, 11)
    if (digits.length <= 10) {
        return digits.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3')
    }
    return digits.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3')
}

function maskCep(value: string): string {
    const digits = value.replace(/\D/g, '').slice(0, 8)
    if (digits.length > 5) return digits.slice(0, 5) + '-' + digits.slice(5)
    return digits
}

function detectCardBrand(number: string): string {
    const cleaned = number.replace(/\D/g, '')
    if (/^4/.test(cleaned)) return 'Visa'
    if (/^5[1-5]/.test(cleaned)) return 'Mastercard'
    if (/^3[47]/.test(cleaned)) return 'Amex'
    if (/^6(?:011|5)/.test(cleaned)) return 'Discover'
    if (/^3(?:0[0-5]|[68])/.test(cleaned)) return 'Diners'
    if (/^2(?:014|149)/.test(cleaned)) return 'Elo'
    return ''
}

function FaturaButton({ transaction }: { transaction: any }) {
    const [loadingFatura, setLoadingFatura] = useState(false)

    const handleOpenFatura = async (e: React.MouseEvent) => {
        e.stopPropagation()
        if (transaction.invoiceUrl) {
            window.open(transaction.invoiceUrl, '_blank', 'noopener,noreferrer')
            return
        }
        if (!transaction.paymentId) return
        setLoadingFatura(true)
        try {
            const res = await getPaymentStatusAction(transaction.paymentId)
            if (res.success && res.data?.invoiceUrl) {
                window.open(res.data.invoiceUrl, '_blank', 'noopener,noreferrer')
            } else {
                toast.error('Fatura não disponível para esta transação.')
            }
        } catch {
            toast.error('Erro ao buscar fatura.')
        } finally {
            setLoadingFatura(false)
        }
    }

    if (!transaction.paymentId) return null

    return (
        <button
            onClick={handleOpenFatura}
            disabled={loadingFatura}
            className="px-5 py-2.5 border border-slate-200 bg-white text-black text-[10px] font-bold uppercase tracking-[2px] hover:border-[#1D5F31] hover:bg-[#1D5F31] hover:text-white transition-all rounded-md flex items-center justify-center gap-1.5 disabled:opacity-50 shadow-sm"
        >
            {loadingFatura ? (
                <Loader2 size={14} className="animate-spin" />
            ) : (
                <ArrowUpRight size={14} />
            )}
            Fatura
        </button>
    )
}

export default function PaymentsPage() {
    const [isExporting, setIsExporting] = useState(false)
    const [transactions, setTransactions] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    // Estados para Recuperação de Pagamento
    const [selectedPayment, setSelectedPayment] = useState<any>(null)
    const [receiptTransaction, setReceiptTransaction] = useState<any>(null)
    const [paymentData, setPaymentData] = useState<any>(null)
    const [isFetchingPayment, setIsFetchingPayment] = useState(false)
    const [copied, setCopied] = useState(false)
    const [pendingPaymentType, setPendingPaymentType] = useState<string>('')
    const [paymentAlreadyConfirmed, setPaymentAlreadyConfirmed] = useState(false)

    // Credit card form state (for retry)
    const [ccNumber, setCcNumber] = useState('')
    const [ccHolder, setCcHolder] = useState('')
    const [ccExpiry, setCcExpiry] = useState('')
    const [ccCvc, setCcCvc] = useState('')
    const [ccCpf, setCcCpf] = useState('')
    const [ccEmail, setCcEmail] = useState('')
    const [ccPhone, setCcPhone] = useState('')
    const [ccCep, setCcCep] = useState('')
    const [ccAddressNumber, setCcAddressNumber] = useState('')
    const [isPayingCard, setIsPayingCard] = useState(false)
    const [ccError, setCcError] = useState<string | null>(null)
    const [ccSuccess, setCcSuccess] = useState(false)

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

    const resetCardForm = () => {
        setCcNumber('')
        setCcHolder('')
        setCcExpiry('')
        setCcCvc('')
        setCcCpf('')
        setCcEmail('')
        setCcPhone('')
        setCcCep('')
        setCcAddressNumber('')
        setCcError(null)
        setCcSuccess(false)
    }

    const handleFetchPaymentData = async (t: any) => {
        if ((t.statusPagamento || '').toLowerCase() !== 'pendente') return
        
        resetCardForm()
        setIsFetchingPayment(true)
        setSelectedPayment(t)
        setPaymentData(null)
        setPaymentAlreadyConfirmed(false)
        
        try {
            const paymentId = t.paymentId
            if (!paymentId) {
                toast.error("Referência de pagamento não encontrada.")
                return
            }

            const asaasRes = await getPaymentStatusAction(paymentId)
            const asaasPayment = asaasRes.success ? asaasRes.data : null
            
            // Se o Asaas já confirma como pago, reconcilia e mostra tela de sucesso
            if (asaasPayment && ['RECEIVED', 'CONFIRMED'].includes(asaasPayment.status)) {
                await syncPaymentStatusAction(paymentId)
                setPaymentAlreadyConfirmed(true)
                setIsFetchingPayment(false)
                
                // Recarrega a lista de transações para refletir o novo status
                const res = await getStudentTransactions()
                if (res.success && res.data) {
                    setTransactions(res.data)
                }
                return
            }
            
            const paymentTypeRaw = asaasPayment?.billingType || t.asaasPaymentMethod || t.billingType || ''
            const paymentType = paymentTypeRaw.toUpperCase()
            setPendingPaymentType(paymentType)
            
            if (paymentType === 'PIX') {
                const res = await getPixDataAction(paymentId)
                if (res.success) setPaymentData(res.data)
                else toast.error(res.error || "Erro ao buscar dados do PIX")
            } else if (paymentType === 'BOLETO') {
                const [boletoRes, paymentDetail] = await Promise.all([
                    getBoletoDataAction(paymentId),
                    asaasRes.success ? Promise.resolve(asaasRes) : getPaymentStatusAction(paymentId),
                ])
                const detail = paymentDetail.success ? paymentDetail.data : null
                if (boletoRes.success) {
                    setPaymentData({ ...boletoRes.data, bankSlipUrl: detail?.bankSlipUrl || null })
                } else {
                    toast.error(boletoRes.error || "Erro ao buscar dados do Boleto")
                }
            }
            // CREDIT_CARD: don't fetch visual data, just show the card form in modal
        } catch (error) {
            console.error(error)
            toast.error("Erro ao processar solicitação")
        } finally {
            setIsFetchingPayment(false)
        }
    }

    const handlePayWithCard = async () => {
        setCcError(null)

        const cleanedNumber = ccNumber.replace(/\s/g, '')
        if (cleanedNumber.length < 13) { setCcError('Número do cartão inválido.'); return }
        if (ccHolder.trim().split(' ').length < 2) { setCcError('Informe o nome completo do titular como está no cartão.'); return }
        const expiryDigits = ccExpiry.replace(/\D/g, '')
        if (expiryDigits.length !== 4) { setCcError('Data de expiração inválida.'); return }
        if (ccCvc.replace(/\D/g, '').length < 3) { setCcError('CVC inválido.'); return }
        if (ccCpf.replace(/\D/g, '').length < 11) { setCcError('CPF/CNPJ do titular inválido.'); return }
        if (!ccEmail.includes('@')) { setCcError('E-mail do titular inválido.'); return }
        if (ccCep.replace(/\D/g, '').length < 8) { setCcError('CEP inválido.'); return }
        if (!ccAddressNumber.trim()) { setCcError('Número do endereço é obrigatório.'); return }

        setIsPayingCard(true)

        try {
            const result = await payPendingCreditCardAction(selectedPayment.paymentId, {
                creditCard: {
                    holderName: ccHolder.trim(),
                    number: cleanedNumber,
                    expiryMonth: expiryDigits.slice(0, 2),
                    expiryYear: '20' + expiryDigits.slice(2, 4),
                    ccv: ccCvc.replace(/\D/g, ''),
                },
                creditCardHolderInfo: {
                    name: ccHolder.trim(),
                    email: ccEmail.trim(),
                    cpfCnpj: ccCpf.replace(/\D/g, ''),
                    postalCode: ccCep.replace(/\D/g, ''),
                    addressNumber: ccAddressNumber.trim(),
                    phone: ccPhone.replace(/\D/g, '') || undefined,
                }
            })

            if (!result.success) {
                setCcError(result.error || 'Erro ao processar pagamento')
                setIsPayingCard(false)
                return
            }

            setCcSuccess(true)

            // Refresh transactions list
            const res = await getStudentTransactions()
            if (res.success && res.data) {
                setTransactions(res.data)
            }

            setTimeout(() => {
                setSelectedPayment(null)
            }, 2500)

        } catch (error: any) {
            setCcError(error.message || 'Erro ao processar pagamento')
        } finally {
            setIsPayingCard(false)
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
                <div className="bg-white border border-slate-200 shadow-sm p-8 md:p-10 relative overflow-hidden rounded-lg">
                    <div className="flex items-center justify-between mb-10">
                        <h2 className="text-lg font-bold uppercase tracking-tighter text-[#1a1a1a]">Histórico de Transações</h2>
                        <button 
                            onClick={handleExportPDF}
                            disabled={isExporting || transactions.length === 0}
                            className="text-[10px] font-bold uppercase tracking-widest text-gray-700 hover:text-gray-900 border border-slate-200 hover:border-slate-300 hover:bg-gray-50 px-6 py-3 transition-all shadow-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed rounded-md"
                        >
                            {isExporting && <Zap size={14} className="animate-pulse text-[#1D5F31]" />}
                            {isExporting ? 'GERANDO PDF...' : 'Exportar PDF'}
                        </button>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[800px]">
                            <thead>
                                <tr className="border-b border-slate-200 uppercase text-[10px] font-bold text-slate-500 tracking-[3px]">
                                    <th className="pb-4 pl-4">Produto</th>
                                    <th className="pb-4 px-4">Data</th>
                                    <th className="pb-4 px-4">Valor</th>
                                    <th className="pb-4 px-4">Pagamento</th>
                                    <th className="pb-4 pr-4 text-right">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {loading ? (
                                    <>
                                        {[...Array(3)].map((_, i) => (
                                            <tr key={i} className="group border-b border-slate-100 last:border-b-0">
                                                <td className="py-6 pl-4 pr-4">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-12 h-12 bg-slate-200 animate-pulse border border-slate-200 rounded-md shrink-0"></div>
                                                        <div className="space-y-2 w-full max-w-[200px]">
                                                            <div className="h-4 bg-slate-200 animate-pulse w-full"></div>
                                                            <div className="h-2 bg-slate-200 animate-pulse w-24"></div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-6 px-4">
                                                    <div className="h-4 bg-slate-200 animate-pulse w-24"></div>
                                                </td>
                                                <td className="py-6 px-4">
                                                    <div className="h-5 bg-slate-200 animate-pulse w-20"></div>
                                                </td>
                                                <td className="py-6 px-4">
                                                    <div className="space-y-2">
                                                        <div className="h-4 bg-slate-200 animate-pulse w-28"></div>
                                                        <div className="h-2 bg-slate-200 animate-pulse w-16"></div>
                                                    </div>
                                                </td>
                                                <td className="py-6 pr-4 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <div className="h-9 bg-slate-200 animate-pulse w-20 border border-slate-200 rounded-md"></div>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </>
                                ) : transactions.length === 0 ? (
                                    <tr><td colSpan={5} className="py-12 text-center text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">Nenhuma transação encontrada.</td></tr>
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

                                        const dateFormatted = new Date(t.dataCriacao).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
                                        const valueFormatted = isFree ? 'Gratuito' : `R$ ${Number(t.valorBruto).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

                                        const isPaid = (t.statusPagamento || '').toLowerCase() === 'pago'
                                        const isPending = (t.statusPagamento || '').toLowerCase() === 'pendente'

                                        return (
                                            <tr 
                                                key={t.id} 
                                                className={`group hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-b-0 ${isPending ? 'cursor-pointer' : ''}`}
                                                onClick={() => isPending && handleFetchPaymentData(t)}
                                            >
                                                <td className="py-6 pl-4 pr-4">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-12 h-12 border border-slate-200 bg-slate-50 flex items-center justify-center shrink-0 rounded-md overflow-hidden relative">
                                                            {t.courseThumbnail ? (
                                                                <img src={t.courseThumbnail} alt="" className="w-full h-full object-cover grayscale opacity-80 mix-blend-multiply transition-all group-hover:grayscale-0 group-hover:opacity-100" />
                                                            ) : (
                                                                <ShoppingCart size={20} className="text-black" />
                                                            )}
                                                        </div>
                                                        <div className="flex flex-col">
                                                            {isPaid && t.cursoId ? (
                                                                <Link href={`/dashboard-student/course/${t.cursoId}`} className="text-sm font-bold text-black uppercase tracking-tight hover:text-[#1D5F31] transition-colors line-clamp-2 max-w-[250px] leading-tight">
                                                                    {t.cursoTitulo || 'Produto Adquirido'}
                                                                </Link>
                                                            ) : (
                                                                <span className="text-sm font-bold text-black uppercase tracking-tight line-clamp-2 max-w-[250px] leading-tight">
                                                                    {t.cursoTitulo || 'Produto Adquirido'}
                                                                </span>
                                                            )}
                                                            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-1.5">Ref: {t.idTransacao || t.id}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-6 px-4">
                                                    <span className="text-xs font-bold text-[#1a1a1a] tracking-tight">
                                                        {dateFormatted}
                                                    </span>
                                                </td>
                                                <td className="py-6 px-4">
                                                    <span className="text-base font-semibold text-[#1D5F31] tracking-tight">
                                                        {valueFormatted}
                                                    </span>
                                                </td>
                                                <td className="py-6 px-4">
                                                    <div className="flex items-center gap-2 mb-1.5">
                                                        <MethodIcon size={14} className="text-black shrink-0" />
                                                        <span className="text-[10px] font-bold text-black uppercase tracking-widest">{methodText}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <div className={`w-1.5 h-1.5 rounded-none ${isPending ? 'bg-amber-500' : 'bg-[#1D5F31]'}`} />
                                                        <span className={`text-[9px] font-bold uppercase tracking-[2px] ${isPending ? 'text-amber-600' : 'text-[#1D5F31]'}`}>
                                                            {t.statusPagamento || 'Concluído'}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="py-6 pr-4 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        {isPending ? (
                                                            <button 
                                                                onClick={(e) => {
                                                                    e.stopPropagation()
                                                                    handleFetchPaymentData(t)
                                                                }}
                                                                className="px-6 py-3 bg-black text-white text-[10px] font-bold uppercase tracking-[2px] hover:bg-[#1D5F31] transition-colors rounded-md whitespace-nowrap shadow-sm"
                                                            >
                                                                Pagar Agora
                                                            </button>
                                                        ) : (
                                                            <>
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation()
                                                                        setReceiptTransaction(t)
                                                                    }}
                                                                    className="px-5 py-2.5 border border-slate-200 bg-white text-black text-[10px] font-bold uppercase tracking-[2px] hover:border-black hover:bg-black hover:text-white transition-all rounded-md shadow-sm"
                                                                >
                                                                    Recibo
                                                                </button>
                                                                <FaturaButton transaction={t} />
                                                            </>
                                                        )}
                                                    </div>
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
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white border border-slate-200 shadow-2xl w-full max-w-xl max-h-[85vh] flex flex-col relative animate-in zoom-in-95 duration-300 rounded-xl">
                        <div className="absolute top-0 left-0 w-full h-1.5 bg-[#1D5F31] z-10 shrink-0 rounded-t-xl" />

                        {/* Header - sticky top */}
                        <div className="p-8 pb-4 shrink-0">
                            <div className="flex justify-between items-start">
                                <div>
                                    <span className="text-[10px] font-bold uppercase tracking-[4px] text-[#1D5F31] block mb-1">
                                        {paymentAlreadyConfirmed ? 'Pagamento Confirmado' : 'Pagamento Pendente'}
                                    </span>
                                    <h3 className="text-2xl font-bold uppercase tracking-tighter text-[#1a1a1a]">
                                        {paymentAlreadyConfirmed ? 'Pagamento Compensado' : 'Recuperar Fatura'}
                                    </h3>
                                </div>
                                <button 
                                    onClick={() => setSelectedPayment(null)}
                                    className="p-2 hover:bg-slate-100 transition-colors rounded-md"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                        </div>

                        {/* Content - scrollable */}
                        <div className="px-8 pb-8 overflow-y-auto flex-1">
                            {isFetchingPayment ? (
                                <div className="py-12 flex flex-col items-center justify-center gap-4">
                                    <div className="w-10 h-10 border-4 border-slate-200 border-t-[#1D5F31] rounded-full animate-spin" />
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Sincronizando com Asaas...</span>
                                </div>
                            ) : paymentAlreadyConfirmed ? (
                                <div className="py-8 flex flex-col items-center gap-4 bg-green-50 border border-green-200 p-6 rounded-md">
                                    <CheckCircle size={40} className="text-green-600" />
                                    <p className="text-xs font-bold text-green-800 uppercase tracking-widest text-center">
                                        Pagamento Já Confirmado!
                                    </p>
                                    <p className="text-[10px] text-green-700 text-center">
                                        Este pagamento já foi compensado no Asaas. Seu curso já está disponível no dashboard.
                                    </p>
                                    <button
                                        onClick={() => setSelectedPayment(null)}
                                        className="mt-2 px-8 py-3 bg-[#1D5F31] text-white text-[10px] font-bold uppercase tracking-[2px] hover:brightness-110 transition-all rounded-md"
                                    >
                                        Fechar
                                    </button>
                                </div>
                            ) : pendingPaymentType === 'CREDIT_CARD' ? (
                                <div className="space-y-5">
                                    <div className="p-5 bg-slate-50 border border-slate-200 flex items-center justify-between rounded-md">
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

                                    {ccSuccess ? (
                                        <div className="py-8 flex flex-col items-center gap-4 bg-green-50 border border-green-200 p-6 rounded-md">
                                            <CheckCircle size={40} className="text-green-600" />
                                            <p className="text-xs font-bold text-green-800 uppercase tracking-widest text-center">
                                                Pagamento Confirmado!
                                            </p>
                                            <p className="text-[10px] text-green-700 text-center">
                                                Seu pagamento foi processado com sucesso. Redirecionando...
                                            </p>
                                        </div>
                                    ) : (
                                        <>
                                            <div>
                                                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1.5 block">Número do Cartão</label>
                                                <div className="relative">
                                                    <input
                                                        type="text" inputMode="numeric" placeholder="0000 0000 0000 0000"
                                                        value={ccNumber}
                                                        onChange={e => setCcNumber(maskCardNumber(e.target.value))}
                                                        maxLength={19}
                                                        className="w-full border border-gray-300 px-4 py-3 text-sm font-mono bg-white text-[#1a1a1a] outline-none focus:border-[#1D5F31] focus:ring-1 focus:ring-[#1D5F31]/20 transition-all rounded-md"
                                                    />
                                                    {detectCardBrand(ccNumber) && (
                                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-bold uppercase tracking-wider text-[#1D5F31]">
                                                            {detectCardBrand(ccNumber)}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            <div>
                                                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1.5 block">Nome do Titular</label>
                                                <input
                                                    type="text" placeholder="Como está no cartão"
                                                    value={ccHolder}
                                                    onChange={e => setCcHolder(e.target.value.toUpperCase())}
                                                    className="w-full border border-gray-300 px-4 py-3 text-sm bg-white text-[#1a1a1a] outline-none focus:border-[#1D5F31] focus:ring-1 focus:ring-[#1D5F31]/20 transition-all rounded-md uppercase"
                                                />
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1.5 block">Expiração</label>
                                                    <input
                                                        type="text" inputMode="numeric" placeholder="MM/AA"
                                                        value={ccExpiry}
                                                        onChange={e => setCcExpiry(maskExpiry(e.target.value))}
                                                        maxLength={5}
                                                        className="w-full border border-gray-300 px-4 py-3 text-sm font-mono bg-white text-[#1a1a1a] outline-none focus:border-[#1D5F31] focus:ring-1 focus:ring-[#1D5F31]/20 transition-all rounded-md"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1.5 block">CVC</label>
                                                    <input
                                                        type="text" inputMode="numeric" placeholder="123"
                                                        value={ccCvc}
                                                        onChange={e => setCcCvc(maskCvc(e.target.value))}
                                                        maxLength={4}
                                                        className="w-full border border-gray-300 px-4 py-3 text-sm font-mono bg-white text-[#1a1a1a] outline-none focus:border-[#1D5F31] focus:ring-1 focus:ring-[#1D5F31]/20 transition-all rounded-md"
                                                    />
                                                </div>
                                            </div>

                                            <div className="h-px bg-gray-200" />

                                            <p className="text-xs text-slate-500 font-medium">Dados do titular do cartão</p>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1.5 block">CPF / CNPJ</label>
                                                    <input
                                                        type="text" inputMode="numeric" placeholder="000.000.000-00"
                                                        value={maskCpf(ccCpf)}
                                                        onChange={e => setCcCpf(e.target.value.replace(/\D/g, '').slice(0, 11))}
                                                        maxLength={14}
                                                        className="w-full border border-gray-300 px-4 py-3 text-sm font-mono bg-white text-[#1a1a1a] outline-none focus:border-[#1D5F31] focus:ring-1 focus:ring-[#1D5F31]/20 transition-all rounded-md"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1.5 block">E-mail</label>
                                                    <input
                                                        type="email" placeholder="titular@email.com"
                                                        value={ccEmail}
                                                        onChange={e => setCcEmail(e.target.value)}
                                                        className="w-full border border-gray-300 px-4 py-3 text-sm bg-white text-[#1a1a1a] outline-none focus:border-[#1D5F31] focus:ring-1 focus:ring-[#1D5F31]/20 transition-all rounded-md"
                                                    />
                                                </div>
                                            </div>

                                            <div>
                                                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1.5 block">Telefone</label>
                                                <input
                                                    type="text" inputMode="numeric" placeholder="(11) 99999-9999"
                                                    value={maskPhone(ccPhone)}
                                                    onChange={e => setCcPhone(e.target.value.replace(/\D/g, '').slice(0, 11))}
                                                    maxLength={15}
                                                    className="w-full border border-gray-300 px-4 py-3 text-sm font-mono bg-white text-[#1a1a1a] outline-none focus:border-[#1D5F31] focus:ring-1 focus:ring-[#1D5F31]/20 transition-all rounded-md"
                                                />
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1.5 block">CEP</label>
                                                    <input
                                                        type="text" inputMode="numeric" placeholder="00000-000"
                                                        value={maskCep(ccCep)}
                                                        onChange={e => setCcCep(e.target.value.replace(/\D/g, '').slice(0, 8))}
                                                        maxLength={9}
                                                        className="w-full border border-gray-300 px-4 py-3 text-sm font-mono bg-white text-[#1a1a1a] outline-none focus:border-[#1D5F31] focus:ring-1 focus:ring-[#1D5F31]/20 transition-all rounded-md"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1.5 block">Número</label>
                                                    <input
                                                        type="text" placeholder="123"
                                                        value={ccAddressNumber}
                                                        onChange={e => setCcAddressNumber(e.target.value)}
                                                        className="w-full border border-gray-300 px-4 py-3 text-sm bg-white text-[#1a1a1a] outline-none focus:border-[#1D5F31] focus:ring-1 focus:ring-[#1D5F31]/20 transition-all rounded-md"
                                                    />
                                                </div>
                                            </div>

                                            {ccError && (
                                                <div className="bg-red-50 border-l-4 border-red-500 p-4 flex items-start gap-3 rounded-md">
                                                    <XCircle size={18} className="text-red-500 shrink-0 mt-0.5" />
                                                    <div>
                                                        <p className="text-xs text-red-700 leading-relaxed">{ccError}</p>
                                                    </div>
                                                </div>
                                            )}

                                            <button
                                                onClick={handlePayWithCard}
                                                disabled={isPayingCard}
                                                className={cn(
                                                    "w-full py-4 font-bold uppercase tracking-[3px] transition-all flex items-center justify-center gap-3 rounded-md",
                                                    isPayingCard
                                                        ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                                        : 'bg-[#1D5F31] text-white hover:brightness-110 active:scale-[0.98]'
                                                )}
                                            >
                                                {isPayingCard ? (
                                                    <><Loader2 size={18} className="animate-spin" /> Processando...</>
                                                ) : (
                                                    'Pagar Agora com Cartão'
                                                )}
                                            </button>
                                        </>
                                    )}

                                    <div className="pt-4 border-t border-slate-100">
                                        <p className="text-[9px] text-slate-400 font-medium uppercase tracking-[2px] leading-relaxed">
                                            Após realizado, o status será atualizado automaticamente.
                                        </p>
                                    </div>
                                </div>
                            ) : paymentData?.encodedImage ? (
                                /* PIX */
                                <div className="space-y-6">
                                    <div className="p-5 bg-slate-50 border border-slate-200 flex items-center justify-between rounded-md">
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

                                    <div className="flex flex-col items-center gap-6">
                                        <div className="p-4 bg-white border-2 border-[#1D5F31]/20 shadow-sm rounded-md">
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
                                                    className="flex-1 bg-slate-100 border border-slate-200 px-4 py-3 text-xs font-mono outline-none rounded-md"
                                                />
                                                <button 
                                                    onClick={() => copyToClipboard(paymentData.payload)}
                                                    className="px-6 bg-[#1D5F31] text-white hover:bg-[#164a26] transition-all flex items-center justify-center group rounded-md"
                                                >
                                                    {copied ? <CheckIcon size={18} /> : <Copy size={18} className="group-hover:scale-110 transition-transform" />}
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="pt-4 border-t border-slate-100">
                                        <p className="text-[9px] text-slate-400 font-medium uppercase tracking-[2px] leading-relaxed">
                                            O PIX é liberado instantaneamente. Após o pagamento, o status será atualizado.
                                        </p>
                                    </div>
                                </div>
                            ) : paymentData?.identificationField || paymentData?.bankSlipUrl ? (
                                /* BOLETO */
                                <div className="space-y-6">
                                    <div className="p-5 bg-slate-50 border border-slate-200 flex items-center justify-between rounded-md">
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

                                    {paymentData.identificationField && (
                                        <div className="w-full space-y-3">
                                            <p className="text-[10px] font-bold uppercase tracking-[2px] text-slate-500">Linha Digitável</p>
                                            <div className="flex gap-2">
                                                <input 
                                                    readOnly 
                                                    value={paymentData.identificationField}
                                                    className="flex-1 bg-slate-100 border border-slate-200 px-4 py-3 text-xs font-mono outline-none rounded-md"
                                                />
                                                <button 
                                                    onClick={() => copyToClipboard(paymentData.identificationField)}
                                                    className="px-6 bg-slate-900 text-white hover:bg-black transition-all flex items-center justify-center group rounded-md"
                                                >
                                                    {copied ? <CheckIcon size={18} /> : <Copy size={18} className="group-hover:scale-110 transition-transform" />}
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {(paymentData.bankSlipUrl || selectedPayment.invoiceUrl) && (
                                        <a
                                            href={paymentData.bankSlipUrl || selectedPayment.invoiceUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="w-full flex items-center justify-center gap-3 py-4 bg-[#1D5F31] text-white font-bold uppercase tracking-widest text-[10px] hover:brightness-110 transition-all rounded-md"
                                        >
                                            <Download size={16} /> VISUALIZAR / IMPRIMIR BOLETO
                                        </a>
                                    )}

                                    <div className="pt-4 border-t border-slate-100">
                                        <p className="text-[9px] text-slate-400 font-medium uppercase tracking-[2px] leading-relaxed">
                                            O boleto pode levar até 48h úteis para compensação.
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div className="py-12 text-center text-slate-400">
                                    <p className="text-xs font-bold uppercase tracking-widest">Falha ao carregar dados do pagamento.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de Comprovante / Recibo - Udemy Style */}
            {receiptTransaction && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-4xl max-h-[90vh] flex flex-col relative animate-in zoom-in-95 duration-300 shadow-2xl overflow-hidden rounded-xl">
                        
                        {(() => {
                            const t = receiptTransaction
                            const methodLabels: Record<string, string> = {
                                CREDIT_CARD: 'Cartão de Crédito',
                                PIX: 'PIX',
                                BOLETO: 'Boleto Bancário',
                            }
                            const method = t.asaasPaymentMethod || t.billingType || ''
                            const methodText = methodLabels[method] || 'Processado via Asaas'
                            const isPaid = (t.statusPagamento || '').toLowerCase() === 'pago'
                            const isPending = (t.statusPagamento || '').toLowerCase() === 'pendente'

                            return (
                                <>
                                    {/* Header */}
                                    <div className="px-10 pt-10 pb-6 flex justify-between items-start shrink-0 relative">
                                        <button
                                            onClick={() => setReceiptTransaction(null)}
                                            className="absolute top-4 right-4 p-2 text-gray-400 hover:text-black transition-colors rounded-md hover:bg-gray-100"
                                        >
                                            <X size={20} />
                                        </button>
                                        
                                        <div className="flex flex-col">
                                            <Logo light={true} className="h-10 md:h-12 w-auto mb-2" href={null} />
                                        </div>

                                        <div className="text-right mt-2">
                                            <h2 className="text-3xl tracking-tight text-gray-800 font-normal uppercase mb-3">Recibo</h2>
                                            <div className="text-xs text-gray-500 font-medium space-y-1">
                                                <p>Recibo #: {t.idTransacao || t.id || '-'}</p>
                                                <p>Data: {new Date(t.dataCriacao).toLocaleDateString('pt-BR')}</p>
                                                {t.paymentDate && (
                                                    <p>Data do Pgto: {new Date(t.paymentDate).toLocaleDateString('pt-BR')}</p>
                                                )}
                                                <p>Status: <span className={isPaid ? "text-green-600 font-bold" : isPending ? "text-amber-600 font-bold" : "text-gray-600 font-bold"}>{t.statusPagamento || 'Concluído'}</span></p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Content - scrollable */}
                                    <div className="px-10 pb-10 overflow-y-auto flex-1">
                                        <div className="flex justify-between items-start border-t border-b border-gray-100 py-8 mb-8">
                                            <div>
                                                <h3 className="text-sm font-bold text-gray-600 mb-2">Fornecido por:</h3>
                                                <div className="text-xs text-gray-800 space-y-1">
                                                    <p className="font-bold">PowerPlay</p>
                                                    <p>Plataforma de Ensino</p>
                                                    <p>Brasil</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <h3 className="text-sm font-bold text-gray-600 mb-2">Fornecido para:</h3>
                                                <div className="text-xs text-gray-800 space-y-1">
                                                    <p className="font-bold">Aluno da Plataforma</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="w-full">
                                            <div className="grid grid-cols-12 border-b border-gray-200 pb-2 mb-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                                                <div className="col-span-6">Descrição</div>
                                                <div className="col-span-2 text-right">Método</div>
                                                <div className="col-span-2 text-right">Valor</div>
                                                <div className="col-span-2 text-right">Total</div>
                                            </div>
                                            
                                            <div className="grid grid-cols-12 py-4 border-b border-gray-100 text-sm text-gray-800 items-center">
                                                <div className="col-span-6 pr-4">
                                                    {t.cursoTitulo || 'Pagamento de Cursos / Mensalidade na plataforma PowerPlay'}
                                                </div>
                                                <div className="col-span-2 text-right text-xs">
                                                    {methodText}
                                                </div>
                                                <div className="col-span-2 text-right">
                                                    {t.valorBruto === 0 ? 'R$ 0,00' : `R$ ${Number(t.valorBruto).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                                                </div>
                                                <div className="col-span-2 text-right">
                                                    {t.valorBruto === 0 ? 'R$ 0,00' : `R$ ${Number(t.valorBruto).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-12 py-4 text-sm font-bold text-gray-900 bg-gray-50/50 mt-2 px-2">
                                                <div className="col-span-10">Total</div>
                                                <div className="col-span-2 text-right">
                                                    BRL {t.valorBruto === 0 ? '0,00' : Number(t.valorBruto).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                </div>
                                            </div>
                                        </div>

                                        {t.paymentId && (
                                            <div className="mt-8 text-xs text-gray-400 text-center">
                                                Código de Autenticação: {t.paymentId}
                                            </div>
                                        )}
                                        {t.invoiceUrl && (
                                            <div className="mt-4 text-center">
                                                <a
                                                    href={t.invoiceUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-2 px-6 py-3 bg-[#1D5F31] text-white text-[10px] font-bold uppercase tracking-widest hover:brightness-110 transition-all rounded-md"
                                                >
                                                    <ExternalLink size={14} /> Ver Fatura Original
                                                </a>
                                            </div>
                                        )}
                                    </div>
                                </>
                            )
                        })()}
                    </div>
                </div>
            )}
        </div>
    )
}