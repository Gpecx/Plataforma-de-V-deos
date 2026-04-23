"use client"

import {
    getPaymentStatusAction,
    getPixDataAction,
    getBoletoDataAction
} from '@/app/(app)/dashboard-student/actions'
import {
    CheckCircle2,
    Copy,
    Download,
    ExternalLink,
    QrCode,
    ReceiptText,
    ArrowLeft
} from 'lucide-react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import CopyButton from '@/components/CopyButton'
import { useCartStore } from '@/store/useCartStore'

export default function SucessoPagamentoPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const { checkoutResult } = useCartStore()
    
    const [payment, setPayment] = useState<any>(null)
    const [pixData, setPixData] = useState<any>(null)
    const [boletoData, setBoletoData] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const paymentId = searchParams.get('id')

    useEffect(() => {
        if (!paymentId) {
            router.push('/course')
            return
        }

        async function loadData() {
            try {
                // 1. Tenta usar dados do store primeiro para evitar fetch extra
                if (checkoutResult && checkoutResult.paymentId === paymentId) {
                    console.log("DEBUG_SUCCESS_STORE_FOUND:", checkoutResult)
                    
                    if (checkoutResult.pixData) {
                        setPixData(checkoutResult.pixData)
                    }

                    const res = await getPaymentStatusAction(paymentId)
                    if (res.success) {
                        setPayment(res.data)
                        setLoading(false)
                        return
                    }
                }

                // 2. Se não houver no store ou falhar, busca via Server Actions
                console.log("DEBUG_SUCCESS_FETCHING_VIA_ACTIONS...")
                const paymentRes = await getPaymentStatusAction(paymentId)
                if (!paymentRes.success) throw new Error(paymentRes.error)
                
                const paymentDetail = paymentRes.data
                setPayment(paymentDetail)

                if (paymentDetail.billingType === 'PIX') {
                    const pixRes = await getPixDataAction(paymentId)
                    if (pixRes.success) setPixData(pixRes.data)
                } else if (paymentDetail.billingType === 'BOLETO') {
                    const boletoRes = await getBoletoDataAction(paymentId)
                    if (boletoRes.success) setBoletoData(boletoRes.data)
                }
                
                setLoading(false)
            } catch (err: any) {
                console.error("ERRO_SUCCESS_PAGE_LOAD:", err)
                setError(err.message || "Erro ao carregar dados do pagamento")
                setLoading(false)
            }
        }

        loadData()
    }, [paymentId, checkoutResult, router])

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-[#1D5F31]/20 border-t-[#1D5F31] rounded-full animate-spin" />
                    <p className="text-sm font-bold uppercase tracking-widest text-black">Carregando detalhes...</p>
                </div>
            </div>
        )
    }

    if (error || !payment) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4 bg-white">
                <div className="text-center max-w-md">
                    <h1 className="text-2xl font-bold mb-4 uppercase tracking-tighter">Ops! Algo deu errado.</h1>
                    <p className="text-slate-500 mb-8 font-medium">Não conseguimos localizar os detalhes do seu pagamento ou ele expirou.</p>
                    <Link href="/dashboard-student" className="inline-block px-8 py-4 bg-[#1D5F31] text-white font-bold uppercase tracking-widest hover:brightness-110 transition-all">
                        Ir para o Dashboard
                    </Link>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-white text-black font-montserrat py-20 px-4">
            <div className="max-w-3xl mx-auto text-center">
                <div className="mb-8 flex justify-center">
                    <div className="p-4 bg-[#1D5F31]/10 rounded-none">
                        <CheckCircle2 size={64} className="text-[#1D5F31]" />
                    </div>
                </div>

                <h1 className="text-4xl font-bold text-black mb-4 tracking-tight uppercase not-italic">
                    {payment.status === 'RECEIVED' || payment.status === 'CONFIRMED'
                        ? 'Pagamento Confirmado!'
                        : 'Pedido Realizado!'}
                </h1>
                <p className="text-black font-medium mb-12 max-w-lg mx-auto not-italic">
                    Sua inscrição foi reservada.
                    {payment.billingType === 'PIX' && ' Conclua o pagamento via PIX para liberação imediata.'}
                    {payment.billingType === 'BOLETO' && ' O boleto pode levar até 48h para ser compensado.'}
                    {payment.billingType === 'CREDIT_CARD' && ' Estamos processando seu cartão.'}
                </p>

                <div className="bg-white border-[3px] border-black p-8 md:p-12 mb-10 text-left relative overflow-hidden">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                        <div className="space-y-6">
                            <div>
                                <span className="text-[10px] font-bold uppercase tracking-[3px] text-black not-italic">Total a Pagar</span>
                                <div className="text-4xl font-bold text-[#1D5F31] not-italic">R$ {payment.value.toFixed(2)}</div>
                            </div>

                            {payment.billingType === 'PIX' && pixData && (
                                <div className="space-y-4">
                                    <div className="p-4 bg-white border-2 border-black rounded-none">
                                        <p className="text-[10px] font-bold uppercase mb-2 text-black not-italic">Copia e Cola PIX</p>
                                        <div className="flex gap-2">
                                            <input
                                                readOnly
                                                value={pixData.payload}
                                                className="w-full bg-transparent text-xs font-mono truncate border-none outline-none not-italic"
                                            />
                                            <CopyButton text={pixData.payload} />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {payment.billingType === 'BOLETO' && boletoData && (
                                <div className="space-y-4">
                                    <div className="p-4 bg-slate-50 border border-slate-200">
                                        <p className="text-[10px] font-bold uppercase mb-2 text-slate-500">Linha Digitável</p>
                                        <div className="flex gap-2">
                                            <input
                                                readOnly
                                                value={boletoData.identificationField}
                                                className="w-full bg-transparent text-xs font-mono truncate border-none outline-none"
                                            />
                                            <CopyButton text={boletoData.identificationField} />
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="pt-4 border-t border-black flex flex-wrap gap-4">
                                <a
                                    href={payment.invoiceUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-black hover:text-black transition-colors not-italic"
                                >
                                    Ver Fatura Original <ExternalLink size={14} />
                                </a>
                            </div>
                        </div>

                        {payment.billingType === 'PIX' && pixData && (
                            <>
                                {console.log("DEBUG_RENDER_PIX_CLIENT:", { 
                                    pixDataExists: !!pixData, 
                                    hasEncodedImage: !!pixData?.encodedImage,
                                    fullPath: "res.data.pixData.encodedImage",
                                    value: pixData?.encodedImage?.substring(0, 30) + "..."
                                })}
                                <div className="flex flex-col items-center justify-center p-6 bg-white border-2 border-black rounded-none">
                                    <div className="w-48 h-48 bg-white p-2 shadow-sm mb-4 border-2 border-black rounded-none">
                                        <img
                                            src={`data:image/png;base64,${pixData.encodedImage}`}
                                            alt="QR Code PIX"
                                            className="w-full h-full object-contain not-italic"
                                        />
                                    </div>
                                    <span className="text-[10px] font-bold text-black uppercase tracking-widest not-italic">Escaneie para pagar</span>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                <div className="flex flex-col md:flex-row gap-4 justify-center">
                    <Link
                        href="/dashboard-student"
                        className="px-10 py-5 bg-[#061629] !text-white font-bold uppercase tracking-[3px] hover:bg-[#061629]/90 transition-all text-sm rounded-none"
                    >
                        IR PARA MEUS CURSOS →
                    </Link>
                </div>
            </div>
        </div>
    )
}
