"use client"

import { X, Play, Info, CheckCircle2, Clock, Globe, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState, useEffect } from "react"
import Link from "next/link"
import { BuyButton } from "@/components/BuyButton"

interface CourseModalProps {
    course: any
    isOpen: boolean
    onClose: () => void
}

export default function CourseModal({ course, isOpen, onClose }: CourseModalProps) {
    const [isMounted, setIsMounted] = useState(false)

    useEffect(() => {
        setIsMounted(true)
    }, [])

    if (!isOpen || !course) return null

    return (
        <div className="fixed inset-0 z-[100] overflow-y-auto flex justify-center items-start p-4 md:p-12 lg:p-20 py-12 md:py-24 animate-in fade-in duration-300 pointer-events-auto">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/60 backdrop-blur-sm cursor-pointer z-0"
                onClick={onClose}
            />

            {/* Modal Content */}
            <div className="relative bg-white w-full max-w-4xl h-fit rounded-[40px] shadow-2xl animate-in zoom-in-95 slide-in-from-bottom-10 duration-500 z-10">
                <button
                    onClick={onClose}
                    className="absolute top-6 right-6 z-20 p-3 bg-black/50 text-white rounded-full hover:bg-black/70 transition-all outline-none"
                >
                    <X size={20} />
                </button>

                {/* Banner Section */}
                <div className="relative aspect-video w-full">
                    <img
                        src={course.image_url || "https://images.unsplash.com/photo-1633356122544-f134324a6cee?q=80&w=2070"}
                        alt={course.title}
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-white via-white/20 to-transparent" />
                    <div className="absolute bottom-8 left-8 right-8 space-y-4">
                        <span className="bg-[#00C402] text-white text-[10px] font-black px-2 py-1 rounded w-fit uppercase tracking-widest">
                            {course.tag || "PREMIUM"}
                        </span>
                        <h2 className="text-3xl md:text-4xl font-black text-slate-800 leading-tight">
                            {course.title}
                        </h2>
                        <div className="flex gap-4 pt-2">
                            <Link href={`/course/${course.id}`} className="flex-grow">
                                <Button className="w-full bg-slate-900 text-white hover:bg-slate-800 h-14 px-8 text-sm font-black uppercase tracking-[2px] flex gap-3 shadow-xl">
                                    <Play fill="currentColor" size={16} /> Acessar Agora
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Info Section */}
                <div className="p-8 md:p-12 grid md:grid-cols-3 gap-8 md:gap-12">
                    <div className="md:col-span-2 space-y-8">
                        <div>
                            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                                <Info size={18} className="text-[#00C402]" />
                                Sobre este treinamento
                            </h3>
                            <p className="text-slate-500 leading-relaxed text-sm">
                                {course.description}
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            {[
                                { icon: <Clock size={16} />, label: "Duração", text: "12 horas de conteúdo" },
                                { icon: <Globe size={16} />, label: "Idioma", text: "Português (BR)" },
                                { icon: <CheckCircle2 size={16} />, label: "Acesso", text: "Vitalício" },
                                { icon: <ShieldCheck size={16} />, label: "Certificado", text: "Incluso" },
                            ].map((item, i) => (
                                <div key={i} className="flex gap-3">
                                    <div className="text-slate-400 mt-0.5">{item.icon}</div>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider leading-none mb-1">{item.label}</span>
                                        <span className="text-xs font-semibold text-slate-700">{item.text}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 flex flex-col justify-between">
                        <div>
                            <span className="text-[10px] uppercase font-black text-slate-500 tracking-[3px] block mb-2">Investimento Total</span>
                            <div className="flex items-baseline gap-1">
                                <span className="text-sm font-bold text-slate-800">R$</span>
                                <span className="text-4xl font-black text-slate-800 tracking-tight">
                                    {course.price},00
                                </span>
                            </div>
                            <p className="text-[10px] text-slate-500 mt-4 leading-relaxed font-medium">
                                Aproveite acesso imediato a todas as aulas, materiais complementares e suporte técnico SPCS Academy.
                            </p>
                        </div>

                        <BuyButton
                            course={{
                                id: course.id,
                                title: course.title,
                                price: course.price,
                                image_url: course.image_url
                            }}
                            label="Matricular-se Agora"
                            className="w-full py-7 text-xs tracking-widest uppercase font-black rounded-xl mt-8 shadow-md"
                        />
                    </div>
                </div>
            </div>
        </div>
    )
}
