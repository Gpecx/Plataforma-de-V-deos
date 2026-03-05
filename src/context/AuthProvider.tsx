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
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    profile: null,
    role: null,
    loading: true,
})

export const useAuth = () => useContext(AuthContext)

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [profile, setProfile] = useState<any | null>(null)
    const [role, setRole] = useState<'student' | 'teacher' | 'admin' | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
            setUser(currentUser)

            if (currentUser) {
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
    }, [])

    return (
        <AuthContext.Provider value={{ user, profile, role, loading }}>
            {children}
        </AuthContext.Provider>
    )
}
