"use client"

import { auth, db } from '@/lib/firebase'
import { onAuthStateChanged } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { ProfileForm } from './ProfileForm'
import { ArrowLeft, Loader2 } from 'lucide-react'
import Link from 'next/link'

export default function ProfilePage() {
    const router = useRouter()
    const [user, setUser] = useState<any>(null)
    const [profile, setProfile] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (!currentUser) {
                router.push('/login')
                return
            }
            setUser(currentUser)

            try {
                const profileSnap = await getDoc(doc(db, 'profiles', currentUser.uid))
                if (profileSnap.exists()) {
                    setProfile(profileSnap.data())
                }
            } catch (error) {
                console.error("Error fetching profile:", error)
            } finally {
                setLoading(false)
            }
        })
        return () => unsubscribe()
    }, [router])

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-[#F4F7F9]">
                <Loader2 className="animate-spin text-[#00C402]" size={48} />
            </div>
        )
    }

    if (!user) return null

    return (
        <div className="min-h-screen bg-[#F5F7FA] font-exo p-8 md:p-12 border-t border-slate-100">
            <div className="max-w-4xl mx-auto space-y-10">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-black tracking-tighter uppercase mb-1 text-slate-900 leading-none">
                            Meu <span className="text-[#00C402]">Perfil</span>
                        </h1>
                        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[3px]">Gerencie suas informações pessoais na plataforma.</p>
                    </div>
                    <Link
                        href="/dashboard-student"
                        className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 transition group bg-white px-5 py-3 rounded-xl border border-slate-100 shadow-sm"
                    >
                        <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
                        Voltar
                    </Link>
                </div>

                <div className="bg-white border border-slate-100 rounded-[32px] p-8 md:p-12 shadow-sm">
                    <ProfileForm
                        initialFullName={profile?.full_name || ''}
                        initialAvatarUrl={profile?.avatar_url}
                    />
                </div>
            </div>
        </div>
    )
}
