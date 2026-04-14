"use client"

import { useCartStore } from '@/store/useCartStore'
import {
    ArrowLeft,
    ShieldCheck,
    Lock,
    ChevronRight,
    ExternalLink,
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { processCheckoutAction } from '@/app/(app)/dashboard-student/actions'

export default function CheckoutPage() {
    const { items, getTotal, clearCart } = useCartStore()
    const router = useRouter()
    const [mounted, setMounted] = useState(false)
    const [isProcessing, setIsProcessing] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    useEffect(() => {
        if (mounted && items.length === 0) {
            router.push('/dashboard-student')
        }
    }, [mounted, items, router])

    if (!mounted) return null

    const total = getTotal()

    const handlePayment = async () => {
        setIsProcessing(true)

        try {
            const courseIds = items.map(item => item.id)
            const result = await processCheckoutAction(courseIds)


            if (!result.success) {
                alert("Erro ao processar pagamento: " + result.error)
                setIsProcessing(false)
                return
            }

            clearCart()

            // Curso gratuito: redireciona direto para o dashboard
            if (result.isFree) {
                router.push('/dashboard-student')
                return
            }

            // Pago: redireciona para a página de checkout do Asaas
            if (result.data?.invoiceUrl) {
                window.location.href = result.data.invoiceUrl
                return
            }

            // Fallback caso a action retorne success mas sem invoiceUrl (ex: matrícula já existia)
            router.push('/dashboard-student')
        } catch (error) {
            console.error(error)
            alert("Erro fatal no pagamento. Tente novamente.")
            setIsProcessing(false)
        }
    }

    return (
        <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-montserrat">
            <div className="max-w-4xl mx-auto p-8 md:p-12">
                {/* Header Compacto */}
                <div className="mb-12 flex items-center justify-between">
                    <Link href="/cart" className="p-3 bg-white rounded-2xl border border-slate-200 shadow-sm hover:border-[#1D5F31] transition text-slate-400 hover:text-[#1D5F31]">
                        <ArrowLeft size={24} />
                    </Link>
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-[#1D5F31]/10 rounded-lg flex items-center justify-center">
                            <Lock size={16} className="text-[#1D5F31]" />
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-[4px] text-slate-400">Pagamento 100% Seguro</span>
                    </div>
                </div>

                <div className="grid lg:grid-cols-3 gap-12">
                    {/* Lado Esquerdo: Resumo do Pedido */}
                    <div className="lg:col-span-2 space-y-6">
                        <h2 className="text-3xl font-bold uppercase tracking-tighter text-slate-900">
                            Confirme seu <span className="text-[#1D5F31]">Pedido</span>
                        </h2>

                        <div className="bg-white border border-slate-200 rounded-[32px] divide-y divide-slate-100 overflow-hidden shadow-sm">
                            {items.map(item => (
                                <div key={item.id} className="flex gap-4 items-center p-6">
                                    <div className="w-16 h-16 bg-slate-100 rounded-xl overflow-hidden border border-slate-200 shrink-0">
                                        <img
                                            src={item.image_url || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=200"}
                                            className="w-full h-full object-cover"
                                            alt={item.title}
                                        />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="text-sm font-bold uppercase tracking-tight truncate text-slate-900">{item.title}</h4>
                                        <span className="text-base font-bold text-[#1D5F31]">
                                            {item.price === 0 ? 'Gratuito' : `R$ ${item.price.toFixed(2)}`}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Aviso sobre o checkout externo */}
                        <div className="p-5 bg-[#1D5F31]/5 border border-[#1D5F31]/20 rounded-2xl flex items-start gap-4">
                            <ExternalLink size={20} className="text-[#1D5F31] shrink-0 mt-0.5" />
                            <p className="text-xs text-slate-600 font-bold uppercase tracking-wide leading-relaxed">
                                Ao confirmar, você será redirecionado para a página segura de pagamento do Asaas, onde poderá escolher entre Cartão, PIX ou Boleto.
                            </p>
                        </div>
                    </div>

                    {/* Lado Direito: Total + Botão */}
                    <aside className="space-y-8">
                        <section className="bg-white border border-slate-200 rounded-[40px] p-8 shadow-xl">
                            <h3 className="text-sm font-bold uppercase tracking-[5px] text-[#1D5F31] mb-8">Total</h3>

                            <div className="space-y-4 mb-8">
                                <div className="flex justify-between font-bold uppercase text-[10px] tracking-widest text-slate-400">
                                    <span>Subtotal</span>
                                    <span>R$ {total.toFixed(2)}</span>
                                </div>
                                <div className="h-px bg-slate-100 my-4" />
                                <div className="flex flex-col gap-1">
                                    <span className="text-[10px] font-bold uppercase tracking-[4px] text-slate-400">Total Final</span>
                                    <div className="text-4xl font-bold tracking-tighter text-slate-900">
                                        {total === 0 ? 'Gratuito' : `R$ ${total.toFixed(2)}`}
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={handlePayment}
                                disabled={isProcessing}
                                className={`w-full py-6 mt-4 rounded-[20px] font-bold uppercase tracking-[3px] transition-all flex items-center justify-center gap-3 shadow-lg ${isProcessing
                                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                    : 'bg-[#1D5F31] text-white hover:scale-[1.02] shadow-[0_10px_30px_rgba(0,196,2,0.3)]'
                                    }`}
                            >
                                {isProcessing ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-slate-400 border-t-slate-600 rounded-full animate-spin" />
                                        Processando...
                                    </>
                                ) : (
                                    <>
                                        {total === 0 ? 'Confirmar Matrícula' : 'Ir para Pagamento'}
                                        <ChevronRight size={22} />
                                    </>
                                )}
                            </button>
                        </section>

                        {/* Badges de Segurança */}
                        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col gap-6">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-[#F8FAFC] rounded-xl flex items-center justify-center">
                                    <ShieldCheck size={20} className="text-slate-400" />
                                </div>
                                <div>
                                    <h4 className="text-[10px] font-bold uppercase text-slate-900 tracking-widest">Checkout Seguro</h4>
                                    <p className="text-[8px] text-slate-500 font-bold uppercase tracking-wider">Processado pelo Asaas</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-[#F8FAFC] rounded-xl flex items-center justify-center">
                                    <Lock size={20} className="text-slate-400" />
                                </div>
                                <div>
                                    <h4 className="text-[10px] font-bold uppercase text-slate-900 tracking-widest">PCI DSS</h4>
                                    <p className="text-[8px] text-slate-500 font-bold uppercase tracking-wider">Padrão Mundial de Segurança</p>
                                </div>
                            </div>
                        </div>
                    </aside>
                </div>
            </div>
        </div>
    )
}
