"use client"

import { X, DollarSign, Users, Calendar, BookOpen, CheckCircle2, AlertCircle, ChevronDown } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { useMemo, useState, useRef, useEffect, useCallback } from "react"

import { Payment } from '@/types/financial'

const PAGE_SIZE = 20

interface TeacherSalesDrawerProps {
    isOpen: boolean
    onClose: () => void
    teacherName: string
    teacherId: string | null
    allPayments: Payment[]
}

export function TeacherSalesDrawer({ isOpen, onClose, teacherName, teacherId, allPayments }: TeacherSalesDrawerProps) {
    const sentinelRef = useRef<HTMLDivElement | null>(null)
    const scrollRef = useRef<HTMLDivElement | null>(null)
    const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)

    const teacherPayments = useMemo(() => {
        if (!teacherId) return []
        return allPayments.filter(p => p.teacherId === teacherId)
    }, [teacherId, allPayments])

    const pendingPayments = useMemo(() => {
        return teacherPayments.filter(p => p.commissionStatus !== 'paid')
    }, [teacherPayments])

    const totals = useMemo(() => {
        return teacherPayments.reduce((acc, p) => ({
            gross: acc.gross + p.grossValue,
            teacher: acc.teacher + p.teacherShare,
            count: acc.count + 1
        }), { gross: 0, teacher: 0, count: 0 })
    }, [teacherPayments])

    const visiblePayments = useMemo(() => {
        return teacherPayments.slice(0, visibleCount)
    }, [teacherPayments, visibleCount])

    const hasMore = visibleCount < teacherPayments.length

    const loadMore = useCallback(() => {
        if (!hasMore) return
        setVisibleCount(prev => Math.min(prev + PAGE_SIZE, teacherPayments.length))
    }, [hasMore, teacherPayments.length])

    useEffect(() => {
        setVisibleCount(PAGE_SIZE)
    }, [teacherId])

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden'
        } else {
            document.body.style.overflow = 'unset'
        }
        return () => { document.body.style.overflow = 'unset' }
    }, [isOpen])

    useEffect(() => {
        if (!hasMore) return
        const sentinel = sentinelRef.current
        if (!sentinel) return

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) loadMore()
            },
            { root: scrollRef.current, rootMargin: '200px' }
        )

        observer.observe(sentinel)
        return () => observer.disconnect()
    }, [hasMore, loadMore])

    if (!isOpen) return null

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/60 backdrop-blur-md cursor-pointer z-0"
                    />

                    {/* Modal Content */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="relative bg-white w-full max-w-6xl max-h-[92vh] shadow-2xl rounded-[40px] overflow-hidden z-10 border border-black/10 flex flex-col"
                    >
                        {/* Header */}
                        <div className="p-8 md:p-12 border-b border-black/10 bg-white">
                            <button
                                onClick={onClose}
                                className="absolute top-10 right-10 p-3 hover:bg-slate-100 rounded-2xl transition-all text-black hover:text-red-500"
                            >
                                <X size={28} />
                            </button>

                            <div className="space-y-3">
                                <h2 className="text-4xl font-bold tracking-tighter uppercase !text-black leading-none">
                                    VENDAS DE <span className="text-[#1D5F31]">{teacherName}</span>
                                </h2>
                                <p className="text-[14px] font-bold uppercase tracking-[5px] !text-black">Detalhamento Financeiro do Professor</p>
                            </div>
                        </div>

                        {/* Scrollable Content */}
                        <div ref={scrollRef} className="flex-1 overflow-y-auto min-h-0 custom-scrollbar">
                            <div className="p-8 md:p-12 space-y-14">
                                {/* Summary Cards */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                    <div className="bg-slate-50 p-10 rounded-[32px] border border-black/10 shadow-sm">
                                        <div className="flex items-center gap-5 mb-8">
                                            <div className="p-5 bg-white rounded-2xl border border-black/10 text-black shadow-sm">
                                                <DollarSign size={28} strokeWidth={2.5} />
                                            </div>
                                            <p className="text-[14px] font-bold uppercase tracking-[0.2em] !text-black">Venda Bruta Total</p>
                                        </div>
                                        <h3 className="text-5xl font-bold tracking-tighter !text-black">
                                            R$ {totals.gross.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                        </h3>
                                    </div>

                                    <div className="bg-[#1D5F31]/10 p-10 rounded-[32px] border border-[#1D5F31]/20 relative overflow-hidden group shadow-sm">
                                        <div className="flex items-center gap-5 mb-8">
                                            <div className="p-5 bg-white rounded-2xl border border-[#1D5F31]/20 text-[#1D5F31] shadow-sm">
                                                <Users size={28} strokeWidth={2.5} />
                                            </div>
                                            <p className="text-[14px] font-bold uppercase tracking-[0.2em] text-[#1D5F31]">Repasse Professor</p>
                                        </div>
                                        <h3 className="text-5xl font-bold tracking-tighter !text-black">
                                            R$ {totals.teacher.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                        </h3>
                                        {pendingPayments.length > 0 && (
                                            <div className="mt-6 flex items-center gap-2 text-[11px] font-bold uppercase text-white bg-amber-600 w-fit px-4 py-2 rounded-xl border border-amber-500 shadow-md">
                                                <AlertCircle size={14} />
                                                Aguardando Pagamento
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Sales Table */}
                                <div className="space-y-10">
                                    <div className="flex items-center justify-between border-b-2 border-black/10 pb-6">
                                        <h3 className="text-lg font-bold uppercase tracking-[0.3em] !text-black flex items-center gap-4">
                                            <Calendar size={22} className="text-[#1D5F31]" />
                                            Histórico de Transações ({totals.count})
                                        </h3>
                                        <div className="flex items-center gap-6 text-[12px] font-bold uppercase tracking-widest">
                                            <div className="flex items-center gap-3">
                                                <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-sm" />
                                                <span className="!text-black">Pago</span>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <div className="w-3 h-3 rounded-full bg-amber-500 shadow-sm" />
                                                <span className="!text-black">Pendente</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid gap-6">
                                        {visiblePayments.map((p) => (
                                            <div
                                                key={p.id}
                                                className={`group p-8 rounded-[32px] border transition-all flex flex-col md:flex-row justify-between items-center gap-8 ${
                                                    p.commissionStatus === 'paid'
                                                    ? 'bg-slate-50 border-black/5'
                                                    : 'bg-white border-black/20 hover:border-[#1D5F31] shadow-sm'
                                                }`}
                                            >
                                                <div className="flex items-center gap-8 w-full">
                                                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border ${
                                                        p.commissionStatus === 'paid'
                                                        ? 'bg-emerald-50 border-emerald-100 text-emerald-600 shadow-sm'
                                                        : 'bg-slate-50 border-black/10 text-black shadow-sm'
                                                    }`}>
                                                        <BookOpen size={24} />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <div className="flex items-center gap-4">
                                                            <span className="text-[13px] font-bold uppercase tracking-tight !text-black">
                                                                {p.date ? new Date(p.date).toLocaleDateString('pt-BR') : '---'}
                                                            </span>
                                                            {p.commissionStatus === 'paid' ? (
                                                                <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase px-3 py-1 bg-emerald-100 text-emerald-800 rounded-lg border border-emerald-200">
                                                                    <CheckCircle2 size={12} /> PAGO
                                                                </span>
                                                            ) : (
                                                                <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase px-3 py-1 bg-amber-100 text-amber-800 rounded-lg border border-amber-200">
                                                                    <AlertCircle size={12} /> PENDENTE
                                                                </span>
                                                            )}
                                                        </div>
                                                        <h4 className="text-lg font-bold uppercase tracking-tight !text-black">
                                                            {p.courseName}
                                                        </h4>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-12 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 pt-6 md:pt-0 border-black/10">
                                                    <div className="text-right">
                                                        <p className="text-[12px] font-bold uppercase !text-black mb-1">Valor Bruto</p>
                                                        <p className="text-base font-bold !text-black tracking-tight">
                                                            R$ {p.grossValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                        </p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-[12px] font-bold uppercase text-[#1D5F31] mb-1">Seu Repasse</p>
                                                        <p className="text-2xl font-bold !text-black tracking-tighter">
                                                            R$ {p.teacherShare.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}

                                        {teacherPayments.length === 0 && (
                                            <div className="text-center py-20 bg-slate-50 rounded-[40px] border border-dashed border-black/10">
                                                <p className="text-sm font-bold uppercase text-slate-400 tracking-[0.2em]">Nenhuma venda encontrada para este professor.</p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Load-more sentinel */}
                                    {hasMore && (
                                        <div ref={sentinelRef} className="flex items-center justify-center py-8">
                                            <div className="flex items-center gap-3 text-sm font-bold uppercase text-slate-400">
                                                <ChevronDown size={18} className="animate-bounce" />
                                                Carregando mais vendas...
                                            </div>
                                        </div>
                                    )}

                                    {!hasMore && teacherPayments.length > PAGE_SIZE && (
                                        <div className="text-center py-4">
                                            <p className="text-[11px] font-bold uppercase text-slate-400 tracking-[0.2em]">
                                                Todas as {teacherPayments.length} vendas exibidas
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="p-8 md:p-10 bg-slate-50 border-t border-black/10">
                            <button
                                onClick={onClose}
                                className="w-full h-16 rounded-2xl bg-[#000000] text-white font-bold uppercase tracking-[2px] text-sm transition-all border-2 border-transparent hover:opacity-90"
                            >
                                Fechar Detalhamento
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    )
}
