"use client"

import { X, Play, Info, CheckCircle2, Clock, Globe, ShieldCheck, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState, useEffect } from "react"
import { createPortal } from "react-dom"
import Link from "next/link"

interface CourseModalProps {
    course: any
    isOpen: boolean
    onClose: () => void
}

export default function CourseModal({ course, isOpen, onClose }: CourseModalProps) {
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
        if (isOpen) {
            document.body.style.overflow = 'hidden'
        } else {
            document.body.style.overflow = 'unset'
        }
        return () => {
            document.body.style.overflow = 'unset'
        }
    }, [isOpen])

    if (!mounted || !isOpen || !course) return null

    return createPortal(
        <div
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 md:p-8"
            style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0 }}
        >
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/90 backdrop-blur-md cursor-pointer"
                onClick={onClose}
            />

            {/* Modal Content */}
            <div className="relative w-full max-w-5xl bg-[#061629]/95 backdrop-blur-xl border border-[#1D5F31]/30 overflow-hidden shadow-[0_30px_60px_-15px_rgba(0,0,0,0.8)] animate-in zoom-in-95 duration-300 z-10">
                <button
                    onClick={onClose}
                    className="absolute top-6 right-6 z-20 p-3 bg-black/50 hover:bg-[#1D5F31] hover:text-white text-white transition-all rounded-full border border-white/10 outline-none"
                >
                    <X size={20} />
                </button>

                <div className="flex flex-col md:flex-row min-h-[500px]">
                    {/* Left/Top: Image Column */}
                    <div className="w-full md:w-3/5 relative aspect-video md:aspect-auto overflow-hidden">
                        <img
                            src={course.image_url || "https://images.unsplash.com/photo-1633356122544-f134324a6cee?q=80&w=2070"}
                            alt={course.title}
                            className="w-full h-full object-cover scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#061629] via-transparent to-transparent md:bg-gradient-to-r md:from-transparent md:to-[#061629]" />
                        
                        <div className="absolute top-8 left-8 z-20">
                            <span className="bg-[#1D5F31] text-white text-[10px] font-black px-3 py-1.5 rounded-xl uppercase tracking-[3px] shadow-xl">
                                {course.tag || "PREMIUM"}
                            </span>
                        </div>
                    </div>

                    {/* Right/Bottom: Content Column */}
                    <div className="p-8 md:p-12 md:w-2/5 flex flex-col justify-center bg-[#061629]">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-px bg-[#1D5F31]" />
                            <span className="text-[10px] font-black uppercase tracking-[4px] text-[#1D5F31]">
                                Detalhes do Curso
                            </span>
                        </div>

                        <h2 className="text-3xl md:text-4xl font-black uppercase mb-6 tracking-tighter leading-[0.9]">
                            <span className="text-white !text-white" style={{ color: 'white' }}>{course.title}</span>
                        </h2>

                        {course.teacher_id && (
                            <div className="flex items-center gap-2 mb-6">
                                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest leading-none">Instrutor:</span>
                                <Link 
                                    href={`/professor/${course.teacher_id}` as any}
                                    onClick={onClose}
                                    className="text-[9px] font-black text-[#1D5F31] uppercase tracking-[2px] hover:underline leading-none"
                                >
                                    {course.teacher_name}
                                </Link>
                            </div>
                        )}

                        <p className="text-slate-400 !text-slate-400 text-sm leading-relaxed mb-8 font-medium" style={{ color: '#94a3b8' }}>
                            {course.description || 'Explore técnicas avançadas e domine o mercado com este treinamento exclusivo da PowerPlay.'}
                        </p>

                        {/* Info Grid */}
                        <div className="grid grid-cols-2 gap-y-6 gap-x-4 mb-10">
                            {[
                                { icon: <Clock size={14} />, label: "Duração", text: "12 horas" },
                                { icon: <Globe size={14} />, label: "Idioma", text: "PT-BR" },
                                { icon: <CheckCircle2 size={14} />, label: "Acesso", text: "Total" },
                                { icon: <ShieldCheck size={14} />, label: "Certificado", text: "Incluso" },
                            ].map((item, i) => (
                                <div key={i} className="flex gap-2.5 items-start">
                                    <div className="text-[#1D5F31] mt-0.5">{item.icon}</div>
                                    <div className="flex flex-col">
                                        <span className="text-[9px] uppercase font-bold text-slate-500 tracking-widest mb-0.5">{item.label}</span>
                                        <span className="text-[11px] font-black text-white uppercase tracking-tighter">{item.text}</span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <Link href={`/course/${course.id}`} className="block">
                            <button className="btn-cta w-full flex items-center justify-center gap-3 group">
                                <span className="relative z-10 flex items-center gap-2">
                                    Acessar Agora <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                </span>
                            </button>
                        </Link>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    )
}
