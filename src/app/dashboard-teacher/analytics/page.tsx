"use client"

import { auth, db } from '@/lib/firebase'
import { onAuthStateChanged } from 'firebase/auth'
import { collection, query, where, getDocs, doc, getDoc, orderBy } from 'firebase/firestore'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { parseFirebaseDate, formatShortDateBR } from '@/lib/date-utils'
import {
    DollarSign,
    TrendingUp,
    Calendar,
    ArrowUpRight,
    Download,
    Wallet,
    Info,
    ChevronRight,
    Search,
    Loader2
} from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function FinancialDashboardPage() {
    const router = useRouter()
    const [user, setUser] = useState<any>(null)
    const [salesHistory, setSalesHistory] = useState<any[]>([])
    const [totalRevenue, setTotalRevenue] = useState(0)
    const [pendingBalance, setPendingBalance] = useState(0)
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (!currentUser) {
                router.push('/login')
                return
            }
            setUser(currentUser)

            try {
                // 1. Fetch Teacher Courses
                const coursesSnap = await getDocs(query(collection(db, 'courses'), where('teacher_id', '==', currentUser.uid)))
                const teacherCourses = coursesSnap.docs.reduce((acc, doc) => {
                    acc[doc.id] = { id: doc.id, ...doc.data() }
                    return acc
                }, {} as any)
                const courseIds = Object.keys(teacherCourses)

                if (courseIds.length > 0) {
                    // 2. Fetch Enrollments
                    const enrollmentsSnap = await getDocs(query(collection(db, 'enrollments'), orderBy('created_at', 'desc')))
                    const teacherEnrollments = enrollmentsSnap.docs
                        .map(doc => ({ id: doc.id, ...doc.data() as any }))
                        .filter(e => courseIds.includes(e.course_id))

                    // 3. Fetch unique profiles
                    const uniqueUserIds = Array.from(new Set(teacherEnrollments.map(e => e.user_id)))
                    const profilesMap = new Map<string, any>()
                    await Promise.all(uniqueUserIds.map(async (uid) => {
                        const profileSnap = await getDoc(doc(db, 'profiles', uid))
                        if (profileSnap.exists()) {
                            profilesMap.set(uid, profileSnap.data())
                        }
                    }))

                    // 4. Process Data
                    let revAccumulator = 0
                    let pendingAccumulator = 0
                    const now = new Date()
                    const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000))

                    const processedSales = teacherEnrollments.map((e: any) => {
                        const student = profilesMap.get(e.user_id)
                        const course = teacherCourses[e.course_id]
                        const value = course?.price || 0
                        const commission = value * 0.70

                        const saleDate = parseFirebaseDate(e.created_at) || new Date(0)
                        if (saleDate >= thirtyDaysAgo) {
                            pendingAccumulator += commission
                        }

                        return {
                            id: `#${e.id.toString().slice(-4)}`,
                            student: student?.full_name || 'Aluno Excluido',
                            studentEmail: student?.email,
                            course: course?.title || 'Curso Excluido',
                            value: `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
                            commission: `R$ ${commission.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
                            date: formatShortDateBR(e.created_at),
                            status: 'Sucedido'
                        }
                    })

                    setSalesHistory(processedSales)
                    setTotalRevenue(revAccumulator)
                    setPendingBalance(pendingAccumulator)
                }
            } catch (error) {
                console.error("Error loading financial data:", error)
            } finally {
                setLoading(false)
            }
        })
        return () => unsubscribe()
    }, [router])

    const filteredSales = salesHistory.filter(sale =>
        sale.student.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sale.course.toLowerCase().includes(searchTerm.toLowerCase())
    )

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-[#F4F7F9]">
                <Loader2 className="animate-spin text-[#00C402]" size={48} />
            </div>
        )
    }

    if (!user) return null

    return (
        <div className="p-8 md:p-12 space-y-12 bg-[#F4F7F9] min-h-screen text-slate-700 border-t border-slate-100 font-exo">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="text-2xl font-black tracking-tighter text-slate-700">
                        GESTÃO <span className="text-[#00C402]">FINANCEIRA</span>
                    </h1>
                    <p className="text-slate-500 mt-1 text-sm font-medium">Acompanhe suas vendas, comissões e solicite saques com facilidade.</p>
                </div>

                <div className="flex gap-4">
                    <Button variant="outline" className="border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-widest px-6 hover:bg-slate-50 transition-colors bg-white">
                        <Download size={14} className="mr-2" /> Relatório CSV
                    </Button>
                    <Button className="bg-[#00C402] text-white font-black uppercase text-xs tracking-widest px-8 shadow-sm hover:brightness-105 transition-all">
                        Solicitar Saque
                    </Button>
                </div>
            </header>

            <div className="relative">
                <div className="absolute inset-x-0 -top-8 -bottom-8 opacity-[0.08] grayscale pointer-events-none overflow-hidden rounded-[40px]">
                    <img
                        src="https://images.unsplash.com/photo-1552664730-d307ca884978?w=1200"
                        alt="Inspire Teacher"
                        className="w-full h-full object-cover backdrop-blur-[2px]"
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
                    <div className="bg-white/80 backdrop-blur-md border border-slate-100 p-8 rounded-3xl relative overflow-hidden group transition-all hover:border-[#00C402]/20 shadow-sm">
                        <div className="absolute top-0 right-0 p-6 opacity-5 text-[#00C402] group-hover:scale-110 transition-transform">
                            <Wallet size={80} />
                        </div>
                        <div className="relative z-10">
                            <div className="flex items-center gap-2 text-slate-400 mb-4">
                                <DollarSign size={14} />
                                <span className="text-[10px] font-black uppercase tracking-widest">Saldo Disponível</span>
                            </div>
                            <h3 className="text-4xl font-black mb-2 text-slate-700">R$ {totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
                            <p className="text-[#00C402] text-[10px] font-black uppercase tracking-widest flex items-center gap-1">
                                <TrendingUp size={12} /> Saldo acumulado
                            </p>
                        </div>
                    </div>

                    <div className="bg-white/80 backdrop-blur-md border border-slate-100 p-8 rounded-3xl relative overflow-hidden group shadow-sm transition-all hover:border-slate-200">
                        <div className="relative z-10">
                            <div className="flex items-center gap-2 text-slate-400 mb-4">
                                <Calendar size={14} />
                                <span className="text-[10px] font-black uppercase tracking-widest">A Receber (Próx. 30 dias)</span>
                            </div>
                            <h3 className="text-4xl font-black mb-2 text-slate-700">R$ {pendingBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
                            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Processamento automático</p>
                        </div>
                    </div>

                    <div className="bg-white/80 backdrop-blur-md border border-slate-100 p-8 rounded-3xl flex flex-col justify-between group shadow-sm">
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 text-slate-400">
                                <Info size={14} />
                                <span className="text-[10px] font-black uppercase tracking-widest">Contrato Ativo</span>
                            </div>
                            <div className="flex items-end gap-3">
                                <h3 className="text-5xl font-black text-[#00C402]">70%</h3>
                                <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-2">Comissão SPCS Academy</p>
                            </div>
                        </div>
                        <button className="text-[10px] font-black uppercase tracking-widest text-[#00C402] hover:text-slate-700 transition flex items-center gap-1 mt-6">
                            Detalhes do plano <ChevronRight size={12} />
                        </button>
                    </div>
                </div>
            </div>

            <div className="bg-white border border-slate-100 rounded-3xl p-8 space-y-8 shadow-sm overflow-hidden">
                <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                    <h2 className="text-lg font-black uppercase tracking-tighter text-slate-700">Histórico de <span className="text-[#00C402]">Vendas</span></h2>
                    <div className="relative w-full md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                        <input
                            placeholder="Pesquisar venda..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-100 rounded-xl px-10 py-2.5 text-xs text-slate-700 focus:border-[#00C402] outline-none transition-all font-bold uppercase tracking-widest placeholder:text-slate-300"
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
                            {filteredSales.length > 0 ? (
                                filteredSales.map((sale: any) => (
                                    <tr key={sale.id} className="border-b border-white/5 hover:bg-white/5 transition-all group">
                                        <td className="py-6 px-4 font-mono text-xs text-slate-400">{sale.id}</td>
                                        <td className="py-6 px-4">
                                            <div className="font-bold text-slate-700">{sale.student}</div>
                                            <div className="text-[10px] text-slate-400">{sale.studentEmail}</div>
                                        </td>
                                        <td className="py-6 px-4 italic text-slate-500 font-medium">{sale.course}</td>
                                        <td className="py-6 px-4 font-bold text-slate-700">{sale.value}</td>
                                        <td className="py-6 px-4 font-black text-[#00C402]">{sale.commission}</td>
                                        <td className="py-6 px-4 text-xs text-slate-400 uppercase font-bold">{sale.date}</td>
                                        <td className="py-6 px-4 text-right">
                                            <span className="px-3 py-1 rounded-lg bg-[#00C402]/10 text-[#00C402] text-[9px] font-black uppercase tracking-widest">
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
    )
}
