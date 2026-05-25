'use client'

import { useEffect, useState } from 'react'
import { getInstructorStatsAction } from '../courses/actions'
import { Users, Star, BookOpen, AlertCircle } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'

interface InstructorStatsData {
    totalStudents: number
    totalReviews: number
    totalCourses: number
    averageRating: number
}

export function InstructorStats() {
    const [stats, setStats] = useState<InstructorStatsData | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        async function fetchStats() {
            try {
                const response = await getInstructorStatsAction()
                if ('error' in response) {
                    setError(response.error as string)
                } else {
                    setStats(response)
                }
            } catch (err) {
                console.error(err)
                setError('Erro ao carregar estatísticas.')
            } finally {
                setLoading(false)
            }
        }
        fetchStats()
    }, [])

    if (loading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {Array.from({ length: 3 }).map((_, idx) => (
                    <div key={idx} className="bg-white p-8 rounded-lg border border-black/20 shadow-sm space-y-6">
                        <Skeleton className="h-14 w-14 rounded-lg" />
                        <Skeleton className="h-3 w-28" />
                        <Skeleton className="h-8 w-24" />
                    </div>
                ))}
            </div>
        )
    }

    if (error) {
        return (
            <div className="bg-red-50/10 border border-red-500/20 p-6 rounded-lg flex items-center gap-4 text-red-500">
                <AlertCircle size={24} />
                <p className="font-bold uppercase tracking-wider text-xs">{error}</p>
            </div>
        )
    }

    const { totalStudents = 0, totalReviews = 0, totalCourses = 0, averageRating = 0.0 } = stats || {}

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Card: Total Alunos */}
            <div className="bg-white p-8 rounded-lg border border-black/20 transition-all duration-300 shadow-sm hover:-translate-y-1 hover:shadow-xl group relative overflow-hidden">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#1D5F31] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="p-4 w-14 h-14 rounded-lg bg-emerald-50 border border-emerald-200 mb-6 flex items-center justify-center transition-all duration-300 group-hover:bg-[#1D5F31] group-hover:scale-110 text-[#1D5F31] group-hover:text-white">
                    <Users size={24} />
                </div>
                <p className="text-slate-500 text-[9px] font-bold uppercase tracking-[4px] mb-1">Total Alunos</p>
                <h3 className="text-3xl font-extrabold tracking-tighter text-slate-900">{totalStudents.toLocaleString('pt-BR')}</h3>
            </div>

            {/* Card: Avaliação Média (Premium Display) */}
            <div className="bg-white p-8 rounded-lg border border-black/20 transition-all duration-300 shadow-sm hover:-translate-y-1 hover:shadow-xl group relative overflow-hidden">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#1D5F31] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="p-4 w-14 h-14 rounded-lg bg-emerald-50 border border-emerald-200 mb-6 flex items-center justify-center transition-all duration-300 group-hover:bg-[#1D5F31] group-hover:scale-110 text-[#1D5F31] group-hover:text-white">
                    <Star size={24} className="fill-[#1D5F31] group-hover:fill-white" />
                </div>
                <p className="text-slate-500 text-[9px] font-bold uppercase tracking-[4px] mb-1">Avaliação Média</p>
                
                <div className="flex items-baseline gap-3">
                    <h3 className="text-5xl font-black tracking-tighter text-[#1D5F31]">
                        {averageRating > 0 ? averageRating.toFixed(1) : '0.0'}
                    </h3>
                    <div className="flex flex-col">
                        <span className="text-[10px] font-bold uppercase text-[#1D5F31] tracking-wider">Pontuação Geral</span>
                        <span className="text-[9px] text-slate-500 font-medium">{totalReviews} avaliações reais</span>
                    </div>
                </div>
            </div>

            {/* Card: Cursos Publicados */}
            <div className="bg-white p-8 rounded-lg border border-black/20 transition-all duration-300 shadow-sm hover:-translate-y-1 hover:shadow-xl group relative overflow-hidden">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#1D5F31] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="p-4 w-14 h-14 rounded-lg bg-emerald-50 border border-emerald-200 mb-6 flex items-center justify-center transition-all duration-300 group-hover:bg-[#1D5F31] group-hover:scale-110 text-[#1D5F31] group-hover:text-white">
                    <BookOpen size={24} />
                </div>
                <p className="text-slate-500 text-[9px] font-bold uppercase tracking-[4px] mb-1">Cursos Publicados</p>
                <h3 className="text-3xl font-extrabold tracking-tighter text-slate-900">{totalCourses}</h3>
            </div>
        </div>
    )
}
