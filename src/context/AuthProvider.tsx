'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { auth, db } from '@/lib/firebase'
import { onAuthStateChanged, User } from 'firebase/auth'
import { doc, getDoc, onSnapshot } from 'firebase/firestore'

interface AuthContextType {
    user: User | null
    profile: any | null
    role: 'student' | 'teacher' | 'admin' | null
    loading: boolean
    isMfaPending: boolean
    setMfaPending: (pending: boolean) => void
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    profile: null,
    role: null,
    loading: true,
    isMfaPending: false,
    setMfaPending: () => {},
})

export const useAuth = () => useContext(AuthContext)

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [profile, setProfile] = useState<any | null>(null)
    const [role, setRole] = useState<'student' | 'teacher' | 'admin' | null>(null)
    const [loading, setLoading] = useState(true)
    const [isMfaPending, setIsMfaPending] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('mfa_pending') === 'true'
        }
        return false
    })

    const setMfaPending = (pending: boolean) => {
        setIsMfaPending(pending)
        if (typeof window !== 'undefined') {
            if (pending) {
                localStorage.setItem('mfa_pending', 'true')
                document.cookie = "mfa_pending=true; path=/; max-age=3600; samesite=lax"
            } else {
                localStorage.removeItem('mfa_pending')
                document.cookie = "mfa_pending=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT"
            }
        }
    }

    useEffect(() => {
        const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
            setUser(currentUser)
            
            // Se o MFA estiver pendente, não carregamos o perfil ainda para evitar erros de permissão
            if (currentUser && !isMfaPending) {
                // Escutar mudanças no perfil em tempo real
                const profileRef = doc(db, 'profiles', currentUser.uid)
                const unsubscribeProfile = onSnapshot(profileRef, (docSnap) => {
                    if (docSnap.exists()) {
                        const data = docSnap.data()
                        setProfile(data)
                        setRole(data.role || 'student')
                    } else {
                        setProfile(null)
                        setRole(null)
                    }
                    setLoading(false)
                }, (error) => {
                    console.error("Error fetching profile snapshots:", error)
                    setLoading(false)
                })

                return () => {
                    unsubscribeProfile()
                }
            } else {
                setProfile(null)
                setRole(null)
                setLoading(false)
            }
        })

        return () => unsubscribeAuth()
    }, [isMfaPending])

    return (
        <AuthContext.Provider value={{ user, profile, role, loading, isMfaPending, setMfaPending }}>
            {children}
        </AuthContext.Provider>
    )
}
