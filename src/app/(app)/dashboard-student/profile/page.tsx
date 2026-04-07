import { adminAuth, adminDb } from '@/lib/firebase-admin'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { ProfileForm } from './ProfileForm'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default async function ProfilePage() {
    const cookieStore = cookies()
    const token = (await cookieStore).get('session')?.value

    if (!token) redirect('/login')

    let user;
    try {
        user = await adminAuth.verifySessionCookie(token, true)
    } catch (error) {
        redirect('/login')
    }

    const profileDoc = await adminDb.collection('profiles').doc(user.uid).get()
    const profile = profileDoc.data()

    return (
        <div className="min-h-screen bg-white font-montserrat p-8 md:p-12">
            <div className="max-w-4xl mx-auto space-y-10">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tighter uppercase mb-1 text-[#1a1a1a] leading-none max-w-xl">
                            Meu <span className="text-[#1D5F31]">Perfil</span>
                        </h1>
                        <p className="text-slate-500 text-[10px] font-bold uppercase tracking-[3px]">Gerencie suas informações pessoais na plataforma.</p>
                    </div>
                    <Link
                        href="/dashboard-student"
                        className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:text-[#1a1a1a] transition group bg-slate-50 px-5 py-3 rounded-xl border border-black hover:border-black shadow-sm"
                    >
                        <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
                        Voltar
                    </Link>
                </div>

                <div className="bg-white border border-black rounded-xl p-8 md:p-12 shadow-sm">
                    <ProfileForm 
                        initialFullName={profile?.full_name || ''} 
                        initialCpf={profile?.cpf_cnpj || profile?.cpf || ''} 
                    />
                </div>
            </div>
        </div>
    )
}
