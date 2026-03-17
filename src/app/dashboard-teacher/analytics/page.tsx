import { adminAuth, adminDb } from '@/lib/firebase-admin'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
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
import Link from 'next/link'
import { parseFirebaseDate } from '@/lib/date-utils'

export default async function FinancialDashboardPage() {
    const cookieStore = cookies()
    const token = (await cookieStore).get('firebase-token')?.value
    if (!token) redirect('/login')

    let decodedToken
    try {
        decodedToken = await adminAuth.verifyIdToken(token)
    } catch (error) {
        redirect('/login')
    }

    const teacherId = decodedToken.uid

    // 1. Buscamos os cursos deste professor
    const coursesSnapshot = await adminDb.collection('courses')
        .where('teacher_id', '==', teacherId)
        .get()

    const courses = coursesSnapshot.docs.reduce((acc, doc) => {
        acc[doc.id] = { id: doc.id, ...doc.data() }
        return acc
    }, {} as any)
    const courseIds = Object.keys(courses)

    if (courseIds.length === 0) {
        return <NoSales />
    }

    // 2. Buscamos as matrículas vinculadas aos cursos deste professor (em chunks de 10)
    const courseChunks = []
    for (let i = 0; i < courseIds.length; i += 10) {
        courseChunks.push(courseIds.slice(i, i + 10))
    }

    const enrollmentPromises = courseChunks.map(chunk =>
        adminDb.collection('enrollments')
            .where('course_id', 'in', chunk)
            .get()
    )

    const enrollmentSnapshots = await Promise.all(enrollmentPromises)
    const enrollments = enrollmentSnapshots.flatMap(snap =>
        snap.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }))
    ).sort((a: any, b: any) => {
        const dateA = parseFirebaseDate(a.created_at)?.getTime() || 0
        const dateB = parseFirebaseDate(b.created_at)?.getTime() || 0
        return (dateB as any) - (dateA as any)
    })

    // 3. Buscamos perfis dos alunos envolvidos
    const userIds = Array.from(new Set(enrollments.map((e: any) => e.user_id)))
    let profiles: any[] = []
    if (userIds.length > 0) {
        const userChunks = []
        for (let i = 0; i < userIds.length; i += 10) {
            userChunks.push(userIds.slice(i, i + 10))
        }

        const profilePromises = userChunks.map(chunk =>
            adminDb.collection('profiles').where('__name__', 'in', chunk).get()
        )
        const profileSnapshots = await Promise.all(profilePromises)
        profiles = profileSnapshots.flatMap(snap => snap.docs.map(doc => ({ id: doc.id, ...doc.data() })))
    }
    const profileMap = new Map(profiles.map(p => [p.id, p]))

    // 4. Processamento de dados unificado
    const salesHistory = enrollments.map((e: any) => {
        const student = profileMap.get(e.user_id)
        const course = courses[e.course_id]
        const value = Number(course?.price) || 0
        const commission = value * 0.70 // 70% solicitado

        return {
            id: `#${e.id.toString().slice(-4)}`,
            student: student?.full_name || 'Aluno Excluído',
            studentEmail: student?.email || 'N/A',
            course: course?.title || 'Curso Excluído',
            value: `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
            commission: `R$ ${commission.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
            date: (parseFirebaseDate(e.created_at) || new Date()).toLocaleDateString('pt-BR'),
            status: 'Sucedido'
        }
    })

    const totalRevenue = salesHistory.reduce((acc: number, s: any) => acc + parseFloat(s.commission.replace('R$ ', '').replace('.', '').replace(',', '.')), 0)

    // Cálculo do saldo pendente (últimos 30 dias - simplificado para exemplo)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const pendingBalance = salesHistory
        .filter((s: any) => {
            const [day, month, year] = s.date.split('/')
            return new Date(parseInt(year), parseInt(month) - 1, parseInt(day)) >= thirtyDaysAgo
        })
        .reduce((acc: number, s: any) => acc + parseFloat(s.commission.replace('R$ ', '').replace('.', '').replace(',', '.')), 0)

    return (
        <div className="pb-16 md:pb-24 bg-transparent min-h-screen text-slate-200 font-exo">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center pt-8 px-4 md:px-8 mb-12 gap-6">
                <div>
                    <h1 className="text-2xl font-black tracking-tighter text-white">
                        GESTÃO <span className="text-[#1D5F31]">FINANCEIRA</span>
                    </h1>
                    <p className="text-slate-400 mt-1 text-sm font-medium">Acompanhe suas vendas, comissões e solicite saques com facilidade.</p>
                </div>

                <div className="flex gap-4">
                    <Button variant="outline" className="border-[#1D5F31] text-slate-400 font-bold uppercase text-[10px] tracking-widest px-6 hover:bg-[#1D5F31]/20 transition-colors bg-[#061629] rounded-none">
                        <Download size={14} className="mr-2" /> Relatório CSV
                    </Button>
                    <Button className="bg-[#1D5F31] text-white font-black uppercase text-xs tracking-widest px-8 shadow-sm hover:brightness-105 transition-all rounded-none">
                        Solicitar Saque
                    </Button>
                </div>
            </header>

            {/* Cards de Saldo */}
            <div className="px-4 md:px-8 mb-16">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
                    <div className="bg-[#061629]/80 backdrop-blur-md border border-[#1D5F31] p-8 rounded-none relative overflow-hidden group transition-all hover:border-[#1D5F31]/20 shadow-sm">
                        <div className="absolute top-0 right-0 p-6 opacity-5 text-[#1D5F31] group-hover:scale-110 transition-transform">
                            <Wallet size={80} />
                        </div>
                        <div className="relative z-10">
                            <div className="flex items-center gap-2 text-slate-500 mb-4">
                                <DollarSign size={14} />
                                <span className="text-[10px] font-black uppercase tracking-widest">Saldo Disponível</span>
                            </div>
                            <h3 className="text-4xl font-black mb-2 text-white">R$ {totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
                            <p className="text-[#1D5F31] text-[10px] font-black uppercase tracking-widest flex items-center gap-1">
                                <TrendingUp size={12} /> Saldo acumulado
                            </p>
                        </div>
                    </div>

                    <div className="bg-[#061629]/80 backdrop-blur-md border border-[#1D5F31] p-8 rounded-none relative overflow-hidden group shadow-sm transition-all hover:border-slate-200">
                        <div className="relative z-10">
                            <div className="flex items-center gap-2 text-slate-500 mb-4">
                                <Calendar size={14} />
                                <span className="text-[10px] font-black uppercase tracking-widest">A Receber (Próx. 30 dias)</span>
                            </div>
                            <h3 className="text-4xl font-black mb-2 text-white">R$ {pendingBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
                            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Processamento automático</p>
                        </div>
                    </div>

                    <div className="bg-[#061629]/80 backdrop-blur-md border border-[#1D5F31] p-8 rounded-none flex flex-col justify-between group shadow-sm">
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 text-slate-500">
                                <Info size={14} />
                                <span className="text-[10px] font-black uppercase tracking-widest">Contrato Ativo</span>
                            </div>
                            <div className="flex items-end gap-3">
                                <h3 className="text-5xl font-black text-[#1D5F31]">70%</h3>
                                <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-2">Comissão PowerPlay</p>
                            </div>
                        </div>
                        <button className="text-[10px] font-black uppercase tracking-widest text-[#1D5F31] hover:text-white transition flex items-center gap-1 mt-6">
                            Detalhes do plano <ChevronRight size={12} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Tabela de Vendas Recentes */}
            <div className="px-4 md:px-8">
                <div className="bg-[#061629] border border-[#1D5F31] rounded-none p-8 space-y-8 shadow-sm overflow-hidden">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                        <h2 className="text-lg font-black uppercase tracking-tighter text-white">Histórico de <span className="text-[#1D5F31]">Vendas</span></h2>
                        <div className="relative w-full md:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
                            <input
                                placeholder="Pesquisar venda..."
                                className="w-full bg-[#061629] border border-[#1D5F31] rounded-none px-10 py-2.5 text-xs text-white focus:border-[#1D5F31] outline-none transition-all font-bold uppercase tracking-widest placeholder:text-slate-600"
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
                                    <th className="pb-6 px-4">Valor Bruto</th>
                                    <th className="pb-6 px-4">Sua Comissão</th>
                                    <th className="pb-6 px-4">Data</th>
                                    <th className="pb-6 px-4 text-right">Status</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm">
                                {salesHistory.length > 0 ? (
                                    salesHistory.map((sale: any) => (
                                        <tr key={sale.id} className="border-b border-white/5 hover:bg-white/5 transition-all group">
                                            <td className="py-6 px-4 font-mono text-xs text-slate-500">{sale.id}</td>
                                            <td className="py-6 px-4">
                                                <div className="font-bold text-white">{sale.student}</div>
                                                <div className="text-[10px] text-slate-400">{sale.studentEmail}</div>
                                            </td>
                                            <td className="py-6 px-4 italic text-slate-400 font-medium">{sale.course}</td>
                                            <td className="py-6 px-4 font-bold text-white">{sale.value}</td>
                                            <td className="py-6 px-4 font-black text-[#1D5F31]">{sale.commission}</td>
                                            <td className="py-6 px-4 text-xs text-slate-400 uppercase font-bold">{sale.date}</td>
                                            <td className="py-6 px-4 text-right">
                                                <span className="px-3 py-1 rounded-none bg-[#1D5F31]/10 text-[#1D5F31] text-[9px] font-black uppercase tracking-widest border border-[#1D5F31]/20">
                                                    {sale.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={7} className="py-20 text-center text-gray-600 italic font-medium uppercase tracking-widest text-xs">
                                            Nenhuma venda registrada ainda.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    )
}

function NoSales() {
    return (
        <div className="pb-16 md:pb-24 bg-transparent min-h-screen text-white font-exo">
            <header className="pt-8 px-4 md:px-8 mb-12">
                <h1 className="text-2xl font-black tracking-tighter text-white uppercase">
                    GESTÃO <span className="text-[#1D5F31]">FINANCEIRA</span>
                </h1>
            </header>
            <div className="px-4 md:px-8">
                <div className="bg-[#061629] border border-[#1D5F31] rounded-none p-20 text-center shadow-sm">
                    <p className="text-slate-500 italic font-medium uppercase tracking-widest text-[10px]">
                        Você ainda não possui vendas registradas.
                    </p>
                    <Link href="/dashboard-teacher/courses" className="inline-block mt-6 text-[10px] font-black uppercase tracking-[3px] text-[#1D5F31] hover:underline">
                        Divulgar meus Cursos
                    </Link>
                </div>
            </div>
        </div>
    )
}
