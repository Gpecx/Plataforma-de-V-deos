import { adminAuth, adminDb } from '@/lib/firebase-admin'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { Plus, DollarSign, TrendingUp, Edit } from 'lucide-react'
import { SalesChart } from './components/SalesChart'
import { parseFirebaseDate } from '@/lib/date-utils'
import { InstructorStats } from './components/InstructorStats'

interface CourseData {
    id: string
    title: string
    price?: number
    image_url?: string
    category?: string
    tag?: string
    teacher_id: string
    custom_fee_platform?: number | null
}

interface EnrollmentData {
    id: string
    course_id: string
    user_id: string
    created_at: Date
}

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function TeacherDashboard() {
    const cookieStore = cookies()
    const token = (await cookieStore).get('session')?.value

    if (!token) redirect('/login')

    let user;
    try {
        user = await adminAuth.verifySessionCookie(token, true)
    } catch {
        redirect('/login')
    }

    const [profileDoc, coursesSnapshot, settingsDoc] = await Promise.all([
        adminDb.collection('profiles').doc(user.uid).get(),
        adminDb.collection('courses').where('teacher_id', '==', user.uid).get(),
        adminDb.collection('config').doc('platform_settings').get()
    ])

    const profile = profileDoc.data()
    const platformTax = settingsDoc.exists ? (settingsDoc.data()?.platform_tax ?? 20) : 20
    const courses = coursesSnapshot.docs.map(doc => {
        const data = doc.data()
        const effectiveFee = data.custom_fee_platform ?? platformTax
        return {
            id: doc.id,
            title: data.title || '',
            price: data.price,
            image_url: data.image_url,
            category: data.category,
            tag: data.tag,
            teacher_id: data.teacher_id || '',
            teacherSharePercent: 100 - effectiveFee,
            custom_fee_platform: data.custom_fee_platform ?? null,
        }
    }) as (CourseData & { teacherSharePercent: number })[]

    const courseIds = courses.map(c => c.id)
    const coursesPriceMap = new Map(courses.map(c => [c.id, Number(c.price) || 0]))

    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000))
    const sevenDaysAgo = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000))
    const todayStart = new Date(new Date(now).setHours(0, 0, 0, 0))

    let enrollments: EnrollmentData[] = []
    if (courseIds.length > 0) {
        const enrollmentsSnapshot = await adminDb.collection('enrollments')
            .where('course_id', 'in', courseIds)
            .where('payment_confirmed', '==', true)
            .get()
        enrollments = enrollmentsSnapshot.docs.map(doc => ({
            id: doc.id,
            course_id: doc.data().course_id || '',
            user_id: doc.data().user_id || '',
            created_at: parseFirebaseDate(doc.data().created_at) || new Date()
        }))
    }

    const weeklySales = enrollments.filter(e => e.created_at >= sevenDaysAgo)
    const monthlyRevenue = enrollments.filter(e => e.created_at >= thirtyDaysAgo).reduce((acc, e) => acc + (coursesPriceMap.get(e.course_id) || 0), 0)
    const todaySales = enrollments.filter(e => e.created_at >= todayStart).reduce((acc, e) => acc + (coursesPriceMap.get(e.course_id) || 0), 0)

    const last7Days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date()
        d.setDate(d.getDate() - i)
        return d.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '')
    }).reverse()

    const chartData = last7Days.map(day => {
        const salesForDay = weeklySales.filter(s => new Date(s.created_at).toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '') === day)
        return { name: day.charAt(0).toUpperCase() + day.slice(1), vendas: salesForDay.reduce((acc, s) => acc + (coursesPriceMap.get(s.course_id) || 0), 0) }
    })

    const financialMetrics = [
        { label: 'Receita Mensal', value: `R$ ${monthlyRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, icon: DollarSign },
        { label: 'Vendas Hoje', value: `R$ ${todaySales.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, icon: TrendingUp },
    ]



    return (
        <div className="bg-transparent font-montserrat pb-24 pt-12 relative animate-in fade-in duration-500">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center px-8 mb-12 gap-6">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold tracking-tighter text-slate-900 uppercase leading-none max-w-xl">
                        Bem-vindo, <span className="text-[#1D5F31]">{profile?.full_name?.split(' ')[0] || 'Professor'}!</span>
                    </h1>
                    <p className="text-slate-900 mt-3 font-bold uppercase text-[10px] tracking-[3px]">Gerencie seu império de conhecimento hoje.</p>
                </div>
                <Link href="/dashboard-teacher/courses/new">
                    <button className="flex items-center gap-3 bg-[#1D5F31] text-white font-bold uppercase tracking-widest px-10 py-5 rounded-lg hover:opacity-90 hover:scale-105 transition-all duration-300 shadow-xl shadow-[#1D5F31]/20 shrink-0 active:scale-95">
                        <Plus size={20} strokeWidth={3} /> Criar Novo Curso
                    </button>
                </Link>
            </header>

            <div className="px-8 space-y-16">
                {/* Estatísticas e Métricas */}
                <div className="space-y-8">
                    {/* Linha 1: Financeiro (Estático/SSG) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {financialMetrics.map((metric, idx) => (
                            <div
                                key={idx}
                                className="p-8 rounded-lg border border-black/20 bg-white shadow-sm transition-all duration-300 group hover:-translate-y-1 hover:border-black hover:shadow-xl"
                            >
                                <div className="p-4 w-14 h-14 rounded-lg bg-emerald-50 border border-emerald-200 text-[#1D5F31] mb-6 flex items-center justify-center transition-all duration-300 group-hover:bg-[#1D5F31] group-hover:text-white group-hover:border-[#1D5F31]">
                                    <metric.icon size={24} />
                                </div>
                                <p className="text-slate-500 text-[10px] font-bold uppercase tracking-[3px] mb-1">{metric.label}</p>
                                <h3 className="text-3xl font-extrabold tracking-tighter text-slate-900">{metric.value}</h3>
                            </div>
                        ))}
                    </div>

                    {/* Linha 2: Estatísticas Reais de Cursos & Reviews (Carregamento Assíncrono com Skeletons) */}
                    <InstructorStats />
                </div>

                {/* Gráfico de Desempenho */}
                <section className="bg-white p-10 rounded-lg border border-black/20 shadow-xl overflow-hidden relative">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-slate-50 rounded-md border border-slate-100">
                                <TrendingUp size={24} className="text-[#1D5F31]" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold uppercase tracking-tighter text-slate-900">Desempenho de Vendas</h2>
                                <p className="text-slate-900 text-[9px] font-bold tracking-[3px] uppercase">Análise dos últimos 7 dias de operação</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 border-2 border-[#1D5F31]/30 bg-white px-6 py-3 rounded-md">
                            <span className="relative flex h-2.5 w-2.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#1D5F31] opacity-75" />
                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#1D5F31]" />
                            </span>
                            <span className="text-[10px] font-bold uppercase tracking-widest text-[#1D5F31]">Live Analytics</span>
                        </div>
                    </div>
                    <div className="h-[300px] w-full">
                        <SalesChart data={chartData} />
                    </div>
                </section>

                {/* Lista de Cursos Recentes */}
                <section className="space-y-10">
                    <div className="flex justify-between items-end border-b border-black/20 pb-6">
                        <div>
                            <h2 className="text-2xl font-bold uppercase tracking-tighter text-slate-900 flex items-center gap-3">
                                <Edit size={24} className="text-[#1D5F31]" />
                                Meus Cursos
                            </h2>
                            <p className="text-slate-900 text-[9px] font-bold tracking-[3px] uppercase mt-1">Edite e publique seus treinamentos</p>
                        </div>
                        <Link href="/dashboard-teacher/courses" className="text-[11px] text-slate-900 hover:text-[#1D5F31] font-bold uppercase tracking-[3px] bg-white px-6 py-3 rounded-md border border-black/30 shadow-sm transition-all hover:shadow-md">
                            Ver todos os cursos
                        </Link>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-8">
                        {courses.length > 0 ? courses.map((curso) => (
                            <div key={curso.id} className="group bg-white rounded-lg border border-black/20 flex flex-col hover:border-black transition-all duration-500 shadow-sm hover:shadow-xl overflow-hidden">
                                <div className="h-44 bg-slate-100 overflow-hidden relative">
                                    <Image src={curso.image_url || "https://images.unsplash.com/photo-1627398242454-45a1465c2479?w=400"} fill sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 25vw" className="object-cover group-hover:scale-110 transition-transform duration-700" alt={curso.title} />
                                    <div className="absolute top-4 left-4 bg-emerald-100 px-2.5 py-1 rounded-none border border-emerald-300 shadow-sm">
                                        <span className="text-[10px] font-bold text-emerald-800 tracking-wider">Repasse: {curso.teacherSharePercent}%</span>
                                    </div>
                                    <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/20 shadow-sm">
                                        <span className="text-[8px] font-bold text-slate-900 tracking-widest uppercase">Ativo</span>
                                    </div>
                                </div>
                                <div className="p-6 flex-grow flex flex-col">
                                    <h3 className="font-bold text-lg mb-6 tracking-tight text-slate-900 line-clamp-2 uppercase leading-tight group-hover:text-[#1D5F31] transition-colors">{curso.title}</h3>
                                    <div className="mt-auto flex items-center gap-3">
                                        <Link href={`/dashboard-teacher/courses/${curso.id}/edit`} className="flex-1">
                                            <button className="w-full bg-slate-900 text-white font-bold uppercase text-[10px] tracking-widest py-4 rounded-md hover:bg-[#1D5F31] transition-all shadow-md active:scale-95">Editar</button>
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        )) : (
                            <div className="col-span-full py-24 border-2 border-dashed border-black/20 rounded-lg text-center bg-white shadow-sm">
                                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <Plus size={32} className="text-slate-300" />
                                </div>
                                <h3 className="text-xl font-bold uppercase tracking-tighter text-slate-900 mb-2">Seu catálogo está vazio</h3>
                                <p className="text-slate-900 text-xs font-bold uppercase tracking-[3px]">Comece a criar seu primeiro curso agora mesmo.</p>
                                <Link href="/dashboard-teacher/courses/new" className="inline-block mt-8 bg-[#1D5F31] text-white px-10 py-5 rounded-lg font-bold uppercase tracking-widest text-xs shadow-xl shadow-[#1D5F31]/10 hover:opacity-90 transition">
                                    Criar Curso
                                </Link>
                            </div>
                        )}
                    </div>
                </section>
            </div>
        </div>
    );
}