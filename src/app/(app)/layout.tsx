"use client"

import { usePathname } from 'next/navigation'
import { useMemo } from 'react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { AuthProvider } from '@/context/AuthProvider'

export default function AppLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname()
    const isClassroom = useMemo(() => pathname?.startsWith('/classroom'), [pathname])

    return (
        <AuthProvider>
            <div className={`min-h-screen flex flex-col ${isClassroom ? '' : 'theme-clean-white'}`}>
                {!isClassroom && <Navbar light={true} />}
                <main className={`flex-grow ${isClassroom ? '' : 'pt-24'}`}>
                    {children}
                </main>
                {!isClassroom && <Footer />}
            </div>
        </AuthProvider>
    )
}
