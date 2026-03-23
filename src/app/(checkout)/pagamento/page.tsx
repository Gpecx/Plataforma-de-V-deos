"use client"

import { useCartStore } from '@/store/useCartStore'
import {
    CreditCard,
    QrCode,
    ReceiptText,
    ShieldCheck,
    Lock,
    ChevronRight,
    ArrowLeft
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { processCheckoutAction } from '@/app/(app)/dashboard-student/actions'
import { cn } from '@/lib/utils'

type PaymentMethod = 'credit_card' | 'pix' | 'boleto'

export default function PagamentoPage() {
    const { items, getTotal, clearCart } = useCartStore()
    const router = useRouter()
    const [mounted, setMounted] = useState(false)
    const [isProcessing, setIsProcessing] = useState(false)
    const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('credit_card')

    useEffect(() => {
        setMounted(true)
    }, [])

    useEffect(() => {
        if (mounted && items.length === 0) {
            router.push('/course')
        }
    }, [mounted, items, router])

    if (!mounted) return null

    const total = getTotal()

    const handlePayment = async () => {
        setIsProcessing(true)

        try {
            const courseIds = items.map(item => item.id)
            
            // Mapeamento de métodos internos para Asaas BillingType
            const methodMap: Record<PaymentMethod, any> = {
                credit_card: 'CREDIT_CARD',
                pix: 'PIX',
                boleto: 'BOLETO'
            }

            const result = await processCheckoutAction(courseIds, methodMap[selectedMethod])

            if (!result.success) {
                alert("Erro ao processar pagamento: " + result.error)
                setIsProcessing(false)
                return
            }

            clearCart()

            if (result.isFree) {
                router.push('/dashboard-student')
                return
            }

            if (result.data) {
                const { paymentId, billingType, invoiceUrl } = result.data

                if (billingType === 'PIX' || billingType === 'BOLETO') {
                    router.push(`/pagamento/sucesso?id=${paymentId}&type=${billingType}`)
                    return
                }

                if (invoiceUrl) {
                    window.location.href = invoiceUrl
                    return
                }
            }

            router.push('/dashboard-student')
        } catch (error) {
            console.error(error)
            alert("Erro fatal no pagamento. Tente novamente.")
            setIsProcessing(false)
        }
    }

    return (
        <div className="min-h-screen bg-white text-slate-900 font-exo mb-20">
            <div className="max-w-6xl mx-auto px-4 md:px-8 py-12">
                
                {/* Header Back Button */}
                <div className="mb-10">
                    <Link href="/cart" className="inline-flex items-center gap-2 text-sm font-black uppercase tracking-widest text-slate-400 hover:text-[#1D5F31] transition-colors group">
                        <div className="p-2 border border-slate-200 rounded-none group-hover:border-[#1D5F31] transition-colors">
                            <ArrowLeft size={18} />
                        </div>
                        Voltar ao Carrinho
                    </Link>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                    
                    {/* Coluna Esquerda (7/12): Formas de Pagamento */}
                    <div className="lg:col-span-7 space-y-10">
                        <div>
                            <h1 className="text-3xl font-bold text-[#1a1a1a] mb-2">Escolha sua forma de pagamento</h1>
                            <p className="text-slate-500 font-medium">Selecione o método de sua preferência para concluir a inscrição.</p>
                        </div>

                        <div className="space-y-4">
                            {/* Cartão de Crédito */}
                            <div 
                                onClick={() => setSelectedMethod('credit_card')}
                                className={cn(
                                    "p-5 border cursor-pointer transition-all duration-200 bg-white flex items-center justify-between group",
                                    selectedMethod === 'credit_card' 
                                        ? "border-[2px] border-[#1D5F31] ring-0" 
                                        : "border-gray-200 hover:border-gray-400"
                                )}
                            >
                                <div className="flex items-center gap-4">
                                    <div className={cn(
                                        "p-3 rounded-none transition-colors",
                                        selectedMethod === 'credit_card' ? "bg-[#1D5F31]/10 text-[#1D5F31]" : "bg-slate-50 text-slate-400"
                                    )}>
                                        <CreditCard size={24} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg text-[#1a1a1a]">Cartão de Crédito</h3>
                                        <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">Aprovação imediata • Parcelamento em até 12x</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 opacity-40 group-hover:opacity-100 transition-opacity">
                                    <img src="https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg" alt="Visa" className="h-4" />
                                    <img src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" alt="Mastercard" className="h-6" />
                                </div>
                            </div>

                            {/* PIX */}
                            <div 
                                onClick={() => setSelectedMethod('pix')}
                                className={cn(
                                    "p-5 border cursor-pointer transition-all duration-200 bg-white flex items-center justify-between group",
                                    selectedMethod === 'pix' 
                                        ? "border-[2px] border-[#1D5F31] ring-0" 
                                        : "border-gray-200 hover:border-gray-400"
                                )}
                            >
                                <div className="flex items-center gap-4">
                                    <div className={cn(
                                        "p-3 rounded-none transition-colors",
                                        selectedMethod === 'pix' ? "bg-[#1D5F31]/10 text-[#1D5F31]" : "bg-slate-50 text-slate-400"
                                    )}>
                                        <QrCode size={24} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg text-[#1a1a1a]">PIX</h3>
                                        <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">Liberação instantânea • Desconto progressivo</p>
                                    </div>
                                </div>
                                <div className="bg-[#32BCAD]/10 text-[#32BCAD] px-2 py-1 text-[10px] font-black uppercase tracking-tighter">Instantâneo</div>
                            </div>

                            {/* Boleto */}
                            <div 
                                onClick={() => setSelectedMethod('boleto')}
                                className={cn(
                                    "p-5 border cursor-pointer transition-all duration-200 bg-white flex items-center justify-between group",
                                    selectedMethod === 'boleto' 
                                        ? "border-[2px] border-[#1D5F31] ring-0" 
                                        : "border-gray-200 hover:border-gray-400"
                                )}
                            >
                                <div className="flex items-center gap-4">
                                    <div className={cn(
                                        "p-3 rounded-none transition-colors",
                                        selectedMethod === 'boleto' ? "bg-[#1D5F31]/10 text-[#1D5F31]" : "bg-slate-50 text-slate-400"
                                    )}>
                                        <ReceiptText size={24} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg text-[#1a1a1a]">Boleto Bancário</h3>
                                        <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">Compensação em até 48 horas úteis</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Informação Asaas */}
                        <div className="pt-6 border-t border-slate-100 italic">
                            <div className="flex items-center gap-3 text-slate-400">
                                <ShieldCheck size={20} />
                                <p className="text-sm font-medium">Pague com segurança através do Asaas. Seus dados estão protegidos.</p>
                            </div>
                        </div>
                    </div>

                    {/* Coluna Direita (5/12): Resumo do Pedido */}
                    <aside className="lg:col-span-5">
                        <div className="bg-white border border-gray-200 p-8 sticky top-32">
                            <h2 className="text-sm font-black uppercase tracking-[5px] text-[#1D5F31] mb-8 italic">Resumo Profissional</h2>

                            <div className="space-y-6 mb-8 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                {items.map(item => (
                                    <div key={item.id} className="flex gap-4 items-center">
                                        <div className="w-16 h-16 bg-slate-100 rounded-none overflow-hidden border border-slate-100 shrink-0">
                                            <img
                                                src={item.image_url || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=200"}
                                                className="w-full h-full object-cover"
                                                alt={item.title}
                                            />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="text-[12px] font-black uppercase tracking-tight truncate text-[#1a1a1a]">{item.title}</h4>
                                            <span className="text-sm font-bold text-[#1D5F31]">
                                                {item.price === 0 ? 'Gratuito' : `R$ ${item.price.toFixed(2)}`}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="h-px bg-slate-100 my-8" />

                            <div className="space-y-4 mb-10">
                                <div className="flex justify-between font-bold uppercase text-[10px] tracking-widest text-slate-400">
                                    <span>Subtotal</span>
                                    <span>R$ {total.toFixed(2)}</span>
                                </div>
                                <div className="flex flex-col gap-1">
                                    <span className="text-[10px] font-black uppercase tracking-[4px] text-slate-400">Total Final</span>
                                    <div className="text-5xl font-extrabold tracking-tighter text-[#1D5F31]">
                                        {total === 0 ? 'Gratuito' : `R$ ${total.toFixed(2)}`}
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={handlePayment}
                                disabled={isProcessing}
                                className={cn(
                                    "w-full py-6 rounded-none font-black uppercase italic tracking-[3px] transition-all flex items-center justify-center gap-3",
                                    isProcessing
                                        ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                        : 'bg-[#1D5F31] text-white hover:brightness-110 active:scale-[0.98]'
                                )}
                            >
                                {isProcessing ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Processando...
                                    </>
                                ) : (
                                    <>
                                        CONFIRMAR PAGAMENTO →
                                    </>
                                )}
                            </button>

                            <div className="mt-8 pt-8 border-t border-slate-100 grid grid-cols-2 gap-4">
                                <div className="flex items-center gap-3">
                                    <Lock size={16} className="text-slate-300" />
                                    <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400 leading-tight">Checkout<br/>Seguro</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <ShieldCheck size={16} className="text-slate-300" />
                                    <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400 leading-tight">Proteção<br/>de Dados</span>
                                </div>
                            </div>
                        </div>
                    </aside>
                </div>
            </div>
        </div>
    )
}
