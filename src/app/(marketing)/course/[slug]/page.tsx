import { notFound } from "next/navigation"
import Link from "next/link"
import { BuyButton } from "@/components/BuyButton"
import Navbar from "@/components/Navbar"
import { db } from "@/lib/firebase";
import { doc, getDoc, collection, query, where, getDocs, orderBy } from "firebase/firestore";
import {
    CheckCircle2,
    PlayCircle,
    Clock,
    Star,
    Users,
    ShieldCheck,
    ChevronDown,
    ArrowLeft,
} from "lucide-react"

export default async function CourseDetailPage({ params }: { params: { slug: string } }) {
    const { slug } = await params
    // 1. Busca o curso por ID
    const courseSnap = await getDoc(doc(db, 'courses', slug));

    if (!courseSnap.exists()) return notFound();
    const course = { id: courseSnap.id, ...courseSnap.data() as any };

    const lessonsSnap = await getDocs(
        query(
            collection(db, 'lessons'),
            where('course_id', '==', slug),
            orderBy('position', 'asc')
        )
    );
    const lessons = lessonsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() as any }));

    const curriculum = [
        {
            title: "Grade Curricular Completa",
            lessons: lessons || []
        }
    ]

    const totalLessons = lessons?.length || 0
    const coursePrice = typeof course.price === 'number' ? course.price : parseFloat(course.price)

    return (
        <div className="min-h-screen bg-[#F4F7F9] text-slate-800 font-exo">
            <Navbar />

            {/* HERO & VIDEO SECTION */}
            <section className="relative pt-32 pb-20 overflow-hidden">
                <div className="max-w-7xl mx-auto px-6 md:px-12 w-full grid lg:grid-cols-5 gap-16 items-start">

                    {/* Left: Video & Info */}
                    <div className="lg:col-span-3 space-y-12">
                        <div className="space-y-6">
                            <Link
                                href="/course"
                                className="inline-flex items-center gap-2 text-slate-400 hover:text-slate-900 transition text-[10px] font-black uppercase tracking-[3px]"
                            >
                                <ArrowLeft size={14} />
                                Voltar ao Catálogo
                            </Link>

                            <div className="flex items-center gap-3">
                                <span className="inline-block bg-[#00C402] text-white text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-lg shadow-[#00C402]/20">
                                    {course.tag || "PREMIUM"}
                                </span>
                                <div className="h-[1px] w-12 bg-slate-200"></div>
                            </div>

                            <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-slate-900 leading-[0.9] uppercase">
                                {course.title}
                            </h1>
                        </div>

                        {/* Video Player - High Quality Impression */}
                        <div className="relative aspect-video w-full bg-black rounded-[40px] overflow-hidden shadow-2xl group border-[12px] border-white ring-1 ring-slate-100">
                            <img
                                src={course.image_url || "https://images.unsplash.com/photo-1633356122544-f134324a6cee?q=80&w=2070"}
                                className="w-full h-full object-cover opacity-60 brightness-50"
                                alt="Course Preview"
                            />
                            <div className="absolute inset-0 flex items-center justify-center">
                                <button className="w-24 h-24 bg-white text-[#00C402] rounded-full flex items-center justify-center shadow-[0_0_50px_rgba(255,255,255,0.3)] hover:scale-110 transition-transform group-active:scale-95">
                                    <PlayCircle size={48} fill="currentColor" className="text-[#00C402] opacity-20" />
                                    <PlayCircle size={48} className="absolute" />
                                </button>
                            </div>
                            <div className="absolute bottom-8 left-8 flex items-center gap-3">
                                <div className="p-2 bg-white/10 backdrop-blur-md rounded-lg text-white">
                                    <PlayCircle size={20} />
                                </div>
                                <span className="text-white text-xs font-black uppercase tracking-widest">Aprenda com quem faz na prática</span>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h3 className="text-xl font-black text-slate-800 uppercase tracking-tighter">Sobre este treinamento</h3>
                            <p className="text-slate-500 text-lg leading-relaxed font-medium">
                                {course.description}
                            </p>
                        </div>
                    </div>

                    {/* Right: Pricing & Benefits */}
                    <div className="lg:col-span-2 space-y-8 sticky top-32">
                        <div className="bg-white border border-slate-100 rounded-[40px] p-10 space-y-8 shadow-2xl shadow-slate-200/50">
                            <div className="space-y-2 text-center pb-6 border-b border-slate-50">
                                <p className="text-[10px] text-slate-400 uppercase tracking-[4px] font-black">Investimento Único</p>
                                <div className="flex items-baseline justify-center gap-1">
                                    <span className="text-2xl font-bold text-slate-900 tracking-tighter">R$</span>
                                    <span className="text-7xl font-black text-slate-900 tracking-tighter leading-none">
                                        {coursePrice.toFixed(0)}
                                    </span>
                                    <span className="text-2xl font-bold text-slate-400">,00</span>
                                </div>
                                <p className="text-[#00C402] text-[10px] font-black uppercase tracking-widest mt-2">Acesso Vitalício Imediato</p>
                            </div>

                            <div className="space-y-4">
                                <BuyButton course={course} label="Adicionar ao Carrinho" className="w-full py-8 text-sm tracking-[4px] uppercase font-black rounded-2xl bg-[#00C402] hover:bg-[#00C402]/90 shadow-2xl shadow-[#00C402]/20" />

                                <div className="flex items-center justify-center gap-3 text-slate-400 text-[10px] font-bold uppercase tracking-widest pt-2">
                                    <ShieldCheck size={16} className="text-[#00C402]" />
                                    <span>Garantia de 7 Dias SPCS Shield</span>
                                </div>
                            </div>

                            <div className="space-y-4 border-t border-slate-50 pt-8">
                                {[
                                    { icon: <Clock size={18} />, text: `${course.hours || 24} Horas de Conteúdo` },
                                    { icon: <PlayCircle size={18} />, text: `${totalLessons} Aulas Práticas` },
                                    { icon: <CheckCircle2 size={18} />, text: "Material Complementar" },
                                    { icon: <Users size={18} />, text: "Comunidade Exclusiva" },
                                ].map((item, i) => (
                                    <div key={i} className="flex items-center gap-4 text-slate-600 font-bold text-xs uppercase tracking-wider">
                                        <div className="text-[#00C402]">{item.icon}</div>
                                        {item.text}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Social Proof Mini Card */}
                        <div className="bg-slate-900 rounded-[32px] p-8 flex items-center gap-6 shadow-xl">
                            <div className="flex -space-x-4">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="w-12 h-12 rounded-full border-4 border-slate-900 bg-slate-800 overflow-hidden">
                                        <img src={`https://i.pravatar.cc/150?u=${i}`} className="w-full h-full object-cover" />
                                    </div >
                                ))}
                            </div >
                            <div>
                                <p className="text-white text-xs font-black tracking-widest uppercase">+{course.students || 1240} ALUNOS</p>
                                <div className="flex text-yellow-500 gap-0.5 mt-1">
                                    {[1, 2, 3, 4, 5].map(i => <Star key={i} size={10} fill="currentColor" />)}
                                </div>
                            </div>
                        </div >
                    </div >
                </div >
            </section >

            {/* CURRÍCULO SECTION */}
            < section className="py-24 bg-white border-t border-slate-100" >
                <div className="max-w-4xl mx-auto px-6">
                    <div className="flex flex-col items-center text-center space-y-4 mb-16">
                        <div className="w-16 h-1 bg-[#00C402] rounded-full"></div>
                        <h2 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tighter uppercase leading-none">
                            O que você vai <span className="text-[#00C402]">DOMINAR</span>
                        </h2>
                        <p className="text-slate-400 font-bold uppercase tracking-[2px] text-[10px]">Ementa completa do treinamento</p>
                    </div>

                    <div className="space-y-4">
                        {curriculum.map((mod, i) => (
                            <div
                                key={i}
                                className="bg-slate-50 border border-slate-100 rounded-[32px] overflow-hidden"
                            >
                                <div className="p-10 flex items-center justify-between gap-6">
                                    <div className="flex items-center gap-6">
                                        <div className="w-14 h-14 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-slate-900 font-black text-xl shadow-sm">
                                            01
                                        </div>
                                        <div>
                                            <h3 className="font-black text-xl text-slate-900 uppercase tracking-tighter">{mod.title}</h3>
                                            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">{mod.lessons.length} aulas de conteúdo prático</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="px-10 pb-10 grid gap-3">
                                    {mod.lessons.map((lesson: any, li: number) => (
                                        <div
                                            key={li}
                                            className="flex items-center justify-between bg-white border border-slate-100/50 p-5 rounded-2xl hover:border-[#00C402]/30 transition-all group"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="p-2 bg-slate-50 rounded-lg text-slate-300 group-hover:text-[#00C402] transition-colors">
                                                    <PlayCircle size={16} />
                                                </div>
                                                <span className="text-sm font-bold text-slate-600 group-hover:text-slate-900 transition-colors">{lesson.title}</span>
                                            </div>
                                            <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Vídeo Aula</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section >

            {/* WHAT YOU WILL LEARN GRID */}
            < section className="py-24 px-6 md:px-12 max-w-7xl mx-auto space-y-16" >
                <div className="flex flex-col items-center text-center space-y-4">
                    <h2 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tighter uppercase leading-none">
                        Tópicos <span className="text-[#00C402]">Abordados</span>
                    </h2>
                    <p className="text-slate-400 font-bold uppercase tracking-[2px] text-[10px]">Conhecimentos estratégicos para sua carreira</p>
                </div>

                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {(course.highlights || [
                        "Fundamentos e conceitos essenciais",
                        "Práticas e exercícios reais",
                        "Domínio completo da ferramenta",
                        "Fluxo de trabalho otimizado",
                        "Projetos práticos para portfólio",
                        "Estratégias avançadas de mercado"
                    ]).map((item: string, i: number) => (
                        <div
                            key={i}
                            className="flex items-start gap-5 bg-white border border-slate-100 p-8 rounded-[32px] hover:border-[#00C402]/30 transition-all group shadow-sm"
                        >
                            <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-[#00C402] shrink-0 group-hover:bg-[#00C402] group-hover:text-white transition-all">
                                <CheckCircle2 size={20} />
                            </div>
                            <p className="text-slate-600 font-bold leading-tight text-sm uppercase tracking-wider">{item}</p>
                        </div>
                    ))}
                </div>
            </section >

            {/* CTA FINAL */}
            < section className="pb-32 px-6" >
                <div className="max-w-4xl mx-auto text-center bg-slate-900 rounded-[40px] p-16 shadow-2xl space-y-8 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-[#00C402]/10 blur-[100px] -mr-32 -mt-32"></div>
                    <h3 className="text-3xl md:text-6xl font-black text-white tracking-tighter uppercase leading-[0.9] relative z-10">
                        Comece sua <span className="text-[#00C402]">transformação</span> agora
                    </h3>
                    <p className="text-slate-400 text-lg font-medium max-w-xl mx-auto relative z-10 font-exo">
                        Invista no seu futuro profissional com acesso imediato à maior plataforma de treinamentos estratégicos.
                    </p>
                    <div className="flex justify-center relative z-10">
                        <BuyButton course={course} size="large" label="Garanta sua vaga" className="bg-[#00C402] hover:brightness-110 text-white h-20 px-16 text-md tracking-[4px] uppercase font-black rounded-3xl" />
                    </div>
                </div>
            </section >
        </div >
    )
}
