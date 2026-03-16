"use client"

import { useState, useEffect, useCallback } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { BannerItem } from '@/app/admin/settings/actions'

const CAROUSEL_ITEMS = [
    {
        id: 1,
        image: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=1200&q=80",
        title: "TRANSFORME SUA CARREIRA",
        text: "Domine a engenharia de precisão com os maiores especialistas do mercado PowerPlay.",
        accent: "ALTA PERFORMANCE"
    },
    {
        id: 2,
        image: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200&q=80",
        title: "TECNOLOGIA DE PONTA",
        text: "Aprenda a operar sistemas complexos e relés de última geração em tempo real.",
        accent: "FUTURO DA ENGENHARIA"
    },
    {
        id: 3,
        image: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&q=80",
        title: "CONHECIMENTO É PODER",
        text: "Prepare-se para os desafios reais do campo de batalha com simulações práticas.",
        accent: "ESTRATÉGIA & EXECUÇÃO"
    }
]

export function StudentCarousel({ heroBanners }: { heroBanners?: BannerItem[] }) {
    const [currentIndex, setCurrentIndex] = useState(0)

    const displayItems = heroBanners && heroBanners.length > 0
        ? [...heroBanners]
            .sort((a, b) => a.order - b.order)
            .map((banner, idx) => ({
                id: idx + 1,
                image: banner.url,
                title: CAROUSEL_ITEMS[idx % CAROUSEL_ITEMS.length].title,
                text: CAROUSEL_ITEMS[idx % CAROUSEL_ITEMS.length].text,
                accent: CAROUSEL_ITEMS[idx % CAROUSEL_ITEMS.length].accent
            }))
        : CAROUSEL_ITEMS

    const next = useCallback(() => {
        setCurrentIndex((prev) => (prev + 1) % displayItems.length)
    }, [displayItems.length])

    const prev = useCallback(() => {
        setCurrentIndex((prev) => (prev - 1 + displayItems.length) % displayItems.length)
    }, [displayItems.length])

    useEffect(() => {
        if (displayItems.length <= 1) return
        const timer = setInterval(next, 5000)
        return () => clearInterval(timer)
    }, [next, displayItems.length])

    return (
        <section className="mb-12 relative overflow-hidden rounded-none bg-slate-900 aspect-[21/9] md:aspect-[32/10] group">
            {/* Imagens */}
            <div
                className="flex w-full h-full transition-transform duration-700 ease-in-out"
                style={{ transform: `translateX(-${currentIndex * 100}%)` }}
            >
                {displayItems.map((item) => (
                    <div key={item.id} className="relative w-full h-full shrink-0">
                        <img
                            src={item.image}
                            alt={item.title}
                            className="w-full h-full object-cover"
                        />
                    </div>
                ))}
            </div>

            {/* Overlay com Gradiente para alto contraste */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent flex items-center px-8 md:px-20">
                <div className="max-w-2xl animate-in fade-in slide-in-from-left-4 duration-700">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="w-8 h-px bg-[#00C402]" />
                        <span className="text-[10px] font-black uppercase tracking-[5px] text-[#00C402]">
                            {displayItems[currentIndex].accent}
                        </span>
                    </div>
                    <h2 className="text-4xl md:text-6xl font-black text-white tracking-tighter leading-[0.9] mb-6 uppercase drop-shadow-lg">
                        {displayItems[currentIndex].title}
                    </h2>
                    <p className="text-white text-sm md:text-base font-bold uppercase tracking-widest leading-relaxed max-w-xl drop-shadow-md">
                        {displayItems[currentIndex].text}
                    </p>
                </div>
            </div>

            {/* Navegação: Setas */}
            {displayItems.length > 1 && (
                <>
                    <button
                        onClick={prev}
                        className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/90 text-white hover:text-slate-900 rounded-full backdrop-blur-sm transition-all opacity-0 group-hover:opacity-100 shadow-lg"
                    >
                        <ChevronLeft size={24} />
                    </button>
                    <button
                        onClick={next}
                        className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/90 text-white hover:text-slate-900 rounded-full backdrop-blur-sm transition-all opacity-0 group-hover:opacity-100 shadow-lg"
                    >
                        <ChevronRight size={24} />
                    </button>
                </>
            )}

            {/* Pontos de Paginação */}
            {displayItems.length > 1 && (
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
                    {displayItems.map((_, i) => (
                        <button
                            key={i}
                            onClick={() => setCurrentIndex(i)}
                            className={`h-1.5 rounded-full transition-all ${currentIndex === i ? 'w-8 bg-[#00C402]' : 'w-2 bg-white/40 hover:bg-white/60'}`}
                        />
                    ))}
                </div>
            )}
        </section>
    )
}