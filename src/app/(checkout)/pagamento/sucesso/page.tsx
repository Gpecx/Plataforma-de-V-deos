import {
    getPayment,
    getPaymentQrCode,
    getPaymentIdentification
} from '@/services/asaasService'
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
import { redirect } from 'next/navigation'
import CopyButton from '@/components/CopyButton' // Assumindo que temos um componente de cópia ou criarei um básico

interface SuccessPageProps {
    searchParams: {
        id?: string
        type?: string
    }
}

export default async function SucessoPagamentoPage({ searchParams }: SuccessPageProps) {
    const params = await searchParams
    const paymentId = params.id
    const type = params.type

    if (!paymentId) {
        redirect('/course')
    }

    try {
        const payment = await getPayment(paymentId)

        let pixData = null
        let boletoData = null

        if (payment.billingType === 'PIX') {
            pixData = await getPaymentQrCode(paymentId)
        } else if (payment.billingType === 'BOLETO') {
            boletoData = await getPaymentIdentification(paymentId)
        }

        return (
            <div className="min-h-screen bg-white text-slate-900 font-exo py-20 px-4">
                <div className="max-w-3xl mx-auto text-center">
                    <div className="mb-8 flex justify-center">
                        <div className="p-4 bg-[#1D5F31]/10 rounded-full">
                            <CheckCircle2 size={64} className="text-[#1D5F31]" />
                        </div>
                    </div>

                    <h1 className="text-4xl font-extrabold text-[#1a1a1a] mb-4 tracking-tight uppercase">
                        {payment.status === 'RECEIVED' || payment.status === 'CONFIRMED'
                            ? 'Pagamento Confirmado!'
                            : 'Pedido Realizado!'}
                    </h1>
                    <p className="text-slate-500 font-medium mb-12 max-w-lg mx-auto">
                        Sua inscrição foi reservada.
                        {payment.billingType === 'PIX' && ' Conclua o pagamento via PIX para liberação imediata.'}
                        {payment.billingType === 'BOLETO' && ' O boleto pode levar até 48h para ser compensado.'}
                        {payment.billingType === 'CREDIT_CARD' && ' Estamos processando seu cartão.'}
                    </p>

                    <div className="bg-white border-[3px] border-slate-900 p-8 md:p-12 mb-10 text-left relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-2 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest">
                            {payment.billingType}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                            {/* Lado Esquerdo: Info Principal */}
                            <div className="space-y-6">
                                <div>
                                    <span className="text-[10px] font-black uppercase tracking-[3px] text-slate-400">Total a Pagar</span>
                                    <div className="text-4xl font-black text-[#1D5F31]">R$ {payment.value.toFixed(2)}</div>
                                </div>

                                {payment.billingType === 'PIX' && pixData && (
                                    <div className="space-y-4">
                                        <div className="p-4 bg-slate-50 border border-slate-200">
                                            <p className="text-[10px] font-black uppercase mb-2 text-slate-500">Copia e Cola PIX</p>
                                            <div className="flex gap-2">
                                                <input
                                                    readOnly
                                                    value={pixData.payload}
                                                    className="w-full bg-transparent text-xs font-mono truncate border-none outline-none"
                                                />
                                                <CopyButton text={pixData.payload} />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {payment.billingType === 'BOLETO' && boletoData && (
                                    <div className="space-y-4">
                                        <div className="p-4 bg-slate-50 border border-slate-200">
                                            <p className="text-[10px] font-black uppercase mb-2 text-slate-500">Linha Digitável</p>
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

                                <div className="pt-4 border-t border-slate-100 flex flex-wrap gap-4">
                                    <a
                                        href={payment.invoiceUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-colors"
                                    >
                                        Ver Fatura Original <ExternalLink size={14} />
                                    </a>
                                    {payment.billingType === 'BOLETO' && (
                                        <a
                                            href={payment.invoiceUrl} // Link simplificado, Asaas fornece o PDF
                                            target="_blank"
                                            className="inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-[#1D5F31] hover:underline"
                                        >
                                            Baixar Boleto PDF <Download size={14} />
                                        </a>
                                    )}
                                </div>
                            </div>

                            {/* Lado Direito: QR Code Visual */}
                            {payment.billingType === 'PIX' && pixData && (
                                <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-200 bg-slate-50/50">
                                    <div className="w-48 h-48 bg-white p-2 shadow-sm mb-4">
                                        <img
                                            src={`data:image/png;base64,${pixData.encodedImage}`}
                                            alt="QR Code PIX"
                                            className="w-full h-full object-contain"
                                        />
                                    </div>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Escaneie para pagar</span>
                                </div>
                            )}

                            {payment.billingType === 'BOLETO' && (
                                <div className="flex flex-col items-center justify-center p-6 bg-slate-50">
                                    <ReceiptText size={80} className="text-slate-200 mb-4" />
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Boleto gerado com sucesso</span>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex flex-col md:flex-row gap-4 justify-center">
                        <Link
                            href="/dashboard-student"
                            className="px-10 py-5 bg-slate-900 text-white font-black uppercase italic tracking-[3px] hover:bg-slate-800 transition-all text-sm"
                        >
                            IR PARA MEUS CURSOS →
                        </Link>
                        <Link
                            href="/course"
                            className="px-10 py-5 border-[3px] border-slate-900 text-slate-900 font-black uppercase italic tracking-[3px] hover:bg-slate-50 transition-all text-sm"
                        >
                            CONTINUAR COMPRANDO
                        </Link>
                    </div>

                    <p className="mt-12 text-slate-400 text-xs font-bold uppercase tracking-[2px]">
                        Dúvidas? Entre em contato com o suporte.
                    </p>
                </div>
            </div>
        )
    } catch (error) {
        console.error('Erro ao carregar sucesso pagamento:', error)
        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <div className="text-center">
                    <h1 className="text-2xl font-bold mb-4">Ops! Algo deu errado.</h1>
                    <p className="text-slate-500 mb-8">Não conseguimos localizar os detalhes do seu pagamento.</p>
                    <Link href="/dashboard-student" className="text-[#1D5F31] font-bold underline">
                        Ir para o Dashboard
                    </Link>
                </div>
            </div>
        )
    }
}
