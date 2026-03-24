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
            <div className="h-[400px] overflow-hidden relative group shadow-2xl bg-slate-900">
                {/* Background Image Carousel */}
                <div className="absolute inset-0 w-full h-full">
                    {IMAGES.map((img, idx) => (
                        <div
                            key={img}
                            className={`absolute inset-0 bg-cover bg-center transition-opacity duration-[2000ms] ease-in-out ${idx === currentIndex ? 'opacity-100' : 'opacity-0'
                                }`}
                            style={{ backgroundImage: `url('${img}')` }}
                        />
                    ))}
                </div>

                {/* Overlay for "Discrete" look */}
                <div className="absolute inset-0 bg-black/50 backdrop-blur-[1px] transition-colors group-hover:bg-black/40"></div>

                {/* Content */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-12 space-y-6">

                    <h3 className="text-xl md:text-4xl font-black !text-white tracking-[0.2em] uppercase leading-tight max-w-3xl drop-shadow-2xl animate-in fade-in zoom-in duration-1000">
                        Foco, Disciplina e Execução.<br />
                        <span className="!text-white">O seu futuro começa no conhecimento.</span>
                    </h3>
                    <div className="flex items-center gap-4 mt-4">
                    </div>
                </div>

                {/* Dots Indicator */}
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2">
                    {IMAGES.map((_, idx) => (
                        <div
                            key={idx}
                            className={`h-1 rounded-full transition-all duration-500 ${idx === currentIndex ? 'w-8 bg-[#1D5F31]' : 'w-2 bg-white/20'
                                }`}
                        />
                    ))}
                </div>
            </div>
        </BannerWrapper>
    )
}
