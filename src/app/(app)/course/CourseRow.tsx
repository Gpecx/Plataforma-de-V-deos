"use client";

import { useState } from "react";
import { ChevronRight, Loader2 } from "lucide-react";
import NextImage from "next/image";
import { useRouter } from "next/navigation";
import WishlistButton from "@/components/WishlistButton";
import { isNewCourse } from "@/lib/date-utils";
import { getCoursesByCategory } from "./actions";
import { useCartStore } from "@/store/useCartStore";

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

interface CourseRowProps {
    category: string;
    initialCourses: Course[];
    user: any;
    profile: any;
    purchasedCourseIds: string[];
    handleCourseClick: (course: Course) => void;
}

export default function CourseRow({ 
    category, 
    initialCourses, 
    user, 
    profile, 
    purchasedCourseIds, 
    handleCourseClick 
}: CourseRowProps) {
    const router = useRouter()
    const [courses, setCourses] = useState<Course[]>(initialCourses);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(initialCourses.length === 4); // Se veio 4, pode haver mais. Se veio menos, já acabou.
    const [lastVisibleId, setLastVisibleId] = useState<string | undefined>(
        initialCourses.length > 0 ? initialCourses[initialCourses.length - 1].id : undefined
    );

    const loadMore = async () => {
        if (isLoadingMore || !hasMore) return;
        
        setIsLoadingMore(true);
        try {
            const result = await getCoursesByCategory(category, 4, lastVisibleId);
            if (result.courses.length > 0) {
                setCourses(prev => [...prev, ...result.courses]);
                setLastVisibleId(result.lastVisibleId || undefined);
                setHasMore(result.hasMore);
            } else {
                setHasMore(false);
            }
        } catch (error) {
            console.error("Erro ao carregar mais cursos:", error);
        } finally {
            setIsLoadingMore(false);
        }
    };

    return (
        <div className="space-y-10">
            <div className="flex items-end justify-between border-b border-[#1D5F31]/50 pb-4">
                <h2 className="text-lg md:text-xl font-bold uppercase tracking-wider flex items-center gap-3 group cursor-pointer text-[#22c55e]">
                    {category}
                    <ChevronRight className="text-[#22c55e] w-4 h-4 opacity-40 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                </h2>
                <span className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1">
                    {courses.length} {courses.length === 1 ? 'MÓDULO DISPONÍVEL' : 'MÓDULOS EXIBIDOS'}
                </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                {courses.map(course => (
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

            {hasMore && (
                <div className="flex justify-center pt-4">
                    <button
                        onClick={loadMore}
                        disabled={isLoadingMore}
                        className="bg-[#22c55e] text-[#0B1215] px-8 py-3 rounded-lg font-bold uppercase tracking-widest text-xs hover:bg-[#16a34a] transition-all flex items-center gap-2 shadow-[0_0_15px_rgba(34,197,94,0.3)] hover:shadow-[0_0_20px_rgba(34,197,94,0.5)] active:scale-95 disabled:opacity-70"
                    >
                        {isLoadingMore ? (
                            <>
                                <Loader2 className="animate-spin text-[#0B1215]" size={16} />
                                Carregando...
                            </>
                        ) : (
                            "Ver mais"
                        )}
                    </button>
                </div>
            )}
        </div>
    );
}
