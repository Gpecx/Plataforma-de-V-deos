'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { auth, db } from '@/lib/firebase'
import { onAuthStateChanged, signOut, User } from 'firebase/auth'
import { doc, onSnapshot } from 'firebase/firestore'
import { useRouter } from 'next/navigation'
import { useCartStore } from '@/store/useCartStore'
import { getPurchasedCourseIds } from '@/app/actions/profile'

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
    const router = useRouter()
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
            
            if (currentUser && !isMfaPending) {
                // Limpeza Proativa do Carrinho (Ação Imediata)
                getPurchasedCourseIds(currentUser.uid).then(ids => {
                    useCartStore.getState().setPurchasedCourses(ids)
                }).catch(err => console.error("Erro na limpeza proativa:", err))

                const profileRef = doc(db, 'profiles', currentUser.uid)
                const unsubscribeProfile = onSnapshot(profileRef, async (docSnap) => {
                    if (docSnap.exists()) {
                        const data = docSnap.data()

                        // INC-009: Ban enforcement em tempo real
                        if (data.status === 'banido') {
                            await signOut(auth)
                            setUser(null)
                            setProfile(null)
                            setRole(null)
                            // Limpa cookies de sessao via API existente
                            await fetch('/api/auth/signout').catch(() => {})
                            router.push('/login?error=account_suspended')
                            return
                        }

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
    }, [isMfaPending, router])

    return (
        <AuthContext.Provider value={{ user, profile, role, loading, isMfaPending, setMfaPending }}>
            {children}
        </AuthContext.Provider>
    )
}
