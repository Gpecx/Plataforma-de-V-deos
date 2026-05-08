"use client"

import { useState } from 'react'
import { Search, User } from 'lucide-react'
import { TeacherSalesDrawer } from './TeacherSalesDrawer'
import { AdminFinanceExportButton } from './AdminFinanceExportButton'

import { Payment } from '@/types/financial'

interface FinancialTableProps {
    payments: Payment[]
}

export function FinancialTable({ payments }: FinancialTableProps) {
    const [selectedTeacher, setSelectedTeacher] = useState<{ id: string | null, name: string } | null>(null)

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

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b-2 border-black/20 text-sm font-bold !text-[#000000] uppercase tracking-tight">
                                <th className="pb-6 px-4">Data</th>
                                <th className="pb-6 px-4">Curso</th>
                                <th className="pb-6 px-4">Professor</th>
                                <th className="pb-6 px-4">Bruto</th>
                                <th className="pb-6 px-4 text-[#1D5F31]">Lucro</th>
                                <th className="pb-6 px-4">Repasse</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-black/10">
                            {payments.map((p) => (
                                <tr key={p.id} className="group hover:bg-slate-50 transition-colors">
                                    <td className="py-6 px-4 text-xs font-bold !text-[#000000] opacity-60">
                                        {p.date ? new Date(p.date).toLocaleDateString('pt-BR') : '---'}
                                    </td>
                                    <td className="py-6 px-4">
                                        <div className="text-sm font-bold !text-[#000000] uppercase truncate max-w-[180px]">
                                            {p.courseName}
                                        </div>
                                    </td>
                                    <td className="py-6 px-4">
                                        <button 
                                            onClick={() => handleTeacherClick(p.teacherId, p.teacherName)}
                                            className="flex items-center gap-2 group/btn"
                                        >
                                            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center border border-black/5 group-hover/btn:border-[#1D5F31]/30 group-hover/btn:bg-[#1D5F31]/5 transition-all">
                                                <User size={14} className="text-slate-400 group-hover/btn:text-[#1D5F31]" />
                                            </div>
                                            <span className="font-bold !text-[#000000] text-sm uppercase group-hover/btn:text-[#1D5F31] transition-colors decoration-dotted group-hover/btn:underline underline-offset-4">
                                                {p.teacherName}
                                            </span>
                                        </button>
                                    </td>
                                    <td className="py-6 px-4 text-sm font-bold !text-[#000000]">
                                        R$ {p.grossValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                    </td>
                                    <td className="py-6 px-4 text-sm font-bold text-[#1D5F31]">
                                        R$ {p.platformShare.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                    </td>
                                    <td className="py-6 px-4 text-sm font-bold !text-[#000000]">
                                        R$ {p.teacherShare.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
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
