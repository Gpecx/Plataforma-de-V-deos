"use client"

import { useCartStore } from '@/store/useCartStore'
import { ShoppingCart, Trash2, CreditCard, ArrowLeft, BookOpen, ChevronRight, ShieldCheck } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useAuth } from '@/context/AuthProvider'

export default function CartPage() {
    const { items, removeItem, getTotal, purchasedCourseIds } = useCartStore()
    const router = useRouter()
    const { user, loading: authLoading } = useAuth()
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    const hasPurchasedItems = items.some(item => purchasedCourseIds.includes(item.id))
    const isValidatingOwnership = authLoading && items.length > 0

    const handleFinalizePurchase = () => {
        if (!authLoading && !user) {
            router.push('/login?redirectTo=/cart')
            return
        }
        
        if (hasPurchasedItems) {
            return
        }
        
        router.push('/pagamento')
    }

    if (!mounted) return null

    const subtotal = getTotal()

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 font-exo border-t border-slate-200">
            <div className="w-full px-4 md:px-8 lg:px-12 py-12">
                <div className="mb-12 flex flex-col md:flex-row md:items-center justify-between gap-8">
                    <div className="flex items-center gap-6">
                        <div className="w-16 h-16 bg-[#1D5F31] rounded-2xl flex items-center justify-center text-white shadow-lg relative">
                            <ShoppingCart size={28} strokeWidth={2.5} className="text-white" />
                            <span className="absolute -top-2 -right-2 bg-white text-[#1D5F31] text-[11px] font-black w-7 h-7 flex items-center justify-center rounded-full border-2 border-[#1D5F31] shadow-sm">
                                {items.length}
                            </span>
                        </div>
                        <div>
                            <h1 className="text-4xl font-black tracking-tighter uppercase mb-1 text-slate-900">
                                SEU <span className="text-[#1D5F31]">CARRINHO</span>
                            </h1>
                            <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[4px]">
                                {items.length === 0 ? 'Seu carrinho está vazio' : `VOCÊ TEM ${items.length} ITENS SELECIONADOS`}
                            </p>
                        </div>
                    </div>
                    <Link
                        href="/course"
                        className="flex items-center gap-3 text-[11px] font-black uppercase tracking-widest text-slate-600 hover:text-slate-900 transition group border border-slate-200 bg-white px-8 py-5 rounded-xl shadow-sm hover:shadow-md active:scale-95 w-fit"
                    >
                        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition" />
                        Continuar Comprando
                    </Link>
                </div>

                {items.length > 0 ? (
                    <div className="grid grid-cols-1 xl:grid-cols-4 gap-10">
                        {/* Cart Items List */}
                        <div className="xl:col-span-3 space-y-6">
                            {items.map((course) => (
                                <div
                                    key={course.id}
                                    className="bg-white border border-slate-200 p-6 md:p-8 flex flex-col md:flex-row gap-8 items-center hover:border-[#1D5F31]/30 transition-all group shadow-sm rounded-[24px] overflow-hidden"
                                >
                                    <div className="w-full md:w-56 h-32 bg-slate-50 rounded-xl overflow-hidden shrink-0 relative border border-slate-100">
                                        <img
                                            src={course.image_url || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&q=80"}
                                            alt={course.title}
                                            className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                                        />
                                    </div>
                                    <div className="flex-1 text-center md:text-left">
                                        <h3 className="text-2xl font-black tracking-tighter mb-3 group-hover:text-[#1D5F31] transition uppercase text-slate-900 leading-tight">{course.title}</h3>
                                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-5 mb-5">
                                            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 rounded-full bg-[#1D5F31]"></div>
                                                Certificado PowerPlay
                                            </span>
                                        </div>
                                        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-slate-50 border border-slate-100 text-slate-500 text-[10px] font-black uppercase tracking-[2px] rounded-lg">
                                            Treinamento Premium
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-center md:items-end gap-6 min-w-[160px]">
                                        <div className="text-center md:text-right">
                                            <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest block mb-1">Preço do Curso</span>
                                            <span className="text-3xl font-black text-slate-900 tracking-tight">R$ {course.price.toFixed(2)}</span>
                                        </div>
                                        <button
                                            onClick={() => removeItem(course.id)}
                                            className="p-4 bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-all border border-red-100 rounded-xl shadow-sm active:scale-95"
                                        >
                                            <Trash2 size={20} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Summary Section */}
                        <div className="xl:col-span-1 space-y-6">
                            <div className="bg-white border border-slate-200 p-8 md:p-10 shadow-lg rounded-[32px]">
                                <h2 className="text-2xl font-black uppercase mb-8 border-b border-slate-100 pb-6 tracking-tighter text-slate-900">RESUMO DO <span className="text-[#1D5F31]">PEDIDO</span></h2>

                                <div className="space-y-5 mb-10">
                                    <div className="flex justify-between font-bold uppercase text-[11px] tracking-widest text-slate-500">
                                        <span>Subtotal</span>
                                        <span className="text-slate-900 font-black">R$ {subtotal.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between font-bold uppercase text-[11px] tracking-widest text-slate-500">
                                        <span>Descontos</span>
                                        <span className="text-[#1D5F31] font-black">R$ 0,00</span>
                                    </div>
                                    <div className="h-px bg-slate-100 my-8"></div>
                                    <div className="flex flex-col gap-1.5">
                                        <span className="text-[10px] font-black uppercase tracking-[4px] text-slate-400">Total do Investimento</span>
                                        <div className="text-5xl font-black text-slate-900 tracking-tighter">
                                            R$ {subtotal.toFixed(2)}
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={handleFinalizePurchase}
                                    disabled={authLoading || isValidatingOwnership}
                                    className="w-full py-6 bg-[#1D5F31] text-white font-black uppercase tracking-[3px] hover:opacity-95 active:scale-[0.98] transition-all shadow-xl shadow-[#1D5F31]/20 flex items-center justify-center gap-3 text-sm rounded-2xl disabled:opacity-50"
                                >
                                    <CreditCard size={20} strokeWidth={2.5} />
                                    {authLoading || isValidatingOwnership ? 'Validando...' : 'Finalizar Pagamento'}
                                    <ChevronRight size={20} strokeWidth={2.5} />
                                </button>
                            </div>

                            <div className="bg-slate-50 border border-slate-200 p-8 rounded-[24px]">
                                <div className="flex items-center gap-4 mb-5">
                                    <div className="w-10 h-10 bg-white border border-slate-200 flex items-center justify-center shadow-sm rounded-xl">
                                        <ShieldCheck size={20} className="text-[#1D5F31]" />
                                    </div>
                                    <h4 className="text-[11px] font-black uppercase tracking-[2px] text-slate-900">Compra Segura PowerPlay</h4>
                                </div>
                                <p className="text-[11px] text-slate-500 leading-relaxed font-bold uppercase tracking-wider">
                                    Ambiente criptografado com certificação SSL de 256 bits. Garantia incondicional de 7 dias para cancelamento e reembolso integral.
                                </p>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-32 bg-white border border-slate-200 shadow-sm rounded-[32px]">
                        <div className="w-24 h-24 bg-slate-50 flex items-center justify-center mx-auto mb-10 border border-slate-100 rounded-full shadow-inner">
                            <BookOpen size={40} className="text-slate-300" />
                        </div>
                        <h2 className="text-3xl font-black tracking-tighter mb-4 text-slate-900 uppercase">Seu carrinho está vazio</h2>
                        <p className="text-slate-500 mb-12 font-bold uppercase text-[11px] tracking-[4px]">Explore nossos treinamentos e comece sua evolução hoje.</p>
                        <Link href="/course">
                            <button className="px-12 py-6 bg-[#1D5F31] text-white font-black uppercase tracking-widest text-xs hover:opacity-90 transition-all shadow-xl shadow-[#1D5F31]/20 rounded-2xl active:scale-95">
                                Ver Catálogo de Cursos
                            </button>
                        </Link>
                    </div>
                )}
            </div>
        </div>
    )
}