import { getAllTeachers, getSalesLogs } from '@/app/actions/admin'
import SalesLogList from './components/SalesLogList'

export default async function SalesAuditPage() {
    const teachers = await getAllTeachers()
    const sales = await getSalesLogs()

    return (
        <div className="space-y-12 animate-in fade-in duration-700 font-exo">
            <header>
                <div className="flex items-center gap-3 mb-4">
                    <div className="h-[1px] w-10 bg-[#1D5F31]" />
                    <span className="text-[10px] font-black uppercase tracking-[5px] text-[#1D5F31]">Auditoria Financeira</span>
                </div>
                <h1 className="text-4xl font-black tracking-tighter uppercase leading-none text-slate-900">
                    Log de <span className="text-[#1D5F31]">Vendas</span>
                </h1>
                <p className="text-slate-900 mt-6 text-[11px] font-black uppercase tracking-[2px] max-w-xl leading-relaxed italic">
                    Rastreie cada transação na plataforma. Audite o split entre PowerPlay e Instrutores com precisão industrial.
                </p>
            </header>

            <SalesLogList 
                initialSales={sales} 
                teachers={teachers} 
            />
        </div>
    )
}
