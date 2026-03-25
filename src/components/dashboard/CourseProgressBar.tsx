'use client'

import { motion } from 'framer-motion'

interface CourseProgressBarProps {
    completedLessons: number
    totalLessons: number
}

export function CourseProgressBar({ completedLessons, totalLessons }: CourseProgressBarProps) {
    const progress = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0

    return (
        <div className="w-full space-y-2">
            <div className="flex items-center justify-between">
                <span className="text-[12px] font-black uppercase tracking-widest text-slate-500">
                    Progresso
                </span>
                <span className="text-[12px] font-black uppercase tracking-widest text-[#1D5F31]">
                    {progress}%
                </span>
            </div>
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                    className="bg-[#1D5F31] h-full shadow-[0_0_10px_rgba(29,95,49,0.3)]"
                />
            </div>
            <div className="flex items-center justify-between text-[10px] font-bold text-slate-400">
                <span>{completedLessons} de {totalLessons} aulas</span>
                <span>{totalLessons - completedLessons} restantes</span>
            </div>
        </div>
    )
}
