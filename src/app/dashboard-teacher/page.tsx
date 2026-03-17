import { adminAuth, adminDb } from '@/lib/firebase-admin'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Plus, Users, Star, DollarSign, TrendingUp, Edit, MessageSquare } from 'lucide-react'
import { SalesChart } from './components/SalesChart'
import { parseFirebaseDate } from '@/lib/date-utils'

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function TeacherDashboard() {
    const cookieStore = cookies()
    const token = (await cookieStore).get('firebase-token')?.value

    if (!token) redirect('/login')

    let user;
    try {
        user = await adminAuth.verifyIdToken(token)
    } catch (error) {
        redirect('/login')
    }

    const [profileDoc, coursesSnapshot] = await Promise.all([
        adminDb.collection('profiles').doc(user.uid).get(),
        adminDb.collection('courses').where('teacher_id', '==', user.uid).get()
    ])

    const profile = profileDoc.data()
    const courses = coursesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    })) as any[]

    const courseIds = courses.map(c => c.id)
    const coursesPriceMap = new Map(courses.map(c => [c.id, Number(c.price) || 0]))

    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000))
    const todayStart = new Date(now.setHours(0, 0, 0, 0))

    let enrollments: any[] = []
    if (courseIds.length > 0) {
        const enrollmentsSnapshot = await adminDb.collection('enrollments')
            .where('course_id', 'in', courseIds)
            .get()
        enrollments = enrollmentsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            created_at: parseFirebaseDate(doc.data().created_at) || new Date()
        }))
    }

    const weeklySales = enrollments.filter(e => e.created_at >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))
    const courseStudentCountMap = enrollments.reduce((acc, e) => {
        acc[e.course_id] = (acc[e.course_id] || 0) + 1
        return acc
    }, {} as Record<string, number>)

    const totalStudents = new Set(enrollments.map(e => e.user_id)).size
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

    const metrics = [
        { label: 'Receita Mensal', value: `R$ ${monthlyRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, icon: DollarSign, color: 'text-[#1D5F31]' },
        { label: 'Total Alunos', value: totalStudents.toString(), icon: Users, color: 'text-blue-500' },
        { label: 'Avaliação Média', value: '4.8', icon: Star, color: 'text-yellow-500' },
        { label: 'Vendas Hoje', value: `R$ ${todaySales.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, icon: TrendingUp, color: 'text-purple-500' },
    ]



    return (
        <div className="min-h-screen bg-transparent text-white font-exo pb-24 pt-12 relative">
            <header className="flex justify-between items-center px-8 mb-12">
                <div>
                    <h1 className="text-4xl font-black tracking-tighter uppercase leading-none">
                        Bem-vindo, <span className="text-[#1D5F31]">{profile?.full_name || 'Professor'}!</span>
                    </h1>
                    <p className="text-slate-400 mt-2 font-bold uppercase text-[10px] tracking-[3px]">Gerencie seus cursos no Creator Studio.</p>
                </div>
                <Link href="/dashboard-teacher/courses/new">
                    <button className="flex items-center gap-3 bg-[#1D5F31] text-white font-black uppercase tracking-widest px-10 py-5 hover:bg-[#28b828] transition shadow-lg shadow-[#1D5F31]/20 shrink-0">
                        <Plus size={20} strokeWidth={3} /> Criar Novo Curso
                    </button>
                </Link>
            </header>

            <div className="px-8 space-y-16">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    {metrics.map((metric, idx) => (
                        <div key={idx} className="bg-[#061629]/40 backdrop-blur-md p-8 border border-[#1D5F31]/30 hover:border-[#1D5F31] transition-all shadow-lg">
                            <div className={`p-4 w-fit bg-[#061629]/60 border border-[#1D5F31]/40 mb-6 ${metric.color}`}>
                                <metric.icon size={22} />
                            </div>
                            <p className="text-slate-500 text-[10px] font-black uppercase tracking-[2px]">{metric.label}</p>
                            <h3 className="text-3xl font-black mt-1 tracking-tighter">{metric.value}</h3>
                        </div>
                    ))}
                </div>

                <section className="bg-[#061629]/40 backdrop-blur-md p-10 border border-[#1D5F31]/30 shadow-lg">
                    <div className="flex items-center gap-4 mb-12">
                        <TrendingUp size={24} className="text-[#1D5F31]" />
                        <h2 className="text-2xl font-black uppercase tracking-tighter">Desempenho de Vendas <span className="text-slate-500 font-bold text-sm tracking-widest ml-4">(7 DIAS)</span></h2>
                    </div>
                    <SalesChart data={chartData} />
                </section>

                <section className="space-y-10">
                    <div className="border-b-2 border-[#1D5F31] pb-6 flex justify-between items-center">
                        <h2 className="text-2xl font-black uppercase tracking-tighter">Meus Cursos</h2>
                        <Link href="/dashboard-teacher/courses" className="text-[10px] text-slate-500 hover:text-white font-black uppercase tracking-[3px]">Ver todos</Link>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6">
                        {courses.length > 0 ? courses.map((curso) => (
                            <div key={curso.id} className="bg-[#061629]/40 backdrop-blur-md border border-[#1D5F31]/30 flex flex-col hover:border-[#1D5F31] transition-all shadow-lg overflow-hidden">
                                <div className="h-32 bg-[#061629]/20 border-b border-[#1D5F31]/30">
                                    <img src={curso.image_url} className="w-full h-full object-cover" alt={curso.title} />
                                </div>
                                <div className="p-3 flex-grow">
                                    <h3 className="font-black text-base mb-4 tracking-tighter line-clamp-1">{curso.title}</h3>
                                    <Link href={`/dashboard-teacher/courses/${curso.id}/edit`}>
                                        <button className="w-full bg-[#061629]/60 border border-[#1D5F31]/30 text-white font-black uppercase tracking-widest py-2 hover:bg-[#1D5F31] hover:border-[#1D5F31] transition-all text-[10px]">Editar no Studio</button>
                                    </Link>
                                </div>
                            </div>
                        )) : <div className="col-span-full py-24 border-2 border-dashed border-[#1D5F31] text-center bg-[#061629] font-black uppercase tracking-[4px]">Crie seu primeiro curso!</div>}
                    </div>
                </section>
            </div>
        </div>
    );
}