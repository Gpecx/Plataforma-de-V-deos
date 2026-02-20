import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { ProfileForm } from './ProfileForm'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default async function ProfilePage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single()

    return (
        <div className="max-w-4xl mx-auto p-8 md:p-12">
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="text-4xl font-black italic tracking-tighter uppercase mb-2">
                        Meu <span className="text-[#00C402]">Perfil</span>
                    </h1>
                    <p className="text-gray-400">Gerencie suas informações pessoais na plataforma.</p>
                </div>
                <Link
                    href="/dashboard-student"
                    className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition"
                >
                    <ArrowLeft size={16} />
                    Voltar
                </Link>
            </div>

            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 md:p-12 shadow-2xl">
                <ProfileForm initialFullName={profile?.full_name || ''} />
            </div>
        </div>
    )
}
