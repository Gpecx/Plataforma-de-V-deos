"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Play, Info, ChevronRight } from "lucide-react";
import Navbar from "@/components/Navbar";
import { allCourses, categories as courseCategories } from "@/data/courses-data";

const heroSlides = [
    {
        title: "FULLSTACK NEXUS",
        subtitle: "A jornada definitiva Next.js e Supabase.",
        image: "https://images.unsplash.com/photo-1627398242454-45a1465c2479?auto=format&fit=crop&q=80&w=1600",
        tag: "ORIGINAL EXS"
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

export default function CoursesPage() {
    const [currentSlide, setCurrentSlide] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
        }, 5000);
        return () => clearInterval(timer);
    }, []);

    return (
        <div className="min-h-screen bg-[#061629] text-white font-exo">
            <Navbar />

            {/* Carrossel Hero */}
            <section className="relative h-[80vh] w-full overflow-hidden">
                {heroSlides.map((slide, index) => (
                    <div key={index} className={`absolute inset-0 transition-opacity duration-1000 ${index === currentSlide ? "opacity-100" : "opacity-0"}`}>
                        <div className="absolute inset-0 bg-gradient-to-r from-[#061629] via-[#061629]/40 to-transparent z-10" />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#061629] via-transparent to-transparent z-10" />
                        <img src={slide.image} className="w-full h-full object-cover" alt={slide.title} />
                        <div className="relative z-20 h-full flex flex-col justify-center px-12 space-y-6 max-w-4xl pt-20">
                            <span className="bg-[#00C402] text-black text-[10px] font-black px-2 py-0.5 rounded-sm w-fit uppercase">{slide.tag}</span>
                            <h1 className="text-6xl md:text-7xl font-black italic uppercase tracking-tighter leading-none">
                                {slide.title.split(' ')[0]} <br />
                                <span className="text-[#00C402]">{slide.title.split(' ').slice(1).join(' ')}</span>
                            </h1>
                            <p className="text-xl text-gray-200 drop-shadow-lg max-w-lg">{slide.subtitle}</p>
                            <div className="flex gap-4">
                                <Button className="bg-white text-black hover:bg-[#00C402] hover:text-white px-8 py-6 text-lg font-bold flex gap-3 transition-all">
                                    <Play fill="currentColor" /> Assistir
                                </Button>
                                <Button className="bg-gray-500/40 text-white hover:bg-gray-500/60 px-8 py-6 text-lg font-bold flex gap-3 backdrop-blur-md border border-white/10">
                                    <Info /> Saiba Mais
                                </Button>
                            </div>
                        </div>
                    </div>
                ))}
            </section>

            {/* Título de Destaque "CURSOS EXS" */}
            <div className="relative z-30 px-12 -mt-10 mb-10">
                <h2 className="text-5xl md:text-7xl font-black italic tracking-tighter uppercase leading-none">
                    CURSOS <span className="text-[#00C402] drop-shadow-[0_0_20px_rgba(0,196,2,0.8)]">EXS</span>
                </h2>
                <div className="w-32 h-2.5 bg-[#00C402] mt-4 rounded-full shadow-[0_0_10px_rgba(0,196,2,0.5)]"></div>
            </div>

            {/* Listas de Cursos */}
            <div className="px-12 relative z-30 space-y-24 pb-32">
                {courseCategories.map((category) => {
                    const filteredCourses = allCourses.filter(c => c.category === category);
                    if (filteredCourses.length === 0) return null;

                    return (
                        <div key={category} className="space-y-10">
                            <div className="flex items-end justify-between border-b border-white/10 pb-4">
                                <h2 className="text-3xl md:text-4xl font-black italic uppercase tracking-tighter flex items-center gap-3 group cursor-pointer">
                                    {category}
                                    <ChevronRight className="text-[#00C402] w-8 h-8 opacity-0 group-hover:opacity-100 transition-all -ml-2" />
                                </h2>
                                <span className="text-gray-400 text-sm font-bold uppercase tracking-widest">{filteredCourses.length} treinamentos</span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                                {filteredCourses.map((course) => (
                                    <div key={course.id} className="group bg-[#0a1f3a]/90 border border-white/20 rounded-[2rem] overflow-hidden hover:border-[#00C402]/60 transition-all duration-500 flex flex-col hover:shadow-[0_0_50px_rgba(0,196,2,0.25)] hover:-translate-y-2">
                                        <Link href={`/course/${course.slug}`}>
                                            <div className="aspect-video relative overflow-hidden">
                                                <img src={course.image} alt={course.title} className="object-cover w-full h-full group-hover:scale-110 transition duration-1000 opacity-90" />
                                                <div className="absolute top-4 right-4 bg-black/80 backdrop-blur-md border border-[#00C402]/40 text-[#00C402] px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest">
                                                    {course.tag}
                                                </div>
                                            </div>
                                        </Link>
                                        <div className="p-8 flex-grow flex flex-col space-y-6">
                                            <Link href={`/course/${course.slug}`}>
                                                <h3 className="text-2xl font-black text-white leading-tight uppercase italic group-hover:text-[#00C402] transition-colors drop-shadow-sm">{course.title}</h3>
                                            </Link>
                                            <p className="text-gray-300 text-sm leading-relaxed font-bold opacity-80 h-12 line-clamp-2">{course.description}</p>
                                            <div className="pt-6 mt-auto border-t border-white/10 flex items-center justify-between">
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] text-gray-400 uppercase font-black tracking-widest leading-none mb-1">Investimento</span>
                                                    <span className="text-2xl font-black text-[#00C402] italic drop-shadow-[0_0_10px_rgba(0,196,2,0.3)]">R$ {course.price},00</span>
                                                </div>
                                                <Link href={`/course/${course.slug}`}>
                                                    <Button className="bg-[#00C402] text-black hover:bg-white hover:scale-105 transition-all font-black uppercase tracking-widest text-[10px] px-6 py-5 rounded-xl shadow-lg">
                                                        Ver Detalhes
                                                    </Button>
                                                </Link>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
