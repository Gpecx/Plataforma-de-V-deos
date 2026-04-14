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
            viewBox="0 0 300 60"
            className="h-full w-auto"
            xmlns="http://www.w3.org/2000/svg"
        >
            {/* Circle with Lightning Bolt */}
            {/* Play Triangle - Increased Size */}
            <path
                d="M2 2L60 30L2 58Z"
                fill="none"
                stroke="#22c55e"
                strokeWidth="4"
                strokeLinejoin="round"
            />
            <path
                d="M2 2L60 30L2 58Z"
                fill="#22c55e"
                fillOpacity="0.1"
            />
            <path
                d="M25 14L13 33H21L18 46L30 27H23L25 14Z"
                fill="#22c55e"
                className="animate-pulse"
            />

            {/* Text 'POWER' */}
            <text
                x="75"
                y="42"
                fontFamily="Exo, sans-serif"
                fontSize="32"
                fontWeight="900"
                fill={light ? primaryColor : 'white'}
                style={{ letterSpacing: '0.05em' }}
            >
                POWER
            </text>

            {/* Text 'PLAY' */}
            <text
                x="195"
                y="42"
                fontFamily="Exo, sans-serif"
                fontSize="32"
                fontWeight="900"
                fill={light ? primaryColor : 'white'}
                style={{ letterSpacing: '0.05em' }}
            >
                PLAY
            </text>

            {/* Subtle glow filter */}
            <defs>
                <filter id="glow">
                    <feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
                    <feMerge>
                        <feMergeNode in="coloredBlur" />
                        <feMergeNode in="SourceGraphic" />
                    </feMerge>
                </filter>
            </defs>
        </svg>
    )

    if (variant === 'text-only') {
        return (
            <Link href={href as any} className={`hover:scale-105 transition-transform duration-500 outline-none ${className}`}>
                <span className={`text-2xl font-bold tracking-tighter uppercase font-exo`} style={{ color: primaryColor }}>
                    POWER <span style={{ color: primaryColor }}>PLAY</span>
                </span>
            </Link>
        )
    }

    return (
        <Link href={href as any} className={`flex items-center hover:opacity-90 transition-opacity outline-none h-12 md:h-14 ${className}`}>
            <PowerPlayLogo />
        </Link>
    )
}
