"use client"

import { CreditCard, ArrowUpRight, Plus, Rocket, Zap, Clock, Loader2, CheckCircle2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { auth, db } from '@/lib/firebase'
import { collection, query, where, getDocs, documentId } from 'firebase/firestore'
import { useAuth } from '@/context/AuthProvider'
import { onAuthStateChanged } from 'firebase/auth'
import { formatDateBR } from '@/lib/date-utils'
import Link from 'next/link'

interface Transaction {
    id: string
    date: string
    courseTitle: string
    value: string
    method: string
    status: string
    icon: any
}

export default function ComprasPage() {
    const { user, loading: authLoading } = useAuth()
    const [transactions, setTransactions] = useState<Transaction[]>([])
    const [loading, setLoading] = useState(true)

    // Simulando estado para formulário de cartão
    const [showNewCardForm, setShowNewCardForm] = useState(false)
    const [isSavingCard, setIsSavingCard] = useState(false)

    useEffect(() => {
        if (authLoading) return

        async function fetchPurchases() {
            if (!user) {
                setLoading(false)
                return
            }

            try {
                // Fetch enrollments for this user
                const enrollmentsRef = collection(db, 'enrollments')
                const q = query(enrollmentsRef, where('user_id', '==', user.uid))
                const enrollmentsSnap = await getDocs(q)

                if (enrollmentsSnap.empty) {
                    setTransactions([])
                    setLoading(false)
                    return
                }

                // Get course IDs
                const courseIds = enrollmentsSnap.docs.map(doc => doc.data().course_id)
                // Deduping just in case
                const uniqueCourseIds = Array.from(new Set(courseIds))

                // Fetch courses info
                // Note: Firestore 'in' has a max of 10 items. For a robust app we'd split array or map locally if we fetch all. 
                // We'll fetch the specific ones in batches of 10 for safety if needed, or simply fetch them one by one/cached.
                // Assuming small number for now (students usually have < 10):

                const courseBatches = []
                for (let i = 0; i < uniqueCourseIds.length; i += 10) {
                    courseBatches.push(uniqueCourseIds.slice(i, i + 10))
                }

                const coursesMap = new Map()

                for (const batch of courseBatches) {
                    const coursesQuery = query(collection(db, 'courses'), where(documentId(), 'in', batch))
                    const coursesSnap = await getDocs(coursesQuery)
                    coursesSnap.forEach(doc => {
                        coursesMap.set(doc.id, doc.data())
                    })
                }

                const purchaseList: Transaction[] = enrollmentsSnap.docs.map(doc => {
                    const data = doc.data()
                    const courseData = coursesMap.get(data.course_id)
                    const dateObj = new Date(data.created_at || Date.now())
                    // Formatação curta
                    const day = String(dateObj.getDate()).padStart(2, '0');
                    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
                    const year = dateObj.getFullYear();
                    const dateFormatted = `${day}/${month}/${year}`

                    // Formatando PREÇO
                    const price = courseData?.price ? `R$ ${Number(courseData.price).toFixed(2).replace('.', ',')}` : 'Gratuito'

                    // Simulando método baseado no index só pra ficar bonitinho visualmente
                    // Já que a coleção enrollment atual não tem payment_method
                    const icons = [CreditCard, Zap, Clock]
                    const randomMethod = ["Cartão Principal", "PIX", "Boleto"][data.course_id.length % 3]

                    return {
                        id: doc.id.substring(0, 8),
                        date: dateFormatted,
                        courseTitle: courseData?.title || 'Curso Desconhecido',
                        value: price,
                        method: randomMethod,
                        status: 'Pago',
                        icon: icons[data.course_id.length % 3]
                    }
                })

                setTransactions(purchaseList)
            } catch (error) {
                console.error("Error fetching purchases:", error)
            } finally {
                setLoading(false)
            }
        }

        fetchPurchases()
    }, [user, authLoading])

    const handleSaveCard = (e: React.FormEvent) => {
        e.preventDefault()
        setIsSavingCard(true)
        setTimeout(() => {
            setIsSavingCard(false)
            setShowNewCardForm(false)
            alert("Cartão adicionado com sucesso! (Simulação)")
        }, 1500)
    }

    if (authLoading || loading) {
        return (
            <div className="p-8 min-h-[60vh] flex items-center justify-center">
                <Loader2 className="animate-spin text-[#1D5F31]" size={48} />
            </div>
        )
    }

    return (
        <div className="p-8 md:p-12 min-h-screen font-exo text-slate-800 animate-in fade-in duration-500 bg-[#F4F7F9]">
            <header className="mb-12">
                <div className="flex items-center gap-3 mb-2">
                    <span className="text-[10px] font-black uppercase tracking-[5px] text-[#1D5F31]">FINANCEIRO</span>
                </div>
                <h1 className="text-4xl font-black tracking-tighter text-slate-900 uppercase">
                    MINHAS <span className="text-[#1D5F31]">COMPRAS</span>
                </h1>
                <p className="text-slate-400 font-bold text-xs tracking-widest uppercase mt-2">Gerencie seus métodos e histórico de transações.</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                {/* Tabela de Transações */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="bg-white rounded-[40px] border border-slate-100 p-8 md:p-10 shadow-sm relative overflow-hidden h-full flex flex-col">
                        <div className="flex items-center justify-between mb-10">
                            <h2 className="text-lg font-black uppercase tracking-tighter text-slate-800">Histórico de Transações</h2>
                            <button className="text-[10px] font-black uppercase tracking-widest text-[#1D5F31] hover:text-slate-900 transition-colors">
                                Exportar PDF
                            </button>
                        </div>

                        {transactions.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="border-b border-slate-50 uppercase text-[9px] font-black text-slate-300 tracking-[2px]">
                                            <th className="pb-6">ID Pedido</th>
                                            <th className="pb-6">Data</th>
                                            <th className="pb-6">Curso</th>
                                            <th className="pb-6">Valor</th>
                                            <th className="pb-6">Método</th>
                                            <th className="pb-6">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {transactions.map((t) => (
                                            <tr key={t.id} className="group hover:bg-slate-50/50 transition-colors">
                                                <td className="py-6 text-xs font-black uppercase tracking-widest text-slate-400">#{t.id}</td>
                                                <td className="py-6 text-xs font-bold text-slate-500 tracking-tight">{t.date}</td>
                                                <td className="py-6 text-sm font-black text-slate-800 tracking-tighter max-w-[150px] truncate pr-4">{t.courseTitle}</td>
                                                <td className="py-6 text-sm font-black text-[#1D5F31] tracking-tighter">{t.value}</td>
                                                <td className="py-6">
                                                    <div className="flex items-center gap-3">
                                                        <t.icon size={14} className="text-slate-400" />
                                                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{t.method}</span>
                                                    </div>
                                                </td>
                                                <td className="py-6">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-[#1D5F31]" />
                                                        <span className="text-[9px] font-black text-[#1D5F31] uppercase tracking-widest">{t.status}</span>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center py-12 text-center">
                                <div className="w-24 h-24 bg-slate-50 flex items-center justify-center mx-auto mb-10 border border-slate-100 rounded-full shadow-inner">
                                    <Rocket size={40} className="text-slate-300" />
                                </div>
                                <h2 className="text-2xl font-black uppercase tracking-tighter text-slate-900 mb-4">Sua biblioteca está em branco</h2>
                                <p className="text-slate-500 max-w-md mx-auto mb-10 text-xs font-bold uppercase tracking-widest leading-relaxed">Cada curso é um degrau em sua evolução. Escolha seu próximo desafio hoje.</p>
                                <Link href="/course" className="inline-block bg-[#1D5F31] text-white px-10 py-5 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-[#1D5F31]/10 hover:opacity-90 transition">
                                    Explorar Treinamentos
                                </Link>
                            </div>
                        )}
                    </div>
                </div>

                {/* Métodos de Pagamento Sidebar */}
                <div className="space-y-8">
                    {/* Cartão Salvo */}
                    <div className="bg-slate-900 rounded-[40px] p-10 text-white shadow-2xl relative overflow-hidden group">
                        <div className="absolute -top-10 -right-10 w-40 h-40 bg-[#1D5F31]/20 blur-[100px] pointer-events-none"></div>

                        <div className="relative z-10">
                            <h3 className="text-sm font-black uppercase tracking-[3px] text-slate-400 mb-8">Cartão Principal</h3>
                            <div className="mb-12">
                                <p className="text-2xl font-black tracking-[4px] mb-2 leading-none">•••• •••• •••• 4242</p>
                                <div className="flex justify-between items-end">
                                    <div>
                                        <p className="text-[8px] font-black uppercase tracking-widest text-slate-400">Expiração</p>
                                        <p className="text-xs font-bold tracking-widest">12/28</p>
                                    </div>
                                    <div className="w-12 h-8 bg-white/10 rounded-lg flex items-center justify-center">
                                        <CreditCard size={20} className="text-[#1D5F31]" />
                                    </div>
                                </div>
                            </div>

                            {!showNewCardForm ? (
                                <button
                                    onClick={() => setShowNewCardForm(true)}
                                    className="w-full h-14 border border-white/10 rounded-2xl flex items-center justify-center gap-3 text-[10px] font-black uppercase tracking-widest hover:bg-white hover:text-slate-900 transition-all shadow-sm"
                                >
                                    <Plus size={16} /> Adicionar Novo Cartão
                                </button>
                            ) : null}
                        </div>
                    </div>

                    {/* Formulário Novo Cartão */}
                    {showNewCardForm && (
                        <div className="bg-white rounded-[32px] border border-slate-100 p-8 shadow-sm animate-in zoom-in-95 duration-300 relative overflow-hidden">
                            <h4 className="text-[12px] font-black uppercase tracking-widest text-slate-800 mb-6">Novo Método de Pagamento</h4>

                            <form onSubmit={handleSaveCard} className="space-y-4">
                                <div>
                                    <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 block mb-2">Número do Cartão</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="0000 0000 0000 0000"
                                        className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:border-[#1D5F31] transition-colors"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 block mb-2">Validade</label>
                                        <input
                                            type="text"
                                            required
                                            placeholder="MM/AA"
                                            className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:border-[#1D5F31] transition-colors"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 block mb-2">CVV</label>
                                        <input
                                            type="text"
                                            required
                                            placeholder="123"
                                            className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:border-[#1D5F31] transition-colors"
                                        />
                                    </div>
                                </div>
                                <div className="pt-4 flex gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setShowNewCardForm(false)}
                                        className="flex-1 py-3 px-4 border border-slate-100 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-50 transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSavingCard}
                                        className="flex-1 py-3 px-4 bg-[#1D5F31] text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm hover:opacity-90 transition-colors flex justify-center items-center gap-2 disabled:opacity-50"
                                    >
                                        {isSavingCard ? <Loader2 size={16} className="animate-spin" /> : <><CheckCircle2 size={16} /> Salvar</>}
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                </div>
            </div>
        </div>
    )
}
