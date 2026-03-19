import { getFinancialData } from '@/app/actions/admin'
import { 
    DollarSign, 
    TrendingUp, 
    Users, 
    ShieldAlert,
    ArrowUpRight,
    Search
} from 'lucide-react'
import RevenueChart from './components/RevenueChart'
import TaxSettings from './components/TaxSettings'
import Link from 'next/link'

export default async function AdminDashboardPage() {
    const data = await getFinancialData()

    const metrics = [
        { label: 'Faturamento Bruto', value: data.totalGross, icon: DollarSign, color: 'text-white' },
        { label: 'Lucro Plataforma', value: data.totalPlatform, icon: ArrowUpRight, color: 'text-[#1D5F31]' },
        { label: 'Repasse Professores', value: data.totalTeacher, icon: Users, color: 'text-blue-500' },
    ]

    return (
        <div className="space-y-12 animate-in fade-in duration-700">
            <header>
                <div className="flex items-center gap-3 mb-2">
                    <div className="h-[2px] w-8 bg-[#1D5F31]" />
                    <span className="text-[10px] font-black uppercase tracking-[5px] text-[#1D5F31]">Central de Controle</span>
                </div>
                <h1 className="text-4xl font-black tracking-tighter uppercase leading-none">
                    Dashboard <span className="text-[#1D5F31]">Financeiro</span>
                </h1>
            </header>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {metrics.map((m, i) => (
                    <div key={i} className="bg-[#061629]/40 backdrop-blur-md p-8 border border-[#1D5F31]/20 hover:border-[#1D5F31] transition-all group">
                        <div className="flex justify-between items-start mb-6">
                            <div className={`p-4 bg-[#061629]/60 border border-[#1D5F31]/30 ${m.color}`}>
                                <m.icon size={24} />
                            </div>
                            <span className="text-[8px] font-black text-slate-700 uppercase tracking-widest">Live Data</span>
                        </div>
                        <p className="text-slate-500 text-[10px] font-black uppercase tracking-[2px]">{m.label}</p>
                        <h3 className="text-3xl font-black mt-1 tracking-tighter">
                            R$ {m.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </h3>
                    </div>
                ))}
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
                {/* Main Content: Payments Table */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="bg-[#061629]/40 backdrop-blur-md p-10 border border-[#1D5F31]/20 h-full flex flex-col">
                        <div className="flex items-center justify-between mb-10">
                            <h2 className="text-lg font-black uppercase tracking-tighter">Histórico de Pagamentos</h2>
                            <div className="flex gap-4">
                                <Search size={16} className="text-slate-500" />
                                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{data.payments.length} Transações</span>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="border-b border-[#1D5F31]/20 text-[9px] font-black text-slate-500 uppercase tracking-[2px]">
                                        <th className="pb-6">Curso</th>
                                        <th className="pb-6">Professor</th>
                                        <th className="pb-6">Valor Bruto</th>
                                        <th className="pb-6">Plataforma</th>
                                        <th className="pb-6">Professor</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#1D5F31]/10">
                                    {data.payments.map((p: any) => (
                                        <tr key={p.id} className="group hover:bg-[#1D5F31]/5 transition-colors">
                                            <td className="py-6 pr-4">
                                                <div className="text-xs font-black uppercase tracking-widest text-white truncate max-w-[200px]">
                                                    {p.courseName}
                                                </div>
                                            </td>
                                            <td className="py-6">
                                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                                                    {p.teacherName}
                                                </div>
                                            </td>
                                            <td className="py-6">
                                                <div className="text-xs font-black text-white">
                                                    R$ {p.grossValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                </div>
                                            </td>
                                            <td className="py-6">
                                                <div className="text-xs font-black text-[#1D5F31]">
                                                    R$ {p.platformShare.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                </div>
                                            </td>
                                            <td className="py-6">
                                                <div className="text-xs font-black text-blue-400">
                                                    R$ {p.teacherShare.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Sidebar: Chart & Settings */}
                <div className="space-y-8">
                    <div className="bg-[#061629]/40 backdrop-blur-md p-10 border border-[#1D5F31]/20">
                        <div className="flex items-center gap-3 mb-8">
                            <TrendingUp className="text-[#1D5F31]" size={20} />
                            <h3 className="text-sm font-black uppercase tracking-widest text-white">Divisão de Receita</h3>
                        </div>
                        <RevenueChart platform={data.totalPlatform} teacher={data.totalTeacher} />
                        <div className="mt-8 space-y-4">
                            <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest">
                                <span className="text-slate-500">Taxa Plataforma</span>
                                <span className="text-[#1D5F31]">{data.platformTaxPercent}%</span>
                            </div>
                            <div className="h-[1px] bg-[#1D5F31]/10 w-full" />
                            <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest">
                                <span className="text-slate-500">Repasse Professor</span>
                                <span className="text-blue-500">{100 - data.platformTaxPercent}%</span>
                            </div>
                        </div>
                    </div>

                    <TaxSettings currentTax={data.platformTaxPercent} />
                </div>
            </div>
        </div>
    )
}
