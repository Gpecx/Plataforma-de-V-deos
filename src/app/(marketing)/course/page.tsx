"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Play, Info, ChevronRight } from "lucide-react";
import Navbar from "@/components/Navbar";

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

const categories = [
    {
        title: "Programação",
        courses: [
            { id: 1, title: "Next.js 14 Pro", price: 497, thumb: "https://images.unsplash.com/photo-1618477388954-7852f32655ec?auto=format&fit=crop&w=800&q=80" },
            { id: 2, title: "Fullstack Master", price: 697, thumb: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=800&q=80" },
            { id: 3, title: "Python para Dados", price: 397, thumb: "https://images.unsplash.com/photo-1587620962725-abab7fe55159?q=80&w=1031&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" },
        ]
    },
    {
        title: "Marketing",
        courses: [
            { id: 4, title: "Tráfego Pago", price: 297, thumb: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80" },
            { id: 5, title: "SEO Estratégico", price: 197, thumb: "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&w=800&q=80" },
            { id: 6, title: "Copywriting 2.0", price: 347, thumb: "https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=800&q=80" },
        ]
    },
    {
        title: "Design",
        courses: [
            { id: 7, title: "UI/UX Avançado", price: 597, thumb: "https://images.unsplash.com/photo-1587355760421-b9de3226a046?q=80&w=871&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" },
            { id: 8, title: "Figma para Devs", price: 247, thumb: "https://images.unsplash.com/photo-1653647054667-c99dc7f914ef?q=80&w=774&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" },
            { id: 9, title: "Branding EXS", price: 447, thumb: "https://images.unsplash.com/photo-1626785774573-4b799315345d?auto=format&fit=crop&w=800&q=80" },
        ]
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
            <div className="px-12 relative z-30 space-y-16 pb-32">
                {categories.map((cat) => (
                    <div key={cat.title} className="space-y-4">
                        <h2 className="text-2xl font-bold flex items-center gap-2 group cursor-pointer">
                            {cat.title}
                            <ChevronRight className="text-[#00C402] w-6 h-6 opacity-0 group-hover:opacity-100 transition-all" />
                        </h2>
                        <div className="flex gap-4 overflow-x-auto pb-8 scrollbar-hide snap-x">
                            {cat.courses.map((course) => (
                                <Link
                                    href={`/classroom/${course.id}`}
                                    key={course.id}
                                    className="min-w-[300px] md:min-w-[350px] h-[200px] relative rounded-lg overflow-hidden transition-all duration-500 hover:scale-105 hover:z-50 cursor-pointer snap-start group border border-white/10 bg-[#0a1f3a]"
                                >
                                    <img
                                        src={course.thumb}
                                        className="w-full h-full object-cover"
                                        onError={(e) => { e.currentTarget.src = "/images/gpecx.jpg" }}
                                        alt={course.title}
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-[#061629] via-[#061629]/60 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 p-6 flex flex-col justify-end">
                                        <div className="space-y-3">
                                            <h3 className="font-black text-white text-xl italic uppercase tracking-tighter leading-none">{course.title}</h3>
                                            <div className="flex items-center justify-between">
                                                <span className="text-[#00C402] font-black text-lg italic">R$ {course.price}</span>
                                                <div className="bg-[#00C402] text-black text-[10px] font-black px-2 py-1 rounded shadow-lg uppercase italic">Assistir Agora</div>
                                            </div>
                                        </div>
                                    </div>
                                    {/* Preço sempre visível em tag sutil */}
                                    <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md text-[#00C402] text-[10px] font-bold px-2 py-1 rounded border border-white/10 group-hover:opacity-0 transition-opacity">
                                        R$ {course.price}
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}