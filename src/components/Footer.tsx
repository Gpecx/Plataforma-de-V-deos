'use client'

import { usePathname } from 'next/navigation'
import Logo from '@/components/Logo'
import { useBranding } from '@/context/BrandingContext'

export default function Footer({ variant = 'light' }: { variant?: 'light' | 'dark' }) {
    const { siteName } = useBranding()
    const pathname = usePathname()
    const year = new Date().getFullYear()

    const isClassroomRoute = pathname?.startsWith('/classroom/')
    const isCourseDetailRoute = pathname?.startsWith('/course/') && pathname !== '/course'
    const isDark = variant === 'dark' || isClassroomRoute || isCourseDetailRoute

    return (
        <footer className={`relative pt-12 pb-10 overflow-hidden font-montserrat z-[10] ${
            isClassroomRoute 
                ? 'bg-[#061629]' 
                : isCourseDetailRoute 
                    ? 'bg-gradient-to-br from-[#061629] via-[#0A2E16] to-[#1D5F31] bg-fixed' 
                    : 'bg-transparent'
        }`}>
            <div className="max-w-[1600px] mx-auto px-6 md:px-12 flex flex-col items-center space-y-6">
                {/* Logo Estática - sem comportamento de link */}
                <Logo 
                    className="h-24 py-2" 
                    href={null}
                    light={!isDark} 
                />

                {/* Copyright */}
                <div className={`pt-4 w-full text-center font-medium ${isDark ? 'text-white/40' : 'text-black'}`}>
                    © {year} {siteName} - Todos os direitos reservados. GPECx Tecnologia.
                </div>
            </div>
        </footer>
    )
}
