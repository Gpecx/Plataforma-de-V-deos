import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
    Plus,
    Search,
    Filter,
    MoreVertical,
    Edit,
    Eye,
    Users,
    Star,
    BookOpen,
    Trash2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default async function TeacherCoursesPage() {
    const supabase = await createClient()

    // 1. Verifica sessão do usuário
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    // 2. Busca todos os cursos criados por este professor
    const { data: courses } = await supabase
        .from('courses')
        .select('*')
        .eq('instructor_id', user.id)
        .order('created_at', { ascending: false })

    return (
        <div className="p-8 md:p-12 space-y-10">
            {/* Header com Ações */}
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="text-3xl font-black italic uppercase tracking-tighter">
                        Meus <span className="text-[#00FF00]">Cursos</span>
                    </h1>
                    <p className="text-gray-400 mt-1">Gerencie e acompanhe o desempenho de suas aulas.</p>
                </div>
                <Link href="/dashboard-teacher/courses/new">
                    <Button className="bg-[#00FF00] text-black font-black uppercase text-xs tracking-widest px-6 py-6 h-auto hover:brightness-110 shadow-[0_0_20px_rgba(0,255,0,0.3)] group">
                        <Plus size={18} className="mr-2 group-hover:rotate-90 transition-transform" />
                        Lançar Novo Curso
                    </Button>
                </Link>
            </header>

            {/* Filtros e Busca */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-grow">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                    <Input
                        placeholder="Buscar por nome do curso..."
                        className="bg-[#0a1f3a]/50 border-white/10 pl-12 h-12 focus:border-[#00FF00] transition-all"
                    />
                </div>
                <Button variant="outline" className="border-white/10 text-gray-400 font-bold uppercase text-[10px] tracking-widest h-12 px-6">
                    <Filter size={16} className="mr-2" /> Filtrar
                </Button>
            </div>

            {/* Grid de Cursos */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {courses && courses.length > 0 ? (
                    courses.map((curso) => (
                        <div key={curso.id} className="bg-[#0a1f3a]/40 border border-white/5 rounded-3xl overflow-hidden hover:border-[#00FF00]/40 transition-all group flex flex-col">
                            {/* Card Image */}
                            <div className="relative h-48 overflow-hidden">
                                <img
                                    src={curso.image_url || "https://images.unsplash.com/photo-1627398242454-45a1465c2479?w=400"}
                                    alt={curso.title}
                                    className="w-full h-full object-cover opacity-60 group-hover:opacity-100 group-hover:scale-110 transition-all duration-700"
                                />
                                <div className="absolute top-4 left-4">
                                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${curso.status === 'published' ? 'bg-[#00FF00] text-black' : 'bg-yellow-500 text-black'}`}>
                                        {curso.status === 'published' ? 'Publicado' : 'Rascunho'}
                                    </span>
                                </div>
                                <div className="absolute inset-0 bg-gradient-to-t from-[#061629] to-transparent opacity-60"></div>
                            </div>

                            {/* Card Content */}
                            <div className="p-6 flex-grow flex flex-col">
                                <h3 className="text-xl font-bold mb-2 line-clamp-1">{curso.title}</h3>
                                <p className="text-gray-400 text-xs line-clamp-2 mb-6 leading-relaxed">
                                    {curso.description || 'Nenhuma descrição fornecida.'}
                                </p>

                                {/* Métricas Rápidas */}
                                <div className="grid grid-cols-2 gap-4 mb-8">
                                    <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                                        <div className="flex items-center gap-2 text-gray-500 mb-1">
                                            <Users size={12} />
                                            <span className="text-[10px] uppercase font-black tracking-widest">Alunos</span>
                                        </div>
                                        <p className="font-bold">450</p>
                                    </div>
                                    <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                                        <div className="flex items-center gap-2 text-gray-500 mb-1">
                                            <Star size={12} className="text-yellow-500 fill-yellow-500" />
                                            <span className="text-[10px] uppercase font-black tracking-widest">Nota</span>
                                        </div>
                                        <p className="font-bold">4.8</p>
                                    </div>
                                </div>

                                {/* Ações do Card */}
                                <div className="mt-auto flex gap-3">
                                    <Link href={`/dashboard-teacher/courses/${curso.id}/edit`} className="flex-grow">
                                        <Button className="w-full bg-white/5 hover:bg-[#00FF00] hover:text-black font-black uppercase text-[10px] tracking-widest transition-all">
                                            <Edit size={14} className="mr-2" /> Editar
                                        </Button>
                                    </Link>
                                    <Button variant="outline" className="border-white/5 hover:border-red-500/50 hover:bg-red-500/10 hover:text-red-500 transition-all p-3">
                                        <Trash2 size={16} />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="col-span-full py-24 border-2 border-dashed border-white/5 rounded-3xl flex flex-col items-center justify-center text-center bg-white/5">
                        <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-6">
                            <BookOpen size={24} className="text-gray-500" />
                        </div>
                        <h3 className="text-xl font-bold mb-2">Sua vitrine está vazia</h3>
                        <p className="text-gray-500 max-w-sm mb-8 text-sm">Comece a criar seu primeiro curso agora e compartilhe seu conhecimento com o mundo.</p>
                        <Link href="/dashboard-teacher/courses/new">
                            <Button className="bg-[#00FF00] text-black font-black uppercase text-xs tracking-widest px-8">
                                Criar Meu Primeiro Curso
                            </Button>
                        </Link>
                    </div>
                )}
            </div>
        </div>
    )
}
