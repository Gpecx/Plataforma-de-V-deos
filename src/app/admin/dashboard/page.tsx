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
        { label: 'Faturamento Bruto', value: data.totalGross, icon: DollarSign, color: 'text-slate-900' },
        { label: 'Lucro Plataforma', value: data.totalPlatform, icon: ArrowUpRight, color: 'text-[#1D5F31]' },
        { label: 'Repasse Professores', value: data.totalTeacher, icon: Users, color: 'text-blue-600' },
    ]

    return (
        <div className="space-y-12 animate-in fade-in duration-700 font-exo p-8 md:p-12">
            <header>
                <div className="flex items-center gap-3 mb-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-[#1D5F31]" />
                    <span className="text-[10px] font-black uppercase tracking-[5px] text-slate-900">CONTROL CENTER</span>
                </div>
                <h1 className="text-4xl md:text-5xl font-black tracking-tighter uppercase leading-none text-slate-900">
                    Dashboard <span className="text-[#1D5F31]">Financeiro</span>
                </h1>
                <p className="text-slate-900 mt-3 text-[10px] font-bold uppercase tracking-[3px] italic">Monitoramento global de receitas e transações da plataforma.</p>
            </header>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {metrics.map((m, i) => (
                    <div key={i} className="bg-white p-10 rounded-[32px] border border-slate-200 hover:border-[#1D5F31]/30 transition-all group shadow-sm hover:shadow-xl">
                        <div className="flex justify-between items-start mb-8">
                            <div className={`p-5 bg-slate-50 rounded-2xl border border-slate-100 ${m.color} group-hover:scale-110 transition-transform`}>
                                <m.icon size={28} strokeWidth={2.5} />
                            </div>
                            <span className="text-[8px] font-black text-slate-900 uppercase tracking-widest whitespace-nowrap">REAL-TIME DATA</span>
                        </div>
                        <p className="text-slate-900 text-[10px] font-black uppercase tracking-[2px] mb-2">{m.label}</p>
                        <h3 className="text-3xl font-black tracking-tighter text-slate-900">
                            R$ {m.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </h3>
                    </div>
                ))}
            </div>

            <div className="grid lg:grid-cols-3 gap-10">
                {/* Main Content: Payments Table */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="bg-white p-12 rounded-[40px] border border-slate-200 h-full flex flex-col shadow-sm">
                        <div className="flex items-center justify-between mb-12">
                            <h2 className="text-xl font-black uppercase tracking-tighter text-slate-900">Histórico de Pagamentos</h2>
                            <div className="flex items-center gap-4 bg-slate-50 px-5 py-2 rounded-xl border border-slate-100">
                                <Search size={16} className="text-slate-900" />
                                <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">{data.payments.length} Transações</span>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="border-b border-slate-100 text-[10px] font-black text-slate-900 uppercase tracking-[2px]">
                                        <th className="pb-8 px-4">Curso</th>
                                        <th className="pb-8 px-4">Professor</th>
                                        <th className="pb-8 px-4">Bruto</th>
                                        <th className="pb-8 px-4">Plataforma</th>
                                        <th className="pb-8 px-4">Docente</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {data.payments.map((p: any) => (
                                        <tr key={p.id} className="group hover:bg-slate-50/50 transition-colors">
                                            <td className="py-8 px-4">
                                                <div className="text-xs font-black uppercase tracking-tight text-slate-900 truncate max-w-[180px] group-hover:text-[#1D5F31] transition-colors">
                                                    {p.courseName}
                                                </div>
                                            </td>
                                            <td className="py-8 px-4">
                                                <div className="text-[10px] font-black text-slate-900 uppercase tracking-widest">
                                                    {p.teacherName}
                                                </div>
                                            </td>
                                            <td className="py-8 px-4">
                                                <div className="text-xs font-black text-slate-900">
                                                    R$ {p.grossValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                </div>
                                            </td>
                                            <td className="py-8 px-4">
                                                <div className="text-xs font-black text-[#1D5F31]">
                                                    R$ {p.platformShare.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                </div>
                                            </td>
                                            <td className="py-8 px-4">
                                                <div className="text-xs font-black text-blue-600">
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
                <div className="space-y-10">
                    <div className="bg-white p-12 rounded-[40px] border border-slate-200 shadow-sm">
                        <div className="flex items-center gap-4 mb-10">
                            <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center border border-slate-100">
                                <TrendingUp className="text-[#1D5F31]" size={20} strokeWidth={2.5} />
                            </div>
                            <h3 className="text-xs font-black uppercase tracking-widest text-slate-900">Divisão de Receita</h3>
                        </div>
                        <RevenueChart platform={data.totalPlatform} teacher={data.totalTeacher} />
                        <div className="mt-10 space-y-6">
                            <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest bg-slate-50 p-4 rounded-xl border border-slate-100">
                                <span className="text-slate-900">Taxa Plataforma</span>
                                <span className="text-[#1D5F31]">{data.platformTaxPercent}%</span>
                            </div>
                            <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest bg-slate-50 p-4 rounded-xl border border-slate-100">
                                <span className="text-slate-900">Repasse Professor</span>
                                <span className="text-blue-600">{100 - data.platformTaxPercent}%</span>
                            </div>
                        </div>
                    </div>

                    <TaxSettings currentTax={data.platformTaxPercent} />
                </div>
            </div>
        </div>
    )
}
