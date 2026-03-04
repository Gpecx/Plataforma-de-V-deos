"use client"

import { useState, useEffect, useCallback } from 'react'
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react'

const CAROUSEL_ITEMS = [
    {
        id: 1,
        image: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=1200&q=80",
        title: "TRANSFORME SUA CARREIRA",
        text: "Domine a engenharia de precisão com os maiores especialistas do mercado SPCS Academy.",
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

export function StudentCarousel() {
    const [currentIndex, setCurrentIndex] = useState(0)

    const next = useCallback(() => {
        setCurrentIndex((prev) => (prev + 1) % CAROUSEL_ITEMS.length)
    }, [])

    const prev = useCallback(() => {
        setCurrentIndex((prev) => (prev - 1 + CAROUSEL_ITEMS.length) % CAROUSEL_ITEMS.length)
    }, [])

    useEffect(() => {
        const timer = setInterval(next, 5000)
        return () => clearInterval(timer)
    }, [next])

    return (
        <section className="mb-12 relative overflow-hidden rounded-2xl bg-slate-100 aspect-[21/9] md:aspect-[32/10] group shadow-xl">
            {/* Imagens */}
            <div
                className="flex w-full h-full transition-transform duration-700 ease-in-out"
                style={{ transform: `translateX(-${currentIndex * 100}%)` }}
            >
                {CAROUSEL_ITEMS.map((item) => (
                    <div key={item.id} className="relative w-full h-full shrink-0">
                        <img
                            src={item.image}
                            alt={item.title}
                            className="w-full h-full object-cover"
                        />
                    </div>
                ))}
            </div>

            {/* Overlay: Card Branco Estilo Udemy */}
            <div className="absolute inset-0 flex items-center px-8 md:px-20 pointer-events-none">
                <div className="bg-white/95 backdrop-blur-sm p-6 md:p-10 rounded-2xl shadow-2xl max-w-lg animate-in fade-in slide-in-from-left-4 duration-700 pointer-events-auto border border-slate-100">
                    <div className="flex items-center gap-2 mb-3">
                        <Sparkles size={14} className="text-[#00C402]" />
                        <span className="text-[9px] font-black uppercase tracking-[3px] text-[#00C402]">{CAROUSEL_ITEMS[currentIndex].accent}</span>
                    </div>
                    <h2 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tighter leading-none mb-4">
                        {CAROUSEL_ITEMS[currentIndex].title.split(' ')[0]} <br />
                        <span className="text-[#00C402]">{CAROUSEL_ITEMS[currentIndex].title.split(' ').slice(1).join(' ')}</span>
                    </h2>
                    <p className="text-slate-500 text-xs md:text-sm font-medium leading-relaxed">
                        {CAROUSEL_ITEMS[currentIndex].text}
                    </p>
                </div>
            </div>

            {/* Navegação: Setas */}
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

            {/* Pontos de Paginação */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
                {CAROUSEL_ITEMS.map((_, i) => (
                    <button
                        key={i}
                        onClick={() => setCurrentIndex(i)}
                        className={`h-1.5 rounded-full transition-all ${currentIndex === i ? 'w-8 bg-[#00C402]' : 'w-2 bg-white/40 hover:bg-white/60'}`}
                    />
                ))}
            </div>
        </section>
    )
}
