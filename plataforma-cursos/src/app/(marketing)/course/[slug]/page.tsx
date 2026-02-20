import { notFound } from "next/navigation"
import Link from "next/link"
import { getCourseBySlug } from "@/data/courses-data"
import { BuyButton } from "@/components/BuyButton"
import Navbar from "@/components/Navbar"
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

export async function generateStaticParams() {
    const { allCourses } = await import("@/data/courses-data")
    return allCourses.map((c) => ({ slug: c.slug }))
}

export default async function CourseDetailPage({ params }: { params: { slug: string } }) {
    const { slug } = await params
    const course = getCourseBySlug(slug)

    if (!course) return notFound()

    const totalLessons = course.curriculum.reduce((acc, m) => acc + m.lessons.length, 0)

    return (
        <div className="min-h-screen bg-[#061629] text-white font-['Exo']">
            <Navbar />

            {/* HERO */}
            <section className="relative min-h-[70vh] flex items-end pt-24 pb-16 overflow-hidden">
                {/* Background image */}
                <div className="absolute inset-0 z-0">
                    <img
                        src={course.image}
                        alt={course.title}
                        className="w-full h-full object-cover opacity-25"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-[#061629] via-[#061629]/80 to-transparent" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#061629] via-transparent to-[#061629]/70" />
                </div>

                <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-12 w-full grid lg:grid-cols-2 gap-12 items-center">
                    {/* Left */}
                    <div className="space-y-6">
                        {/* Breadcrumb */}
                        <Link
                            href="/course"
                            className="inline-flex items-center gap-2 text-gray-400 hover:text-[#00C402] transition text-sm font-bold uppercase tracking-widest"
                        >
                            <ArrowLeft size={16} />
                            Voltar ao Catálogo
                        </Link>

                        {/* Tag */}
                        <span className="inline-block bg-[#00C402] text-black text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">
                            {course.tag}
                        </span>

                        {/* Title */}
                        <h1 className="text-4xl md:text-6xl font-black italic uppercase tracking-tighter leading-none">
                            {course.title}
                        </h1>

                        {/* Description */}
                        <p className="text-gray-300 text-lg max-w-xl leading-relaxed">
                            {course.description}
                        </p>

                        {/* Stats */}
                        <div className="flex flex-wrap gap-6 text-sm font-bold">
                            <div className="flex items-center gap-2 text-yellow-400">
                                <Star size={16} fill="currentColor" />
                                <span>{course.rating.toFixed(1)}</span>
                                <span className="text-gray-400 font-normal">({course.students.toLocaleString("pt-BR")} alunos)</span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-300">
                                <Clock size={16} className="text-[#00C402]" />
                                {course.hours}h de conteúdo
                            </div>
                            <div className="flex items-center gap-2 text-gray-300">
                                <PlayCircle size={16} className="text-[#00C402]" />
                                {totalLessons} aulas
                            </div>
                            <div className="flex items-center gap-2 text-gray-300">
                                <Users size={16} className="text-[#00C402]" />
                                {course.students.toLocaleString("pt-BR")} alunos
                            </div>
                        </div>
                    </div>

                    {/* Right: Card de Compra */}
                    <div className="relative">
                        <div className="absolute -inset-2 bg-gradient-to-br from-[#00C402]/30 to-transparent rounded-3xl blur-2xl" />
                        <div className="relative bg-[#0a1f3a]/90 backdrop-blur-xl border border-white/10 rounded-3xl p-8 space-y-6 shadow-2xl">
                            {/* Price */}
                            <div>
                                <p className="text-xs text-gray-400 uppercase tracking-widest font-bold mb-1">Investimento Total</p>
                                <p className="text-5xl font-black text-[#00C402] italic drop-shadow-[0_0_15px_rgba(0,196,2,0.4)]">
                                    R$ {course.price.toFixed(2).replace(".", ",")}
                                </p>
                                <p className="text-gray-400 text-sm mt-1">Acesso vitalício + certificado</p>
                            </div>

                            {/* BuyButton */}
                            <BuyButton course={course} label="Adicionar ao Carrinho" />

                            {/* Guarantee */}
                            <div className="flex items-center gap-3 text-gray-400 text-sm">
                                <ShieldCheck size={20} className="text-[#00C402] shrink-0" />
                                <span>Garantia de <strong className="text-white">7 dias</strong> ou seu dinheiro de volta</span>
                            </div>

                            {/* What's included */}
                            <div className="border-t border-white/10 pt-5 space-y-2">
                                {[
                                    `${course.hours}h de aulas em vídeo`,
                                    "Acesso vitalício em todos dispositivos",
                                    "Certificado de conclusão EXS",
                                    "Comunidade exclusiva de alunos",
                                ].map((item, i) => (
                                    <div key={i} className="flex items-center gap-3 text-sm text-gray-300">
                                        <CheckCircle2 size={15} className="text-[#00C402] shrink-0" />
                                        {item}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* IMAGENS DE INSPIRAÇÃO */}
            <section className="py-20 px-6 md:px-12 max-w-7xl mx-auto">
                <h2 className="text-3xl md:text-5xl font-black italic uppercase tracking-tighter mb-12 text-center">
                    Inspiração do <span className="text-[#00C402]">Projeto</span>
                </h2>
                <div className="grid md:grid-cols-3 gap-8">
                    {course.inspirationImages.map((img, i) => (
                        <div key={i} className="aspect-[4/3] rounded-3xl overflow-hidden border border-white/10 group">
                            <img
                                src={img}
                                alt={`Inspiração ${i + 1}`}
                                className="w-full h-full object-cover group-hover:scale-110 transition duration-700"
                            />
                        </div>
                    ))}
                </div>
            </section>

            {/* O QUE VOCÊ VAI APRENDER */}
            <section className="py-20 px-6 md:px-12 max-w-7xl mx-auto">
                <h2 className="text-3xl md:text-5xl font-black italic uppercase tracking-tighter mb-12 text-center">
                    O que você vai <span className="text-[#00C402]">aprender</span>
                </h2>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {course.highlights.map((item, i) => (
                        <div
                            key={i}
                            className="flex items-start gap-4 bg-[#0a1f3a]/70 border border-white/5 rounded-2xl p-5 hover:border-[#00C402]/30 transition-all group"
                        >
                            <CheckCircle2 size={20} className="text-[#00C402] mt-0.5 shrink-0 group-hover:scale-110 transition-transform" />
                            <p className="text-gray-200 font-medium leading-snug">{item}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* CURRÍCULO */}
            <section className="pb-20 px-6 md:px-12 max-w-4xl mx-auto">
                <h2 className="text-3xl md:text-5xl font-black italic uppercase tracking-tighter mb-4 text-center">
                    Conteúdo do <span className="text-[#00C402]">Curso</span>
                </h2>
                <p className="text-center text-gray-400 mb-12">
                    {course.curriculum.length} módulos · {totalLessons} aulas · {course.hours}h de conteúdo
                </p>

                <div className="space-y-4">
                    {course.curriculum.map((mod, i) => (
                        <details
                            key={i}
                            className="group bg-[#0a1f3a] border border-white/5 rounded-2xl overflow-hidden hover:border-[#00C402]/20 transition-all"
                            open={i === 0}
                        >
                            <summary className="list-none p-6 flex items-center justify-between cursor-pointer hover:bg-white/5 transition-all gap-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-9 h-9 rounded-xl bg-[#00C402]/10 flex items-center justify-center text-[#00C402] font-black text-sm shrink-0">
                                        {String(i + 1).padStart(2, "0")}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-base md:text-lg">{mod.title}</h3>
                                        <p className="text-xs text-gray-500 mt-0.5">{mod.lessons.length} aulas</p>
                                    </div>
                                </div>
                                <ChevronDown size={20} className="text-gray-500 group-open:rotate-180 transition-transform shrink-0" />
                            </summary>
                            <div className="px-6 pb-6 space-y-1">
                                {mod.lessons.map((lesson, li) => (
                                    <div
                                        key={li}
                                        className="flex items-center gap-3 text-gray-400 py-3 border-b border-white/5 last:border-0 hover:text-white transition-colors"
                                    >
                                        <PlayCircle size={15} className="text-[#00C402] shrink-0" />
                                        <span className="text-sm">{lesson.title}</span>
                                    </div>
                                ))}
                            </div>
                        </details>
                    ))}
                </div>
            </section>

            {/* CTA FINAL */}
            <section className="pb-32 px-6">
                <div className="max-w-3xl mx-auto text-center bg-gradient-to-b from-[#0a1f3a] to-[#061629] rounded-3xl border border-[#00C402]/20 p-14 shadow-[0_0_60px_rgba(0,196,2,0.1)] space-y-6">
                    <h3 className="text-3xl md:text-5xl font-black italic uppercase tracking-tighter">
                        Pronto para começar sua <span className="text-[#00C402]">transformação?</span>
                    </h3>
                    <p className="text-gray-400 text-lg">
                        Invista em você hoje por apenas <strong className="text-[#00C402]">R$ {course.price.toFixed(2).replace(".", ",")}</strong> e tenha acesso vitalício.
                    </p>
                    <div className="flex justify-center">
                        <BuyButton course={course} size="large" label="Quero me inscrever agora" />
                    </div>
                    <p className="text-xs text-gray-500 flex items-center justify-center gap-2">
                        <ShieldCheck size={14} className="text-[#00C402]" />
                        Garantia incondicional de 7 dias
                    </p>
                </div>
            </section>
        </div>
    )
}
