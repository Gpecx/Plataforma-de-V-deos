import { getAllTeachers, getSalesLogs } from '@/app/actions/admin'
import SalesLogList from './components/SalesLogList'

export default async function SalesAuditPage() {
    const teachers = await getAllTeachers()
    const sales = await getSalesLogs()

    return (
        <div className="flex flex-col gap-8 animate-in fade-in duration-700 font-montserrat">
            <header className="flex flex-col items-center text-center mb-2">
                <div className="flex items-center gap-3 mb-4">

                </div>
                <h1 className="text-3xl font-bold tracking-tighter uppercase leading-none text-slate-950 text-center max-w-2xl">
                    <span className="text-[#1D5F31]">Vendas da Plataforma</span>
                </h1>
                <p className="text-slate-900 mt-4 text-[11px] font-medium uppercase tracking-widest max-w-xl leading-tight">

                </p>
            </header>

            <SalesLogList
                initialSales={sales}
                teachers={teachers}
            />
        </div>
    )
}
