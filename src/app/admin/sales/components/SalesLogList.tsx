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
            <div className="bg-white border border-black p-10 flex flex-wrap gap-8 items-end rounded-[40px] shadow-sm">
                <div className="flex-grow space-y-3 min-w-[250px]">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-900 flex items-center gap-2">
                        <UserIcon size={12} className="text-[#1D5F31]" /> Professor Responsável
                    </label>
                    <select 
                        value={professorId}
                        onChange={(e) => setProfessorId(e.target.value)}
                        className="w-full bg-slate-50 border border-black p-4 rounded-2xl text-[11px] !text-black focus:border-black focus:bg-white outline-none transition-all uppercase font-black tracking-widest"
                    >
                        <option value="">TODOS OS INSTRUTORES</option>
                        {teachers.map(t => (
                            <option key={t.id} value={t.id}>{t.full_name || t.email}</option>
                        ))}
                    </select>
                </div>

                <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-900 flex items-center gap-2">
                        <Calendar size={12} className="text-[#1D5F31]" /> Período Inicial
                    </label>
                    <input 
                        type="date" 
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="bg-slate-50 border border-black p-4 rounded-2xl text-[11px] !text-black focus:border-black focus:bg-white outline-none transition-all font-black"
                    />
                </div>

                <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-900 flex items-center gap-2">
                        <Calendar size={12} className="text-[#1D5F31]" /> Período Final
                    </label>
                    <input 
                        type="date" 
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="bg-slate-50 border border-black p-4 rounded-2xl text-[11px] !text-black focus:border-black focus:bg-white outline-none transition-all font-black"
                    />
                </div>

                <button 
                    onClick={handleFilter}
                    disabled={loading}
                    className="bg-slate-900 text-white px-10 h-[52px] font-black uppercase text-[10px] tracking-[3px] hover:bg-[#1D5F31] transition-all flex items-center gap-3 disabled:opacity-50 rounded-2xl shadow-lg shadow-slate-900/10 active:scale-95"
                >
                    {loading ? <Loader2 size={18} className="animate-spin" /> : <Filter size={16} />}
                    <span>FILTRAR DADOS</span>
                </button>
            </div>

            {/* Tabela de Resultados */}
            <div className="bg-white border border-black rounded-[40px] overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-slate-100 bg-slate-50/50">
                                <th className="p-8 text-[10px] font-black uppercase tracking-widest text-[#000000]">Rastreio / Hash</th>
                                <th className="p-8 text-[10px] font-black uppercase tracking-widest text-[#000000]">Timeline</th>
                                <th className="p-8 text-[10px] font-black uppercase tracking-widest text-[#000000]">Montante Bruto</th>
                                <th className="p-8 text-[10px] font-black uppercase tracking-widest text-[#000000]">Dedução Plataforma</th>
                                <th className="p-8 text-[10px] font-black uppercase tracking-widest text-[#000000]">Net Instrutor</th>
                                <th className="p-8 text-[10px] font-black uppercase tracking-widest text-[#000000]">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {sales.map((sale) => (
                                <tr key={sale.id} className="hover:bg-slate-50/50 transition-colors group">
                                    <td className="p-8 font-mono text-[10px] text-slate-900 font-bold tracking-tighter group-hover:text-black transition-colors">
                                        {sale.idTransacao}
                                    </td>
                                    <td className="p-8 text-[10px] text-slate-900 font-black uppercase tracking-widest">
                                        {formatDate(sale.dataCriacao)}
                                    </td>
                                    <td className="p-8 text-[11px] text-slate-900 font-black">
                                        {formatCurrency(sale.valorBruto)}
                                    </td>
                                    <td className="p-8 text-[11px] text-rose-500 font-black italic">
                                        - {formatCurrency(sale.taxaPlataforma)}
                                    </td>
                                    <td className="p-8 text-[11px] text-[#1D5F31] font-black">
                                        + {formatCurrency(sale.repasseProfessor)}
                                    </td>
                                    <td className="p-8">
                                        <div className={`inline-flex items-center px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${
                                            sale.statusPagamento === 'pago' 
                                            ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
                                            : 'bg-slate-100 text-slate-900 border border-slate-400'
                                        }`}>
                                            <div className={`w-1.5 h-1.5 rounded-full mr-2 ${sale.statusPagamento === 'pago' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-900'}`} />
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
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                            <Search size={32} className="text-slate-900" />
                        </div>
                        <p className="text-slate-900 font-black uppercase tracking-[4px] text-[10px] italic">Base de Dados Vazia: Nenhum registro encontrado</p>
                    </div>
                )}
            </div>
        </div>
    )
}
