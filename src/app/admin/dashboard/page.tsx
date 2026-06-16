import { getFinancialData, getCourseValidityMonths } from '@/app/actions/admin'
import {
    DollarSign,
    TrendingUp,
    Users,
    ArrowUpRight,
    Search
} from 'lucide-react'
import RevenueChart from './components/RevenueChart'
import CourseValiditySettings from './components/CourseValiditySettings'
import { AdminFinanceExportButton } from './components/AdminFinanceExportButton'
import { FinancialTable } from './components/FinancialTable'

export default async function AdminDashboardPage() {
    const [data, validityMonths] = await Promise.all([
        getFinancialData(),
        getCourseValidityMonths(),
    ])

    const metrics = [
        { label: 'Faturamento Bruto', value: data.totalGross, icon: DollarSign, color: 'text-[#1D5F31]' },
        { label: 'Lucro Plataforma', value: data.totalPlatform, icon: ArrowUpRight, color: 'text-[#1D5F31]' },
        { label: 'Repasse Professores', value: data.totalTeacher, icon: Users, color: 'text-[#1D5F31]' },
    ]

    return (
        <div className="min-h-screen bg-[#F5F5F7] space-y-12 animate-in fade-in duration-700 font-montserrat p-8 md:p-12">
            {/* Header com Textos em Preto Puro */}
            <header className="relative z-10">
                <div className="flex items-center gap-3 mb-2">

                </div>
                <h1 className="text-2xl md:text-3xl font-bold tracking-tighter uppercase leading-none !text-[#000000] max-w-2xl">
                    DASHBOARD <span className="text-[#1D5F31]">Financeiro</span>
                </h1>
                <p className="mt-3 text-[10px] font-bold uppercase tracking-[3px] !text-[#000000]">

                </p>
            </header>

            {/* Metrics Grid com Contornos Definidos */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {metrics.map((m, i) => (
                    <div key={i} className="bg-white p-10 rounded-xl border border-black/20 hover:border-black/50 transition-all group shadow-sm">
                        <div className="flex justify-between items-start mb-8">
                            <div className={`p-5 bg-slate-50 rounded-lg border border-black/20 ${m.color} group-hover:scale-105 transition-transform`}>
                                <m.icon size={28} strokeWidth={2.5} />
                            </div>
                            <span className="text-[8px] font-bold uppercase tracking-widest px-2 py-1 rounded-md bg-slate-100 !text-[#000000] border border-black/20">
                                REAL-TIME DATA
                            </span>
                        </div>
                        <p className="!text-[#000000] text-sm font-bold uppercase tracking-tight mb-2">{m.label}</p>
                        <h3 className="text-3xl font-bold tracking-tighter !text-[#000000]">
                            R$ {(m.value ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </h3>
                    </div>
                ))}
            </div>

            <div className="grid lg:grid-cols-3 gap-10">
                {/* Main Content: Table com bordas pretas sutis */}
                <div className="lg:col-span-2 space-y-8">
                    <FinancialTable payments={data.payments} />
                </div>

                {/* Sidebar com Contornos e Textos Pretos */}
                <div className="space-y-10">
                    <div className="bg-[#FAFAFA] p-10 rounded-2xl border border-black/20">
                        <div className="flex items-center gap-4 mb-10">
                            <div className="w-10 h-10 bg-slate-50 rounded-lg flex items-center justify-center border border-black/20">
                                <TrendingUp className="text-[#1D5F31]" size={20} strokeWidth={2.5} />
                            </div>
                            <h3 className="text-sm font-bold uppercase tracking-tight !text-[#000000]">Divisão de Receita</h3>
                        </div>
                        <RevenueChart platform={data.totalPlatform} teacher={data.totalTeacher} />
                        <div className="mt-10 space-y-4">
                            <div className="flex items-center justify-between text-sm font-bold uppercase bg-slate-50 p-4 rounded-lg border border-black/20">
                                <span className="!text-[#000000]">Taxa Plataforma</span>
                                <span className="text-[#1D5F31] font-bold">{data.platformTaxPercent}%</span>
                            </div>
                            <div className="flex items-center justify-between text-sm font-bold uppercase bg-slate-50 p-4 rounded-lg border border-black/20">
                                <span className="!text-[#000000]">Repasse Professor</span>
                                <span className="!text-[#000000]">{100 - data.platformTaxPercent}%</span>
                            </div>
                        </div>
                    </div>

                    <CourseValiditySettings initialMonths={validityMonths} />
                </div>
            </div>
        </div>
    )
}