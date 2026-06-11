"use client"

import { usePathname } from 'next/navigation'
import { useMemo, Suspense } from 'react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { AuthProvider } from '@/context/AuthProvider'
import { RegistrationGuard } from '@/components/auth/RegistrationGuard'

export default function AppLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname()
    const isClassroom = useMemo(() => pathname?.startsWith('/classroom'), [pathname])
    const isBrandedPage = useMemo(() => 
        pathname === '/course' ||
        pathname?.startsWith('/course/') || 
        pathname?.startsWith('/classroom') || 
        pathname?.startsWith('/checkout') ||
        pathname?.startsWith('/cart') ||
        pathname?.startsWith('/professor') ||
        pathname?.startsWith('/dashboard-student')
    , [pathname])

    const isStudentPage = useMemo(() => pathname?.startsWith('/dashboard-student'), [pathname])

    return (
        <AuthProvider>
            <RegistrationGuard>
            <div className={`min-h-screen flex flex-col ${isBrandedPage ? (isStudentPage ? 'student-theme' : '') : 'theme-clean-white'}`}>
                <Suspense fallback={null}>
                    {!isClassroom && <Navbar light={!isBrandedPage} />}
                </Suspense>
                <main className={`flex-grow ${isClassroom || (isBrandedPage && !isStudentPage) ? '' : 'pt-24'}`}>
                    {children}
                </main>
                {!isClassroom && <Footer variant={isBrandedPage ? 'dark' : 'light'} />}
            </div>
            </RegistrationGuard>
        </AuthProvider>
    )
}
