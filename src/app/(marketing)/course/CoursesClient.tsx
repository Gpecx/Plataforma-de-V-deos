"use client";

import { useState, Suspense, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useSearchParams } from "next/navigation";
import { Play, Info, ChevronRight, Loader2 } from "lucide-react";
import Navbar from "@/components/Navbar";
import CourseModal from "@/components/CourseModal";

const heroSlides = [
    {
        title: "FULLSTACK NEXUS",
        subtitle: "A jornada definitiva Next.js e Firebase.",
        image: "https://images.unsplash.com/photo-1627398242454-45a1465c2479?auto=format&fit=crop&q=80&w=1600",
        tag: "ORIGINAL POWERPLAY"
    },
    {
        title: "DESIGN SYSTEM PRO",
        subtitle: "Crie interfaces modernas e escaláveis.",
        image: "https://images.unsplash.com/photo-1558655146-d09347e92766?auto=format&fit=crop&q=80&w=1600",
        tag: "LANÇAMENTO"
    },
    {
        title: "TECH INSIGHTS",
        subtitle: "Inovação e performance para o setor de energia.",
        image: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=800",
        tag: "ENGENHARIA"
    }
];

interface Course {
    id: string;
    title: string;
    subtitle?: string;
    description?: string;
    category?: string;
    price?: number;
    tag?: string;
    image_url?: string | null;
}

interface CoursesClientProps {
    initialCourses: Course[];
    heroBanners?: string[];
}

