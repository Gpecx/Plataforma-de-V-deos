'use client'

import Link from 'next/link'
import { useBranding } from '@/context/BrandingContext'

interface LogoProps {
    className?: string
    variant?: 'horizontal' | 'vertical' | 'text-only'
    href?: string
    logoUrl?: string  // optional explicit override
    light?: boolean
}

export default function Logo({ className = '', variant = 'horizontal', href = '/', logoUrl, light = false }: LogoProps) {
    const branding = useBranding()
    const siteName = branding.siteName || 'PowerPlay'
    const primaryColor = branding.primaryColor || '#1D5F31'

    const textColor = light ? '#0f172a' : 'white' // slate-900 or white

    const PowerPlayLogo = () => (
        <svg 
            viewBox="0 0 280 60" 
            className="h-full w-auto" 
            xmlns="http://www.w3.org/2000/svg"
        >
            {/* Circle with Lightning Bolt */}
            <circle cx="30" cy="30" r="22" fill="none" stroke={primaryColor} strokeWidth="3" />
            <circle cx="30" cy="30" r="18" fill={primaryColor} fillOpacity="0.1" />
            <path 
                d="M32 18L24 32H30L28 42L36 28H30L32 18Z" 
                fill={primaryColor} 
                className="animate-pulse"
            />
            
            {/* Text 'POWER' */}
            <text 
                x="65" 
                y="42" 
                fontFamily="Exo, sans-serif" 
                fontSize="32" 
                fontWeight="900" 
                fill={textColor} 
                style={{ letterSpacing: '0.05em', fontStyle: 'italic' }}
            >
                POWER
            </text>
            
            {/* Text 'PLAY' */}
            <text 
                x="185" 
                y="42" 
                fontFamily="Exo, sans-serif" 
                fontSize="32" 
                fontWeight="900" 
                fill={primaryColor} 
                style={{ letterSpacing: '0.05em', fontStyle: 'italic' }}
            >
                PLAY
            </text>
            
            {/* Subtle glow filter */}
            <defs>
                <filter id="glow">
                    <feGaussianBlur stdDeviation="2.5" result="coloredBlur"/>
                    <feMerge>
                        <feMergeNode in="coloredBlur"/>
                        <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                </filter>
            </defs>
        </svg>
    )

    if (variant === 'text-only') {
        return (
            <Link href={href} className={`hover:scale-105 transition-transform duration-500 outline-none ${className}`}>
                <span className={`text-2xl font-black tracking-tighter uppercase ${light ? 'text-slate-900' : 'text-white'}`}>
                    POWER <span style={{ color: primaryColor }}>PLAY</span>
                </span>
            </Link>
        )
    }

    return (
        <Link href={href} className={`flex items-center hover:opacity-90 transition-opacity outline-none h-12 md:h-14 ${className}`}>
            <PowerPlayLogo />
        </Link>
    )
}
