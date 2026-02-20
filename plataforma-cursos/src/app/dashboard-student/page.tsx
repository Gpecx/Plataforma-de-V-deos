import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { PlayCircle, CreditCard, BookOpen } from 'lucide-react'
import Link from 'next/link'
import { AddToCartButton } from '@/components/AddToCartButton'

export default async function StudentDashboard() {
    const supabase = await createClient()

    // 1. Verifica sessão do usuário
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    // 2. Busca perfil, cursos totais e matrículas em paralelo
    const [profileRes, allCoursesRes, enrollmentsRes] = await Promise.all([
        supabase.from('profiles').select('full_name').eq('id', user.id).single(),
        supabase.from('courses').select('*'),
        supabase.from('enrollments').select('course_id').eq('user_id', user.id)
    ])

    const profile = profileRes.data
    const allCourses = allCoursesRes.data || []
    const enrolledIds = enrollmentsRes.data?.map(e => e.course_id) || []

    const meusCursos = allCourses.filter(c => enrolledIds.includes(c.id))
    const cursosDisponiveis = allCourses.filter(c => !enrolledIds.includes(c.id))

    return (
        <div className="p-8 md:p-12 min-h-screen bg-[#061629] text-white">
            {/* Header de Boas-vindas */}
            <header className="mb-16">
                <div className="flex items-center gap-3 mb-2">
                    <span className="text-[10px] font-black uppercase tracking-[5px] text-[#00C402] italic">Welcome Aluno</span>
                </div>
                <h1 className="text-5xl font-black italic tracking-tighter uppercase">
                    Bem-vindo, <span className="text-[#00C402]">{profile?.full_name || 'Guerreiro'}!</span>
                </h1>
                <p className="text-gray-400 mt-2 font-medium uppercase text-xs tracking-widest">A excelência é o único destino aceitável.</p>
            </header>

            {/* Seção: Meus Cursos */}
            <section className="mb-20">
                <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/5">
                    <h2 className="text-3xl font-black uppercase italic tracking-tighter flex items-center gap-3">
                        <BookOpen size={28} className="text-[#00C402]" />
                        Meus Cursos
                    </h2>
                    <span className="text-[10px] font-black uppercase tracking-[3px] text-gray-500">{meusCursos.length} MATRÍCULAS ATIVAS</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {meusCursos.length > 0 ? (
                        meusCursos.map((curso) => (
                            <div key={curso.id} className="bg-white/5 backdrop-blur-md rounded-[32px] overflow-hidden border border-white/10 hover:border-[#00C402]/40 transition-all group shadow-2xl">
                                <div className="relative h-48 bg-[#0a1f3a]">
                                    <img
                                        src={curso.image_url || "https://images.unsplash.com/photo-1627398242454-45a1465c2479?w=400"}
                                        className="w-full h-full object-cover opacity-40 group-hover:opacity-100 transition-opacity duration-700"
                                        alt={curso.title}
                                    />
                                    <div className="absolute inset-0 flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                                        <PlayCircle size={64} className="text-[#00C402] drop-shadow-[0_0_20px_rgba(0,196,2,0.5)]" />
                                    </div>
                                </div>
                                <div className="p-8">
                                    <h3 className="font-black text-2xl mb-4 italic tracking-tighter uppercase line-clamp-1">{curso.title}</h3>
                                    <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden mb-2">
                                        <div className="bg-[#00C402] h-full shadow-[0_0_10px_rgba(0,196,2,0.5)]" style={{ width: `45%` }}></div>
                                    </div>
                                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-[#00C402]/60">
                                        <span>Progresso</span>
                                        <span>45%</span>
                                    </div>
                                    <Link href={`/classroom/${curso.id}`}>
                                        <button className="w-full mt-8 bg-[#00C402] text-black font-black uppercase italic tracking-widest py-4 rounded-2xl hover:brightness-110 transition shadow-lg">
                                            Continuar Masterclass
                                        </button>
                                    </Link>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="col-span-full py-24 border-2 border-dashed border-white/5 rounded-[40px] text-center bg-white/[0.02]">
                            <p className="text-gray-500 italic font-medium">Sua estante está pronta. Escolha seu próximo desafio abaixo.</p>
                        </div>
                    )}
                </div>
            </section>

            {/* Seção: Vitrine de Cursos */}
            <section className="mb-20">
                <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/5">
                    <h2 className="text-3xl font-black uppercase italic tracking-tighter flex items-center gap-3">
                        <CreditCard size={28} className="text-[#00C402]" />
                        Cursos Disponíveis
                    </h2>
                    <span className="text-[10px] font-black uppercase tracking-[3px] text-gray-500">VITRINE EXCLUSIVA</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {cursosDisponiveis.map((curso) => (
                        <div key={curso.id} className="bg-white/5 backdrop-blur-sm rounded-[32px] overflow-hidden border border-white/10 hover:border-[#00C402]/30 transition-all flex flex-col group shadow-xl">
                            <div className="relative h-56 overflow-hidden">
                                <img
                                    src={curso.image_url || "https://images.unsplash.com/photo-1558655146-d09347e92766?w=400"}
                                    className="w-full h-full object-cover opacity-60 group-hover:scale-110 group-hover:opacity-100 transition-all duration-700"
                                    alt={curso.title}
                                />
                                <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest text-[#00C402] border border-[#00C402]/20">
                                    Novidade
                                </div>
                            </div>
                            <div className="p-6 flex-grow flex flex-col justify-between">
                                <div>
                                    <h3 className="font-black text-xl mb-2 italic tracking-tighter uppercase line-clamp-1 group-hover:text-[#00C402] transition">{curso.title}</h3>
                                    <p className="text-gray-400 text-[10px] font-medium leading-relaxed uppercase tracking-wider line-clamp-2">{curso.description || 'Domine esta habilidade com o método EXS de alta performance.'}</p>
                                </div>
                                <div className="mt-8">
                                    <div className="flex items-center justify-between mb-6">
                                        <div className="flex flex-col">
                                            <span className="text-[8px] font-black uppercase text-gray-500 tracking-[3px]">Investimento</span>
                                            <span className="text-[#00C402] font-black text-2xl italic tracking-tighter">R$ 497,00</span>
                                        </div>
                                        <Link href={`/course/${curso.id}`} className="text-[8px] font-black uppercase tracking-[2px] text-gray-500 underline hover:text-white transition">
                                            Detalhes
                                        </Link>
                                    </div>

                                    <AddToCartButton
                                        course={{
                                            id: curso.id,
                                            title: curso.title,
                                            price: 497,
                                            image_url: curso.image_url
                                        }}
                                    />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    )
}