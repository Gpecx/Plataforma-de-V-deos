"use client"

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ArrowRight } from 'lucide-react'
import Link from 'next/link'

interface ExpandableCardProps {
    id: string
    thumbnail: string
    title: string
    description: string
    accent?: string
    ranking?: number
}

export function ExpandableCard({ id, thumbnail, title, description, accent, ranking }: ExpandableCardProps) {
    const [isOpen, setIsOpen] = useState(false)

    // Bloqueio de Scroll
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden'
        } else {
            document.body.style.overflow = 'unset'
        }
        return () => {
            document.body.style.overflow = 'unset'
        }
    }, [isOpen])

    return (
        <>
            {/* Card Thumbnail */}
            <motion.div
                layoutId={`card-${id}`}
                onClick={() => setIsOpen(true)}
                className="relative cursor-pointer aspect-[2/3] bg-white rounded-xl overflow-hidden group border border-white/10 hover:border-[#1D5F31] transition-all w-full max-w-[200px] flex items-end shadow-2xl"
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.3 }}
            >
                <div className="absolute inset-0 z-0">
                    <motion.img
                        layoutId={`image-${id}`}
                        src={thumbnail || "https://images.unsplash.com/photo-1633356122544-f134324a6cee?q=80&w=2070"}
                        alt={title}
                        className="w-full h-full object-cover"
                    />
                </div>

                {/* Vertical Gradient Shading: White (top) to Black (bottom) */}
                <div 
                    className="absolute inset-0 z-[1] select-none pointer-events-none"
                    style={{
                        background: 'linear-gradient(180deg, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0) 40%, rgba(0,0,0,0) 60%, rgba(0,0,0,0.95) 100%)'
                    }}
                />

                {/* Ranking Number */}
                {ranking !== undefined && (
                    <div 
                        className="absolute left-[-2px] bottom-[-5px] z-10 select-none pointer-events-none"
                        style={{
                            fontSize: '100px',
                            fontWeight: '900',
                            color: '#000',
                            WebkitTextStroke: '1px rgba(255,255,255,0.6)',
                            lineHeight: '1',
                            fontFamily: 'monospace'
                        }}
                    >
                        {ranking}
                    </div>
                )}
                
                {/* Info Overlay (Thumbnail) */}
                <div className={`absolute inset-0 p-4 flex flex-col justify-end items-end opacity-100 group-hover:opacity-0 transition-opacity z-[11] text-right`}>
                    <span className="text-[10px] font-black text-[#4ADE80] shadow-black drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] uppercase tracking-[2px] mb-0.5">{accent || 'PREMIUM'}</span>
                    <h3 className="text-white font-black text-[11px] line-clamp-2 uppercase leading-tight tracking-wider drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">{title}</h3>
                </div>

                <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-[12]">
                    <div className="flex flex-col items-center gap-2">
                        <span className="text-white font-black uppercase tracking-[3px] text-[10px]">Ver Detalhes</span>
                        <div className="w-8 h-px bg-[#1D5F31]" />
                    </div>
                </div>
            </motion.div>

            {/* Modal & Overlay */}
            <AnimatePresence mode="wait">
                {isOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8">
                        {/* Overlay */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsOpen(false)}
                            className="absolute inset-0 bg-black/90 backdrop-blur-md"
                        />

                        {/* Modal Content */}
                        <motion.div
                            layoutId={`card-${id}`}
                            className="relative w-full max-w-5xl bg-[#061629]/90 backdrop-blur-xl border border-[#1D5F31]/30 rounded-2xl overflow-hidden shadow-[0_30px_60px_-15px_rgba(0,0,0,0.8)]"
                        >
                            {/* Fechar */}
                            <button
                                onClick={() => setIsOpen(false)}
                                className="absolute top-6 right-6 z-20 p-3 bg-black/50 hover:bg-[#1D5F31] hover:text-white text-white transition-all rounded-full border border-white/10"
                            >
                                <X size={20} />
                            </button>

                            <div className="flex flex-col md:flex-row min-h-[400px]">
                                <div className="w-full md:w-3/5 relative aspect-video md:aspect-auto overflow-hidden">
                                    <motion.img
                                        layoutId={`image-${id}`}
                                        src={thumbnail || "https://images.unsplash.com/photo-1633356122544-f134324a6cee?q=80&w=2070"}
                                        alt={title}
                                        className="w-full h-full object-cover scale-105"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-[#061629] via-transparent to-transparent md:bg-gradient-to-r md:from-transparent md:to-[#061629]" />
                                </div>

                                <motion.div 
                                    className="p-8 md:p-12 md:w-2/5 flex flex-col justify-center bg-[#061629]"
                                    initial={{ opacity: 0, x: 40 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    transition={{ delay: 0.3, duration: 0.5, ease: "easeOut" }}
                                >
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="w-10 h-px bg-[#1D5F31]" />
                                        <span className="text-[10px] font-black uppercase tracking-[4px] text-[#1D5F31]">
                                            {accent || 'PREMIUM'}
                                        </span>
                                    </div>
                                    
                                    <h2 className="text-3xl md:text-4xl font-black text-white uppercase mb-6 tracking-tighter leading-[0.9]">
                                        {title}
                                    </h2>
                                    
                                    <p className="text-slate-400 text-sm md:text-base leading-relaxed mb-8 font-medium">
                                        {description || 'Explore técnicas avançadas e domine o mercado com este treinamento exclusivo da PowerPlay.'}
                                    </p>
                                    
                                    <Link 
                                        href={`/course/${id}`}
                                        className="group/btn relative inline-flex items-center justify-center bg-btn-gradient text-white font-black py-4 px-10 uppercase tracking-[3px] text-[11px] hover:brightness-110 rounded-xl transition-all overflow-hidden self-start border border-[#1D5F31]"
                                    >
                                        <span className="relative z-10 flex items-center gap-2">
                                            Acessar Curso <ArrowRight size={16} />
                                        </span>
                                    </Link>
                                </motion.div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    )
}
