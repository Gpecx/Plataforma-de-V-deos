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

    // Evitar erros de hidratação com persistência do Zustand
    useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) return null

    const subtotal = getTotal()

    return (
        <div className="min-h-screen bg-white text-slate-900 font-exo border-t border-slate-100">
            <div className="max-w-6xl mx-auto p-8 md:p-12">
                <div className="mb-12 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-5">
                        <div className="w-14 h-14 bg-slate-900 rounded-2xl flex items-center justify-center text-white shadow-md relative">
                            <ShoppingCart size={24} strokeWidth={2.5} />
                            <span className="absolute -top-2 -right-2 bg-[#00C402] text-white text-[10px] font-black w-6 h-6 rounded-full flex items-center justify-center border-2 border-[#F8FAFC]">
                                {items.length}
                            </span>
                        </div>
                        <div>
                            <h1 className="text-3xl font-black tracking-tighter uppercase mb-1 text-slate-900">
                                SEU <span className="text-[#00C402]">CARRINHO</span>
                            </h1>
                            <p className="text-slate-400 font-bold uppercase text-[9px] tracking-[3px]">
                                {items.length === 0 ? 'Seu carrinho está vazio' : `VOCÊ TEM ${items.length} ITENS SELECIONADOS`}
                            </p>
                        </div>
                    </div>
                    <Link
                        href="/course"
                        className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-slate-900 transition group border border-slate-100 bg-white px-6 py-4 rounded-xl shadow-sm"
                    >
                        <ArrowLeft size={14} className="group-hover:-translate-x-1 transition" />
                        Continuar Comprando
                    </Link>
                </div>

                {items.length > 0 ? (
                    <div className="grid lg:grid-cols-3 gap-12">
                        {/* Cart Items List */}
                        <div className="lg:col-span-2 space-y-6">
                            {items.map((course) => (
                                <div
                                    key={course.id}
                                    className="bg-white border border-slate-100 rounded-3xl p-8 flex flex-col md:flex-row gap-8 items-center hover:border-[#00C402]/20 transition-all group shadow-sm relative overflow-hidden"
                                >
                                    <div className="w-full md:w-48 h-28 bg-slate-50 rounded-2xl overflow-hidden border border-slate-100 shrink-0 relative z-10">
                                        <img
                                            src={course.image_url || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&q=80"}
                                            alt={course.title}
                                            className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                                        />
                                    </div>
                                    <div className="flex-1 text-center md:text-left relative z-10">
                                        <h3 className="text-xl font-black tracking-tighter mb-2 group-hover:text-[#00C402] transition uppercase text-slate-900 leading-tight">{course.title}</h3>
                                        <div className="flex items-center justify-center md:justify-start gap-4 mb-4">
                                            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-1.5 leading-none">
                                                <div className="w-1 h-1 rounded-full bg-[#00C402]"></div>
                                                Acesso vitalício
                                            </span>
                                            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-1.5 leading-none">
                                                <div className="w-1 h-1 rounded-full bg-[#00C402]"></div>
                                                Certificado SPCS Academy
                                            </span>
                                        </div>
                                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-50 border border-slate-100 rounded-lg text-slate-500 text-[9px] font-black uppercase tracking-[2px]">
                                            Treinamento Premium
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-center md:items-end gap-4 min-w-[140px] relative z-10">
                                        <div className="text-center md:text-right">
                                            <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest block mb-0.5">Preço</span>
                                            <span className="text-2xl font-black text-slate-900 tracking-tight">R$ {course.price.toFixed(2)}</span>
                                        </div>
                                        <button
                                            onClick={() => removeItem(course.id)}
                                            className="p-3 bg-red-50 text-red-500 hover:bg-red-500 hover:text-white rounded-xl transition-all border border-red-100 shadow-sm"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Summary Section */}
                        <div className="space-y-6">
                            <div className="bg-white border border-slate-100 rounded-[32px] p-10 shadow-sm relative overflow-hidden group">
                                <h2 className="text-xl font-black uppercase mb-8 border-b border-slate-50 pb-6 tracking-tighter text-slate-900">RESUMO DO <span className="text-[#00C402]">PEDIDO</span></h2>

                                <div className="space-y-4 mb-10">
                                    <div className="flex justify-between font-bold uppercase text-[10px] tracking-widest text-slate-400">
                                        <span>Subtotal</span>
                                        <span className="text-slate-600">R$ {subtotal.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between font-bold uppercase text-[10px] tracking-widest text-slate-400">
                                        <span>Descontos</span>
                                        <span className="text-[#00C402]">R$ 0,00</span>
                                    </div>
                                    <div className="h-px bg-slate-50 my-6"></div>
                                    <div className="flex flex-col gap-1">
                                        <span className="text-[9px] font-black uppercase tracking-[3px] text-slate-400">Total do Investimento</span>
                                        <div className="text-4xl font-black text-slate-900 tracking-tight">
                                            R$ {subtotal.toFixed(2)}
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={() => router.push('/checkout')}
                                    className="w-full py-5 bg-[#00C402] text-white font-black uppercase tracking-[2px] rounded-2xl hover:brightness-105 active:scale-[0.98] transition-all shadow-md flex items-center justify-center gap-3 text-sm"
                                >
                                    <CreditCard size={18} />
                                    Finalizar Pagamento
                                    <ChevronRight size={18} />
                                </button>

                                <div className="mt-8 pt-8 border-t border-slate-50 flex items-center justify-center gap-4 grayscale opacity-40">
                                    <div className="h-4 w-12 bg-slate-200 rounded"></div>
                                    <div className="h-4 w-12 bg-slate-200 rounded"></div>
                                    <div className="h-4 w-12 bg-slate-200 rounded"></div>
                                </div>
                            </div>

                            <div className="bg-slate-50/50 border border-slate-100 rounded-3xl p-8">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-8 h-8 bg-white border border-slate-100 rounded-lg flex items-center justify-center shadow-sm">
                                        <ShieldCheck size={16} className="text-[#00C402]" />
                                    </div>
                                    <h4 className="text-[10px] font-black uppercase tracking-[2px] text-slate-900">Compra Segura SPCS Academy</h4>
                                </div>
                                <p className="text-[10px] text-slate-500 leading-relaxed font-medium">
                                    Ambiente criptografado com certificação SSL de 256 bits. Garantia incondicional de 7 dias para cancelamento e reembolso.
                                </p>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-32 bg-white border border-slate-100 rounded-[40px] shadow-sm">
                        <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto mb-8 border border-slate-100">
                            <BookOpen size={32} className="text-slate-200" />
                        </div>
                        <h2 className="text-2xl font-black tracking-tighter mb-4 text-slate-900 uppercase">Seu carrinho está vazio</h2>
                        <p className="text-slate-400 mb-10 font-bold uppercase text-[10px] tracking-[3px]">Explore nossos treinamentos e comece sua evolução hoje.</p>
                        <Link href="/course">
                            <button className="px-10 py-5 bg-slate-900 text-white font-black uppercase tracking-widest text-xs rounded-2xl hover:bg-slate-800 transition-all shadow-lg">
                                Ver Catálogo de Cursos
                            </button>
                        </Link>
                    </div>
                )}
            </div>
        </div>
    )
}
