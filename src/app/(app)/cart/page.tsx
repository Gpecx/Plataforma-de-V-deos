"use client"

import { useCartStore } from '@/store/useCartStore'
import { validateCartItemsAction } from './actions'
import { ShoppingCart, Trash2, CreditCard, ArrowLeft, BookOpen, ChevronRight, ShieldCheck, Gift, X } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useAuth } from '@/context/AuthProvider'
import { db } from '@/lib/firebase'
import { collection, query, where, getDocs, documentId } from 'firebase/firestore'

export default function CartPage() {
    const { items, removeItem, getTotal, purchasedCourseIds } = useCartStore()
    const router = useRouter()
    const { user, loading: authLoading } = useAuth()
    const [mounted, setMounted] = useState(false)
    const [bundleOffer, setBundleOffer] = useState<any>(null)
    const [dismissedBundleIds, setDismissedBundleIds] = useState<string[]>([])
    const [loadingBundle, setLoadingBundle] = useState(false)

    useEffect(() => {
        setMounted(true)
        
        // Validação de integridade do carrinho
        const validateCart = async () => {
            if (items.length === 0) return
            
            const itemIds = items.map(i => i.id)
            const result = await validateCartItemsAction(itemIds)
            
            if (result.validIds) {
                const { validateItems, showNotification } = useCartStore.getState()
                const removedCount = itemIds.length - result.validIds.length
                
                if (removedCount > 0) {
                    validateItems(result.validIds)
                    showNotification(`${removedCount} item(s) foram removidos do seu carrinho pois não estão mais disponíveis.`, 'info')
                }
            }
        }
        
        validateCart()
    }, [])

    // Look for bundle offers when items change
    useEffect(() => {
        if (items.length === 0) return

        const nonBundleItems = items.filter(item => !item.bundle_id)
        if (nonBundleItems.length === 0) return

        const checkBundles = async () => {
            setLoadingBundle(true)
            try {
                const itemIds = nonBundleItems.map(i => i.id)
                const q = query(
                    collection(db, 'bundles'),
                    where('course_ids', 'array-contains-any', itemIds),
                    where('active', '==', true),
                )
                const snapshot = await getDocs(q)
                const found: any[] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))

                // Skip bundles that contain courses the user already owns
                const { purchasedCourseIds: ownedIds } = useCartStore.getState()
                const ownedSet = new Set(ownedIds)
                const available = found.filter(b => !b.course_ids?.some((id: string) => ownedSet.has(id)))

                // Pick first bundle that has at least 1 course in the cart and not dismissed
                const candidate = available.find((b: any) => {
                    if (dismissedBundleIds.includes(b.id)) return false
                    const cartIds = new Set(itemIds)
                    const matchingCourses = b.course_ids.filter((id: string) => cartIds.has(id))
                    return matchingCourses.length >= 1
                })
                if (candidate) {
                    const cartIds = new Set(itemIds)
                    const matchingCourses = candidate.course_ids.filter((id: string) => cartIds.has(id))
                    
                    let bundleCoursesData: any[] = [];
                    try {
                        if (candidate.course_ids && candidate.course_ids.length > 0) {
                            const coursesQuery = query(
                                collection(db, 'courses'),
                                where(documentId(), 'in', candidate.course_ids.slice(0, 30))
                            );
                            const coursesSnapshot = await getDocs(coursesQuery);
                            bundleCoursesData = coursesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                        }
                    } catch (err) {
                        console.error('Error fetching bundle courses:', err);
                    }

                    setBundleOffer({ ...candidate, matchingCourses, bundleCoursesData })
                } else {
                    setBundleOffer(null)
                }
            } catch (error) {
                console.error('Erro ao buscar pacotes:', error)
            }
            setLoadingBundle(false)
        }
        checkBundles()
    }, [items, dismissedBundleIds])

    const handleAcceptBundle = () => {
        if (!bundleOffer) return
        const { addItem: addCartItem, removeItem: removeCartItem, showNotification } = useCartStore.getState()
        // Remove individual course items that are in the bundle
        bundleOffer.course_ids.forEach((courseId: string) => {
            removeCartItem(courseId)
        })
        // Add bundle as a single item
        const bundleCourses = items.filter(i => bundleOffer.course_ids.includes(i.id))
        const firstImage = bundleCourses.find((i: any) => i.image_url)?.image_url
        addCartItem({
            id: `bundle-${bundleOffer.id}`,
            title: bundleOffer.name,
            price: bundleOffer.bundle_price,
            image_url: firstImage,
            bundle_id: bundleOffer.id,
            course_ids: bundleOffer.course_ids,
        })
        setBundleOffer(null)
        showNotification('PACOTE ADICIONADO!', 'success')
    }

    const handleDismissBundle = () => {
        if (bundleOffer) {
            setDismissedBundleIds(prev => [...prev, bundleOffer.id])
            setBundleOffer(null)
        }
    }

    const hasPurchasedItems = items.some(item => purchasedCourseIds.includes(item.id))
    const isValidatingOwnership = authLoading && items.length > 0

    const handleFinalizePurchase = () => {
        if (!authLoading && !user) {
            router.push('/login?redirectTo=/cart')
            return
        }
        
        if (hasPurchasedItems) {
            return
        }
        
        router.push('/pagamento')
    }

    if (!mounted) return null

    const subtotal = getTotal()

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 font-montserrat border-t border-slate-200">
            <div className="w-full px-4 md:px-8 lg:px-12 pt-28 pb-12">
                <div className="mb-12 flex flex-col md:flex-row md:items-center justify-between gap-8">
                    <div className="flex items-center gap-6">
                        <div className="w-16 h-16 bg-[#1D5F31] rounded-2xl flex items-center justify-center text-white shadow-lg relative">
                            <ShoppingCart size={28} strokeWidth={2.5} className="text-white" />
                            <span className="absolute -top-2 -right-2 bg-white text-[#1D5F31] text-[11px] font-bold w-7 h-7 flex items-center justify-center rounded-full border-2 border-[#1D5F31] shadow-sm">
                                {items.length}
                            </span>
                        </div>
                        <div>
                            <h1 className="text-4xl font-bold tracking-tighter uppercase mb-1 flex items-center gap-3 flex-wrap">
                                <span className="!text-slate-900">SEU</span>
                                <span className="text-[#1D5F31]">CARRINHO</span>
                            </h1>
                            <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[4px]">
                                {items.length === 0 ? 'Seu carrinho está vazio' : `VOCÊ TEM ${items.length} ITENS SELECIONADOS`}
                            </p>
                        </div>
                    </div>
                    <Link
                        href="/course"
                        className="flex items-center gap-3 text-[11px] font-bold uppercase tracking-widest text-slate-600 hover:text-slate-900 transition group border border-slate-200 bg-white px-8 py-5 rounded-xl shadow-sm hover:shadow-md active:scale-95 w-fit"
                    >
                        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition" />
                        Continuar Comprando
                    </Link>
                </div>

                {items.length > 0 ? (
                    <div className="grid grid-cols-1 xl:grid-cols-4 gap-10">
                        {/* Cart Items List */}
                        <div className="xl:col-span-3 space-y-6">
                            {items.map((course) => (
                                <div
                                    key={course.id}
                                    className="bg-white border border-slate-200 p-6 md:p-8 flex flex-col md:flex-row gap-8 items-center hover:border-[#1D5F31]/30 transition-all group shadow-sm rounded-[24px] overflow-hidden"
                                >
                                    <div className="w-full md:w-56 h-32 bg-slate-50 rounded-xl overflow-hidden shrink-0 relative border border-slate-100">
                                        <img
                                            src={course.image_url || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&q=80"}
                                            alt={course.title}
                                            className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                                        />
                                        {course.bundle_id && (
                                            <div className="absolute top-2 left-2 bg-amber-500 text-white text-[7px] font-bold uppercase tracking-widest px-2 py-1 rounded-md shadow-sm">
                                                PACOTE
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 text-center md:text-left">
                                        <h3 className="text-2xl font-bold tracking-tighter mb-3 group-hover:text-[#1D5F31] transition uppercase !text-slate-900 leading-tight">{course.title}</h3>
                                        {course.bundle_id && course.course_ids && (
                                            <div className="flex flex-wrap gap-1.5 mb-3 justify-center md:justify-start">
                                                <span className="text-[8px] font-bold uppercase tracking-wider text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                                                    {course.course_ids.length} cursos no pacote
                                                </span>
                                            </div>
                                        )}
                                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-5 mb-5">
                                            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 rounded-full bg-[#1D5F31]"></div>
                                                Certificado PowerPlay
                                            </span>
                                        </div>
                                        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-slate-50 border border-slate-100 text-slate-500 text-[10px] font-bold uppercase tracking-[2px] rounded-lg">
                                            {course.bundle_id ? 'Pacote de Cursos' : 'Treinamento Premium'}
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-center md:items-end gap-6 min-w-[160px]">
                                        <div className="text-center md:text-right">
                                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest block mb-1">{course.bundle_id ? 'Preço do Pacote' : 'Preço do Curso'}</span>
                                            <span className="text-3xl font-bold text-slate-900 tracking-tight">R$ {course.price.toFixed(2)}</span>
                                        </div>
                                        <button
                                            onClick={() => removeItem(course.id)}
                                            className="p-4 bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-all border border-red-100 rounded-xl shadow-sm active:scale-95"
                                        >
                                            <Trash2 size={20} />
                                        </button>
                                    </div>
                                </div>
                            ))}

                            {/* Bundle Upsell Card */}
                            {bundleOffer && !loadingBundle && (
                                <div className="bg-[#0B2514] text-white p-6 md:p-8 rounded-[24px] shadow-2xl shadow-[#1D5F31]/20 border border-[#1D5F31]/30 relative overflow-hidden group">
                                    <div className="absolute -top-32 -right-32 w-64 h-64 bg-[#1D5F31] rounded-full blur-[100px] opacity-40 group-hover:opacity-60 transition-opacity duration-700 pointer-events-none"></div>
                                    <div className="absolute -bottom-32 -left-32 w-64 h-64 bg-emerald-600 rounded-full blur-[100px] opacity-20 group-hover:opacity-40 transition-opacity duration-700 pointer-events-none"></div>
                                    
                                    <div className="relative z-10">
                                        <div className="flex items-center justify-between mb-8">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2.5 bg-[#1D5F31]/50 border border-emerald-500/30 rounded-xl backdrop-blur-sm">
                                                    <Gift size={20} className="text-emerald-400" />
                                                </div>
                                                <span className="text-[10px] font-bold uppercase tracking-[4px] text-emerald-300 bg-emerald-950/50 border border-emerald-800/50 px-4 py-2 rounded-lg backdrop-blur-sm shadow-inner">
                                                    Oferta Especial
                                                </span>
                                            </div>
                                            <button
                                                onClick={handleDismissBundle}
                                                className="p-2 hover:bg-white/10 rounded-xl transition-all text-slate-400 hover:text-white"
                                            >
                                                <X size={20} />
                                            </button>
                                        </div>

                                        <div className="flex flex-col md:flex-row md:items-start justify-between gap-8">
                                            <div className="flex-1 min-w-0">
                                                <h3 className="text-3xl md:text-4xl font-black tracking-tighter uppercase text-white mb-2 leading-none">
                                                    {bundleOffer.name}
                                                </h3>
                                                <p className="text-emerald-100/70 text-sm font-medium mb-8">
                                                    Eleve seu conhecimento com este pacote exclusivo e economize muito.
                                                </p>

                                                {bundleOffer.bundleCoursesData && bundleOffer.bundleCoursesData.length > 0 && (
                                                    <div className="mt-2 bg-white/5 rounded-2xl p-5 border border-white/10">
                                                        <p className="text-[11px] font-bold uppercase tracking-[3px] text-emerald-400 mb-4 flex items-center gap-2">
                                                            <BookOpen size={14} />
                                                            Este pacote inclui:
                                                        </p>
                                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                            {bundleOffer.bundleCoursesData.map((course: any) => (
                                                                <div
                                                                    key={course.id}
                                                                    className="bg-[#0f341b] border border-emerald-800/30 hover:border-emerald-500/50 transition-all p-2 rounded-xl flex items-center gap-3 group/course"
                                                                >
                                                                    <div className="w-16 h-16 rounded-lg overflow-hidden shrink-0 border border-white/10 relative">
                                                                        <img
                                                                            src={course.image_url || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&q=80"}
                                                                            alt={course.title}
                                                                            className="w-full h-full object-cover group-hover/course:scale-110 transition duration-500"
                                                                        />
                                                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                                                                    </div>
                                                                    <div className="min-w-0 flex-1 pr-2">
                                                                        <p className="text-xs font-bold text-white truncate mb-1">
                                                                            {course.title}
                                                                        </p>
                                                                        <Link href={`/course/${course.id}`} className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-emerald-300 hover:text-emerald-100 transition-colors">
                                                                            Ver Detalhes <ChevronRight size={10} />
                                                                        </Link>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="flex flex-col items-start md:items-end gap-6 shrink-0 md:min-w-[240px] md:pt-2">
                                                <div className="text-left md:text-right w-full bg-white/5 md:bg-transparent p-5 md:p-0 rounded-2xl md:rounded-none border border-white/10 md:border-none">
                                                    <span className="text-[10px] text-emerald-400/80 font-bold uppercase tracking-[3px] block mb-2">
                                                        Preço do Pacote
                                                    </span>
                                                    <div className="flex items-baseline gap-3 flex-wrap md:justify-end mb-1">
                                                        <span className="text-4xl font-black text-white tracking-tighter">
                                                            R$ {(bundleOffer.bundle_price || 0).toFixed(2)}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-2 flex-wrap md:justify-end">
                                                        <span className="text-sm text-emerald-200/50 line-through font-bold">
                                                            R$ {(bundleOffer.original_price || 0).toFixed(2)}
                                                        </span>
                                                        {bundleOffer.original_price > bundleOffer.bundle_price && (
                                                            <span className="text-[10px] font-bold text-emerald-950 bg-emerald-400 px-2 py-0.5 rounded-md shadow-sm">
                                                                -{Math.round((1 - bundleOffer.bundle_price / bundleOffer.original_price) * 100)}%
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-[11px] text-emerald-100/70 font-bold uppercase tracking-wider mt-3 bg-emerald-900/30 inline-block px-3 py-1.5 rounded-lg border border-emerald-800/30">
                                                        Você economiza <span className="text-emerald-400">R$ {((bundleOffer.original_price || 0) - (bundleOffer.bundle_price || 0)).toFixed(2)}</span>
                                                    </p>
                                                </div>

                                                <div className="flex flex-col gap-3 w-full mt-2">
                                                    <button
                                                        onClick={handleAcceptBundle}
                                                        className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-black uppercase text-[11px] tracking-[3px] rounded-xl transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)] active:scale-95 flex items-center justify-center gap-2"
                                                    >
                                                        Adicionar Pacote <ArrowLeft className="rotate-180" size={16} strokeWidth={2.5} />
                                                    </button>
                                                    <button
                                                        onClick={handleDismissBundle}
                                                        className="w-full py-3 bg-transparent text-emerald-100/50 hover:text-white hover:bg-white/5 font-bold uppercase text-[10px] tracking-widest rounded-xl transition-all active:scale-95"
                                                    >
                                                        Não, Obrigado
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Bundle badge on bundle items */}
                            {items.some(i => i.bundle_id) && (
                                <div className="bg-blue-50 border border-blue-200 p-4 rounded-2xl flex items-center gap-3">
                                    <Gift size={18} className="text-blue-500 shrink-0" />
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-blue-700">
                                        Pacote de cursos no carrinho — você está levando vários cursos com preço especial!
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Summary Section */}
                        <div className="xl:col-span-1 space-y-6">
                            <div className="bg-white border border-slate-200 p-8 md:p-10 shadow-lg rounded-[32px]">
                                <h2 className="text-2xl font-bold uppercase mb-8 border-b border-slate-100 pb-6 tracking-tighter"><span className="!text-slate-900">RESUMO DO</span> <span className="text-[#1D5F31]">PEDIDO</span></h2>

                                <div className="space-y-5 mb-10">
                                    <div className="flex justify-between font-bold uppercase text-[11px] tracking-widest text-slate-500">
                                        <span>Subtotal</span>
                                        <span className="text-slate-900 font-bold">R$ {subtotal.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between font-bold uppercase text-[11px] tracking-widest text-slate-500">
                                        <span>Descontos</span>
                                        <span className="text-[#1D5F31] font-bold">R$ 0,00</span>
                                    </div>
                                    <div className="h-px bg-slate-100 my-8"></div>
                                    <div className="flex flex-col gap-1.5">
                                        <span className="text-[10px] font-bold uppercase tracking-[4px] text-slate-400">Total do Investimento</span>
                                        <div className="text-4xl font-bold text-slate-900 tracking-tighter">
                                            R$ {subtotal.toFixed(2)}
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={handleFinalizePurchase}
                                    disabled={authLoading || isValidatingOwnership}
                                    className="w-full py-6 bg-[#1D5F31] text-white font-bold uppercase tracking-[3px] hover:opacity-95 active:scale-[0.98] transition-all shadow-xl shadow-[#1D5F31]/20 flex items-center justify-center gap-3 text-sm rounded-2xl disabled:opacity-50"
                                >
                                    <CreditCard size={20} strokeWidth={2.5} />
                                    {authLoading || isValidatingOwnership ? 'Validando...' : 'Finalizar Pagamento'}
                                    <ChevronRight size={20} strokeWidth={2.5} />
                                </button>
                            </div>

                            <div className="bg-slate-50 border border-slate-200 p-8 rounded-[24px]">
                                <div className="flex items-center gap-4 mb-5">
                                    <div className="w-10 h-10 bg-white border border-slate-200 flex items-center justify-center shadow-sm rounded-xl">
                                        <ShieldCheck size={20} className="text-[#1D5F31]" />
                                    </div>
                                    <h4 className="text-[11px] font-bold uppercase tracking-[2px] text-slate-900">Compra Segura PowerPlay</h4>
                                </div>
                                <p className="text-[11px] text-slate-500 leading-relaxed font-bold uppercase tracking-wider">
                                    Ambiente criptografado com certificação SSL de 256 bits. Garantia incondicional de 7 dias para cancelamento e reembolso integral.
                                </p>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-32 bg-white border border-slate-200 shadow-sm rounded-[32px]">
                        <div className="w-24 h-24 bg-slate-50 flex items-center justify-center mx-auto mb-10 border border-slate-100 rounded-full shadow-inner">
                            <BookOpen size={40} className="text-slate-300" />
                        </div>
                        <h2 className="text-3xl font-bold tracking-tighter mb-4 !text-slate-900 uppercase">Seu carrinho está vazio</h2>
                        <p className="!text-slate-800 mb-12 font-bold uppercase text-[11px] tracking-[4px]">Explore nossos treinamentos e comece sua evolução hoje.</p>
                        <Link href="/course">
                            <button className="px-12 py-6 bg-[#1D5F31] text-white font-bold uppercase tracking-widest text-xs hover:opacity-90 transition-all shadow-xl shadow-[#1D5F31]/20 rounded-2xl active:scale-95">
                                Ver Catálogo de Cursos
                            </button>
                        </Link>
                    </div>
                )}
            </div>
        </div>
    )
}