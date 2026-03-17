import { adminAuth, adminDb } from '@/lib/firebase-admin'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { ProfileForm } from './ProfileForm'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default async function ProfilePage() {
    const cookieStore = cookies()
    const token = (await cookieStore).get('firebase-token')?.value

    if (!token) redirect('/login')

    let user;
    try {
        user = await adminAuth.verifyIdToken(token)
    } catch (error) {
        redirect('/login')
    }

    const profileDoc = await adminDb.collection('profiles').doc(user.uid).get()
    const profile = profileDoc.data()

    return (
        <div className="min-h-screen bg-transparent font-exo p-8 md:p-12 border-t border-[#1D5F31]">
            <div className="max-w-4xl mx-auto space-y-10">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-black tracking-tighter uppercase mb-1 text-white leading-none">
                            Meu <span className="text-[#1D5F31]">Perfil</span>
                        </h1>
                        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[3px]">Gerencie suas informações pessoais na plataforma.</p>
                    </div>
                    <Link
                        href="/dashboard-student"
                        className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white transition group bg-[#1D5F31]/20 px-5 py-3 rounded-none border border-[#1D5F31] shadow-sm"
                    >
                        <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
                        Voltar
                    </Link>
                </div>

                <div className="bg-[#061629] border border-[#1D5F31] rounded-none p-8 md:p-12 shadow-sm">
                    <ProfileForm initialFullName={profile?.full_name || ''} />
                </div>
            </div>
        </div>
    )
}