function CoursesInner({ initialCourses, heroBanners }: CoursesClientProps) {
    const searchParams = useSearchParams();
    const searchQuery = searchParams.get('s')?.toLowerCase() || "";

    const [currentSlide, setCurrentSlide] = useState(0);
    const [selectedCourse, setSelectedCourse] = useState<any>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const displaySlides = heroBanners && heroBanners.length > 0
        ? heroBanners.map((url, idx) => ({
            ...heroSlides[idx % heroSlides.length],
            image: url
        }))
        : heroSlides;

    useEffect(() => {
        if (displaySlides.length <= 1) return;
        const timer = setInterval(() => {
            setCurrentSlide(prev => (prev + 1) % displaySlides.length);
        }, 4000);
        return () => clearInterval(timer);
    }, [displaySlides.length]);

    const filteredCourses = searchQuery
        ? initialCourses.filter(c =>
            c.title?.toLowerCase().includes(searchQuery) ||
            c.category?.toLowerCase().includes(searchQuery)
        )
        : initialCourses;

    const handleCourseClick = (course: Course) => {
        setSelectedCourse(course);
        setIsModalOpen(true);
    };

    const dynamicCategories = Array.from(new Set(filteredCourses.map(c => c.category || "Lançamentos"))).sort();

    return (
        <div className="min-h-screen bg-[#0d2b17] text-white font-exo">
            <Navbar />

            {/* Carrossel Hero */}
            <section className="relative h-[65vh] w-full overflow-hidden">
                {displaySlides.map((slide, index) => (
                    <div key={index} className={`absolute inset-0 transition-opacity duration-1000 ${index === currentSlide ? "opacity-100" : "opacity-0"}`}>
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/60 to-transparent z-10" />
                        <img src={slide.image} className="w-full h-full object-cover scale-105" alt={slide.title} />

                        <div className="relative z-20 h-full flex flex-col justify-center px-8 md:px-20 space-y-6 max-w-4xl pt-24">
                            <div className="flex items-center gap-3">
                                <span className="bg-[#00C402] text-white text-[9px] font-black px-3 py-1 w-fit uppercase tracking-[2px] shadow-lg shadow-[#00C402]/20">
                                    {slide.tag}
                                </span>
                                <div className="h-[1px] w-12 bg-white/20"></div>
                            </div>
                            <h1 className="text-5xl md:text-7xl font-black tracking-tighter leading-[0.9] text-white">
                                {slide.title}
                            </h1>
                            <p className="text-xl text-slate-200/90 max-w-xl font-medium leading-relaxed">
                                {slide.subtitle}
                            </p>
                            <div className="flex flex-wrap gap-4 pt-6">
                                <Button
                                    onClick={() => filteredCourses.length > 0 && handleCourseClick(filteredCourses[0])}
                                    className="bg-[#00C402] text-white hover:bg-[#00C402]/90 h-14 px-8 text-sm font-black uppercase tracking-[2px] flex gap-3 shadow-2xl shadow-[#00C402]/30 active:scale-95 transition-all"
                                >
                                    <Play fill="currentColor" size={18} /> Iniciar Treinamento
                                </Button>
                                <Button variant="outline" className="border-white/20 text-white hover:bg-white/10 h-14 px-8 text-sm font-black uppercase tracking-[2px] backdrop-blur-md shadow-xl active:scale-95 transition-all">
                                    <Info size={18} /> Detalhes do Curso
                                </Button>
                            </div>
                        </div>
                    </div>
                ))}

                {/* Slide Dots */}
                {displaySlides.length > 1 && (
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex gap-2">
                        {displaySlides.map((_, i) => (
                            <button
                                key={i}
                                onClick={() => setCurrentSlide(i)}
                                className={`w-2 h-2 transition-all ${i === currentSlide ? 'bg-[#00C402] w-6' : 'bg-white/40'}`}
                            />
                        ))}
                    </div>
                )}
            </section>

            {/* Título */}
            <div className="relative z-30 px-8 md:px-12 mt-16 mb-10">
                <div className="flex items-center gap-4 mb-2">
                    <div className="w-12 h-[2px] bg-[#00C402]"></div>
                    <span className="text-[10px] font-black uppercase tracking-[4px] text-[#00C402]">Explorar</span>
                </div>
                <h2 className="text-3xl md:text-4xl font-black tracking-tighter text-white">
                    {searchQuery ? `RESULTADOS PARA: ${searchQuery.toUpperCase()}` : "CATÁLOGO DE FORMAÇÃO"}
                </h2>
            </div>

            {/* Lista de Cursos */}
            <div className="px-8 md:px-12 relative z-30 space-y-16 pb-32">
                {filteredCourses.length === 0 ? (
                    <div className="text-center py-20 bg-[#0f1f14] border border-[#1e4d2b] shadow-sm space-y-6">
                        <div className="w-20 h-20 bg-[#1e4d2b]/20 flex items-center justify-center mx-auto">
                            <Info size={32} className="text-slate-700" />
                        </div>
                        <p className="text-lg font-bold text-slate-500 uppercase tracking-[3px]">Nenhum treinamento encontrado.</p>
                        <Link href="/course">
                            <Button variant="outline" className="border-[#1e4d2b] text-slate-400 font-black uppercase tracking-widest text-xs h-12 hover:bg-[#1e4d2b]/20">
                                Ver todos os cursos
                            </Button>
                        </Link>
                    </div>
                ) : (
                    dynamicCategories.map(category => {
                        const coursesInCategory = filteredCourses.filter(c => (c.category || "Lançamentos") === category);
                        if (coursesInCategory.length === 0) return null;

                        return (
                            <div key={category} className="space-y-10">
                                <div className="flex items-end justify-between border-b border-[#1e4d2b] pb-6">
                                    <h2 className="text-2xl font-black uppercase tracking-tighter flex items-center gap-3 group cursor-pointer text-white">
                                        {category}
                                        <ChevronRight className="text-[#00C402] w-6 h-6 opacity-40 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                                    </h2>
                                    <span className="text-slate-500 text-[11px] font-black uppercase tracking-[2px] mb-1">
                                        {coursesInCategory.length} Módulos Disponíveis
                                    </span>
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                                    {coursesInCategory.map(course => (
                                        <div
                                            key={course.id}
                                            onClick={() => handleCourseClick(course)}
                                            className="group bg-[#0f1f14] border border-[#1e4d2b] overflow-hidden hover:border-[#00C402]/30 transition-all duration-300 flex flex-col hover:shadow-lg cursor-pointer"
                                        >
                                            <div className="aspect-video relative overflow-hidden">
                                                <img
                                                    src={course.image_url || "https://images.unsplash.com/photo-1633356122544-f134324a6cee?q=80&w=2070"}
                                                    alt={course.title}
                                                    className="object-cover w-full h-full group-hover:scale-105 transition duration-500"
                                                />
                                                <div className="absolute top-2 right-2 bg-[#0d2b17]/90 backdrop-blur-sm border border-[#1e4d2b] text-[#00C402] px-2 py-0.5 text-[8px] font-black uppercase tracking-widest">
                                                    {course.tag || "TREINAMENTO"}
                                                </div>
                                            </div>
                                            <div className="p-6 flex-grow flex flex-col space-y-4">
                                                <h3 className="text-xs font-bold text-white leading-tight group-hover:text-[#00C402] transition-colors line-clamp-2">
                                                    {course.title}
                                                </h3>
                                                <div className="mt-auto pt-3 border-t border-[#1e4d2b]/30 flex items-center justify-between">
                                                    <div className="flex flex-col">
                                                        <span className="text-[8px] text-slate-500 uppercase font-bold tracking-widest leading-none mb-0.5">Investimento</span>
                                                        <span className="text-sm font-black text-white leading-none">
                                                            R$ {Number(course.price || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Course Modal */}
            <CourseModal
                course={selectedCourse}
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
            />
        </div>
    );
}

export default function CoursesClient({ initialCourses, heroBanners }: CoursesClientProps) {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-[#0d2b17] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="animate-spin text-[#00C402]" size={40} />
                    <p className="text-sm font-black uppercase tracking-[3px] text-slate-500">Preparando Cursos...</p>
                </div>
            </div>
        }>
            <CoursesInner initialCourses={initialCourses} heroBanners={heroBanners} />
        </Suspense>
    );
}
