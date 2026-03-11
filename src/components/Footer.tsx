'use client'

import Link from 'next/link'
import Logo from '@/components/Logo'
import { useBranding } from '@/context/BrandingContext'

export default function Footer() {
    const { siteName } = useBranding()
    const year = new Date().getFullYear()

    return (
        <footer className="relative bg-[#F4F7F9] pt-24 pb-20 overflow-hidden border-t border-slate-100 font-exo z-[10]">
            <div className="max-w-7xl mx-auto px-8 md:px-12 flex flex-col items-center space-y-12">
                {/* Logo Principal (Aumentada) */}
                <Logo className="h-24 py-2" />

                {/* Navegação Minimalista */}
                <div className="flex flex-wrap justify-center gap-x-16 gap-y-6 text-[12px] font-black uppercase tracking-widest text-[#1A1A1A]">
                    <Link href="/" className="hover:text-[#00C402] transition-colors duration-300">Início</Link>
                    <Link href="/course" className="hover:text-[#00C402] transition-colors duration-300">Cursos</Link>
                    <Link href="/dashboard-student" className="hover:text-[#00C402] transition-colors duration-300">Painel</Link>
                    <Link href="/cart" className="hover:text-[#00C402] transition-colors duration-300">Carrinho</Link>
                </div>

                {/* Copyright Sutil */}
                <div className="pt-10 w-full border-t border-slate-200/50 text-center">
                    <p className="text-slate-600 text-[10px] font-bold uppercase tracking-[0.5em]">
                        © {year} {siteName} - Excelência em Tecnologia
                    </p>
                </div>
            </div>
        </footer>
    )
}
