"use client"

import { useCartStore } from '@/store/useCartStore'
import {
    CreditCard,
    ArrowLeft,
    ShieldCheck,
    Smartphone,
    QrCode,
    FileText,
    Lock,
    CheckCircle2,
    Copy,
    ChevronRight,
    Zap
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { processCheckoutAction } from '@/app/dashboard-student/actions'

type PaymentMethod = 'card' | 'pix' | 'boleto'

export default function CheckoutPage() {
    const { items, getTotal, clearCart } = useCartStore()
    const router = useRouter()
    const [mounted, setMounted] = useState(false)
    const [method, setMethod] = useState<PaymentMethod>('card')
    const [isProcessing, setIsProcessing] = useState(false)

    useEffect(() => {
        setMounted(true)
        if (mounted && items.length === 0) {
            router.push('/dashboard-student')
        }
    }, [mounted, items, router])

    if (!mounted) return null

    const total = getTotal()

    const handlePayment = async () => {
        setIsProcessing(true)

        try {
            // 1. Pega os IDs dos cursos no carrinho
            const courseIds = items.map(item => item.id)

            // 2. Chama a action para gravar no banco
            const result = await processCheckoutAction(courseIds)

            if (result.success) {
                // 3. Feedback e Limpeza
                clearCart()
                router.push('/checkout/success')
            } else {
                alert("Erro ao processar matrícula: " + result.error)
                setIsProcessing(false)
            }
        } catch (error) {
            console.error(error)
            alert("Erro fatal no pagamento. Tente novamente.")
            setIsProcessing(false)
        }
    }

    return (
        <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-exo">
            <div className="max-w-6xl mx-auto p-8 md:p-12">
                {/* Header Compacto */}
                <div className="mb-12 flex items-center justify-between">
                    <Link href="/cart" className="p-3 bg-white rounded-2xl border border-slate-200 shadow-sm hover:border-[#00C402] transition text-slate-400 hover:text-[#00C402]">
                        <ArrowLeft size={24} />
                    </Link>
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-[#00C402]/10 rounded-lg flex items-center justify-center">
                            <Lock size={16} className="text-[#00C402]" />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-[4px] text-slate-400 italic">Pagamento 100% Seguro</span>
                    </div>
                </div>

                <div className="grid lg:grid-cols-3 gap-12">
                    {/* Lado Esquerdo: Payment Methods */}
                    <div className="lg:col-span-2 space-y-10">
                        <div>
                            <h2 className="text-3xl font-black italic uppercase tracking-tighter mb-8 text-slate-900">
                                Escolha como <span className="text-[#00C402]">Pagar</span>
                            </h2>

                            {/* Tabs Elite */}
                            <div className="grid grid-cols-3 gap-4 mb-10">
                                <button
                                    onClick={() => setMethod('card')}
                                    className={`flex flex-col items-center gap-3 p-6 rounded-3xl border transition-all ${method === 'card' ? 'bg-[#00C402] border-[#00C402] text-white shadow-lg scale-105' : 'bg-white border-slate-200 text-slate-400 hover:border-slate-400 shadow-sm'}`}
                                >
                                    <CreditCard size={28} strokeWidth={method === 'card' ? 3 : 2} />
                                    <span className="text-[10px] font-black uppercase tracking-widest">Cartão</span>
                                </button>
                                <button
                                    onClick={() => setMethod('pix')}
                                    className={`flex flex-col items-center gap-3 p-6 rounded-3xl border transition-all ${method === 'pix' ? 'bg-[#00C402] border-[#00C402] text-white shadow-lg scale-105' : 'bg-white border-slate-200 text-slate-400 hover:border-slate-400 shadow-sm'}`}
                                >
                                    <Smartphone size={28} strokeWidth={method === 'pix' ? 3 : 2} />
                                    <span className="text-[10px] font-black uppercase tracking-widest">PIX</span>
                                </button>
                                <button
                                    onClick={() => setMethod('boleto')}
                                    className={`flex flex-col items-center gap-3 p-6 rounded-3xl border transition-all ${method === 'boleto' ? 'bg-[#00C402] border-[#00C402] text-white shadow-lg scale-105' : 'bg-white border-slate-200 text-slate-400 hover:border-slate-400 shadow-sm'}`}
                                >
                                    <FileText size={28} strokeWidth={method === 'boleto' ? 3 : 2} />
                                    <span className="text-[10px] font-black uppercase tracking-widest">Boleto</span>
                                </button>
                            </div>

                            {/* Method Content */}
                            <div className="bg-white border border-slate-200 rounded-[40px] p-8 md:p-12 shadow-sm relative overflow-hidden">
                                {method === 'card' && (
                                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                        <div className="grid md:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-[#00C402] italic">Número do Cartão</label>
                                                <input type="text" placeholder="0000 0000 0000 0000" className="w-full bg-[#F8FAFC] border border-slate-200 rounded-2xl p-4 focus:border-[#00C402] outline-none font-bold italic tracking-widest text-slate-900" />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-[#00C402] italic">Nome no Cartão</label>
                                                <input type="text" placeholder="NOME COMO NO CARTÃO" className="w-full bg-[#F8FAFC] border border-slate-200 rounded-2xl p-4 focus:border-[#00C402] outline-none font-bold uppercase text-slate-900" />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-[#00C402] italic">Validade</label>
                                                <input type="text" placeholder="MM/AA" className="w-full bg-[#F8FAFC] border border-slate-200 rounded-2xl p-4 focus:border-[#00C402] outline-none font-bold italic text-slate-900" />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-[#00C402] italic">CVV</label>
                                                <input type="text" placeholder="000" className="w-full bg-[#F8FAFC] border border-slate-200 rounded-2xl p-4 focus:border-[#00C402] outline-none font-bold italic text-slate-900" />
                                            </div>
                                        </div>
                                        <div className="p-6 bg-[#00C402]/5 border border-[#00C402]/10 rounded-2xl flex items-center gap-4">
                                            <ShieldCheck size={28} className="text-[#00C402]" />
                                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider leading-relaxed">
                                                Seus dados estão protegidos por criptografia de ponta a ponta PowerPlay Shield. Nunca armazenamos seu CVV.
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {method === 'pix' && (
                                    <div className="text-center space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                        <div className="w-48 h-48 bg-white border border-slate-100 p-4 rounded-3xl mx-auto shadow-md">
                                            <QrCode size="100%" className="text-slate-900" />
                                        </div>
                                        <div>
                                            <h4 className="text-lg font-black uppercase italic tracking-tighter mb-2 text-slate-900">Escaneie o QR Code</h4>
                                            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest max-w-xs mx-auto">A liberação do treinamento é imediata após a confirmação do PIX.</p>
                                        </div>
                                        <button className="flex items-center gap-3 bg-white hover:bg-slate-50 border border-slate-200 rounded-2xl px-8 py-4 mx-auto text-[10px] font-black uppercase tracking-[3px] transition-all shadow-sm">
                                            <Copy size={16} className="text-[#00C402]" />
                                            Copiar Código PIX
                                        </button>
                                    </div>
                                )}

                                {method === 'boleto' && (
                                    <div className="text-center space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                        <div className="py-12 px-8 bg-[#F8FAFC] border border-slate-100 rounded-3xl">
                                            <div className="flex flex-col items-center gap-6 opacity-30">
                                                <div className="h-20 w-full bg-slate-900/5 rounded flex justify-between px-4 items-center">
                                                    {[...Array(30)].map((_, i) => <div key={i} className={`w-0.5 bg-slate-900 h-full ${i % 3 === 0 ? 'opacity-20' : 'opacity-100'}`}></div>)}
                                                </div>
                                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-900">Boleto Bancário PowerPlay</p>
                                            </div>
                                        </div>
                                        <div>
                                            <h4 className="text-lg font-black uppercase italic tracking-tighter mb-2 text-slate-900">Compensação em até 48h</h4>
                                            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest max-w-xs mx-auto italic">O acesso será enviado para o seu e-mail após a compensação bancária.</p>
                                        </div>
                                        <button className="flex items-center gap-3 bg-white hover:bg-slate-50 border border-slate-200 rounded-2xl px-8 py-4 mx-auto text-[10px] font-black uppercase tracking-[3px] transition-all shadow-sm text-slate-900">
                                            Gerar PDF do Boleto
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Lado Direito: Order Summary */}
                    <aside className="space-y-8">
                        <section className="bg-white border border-slate-200 rounded-[40px] p-8 shadow-xl relative overflow-hidden group">
                            <h3 className="text-sm font-black uppercase tracking-[5px] text-[#00C402] mb-8 italic">Seu Pedido</h3>

                            <div className="space-y-6 mb-8 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                                {items.map(item => (
                                    <div key={item.id} className="flex gap-4 items-center border-b border-slate-100 pb-4">
                                        <div className="w-12 h-12 bg-slate-100 rounded-xl overflow-hidden border border-slate-200 shrink-0">
                                            <img src={item.image_url || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=200"} className="w-full h-full object-cover" alt="" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="text-[10px] font-black uppercase tracking-tight truncate text-slate-900">{item.title}</h4>
                                            <span className="text-xs font-black italic text-[#00C402]">R$ {item.price.toFixed(2)}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="space-y-4 pt-4">
                                <div className="flex justify-between font-bold uppercase text-[10px] tracking-widest text-slate-400">
                                    <span>Valor Bruto</span>
                                    <span>R$ {total.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between font-bold uppercase text-[10px] tracking-widest text-[#00C402]">
                                    <span>Desconto PowerPlay</span>
                                    <span>- R$ 0,00</span>
                                </div>
                                <div className="h-px bg-slate-100 my-6"></div>
                                <div className="flex flex-col gap-1">
                                    <span className="text-[10px] font-black uppercase tracking-[4px] text-slate-400">Total Final</span>
                                    <div className="text-4xl font-black italic tracking-tighter text-slate-900">
                                        R$ {total.toFixed(2)}
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={handlePayment}
                                disabled={isProcessing}
                                className={`w-full py-6 mt-10 rounded-[20px] font-black uppercase italic tracking-[3px] transition-all flex items-center justify-center gap-3 shadow-lg ${isProcessing ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-[#00C402] text-white hover:scale-[1.02] shadow-[0_10px_30px_rgba(0,196,2,0.3)]'}`}
                            >
                                {isProcessing ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-slate-400 border-t-slate-600 rounded-full animate-spin"></div>
                                        Processando...
                                    </>
                                ) : (
                                    <>
                                        Confirmar Pagamento
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
                                    <h4 className="text-[10px] font-black uppercase text-slate-900 tracking-widest">Site Seguro</h4>
                                    <p className="text-[8px] text-slate-500 font-bold uppercase tracking-wider">Criptografia AES-256 bits</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-[#F8FAFC] rounded-xl flex items-center justify-center">
                                    <CreditCard size={20} className="text-slate-400" />
                                </div>
                                <div>
                                    <h4 className="text-[10px] font-black uppercase text-slate-900 tracking-widest">PCI DSS</h4>
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
