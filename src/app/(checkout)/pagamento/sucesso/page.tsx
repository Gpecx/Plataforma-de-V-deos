"use client"

import {
    getPaymentStatusAction,
    getPixDataAction,
    getBoletoDataAction
} from '@/app/(app)/dashboard-student/actions'
import { toast } from 'sonner'
import {
    CheckCircle2,
    Download,
    ExternalLink,
    ReceiptText
} from 'lucide-react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState, Suspense } from 'react'
import CopyButton from '@/components/CopyButton'
import { useCartStore } from '@/store/useCartStore'

function SkeletonBox({ className }: { className?: string }) {
    return <div className={`animate-pulse bg-slate-200 ${className}`} />
}

function SucessoContent() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const { checkoutResult } = useCartStore()
    
    const [hasHydrated, setHasHydrated] = useState(false)
    const [payment, setPayment] = useState<any>(null)
    const [pixData, setPixData] = useState<any>(null)
    const [boletoData, setBoletoData] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const paymentId = searchParams.get('id')

    useEffect(() => {
        setHasHydrated(true)
    }, [])

    useEffect(() => {
        if (!hasHydrated) return
        
        if (!paymentId) {
            router.push('/course')
            return
        }

        const validPaymentId: string = paymentId

        async function loadData() {
            try {
                if (checkoutResult && checkoutResult.paymentId === validPaymentId) {
                    
                    if (checkoutResult.pixData) {
                        setPixData(checkoutResult.pixData)
                    }

                    const res = await getPaymentStatusAction(validPaymentId)
                    if (res.success && res.data) {
                        setPayment(res.data)
                        setLoading(false)
                        return
                    }
                }

                const paymentRes = await getPaymentStatusAction(validPaymentId)
                if (!paymentRes.success || !paymentRes.data) {
                    throw new Error(paymentRes.error || "Dados do pagamento não encontrados")
                }
                
                const paymentDetail = paymentRes.data
                setPayment(paymentDetail)

                if (paymentDetail.billingType === 'PIX') {
                    const pixRes = await getPixDataAction(validPaymentId)
                    if (pixRes.success) {
                        setPixData(pixRes.data)
                    } else {
                        const errMsg = pixRes.error || 'Erro ao carregar dados do PIX. Tente novamente na página de pagamentos.'
                        toast.error(errMsg)
                        setError(errMsg)
                    }
                } else if (paymentDetail.billingType === 'BOLETO') {
                    const boletoRes = await getBoletoDataAction(validPaymentId)
                    if (boletoRes.success) {
                        setBoletoData(boletoRes.data)
                    } else {
                        const errMsg = boletoRes.error || 'Erro ao carregar dados do boleto. Tente novamente na página de pagamentos.'
                        toast.error(errMsg)
                        setError(errMsg)
                    }
                }
                
                setLoading(false)
            } catch (err: any) {
                console.error("ERRO_SUCCESS_PAGE_LOAD:", err)
                setError(err.message || "Erro ao carregar dados do pagamento")
                setLoading(false)
            }
        }

        loadData()
    }, [paymentId, checkoutResult, router, hasHydrated])

    const billingType = payment?.billingType

    return (
        <div className="min-h-screen bg-white text-black font-montserrat py-20 px-4">
            <div className="max-w-3xl mx-auto text-center">
                <div className="mb-8 flex justify-center">
                    <div className="p-4 bg-[#1D5F31]/10 rounded-none">
                        <CheckCircle2 size={64} className="text-[#1D5F31]" />
                    </div>
                </div>

                <h1 className="text-4xl font-bold text-black mb-4 tracking-tight uppercase not-italic">
                    {(payment?.status === 'RECEIVED' || payment?.status === 'CONFIRMED')
                        ? 'Pagamento Confirmado!'
                        : 'Pedido Realizado!'}
                </h1>
                <p className="text-black font-medium mb-12 max-w-lg mx-auto not-italic">
                    Sua inscrição foi reservada.
                    {billingType === 'PIX' && ' Conclua o pagamento via PIX para liberação imediata.'}
                    {billingType === 'BOLETO' && ' O boleto pode levar até 48h para ser compensado.'}
                    {billingType === 'CREDIT_CARD' && (payment?.status === 'CONFIRMED' || payment?.status === 'RECEIVED'
                        ? ' Pagamento aprovado! Você já tem acesso aos cursos.'
                        : ' Estamos processando seu cartão.')}
                </p>

                {/* Comprovante / Recibo */}
                <div className="bg-white border-[3px] border-black p-8 md:p-12 mb-10 text-left relative overflow-hidden">
                    <div className="mb-8 pb-6 border-b border-black">
                        <span className="text-[10px] font-bold uppercase tracking-[4px] text-[#1D5F31] block mb-2">Comprovante de Transação</span>
                        <h2 className="text-xl font-bold uppercase tracking-tighter text-[#1a1a1a]">Recibo PowerPlay</h2>
                    </div>

                    {loading ? (
                        <div className="space-y-4">
                            <SkeletonBox className="h-8 w-48" />
                            <SkeletonBox className="h-8 w-full" />
                            <SkeletonBox className="h-8 w-full" />
                            <SkeletonBox className="h-8 w-64" />
                            <SkeletonBox className="h-8 w-full" />
                            <SkeletonBox className="h-12 w-40" />
                        </div>
                    ) : (
                        <div className="space-y-5">
                            {/* Valor */}
                            <div className="flex justify-between items-center pb-4 border-b border-slate-200">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Valor</span>
                                <span className="text-3xl font-bold text-[#1D5F31]">R$ {payment?.value?.toFixed(2) || '0.00'}</span>
                            </div>
                            {/* Status */}
                            <div className="flex justify-between items-center pb-4 border-b border-slate-200">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Status</span>
                                <span className={`text-sm font-bold uppercase ${payment?.status === 'CONFIRMED' || payment?.status === 'RECEIVED' ? 'text-[#1D5F31]' : 'text-amber-600'}`}>
                                    {payment?.status === 'CONFIRMED' || payment?.status === 'RECEIVED' ? 'Pago' : payment?.status || 'Pendente'}
                                </span>
                            </div>
                            {/* Data */}
                            <div className="flex justify-between items-center pb-4 border-b border-slate-200">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Data</span>
                                <span className="text-sm font-bold text-[#1a1a1a]">
                                    {payment?.paymentDate
                                        ? new Date(payment.paymentDate).toLocaleString('pt-BR')
                                        : payment?.dateCreated
                                        ? new Date(payment.dateCreated).toLocaleDateString('pt-BR')
                                        : '-'}
                                </span>
                            </div>
                            {/* Método */}
                            <div className="flex justify-between items-center pb-4 border-b border-slate-200">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Método</span>
                                <span className="text-sm font-bold text-[#1a1a1a]">
                                    {billingType === 'CREDIT_CARD' ? 'Cartão de Crédito' : billingType === 'PIX' ? 'PIX' : billingType === 'BOLETO' ? 'Boleto Bancário' : '-'}
                                </span>
                            </div>
                            {/* Código de Autenticação Asaas */}
                            <div className="flex justify-between items-center pb-4 border-b border-slate-200">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Cód. Autenticação</span>
                                <span className="text-xs font-mono font-bold text-[#1a1a1a] break-all text-right max-w-[250px]">
                                    {payment?.id || checkoutResult?.paymentId || '-'}
                                </span>
                            </div>
                            {/* Links */}
                            <div className="flex flex-wrap gap-4 pt-2">
                                {payment?.invoiceUrl && (
                                    <a
                                        href={payment.invoiceUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-2 px-6 py-3 bg-[#1D5F31] text-white text-[10px] font-bold uppercase tracking-widest hover:brightness-110 transition-all rounded-md"
                                    >
                                        <ExternalLink size={14} /> Ver Fatura Original
                                    </a>
                                )}
                                {billingType === 'BOLETO' && payment?.bankSlipUrl && (
                                    <a
                                        href={payment.bankSlipUrl}
                                        target="_blank"
                                        className="inline-flex items-center gap-2 px-6 py-3 border border-black text-black text-[10px] font-bold uppercase tracking-widest hover:bg-slate-50 transition-all rounded-md"
                                    >
                                        <Download size={14} /> Baixar Boleto PDF
                                    </a>
                                )}
                            </div>

                            {/* PIX: Copia e Cola */}
                            {billingType === 'PIX' && pixData && (
                                <div className="pt-4 border-t border-black">
                                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-md">
                                        <p className="text-[10px] font-bold uppercase mb-2 text-slate-500 not-italic">Copia e Cola PIX</p>
                                        <div className="flex gap-2">
                                            <input
                                                readOnly
                                                value={pixData.payload || ''}
                                                className="w-full bg-transparent text-xs font-mono truncate border-none outline-none not-italic"
                                            />
                                            <CopyButton text={pixData.payload || ''} />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* BOLETO: Linha Digitável */}
                            {billingType === 'BOLETO' && boletoData && (
                                <div className="pt-4 border-t border-black">
                                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-md">
                                        <p className="text-[10px] font-bold uppercase mb-2 text-slate-500">Linha Digitável</p>
                                        <div className="flex gap-2">
                                            <input
                                                readOnly
                                                value={boletoData.identificationField || ''}
                                                className="w-full bg-transparent text-xs font-mono truncate border-none outline-none"
                                            />
                                            <CopyButton text={boletoData.identificationField || ''} />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* PIX QR Code em bloco separado */}
                {billingType === 'PIX' && (
                    <div className="flex justify-center mb-10">
                        <div className="flex flex-col items-center justify-center p-8 bg-white border-[3px] border-black">
                            {loading ? (
                                <SkeletonBox className="w-48 h-48" />
                            ) : pixData ? (
                                <div className="w-48 h-48 bg-white p-2 shadow-sm mb-4 border-2 border-black">
                                    <img
                                        src={`data:image/png;base64,${pixData.encodedImage || pixData.data?.encodedImage || ''}`}
                                        alt="QR Code PIX"
                                        className="w-full h-full object-contain not-italic"
                                    />
                                </div>
                            ) : (
                                <SkeletonBox className="w-48 h-48" />
                            )}
                            <span className="text-[10px] font-bold text-black uppercase tracking-widest not-italic">Escaneie para pagar</span>
                        </div>
                    </div>
                )}

                {payment?.status === 'RECEIVED' || payment?.status === 'CONFIRMED' ? (
                    <div className="flex flex-col md:flex-row gap-4 justify-center">
                        <Link
                            href="/dashboard-student"
                            className="px-10 py-5 bg-[#061629] !text-white font-bold uppercase tracking-[3px] hover:bg-[#061629]/90 transition-all text-sm rounded-none"
                        >
                            IR PARA MEUS CURSOS →
                        </Link>
                    </div>
                ) : !loading ? (
                    <div className="flex flex-col md:flex-row gap-4 justify-center">
                        <Link
                            href="/dashboard-student/payments"
                            className="px-10 py-5 bg-[#061629] !text-white font-bold uppercase tracking-[3px] hover:bg-[#061629]/90 transition-all text-sm rounded-none"
                        >
                            ACOMPANHAR PAGAMENTO →
                        </Link>
                    </div>
                ) : (
                    <div className="flex flex-col md:flex-row gap-4 justify-center">
                        <Link
                            href="/dashboard-student"
                            className="px-10 py-5 bg-[#061629] !text-white font-bold uppercase tracking-[3px] hover:bg-[#061629]/90 transition-all text-sm rounded-none"
                        >
                            IR PARA MEUS CURSOS →
                        </Link>
                    </div>
                )}
            </div>
        </div>
    )
}

export default function SucessoPagamentoPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-white">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-[#1D5F31]/20 border-t-[#1D5F31] rounded-full animate-spin" />
                    <p className="text-sm font-bold uppercase tracking-widest text-black">Iniciando...</p>
                </div>
            </div>
        }>
            <SucessoContent />
        </Suspense>
    )
}