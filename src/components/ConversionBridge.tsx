'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { ArrowRight, GraduationCap, PlayCircle } from 'lucide-react'

interface ConversionBridgeProps {
    redirectTo?: string
    onShowLogin: () => void
}

export function ConversionBridge({ redirectTo, onShowLogin }: ConversionBridgeProps) {
    const registerUrl = redirectTo ? `/register?redirectTo=${encodeURIComponent(redirectTo)}` : '/register'

    return (
        <div className="min-h-screen w-full flex flex-row bg-[var(--background-color)] overflow-hidden">
            {/* Left Side - Visual */}
            <div className="hidden md:flex md:w-1/2 bg-[var(--background-color)] items-center justify-center p-0 overflow-hidden">
                <div className="w-full h-full relative">
                    <img
                        src="/login-illustration.png"
                        alt="PowerPlay"
                        className="w-full h-full object-cover object-center"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-[var(--background-color)]/80 to-transparent" />
                </div>
            </div>

            {/* Right Side - Bridge Content */}
            <div className="w-full md:w-1/2 flex flex-col items-center justify-center p-6 md:p-12 bg-[var(--background-color)] relative">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="w-full max-w-[500px] text-center"
                >
                    {/* Badge */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.1 }}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/20 rounded-full mb-8"
                    >
                        <PlayCircle size={16} className="text-green-500" />
                        <span className="text-green-400 font-bold text-xs uppercase tracking-widest">
                            Conteúdo Exclusivo
                        </span>
                    </motion.div>

                    {/* Main Title */}
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-3xl md:text-4xl lg:text-5xl font-black tracking-tighter uppercase text-[var(--foreground)] mb-4"
                    >
                        Você está a um passo de <span className="text-[#28b828]">transformar</span> sua carreira
                    </motion.h1>

                    {/* Subtitle */}
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="text-lg text-green-200/80 font-medium mb-10 max-w-[400px] mx-auto"
                    >
                        Tenha acesso imediato aos melhores conteúdos e comece sua jornada de evolução hoje.
                    </motion.p>

                    {/* CTA Buttons */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="space-y-4"
                    >
                        <Link
                            href={registerUrl}
                            className="w-full flex items-center justify-center gap-3 bg-[#28b828] hover:bg-[#28b828] text-white font-black uppercase tracking-[3px] h-14 rounded-xl shadow-lg transition-all hover:scale-[1.01] active:scale-[0.99]"
                        >
                            Quero me inscrever agora
                            <ArrowRight size={18} />
                        </Link>

                        <button
                            onClick={onShowLogin}
                            className="w-full flex items-center justify-center gap-3 bg-white border-2 border-[#061629] text-[#061629] font-black uppercase tracking-[3px] h-14 rounded-xl transition-all hover:bg-[#f0f0f0] hover:border-[#1D5F31]"
                        >
                            <GraduationCap size={18} className="text-[#061629]" />
                            Já tenho cadastro
                        </button>
                    </motion.div>

                    {/* Trust Badge */}
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 }}
                        className="mt-8 text-xs text-green-200/60 font-medium"
                    >

                    </motion.p>
                </motion.div>
            </div>
        </div>
    )
}
