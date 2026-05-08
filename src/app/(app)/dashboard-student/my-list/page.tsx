import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { adminAuth, adminDb } from '@/lib/firebase-admin'
import { Heart, ArrowLeft, GraduationCap, BookOpen } from 'lucide-react'
import Link from 'next/link'
import { AddToCartButton } from '@/components/AddToCartButton'
import { parseFirebaseDate } from '@/lib/date-utils'
import RemoveFromWishlistButton from '@/components/RemoveFromWishlistButton'

export default async function MyListPage() {
    const cookieStore = await cookies()
    const token = cookieStore.get('session')?.value

    if (!token) {
        redirect('/login')
    }

    let user
    try {
        user = await adminAuth.verifySessionCookie(token, true)
    } catch (error) {
        redirect('/login')
    }

    const [profileDoc, wishlistSnapshot, coursesSnapshot] = await Promise.all([
        adminDb.collection('profiles').doc(user.uid).get(),
        adminDb.collection('profiles').doc(user.uid).collection('wishlist').orderBy('addedAt', 'desc').get(),
        adminDb.collection('courses').get()
    ])

    const profile = profileDoc.data()
    const wishlistCourseIds = wishlistSnapshot.docs.map(doc => doc.id)
    const purchasedCourseIds = profile?.cursos_comprados || []

    const allCourses = coursesSnapshot.docs.map(doc => {
        const data = doc.data()
        return {
            id: doc.id,
            ...data,
            created_at: parseFirebaseDate(data.created_at)?.toISOString() || data.created_at,
            updated_at: parseFirebaseDate(data.updated_at)?.toISOString() || data.updated_at
        }
    }) as any[]

    const wishlistCourses = allCourses.filter(c => wishlistCourseIds.includes(c.id) && !purchasedCourseIds.includes(c.id))

    return (
        <div className="min-h-screen bg-slate-50 font-montserrat relative flex flex-col">
            <div className="px-6 md:px-12 pt-6 w-full">
                <div className="relative max-w-[1600px] mx-auto rounded-3xl overflow-hidden shadow-xl min-h-[300px] md:min-h-[350px] flex items-center">
                    <img
                        src="https://images.unsplash.com/photo-1515378960530-7c0da6231fb1?q=80&w=870&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                        alt="Minha Lista Banner"
                        className="absolute inset-0 w-full h-full object-cover"
                    />

                    <div className="relative z-20 w-full px-8 md:px-16 py-12">
                        <Link
                            href="/dashboard-student"
                            className="inline-flex items-center gap-2 !text-white hover:!text-white/80 transition-colors mb-8 text-[10px] font-bold uppercase tracking-[0.2em] bg-black/40 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 hover:bg-black/60"
                        >
                            <ArrowLeft size={14} />
                            Voltar ao Dashboard
                        </Link>
                        <div className="flex flex-col md:flex-row md:items-center gap-6 md:gap-8">
                            <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-gradient-to-br from-[#1D5F31] to-[#0a2e15] border border-white/10 flex items-center justify-center shadow-2xl shadow-[#1D5F31]/30 transition-transform hover:scale-105 duration-300">
                                <Heart size={32} className="text-[#00c853] fill-[#00c853] filter drop-shadow-md" />
                            </div>
                            <div>
                                <h1 className="text-2xl md:text-3xl font-bold uppercase tracking-tighter !text-white drop-shadow-2xl max-w-xl">
                                    Minha Lista
                                </h1>
                                <p className="!text-white text-sm md:text-base font-bold mt-2 flex items-center gap-2 tracking-wide drop-shadow-lg">
                                    <span className="w-2 h-2 rounded-full bg-[#00c853] animate-pulse"></span>
                                    {wishlistCourses.length} curso{wishlistCourses.length !== 1 ? 's' : ''} favorito{wishlistCourses.length !== 1 ? 's' : ''}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="px-6 md:px-12 py-12 max-w-[1600px] mx-auto w-full">
                {wishlistCourses.length === 0 ? (
                    <div className="text-center py-24 bg-white rounded-[32px] border border-black/5 shadow-sm">
                        <div className="w-24 h-24 rounded-full bg-slate-50 flex items-center justify-center mx-auto mb-8 border border-slate-100 shadow-inner">
                            <Heart size={44} className="text-slate-300" />
                        </div>
                        <h2 className="text-2xl font-bold uppercase tracking-tighter text-black mb-4">
                            Sua lista está vazia
                        </h2>
                        <p className="text-slate-500 font-medium mb-10 max-w-md mx-auto leading-relaxed">
                            Explore nosso catálogo técnico e salve os cursos que mais te interessam para acessá-los rapidamente aqui.
                        </p>
                        <Link
                            href="/course"
                            className="inline-flex items-center gap-3 bg-[#1D5F31] text-white px-8 py-4 rounded-xl font-bold uppercase tracking-widest text-[11px] hover:brightness-110 transition-all shadow-xl shadow-[#1D5F31]/20 group"
                        >
                            <GraduationCap size={20} className="group-hover:rotate-12 transition-transform" />
                            Explorar Catálogo
                        </Link>
                    </div>
                ) : (
                    <>
                        <div className="flex flex-col gap-3 mb-12">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-px bg-[#1D5F31]" />
                                <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#1D5F31]">Seleção</span>
                            </div>
                            <h2 className="text-3xl font-bold uppercase tracking-tighter text-black">
                                Cursos <br className="md:hidden" /> Favoritados
                            </h2>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 justify-items-start">
                            {wishlistCourses.map((curso) => {
                                const hasPurchased = purchasedCourseIds.includes(curso.id)
                                return (
                                    <div key={curso.id} className="group w-full max-w-[320px] bg-white rounded-[24px] overflow-hidden border border-black shadow-sm hover:shadow-2xl transition-all duration-500 flex flex-col h-full">
                                        <div className="relative h-48 overflow-hidden bg-slate-100">
                                            <img
                                                src={curso.image_url || "https://images.unsplash.com/photo-1558655146-d09347e92766?w=400"}
                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                                alt={curso.title}
                                            />
                                            {hasPurchased ? (
                                                <div className="absolute top-4 left-4 bg-[#1D5F31] px-4 py-2 rounded-xl z-10 shadow-lg">
                                                    <span className="text-[9px] font-bold text-white tracking-widest uppercase flex items-center gap-2">
                                                        <BookOpen size={12} />
                                                        Já Adquirido
                                                    </span>
                                                </div>
                                            ) : (
                                                <>
                                                    <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md px-4 py-2 rounded-xl z-10 border border-white/20">
                                                        <span className="text-[9px] font-bold text-white tracking-widest uppercase flex items-center gap-2">
                                                            <Heart size={12} className="fill-[#00c853] text-[#00c853]" />
                                                            Favorito
                                                        </span>
                                                    </div>
                                                    <div className="absolute top-4 right-4 z-10">
                                                        <AddToCartButton 
                                                            course={{
                                                                id: curso.id,
                                                                title: curso.title,
                                                                price: Number(curso.price || 0),
                                                                image_url: curso.image_url
                                                            }} 
                                                            purchasedCourseIds={purchasedCourseIds}
                                                            iconOnly={true}
                                                        />
                                                    </div>
                                                </>
                                            )}
                                        </div>

                                        <div className="p-7 flex-grow flex flex-col">
                                            <div className="flex flex-col gap-1 mb-4">
                                                <span className="text-[9px] font-bold uppercase text-[#1D5F31] tracking-widest">Treinamento</span>
                                                <h3 className="font-bold text-lg !text-black uppercase leading-[1.1] line-clamp-2 group-hover:text-[#1D5F31] transition-colors">{curso.title}</h3>
                                            </div>
                                            
                                            <p className="!text-slate-600 text-xs font-medium leading-relaxed line-clamp-2 mb-8">
                                                {curso.description || 'Domine esta habilidade técnica com o método exclusivo da PowerPlay.'}
                                            </p>

                                            <div className="mt-auto pt-6 border-t border-slate-100 flex items-center justify-between">
                                                <div className="flex flex-col">
                                                    <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-1">Investimento</span>
                                                    <span className="!text-black font-bold text-2xl tracking-tighter">
                                                        R$ {Number(curso.price || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                    </span>
                                                </div>
                                                <Link 
                                                    href={`/course/${curso.id}`} 
                                                    className="w-10 h-10 bg-[#1D5F31] hover:bg-[#1D5F31]/80 rounded-xl flex items-center justify-center text-white transition-all shadow-lg hover:shadow-[#1D5F31]/20 active:scale-95"
                                                    title="Ver Detalhes"
                                                >
                                                    <ArrowLeft size={18} className="rotate-180" />
                                                </Link>
                                            </div>
                                        </div>

                                        {!hasPurchased && (
                                            <div className="p-4 bg-slate-50 border-t border-slate-100 mt-2">
                                                <RemoveFromWishlistButton courseId={curso.id} />
                                            </div>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}