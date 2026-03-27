import { getFinancialData } from '@/app/actions/admin'
import {
    DollarSign,
    TrendingUp,
    Users,
    ArrowUpRight,
    Search
} from 'lucide-react'
import RevenueChart from './components/RevenueChart'
import TaxSettings from './components/TaxSettings'

export default async function AdminDashboardPage() {
    const data = await getFinancialData()

    const metrics = [
        { label: 'Faturamento Bruto', value: data.totalGross, icon: DollarSign, color: 'text-[#1D5F31]' },
        { label: 'Lucro Plataforma', value: data.totalPlatform, icon: ArrowUpRight, color: 'text-[#1D5F31]' },
        { label: 'Repasse Professores', value: data.totalTeacher, icon: Users, color: 'text-[#1D5F31]' },
    ]

    return (
        <div className="min-h-screen bg-white space-y-12 animate-in fade-in duration-700 font-exo p-8 md:p-12">
            {/* Header com Textos em Preto Puro */}
            <header className="relative z-10">
                <div className="flex items-center gap-3 mb-2">

                </div>
                <h1 className="text-4xl md:text-5xl font-black tracking-tighter uppercase leading-none !text-[#000000]">
                    DASHBOARD <span className="text-[#1D5F31]">Financeiro</span>
                </h1>
                <p className="mt-3 text-[10px] font-bold uppercase tracking-[3px] !text-[#000000]">

                </p>
            </header>

            {/* Metrics Grid com Contornos Definidos */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {metrics.map((m, i) => (
                    <div key={i} className="bg-white p-10 rounded-[24px] border border-black/20 hover:border-black/50 transition-all group">
                        <div className="flex justify-between items-start mb-8">
                            <div className={`p-5 bg-slate-50 rounded-2xl border border-black/20 ${m.color} group-hover:scale-105 transition-transform`}>
                                <m.icon size={28} strokeWidth={2.5} />
                            </div>
                            <span className="text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded-md bg-slate-100 !text-[#000000] border border-black/20">
                                REAL-TIME DATA
                            </span>
                        </div>
                        <p className="!text-[#000000] text-[10px] font-black uppercase tracking-[2px] mb-2">{m.label}</p>
                        <h3 className="text-3xl font-black tracking-tighter !text-[#000000]">
                            R$ {m.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </h3>
                    </div>
                ))}
            </div>

            <div className="grid lg:grid-cols-3 gap-10">
                {/* Main Content: Table com bordas pretas sutis */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="bg-white p-10 rounded-[32px] border border-black/20">
                        <div className="flex items-center justify-between mb-12">
                            <h2 className="text-xl font-black uppercase tracking-tighter !text-[#000000]">Histórico de Pagamentos</h2>
                            <div className="flex items-center gap-4 bg-slate-50 px-5 py-2 rounded-xl border border-black/20">
                                <Search size={16} className="!text-[#000000]" />
                                <span className="text-[10px] font-black !text-[#000000] uppercase tracking-widest">{data.payments.length} Transações</span>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="border-b-2 border-black/20 text-[10px] font-black !text-[#000000] uppercase tracking-[2px]">
                                        <th className="pb-6 px-4">Curso</th>
                                        <th className="pb-6 px-4">Professor</th>
                                        <th className="pb-6 px-4">Bruto</th>
                                        <th className="pb-6 px-4 text-[#1D5F31]">Lucro</th>
                                        <th className="pb-6 px-4">Repasse</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-black/10">
                                    {data.payments.map((p: any) => (
                                        <tr key={p.id} className="group hover:bg-slate-50 transition-colors">
                                            <td className="py-6 px-4">
                                                <div className="text-xs font-black !text-[#000000] uppercase truncate max-w-[180px]">
                                                    {p.courseName}
                                                </div>
                                            </td>
                                            <td className="py-6 px-4 font-bold !text-[#000000] text-[10px] uppercase">
                                                {p.teacherName}
                                            </td>
                                            <td className="py-6 px-4 text-xs font-black !text-[#000000]">
                                                R$ {p.grossValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                            </td>
                                            <td className="py-6 px-4 text-xs font-black text-[#1D5F31]">
                                                R$ {p.platformShare.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                            </td>
                                            <td className="py-6 px-4 text-xs font-black !text-[#000000]">
                                                R$ {p.teacherShare.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Sidebar com Contornos e Textos Pretos */}
                <div className="space-y-10">
                    <div className="bg-white p-10 rounded-[32px] border border-black/20">
                        <div className="flex items-center gap-4 mb-10">
                            <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center border border-black/20">
                                <TrendingUp className="text-[#1D5F31]" size={20} strokeWidth={2.5} />
                            </div>
                            <h3 className="text-xs font-black uppercase tracking-widest !text-[#000000]">Divisão de Receita</h3>
                        </div>
                        <RevenueChart platform={data.totalPlatform} teacher={data.totalTeacher} />
                        <div className="mt-10 space-y-4">
                            <div className="flex items-center justify-between text-[10px] font-black uppercase bg-slate-50 p-4 rounded-xl border border-black/20">
                                <span className="!text-[#000000]">Taxa Plataforma</span>
                                <span className="text-[#1D5F31] font-black">{data.platformTaxPercent}%</span>
                            </div>
                            <div className="flex items-center justify-between text-[10px] font-black uppercase bg-slate-50 p-4 rounded-xl border border-black/20">
                                <span className="!text-[#000000]">Repasse Professor</span>
                                <span className="!text-[#000000]">{100 - data.platformTaxPercent}%</span>
                            </div>
                        </div>
                    </div>

                    <TaxSettings currentTax={data.platformTaxPercent} />
                </div>
            </div>
        </div>
    )
}