"use client"

import { X, Play, Info, CheckCircle2, Clock, Globe, ShieldCheck, ArrowRight } from "lucide-react"
import { isNewCourse } from "@/lib/date-utils"
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
            <div 
                className="relative w-[95vw] md:w-[800px] lg:w-[900px] h-auto max-h-[85vh] overflow-hidden flex flex-col md:flex-row rounded-none border border-slate-800 bg-[#060b13] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.8)] animate-in zoom-in-95 duration-300 z-10"
                style={{
                    width: 'min(95vw, 900px)',
                    height: 'auto',
                    maxHeight: '85vh',
                }}
            >
                <button
                    onClick={onClose}
                    className="absolute top-6 right-6 z-20 p-3 bg-black/50 hover:bg-[#1D5F31] hover:text-white text-white transition-all rounded-full border border-white/10 outline-none"
                >
                    <X size={20} />
                </button>

                {/* Left/Top: Image Column */}
                <div className="w-full md:w-3/5 relative aspect-video md:aspect-auto overflow-hidden">
                    <img
                        src={course.image_url || "https://images.unsplash.com/photo-1633356122544-f134324a6cee?q=80&w=2070"}
                        alt={course.title}
                        className="w-full h-full object-cover scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#061629] via-transparent to-transparent md:bg-gradient-to-r md:from-transparent md:to-[#061629]" />

                    <div className="absolute top-8 left-8 z-20">
                        {(() => {
                            if (course.pricing_type === 'premium') {
                                return (
                                    <div className="bg-[#1D5F31] !text-white px-3 py-1.5 text-[10px] font-bold uppercase tracking-[3px] rounded-sm shadow-xl no-theme-override">
                                        PREMIUM
                                    </div>
                                )
                            }
                            if (course.pricing_type === 'free') {
                                return (
                                    <div className="bg-black !text-white px-3 py-1.5 text-[10px] font-bold uppercase tracking-[3px] rounded-sm shadow-xl no-theme-override">
                                        GRATUITO
                                    </div>
                                )
                            }
                            if (isNewCourse(course.created_at)) {
                                return (
                                    <div className="bg-white !text-[#1D5F31] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[3px] rounded-sm shadow-xl no-theme-override">
                                        NOVO
                                    </div>
                                )
                            }
                            return null
                        })()}
                    </div>
                </div>

                {/* Right/Bottom: Content Column */}
                <div className="flex flex-col justify-between p-6 md:p-8 flex-1 min-w-0">
                    <div className="flex-1 flex flex-col overflow-hidden">
                        <div className="flex items-center gap-3 mb-6 shrink-0">
                            <div className="w-10 h-px bg-[#1D5F31]" />
                            <span className="text-[10px] font-bold uppercase tracking-[4px] text-[#1D5F31]">
                                Detalhes do Curso
                            </span>
                        </div>

                        <h2 className="text-3xl md:text-4xl font-bold uppercase mb-6 tracking-tighter leading-[0.9] shrink-0">
                            <span className="text-white !text-white" style={{ color: 'white' }}>{course.title}</span>
                        </h2>

                        {(course.teacher_id || course.teacher_name) && (
                            <div className="flex items-center gap-2 mb-6 shrink-0">
                                {course.teacher_id ? (
                                    <Link
                                        href={`/professor/${course.teacher_id}`}
                                        onClick={onClose}
                                        className="text-[10px] font-bold text-slate-200 uppercase tracking-[2px] hover:text-emerald-400 hover:underline transition-colors leading-none"
                                    >
                                        {course.teacher_name || 'Equipe PowerPlay'}
                                    </Link>
                                ) : (
                                    <span className="text-[10px] font-bold text-slate-200 uppercase tracking-[2px] leading-none">
                                        {course.teacher_name || 'Equipe PowerPlay'}
                                    </span>
                                )}
                            </div>
                        )}

                        <div className="my-2 shrink-0">
                            <p className="text-slate-300 text-sm leading-relaxed line-clamp-2 overflow-hidden text-ellipsis">
                                {course.description && course.description.length > 120 
                                    ? `${course.description.substring(0, 120)}...` 
                                    : (course.description || 'Explore técnicas avançadas e domine o mercado com este treinamento exclusivo da PowerPlay.')}
                            </p>
                        </div>
                    </div>

                    <div className="mt-auto pt-4 shrink-0">
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
                                        <span className="text-[11px] font-bold text-white uppercase tracking-tighter">{item.text}</span>
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
