"use client"

import { useCartStore } from '@/store/useCartStore'
import { ShoppingCart, Trash2, CreditCard, ArrowLeft, BookOpen, ChevronRight, ShieldCheck } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function CartPage() {
    const { items, removeItem, getTotal } = useCartStore()
    const router = useRouter()
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) return null

    const subtotal = getTotal()

    return (
        <div className="min-h-screen bg-transparent text-white font-exo border-t border-[#1D5F31]">
            {/* Removido o max-w-6xl para dar mais largura à página */}
            <div className="w-full px-8 py-12">
                <div className="mb-12 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-5">
                        <div className="w-14 h-14 bg-[#1D5F31] flex items-center justify-center text-white shadow-md relative border border-[#1D5F31]/20">
                            <ShoppingCart size={24} strokeWidth={2.5} />
                            <span className="absolute -top-2 -right-2 bg-[#1D5F31] text-white text-[10px] font-black w-6 h-6 flex items-center justify-center border-2 border-[#061629]">
                                {items.length}
                            </span>
                        </div>
                        <div>
                            <h1 className="text-3xl font-black tracking-tighter uppercase mb-1 text-white">
                                SEU <span className="text-[#1D5F31]">CARRINHO</span>
                            </h1>
                            <p className="text-slate-400 font-bold uppercase text-[9px] tracking-[3px]">
                                {items.length === 0 ? 'Seu carrinho está vazio' : `VOCÊ TEM ${items.length} ITENS SELECIONADOS`}
                            </p>
                        </div>
                    </div>
                    <Link
                        href="/course"
                        className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white transition group border border-[#1D5F31] bg-[#1D5F31]/20 px-6 py-4 shadow-sm"
                    >
                        <ArrowLeft size={14} className="group-hover:-translate-x-1 transition" />
                        Continuar Comprando
                    </Link>
                </div>

                {items.length > 0 ? (
                    <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
                        {/* Cart Items List - Aumentado o espaço ocupado para 3/4 */}
                        <div className="xl:col-span-3 space-y-4">
                            {items.map((course) => (
                                <div
                                    key={course.id}
                                    className="bg-[#061629] border border-[#1D5F31] p-8 flex flex-col md:flex-row gap-8 items-center hover:border-[#1D5F31]/20 transition-all group shadow-sm relative"
                                >
                                    <div className="w-full md:w-48 h-28 bg-[#061629] border border-[#1D5F31] shrink-0 relative">
                                        <img
                                            src={course.image_url || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&q=80"}
                                            alt={course.title}
                                            className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                                        />
                                    </div>
                                    <div className="flex-1 text-center md:text-left">
                                        <h3 className="text-xl font-black tracking-tighter mb-2 group-hover:text-[#1D5F31] transition uppercase text-white leading-tight">{course.title}</h3>
                                        <div className="flex items-center justify-center md:justify-start gap-4 mb-4">
                                            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-1.5">
                                                <div className="w-1 h-1 bg-[#1D5F31]"></div>
                                                Acesso vitalício
                                            </span>
                                            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-1.5">
                                                <div className="w-1 h-1 bg-[#1D5F31]"></div>
                                                Certificado PowerPlay
                                            </span>
                                        </div>
                                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#1D5F31]/30 border border-[#1D5F31] text-slate-400 text-[9px] font-black uppercase tracking-[2px]">
                                            Treinamento Premium
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-center md:items-end gap-4 min-w-[140px]">
                                        <div className="text-center md:text-right">
                                            <span className="text-[9px] text-slate-500 font-black uppercase tracking-widest block mb-0.5">Preço</span>
                                            <span className="text-2xl font-black text-white tracking-tight">R$ {course.price.toFixed(2)}</span>
                                        </div>
                                        <button
                                            onClick={() => removeItem(course.id)}
                                            className="p-3 bg-red-950/20 text-red-500 hover:bg-red-500 hover:text-white transition-all border border-red-900/40 shadow-sm"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Summary Section - Ocupa 1/4 da tela */}
                        <div className="xl:col-span-1 space-y-4">
                            <div className="bg-[#061629] border border-[#1D5F31] p-10 shadow-sm">
                                <h2 className="text-xl font-black uppercase mb-8 border-b border-[#1D5F31] pb-6 tracking-tighter text-white">RESUMO DO <span className="text-[#1D5F31]">PEDIDO</span></h2>

                                <div className="space-y-4 mb-10">
                                    <div className="flex justify-between font-bold uppercase text-[10px] tracking-widest text-slate-500">
                                        <span>Subtotal</span>
                                        <span className="text-slate-300">R$ {subtotal.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between font-bold uppercase text-[10px] tracking-widest text-slate-500">
                                        <span>Descontos</span>
                                        <span className="text-[#1D5F31]">R$ 0,00</span>
                                    </div>
                                    <div className="h-px bg-[#1D5F31] my-6"></div>
                                    <div className="flex flex-col gap-1">
                                        <span className="text-[9px] font-black uppercase tracking-[3px] text-slate-500">Total do Investimento</span>
                                        <div className="text-4xl font-black text-white tracking-tight">
                                            R$ {subtotal.toFixed(2)}
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={() => router.push('/checkout')}
                                    className="w-full py-5 bg-[#1D5F31] text-white font-black uppercase tracking-[2px] hover:brightness-105 active:scale-[0.98] transition-all shadow-md flex items-center justify-center gap-3 text-sm"
                                >
                                    <CreditCard size={18} />
                                    Finalizar Pagamento
                                    <ChevronRight size={18} />
                                </button>
                            </div>

                            <div className="bg-[#1D5F31]/20 border border-[#1D5F31] p-8">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-8 h-8 bg-[#061629] border border-[#1D5F31] flex items-center justify-center shadow-sm">
                                        <ShieldCheck size={16} className="text-[#1D5F31]" />
                                    </div>
                                    <h4 className="text-[10px] font-black uppercase tracking-[2px] text-white">Compra Segura PowerPlay</h4>
                                </div>
                                <p className="text-[10px] text-slate-500 leading-relaxed font-medium">
                                    Ambiente criptografado com certificação SSL de 256 bits. Garantia incondicional de 7 dias para cancelamento e reembolso.
                                </p>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-32 bg-[#061629] border border-[#1D5F31] shadow-sm">
                        <div className="w-20 h-20 bg-[#1D5F31]/20 flex items-center justify-center mx-auto mb-8 border border-[#1D5F31]">
                            <BookOpen size={32} className="text-slate-700" />
                        </div>
                        <h2 className="text-2xl font-black tracking-tighter mb-4 text-white uppercase">Seu carrinho está vazio</h2>
                        <p className="text-slate-500 mb-10 font-bold uppercase text-[10px] tracking-[3px]">Explore nossos treinamentos e comece sua evolução hoje.</p>
                        <Link href="/course">
                            <button className="px-10 py-5 bg-[#1D5F31] text-white font-black uppercase tracking-widest text-xs hover:bg-[#28b828] transition-all shadow-lg">
                                Ver Catálogo de Cursos
                            </button>
                        </Link>
                    </div>
                )}
            </div>
        </div>
    )
}