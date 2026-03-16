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
                className="relative cursor-pointer aspect-[2/3] bg-[#0d2b17] overflow-hidden group border border-[#1e4d2b] hover:border-[#00C402] transition-colors w-full max-w-[200px] flex items-end"
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

                {/* Ranking Number */}
                {ranking !== undefined && (
                    <div 
                        className="absolute left-[-15px] bottom-[-10px] z-10 select-none pointer-events-none"
                        style={{
                            fontSize: '120px',
                            fontWeight: '900',
                            color: '#000',
                            WebkitTextStroke: '2px rgba(255,255,255,0.4)',
                            lineHeight: '1',
                            fontFamily: 'Inter, sans-serif'
                        }}
                    >
                        {ranking}
                    </div>
                )}
                
                {/* Info Overlay (Thumbnail) */}
                <div className={`absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent p-4 flex flex-col justify-end opacity-100 group-hover:opacity-0 transition-opacity z-[5] ${ranking !== undefined ? 'pl-14' : ''}`}>
                    <span className="text-[10px] font-black text-[#00C402] uppercase tracking-[2px] mb-1">{accent || 'PREMIUM'}</span>
                    <h3 className="text-white font-bold text-xs line-clamp-2 uppercase leading-tight">{title}</h3>
                </div>

                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-[5]">
                    <div className="flex flex-col items-center gap-2">
                        <span className="text-white font-black uppercase tracking-[3px] text-[10px]">Ver Detalhes</span>
                        <div className="w-8 h-px bg-[#00C402]" />
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
                            className="relative w-full max-w-5xl bg-[#0f1f14] border border-[#1e4d2b] overflow-hidden shadow-[0_0_50px_rgba(0,196,2,0.15)]"
                        >
                            {/* Fechar */}
                            <button
                                onClick={() => setIsOpen(false)}
                                className="absolute top-6 right-6 z-20 p-3 bg-black/50 hover:bg-[#00C402] hover:text-black text-white transition-all rounded-none border border-white/10"
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
                                    <div className="absolute inset-0 bg-gradient-to-t from-[#0f1f14] via-transparent to-transparent md:bg-gradient-to-r md:from-transparent md:to-[#0f1f14]" />
                                </div>

                                <motion.div 
                                    className="p-8 md:p-12 md:w-2/5 flex flex-col justify-center bg-[#0f1f14]"
                                    initial={{ opacity: 0, x: 40 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    transition={{ delay: 0.3, duration: 0.5, ease: "easeOut" }}
                                >
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="w-10 h-px bg-[#00C402]" />
                                        <span className="text-[10px] font-black uppercase tracking-[4px] text-[#00C402]">
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
                                        className="group/btn relative inline-flex items-center justify-center bg-[#00C402] text-black font-black py-4 px-10 uppercase tracking-[3px] text-[11px] hover:bg-[#00e602] transition-all overflow-hidden self-start"
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
