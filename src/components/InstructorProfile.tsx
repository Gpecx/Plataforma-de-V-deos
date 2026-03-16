'use client'

import { useState } from 'react'
import {
    Users,
    Star,
    BookOpen,
    Globe,
    Linkedin as LinkedInIcon,
    Twitter as TwitterIcon,
    Youtube as YouTubeIcon,
    ChevronRight,
    Loader2
} from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { getInstructorCourses } from '@/app/actions/instructor'

interface Instructor {
    id: string
    full_name: string
    role: string
    avatar_url: string | null
    bio: string
    specialty: string
    social: {
        linkedin: string | null
        twitter: string | null
        website: string | null
        youtube: string | null
    }
}

interface Stats {
    totalStudents: number
    totalReviews: number
    totalCourses: number
    averageRating: number
}

interface InstructorProfileProps {
    instructor: Instructor
    stats: Stats
    initialCourses: any[]
    initialLastId: string | null
    initialHasMore: boolean
}

export default function InstructorProfile({
    instructor,
    stats,
    initialCourses,
    initialLastId,
    initialHasMore
}: InstructorProfileProps) {
    const [courses, setCourses] = useState(initialCourses)
    const [lastId, setLastId] = useState(initialLastId)
    const [hasMore, setHasMore] = useState(initialHasMore)
    const [isLoadingMore, setIsLoadingMore] = useState(false)

    const handleLoadMore = async () => {
        if (!lastId || isLoadingMore) return
        setIsLoadingMore(true)
        try {
            const result = await getInstructorCourses(instructor.id, 10, lastId)
            setCourses(prev => [...prev, ...result.courses])
            setLastId(result.lastId)
            setHasMore(result.hasMore)
        } catch (error) {
            console.error('Error loading more courses:', error)
        } finally {
            setIsLoadingMore(false)
        }
    }

    return (
        <div className="max-w-7xl mx-auto px-6 pt-4 pb-12 md:pt-6 md:pb-24 font-exo">

            {/* Layout principal: GRID de 2 colunas */}
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-12 lg:gap-16 items-start">

                {/* ── COLUNA 1: Conteúdo Principal ── */}
                <div className="min-w-0 space-y-12">
                    {/* Identidade */}
                    <div className="space-y-4">
                        <span className="text-[#00C402] text-[10px] font-black uppercase tracking-[5px] block">
                            INSTRUTOR ORIGINAL POWERPLAY
                        </span>
                        <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-slate-900 leading-none uppercase">
                            {instructor.full_name}
                        </h1>
                        <p className="text-lg font-bold text-slate-500 tracking-tight uppercase">
                            {instructor.specialty}
                        </p>
                    </div>

                    {/* Stats */}
                    <div className="flex flex-wrap gap-x-12 gap-y-6">
                        <div className="space-y-1">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-[2px]">Total de Alunos</p>
                            <div className="flex items-center gap-2">
                                <Users size={16} className="text-[#00C402]" />
                                <span className="text-2xl font-black text-slate-800 tracking-tighter">
                                    {stats.totalStudents.toLocaleString()}
                                </span>
                            </div>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-[2px]">Avaliações</p>
                            <div className="flex items-center gap-2">
                                <Star size={16} className="text-yellow-500 fill-yellow-500" />
                                <span className="text-2xl font-black text-slate-800 tracking-tighter">
                                    {stats.totalReviews.toLocaleString()}
                                </span>
                            </div>
                        </div>
                        <div className="space-y-1 border-l border-slate-100 pl-12 hidden md:block">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-[2px]">Nota Média</p>
                            <div className="flex items-center gap-2">
                                <Star size={16} className="text-yellow-500" />
                                <span className="text-2xl font-black text-slate-800 tracking-tighter">
                                    {stats.averageRating.toFixed(1)}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Bio */}
                    <div className="space-y-4 pt-4">
                        <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter border-l-4 border-[#00C402] pl-4">
                            Sobre mim
                        </h3>
                        <p className="text-slate-500 text-base leading-relaxed font-medium">
                            {instructor.bio}
                        </p>
                    </div>

                    {/* Cursos */}
                    <div className="space-y-8 pt-8">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter">
                                Meus Cursos ({stats.totalCourses})
                            </h3>
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-[2px]">
                                LANÇAMENTOS RECENTES
                            </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {courses.map(course => (
                                <Link
                                    key={course.id}
                                    href={`/course/${course.id}`}
                                    className="group bg-white border border-slate-100 rounded-2xl overflow-hidden hover:border-[#00C402]/30 transition-all duration-300 flex flex-col shadow-sm hover:shadow-lg"
                                >
                                    <div className="aspect-video relative overflow-hidden bg-slate-100">
                                        {course.image_url ? (
                                            <img
                                                src={course.image_url}
                                                alt={course.title}
                                                className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-slate-300">
                                                <BookOpen size={32} />
                                            </div>
                                        )}
                                        <div className="absolute top-2 right-2 bg-white/95 backdrop-blur-sm border border-slate-100 text-[#00C402] px-2 py-0.5 rounded-full text-[7px] font-black uppercase tracking-widest shadow-sm">
                                            {course.tag || 'PREMIUM'}
                                        </div>
                                    </div>
                                    <div className="p-4 flex-grow flex flex-col justify-between">
                                        <div className="space-y-1">
                                            <p className="text-[7px] font-black text-[#00C402] uppercase tracking-[2px]">
                                                {course.category || 'Módulo'}
                                            </p>
                                            <h4 className="text-xs font-black text-slate-800 leading-tight group-hover:text-[#00C402] transition-colors line-clamp-2 uppercase tracking-tighter">
                                                {course.title}
                                            </h4>
                                        </div>
                                        <div className="mt-4 pt-3 border-t border-slate-50 flex items-center justify-between">
                                            <div>
                                                <span className="text-[7px] text-slate-400 uppercase font-black tracking-widest leading-none block mb-1">
                                                    Acesso
                                                </span>
                                                <span className="text-sm font-black text-slate-900 leading-none tracking-tighter">
                                                    R$ {Number(course.price || 0).toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
                                                </span>
                                            </div>
                                            <div className="w-7 h-7 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-[#00C402] group-hover:text-white transition-all">
                                                <ChevronRight size={14} />
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>

                        {hasMore && (
                            <div className="flex justify-center pt-4">
                                <Button
                                    onClick={handleLoadMore}
                                    disabled={isLoadingMore}
                                    className="bg-slate-900 text-white hover:bg-slate-800 h-12 px-10 text-[10px] font-black uppercase tracking-[3px] rounded-xl transition-all shadow-xl active:scale-95"
                                >
                                    {isLoadingMore ? (
                                        <>
                                            <Loader2 className="animate-spin mr-2" size={16} />
                                            Carregando...
                                        </>
                                    ) : (
                                        'Carregar mais cursos'
                                    )}
                                </Button>
                            </div>
                        )}
                    </div>
                </div>

                {/* ── COLUNA 2: Sidebar Fixa ── */}
                <aside className="hidden lg:block">
                    <div className="sticky top-24 flex flex-col items-center space-y-6">
                        {/* Avatar */}
                        <div className="w-[200px] h-[200px] rounded-full overflow-hidden border-[4px] border-white shadow-xl relative bg-slate-200 shrink-0">
                            {instructor.avatar_url ? (
                                <img
                                    src={instructor.avatar_url}
                                    alt={instructor.full_name}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-slate-400">
                                    <Users size={60} />
                                </div>
                            )}
                        </div>

                        {/* Divisor */}
                        <div className="w-full h-px bg-slate-100" />

                        {/* Redes sociais */}
                        <div className="space-y-4 w-full text-center">
                            <h2 className="text-[10px] font-black uppercase tracking-[3px] text-slate-400">
                                Redes & Links
                            </h2>
                            <div className="flex flex-wrap justify-center gap-3">
                                {instructor.social.website && (
                                    <a href={instructor.social.website} target="_blank" rel="noopener noreferrer" className="p-3 bg-white border border-slate-100 rounded-xl hover:text-[#00C402] hover:border-[#00C402]/30 transition shadow-sm"><Globe size={18} /></a>
                                )}
                                {instructor.social.linkedin && (
                                    <a href={instructor.social.linkedin} target="_blank" rel="noopener noreferrer" className="p-3 bg-white border border-slate-100 rounded-xl hover:text-blue-600 hover:border-blue-600/30 transition shadow-sm"><LinkedInIcon size={18} /></a>
                                )}
                                {instructor.social.twitter && (
                                    <a href={instructor.social.twitter} target="_blank" rel="noopener noreferrer" className="p-3 bg-white border border-slate-100 rounded-xl hover:text-sky-500 hover:border-sky-500/30 transition shadow-sm"><TwitterIcon size={18} /></a>
                                )}
                                {instructor.social.youtube && (
                                    <a href={instructor.social.youtube} target="_blank" rel="noopener noreferrer" className="p-3 bg-white border border-slate-100 rounded-xl hover:text-red-600 hover:border-red-600/30 transition shadow-sm"><YouTubeIcon size={18} /></a>
                                )}
                            </div>
                        </div>
                    </div>
                </aside>

            </div>
        </div>
    )
}