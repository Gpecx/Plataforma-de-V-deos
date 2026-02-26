import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Plus, Users, Star, DollarSign, TrendingUp, Edit, MoreVertical, MessageSquare } from 'lucide-react'
import { SalesChart } from './components/SalesChart'

export default async function TeacherDashboard() {
    const supabase = await createClient()

    // 1. Verifica sessão do usuário
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    // 2. Busca perfil e cursos criados pelo professor
    const [profileRes, coursesRes] = await Promise.all([
        supabase.from('profiles').select('full_name').eq('id', user.id).single(),
        supabase.from('courses').select('*').eq('instructor_id', user.id)
    ])

    const profile = profileRes.data
    const courses = coursesRes.data || []

    const metrics = [
        { label: 'Receita Mensal', value: 'R$ 12.450,00', icon: DollarSign, color: 'text-[#00C402]' },
        { label: 'Total Alunos', value: '1.240', icon: Users, color: 'text-blue-500' },
        { label: 'Avaliação Média', value: '4.8', icon: Star, color: 'text-yellow-500' },
        { label: 'Vendas Hoje', value: 'R$ 840,00', icon: TrendingUp, color: 'text-purple-500' },
    ]

    const recentActivities = [
        { id: 1, user: 'Ana Silva', comment: 'Tenho uma dúvida sobre a aula 4...', date: 'há 2 horas' },
        { id: 2, user: 'João Pereira', comment: 'O material de apoio está excelente!', date: 'há 5 horas' },
        { id: 3, user: 'Maria Santos', comment: 'Não consegui baixar o certificado.', date: 'há 1 dia' },
    ]

    return (
        <div className="p-8 md:p-12 min-h-screen bg-[#061629] text-white">
            {/* Header com Boas-vindas e Botão Criar */}
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
                <div>
                    <h1 className="text-4xl font-black italic tracking-tighter uppercase">
                        Bem-vindo, <span className="text-[#00C402]">{profile?.full_name || 'Professor'}!</span>
                    </h1>
                    <p className="text-gray-400 mt-2 font-medium">Gerencie seus cursos e acompanhe seus resultados com o Creator Studio.</p>
                </div>
                <Link href="/dashboard-teacher/courses/new">
                    <button className="flex items-center gap-3 bg-[#00C402] text-black font-black uppercase italic tracking-widest px-8 py-4 rounded-2xl hover:brightness-110 transition shadow-[0_0_30px_rgba(0,196,2,0.3)] shrink-0">
                        <Plus size={22} strokeWidth={3} />
                        Criar Novo Curso
                    </button>
                </Link>
            </header>

            {/* Grid de Métricas */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                {metrics.map((metric, idx) => (
                    <div key={idx} className="bg-white/5 p-6 rounded-3xl border border-white/10 hover:border-[#00C402]/30 transition-all shadow-xl backdrop-blur-md">
                        <div className="flex justify-between items-start mb-4">
                            <div className={`p-3 rounded-2xl bg-white/5 ${metric.color}`}>
                                <metric.icon size={24} />
                            </div>
                        </div>
                        <p className="text-gray-400 text-xs font-black uppercase tracking-widest">{metric.label}</p>
                        <h3 className="text-3xl font-black mt-1 italic tracking-tighter">{metric.value}</h3>
                    </div>
                ))}
            </div>

            {/* Gráfico de Desempenho */}
            <section className="bg-white/5 p-8 rounded-[40px] border border-white/10 mb-16 shadow-2xl relative overflow-hidden group backdrop-blur-xl">
                <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                    <TrendingUp size={160} className="text-[#00C402]" />
                </div>
                <div className="relative z-10">
                    <h2 className="text-2xl font-black uppercase italic tracking-tighter mb-10 flex items-center gap-3">
                        <TrendingUp size={28} className="text-[#00C402]" />
                        Desempenho de Vendas <span className="text-[#00C402]/40">(Últimos 7 dias)</span>
                    </h2>
                    <SalesChart />
                </div>
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                {/* Seção: Meus Cursos (2 colunas) */}
                <section className="lg:col-span-2">
                    <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/5">
                        <h2 className="text-2xl font-black uppercase italic tracking-tighter">Meus Cursos</h2>
                        <Link href="/dashboard-teacher/courses" className="text-xs text-[#00C402] hover:underline font-black uppercase tracking-[3px]">Ver todos</Link>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {courses.length > 0 ? (
                            courses.map((curso) => (
                                <div key={curso.id} className="bg-white/5 rounded-[32px] overflow-hidden border border-white/10 hover:border-[#00C402]/40 transition-all group shadow-xl">
                                    <div className="relative h-56 bg-[#0a1f3a]">
                                        <img
                                            src={curso.image_url || "https://images.unsplash.com/photo-1627398242454-45a1465c2479?w=400"}
                                            className="w-full h-full object-cover opacity-40 group-hover:opacity-100 transition-opacity duration-700"
                                            alt={curso.title}
                                        />
                                        <div className="absolute top-6 left-6">
                                            <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[2px] shadow-lg ${curso.status === 'published' ? 'bg-[#00C402] text-black' : 'bg-yellow-500 text-black'}`}>
                                                {curso.status === 'published' ? 'Publicado' : 'Rascunho'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="p-8">
                                        <h3 className="font-black text-2xl mb-4 italic tracking-tighter line-clamp-1">{curso.title}</h3>
                                        <div className="flex items-center gap-6 text-sm text-gray-400 mb-8 font-bold">
                                            <div className="flex items-center gap-2">
                                                <Users size={16} className="text-[#00C402]" />
                                                <span>450 Alunos</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Star size={16} className="text-yellow-500 fill-yellow-500" />
                                                <span>4.8</span>
                                            </div>
                                        </div>
                                        <Link href={`/dashboard-teacher/courses/${curso.id}/edit`}>
                                            <button className="w-full flex items-center justify-center gap-3 bg-white/5 hover:bg-[#00C402] hover:text-black border border-white/10 text-white font-black uppercase italic tracking-widest py-4 rounded-2xl transition-all duration-300">
                                                <Edit size={18} />
                                                Editar no Studio
                                            </button>
                                        </Link>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="col-span-full py-24 border-2 border-dashed border-white/10 rounded-[40px] text-center bg-white/[0.02]">
                                <p className="text-gray-500 italic font-medium">O Studio está pronto. Comece criando seu primeiro treinamento!</p>
                            </div>
                        )}
                    </div>
                </section>

                {/* Seção: Dúvidas Recentes (1 coluna) */}
                <section>
                    <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/5">
                        <h2 className="text-2xl font-black uppercase italic tracking-tighter">Inbox de Dúvidas</h2>
                        <Link href="/dashboard-teacher/comments" className="text-xs text-gray-500 hover:text-white font-black uppercase tracking-[2px]">Acessar Inbox</Link>
                    </div>

                    <div className="space-y-6">
                        {recentActivities.map((activity) => (
                            <div key={activity.id} className="bg-white/5 p-6 rounded-3xl border border-white/10 hover:border-white/20 transition-all flex gap-4 backdrop-blur-md">
                                <div className="h-12 w-12 rounded-2xl bg-[#00C402]/10 flex items-center justify-center shrink-0 border border-[#00C402]/20">
                                    <MessageSquare size={20} className="text-[#00C402]" />
                                </div>
                                <div className="flex-grow min-w-0">
                                    <div className="flex justify-between items-start mb-2">
                                        <h4 className="font-black text-sm uppercase tracking-tight truncate mr-2">{activity.user}</h4>
                                        <span className="text-[10px] font-bold text-gray-500 uppercase shrink-0">{activity.date}</span>
                                    </div>
                                    <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed italic font-medium">
                                        "{activity.comment}"
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            </div>
        </div>
    );
}
