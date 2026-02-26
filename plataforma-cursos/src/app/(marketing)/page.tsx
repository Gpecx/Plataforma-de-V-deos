"use client"

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, TrendingUp, Handshake, BarChart3, Volume2, VolumeX } from "lucide-react";
import Navbar from "@/components/Navbar"

const backgroundImages = [
    "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=2000",
    "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=2000",
    "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=2000",
    "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&q=80&w=2000"
];

import { createClient } from "@/utils/supabase/client";
import { Loader2 } from "lucide-react";
import CourseModal from "@/components/CourseModal";

export default function WelcomePage() {
    const [courses, setCourses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isMuted, setIsMuted] = useState(true);
    const [selectedCourse, setSelectedCourse] = useState<any>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);
    const supabase = createClient();

    useEffect(() => {
        async function fetchTopCourses() {
            setLoading(true);
            const { data } = await supabase
                .from('courses')
                .select('*')
                .eq('status', 'published')
                .order('created_at', { ascending: false })
                .limit(8);

            if (data) setCourses(data);
            setLoading(false);
        }
        fetchTopCourses();
    }, []);

    const handleCourseClick = (course: any) => {
        setSelectedCourse(course);
        setIsModalOpen(true);
    };

    return (
        <div className="min-h-screen bg-white text-slate-800 font-exo relative overflow-hidden">
            <Navbar />

            {/* HERO SECTION */}
            <main className="relative z-10 max-w-7xl mx-auto px-6 pt-32 pb-20 grid lg:grid-cols-2 gap-12 items-center">
                <div className="space-y-6 animate-in fade-in slide-in-from-left duration-700">
                    <h1 className="text-5xl md:text-7xl font-black leading-[1.1] tracking-tighter text-slate-900">
                        Domine novas habilidades com a <br />
                        <span className="from-[#00C402] to-[#1D5F31] bg-gradient-to-r bg-clip-text text-transparent">EXS Solutions</span>.
                    </h1>
                    <p className="text-slate-700 text-base md:text-lg max-w-lg font-bold">
                        Conectamos tecnologia e crescimento profissional em uma experiência de aprendizado moderna e imediata.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 pt-2">
                        <Link href="/login">
                            <Button size="lg" className="bg-slate-900 hover:bg-slate-800 text-white px-8 py-6 text-sm group font-bold uppercase tracking-widest rounded-lg transition-all shadow-md shadow-inner">
                                Conecte-se
                                <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
                            </Button>
                        </Link>
                        <Link href="/register">
                            <Button size="lg" variant="outline" className="border-slate-200 hover:bg-slate-50 text-slate-700 px-8 py-6 text-sm font-bold uppercase tracking-widest rounded-lg transition-all shadow-sm">
                                Inscrever-se
                            </Button>
                        </Link>
                    </div>
                </div>

                <div className="relative group">
                    <div className="relative aspect-video rounded-2xl overflow-hidden border border-slate-100 bg-slate-50 shadow-xl">
                        <video
                            ref={videoRef}
                            src="/videos/videoplayback (2).mp4"
                            autoPlay
                            muted={isMuted}
                            loop
                            playsInline
                            preload="auto"
                            className="object-cover w-full h-full opacity-90 transition duration-700"
                        />
                        <button
                            onClick={() => setIsMuted(!isMuted)}
                            className="absolute bottom-4 right-4 p-2.5 bg-white/80 backdrop-blur-md rounded-full text-slate-900 border border-slate-100 hover:bg-white transition-all z-20"
                        >
                            {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                        </button>
                    </div>
                </div>
                {/* HERO SECTION */}
            </main>

            {/* CURSOS */}
            <section className="py-20 max-w-7xl mx-auto px-6 space-y-12 relative z-10 border-t border-slate-100 bg-white">
                <div className="space-y-3">
                    <h2 className="text-2xl md:text-3xl font-black tracking-tighter text-slate-800">
                        TREINAMENTOS EM <span className="text-[#00C402]">DESTAQUE</span>
                    </h2>
                    <p className="text-slate-700 text-sm md:text-base max-w-2xl font-bold">
                        Explore nossos melhores conteúdos pensados para sua evolução.
                    </p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {loading ? (
                        <div className="col-span-full flex justify-center py-20">
                            <Loader2 className="animate-spin text-slate-300" size={32} />
                        </div>
                    ) : courses.map((course: any, i: number) => (
                        <div
                            key={i}
                            onClick={() => handleCourseClick(course)}
                            className="group bg-white border border-slate-100 rounded-xl overflow-hidden hover:border-[#00C402]/30 transition-all duration-300 flex flex-col hover:shadow-lg cursor-pointer"
                        >
                            <div className="aspect-video relative overflow-hidden">
                                <img src={course.image_url || "https://images.unsplash.com/photo-1633356122544-f134324a6cee?q=80&w=2070"} alt={course.title} className="object-cover w-full h-full group-hover:scale-105 transition duration-500" />
                                <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm border border-slate-100 text-[#00C402] px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest">
                                    {course.tag || "PREMIUM"}
                                </div>
                            </div>
                            <div className="p-4 flex-grow flex flex-col space-y-3">
                                <h3 className="text-sm font-bold text-slate-700 leading-tight group-hover:text-[#00C402] transition-colors line-clamp-2">{course.title}</h3>
                                <div className="mt-auto pt-3 border-t border-slate-50 flex items-center justify-between">
                                    <div className="flex flex-col">
                                        <span className="text-[8px] text-slate-700 uppercase font-black tracking-widest leading-none mb-0.5">Investimento</span>
                                        <span className="text-sm font-black text-slate-700 leading-none">R$ {course.price},00</span>
                                    </div>
                                    <div className="text-[#00C402] opacity-0 group-hover:opacity-100 transition-opacity">
                                        <ArrowRight size={14} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="text-center pt-6">
                    <Link href="/course">
                        <Button variant="link" className="text-slate-500 hover:text-slate-800 font-bold uppercase tracking-widest text-[10px] border-b border-transparent hover:border-slate-200 pb-1 transition-all">
                            Ver catálogo completo
                        </Button>
                    </Link>
                </div>
            </section>

            {/* SEÇÃO DE BANNERS IMERSIVOS (Clean & Professional) */}
            <section className="relative z-10">
                {/* BANNER 1: OFFICE / EXPERIENCE */}
                <div className="relative h-[600px] w-full overflow-hidden group">
                    <img
                        src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=1976&auto=format&fit=crop"
                        alt="Professional Engineering"
                        className="object-cover w-full h-full group-hover:scale-105 transition duration-[2s] brightness-50"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-slate-900/95 via-slate-900/70 to-transparent flex items-center">
                        <div className="max-w-7xl mx-auto px-6 w-full">
                            <div className="max-w-2xl space-y-6 animate-in fade-in slide-in-from-left duration-1000">
                                <span className="text-[10px] font-black uppercase tracking-[4px] !text-white bg-white/10 backdrop-blur-md px-3 py-1 rounded-full border border-white/10">Experiência</span>
                                <h2 className="text-4xl md:text-6xl font-black !text-white tracking-tighter leading-tight">
                                    APRENDA COM <br />
                                    <span className="!text-white">ESPECIALISTAS</span> DO MERCADO
                                </h2>
                                <p className="!text-white text-lg font-bold leading-relaxed max-w-lg">
                                    Trilhas de conhecimento desenhadas por profissionais que lideram grandes projetos de engenharia e tecnologia.
                                </p>
                                <Link href="/register">
                                    <Button size="lg" className="bg-[#00C402] hover:bg-[#00b302] text-white px-8 py-6 text-sm font-black uppercase tracking-widest rounded-xl transition-all shadow-lg mt-4">
                                        Começar agora
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>

                {/* BANNER 2: LABORATORY / METHODOLOGY */}
                <div className="relative h-[600px] w-full overflow-hidden group">
                    <img
                        src="https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?q=80&w=2070&auto=format&fit=crop"
                        alt="High-Tech Laboratory"
                        className="object-cover w-full h-full group-hover:scale-105 transition duration-[2s] brightness-50"
                    />
                    <div className="absolute inset-0 bg-gradient-to-l from-slate-900/95 via-slate-900/70 to-transparent flex items-center justify-end">
                        <div className="max-w-7xl mx-auto px-6 w-full text-right flex justify-end">
                            <div className="max-w-2xl space-y-6 animate-in fade-in slide-in-from-right duration-1000">
                                <span className="text-[10px] font-black uppercase tracking-[4px] !text-white bg-white/10 backdrop-blur-md px-3 py-1 rounded-full border border-white/10">Metodologia</span>
                                <h2 className="text-4xl md:text-6xl font-black !text-white tracking-tighter leading-tight">
                                    LABORATÓRIOS DA <br />
                                    <span className="!text-white">VIDA REAL</span>
                                </h2>
                                <p className="!text-white text-lg font-bold leading-relaxed max-w-lg ml-auto">
                                    Nossa metodologia foca na resolução de desafios reais, utilizando simuladores e ferramentas de ponta.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* BANNER 3: COLLABORATION / RESULTS */}
                <div className="relative h-[600px] w-full overflow-hidden group">
                    <img
                        src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=2070&auto=format&fit=crop"
                        alt="Collaborative Workspace"
                        className="object-cover w-full h-full group-hover:scale-105 transition duration-[2s] brightness-50"
                    />
                    <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-[2px] flex items-center justify-center text-center">
                        <div className="max-w-4xl mx-auto px-6 space-y-8 animate-in fade-in zoom-in duration-1000">
                            <span className="text-[10px] font-black uppercase tracking-[4px] !text-white bg-white/10 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 inline-block">Resultados</span>
                            <h2 className="text-5xl md:text-7xl font-black !text-white tracking-tighter leading-tight">
                                TRANSFORME SUA <br />
                                <span className="!text-white">CARREIRA</span> HOJE
                            </h2>
                            <p className="!text-white text-xl font-bold leading-relaxed max-w-2xl mx-auto">
                                Junte-se a milhares de alunos que já alcançaram cargos de destaque nas maiores empresas do Brasil.
                            </p>
                            <Link href="/login">
                                <Button size="lg" variant="outline" className="border-white/20 hover:bg-white/10 text-white px-10 py-8 text-base font-black uppercase tracking-[3px] rounded-2xl transition-all shadow-2xl backdrop-blur-xl">
                                    Conecte-se à Comunidade
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* GRID DE BENEFÍCIOS (Final Clean Section) */}
            <section className="bg-white py-24 relative z-10 border-t border-slate-100">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="grid md:grid-cols-3 gap-16">
                        <div className="space-y-4 text-center group">
                            <div className="w-20 h-20 rounded-[32px] bg-slate-50 flex items-center justify-center text-[#00C402] mx-auto shadow-sm border border-slate-100 group-hover:scale-110 transition-transform">
                                <TrendingUp size={36} />
                            </div>
                            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Crescimento</h3>
                            <p className="text-slate-500 text-sm leading-relaxed font-bold">Acelere sua evolução técnica com trilhas pensadas para o mercado real.</p>
                        </div>
                        <div className="space-y-4 text-center group">
                            <div className="w-20 h-20 rounded-[32px] bg-slate-50 flex items-center justify-center text-[#00C402] mx-auto shadow-sm border border-slate-100 group-hover:scale-110 transition-transform">
                                <Handshake size={36} />
                            </div>
                            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Soluções</h3>
                            <p className="text-slate-500 text-sm leading-relaxed font-bold">Metodologias exclusivas que transformam desafios em oportunidades.</p>
                        </div>
                        <div className="space-y-4 text-center group">
                            <div className="w-20 h-20 rounded-[32px] bg-slate-50 flex items-center justify-center text-[#00C402] mx-auto shadow-sm border border-slate-100 group-hover:scale-110 transition-transform">
                                <BarChart3 size={36} />
                            </div>
                            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Resultados</h3>
                            <p className="text-slate-500 text-sm leading-relaxed font-bold">Métricas claras e acompanhamento em tempo real do seu progresso.</p>
                        </div>
                    </div>
                </div>
            </section>

            <CourseModal
                course={selectedCourse}
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
            />
        </div>
    );
}
