"use client"

import { useEffect, useState, Suspense, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import { auth, db } from '@/lib/firebase'
import { collection, query, where, getDocs, addDoc, doc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore'
import { onAuthStateChanged } from 'firebase/auth'

import Link from 'next/link'
import {
    Plus,
    Search,
    Filter,
    Edit,
    Trash2,
    Loader2,
    Package,
    Gift,
    X,
    Play
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { XCircle } from 'lucide-react'
import { toast } from 'sonner'
import { deleteCourseAction, cancelCourseDeletionRequest } from './actions'
import { normalizeString } from '@/lib/utils'
import Image from 'next/image'

function CoursesContent() {
    const [courses, setCourses] = useState<any[]>([])
    const [bundles, setBundles] = useState<any[]>([])
    const [searchTerm, setSearchTerm] = useState("")
    const [loading, setLoading] = useState(true)
    const [showBundleModal, setShowBundleModal] = useState(false)
    const [bundleName, setBundleName] = useState('')
    const [bundlePrice, setBundlePrice] = useState('')
    const [selectedCourseIds, setSelectedCourseIds] = useState<string[]>([])
    const [savingBundle, setSavingBundle] = useState(false)
    const searchParams = useSearchParams()

    useEffect(() => {
        const q = searchParams.get('q')
        if (q) {
            setSearchTerm(decodeURIComponent(q))
        }
    }, [searchParams])

    // FIX: unificado em um único listener onAuthStateChanged para evitar
    // duas assinaturas de auth simultâneas e possível race condition
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                try {
                    // Carrega cursos e bundles em paralelo dentro do mesmo listener
                    const [coursesSnapshot, bundlesSnapshot] = await Promise.all([
                        getDocs(query(collection(db, 'courses'), where('teacher_id', '==', user.uid))),
                        getDocs(query(collection(db, 'bundles'), where('teacher_id', '==', user.uid)))
                    ])

                    const coursesData = coursesSnapshot.docs.map(doc => {
                        const courseData = doc.data()
                        return {
                            id: doc.id,
                            ...courseData,
                            image_url: courseData.image_url || courseData.imageUrl || courseData.image || null
                        }
                    })

                    const bundlesData = bundlesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))

                    setCourses(coursesData)
                    setBundles(bundlesData)
                } catch (error) {
                    console.error("Erro ao carregar dados:", error)
                }
            }
            setLoading(false)
        })

        return () => unsubscribe()
    }, [])

    const selectedCoursesTotal = courses
        .filter(c => selectedCourseIds.includes(c.id))
        .reduce((sum, c) => sum + (Number(c.price) || 0), 0)
    const savings = selectedCoursesTotal - Number(bundlePrice || 0)
    const savingsPercent = selectedCoursesTotal > 0 ? Math.round((savings / selectedCoursesTotal) * 100) : 0

    const handleCreateBundle = async () => {
        if (!bundleName.trim() || selectedCourseIds.length < 2 || !bundlePrice) {
            toast.error('Preencha todos os campos e selecione ao menos 2 cursos.')
            return
        }
        setSavingBundle(true)
        try {
            const user = auth.currentUser
            if (!user) return
            await addDoc(collection(db, 'bundles'), {
                teacher_id: user.uid,
                name: bundleName.trim(),
                course_ids: selectedCourseIds,
                original_price: selectedCoursesTotal,
                bundle_price: Number(bundlePrice),
                active: true,
                created_at: new Date(),
            })
            toast.success('PACOTE CRIADO!', {
                description: 'O pacote foi criado com sucesso.',
                style: { background: '#1D5F31', color: '#fff', border: '2px solid #1D5F31', borderRadius: '12px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '2px', boxShadow: 'none' },
                icon: '🎯'
            })
            setShowBundleModal(false)
            setBundleName('')
            setBundlePrice('')
            setSelectedCourseIds([])
            // Reload bundles
            const bundlesRef = collection(db, 'bundles')
            const q = query(bundlesRef, where('teacher_id', '==', user.uid))
            const snapshot = await getDocs(q)
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
            setBundles(data)
        } catch (error) {
            console.error('Erro ao criar pacote:', error)
            toast.error('ERRO AO CRIAR PACOTE')
        }
        setSavingBundle(false)
    }

    const handleToggleBundle = async (bundleId: string, currentActive: boolean) => {
        try {
            await updateDoc(doc(db, 'bundles', bundleId), { active: !currentActive })
            setBundles(prev => prev.map(b => b.id === bundleId ? { ...b, active: !currentActive } : b))
        } catch (error) {
            console.error('Erro ao alterar pacote:', error)
        }
    }

    const handleDeleteBundle = async (bundleId: string) => {
        try {
            await deleteDoc(doc(db, 'bundles', bundleId))
            setBundles(prev => prev.filter(b => b.id !== bundleId))
            toast.success('PACOTE REMOVIDO')
        } catch (error) {
            console.error('Erro ao remover pacote:', error)
        }
    }

    const handleDelete = (courseId: string, currentStatus: string) => {
        const isAprovado = currentStatus === 'APROVADO'
        const confirmMessage = isAprovado
            ? "O curso será enviado para análise antes de ser removido."
            : "Todos os dados e alunos vinculados serão perdidos."

        toast(isAprovado ? "Solicitar exclusão" : "Excluir curso", {
            description: (
                <div className="mt-1 flex flex-col gap-1">
                    <span className="text-slate-500 font-medium text-xs leading-relaxed">
                        {confirmMessage}
                    </span>
                </div>
            ),
            duration: 8000,
            style: {
                background: '#fff',
                color: '#0f172a',
                border: '1px solid #e2e8f0',
                borderRadius: '16px',
                boxShadow: '0 10px 30px -10px rgba(0,0,0,0.08)',
                padding: '20px'
            },
            actionButtonStyle: {
                background: '#1D5F31',
                color: '#fff',
                borderRadius: '10px',
                fontWeight: '600',
                fontSize: '11px',
                padding: '8px 16px'
            },
            cancelButtonStyle: {
                background: '#f8fafc',
                color: '#64748b',
                borderRadius: '10px',
                fontWeight: '500',
                fontSize: '11px',
                border: '1px solid #e2e8f0',
                padding: '8px 16px'
            },
            action: {
                label: 'Confirmar',
                onClick: async () => {
                    const result = await deleteCourseAction(courseId)

                    if (result.success) {
                        if (result.requested) {
                            toast.success("SOLICITAÇÃO ENVIADA!", {
                                description: "Solicitação de exclusão enviada ao admin.",
                                style: { background: '#1D5F31', color: '#fff', border: '2px solid #1D5F31', borderRadius: '12px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '2px', boxShadow: 'none' },
                                icon: '📋'
                            })
                            setCourses(prev => prev.map(c => c.id === courseId ? { ...c, status: 'SOLICITADO_EXCLUSAO' } : c))
                        } else {
                            setCourses(prev => prev.filter(c => c.id !== courseId))
                            toast.success("CURSO REMOVIDO!", {
                                description: "Curso excluído com sucesso.",
                                style: { background: '#1D5F31', color: '#fff', border: '2px solid #1D5F31', borderRadius: '12px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '2px', boxShadow: 'none' },
                                icon: '🚀'
                            })
                        }
                    } else {
                        toast.error("ERRO AO REMOVER", {
                            description: result.error,
                            style: { background: '#fff', color: '#ef4444', border: '2px solid #ef4444', borderRadius: '12px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '2px', boxShadow: 'none' }
                        })
                    }
                }
            },
            cancel: {
                label: 'Cancelar',
                onClick: () => { }
            }
        })
    }

    const handleCancelDeletionRequest = (courseId: string) => {
        toast("Cancelar exclusão", {
            description: (
                <div className="mt-1 flex flex-col gap-1">
                    <span className="text-slate-500 font-medium text-xs leading-relaxed">
                        O curso voltará a ficar ativo para os alunos.
                    </span>
                </div>
            ),
            duration: 8000,
            style: {
                background: '#fff',
                color: '#0f172a',
                border: '1px solid #e2e8f0',
                borderRadius: '16px',
                boxShadow: '0 10px 30px -10px rgba(0,0,0,0.08)',
                padding: '20px'
            },
            actionButtonStyle: {
                background: '#1D5F31',
                color: '#fff',
                borderRadius: '10px',
                fontWeight: '600',
                fontSize: '11px',
                padding: '8px 16px'
            },
            cancelButtonStyle: {
                background: '#f8fafc',
                color: '#64748b',
                borderRadius: '10px',
                fontWeight: '500',
                fontSize: '11px',
                border: '1px solid #e2e8f0',
                padding: '8px 16px'
            },
            action: {
                label: 'Confirmar',
                onClick: async () => {
                    const result = await cancelCourseDeletionRequest(courseId)

                    if (result.success) {
                        toast.success("SOLICITAÇÃO CANCELADA!", {
                            description: "O curso voltou a estar ativo.",
                            style: { background: '#1D5F31', color: '#fff', border: '2px solid #1D5F31', borderRadius: '12px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '2px', boxShadow: 'none' },
                            icon: '✅'
                        })
                        setCourses(prev => prev.map(c => c.id === courseId ? { ...c, status: 'APROVADO' } : c))
                    } else {
                        toast.error("ERRO AO CANCELAR", {
                            description: result.error,
                            style: { background: '#fff', color: '#ef4444', border: '2px solid #ef4444', borderRadius: '12px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '2px', boxShadow: 'none' }
                        })
                    }
                }
            },
            cancel: {
                label: 'Voltar',
                onClick: () => { }
            }
        })
    }

    const filteredCourses = useMemo(() => courses.filter(curso =>
        curso.title ? normalizeString(curso.title).includes(normalizeString(searchTerm)) : false
    ), [courses, searchTerm])

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-transparent">
                <Loader2 className="animate-spin text-[#1D5F31]" size={48} />
            </div>
        )
    }

    return (
        <div className="pb-16 md:pb-24 bg-transparent min-h-screen font-montserrat animate-in fade-in duration-500">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center pt-8 px-4 md:px-8 mb-12 gap-8">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold tracking-tighter uppercase leading-none text-slate-900 max-w-xl">
                        Meus <span className="text-[#1D5F31]">Cursos</span>
                    </h1>
                    <p className="text-slate-600 mt-3 text-[10px] font-bold uppercase tracking-[3px]">Gerencie e acompanhe o desempenho de suas aulas.</p>
                </div>
                <div className="flex gap-4">
                    <Link href={"/dashboard-teacher/live" as any}>
                        <Button className="bg-slate-900 text-white font-bold uppercase text-xs tracking-widest px-8 h-16 flex items-center justify-center gap-2 rounded-lg hover:opacity-90 shadow-xl shadow-slate-900/10 active:scale-95 transition-all">
                            <Play size={18} strokeWidth={3} />
                            LIVE
                        </Button>
                    </Link>
                    <Button
                        onClick={() => setShowBundleModal(true)}
                        className="bg-amber-600 text-white font-bold uppercase text-[10px] tracking-widest px-10 h-16 rounded-lg hover:opacity-90 shadow-xl shadow-amber-600/10 active:scale-95 transition-all"
                    >
                        <Package size={20} className="mr-2" strokeWidth={3} />
                        Criar Pacote
                    </Button>
                    <Link href="/dashboard-teacher/courses/new">
                        <Button className="bg-[#1D5F31] text-white font-bold uppercase text-[10px] tracking-widest px-10 h-16 rounded-lg hover:opacity-90 shadow-xl shadow-[#1D5F31]/10 active:scale-95 transition-all">
                            <Plus size={20} className="mr-2" strokeWidth={3} />
                            Lançar Novo Curso
                        </Button>
                    </Link>
                </div>
            </header>

            <div className="px-4 md:px-8 mb-12">
                <div className="flex flex-col md:flex-row gap-6">
                    <div className="relative flex-grow group">
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-[#1D5F31]" size={20} />
                        <Input
                            placeholder="Buscar por nome do curso..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="bg-white border border-black/20 pl-14 h-16 rounded-lg focus:border-black focus:ring-1 focus:ring-black/20 text-sm font-bold text-slate-900 placeholder:text-slate-400 shadow-sm transition-all"
                        />
                    </div>
                    <div className="bg-white border border-black/20 text-slate-500 h-16 px-10 rounded-lg flex items-center gap-4 shadow-sm">
                        <Filter size={18} className="text-[#1D5F31]" />
                        <span className="text-[10px] font-bold uppercase tracking-[3px] whitespace-nowrap">{filteredCourses.length} Encontrados</span>
                    </div>
                </div>
            </div>

            <div className="px-4 md:px-8">
                {filteredCourses.length === 0 ? (
                    <div className="py-20 flex justify-center items-center">
                        <p className="text-slate-900 font-bold uppercase tracking-widest text-base md:text-lg">
                            NENHUM CURSO ENCONTRADO EM SUA BIBLIOTECA.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-8">
                        {filteredCourses.map((curso) => (
                            <div key={curso.id} className="group bg-white rounded-lg border border-black/20 flex flex-col hover:border-black transition-all duration-500 shadow-sm hover:shadow-xl overflow-hidden">
                                <div className="relative h-44 bg-slate-100 overflow-hidden">
                                    {/* FIX: substituído <img> por <Image /> do Next.js */}
                                    <Image
                                        src={curso.image_url || "https://images.unsplash.com/photo-1627398242454-45a1465c2479?w=400"}
                                        alt={curso.title}
                                        fill
                                        className="object-cover group-hover:scale-110 transition-transform duration-700"
                                    />
                                    <div className="absolute top-4 right-4 flex flex-col gap-2 z-10">
                                        <div className="bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-black/20 shadow-sm">
                                            <span className="text-[8px] font-bold text-slate-900 tracking-widest uppercase">{curso.category || 'GERAL'}</span>
                                        </div>
                                        <div className={`px-3 py-1.5 rounded-lg border shadow-sm ${curso.status === 'APROVADO'
                                                ? 'bg-white/95 backdrop-blur-md border-[#1D5F31]/30'
                                                : curso.status === 'SOLICITADO_EXCLUSAO'
                                                    ? 'bg-red-50 border-red-300'
                                                    : 'bg-amber-50 border-amber-300'
                                            }`}>
                                            <span className={`text-[8px] font-bold tracking-widest uppercase ${curso.status === 'APROVADO' ? 'text-[#1D5F31]' :
                                                    curso.status === 'SOLICITADO_EXCLUSAO' ? 'text-red-600' : 'text-amber-700'
                                                }`}>
                                                {curso.status === 'APROVADO' ? 'Aprovado' :
                                                    curso.status === 'SOLICITADO_EXCLUSAO' ? 'Remoção Solicitada' : 'Pendente'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-8 flex-grow flex flex-col">
                                    <h3 className="text-lg font-bold tracking-tight text-slate-900 mb-6 line-clamp-2 uppercase leading-tight group-hover:text-[#1D5F31] transition-colors">{curso.title}</h3>

                                    <div className="flex justify-between items-end mb-8 pt-6 border-t border-black/20">
                                        <div className="flex flex-col">
                                            <span className="text-[8px] font-bold uppercase text-slate-600 tracking-[1px] mb-1">Preço de Venda</span>
                                            <span className="text-slate-900 font-bold text-xl tracking-tighter leading-none">
                                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(curso.price || 0)}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="mt-auto flex gap-4">
                                        <Link href={`/dashboard-teacher/courses/${curso.id}/edit`} className="flex-grow">
                                            <Button className="w-full bg-slate-900 hover:bg-[#1D5F31] text-white font-bold uppercase tracking-widest py-4 h-auto rounded-md transition-all duration-300 text-[10px] shadow-md border border-black/20">
                                                <Edit size={14} className="mr-2" /> Editar
                                            </Button>
                                        </Link>

                                        {curso.status === 'SOLICITADO_EXCLUSAO' ? (
                                            <Button
                                                variant="outline"
                                                onClick={() => handleCancelDeletionRequest(curso.id)}
                                                className="border border-amber-400 text-amber-600 hover:text-amber-700 hover:bg-amber-50 p-4 w-14 h-14 rounded-md transition-all shadow-sm"
                                                title="Cancelar solicitação de exclusão"
                                            >
                                                <XCircle size={18} />
                                            </Button>
                                        ) : (
                                            <Button
                                                variant="outline"
                                                onClick={() => handleDelete(curso.id, curso.status)}
                                                className="border border-black/20 text-slate-600 hover:text-red-600 hover:border-red-600 hover:bg-red-50 p-4 w-14 h-14 rounded-md transition-all shadow-sm"
                                                title="Excluir curso"
                                            >
                                                <Trash2 size={18} />
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Bundles Section */}
            {bundles.length > 0 && (
                <div className="px-4 md:px-8 mt-16">
                    <div className="border-t border-black/10 pt-12 mb-8">
                        <h2 className="text-xl font-bold tracking-tighter uppercase text-slate-900">
                            Meus <span className="text-amber-600">Pacotes</span>
                        </h2>
                        <p className="text-slate-600 mt-2 text-[10px] font-bold uppercase tracking-[3px]">Pacotes de cursos com preço especial.</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {bundles.map((bundle) => {
                            const bundleCourses = courses.filter(c => bundle.course_ids?.includes(c.id))
                            return (
                                <div key={bundle.id} className="bg-white rounded-lg border border-black/20 p-6 flex flex-col gap-4 shadow-sm">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2.5 bg-amber-50 rounded-md border border-amber-200">
                                                <Gift size={18} className="text-amber-600" />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-sm tracking-tight uppercase text-slate-900">{bundle.name}</h3>
                                                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{bundleCourses.length} cursos</span>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleToggleBundle(bundle.id, bundle.active)}
                                            className={`relative w-10 h-6 rounded-full transition-colors ${bundle.active ? 'bg-[#1D5F31]' : 'bg-slate-300'}`}
                                        >
                                            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${bundle.active ? 'left-5' : 'left-1'}`} />
                                        </button>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {bundleCourses.map((c: any) => (
                                            <span key={c.id} className="text-[9px] font-bold uppercase tracking-wider bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-md text-slate-600">
                                                {c.title}
                                            </span>
                                        ))}
                                    </div>
                                    <div className="flex items-center gap-3 text-sm border-t border-black/10 pt-4">
                                        <span className="text-slate-400 line-through font-bold text-xs">R$ {(bundle.original_price || 0).toFixed(2)}</span>
                                        <span className="text-amber-600 font-bold text-lg">R$ {(bundle.bundle_price || 0).toFixed(2)}</span>
                                        {bundle.original_price > bundle.bundle_price && (
                                            <span className="text-[10px] font-bold text-[#1D5F31] bg-green-50 border border-green-200 px-2 py-0.5 rounded">
                                                -{Math.round((1 - bundle.bundle_price / bundle.original_price) * 100)}%
                                            </span>
                                        )}
                                    </div>
                                    <button
                                        onClick={() => handleDeleteBundle(bundle.id)}
                                        className="text-[10px] font-bold uppercase tracking-widest text-red-500 hover:text-red-600 self-end"
                                    >
                                        Remover
                                    </button>
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}

            {/* Bundle Creation Modal */}
            {showBundleModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setShowBundleModal(false)}>
                    <div className="bg-[#FAFAFA] rounded-lg w-full max-w-xl mx-4 p-8 shadow-2xl border border-slate-200/60 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-300" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-white rounded-md border border-slate-200 shadow-sm">
                                    <Package size={22} className="text-amber-600" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold tracking-tighter uppercase text-slate-900">Criar Pacote</h2>
                                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[3px]">Combine cursos com preço especial</p>
                                </div>
                            </div>
                            <button onClick={() => setShowBundleModal(false)} className="p-2 hover:bg-slate-200/50 text-slate-400 hover:text-slate-600 rounded-md transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="space-y-6">
                            <div className="group">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2 block group-focus-within:text-amber-600 transition-colors">Nome do Pacote</label>
                                <Input
                                    placeholder="Ex: Kit Elétrica Completa"
                                    value={bundleName}
                                    onChange={e => setBundleName(e.target.value)}
                                    className="h-14 rounded-md border-slate-200 bg-white hover:bg-slate-50 focus:bg-white px-5 text-sm font-bold shadow-sm transition-all focus:border-amber-500 focus:ring-1 focus:ring-amber-500 placeholder:text-slate-400 placeholder:font-medium"
                                />
                            </div>

                            <div className="group">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2 block group-focus-within:text-amber-600 transition-colors">Selecionar Cursos (mín. 2)</label>
                                <div className="space-y-2 max-h-[260px] overflow-y-auto pr-2 custom-scrollbar">
                                    {courses.map(c => (
                                        <label key={c.id} className={`flex items-start sm:items-center gap-4 p-4 rounded-md cursor-pointer transition-all duration-200 ${selectedCourseIds.includes(c.id) ? 'bg-amber-50/70 border-amber-200 shadow-sm' : 'bg-white border-slate-200 hover:bg-slate-50 shadow-sm'} border`}>
                                            <div className={`mt-0.5 sm:mt-0 flex-shrink-0 flex items-center justify-center w-5 h-5 rounded-md border transition-colors ${selectedCourseIds.includes(c.id) ? 'bg-amber-600 border-amber-600 text-white' : 'bg-slate-50 border-slate-300'}`}>
                                                {selectedCourseIds.includes(c.id) && <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                                            </div>
                                            <div className="flex-1 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                                <span className="text-sm font-bold text-slate-700 leading-tight">{c.title}</span>
                                                <span className="text-[11px] font-bold text-slate-500 bg-slate-100/80 px-2.5 py-1.5 rounded-md border border-slate-200/60 whitespace-nowrap">R$ {(Number(c.price) || 0).toFixed(2)}</span>
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div className="group">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2 block group-focus-within:text-amber-600 transition-colors">Preço do Pacote (R$)</label>
                                <div className="relative">
                                    <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">R$</span>
                                    <Input
                                        type="number"
                                        placeholder="199,00"
                                        value={bundlePrice}
                                        onChange={e => setBundlePrice(e.target.value)}
                                        className="h-14 rounded-md border-slate-200 bg-white hover:bg-slate-50 focus:bg-white pl-12 pr-5 text-sm font-bold shadow-sm transition-all focus:border-amber-500 focus:ring-1 focus:ring-amber-500 placeholder:text-slate-400 placeholder:font-medium"
                                        min={0}
                                        step={0.01}
                                    />
                                </div>
                            </div>

                            {selectedCourseIds.length >= 2 && (
                                <div className="bg-white rounded-md p-5 border border-slate-200 shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-300">
                                    <div className="flex justify-between items-center mb-3">
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Preço Original</span>
                                        <span className="text-sm font-bold text-slate-400 line-through">R$ {selectedCoursesTotal.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-bold uppercase tracking-widest text-emerald-600">Sua Economia</span>
                                            {savingsPercent > 0 && (
                                                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded-md">
                                                    -{savingsPercent}%
                                                </span>
                                            )}
                                        </div>
                                        <div className="text-right">
                                            <span className="text-xl font-black tracking-tighter text-slate-900">
                                                R$ {Number(bundlePrice || 0).toFixed(2)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="flex gap-4 pt-2">
                                <Button
                                    onClick={() => setShowBundleModal(false)}
                                    variant="outline"
                                    className="flex-1 h-14 rounded-md border-slate-200 bg-white hover:bg-slate-50 text-slate-600 font-bold uppercase text-[10px] tracking-widest shadow-sm transition-all"
                                >
                                    Cancelar
                                </Button>
                                <Button
                                    onClick={handleCreateBundle}
                                    disabled={savingBundle || selectedCourseIds.length < 2 || !bundleName.trim() || !bundlePrice}
                                    className="flex-1 h-14 rounded-md bg-amber-600 text-white font-bold uppercase text-[10px] tracking-widest hover:bg-amber-700 disabled:opacity-50 shadow-md shadow-amber-600/20 active:scale-[0.98] transition-all"
                                >
                                    {savingBundle ? 'Salvando...' : 'Salvar Pacote'}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default function TeacherCoursesPage() {
    return (
        <Suspense fallback={
            <div className="flex h-screen items-center justify-center bg-transparent">
                <Loader2 className="animate-spin text-[#1D5F31]" size={48} />
            </div>
        }>
            <CoursesContent />
        </Suspense>
    )
}