'use client'

import { useState } from 'react'
import { filterSalesAction } from '../actions'
import { Search, Filter, Calendar, Download, User as UserIcon, Loader2 } from 'lucide-react'

interface SalesLogListProps {
    initialSales: any[]
    teachers: any[]
}

export default function SalesLogList({ initialSales, teachers }: SalesLogListProps) {
    const [sales, setSales] = useState(initialSales)
    const [loading, setLoading] = useState(false)
    const [professorId, setProfessorId] = useState('')
    const [startDate, setStartDate] = useState('')
    const [endDate, setEndDate] = useState('')

    const handleFilter = async () => {
        setLoading(true)
        try {
            const results = await filterSalesAction(professorId, startDate, endDate)
            setSales(results)
        } catch (error) {
            alert('Erro ao filtrar vendas')
        } finally {
            setLoading(false)
        }
    }

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
    }

    const formatDate = (date: any) => {
        const d = date instanceof Date ? date : new Date(date)
        return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    }

    return (
        <div className="space-y-10 animate-in fade-in duration-700">
            {/* Filtros */}
            {/* Filtros */}
            <div className="bg-white border border-black/10 p-8 flex flex-wrap gap-6 items-end rounded-xl shadow-sm">
                <div className="flex-grow space-y-3 min-w-[250px]">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                        <UserIcon size={12} className="text-[#1D5F31]" /> Professor Responsável
                    </label>
                    <select 
                        value={professorId}
                        onChange={(e) => setProfessorId(e.target.value)}
                        className="w-full bg-black/5 border border-black/10 p-3 rounded-xl text-[11px] text-slate-900 focus:border-[#1D5F31]/30 focus:bg-white outline-none transition-all uppercase font-bold tracking-wider"
                    >
                        <option value="">TODOS OS INSTRUTORES</option>
                        {teachers.map(t => (
                            <option key={t.id} value={t.id}>{t.full_name || t.email}</option>
                        ))}
                    </select>
                </div>

                <div className="space-y-3">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                        <Calendar size={12} className="text-[#1D5F31]" /> Período Inicial
                    </label>
                    <input 
                        type="date" 
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="bg-black/5 border border-black/10 p-3 rounded-xl text-[11px] text-slate-900 focus:border-[#1D5F31]/30 focus:bg-white outline-none transition-all font-bold"
                    />
                </div>

                <div className="space-y-3">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                        <Calendar size={12} className="text-[#1D5F31]" /> Período Final
                    </label>
                    <input 
                        type="date" 
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="bg-black/5 border border-black/10 p-3 rounded-xl text-[11px] text-slate-900 focus:border-[#1D5F31]/30 focus:bg-white outline-none transition-all font-bold"
                    />
                </div>

                <div className="ml-auto">
                    <button 
                        onClick={handleFilter}
                        disabled={loading}
                        className="bg-[#1D5F31] text-white px-8 h-12 font-bold uppercase text-xs tracking-wider hover:bg-slate-900 transition-all flex items-center gap-3 disabled:opacity-50 rounded-xl shadow-sm active:scale-95"
                    >
                        {loading ? <Loader2 size={18} className="animate-spin" /> : <Filter size={16} />}
                        <span>FILTRAR DADOS</span>
                    </button>
                </div>
            </div>

            {/* Tabela de Resultados */}
            <div className="bg-white border border-black/10 rounded-xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-black/5 bg-black/5/30">
                                <th className="p-6 text-[10px] font-bold uppercase tracking-wider text-slate-900">Rastreio / Hash</th>
                                <th className="p-6 text-[10px] font-bold uppercase tracking-wider text-slate-900">Timeline</th>
                                <th className="p-6 text-[10px] font-bold uppercase tracking-wider text-slate-900">Montante Bruto</th>
                                <th className="p-6 text-[10px] font-bold uppercase tracking-wider text-slate-900">Dedução Plataforma</th>
                                <th className="p-6 text-[10px] font-bold uppercase tracking-wider text-slate-900">Net Instrutor</th>
                                <th className="p-6 text-[10px] font-bold uppercase tracking-wider text-slate-900">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {sales.map((sale) => (
                                <tr key={sale.id} className="hover:bg-black/5/30 transition-colors group border-b border-black/5 last:border-0">
                                    <td className="p-6 font-mono text-[10px] text-slate-700 group-hover:text-slate-900 transition-colors">
                                        {sale.idTransacao}
                                    </td>
                                    <td className="p-6 text-[10px] text-slate-900 font-light uppercase tracking-wider">
                                        {formatDate(sale.dataCriacao)}
                                    </td>
                                    <td className="p-6 text-[11px] text-slate-900 font-bold">
                                        {formatCurrency(sale.valorBruto)}
                                    </td>
                                    <td className="p-6 text-[11px] text-rose-500 font-bold ">
                                        - {formatCurrency(sale.taxaPlataforma)}
                                    </td>
                                    <td className="p-6 text-[11px] text-[#1D5F31] font-bold">
                                        + {formatCurrency(sale.repasseProfessor)}
                                    </td>
                                    <td className="p-6">
                                        <div className={`inline-flex items-center px-4 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                                            sale.statusPagamento === 'pago' 
                                            ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
                                            : 'bg-black/5 text-slate-700 border border-black/10'
                                        }`}>
                                            <div className={`w-1.5 h-1.5 rounded-full mr-2 ${sale.statusPagamento === 'pago' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
                                            {sale.statusPagamento}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {sales.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-24 bg-white">
                        <div className="w-16 h-16 bg-black/5 rounded-full flex items-center justify-center mb-6 border border-black/10">
                            <Search size={32} className="text-slate-200" />
                        </div>
                        <p className="text-slate-900 font-light uppercase tracking-wider text-[10px] ">Base de Dados Vazia: Nenhum registro encontrado</p>
                    </div>
                )}
            </div>
        </div>
    )
}
