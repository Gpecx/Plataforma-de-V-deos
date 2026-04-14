"use client"

import { usePathname } from 'next/navigation'
import { useMemo, Suspense } from 'react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { AuthProvider } from '@/context/AuthProvider'

export default function AppLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname()
    const isClassroom = useMemo(() => pathname?.startsWith('/classroom'), [pathname])
    const isBrandedPage = useMemo(() => 
        pathname?.startsWith('/course/') || 
        pathname?.startsWith('/classroom') || 
        pathname?.startsWith('/checkout')
    , [pathname])

    return (
        <AuthProvider>
            <div className={`min-h-screen flex flex-col ${isBrandedPage ? '' : 'theme-clean-white'}`}>
                <Suspense fallback={null}>
                    {!isClassroom && <Navbar light={!isBrandedPage} />}
                </Suspense>
                <main className={`flex-grow ${isClassroom ? '' : 'pt-24'}`}>
                    {children}
                </main>
                {!isClassroom && <Footer />}
            </div>
        </AuthProvider>
    )
}
