import {
    DollarSign,
    TrendingUp,
    Calendar,
    ArrowUpRight,
    Download,
    Wallet,
    Info,
    ChevronRight,
    Search
} from 'lucide-react'
import { Button } from '@/components/ui/button'

const MOCK_SALES = [
    { id: '#8420', student: 'Ana Silva', course: 'React do Zero ao Avançado', value: 'R$ 297,00', commission: 'R$ 207,90', date: '20/02/2024', status: 'Sucedido' },
    { id: '#8419', student: 'João Pereira', studentEmail: 'joao.p@email.com', course: 'Next.js 14 Masterclass', value: 'R$ 497,00', commission: 'R$ 347,90', date: '20/02/2024', status: 'Sucedido' },
    { id: '#8418', student: 'Maria Santos', course: 'Tailwind CSS Pro', value: 'R$ 197,00', commission: 'R$ 137,90', date: '19/02/2024', status: 'Sucedido' },
    { id: '#8417', student: 'Ricardo Dias', course: 'React do Zero ao Avançado', value: 'R$ 297,00', commission: 'R$ 207,90', date: '18/02/2024', status: 'Processando' },
]

export default function FinancialDashboardPage() {
    return (
        <div className="p-8 md:p-12 space-y-12">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="text-3xl font-black italic uppercase tracking-tighter">
                        Painel <span className="text-[#00FF00]">Financeiro</span>
                    </h1>
                    <p className="text-gray-400 mt-1">Acompanhe suas vendas, comissões e solicite saques.</p>
                </div>
                <div className="flex gap-4">
                    <Button variant="outline" className="border-white/10 text-gray-400 font-bold uppercase text-[10px] tracking-widest px-6">
                        <Download size={16} className="mr-2" /> Relatório CSV
                    </Button>
                    <Button className="bg-[#00FF00] text-black font-black uppercase text-xs tracking-widest px-8 shadow-[0_0_20px_rgba(0,255,0,0.3)] hover:brightness-110">
                        Solicitar Saque
                    </Button>
                </div>
            </header>

            {/* Cards de Saldo */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="bg-[#0a1f3a]/60 border border-white/5 p-8 rounded-[40px] relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-6 opacity-10 text-[#00FF00] group-hover:scale-110 transition-transform">
                        <Wallet size={80} />
                    </div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 text-gray-500 mb-4">
                            <DollarSign size={14} />
                            <span className="text-[10px] font-black uppercase tracking-widest">Saldo Disponível</span>
                        </div>
                        <h3 className="text-4xl font-black mb-2">R$ 12.450 <span className="text-lg text-gray-500">,00</span></h3>
                        <p className="text-[#00FF00] text-xs font-bold flex items-center gap-1">
                            <TrendingUp size={12} /> +12% em relação ao mês anterior
                        </p>
                    </div>
                </div>

                <div className="bg-[#0a1f3a]/40 border border-white/5 p-8 rounded-[40px] relative overflow-hidden group">
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 text-gray-500 mb-4">
                            <Calendar size={14} />
                            <span className="text-[10px] font-black uppercase tracking-widest">A Receber (30 dias)</span>
                        </div>
                        <h3 className="text-4xl font-black mb-2 text-gray-400">R$ 3.120 <span className="text-lg font-normal">,50</span></h3>
                        <p className="text-gray-500 text-xs font-bold italic">Processamento automático</p>
                    </div>
                </div>

                <div className="bg-[#0a1f3a]/40 border border-white/5 p-8 rounded-[40px] flex flex-col justify-between group">
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-gray-500">
                            <Info size={14} />
                            <span className="text-[10px] font-black uppercase tracking-widest">Sua Comissão</span>
                        </div>
                        <div className="flex items-end gap-3">
                            <h3 className="text-5xl font-black text-[#00FF00]">70%</h3>
                            <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mb-2">Plano Expert</p>
                        </div>
                    </div>
                    <button className="text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-white transition flex items-center gap-1 mt-6">
                        Ver detalhes do plano <ChevronRight size={12} />
                    </button>
                </div>
            </div>

            {/* Tabela de Vendas Recentes */}
            <div className="bg-[#0a1f3a]/30 border border-white/5 rounded-[40px] p-8 space-y-8">
                <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                    <h2 className="text-xl font-bold italic uppercase tracking-tighter">Histórico de <span className="text-[#00FF00]">Vendas</span></h2>
                    <div className="relative w-full md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" size={14} />
                        <input
                            placeholder="Buscar venda..."
                            className="w-full bg-black/20 border border-white/5 rounded-xl px-10 py-2.5 text-xs text-white focus:border-[#00FF00] outline-none"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-white/5 text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">
                                <th className="pb-6 px-4">Pedido</th>
                                <th className="pb-6 px-4">Aluno</th>
                                <th className="pb-6 px-4">Curso</th>
                                <th className="pb-6 px-4">Valor</th>
                                <th className="pb-6 px-4">Sua Comiss.</th>
                                <th className="pb-6 px-4">Data</th>
                                <th className="pb-6 px-4 text-right">Status</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm">
                            {MOCK_SALES.map((sale) => (
                                <tr key={sale.id} className="border-b border-white/5 hover:bg-white/5 transition-colors group">
                                    <td className="py-6 px-4 font-mono text-gray-500 text-xs">{sale.id}</td>
                                    <td className="py-6 px-4">
                                        <div className="font-bold">{sale.student}</div>
                                        <div className="text-[10px] text-gray-500 truncate max-w-[150px]">{sale.studentEmail || 'aluno@exs.com'}</div>
                                    </td>
                                    <td className="py-6 px-4 italic text-gray-300 font-medium">{sale.course}</td>
                                    <td className="py-6 px-4 font-bold">{sale.value}</td>
                                    <td className="py-6 px-4 text-[#00FF00] font-black">{sale.commission}</td>
                                    <td className="py-6 px-4 text-xs text-gray-500 uppercase font-bold">{sale.date}</td>
                                    <td className="py-6 px-4 text-right">
                                        <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${sale.status === 'Sucedido' ? 'bg-[#00FF00]/10 text-[#00FF00]' : 'bg-yellow-500/10 text-yellow-500'}`}>
                                            {sale.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="flex justify-center pt-4">
                    <button className="text-[10px] font-black uppercase tracking-widest text-[#00FF00] hover:brightness-110 transition underline underline-offset-8 decoration-2">
                        Ver todo o histórico
                    </button>
                </div>
            </div>
        </div>
    )
}
