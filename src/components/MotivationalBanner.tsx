"use client"

import { useState, useEffect } from "react"
import { BannerWrapper } from "@/components/ui/BannerWrapper"

const IMAGES = [
    '/images/study_motivation_1.png',
    '/images/study_motivation_2.png',
    '/images/study_motivation_3.png'
]

export function MotivationalBanner() {
    const [currentIndex, setCurrentIndex] = useState(0)

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % IMAGES.length)
        }, 5000)
        return () => clearInterval(timer)
    }, [])

    return (
        <BannerWrapper>
            <div className="relative h-[400px] overflow-hidden group shadow-2xl rounded-3xl">

                {/* Background Image Carousel */}
                <div className="absolute inset-0 z-0">
                    {IMAGES.map((img, idx) => (
                        <div
                            key={img}
                            className={`absolute inset-0 bg-cover bg-center transition-opacity duration-[1500ms] ease-in-out ${idx === currentIndex ? 'opacity-100' : 'opacity-0'
                                }`}
                            style={{ backgroundImage: `url('${img}')` }}
                        />
                    ))}
                </div>

                {/* Gradient Overlay - Aumentei para 90% para garantir o contraste */}
                <div className="absolute inset-0 z-10 bg-gradient-to-r from-black/90 via-black/50 to-transparent"></div>

                {/* Content - Forçando o Branco */}
                <div className="relative z-20 h-full flex flex-col justify-center p-8 md:p-16 space-y-4 items-start text-left">
                    <h3 className="text-3xl md:text-5xl font-bold tracking-tighter !text-white uppercase leading-[0.95] max-w-2xl drop-shadow-2xl">
                        Foco, Disciplina <br />
                        e Execução.
                    </h3>
                    <p className="!text-white/90 text-sm md:text-base font-medium max-w-lg drop-shadow-md">
                        Grandes conquistas começam com pequenos hábitos diários.
                    </p>

                    {/* Detalhe da marca PowerPlay */}
                    <div className="flex items-center gap-3 pt-4">

                        <span className="!text-white/60 text-[10px] font-bold uppercase tracking-[4px]">

                        </span>
                    </div>
                </div>

                {/* Progress Bars (Dots) */}
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-3 z-30">
                    {IMAGES.map((_, idx) => (
                        <div
                            key={idx}
                            className={`h-1.5 rounded-full transition-all duration-700 ${idx === currentIndex
                                ? 'w-10 bg-[#22c55e]'
                                : 'w-3 bg-white/40'
                                }`}
                        />
                    ))}
                </div>
            </div>
        </BannerWrapper>
    )
}