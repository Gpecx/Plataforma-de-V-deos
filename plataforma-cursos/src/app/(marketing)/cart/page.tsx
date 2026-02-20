"use client"

import { useCartStore } from '@/store/useCartStore'
import { ShoppingCart, Trash2, CreditCard, ArrowLeft, BookOpen, ChevronRight } from 'lucide-react'
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
        <div className="min-h-screen bg-[#061629] text-white font-exo">
            <div className="max-w-6xl mx-auto p-8 md:p-12">
                <div className="mb-12 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-5">
                        <div className="w-14 h-14 bg-[#00C402] rounded-2xl flex items-center justify-center text-black shadow-[0_0_30px_rgba(0,196,2,0.4)] relative">
                            <ShoppingCart size={28} strokeWidth={3} />
                            <span className="absolute -top-2 -right-2 bg-white text-black text-[10px] font-black w-6 h-6 rounded-full flex items-center justify-center border-2 border-[#061629]">
                                {items.length}
                            </span>
                        </div>
                        <div>
                            <h1 className="text-4xl font-black italic tracking-tighter uppercase mb-1">
                                Meu <span className="text-[#00C402]">Carrinho</span>
                            </h1>
                            <p className="text-gray-400 font-bold uppercase text-[10px] tracking-[4px]">
                                {items.length === 0 ? 'Seu carrinho está vazio' : `Você tem ${items.length} itens prontos para o próximo nível`}
                            </p>
                        </div>
                    </div>
                    <Link
                        href="/dashboard-student"
                        className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-gray-500 hover:text-white transition group border border-white/5 bg-white/5 px-5 py-3 rounded-xl"
                    >
                        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition" />
                        Explorar Mais Cursos
                    </Link>
                </div>

                {items.length > 0 ? (
                    <div className="grid lg:grid-cols-3 gap-12">
                        {/* Cart Items List */}
                        <div className="lg:col-span-2 space-y-6">
                            {items.map((course) => (
                                <div
                                    key={course.id}
                                    className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[40px] p-8 flex flex-col md:flex-row gap-8 items-center hover:border-[#00C402]/40 transition-all group shadow-2xl relative overflow-hidden"
                                >
                                    <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-10 transition-opacity">
                                        <ShoppingCart size={120} className="text-[#00C402]" />
                                    </div>

                                    <div className="w-full md:w-48 h-28 bg-[#0a1f3a] rounded-3xl overflow-hidden border border-white/5 shrink-0 relative z-10">
                                        <img
                                            src={course.image_url || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&q=80"}
                                            alt={course.title}
                                            className="w-full h-full object-cover group-hover:scale-110 transition duration-700 opacity-60 group-hover:opacity-100"
                                        />
                                    </div>
                                    <div className="flex-1 text-center md:text-left relative z-10">
                                        <h3 className="text-2xl font-black italic tracking-tighter mb-2 group-hover:text-[#00C402] transition uppercase">{course.title}</h3>
                                        <div className="flex items-center justify-center md:justify-start gap-4 mb-4">
                                            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest italic flex items-center gap-1.5">
                                                <div className="w-1 h-1 rounded-full bg-[#00C402]"></div>
                                                Acesso vitalício
                                            </span>
                                            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest italic flex items-center gap-1.5">
                                                <div className="w-1 h-1 rounded-full bg-[#00C402]"></div>
                                                Certificado EXS
                                            </span>
                                        </div>
                                        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#00C402]/10 rounded-xl text-[#00C402] text-[10px] font-black uppercase tracking-[2px]">
                                            Treinamento Elite
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-center md:items-end gap-5 min-w-[140px] relative z-10">
                                        <div className="text-right">
                                            <span className="text-[10px] text-gray-500 font-black uppercase tracking-widest block mb-1">Preço Final</span>
                                            <span className="text-3xl font-black text-white italic tracking-tighter">R$ {course.price.toFixed(2)}</span>
                                        </div>
                                        <button
                                            onClick={() => removeItem(course.id)}
                                            className="p-3 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-2xl transition-all border border-red-500/20 group/btn shadow-lg"
                                        >
                                            <Trash2 size={18} className="group-hover/btn:scale-110 transition-transform" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Summary Section */}
                        <div className="space-y-6">
                            <div className="bg-[#00C402] text-black rounded-[40px] p-10 shadow-[0_30px_60px_rgba(0,196,2,0.2)] relative overflow-hidden group">
                                <div className="absolute -bottom-10 -right-10 opacity-10 rotate-12 group-hover:scale-110 transition-transform duration-700">
                                    <CreditCard size={200} />
                                </div>

                                <h2 className="text-3xl font-black uppercase italic mb-8 border-b border-black/10 pb-6 tracking-tighter">Resumo de <span className="underline">Investimento</span></h2>

                                <div className="space-y-4 mb-10">
                                    <div className="flex justify-between font-bold uppercase text-[11px] tracking-widest">
                                        <span className="opacity-60">Subtotal de Cursos</span>
                                        <span>R$ {subtotal.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between font-bold uppercase text-[11px] tracking-widest text-black/40">
                                        <span className="">Taxas Administrativas</span>
                                        <span>R$ 0,00</span>
                                    </div>
                                    <div className="h-px bg-black/10 my-6"></div>
                                    <div className="flex flex-col gap-1">
                                        <span className="text-[10px] font-black uppercase tracking-[4px] opacity-60">Total a Pagar</span>
                                        <div className="text-5xl font-black italic tracking-tighter">
                                            R$ {subtotal.toFixed(2)}
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={() => router.push('/checkout')}
                                    className="w-full py-6 bg-black text-white font-black uppercase italic tracking-[3px] rounded-[24px] hover:scale-[1.02] active:scale-95 transition-all shadow-2xl flex items-center justify-center gap-4 group/checkout"
                                >
                                    <CreditCard size={22} className="group-hover/checkout:rotate-12 transition-transform" />
                                    Finalizar Compra
                                    <ChevronRight size={22} />
                                </button>

                                <p className="text-[9px] text-center mt-8 font-black uppercase opacity-60 tracking-[2px] leading-relaxed px-4">
                                    Ambiente 256-bit SSL Seguro • EXS Platinum Check
                                </p>
                            </div>

                            <div className="bg-white/5 border border-white/10 rounded-[32px] p-8 backdrop-blur-md">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-8 h-8 bg-[#00C402]/20 rounded-lg flex items-center justify-center">
                                        <ShoppingCart size={16} className="text-[#00C402]" />
                                    </div>
                                    <h4 className="text-xs font-black uppercase tracking-[3px] text-white italic">Elite Shield EXS</h4>
                                </div>
                                <p className="text-[11px] text-gray-400 leading-relaxed font-bold uppercase tracking-wider">
                                    Satisfação garantida ou seu dinheiro de volta em até 7 dias após a confirmação. Segurança máxima em todas as camadas de transação.
                                </p>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-32 bg-white/5 border border-white/5 rounded-[50px] backdrop-blur-xl shadow-2xl">
                        <div className="w-24 h-24 bg-white/5 rounded-[32px] flex items-center justify-center mx-auto mb-8 border border-white/10">
                            <BookOpen size={48} className="text-gray-600 opacity-30" />
                        </div>
                        <h2 className="text-3xl font-black italic uppercase tracking-tighter mb-4">Seu carrinho está <span className="text-gray-600">vazio</span></h2>
                        <p className="text-gray-400 mb-10 font-bold uppercase text-xs tracking-[4px]">A excelência não acontece por acaso. Comece seu treinamento agora.</p>
                        <Link href="/dashboard-student">
                            <button className="px-12 py-5 bg-[#00C402] text-black font-black uppercase italic tracking-widest rounded-[20px] hover:scale-105 transition-all shadow-[0_0_40px_rgba(0,196,2,0.3)]">
                                Explorar Cursos Disponíveis
                            </button>
                        </Link>
                    </div>
                )}
            </div>
        </div>
    )
}
