"use client"

import { useRouter } from 'next/navigation'

interface ContinueLessonButtonProps {
    courseId: string
    lessonId?: string
}

export function ContinueLessonButton({ courseId, lessonId }: ContinueLessonButtonProps) {
    const router = useRouter()

    const handleClick = () => {
        if (lessonId) {
            router.push(`/classroom/${courseId}?lessonId=${lessonId}`)
        } else {
            router.push(`/classroom/${courseId}`)
        }
    }

    return (
        <button 
            onClick={handleClick}
            className="w-full bg-black text-white font-black uppercase text-[11px] tracking-widest py-4 rounded-xl hover:bg-[#1D5F31] transition-all shadow-md active:scale-95"
        >
            Continuar Aula
        </button>
    )
}
