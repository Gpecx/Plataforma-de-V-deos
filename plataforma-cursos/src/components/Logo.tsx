'use client'

import Link from 'next/link'

interface LogoProps {
    className?: string
    variant?: 'horizontal' | 'vertical' | 'text-only'
    href?: string
}

export default function Logo({ className = '', variant = 'horizontal', href = '/' }: LogoProps) {
    // Se o usuário pedir text-only, ainda mantemos o estilo de texto puro se necessário,
    // mas a solicitação principal é usar a imagem SPCSacademy2.png
    if (variant === 'text-only') {
        return (
            <Link href={href} className={`hover:scale-105 transition-transform duration-500 outline-none ${className}`}>
                <span className="text-2xl font-black tracking-tighter uppercase text-black">
                    SPCS <span className="text-[#00C402]">Academy</span>
                </span>
            </Link>
        )
    }

    // Usando a imagem solicitada pelo usuário
    return (
        <Link href={href} className={`flex items-center hover:opacity-80 transition-opacity outline-none ${className}`}>
            <img
                src="/images/SPCSacademy2.png"
                alt="SPCS Academy"
                className="h-full w-auto object-contain"
            />
        </Link>
    )
}
