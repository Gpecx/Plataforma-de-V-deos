"use client";

import { useState, Suspense, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useSearchParams, useRouter } from "next/navigation";
import { Info, ChevronRight, Loader2, Search, User } from "lucide-react";
import { isNewCourse } from "@/lib/date-utils";
import Navbar from "@/components/Navbar";
import CourseModal from "@/components/CourseModal";
import { BannerWrapper } from "@/components/ui/BannerWrapper";
import { useAuth } from "@/context/AuthProvider";
import { normalizeString } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import WishlistButton from "@/components/WishlistButton";
import NextImage from "next/image";
import { useCartStore } from "@/store/useCartStore";
import CourseRow from "./CourseRow";

const heroSlides = [
    {
        title: "CENTRO DE ESTUDOS EM QUALIDADE DA ENERGIA",
        subtitle: "Configuração de malas de teste. • Parametrização de relés de linhas de transmissão. ",
        image: "https://images.unsplash.com/photo-1627398242454-45a1465c2479?auto=format&fit=crop&q=80&w=1600",
        tag: "ORIGINAL POWERPLAY"
    },
    {
        title: "ESTUDO DE PROTEÇÃO E PARAMETRIZAÇÃO DE RELÉS",
        subtitle: "Vamos capacitá-lo para trabalhar com mala de testes de relés computadorizadas e obter competência para testar as diversas tecnologias de relés.",
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
    status: 'APROVADO' | 'PENDENTE' | 'DESATIVADO';
    teacher_id?: string;
    teacher_name?: string;
    tags?: string[];
    pricing_type?: 'free' | 'standard';
    created_at?: any;
}

interface Teacher {
    id: string;
    full_name: string;
    photoURL?: string | null;
    specialty?: string;
    role?: string;
}

interface CoursesClientProps {
    initialCourses: Course[];
    initialTeachers?: Teacher[];
    heroBanners?: string[];
}

function CoursesInner({ initialCourses, initialTeachers = [], heroBanners }: CoursesClientProps) {
    const searchParams = useSearchParams();
    const router = useRouter();
    const searchQuery = searchParams.get('s')?.toLowerCase() || "";
    const { user, profile, loading } = useAuth();
    const purchasedCourseIds = useCartStore(state => state.purchasedCourseIds);

    const [currentSlide, setCurrentSlide] = useState(0);
    const [selectedCourse, setSelectedCourse] = useState<any>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [localSearch, setLocalSearch] = useState("");
    const [activeFilter, setActiveFilter] = useState<'all' | 'free' | 'new'>('all');

    const firstName = profile?.full_name?.split(' ')[0] || '';
    const isLoggedIn = !loading && !!user;

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

    const filteredResults = (() => {
        const query = normalizeString((localSearch || searchQuery).toLowerCase().trim());
        
        const courses = initialCourses.filter(c => {
            if (c.status !== 'APROVADO') return false;
            const matchesSearch = query ? (
                c.title && normalizeString(c.title).includes(query) ||
                c.category && normalizeString(c.category).includes(query) ||
                c.teacher_name && normalizeString(c.teacher_name).includes(query) ||
                (c.tags && c.tags.some((tag: string) => normalizeString(tag).includes(query)))
            ) : true;
            if (!matchesSearch) return false;
            if (activeFilter === 'free') return c.pricing_type === 'free';
            if (activeFilter === 'new') return isNewCourse(c.created_at);
            return true;
        }).map(c => ({ data: c, type: 'course' as const }));

        const teachers = initialTeachers.filter(t => {
            // Professores só aparecem se houver uma busca ativa ou se não houver filtros de preço/novidade
            if (!query) return false;
            return t.full_name && normalizeString(t.full_name).includes(query) || 
                   t.specialty && normalizeString(t.specialty).includes(query);
        }).map(t => ({ data: t, type: 'teacher' as const }));

        return [...courses, ...teachers];
    })();

    const filteredCourses = filteredResults.filter(r => r.type === 'course').map(r => r.data as Course);
    const filteredTeachers = filteredResults.filter(r => r.type === 'teacher').map(r => r.data as Teacher);

    const handleCourseClick = (course: Course) => {
        setSelectedCourse(course);
        setIsModalOpen(true);
    };

    const dynamicCategories = Array.from(new Set(filteredCourses.map(c => c.category || "Lançamentos"))).sort();

    return (
        <div className="min-h-screen bg-[#0B1215] text-white font-montserrat pt-24">

            <section className="relative w-full overflow-hidden">
                <div className="relative aspect-[21/9] md:aspect-[32/10]">
                    {displaySlides.map((slide, index) => (
                        <div key={index} className={`absolute inset-0 transition-opacity duration-1000 ${index === currentSlide ? "opacity-100" : "opacity-0"}`}>
                            <div className="absolute inset-0 bg-gradient-to-t from-[#0B1215] via-slate-900/60 to-transparent z-10" />
                            <NextImage src={slide.image} fill priority={index === 0} className="object-cover scale-105" alt={slide.title} sizes="100vw" />
                        </div>
                    ))}

                    <div className="relative z-20 h-full flex flex-col justify-center px-8 md:px-12 lg:px-24 space-y-6 max-w-3xl pt-32 pb-16">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={isLoggedIn ? 'logged-in' : 'logged-out'}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.3 }}
                                className="flex items-center gap-3"
                            >
                                {isLoggedIn ? (
                                    <span className="bg-[#1D5F31] !text-white text-sm font-bold px-3 py-1 w-fit uppercase tracking-tight shadow-lg shadow-[#1D5F31]/20">
                                        OLÁ, {firstName.toUpperCase()}!
                                    </span>
                                ) : (
                                    <span className="bg-[#1D5F31] !text-white text-sm font-bold px-3 py-1 w-fit uppercase tracking-tight shadow-lg shadow-[#1D5F31]/20">
                                        CURSOS EXCLUSIVOS
                                    </span>
                                )}
                                <div className="h-[1px] w-12 bg-white/20"></div>
                            </motion.div>
                        </AnimatePresence>
                        <AnimatePresence mode="wait">
                            <motion.h1
                                key={isLoggedIn ? 'title-logged-in' : 'title-logged-out'}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.3, delay: 0.1 }}
                                className="text-3xl md:text-5xl lg:text-[3.25rem] font-bold tracking-tighter leading-[0.9] !text-[#22c55e] max-w-2xl"
                            >
                                {isLoggedIn ? "CONTINUE SUA EVOLUÇÃO" : displaySlides[currentSlide]?.title}
                            </motion.h1>
                        </AnimatePresence>
                        <AnimatePresence mode="wait">
                            <motion.p
                                key={isLoggedIn ? 'subtitle-logged-in' : 'subtitle-logged-out'}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.3, delay: 0.2 }}
                                className="text-sm md:text-base !text-white max-w-lg font-medium leading-relaxed"
                            >
                                {isLoggedIn
                                    ? "Sua jornada não para aqui. Explore novos conteúdos exclusivos da nossa curadoria."
                                    : displaySlides[currentSlide]?.subtitle
                                }
                            </motion.p>
                        </AnimatePresence>
                        {/* Botões removidos conforme solicitado */}

                    </div>

                    {displaySlides.length > 1 && (
                        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex gap-2">
                            {displaySlides.map((_, i) => (
                                <button
                                    key={i}
                                    onClick={() => setCurrentSlide(i)}
                                    className={`w-2 h-2 transition-all ${i === currentSlide ? 'bg-[#1D5F31] w-6' : 'bg-white/40'}`}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </section>

            {/* Filtros e Busca */}
            <div className="relative z-30 px-6 md:px-12 mt-12">
                <div className="flex flex-col md:flex-row gap-6 items-center justify-between bg-transparent border-b border-[#1D5F31] pb-4">
                    {/* Filtros Rápidos */}
                    <div className="flex flex-wrap gap-2 w-full md:w-auto">
                        {(['all', 'free', 'new'] as const).map((filter) => {
                            const labels = {
                                all: 'TODOS',
                                free: 'GRATUITO',
                                new: 'NOVO'
                            };
                            const isActive = activeFilter === filter;
                            return (
                                <button
                                    key={filter}
                                    onClick={() => setActiveFilter(filter)}
                                    className={`px-4 py-2 rounded-full text-[11px] font-bold uppercase tracking-widest transition-all duration-300 border ${
                                        isActive 
                                        ? 'bg-[#22c55e] text-[#0B1215] border-[#22c55e] shadow-[0_0_15px_rgba(34,197,94,0.3)] no-theme-override' 
                                        : 'bg-transparent text-slate-400 border-slate-700 hover:border-[#1D5F31] hover:text-[#22c55e]'
                                    }`}
                                >
                                    {labels[filter]}
                                </button>
                            );
                        })}
                    </div>

                    {/* Barra de Pesquisa */}
                    <div className="relative w-full md:max-w-md">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#22c55e]" size={18} />
                        <input 
                            type="text" 
                            placeholder="Buscar treinamentos..." 
                            value={localSearch}
                            onChange={(e) => setLocalSearch(e.target.value)}
                            className="w-full h-10 pl-11 pr-4 bg-transparent border border-slate-700 rounded-lg text-sm font-medium text-white placeholder:text-slate-500 focus:outline-none focus:border-[#22c55e] focus:ring-1 focus:ring-[#22c55e] transition-all"
                        />
                    </div>
                </div>
            </div>

            {/* Título */}
            <div className="relative z-30 px-6 md:px-12 mt-12 mb-8">
                <div className="flex items-center gap-4 mb-2">
                    <div className="w-8 h-[2px] bg-[#22c55e]"></div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Explorar</span>
                </div>
                <h2 className="text-2xl md:text-3xl font-bold tracking-tighter text-[#22c55e]">
                    {localSearch || searchQuery ? `RESULTADOS PARA: ${(localSearch || searchQuery).toUpperCase()}` : "CATÁLOGO DE FORMAÇÃO"}
                </h2>
            </div>

            {/* Resultados de Professores */}
            {filteredTeachers.length > 0 && (
                <div className="px-6 md:px-12 mb-12">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="w-12 h-[2px] bg-[#1D5F31]"></div>
                        <span className="text-sm font-bold uppercase tracking-tight text-[#1D5F31]">Professores Encontrados</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredTeachers.map(teacher => (
                            <div 
                                key={teacher.id} 
                                onClick={() => router.push(`/professor/${teacher.id}` as any)}
                                className="group flex items-center gap-4 p-4 bg-[#131F24] border border-[#1D5F31] rounded-xl hover:border-[#22c55e] transition-all cursor-pointer"
                            >
                                <div className="w-12 h-12 rounded-xl bg-[#0B1215] flex items-center justify-center border border-[#1D5F31] overflow-hidden shrink-0 group-hover:border-[#22c55e] transition-all relative">
                                    {teacher.photoURL ? (
                                        <NextImage src={teacher.photoURL} alt={teacher.full_name} fill className="object-cover" sizes="48px" />
                                    ) : (
                                        <User className="text-slate-400" size={20} />
                                    )}
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-sm font-bold uppercase tracking-tight text-white group-hover:text-[#22c55e] transition-colors">
                                        {teacher.full_name}
                                    </span>
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                                        {teacher.specialty || (teacher.role === 'admin' ? 'Administrador' : 'Instrutor')}
                                    </span>
                                </div>
                                <ChevronRight className="ml-auto text-slate-500 group-hover:text-[#22c55e] transition-all" size={18} />
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Lista de Cursos */}
            <div className="px-6 md:px-12 relative z-30 space-y-16 pb-32">
                {filteredCourses.length === 0 && filteredTeachers.length === 0 ? (
                    <div className="text-center py-20 bg-[#131F24] border border-[#1D5F31] rounded-xl shadow-sm space-y-6">
                        <div className="w-20 h-20 bg-[#1D5F31]/20 flex items-center justify-center mx-auto rounded-full border border-[#1D5F31]/50">
                            <Info size={32} className="text-[#22c55e]" />
                        </div>
                        <p className="text-lg font-bold text-slate-300 uppercase tracking-[3px]">Nenhum treinamento encontrado.</p>
                        <Link href="/course">
                            <Button variant="outline" className="border-[#22c55e] text-[#22c55e] font-bold uppercase tracking-tight text-sm h-12 hover:bg-[#22c55e] hover:text-[#0B1215]">
                                Ver todos os cursos
                            </Button>
                        </Link>
                    </div>
                ) : (
                    // Se houver busca ou filtro ativo, mostra grid normal. Caso contrário, mostra CourseRow paginado.
                    (localSearch || searchQuery || activeFilter !== 'all') ? (
                        dynamicCategories.map(category => {
                            const coursesInCategory = filteredCourses.filter(c => (c.category || "Lançamentos") === category);
                            if (coursesInCategory.length === 0) return null;

                            return (
                                <div key={category} className="space-y-10">
                                    <div className="flex items-end justify-between border-b border-[#1D5F31]/50 pb-4">
                                        <h2 className="text-lg md:text-xl font-bold uppercase tracking-wider flex items-center gap-3 group cursor-pointer text-[#22c55e]">
                                            {category}
                                            <ChevronRight className="text-[#22c55e] w-4 h-4 opacity-40 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                                        </h2>
                                        <span className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1">
                                            {coursesInCategory.length} MÓDULOS ENCONTRADOS
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                                        {coursesInCategory.map(course => (
                                            <div
                                                key={course.id}
                                                onClick={() => handleCourseClick(course)}
                                                className="group bg-[#131F24] border border-slate-800 rounded-xl overflow-hidden hover:border-[#22c55e] transition-all duration-300 flex flex-col hover:shadow-[0_0_20px_rgba(34,197,94,0.15)] cursor-pointer"
                                            >
                                                <div className="aspect-video relative overflow-hidden">
                                                    <NextImage
                                                        src={course.image_url || "https://images.unsplash.com/photo-1633356122544-f134324a6cee?q=80&w=2070"}
                                                        alt={course.title}
                                                        fill
                                                        className="object-cover group-hover:scale-105 transition duration-500"
                                                        sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 20vw"
                                                    />
                                                    <WishlistButton 
                                                        courseId={course.id} 
                                                        isPurchased={profile?.role === 'admin' || (profile?.role === 'teacher' && course.teacher_id === user?.uid) || profile?.cursos_comprados?.includes(course.id) || purchasedCourseIds.includes(course.id)} 
                                                    />
                                                    {/* Badge Logic */}
                                                    {(() => {
                                                        const isPurchased = profile?.role === 'admin' || (profile?.role === 'teacher' && course.teacher_id === user?.uid) || profile?.cursos_comprados?.includes(course.id) || purchasedCourseIds.includes(course.id);
                                                        if (isPurchased) {
                                                            return (
                                                                <div className="absolute top-2 left-2 bg-[#22c55e] !text-[#0B1215] px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest rounded-sm z-10 shadow-lg no-theme-override">
                                                                    ADQUIRIDO
                                                                </div>
                                                            )
                                                        }
                                                        if (course.pricing_type === 'free') {
                                                            return (
                                                                <div className="absolute top-2 left-2 bg-slate-800 !text-white border border-slate-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest rounded-sm z-10 shadow-lg no-theme-override">
                                                                    GRATUITO
                                                                </div>
                                                            )
                                                        }
                                                        if (isNewCourse(course.created_at)) {
                                                            return (
                                                                <div className="absolute top-2 left-2 bg-[#22c55e] !text-[#0B1215] px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest rounded-sm z-10 shadow-lg no-theme-override">
                                                                    NOVO
                                                                </div>
                                                            )
                                                        }
                                                        return null
                                                    })()}
                                                </div>
                                                <div className="p-4 flex-grow flex flex-col space-y-4">
                                                    <h3 className="text-sm font-bold text-white leading-tight group-hover:text-[#22c55e] transition-colors line-clamp-2">
                                                        {course.title}
                                                    </h3>
                                                    <div className="mt-auto pt-3 border-t border-slate-800 flex items-center justify-between">
                                                        <div className="flex flex-col">
                                                            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-widest leading-none mb-1">Investimento</span>
                                                            <span className="text-sm font-bold text-white leading-none">
                                                                {course.price === 0 ? "R$ 0,00" : `R$ ${Number(course.price || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                                                            </span>
                                                        </div>
                                                        {(() => {
                                                            const hasCourse = !!(profile?.role === 'admin' || (profile?.role === 'teacher' && course.teacher_id === user?.uid) || profile?.cursos_comprados?.includes(course.id) || purchasedCourseIds.includes(course.id))
                                                            return (
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation()
                                                                        if (!user) {
                                                                            router.push('/login?redirectTo=%2Fcourse')
                                                                        } else if (hasCourse) {
                                                                            router.push(`/classroom/${course.id}`)
                                                                        } else {
                                                                            useCartStore.getState().addItem({ id: course.id, title: course.title, price: course.price ?? 0, image_url: course.image_url || undefined })
                                                                        }
                                                                    }}
                                                                    className="bg-[#1D5F31] hover:bg-[#22c55e] text-[#22c55e] hover:text-[#0B1215] border border-[#22c55e]/50 text-[10px] px-3 py-1.5 rounded-md font-bold uppercase tracking-widest transition-colors shadow-[0_0_10px_rgba(34,197,94,0.1)]"
                                                                >
                                                                    {!user || !hasCourse ? "ADICIONAR AO CARRINHO" : "CONTINUAR AULA"}
                                                                </button>
                                                            )
                                                        })()}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        dynamicCategories.map(category => {
                            const coursesInCategory = initialCourses
                                .filter(c => (c.category || "Lançamentos") === category)
                                .slice(0, 4); // Limite inicial de 4 cursos por categoria
                            
                            if (coursesInCategory.length === 0) return null;

                            return (
                                <CourseRow
                                    key={category}
                                    category={category}
                                    initialCourses={coursesInCategory}
                                    user={user}
                                    profile={profile}
                                    purchasedCourseIds={purchasedCourseIds}
                                    handleCourseClick={handleCourseClick}
                                />
                            );
                        })
                    )
                )}
            </div>

            {/* Course Modal */}
            {isModalOpen && selectedCourse && (
                <div className="no-theme-override">
                    <CourseModal 
                        course={selectedCourse} 
                        isOpen={isModalOpen} 
                        onClose={() => setIsModalOpen(false)} 
                    />
                </div>
            )}
        </div>
    );
}

export default function CoursesClient({ initialCourses, initialTeachers, heroBanners }: CoursesClientProps) {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-[#0B1215] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="animate-spin text-[#22c55e]" size={40} />
                    <p className="text-sm font-bold uppercase tracking-tight text-slate-500">Preparando Cursos...</p>
                </div>
            </div>
        }>
            <CoursesInner initialCourses={initialCourses} initialTeachers={initialTeachers} heroBanners={heroBanners} />
        </Suspense>
    );
}
