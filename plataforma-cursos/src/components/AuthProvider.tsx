'use client'

import { useEffect } from 'react'
import { useAuthStore, UserRole } from '@/store/useAuthStore'

interface AuthProviderProps {
    user: {
        uid: string
        email: string | undefined
        role: string
    } | null
    children: React.ReactNode
}

export function AuthProvider({ user, children }: AuthProviderProps) {
    const setUser = useAuthStore(state => state.setUser)
    const setLoading = useAuthStore(state => state.setLoading)

    useEffect(() => {
        if (user) {
            setUser({
                uid: user.uid,
                email: user.email ?? '',
                role: user.role as UserRole
            })
        } else {
            setUser(null)
        }
        setLoading(false)
    }, [user, setUser, setLoading])

    return <>{children}</>
}
