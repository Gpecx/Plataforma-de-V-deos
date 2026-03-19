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
        <div className="space-y-8">
            {/* Filtros */}
            <div className="bg-slate-900/50 border border-white/5 p-8 flex flex-wrap gap-6 items-end">
                <div className="flex-grow space-y-2 min-w-[200px]">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                        <UserIcon size={12} /> Professor
                    </label>
                    <select 
                        value={professorId}
                        onChange={(e) => setProfessorId(e.target.value)}
                        className="w-full bg-black border border-white/10 p-3 text-xs text-white focus:border-[#1D5F31] outline-none transition-all uppercase font-bold"
                    >
                        <option value="">Todos os Professores</option>
                        {teachers.map(t => (
                            <option key={t.id} value={t.id}>{t.full_name || t.email}</option>
                        ))}
                    </select>
                </div>

                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                        <Calendar size={12} /> Data Início
                    </label>
                    <input 
                        type="date" 
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="bg-black border border-white/10 p-3 text-xs text-white focus:border-[#1D5F31] outline-none transition-all"
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                        <Calendar size={12} /> Data Fim
                    </label>
                    <input 
                        type="date" 
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="bg-black border border-white/10 p-3 text-xs text-white focus:border-[#1D5F31] outline-none transition-all"
                    />
                </div>

                <button 
                    onClick={handleFilter}
                    disabled={loading}
                    className="bg-[#1D5F31] text-black px-8 py-3.5 font-black uppercase text-[10px] tracking-[2px] hover:bg-white transition-all flex items-center gap-2 disabled:opacity-50"
                >
                    {loading ? <Loader2 size={16} className="animate-spin" /> : <Filter size={14} />}
                    <span>Filtrar</span>
                </button>
            </div>

            {/* Tabela de Resultados */}
            <div className="overflow-x-auto border-x border-white/5">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-y border-white/10 bg-black/40">
                            <th className="p-6 text-[10px] font-black uppercase tracking-widest text-[#1D5F31]">ID Transação</th>
                            <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-500">Data</th>
                            <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-500">Valor Bruto</th>
                            <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-500">Taxa Plataforma</th>
                            <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-500">Repasse Instrutor</th>
                            <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-500">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sales.map((sale) => (
                            <tr key={sale.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors group">
                                <td className="p-6 font-mono text-[10px] text-white tracking-widest">
                                    {sale.idTransacao}
                                </td>
                                <td className="p-6 text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                                    {formatDate(sale.dataCriacao)}
                                </td>
                                <td className="p-6 text-[10px] text-white font-black">
                                    {formatCurrency(sale.valorBruto)}
                                </td>
                                <td className="p-6 text-[10px] text-rose-500/80 font-bold italic">
                                    - {formatCurrency(sale.taxaPlataforma)}
                                </td>
                                <td className="p-6 text-[10px] text-[#1D5F31] font-black">
                                    + {formatCurrency(sale.repasseProfessor)}
                                </td>
                                <td className="p-6">
                                    <span className={`px-3 py-1 text-[8px] font-black uppercase tracking-widest ${
                                        sale.statusPagamento === 'pago' ? 'bg-[#1D5F31]/20 text-[#1D5F31]' : 'bg-slate-800 text-slate-500'
                                    }`}>
                                        {sale.statusPagamento}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {sales.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 bg-slate-900/10 border-2 border-dashed border-slate-800">
                    <p className="text-slate-500 font-black uppercase tracking-widest text-xs italic">Nenhum registro encontrado para este filtro</p>
                </div>
            )}
        </div>
    )
}
