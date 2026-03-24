'use client'

import Link from 'next/link'
import Logo from '@/components/Logo'
import { useBranding } from '@/context/BrandingContext'
import { useAuth } from '@/context/AuthProvider'

export default function Footer({ variant = 'light' }: { variant?: 'light' | 'dark' }) {
    const { user } = useAuth()
    const { siteName } = useBranding()
    const year = new Date().getFullYear()

    const isDark = variant === 'dark'

    return (
        <footer className={`relative pt-12 pb-10 overflow-hidden font-exo z-[10] bg-transparent`}>
            <div className="max-w-[1600px] mx-auto px-6 md:px-12 flex flex-col items-center space-y-8">
                {/* Logo Principal (Aumentada) */}
                <Logo className="h-24 py-2" href={user ? '/course' : '/'} light={!isDark} />

                {/* Navegação Minimalista */}
                <div className={`flex flex-wrap justify-center gap-x-16 gap-y-6 text-[12px] font-black uppercase tracking-widest ${isDark ? 'text-white/80' : 'text-slate-800'}`}>

                    <Link href="/course" className="hover:text-[#1D5F31] transition-colors duration-300">Cursos</Link>
                    <Link href="/dashboard-student" className="hover:text-[#1D5F31] transition-colors duration-300">Painel</Link>
                    <Link href="/cart" className="hover:text-[#1D5F31] transition-colors duration-300">Carrinho</Link>
                </div>

                {/* Copyright Sutil */}
                <div className={`pt-10 w-full text-center font-medium ${isDark ? 'text-white/40' : 'text-black'}`}>
                    © {year} {siteName} - Todos os direitos reservados. GPECx Tecnologia.
                </div>
            </div>
        </footer>
    )
}
