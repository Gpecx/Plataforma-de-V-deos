'use client'

import React, { createContext, useContext, useEffect, useRef, useState } from 'react'
import { auth, db } from '@/lib/firebase'
import { onAuthStateChanged, signOut, User } from 'firebase/auth'
import { doc, onSnapshot } from 'firebase/firestore'
import { useRouter } from 'next/navigation'
import { useCartStore } from '@/store/useCartStore'
import { getPurchasedCourseIds } from '@/app/actions/profile'
import { setMfaCookie } from '@/app/actions/mfa'

interface AuthContextType {
    user: User | null
    profile: any | null
    role: 'student' | 'teacher' | 'admin' | null
    loading: boolean
    isMfaPending: boolean
    setMfaPending: (pending: boolean) => void
    registrationIncomplete: boolean
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    profile: null,
    role: null,
    loading: true,
    isMfaPending: false,
    setMfaPending: () => {},
    registrationIncomplete: false,
})

export const useAuth = () => useContext(AuthContext)

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const router = useRouter()
    const [user, setUser] = useState<User | null>(null)
    const [profile, setProfile] = useState<any | null>(null)
    const [role, setRole] = useState<'student' | 'teacher' | 'admin' | null>(null)
    const [loading, setLoading] = useState(true)
    const [isMfaPending, setIsMfaPending] = useState(false)
    const [registrationIncomplete, setRegistrationIncomplete] = useState(false)

    const hasInitialized = useRef(false)
    const incompleteTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

    const setMfaPending = async (pending: boolean) => {
        setIsMfaPending(pending)
        await setMfaCookie(pending)
    }

    useEffect(() => {
        let mounted = true;
        setLoading(true);

        let unsubscribeProfile: (() => void) | undefined;

        const clearLocalAuthState = async () => {
            if (unsubscribeProfile) {
                unsubscribeProfile();
                unsubscribeProfile = undefined;
            }
            await signOut(auth).catch(() => {})
            await fetch('/api/auth/signout').catch(() => {})
            setUser(null)
            setProfile(null)
            setRole(null)
        }

        const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
            if (!mounted) return;

            // isFirstCall é true apenas na primeira invocação deste callback.
            // Se o primeiro callback tiver currentUser = null (página carregada sem sessão),
            // e um callback subsequente tiver currentUser = user (sign-in fresco),
            // isFirstCall já será false, pulando a validação de sessão abaixo.
            const isFirstCall = !hasInitialized.current
            hasInitialized.current = true

            if (currentUser && !isMfaPending) {
                // Server-side session validation only on initial boot (cold start),
                // not on fresh sign-ins (OAuth popup, etc.) to avoid interrupting
                // flows where the session cookie hasn't been created yet.
                if (isFirstCall) {
                    try {
                        const res = await fetch('/api/auth/me')
                        if (!res.ok) {
                            await clearLocalAuthState()
                            if (mounted) {
                                setLoading(false)
                                window.location.href = '/login'
                            }
                            return
                        }
                    } catch (e) {
                        console.warn('[AuthProvider] Session validation failed:', e)
                    }
                }

                setUser(currentUser)

                // Limpeza Proativa do Carrinho (Ação Imediata)
                getPurchasedCourseIds().then(ids => {
                    useCartStore.getState().setPurchasedCourses(ids)
                }).catch(err => console.error("Erro na limpeza proativa:", err))

                const profileRef = doc(db, 'profiles', currentUser.uid)
                unsubscribeProfile = onSnapshot(profileRef, async (docSnap) => {
                    if (!mounted) return;
                    if (docSnap.exists()) {
                        const data = docSnap.data()

                        // INC-009: Ban enforcement em tempo real
                        if (data.ativo === false || data.teacher_status === 'banned') {
                            await clearLocalAuthState()
                            router.push('/login?error=account_suspended' as any)
                            return
                        }

                        setProfile(data)
                        setRole(data.role || 'student')

                        // Perfil completo — limpa flag e timer pendente
                        if (incompleteTimer.current) {
                            clearTimeout(incompleteTimer.current)
                            incompleteTimer.current = null
                        }
                        setRegistrationIncomplete(!data.role)
                    } else {
                        setProfile(null)
                        setRole(null)

                        // Tolerância para fluxo OAuth: perfil ainda sendo criado
                        // Aguarda até 3s antes de marcar como incompleto
                        if (!incompleteTimer.current) {
                            incompleteTimer.current = setTimeout(() => {
                                if (mounted) {
                                    setRegistrationIncomplete(true)
                                }
                            }, 3000)
                        }
                    }
                    setLoading(false)
                }, (error) => {
                    console.error("Error fetching profile snapshots:", error)
                    if (mounted) setLoading(false)
                })
            } else {
                if (unsubscribeProfile) {
                    unsubscribeProfile();
                    unsubscribeProfile = undefined;
                }
                if (incompleteTimer.current) {
                    clearTimeout(incompleteTimer.current)
                    incompleteTimer.current = null
                }
                setUser(currentUser)
                setProfile(null)
                setRole(null)
                setRegistrationIncomplete(false)
                setLoading(false)
            }
        })

        return () => {
            mounted = false;
            hasInitialized.current = false  // Reset so session is re-validated on remount
            unsubscribeAuth();
            if (unsubscribeProfile) {
                unsubscribeProfile();
            }
            if (incompleteTimer.current) {
                clearTimeout(incompleteTimer.current)
                incompleteTimer.current = null
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isMfaPending])

    return (
        <AuthContext.Provider value={{ user, profile, role, loading, isMfaPending, setMfaPending, registrationIncomplete }}>
            {children}
        </AuthContext.Provider>
    )
}
