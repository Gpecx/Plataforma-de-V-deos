"use client"

import { useRouter } from 'next/navigation'

interface ContinueLessonButtonProps {
    courseId: string
}

export function ContinueLessonButton({ courseId }: ContinueLessonButtonProps) {
    const router = useRouter()

    return (
        <button 
            onClick={() => router.push(`/classroom/${courseId}`)}
            className="w-full bg-black text-white font-black uppercase text-[11px] tracking-widest py-4 rounded-xl hover:bg-[#1D5F31] transition-all shadow-md active:scale-95"
        >
            Continuar Aula
        </button>
    )
}
