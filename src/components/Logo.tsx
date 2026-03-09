'use client'

import Link from 'next/link'
import { useBranding } from '@/context/BrandingContext'

interface LogoProps {
    className?: string
    variant?: 'horizontal' | 'vertical' | 'text-only'
    href?: string
    logoUrl?: string  // optional explicit override
}

export default function Logo({ className = '', variant = 'horizontal', href = '/', logoUrl }: LogoProps) {
    const branding = useBranding()
    const resolvedLogoUrl = logoUrl || branding.logoUrl || '/images/SPCSacademy2.png'
    const siteName = branding.siteName || 'SPCS Academy'

    if (variant === 'text-only') {
        return (
            <Link href={href} className={`hover:scale-105 transition-transform duration-500 outline-none ${className}`}>
                <span className="text-2xl font-black tracking-tighter uppercase text-black">
                    {siteName.split(' ')[0]} <span style={{ color: branding.primaryColor }}>{siteName.split(' ').slice(1).join(' ')}</span>
                </span>
            </Link>
        )
    }

    return (
        <Link href={href} className={`flex items-center hover:opacity-80 transition-opacity outline-none ${className}`}>
            <img
                src={resolvedLogoUrl}
                alt={siteName}
                className="h-full w-auto object-contain"
            />
        </Link>
    )
}
