"use client"

import { useMemo, useState } from 'react'
import { Search, ArrowUpRight, User, AlertCircle, CheckCircle2 } from 'lucide-react'
import { TeacherSalesDrawer } from './TeacherSalesDrawer'
import { AdminFinanceExportButton } from './AdminFinanceExportButton'

import { Payment } from '@/types/financial'
import { normalizeString } from '@/lib/utils'

interface TeacherSummary {
    teacherId: string | null
    teacherName: string
    totalGross: number
    totalPlatform: number
    totalTeacher: number
    count: number
    pendingCount: number
}

interface FinancialTableProps {
    payments: Payment[]
}

function groupByTeacher(payments: Payment[]): TeacherSummary[] {
    const map = new Map<string, TeacherSummary>()

    for (const p of payments) {
        const key = p.teacherId ?? '__no_teacher__'
        const existing = map.get(key)
        if (existing) {
            existing.totalGross += p.grossValue
            existing.totalPlatform += p.platformShare
            existing.totalTeacher += p.teacherShare
            existing.count += 1
            if (p.commissionStatus !== 'paid') existing.pendingCount += 1
        } else {
            map.set(key, {
                teacherId: p.teacherId,
                teacherName: p.teacherName,
                totalGross: p.grossValue,
                totalPlatform: p.platformShare,
                totalTeacher: p.teacherShare,
                count: 1,
                pendingCount: p.commissionStatus !== 'paid' ? 1 : 0,
            })
        }
    }

    return Array.from(map.values()).sort((a, b) => b.totalGross - a.totalGross)
}

export function FinancialTable({ payments }: FinancialTableProps) {
    const [selectedTeacher, setSelectedTeacher] = useState<{ id: string | null, name: string } | null>(null)
    const [searchTerm, setSearchTerm] = useState('')

    const teacherSummaries = useMemo(() => groupByTeacher(payments), [payments])

    const filteredSummaries = useMemo(() => {
        if (!searchTerm.trim()) return teacherSummaries
        const q = normalizeString(searchTerm.trim())
        return teacherSummaries.filter(t => normalizeString(t.teacherName).includes(q))
    }, [teacherSummaries, searchTerm])

    const handleTeacherClick = (teacherId: string | null, teacherName: string) => {
        setSelectedTeacher({ id: teacherId, name: teacherName })
    }

    return (
        <>
            <div className="bg-white p-10 rounded-[32px] border border-black/20">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                    <h2 className="text-xl font-bold uppercase tracking-tighter !text-[#000000]">Histórico de Pagamentos</h2>
                    <div className="flex items-center gap-4">
                        <AdminFinanceExportButton payments={payments} />
                        <div className="flex items-center gap-3 bg-slate-50 px-5 py-2 rounded-xl border border-black/20">
                            <Search size={16} className="!text-[#000000]" />
                            <span className="text-sm font-bold !text-[#000000] uppercase tracking-tight">{payments.length} Transações</span>
                        </div>
                    </div>
                </div>

                {/* Search input */}
                <div className="relative mb-10">
                    <Search size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        placeholder="Buscar professor..."
                        className="w-full h-14 pl-14 pr-5 rounded-2xl bg-slate-50 border border-black/10 text-sm font-bold uppercase tracking-tight !text-black placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1D5F31]/30 focus:border-[#1D5F31]/40 transition-all"
                    />
                </div>

                {/* Teacher Cards */}
                <div className="grid gap-4">
                    {filteredSummaries.map((t) => (
                        <button
                            key={t.teacherId ?? '__no_teacher__'}
                            onClick={() => handleTeacherClick(t.teacherId, t.teacherName)}
                            className="w-full group p-6 md:p-8 rounded-[28px] border border-black/10 bg-white hover:border-[#1D5F31]/40 hover:shadow-lg hover:shadow-[#1D5F31]/5 transition-all text-left"
                        >
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                <div className="flex items-center gap-5">
                                    <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center border border-black/5 group-hover:border-[#1D5F31]/30 group-hover:bg-[#1D5F31]/5 transition-all shrink-0">
                                        <User size={22} className="text-slate-500 group-hover:text-[#1D5F31] transition-colors" />
                                    </div>
                                    <div className="text-left">
                                        <span className="text-base font-bold uppercase !text-black group-hover:text-[#1D5F31] transition-colors">
                                            {t.teacherName}
                                        </span>
                                        <div className="flex items-center gap-3 mt-1">
                                            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                                                {t.count} {t.count === 1 ? 'venda' : 'vendas'}
                                            </span>
                                            {t.pendingCount > 0 && (
                                                <span className="flex items-center gap-1 text-[10px] font-bold uppercase px-2.5 py-0.5 bg-amber-100 text-amber-800 rounded-lg border border-amber-200">
                                                    <AlertCircle size={10} />
                                                    {t.pendingCount} pendente{t.pendingCount > 1 ? 's' : ''}
                                                </span>
                                            )}
                                            {t.pendingCount === 0 && (
                                                <span className="flex items-center gap-1 text-[10px] font-bold uppercase px-2.5 py-0.5 bg-emerald-100 text-emerald-800 rounded-lg border border-emerald-200">
                                                    <CheckCircle2 size={10} />
                                                    Em dia
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-8 md:gap-12">
                                    <div className="text-right">
                                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Bruto</p>
                                        <p className="text-base font-bold !text-black tracking-tight">
                                            R$ {t.totalGross.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Lucro</p>
                                        <p className="text-base font-bold text-[#1D5F31] tracking-tight">
                                            R$ {t.totalPlatform.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Repasse</p>
                                        <p className="text-lg font-bold !text-black tracking-tighter">
                                            R$ {t.totalTeacher.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                        </p>
                                    </div>
                                    <ArrowUpRight size={20} className="text-slate-300 group-hover:text-[#1D5F31] transition-colors shrink-0" />
                                </div>
                            </div>
                        </button>
                    ))}

                    {filteredSummaries.length === 0 && (
                        <div className="text-center py-20 bg-slate-50 rounded-[40px] border border-dashed border-black/10">
                            <p className="text-sm font-bold uppercase text-slate-400 tracking-[0.2em]">
                                {searchTerm ? 'Nenhum professor encontrado para esta busca.' : 'Nenhum pagamento registrado.'}
                            </p>
                        </div>
                    )}
                </div>
            </div>

            <TeacherSalesDrawer
                isOpen={!!selectedTeacher}
                onClose={() => setSelectedTeacher(null)}
                teacherName={selectedTeacher?.name || ''}
                teacherId={selectedTeacher?.id || null}
                allPayments={payments}
            />
        </>
    )
}
