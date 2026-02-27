"use client"

import { CheckCircle2, ArrowRight, GraduationCap } from 'lucide-react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

export default function CheckoutSuccessPage() {
    return (
        <div className="min-h-screen bg-white font-exo flex flex-col">
            <Navbar />

            <main className="flex-grow relative overflow-hidden flex flex-col">
                {/* Large Success Banner Background - Dark Overlay for Contrast */}
                <div className="absolute inset-0 z-0">
                    <img
                        src="/images/success-banner.png"
                        alt="Success"
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/50"></div>
                </div>

                <div className="relative z-10 flex-grow flex items-center justify-center py-20 px-6">
                    <div className="max-w-2xl w-full flex flex-col items-center text-center space-y-12">
                        {/* Visual Impact: Icon only */}
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ duration: 0.5 }}
                            className="relative"
                        >
                            <div className="w-32 h-32 bg-[#00C402] rounded-[40px] flex items-center justify-center shadow-2xl shadow-[#00C402]/40">
                                <CheckCircle2 size={64} className="text-white" strokeWidth={3} />
                            </div>
                            <div className="absolute inset-0 bg-[#00C402]/30 rounded-full blur-3xl -z-10"></div>
                        </motion.div>

                        {/* Main Content: High Contrast Typography - FORCE WHITE */}
                        <div className="space-y-6 drop-shadow-md">
                            <div className="space-y-2">
                                <h1 className="text-5xl md:text-6xl font-bold tracking-tighter leading-tight uppercase italic drop-shadow-xl !text-white">
                                    PARABÉNS! <br />
                                    <span className="text-[#00C402]">SEU TREINAMENTO FOI LIBERADO</span>
                                </h1>
                                <div className="w-24 h-1.5 bg-[#00C402] mx-auto rounded-full"></div>
                            </div>

                            <p className="text-xl md:text-2xl font-medium max-w-lg mx-auto leading-relaxed !text-white">
                                Tudo pronto! Seu acesso já está ativo. <br />
                                Enviamos os detalhes para o seu e-mail, mas você pode começar agora mesmo.
                            </p>
                        </div>

                        {/* Primary Action */}
                        <div className="w-full max-w-sm pt-4">
                            <Link href="/dashboard-student">
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    className="w-full bg-[#00C402] text-white py-7 rounded-[24px] font-bold uppercase italic tracking-[4px] shadow-2xl shadow-[#00C402]/40 flex items-center justify-center gap-4 group text-lg"
                                >
                                    <GraduationCap size={28} />
                                    Bons Estudos
                                    <ArrowRight size={24} className="group-hover:translate-x-2 transition-transform" />
                                </motion.button>
                            </Link>
                        </div>

                        <p className="text-[12px] font-bold uppercase tracking-[5px] !text-white/80 pt-8 italic drop-shadow-sm">
                            Plataforma de Elite SPCS Academy
                        </p>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    )
}
