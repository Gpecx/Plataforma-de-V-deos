import { adminAuth, adminDb } from '@/lib/firebase-admin'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { PlayCircle, CreditCard, BookOpen, Sparkles, Trophy, Users } from 'lucide-react'
import Link from 'next/link'
import { AddToCartButton } from '@/components/AddToCartButton'
import { StudentCarousel } from '@/components/dashboard/StudentCarousel'
import { MyLearningSidebar } from '@/components/dashboard/MyLearningSidebar'

export default async function StudentDashboard() {
    const cookieStore = cookies()
    const token = (await cookieStore).get('firebase-token')?.value

    if (!token) redirect('/login')

    let user;
    try {
        user = await adminAuth.verifyIdToken(token)
    } catch (error) {
        redirect('/login')
    }

    // 2. Busca perfil, cursos totais e matrículas em paralelo no Firestore
    const [profileDoc, coursesSnapshot, enrollmentsSnapshot] = await Promise.all([
        adminDb.collection('profiles').doc(user.uid).get(),
        adminDb.collection('courses').get(),
        adminDb.collection('enrollments').where('user_id', '==', user.uid).get()
    ])

    const profile = profileDoc.data()
    const allCourses = coursesSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
            id: doc.id,
            ...data,
            created_at: data.created_at?.toDate ? data.created_at.toDate().toISOString() : data.created_at,
            updated_at: data.updated_at?.toDate ? data.updated_at.toDate().toISOString() : data.updated_at
        };
    }) as any[]
    const enrolledIds = enrollmentsSnapshot.docs.map(doc => doc.data().course_id)

    const meusCursos = allCourses.filter(c => enrolledIds.includes(c.id))
    const cursosDisponiveis = allCourses.filter(c => !enrolledIds.includes(c.id))

    return (
        <div className="max-w-[1600px] mx-auto pb-16 min-h-screen bg-[#F3F4F6] text-slate-800 font-exo relative">

            {/* Main Content (Full Width) */}
            <div className="space-y-8">
                {/* Header de Boas-vindas - Compacto no Topo */}
                <header className="pt-0 px-4 md:px-8">
                    <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[8px] font-bold uppercase tracking-[4px] text-[#00C402]">WORKSPACE STUDENT</span>
                    </div>
                    <div className="flex flex-col md:flex-row md:items-baseline gap-2 md:gap-4">
                        <h1 className="text-2xl md:text-3xl font-black tracking-tighter text-slate-800">
                            BEM-VINDO, <span className="text-[#00C402] uppercase">{profile?.full_name?.split(' ')[0] || 'ALUNO'}!</span>
                        </h1>
                        <p className="text-slate-400 font-bold text-[9px] tracking-widest uppercase">Eleve sua carreira hoje.</p>
                    </div>
                </header>

                {/* Banner de Inspiração (Carrossel Dinâmico) - 100% da Largura Total */}
                <div className="w-full">
                    <StudentCarousel />
                </div>

                {/* Seções com Padding Lateral */}
                <div className="px-4 md:px-8 space-y-12">
                    {/* Seção: Meus Cursos */}
                    <section>
                        <div className="flex items-center justify-between mb-6 pb-3 border-b border-slate-200/60">
                            <h2 className="text-lg font-black uppercase tracking-tighter flex items-center gap-3 text-slate-700">
                                <BookOpen size={18} className="text-[#00C402]" />
                                Seu Aprendizado
                            </h2>
                            <span className="text-[8px] font-black uppercase tracking-[2px] text-slate-400">{meusCursos.length} TREINAMENTOS</span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {meusCursos.length > 0 ? (
                                meusCursos.map((curso) => (
                                    <div key={curso.id} className="bg-white rounded-2xl overflow-hidden border border-slate-100 hover:border-[#00C402]/30 transition-all group shadow-sm hover:shadow-lg">
                                        <div className="relative h-40 bg-slate-100">
                                            <img
                                                src={curso.image_url || "https://images.unsplash.com/photo-1627398242454-45a1465c2479?w=400"}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                                                alt={curso.title}
                                            />
                                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20 backdrop-blur-[2px]">
                                                <PlayCircle size={40} className="text-white drop-shadow-lg" />
                                            </div>
                                        </div>
                                        <div className="p-6">
                                            <h3 className="font-bold text-base mb-3 tracking-tight text-slate-900 line-clamp-1 group-hover:text-[#00C402] transition">{curso.title}</h3>

                                            <div className="relative group/progress mb-2">
                                                <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden">
                                                    <div className="bg-[#00C402] h-full" style={{ width: `45%` }}></div>
                                                </div>
                                            </div>

                                            <div className="flex justify-between items-center text-[8px] font-black uppercase tracking-widest text-[#00C402]">
                                                <span>45% COMPLETADO</span>
                                            </div>
                                            <Link href={`/classroom/${curso.id}`}>
                                                <button className="w-full mt-6 bg-slate-900 text-white font-bold uppercase text-[10px] tracking-widest py-3 rounded-xl hover:bg-slate-800 transition shadow-sm">
                                                    Continuar
                                                </button>
                                            </Link>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="col-span-full py-16 border border-dashed border-slate-200 rounded-[24px] text-center bg-white/50">
                                    <p className="text-slate-400 text-[10px] font-semibold uppercase tracking-widest">Sua estante está vazia.</p>
                                </div>
                            )}
                        </div>
                    </section>

                    {/* Seção Founders */}
                    <section className="bg-white rounded-[32px] border border-slate-100 p-8 overflow-hidden relative shadow-sm">
                        <div className="absolute top-0 right-0 w-1/4 h-full opacity-5 pointer-events-none">
                            <img src="https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=600" alt="Tech" className="w-full h-full object-cover grayscale" />
                        </div>
                        <div className="relative z-10 flex flex-col md:flex-row gap-8 items-center">
                            <div className="flex-1 text-center md:text-left">
                                <h2 className="text-lg font-black uppercase tracking-tighter text-slate-800 mb-2 flex items-center justify-center md:justify-start gap-3">
                                    <Trophy size={18} className="text-[#00C402]" />
                                    Conteúdo Inovador
                                </h2>
                                <p className="text-slate-500 font-medium italic text-xs leading-relaxed max-w-xl">
                                    "Unimos a precisão técnica da engenharia com a agilidade estratégica que o mercado exige."
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* Seção: Vitrine de Cursos */}
                    <section className="pb-16">
                        <div className="flex items-center justify-between mb-6 pb-3 border-b border-slate-200/60">
                            <h2 className="text-lg font-black uppercase tracking-tighter flex items-center gap-3 text-slate-700">
                                <CreditCard size={18} className="text-[#00C402]" />
                                Recomendados
                            </h2>
                            <span className="text-[8px] font-black uppercase tracking-[2px] text-slate-400">VITRINE SPCS</span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {cursosDisponiveis.map((curso) => (
                                <div key={curso.id} className="bg-white rounded-2xl overflow-hidden border border-slate-100 hover:border-[#00C402]/30 transition-all flex flex-col group shadow-sm hover:shadow-lg">
                                    <div className="relative h-40 overflow-hidden">
                                        <img
                                            src={curso.image_url || "https://images.unsplash.com/photo-1558655146-d09347e92766?w=400"}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-all duration-700"
                                            alt={curso.title}
                                        />
                                    </div>
                                    <div className="p-5 flex-grow flex flex-col justify-between">
                                        <div className="mb-4">
                                            <h3 className="font-bold text-sm mb-1.5 tracking-tight text-slate-900 line-clamp-1 group-hover:text-[#00C402] transition">{curso.title}</h3>
                                            <p className="text-slate-500 text-[9px] font-medium leading-relaxed line-clamp-2">{curso.description || 'Domine esta habilidade com o método SPCS.'}</p>
                                        </div>
                                        <div>
                                            <div className="flex items-center justify-between mb-4">
                                                <span className="text-slate-900 font-black text-lg tracking-tighter">R$ 497,00</span>
                                                <Link href={`/course/${curso.id}`} className="text-[7px] font-bold uppercase tracking-widest text-slate-400 hover:text-slate-900 transition underline underline-offset-4">
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
            </div>
        </div>
    )
}
