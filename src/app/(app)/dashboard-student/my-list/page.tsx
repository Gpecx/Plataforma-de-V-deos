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
        <div className="min-h-screen bg-slate-50 font-exo relative flex flex-col">
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
                            className="inline-flex items-center gap-2 !text-white hover:!text-white/80 transition-colors mb-8 text-[10px] font-black uppercase tracking-[0.2em] bg-black/40 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 hover:bg-black/60"
                        >
                            <ArrowLeft size={14} />
                            Voltar ao Dashboard
                        </Link>
                        <div className="flex flex-col md:flex-row md:items-center gap-6 md:gap-8">
                            <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-gradient-to-br from-[#1D5F31] to-[#0a2e15] border border-white/10 flex items-center justify-center shadow-2xl shadow-[#1D5F31]/30 transition-transform hover:scale-105 duration-300">
                                <Heart size={32} className="text-[#00c853] fill-[#00c853] filter drop-shadow-md" />
                            </div>
                            <div>
                                <h1 className="text-3xl md:text-5xl lg:text-6xl font-black uppercase tracking-tighter !text-white drop-shadow-2xl">
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

            <div className="px-6 md:px-12 py-12 max-w-[1600px] mx-auto">
                {wishlistCourses.length === 0 ? (
                    <div className="text-center py-20">
                        <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-6">
                            <Heart size={40} className="text-slate-400" />
                        </div>
                        <h2 className="text-xl font-black uppercase tracking-tighter text-black mb-3">
                            Nenhum curso favoritado
                        </h2>
                        <p className="text-slate-500 font-medium mb-8 max-w-md mx-auto">
                            Explore nosso catálogo e adicione cursos à sua lista para salvá-los aqui.
                        </p>
                        <Link
                            href="/course"
                            className="inline-flex items-center gap-2 bg-[#1D5F31] text-white px-6 py-3 rounded-xl font-black uppercase tracking-widest text-[10px] hover:brightness-110 transition-all"
                        >
                            <GraduationCap size={18} />
                            Explorar Cursos
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                        {wishlistCourses.map((curso) => {
                            const hasPurchased = purchasedCourseIds.includes(curso.id)
                            return (
                            <div key={curso.id} className="group bg-white rounded-[24px] overflow-hidden border border-black shadow-sm hover:shadow-2xl transition-all duration-500 flex flex-col">
                                <div className="relative h-48 overflow-hidden bg-slate-100">
                                    <img
                                        src={curso.image_url || "https://images.unsplash.com/photo-1558655146-d09347e92766?w=400"}
                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                        alt={curso.title}
                                    />
                                    {hasPurchased ? (
                                        <div className="absolute top-4 left-4 bg-[#1D5F31] px-3 py-1.5 rounded-lg z-10">
                                            <span className="text-[8px] font-black text-white tracking-widest uppercase flex items-center gap-1">
                                                <BookOpen size={10} />
                                                Já Possui
                                            </span>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="absolute top-4 left-4 bg-[#1D5F31]/90 backdrop-blur-md px-3 py-1.5 rounded-lg z-10">
                                                <span className="text-[8px] font-black text-white tracking-widest uppercase flex items-center gap-1">
                                                    <Heart size={10} className="fill-white" />
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

                                <div className="p-6 flex-grow flex flex-col">
                                    <h3 className="font-black text-base mb-2 !text-black uppercase leading-tight line-clamp-2 group-hover:text-[#1D5F31] transition-colors">{curso.title}</h3>
                                    <p className="!text-black text-[10px] font-black uppercase line-clamp-2 mb-6">
                                        {curso.description || 'Domine esta habilidade com o método PowerPlay.'}
                                    </p>

                                    <div className="mt-auto pt-4 border-t border-black flex items-center justify-between mb-4">
                                        <div className="flex flex-col">
                                            <span className="text-[8px] font-bold !text-black uppercase tracking-tighter">Investimento</span>
                                            <span className="!text-black font-black text-xl tracking-tight">
                                                R$ {Number(curso.price || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                            </span>
                                        </div>
                                        <Link href={`/course/${curso.id}`} className="p-2.5 bg-slate-50 border border-black rounded-xl !text-black hover:text-[#1D5F31] transition-colors">
                                            <BookOpen size={18} />
                                        </Link>
                                    </div>
                                </div>

                                {!hasPurchased && (
                                    <div className="w-full p-4 bg-slate-50 border-t border-black">
                                        <RemoveFromWishlistButton courseId={curso.id} />
                                    </div>
                                )}
                            </div>
                            )
                        })}
                    </div>
                )}
            </div>
        </div>
    )
}