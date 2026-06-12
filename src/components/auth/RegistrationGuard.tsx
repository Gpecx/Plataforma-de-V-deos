'use client'

import { useEffect, useRef } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/context/AuthProvider'

const EXCLUDED_PATHS = ['/login', '/register', '/auth']

export function RegistrationGuard({ children }: { children: React.ReactNode }) {
    const router = useRouter()
    const pathname = usePathname()
    const { user, loading, registrationIncomplete } = useAuth()
    const redirectTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

    useEffect(() => {
        // Clear any pending redirect timer when conditions change
        if (redirectTimer.current) {
            clearTimeout(redirectTimer.current)
            redirectTimer.current = null
        }

        if (loading) return
        if (!user) return

        const isExcluded = EXCLUDED_PATHS.some(p => pathname?.startsWith(p))
        if (isExcluded) return

        if (registrationIncomplete === true) {
            // Small debounce (300ms) to avoid false redirects during OAuth profile
            // creation race condition — AuthProvider already has a 3s tolerance,
            // this adds a final safety buffer on the navigation side.
            redirectTimer.current = setTimeout(() => {
                router.push('/register')
            }, 300)
        }

        return () => {
            if (redirectTimer.current) {
                clearTimeout(redirectTimer.current)
                redirectTimer.current = null
            }
        }
    }, [user, loading, registrationIncomplete, router, pathname])

    return <>{children}</>
}
