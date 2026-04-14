import { getServerSession } from '@/lib/auth-utils'
import { adminDb } from '@/lib/firebase-admin'
import { redirect } from 'next/navigation'
import ClientProfileForm from './ClientProfileForm'

export default async function TeacherProfilePage() {
    const session = await getServerSession()
    
    if (!session) {
        redirect('/login')
    }
    
    if (session.role !== 'teacher' && session.role !== 'admin') {
        redirect('/dashboard-student')
    }

    // Buscar dados atuais do perfil
    const profileDoc = await adminDb.collection('profiles').doc(session.uid).get()
    const raw = profileDoc.exists ? profileDoc.data() : null

    // Serializar para objeto simples (Timestamps do Firestore não são aceitos pelo Client Component)
    const initialData = raw ? {
        full_name: raw.full_name || '',
        specialty: raw.specialty || '',
        bio: raw.bio || '',
        avatar_url: raw.avatar_url || '',
        linkedin: raw.linkedin || '',
        twitter: raw.twitter || '',
        website: raw.website || '',
        youtube: raw.youtube || '',
    } : null

    return (
        <div className="min-h-screen bg-transparent p-8 md:p-12 space-y-16 font-montserrat border-t border-white/5">
            <header className="max-w-4xl mx-auto">
                <div className="flex items-center gap-3 mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-[5px] text-[#1D5F31]">PROFILE MANAGEMENT</span>
                </div>
                <h1 className="text-4xl font-bold tracking-tighter text-black">
                    IDENTIDADE DO <span className="text-[#1D5F31] uppercase">TEACHER</span>
                </h1>
                <p className="text-slate-600 mt-2 font-semibold text-xs tracking-widest uppercase">
                    Gerencie como você se apresenta para o mercado e seus alunos.
                </p>
            </header>

            <ClientProfileForm 
                initialData={initialData} 
                email={session.email || 'Email não disponível'} 
            />
        </div>
    )
}
