'use client'

import Link from 'next/link'
import Logo from '@/components/Logo'
import { useBranding } from '@/context/BrandingContext'

export default function Footer() {
    const { siteName } = useBranding()
    const year = new Date().getFullYear()

    return (
        <footer className="relative pt-12 pb-10 overflow-hidden font-exo z-[10] bg-[#0d2b17]">
            <div className="max-w-7xl mx-auto px-8 md:px-12 flex flex-col items-center space-y-8">
                {/* Logo Principal (Aumentada) */}
                <Logo className="h-24 py-2" />

                {/* Navegação Minimalista */}
                <div className="flex flex-wrap justify-center gap-x-16 gap-y-6 text-[12px] font-black uppercase tracking-widest text-white/80">

                    <Link href="/course" className="hover:text-[#32cd32] transition-colors duration-300">Cursos</Link>
                    <Link href="/dashboard-student" className="hover:text-[#32cd32] transition-colors duration-300">Painel</Link>
                    <Link href="/cart" className="hover:text-[#32cd32] transition-colors duration-300">Carrinho</Link>
                </div>

                {/* Copyright Sutil */}
                <div className="pt-10 w-full text-center">
                        © 2026 PowerPlay - Excelência em Tecnologia
                </div>
            </div>
        </footer>
    )
}
