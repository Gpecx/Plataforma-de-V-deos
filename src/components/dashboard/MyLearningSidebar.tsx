"use client"

import { useState } from 'react'
import { Play, TrendingUp, Clock } from 'lucide-react'
import Link from 'next/link'

interface Course {
    id: string
    title: string
    image_url?: string
}

interface MyLearningSidebarProps {
    recentCourses: Course[]
}

export function MyLearningSidebar({ recentCourses }: MyLearningSidebarProps) {
    const [isHovered, setIsHovered] = useState<string | null>(null)

    if (!recentCourses || recentCourses.length === 0) return null

    return (
        <aside className="sticky top-4 w-full flex flex-col gap-4 animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="bg-white rounded-2xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xs font-black uppercase tracking-[3px] text-slate-800">MEU APRENDIZADO</h3>
                    <TrendingUp size={14} className="text-[#1D5F31]" />
                </div>

                <div className="space-y-6">
                    {recentCourses.slice(0, 2).map((curso) => (
                        <div
                            key={curso.id}
                            onMouseEnter={() => setIsHovered(curso.id)}
                            onMouseLeave={() => setIsHovered(null)}
                            className="relative group transition-all duration-300"
                        >
                            <div className="flex items-start gap-4">
                                <div className="w-14 h-14 rounded-xl overflow-hidden bg-slate-100 shrink-0 border border-slate-50 shadow-sm transition-transform duration-300 group-hover:scale-105">
                                    <img
                                        src={curso.image_url || "https://images.unsplash.com/photo-1627398242454-45a1465c2479?w=100"}
                                        className="w-full h-full object-cover"
                                        alt={curso.title}
                                    />
                                </div>
                                <div className="min-w-0 flex-1 py-1">
                                    <h4 className="font-bold text-[11px] text-slate-700 leading-tight truncate uppercase tracking-tighter mb-2 group-hover:text-[#1D5F31] transition-colors">
                                        {curso.title}
                                    </h4>

                                    {/* Barra de Progresso Linear */}
                                    <div className="w-full bg-slate-50 h-1.5 rounded-full overflow-hidden border border-slate-100">
                                        <div
                                            className="bg-[#1D5F31] h-full transition-all duration-1000"
                                            style={{ width: `65%` }}
                                        ></div>
                                    </div>
                                </div>
                            </div>

                            {/* Detalhes ao passar o mouse */}
                            <div className={`mt-4 overflow-hidden transition-all duration-300 ease-in-out ${isHovered === curso.id ? 'max-h-24 opacity-100' : 'max-h-0 opacity-0'}`}>
                                <div className="flex items-center justify-between text-[8px] font-black tracking-widest text-[#1D5F31] mb-4">
                                    <span className="flex items-center gap-1"><Clock size={10} /> 4h restantes</span>
                                    <span>65% CONCLUÍDO</span>
                                </div>
                                <Link href={`/classroom/${curso.id}`}>
                                    <button className="w-full bg-slate-900 text-white text-[9px] font-black uppercase tracking-widest py-3 rounded-xl hover:bg-slate-800 transition flex items-center justify-center gap-2 shadow-md">
                                        <Play size={10} fill="currentColor" /> Continuar Assistindo
                                    </button>
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-8 pt-6 border-t border-slate-50">
                    <Link href={"/dashboard-student/my-courses" as any} className="text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-[#1D5F31] transition-colors flex items-center justify-center gap-2">
                        Ver todos os cursos
                    </Link>
                </div>
            </div>
        </aside>
    )
}
