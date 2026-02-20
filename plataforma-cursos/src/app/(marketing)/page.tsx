"use client"

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, PlayCircle, TrendingUp, Handshake, BarChart3 } from "lucide-react";
import Navbar from "@/components/Navbar"

const backgroundImages = [
    "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=2000",
    "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=2000",
    "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=2000",
    "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&q=80&w=2000"
];

import { welcomeCourses } from "@/data/courses-data";

export default function WelcomePage() {
    const [currentImage, setCurrentImage] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentImage((prev) => (prev + 1) % backgroundImages.length);
        }, 6000);
        return () => clearInterval(timer);
    }, []);

    return (
        <div className="min-h-screen bg-[#061629] text-white font-['Exo'] relative overflow-hidden">
            {/* Background Image Carousel with Overlay */}
            <div className="absolute inset-0 z-0">
                {backgroundImages.map((img, index) => (
                    <div
                        key={index}
                        className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${index === currentImage ? "opacity-30" : "opacity-0"
                            }`}
                    >
                        <img
                            src={img}
                            alt=""
                            className={`w-full h-full object-cover transition-transform duration-[6000ms] ease-linear ${index === currentImage ? "scale-110" : "scale-100"
                                }`}
                        />
                    </div>
                ))}
                {/* Layered Overlays for depth and readability */}
                <div className="absolute inset-0 bg-gradient-to-b from-[#061629]/90 via-transparent to-[#061629]"></div>
                <div className="absolute inset-0 bg-gradient-to-r from-[#061629] via-[#061629]/60 to-transparent"></div>
            </div>

            <Navbar />

            {/* HERO SECTION */}
            <main className="relative z-10 max-w-7xl mx-auto px-6 pt-40 pb-24 grid lg:grid-cols-2 gap-12 items-center">
                <div className="space-y-8 animate-in fade-in slide-in-from-left duration-1000">
                    <h1 className="text-4xl md:text-6xl font-black leading-tight italic uppercase tracking-tighter text-white">
                        Domine novas <br />
                        <span className="text-[#00C402]">habilidades</span> agora.
                    </h1>
                    <p className="text-gray-200 text-lg md:text-2xl max-w-lg font-bold">
                        A plataforma de educação corporativa da EXS Solutions que conecta tecnologia e crescimento profissional imediato.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 pt-4">
                        <Link href="/login">
                            <Button size="lg" className="bg-[#00C402] hover:bg-white text-black px-10 py-8 text-xl group font-black uppercase italic tracking-widest rounded-2xl shadow-[0_0_30px_rgba(0,196,2,0.4)] transition-all">
                                Conecte-se
                                <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
                            </Button>
                        </Link>
                        <Link href="/register">
                            <Button size="lg" variant="outline" className="border-white/30 hover:bg-white/10 px-10 py-8 text-xl font-black uppercase italic tracking-widest rounded-2xl backdrop-blur-md">
                                Inscrever-se
                            </Button>
                        </Link>
                    </div>
                </div>

                <div className="relative group">
                    <div className="absolute -inset-2 bg-gradient-to-r from-[#00C402] to-[#1D5F31] rounded-3xl blur-xl opacity-20 group-hover:opacity-40 transition duration-1000"></div>
                    <div className="relative aspect-video rounded-3xl overflow-hidden border border-white/20 bg-[#0a1f3a] shadow-2xl">
                        <img
                            src="/images/gpecx.jpg"
                            alt="Painéis de LED EXS"
                            className="object-cover w-full h-full opacity-80 group-hover:scale-105 transition duration-700"
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-transparent transition-colors">
                            <PlayCircle className="w-24 h-24 text-[#00C402] drop-shadow-[0_0_15px_rgba(0,196,2,0.5)] group-hover:scale-110 transition cursor-pointer" />
                        </div>
                    </div>
                </div>
            </main>

            {/* CURSOS - SUBIU PARA CIMA (ORDER 2) */}
            <section className="py-24 max-w-7xl mx-auto px-6 space-y-20 relative z-10">
                <div className="text-center space-y-6">
                    <h2 className="text-4xl md:text-6xl font-black italic uppercase tracking-tighter text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.5)]">
                        EXPLORE NOSSOS <span className="text-[#00C402]">MELHORES TREINAMENTOS</span>
                    </h2>
                    <p className="text-white text-xl md:text-2xl max-w-3xl mx-auto font-black uppercase italic tracking-tight opacity-90">
                        Capacite-se com quem domina o mercado. Resultados práticos e aplicação imediata.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-12">
                    {welcomeCourses.map((course, i) => (
                        <div key={i} className="group bg-[#0a1f3a]/90 border border-white/20 rounded-[2rem] overflow-hidden hover:border-[#00C402]/60 transition-all duration-500 flex flex-col hover:shadow-[0_0_50px_rgba(0,196,2,0.25)] hover:-translate-y-2">
                            <Link href={`/course/${course.slug}`}>
                                <div className="aspect-video relative overflow-hidden">
                                    <img src={course.image} alt={course.title} className="object-cover w-full h-full group-hover:scale-110 transition duration-1000 opacity-90" />
                                    <div className="absolute top-4 right-4 bg-black/80 backdrop-blur-md border border-[#00C402]/40 text-[#00C402] px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest">
                                        {course.tag}
                                    </div>
                                </div>
                            </Link>
                            <div className="p-10 flex-grow flex flex-col space-y-6">
                                <Link href={`/course/${course.slug}`}>
                                    <h3 className="text-3xl font-black text-white leading-tight uppercase italic group-hover:text-[#00C402] transition-colors drop-shadow-sm">{course.title}</h3>
                                </Link>
                                <p className="text-white text-base leading-relaxed font-bold opacity-100 shadow-black drop-shadow-md">{course.description}</p>
                                <div className="pt-8 mt-auto border-t border-white/10 flex items-center justify-between">
                                    <div className="flex flex-col">
                                        <span className="text-[11px] text-gray-300 uppercase font-black tracking-widest leading-none mb-2">Investimento Total</span>
                                        <span className="text-3xl font-black text-[#00C402] italic drop-shadow-[0_0_10px_rgba(0,196,2,0.3)]">R$ {course.price},00</span>
                                    </div>
                                    <Link href={`/course/${course.slug}`}>
                                        <Button className="bg-[#00C402] text-black hover:bg-white hover:scale-105 transition-all font-black uppercase tracking-widest text-xs px-8 py-7 rounded-2xl shadow-xl">
                                            Matricular
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="text-center pt-10">
                    <Link href="/course">
                        <Button variant="link" className="text-white hover:text-[#00C402] font-black uppercase tracking-widest text-sm border-b-2 border-white/10 hover:border-[#00C402] pb-1 transition-all">
                            Ver catálogo completo de treinamentos agora
                        </Button>
                    </Link>
                </div>
            </section>

            {/* DIFERENCIAIS - DESCEU PARA BAIXO (ORDER 3) */}
            <section className="bg-black/60 py-32 relative overflow-hidden z-10 mt-12">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-px bg-gradient-to-r from-transparent via-[#00C402]/50 to-transparent"></div>
                <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-3 gap-12 relative z-10">
                    {[
                        { icon: <TrendingUp size={48} />, title: "Crescimento", desc: "Acelere sua evolução técnica com trilhas pensadas para o mercado real." },
                        { icon: <Handshake size={48} />, title: "Soluções", desc: "Metodologias exclusivas que transformam desafios em oportunidades." },
                        { icon: <BarChart3 size={48} />, title: "Resultados", desc: "Métricas claras e acompanhamento em tempo real do seu progresso." },
                    ].map((item, i) => (
                        <div
                            key={i}
                            className="p-12 rounded-[2.5rem] bg-white/5 backdrop-blur-2xl border border-white/10 hover:border-[#00C402]/50 transition-all duration-700 group cursor-default hover:-translate-y-4 hover:shadow-[0_30px_60px_rgba(0,0,0,0.6),0_0_40px_rgba(0,196,2,0.2)] flex flex-col items-center text-center"
                        >
                            <div className="relative mb-8">
                                <div className="absolute inset-0 bg-[#00C402] blur-3xl opacity-0 group-hover:opacity-30 transition-opacity"></div>
                                <div className="text-[#00C402] relative z-10 group-hover:scale-125 transition-transform duration-700">{item.icon}</div>
                            </div>
                            <h3 className="text-3xl font-black mb-4 italic uppercase tracking-tighter text-white drop-shadow-md">{item.title}</h3>
                            <p className="text-white text-base leading-relaxed font-bold opacity-80">{item.desc}</p>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
}
