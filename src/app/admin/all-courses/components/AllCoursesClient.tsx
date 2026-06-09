"use client"

import { useState, useMemo, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Search, User, Tag, BookOpen, X, AlertTriangle, ShieldCheck, Trash2, Loader2, CheckCircle2, XCircle, FileText, Clock, DollarSign, Layers, ChevronDown, ChevronRight, Play, HelpCircle, Lock, Settings2 } from 'lucide-react' // NOVO: Lock, Settings2
import CourseDeleteButton from '@/components/CourseDeleteButton'
import SecureMuxPlayer from '@/components/SecureMuxPlayer'
import { toast } from 'sonner'
import { normalizeString } from '@/lib/utils'

interface Course {
    id: string
    title: string
    subtitle?: string
    image_url?: string
    teacherName?: string
    teacher_id?: string
    category?: string
    status: string
    price?: number
    trailer_review_status?: string
    intro_video_playback_id?: string
    intro_video_url?: string
    intro_video_asset_id?: string
    pendingTrailerPlaybackId?: string
    pendingTrailerUrl?: string
    pendingTrailerAssetId?: string
    motivoRejeicaoTrailer?: string
}

interface Teacher {
    id: string
    full_name?: string
    name?: string
}

interface AllCoursesClientProps {
    courses: Course[]
    teachers: Teacher[]
}

export default function AllCoursesClient({ courses, teachers }: AllCoursesClientProps) {
    const [searchTerm, setSearchTerm] = useState('')
    const [selectedTeacher, setSelectedTeacher] = useState<string>('')
    const [showTeacherDropdown, setShowTeacherDropdown] = useState(false)

    // NOVO: Vitrine categories state
    const [vitrineCategorias, setVitrineCategorias] = useState<string[]>([])
    const [newCategoria, setNewCategoria] = useState('')
    const [vitrineLoading, setVitrineLoading] = useState(true)
    // NOVO: cursosFixados state + editing
    const [vitrineCursosFixados, setVitrineCursosFixados] = useState<Record<string, string[]>>({})
    const [editingCategoria, setEditingCategoria] = useState<string | null>(null)
    const [selectedCourseIds, setSelectedCourseIds] = useState<string[]>([])

    // NOVO: Load vitrine categories on mount
    const loadVitrineCategorias = useCallback(async () => {
        setVitrineLoading(true)
        try {
            const { getVitrineCategorias } = await import('@/app/actions/admin')
            const result = await getVitrineCategorias()
            if (result.success) {
                setVitrineCategorias(result.categorias)
                setVitrineCursosFixados(result.cursosFixados || {}) // NOVO
            }
        } catch (err) {
            console.error('Erro ao carregar categorias da vitrine:', err)
        } finally {
            setVitrineLoading(false)
        }
    }, [])

    useEffect(() => { loadVitrineCategorias() }, [loadVitrineCategorias])

    // NOVO: Extract unique categories from courses for suggestions (uppercase for consistency)
    const existingCourseCategories = useMemo(() => {
        return Array.from(new Set(courses.map(c => c.category?.toUpperCase()).filter(Boolean) as string[])).sort()
    }, [courses])

    // NOVO: Add a category to vitrine
    const handleAddCategoria = async () => {
        const trimmed = newCategoria.trim().toUpperCase()
        if (!trimmed) return
        if (vitrineCategorias.includes(trimmed)) {
            setNewCategoria('')
            return
        }
        try {
            const { addVitrineCategoria } = await import('@/app/actions/admin')
            const result = await addVitrineCategoria(trimmed)
            if (result.success) {
                setVitrineCategorias(prev => [...prev, trimmed])
                setNewCategoria('')
            }
        } catch (err) {
            console.error('Erro ao adicionar categoria:', err)
        }
    }

    // NOVO: Remove a category from vitrine
    const handleRemoveCategoria = async (categoria: string) => {
        try {
            const { removeVitrineCategoria } = await import('@/app/actions/admin')
            const result = await removeVitrineCategoria(categoria)
            if (result.success) {
                setVitrineCategorias(prev => prev.filter(c => c !== categoria))
                setEditingCategoria(prev => prev === categoria ? null : prev)
            }
        } catch (err) {
            console.error('Erro ao remover categoria:', err)
        }
    }

    // NOVO: Open inline editor for a category
    const handleOpenEditor = (categoria: string) => {
        setEditingCategoria(categoria)
        setSelectedCourseIds(vitrineCursosFixados[categoria] || [])
    }

    // NOVO: Toggle a course in the selection
    const handleToggleCourse = (courseId: string) => {
        setSelectedCourseIds(prev =>
            prev.includes(courseId)
                ? prev.filter(id => id !== courseId)
                : [...prev, courseId]
        )
    }

    // NOVO: Save cursosFixados
    const handleSaveCursosFixados = async () => {
        if (!editingCategoria) return
        try {
            const { saveVitrineCursosSelecionados } = await import('@/app/actions/admin')
            const result = await saveVitrineCursosSelecionados(editingCategoria, selectedCourseIds)
            if (result.success) {
                setVitrineCursosFixados(prev => ({ ...prev, [editingCategoria]: selectedCourseIds }))
                setEditingCategoria(null)
                toast.success('Seleção salva com sucesso!')
            } else {
                toast.error(result.error || 'Erro ao salvar')
            }
        } catch (err) {
            toast.error('Erro ao salvar seleção')
            console.error(err)
        }
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'APROVADO':
                return <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-green-600 bg-green-50 px-3 py-1 rounded-none border border-green-200">APROVADO</span>
            case 'PENDENTE':
                return <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-amber-600 bg-amber-50 px-3 py-1 rounded-none border border-amber-200">PENDENTE</span>
            case 'REJEITADO':
                return <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-red-600 bg-red-50 px-3 py-1 rounded-none border border-red-200">REJEITADO</span>
            case 'SOLICITADO_EXCLUSAO':
                return <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-slate-600 bg-slate-100 px-3 py-1 rounded-none border border-slate-300">EXCLUSÃO SOLICITADA</span>
            default:
                return <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{status}</span>
        }
    }

    const filteredCourses = useMemo(() => {
        let result = courses

        if (selectedTeacher) {
            result = result.filter(course => course.teacher_id === selectedTeacher)
        }

        if (searchTerm) {
            const term = normalizeString(searchTerm)
            result = result.filter(course => 
                course.title && normalizeString(course.title).includes(term) ||
                course.subtitle && normalizeString(course.subtitle).includes(term) ||
                course.category && normalizeString(course.category).includes(term) ||
                course.teacherName && normalizeString(course.teacherName).includes(term)
            )
        }

        return result
    }, [courses, searchTerm, selectedTeacher])

    const clearFilters = () => {
        setSearchTerm('')
        setSelectedTeacher('')
    }

    const hasFilters = searchTerm || selectedTeacher

    const [auditCourse, setAuditCourse] = useState<Course | null>(null)
    const [rejectReason, setRejectReason] = useState('')
    const [isProcessing, setIsProcessing] = useState(false)
    const [detailCourseId, setDetailCourseId] = useState<string | null>(null)
    const [detailData, setDetailData] = useState<any>(null)
    const [isLoadingDetail, setIsLoadingDetail] = useState(false)
    const [isLoadingMore, setIsLoadingMore] = useState(false)
    const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({})
    const [detailPage, setDetailPage] = useState(1)
    const detailPageSize = 10

    const handleOpenDetail = async (courseId: string) => {
        setDetailCourseId(courseId)
        setIsLoadingDetail(true)
        setDetailData(null)
        setDetailPage(1)
        try {
            const { getCourseFullDetailsAdmin } = await import('@/app/actions/admin')
            const result = await getCourseFullDetailsAdmin(courseId, 1, detailPageSize)
            if (result.success) {
                setDetailData(result)
                const expanded: Record<string, boolean> = {}
                result.modules?.forEach((m: any) => { expanded[m.id] = true })
                setExpandedModules(expanded)
            } else {
                toast.error(result.error || 'Erro ao carregar detalhes.')
                setDetailCourseId(null)
            }
        } catch (err: any) {
            toast.error(err.message || 'Erro ao carregar detalhes.')
            setDetailCourseId(null)
        } finally {
            setIsLoadingDetail(false)
        }
    }

    const handleLoadMoreLessons = async () => {
        if (!detailCourseId || isLoadingMore) return
        const nextPage = detailPage + 1
        setIsLoadingMore(true)
        try {
            const { getCourseFullDetailsAdmin } = await import('@/app/actions/admin')
            const result = await getCourseFullDetailsAdmin(detailCourseId, nextPage, detailPageSize)
            if (result.success) {
                setDetailData(result)
                setDetailPage(nextPage)
                // Expande novos módulos que possam ter surgido
                setExpandedModules(prev => {
                    const next = { ...prev }
                    result.modules?.forEach((m: any) => { next[m.id] = true })
                    return next
                })
            } else {
                toast.error(result.error || 'Erro ao carregar mais aulas.')
            }
        } catch (err: any) {
            toast.error(err.message || 'Erro ao carregar mais aulas.')
        } finally {
            setIsLoadingMore(false)
        }
    }

    const handleApproveTrailer = async (courseId: string) => {
        setIsProcessing(true)
        try {
            const { approveTrailerAction } = await import('@/app/actions/admin')
            const result = await approveTrailerAction(courseId)
            if (result.success) {
                toast.success('Trailer aprovado com sucesso!')
                setAuditCourse(null)
                window.location.reload()
            } else {
                toast.error(result.error || 'Erro ao aprovar trailer.')
            }
        } catch (err: any) {
            toast.error(err.message || 'Erro ao aprovar trailer.')
        } finally {
            setIsProcessing(false)
        }
    }

    const handleRejectTrailer = async (courseId: string) => {
        if (!rejectReason.trim()) {
            toast.error('Informe o motivo da rejeição.')
            return
        }
        setIsProcessing(true)
        try {
            const { rejectTrailerAction } = await import('@/app/actions/admin')
            const result = await rejectTrailerAction(courseId, rejectReason)
            if (result.success) {
                toast.success('Trailer rejeitado.')
                setAuditCourse(null)
                setRejectReason('')
                window.location.reload()
            } else {
                toast.error(result.error || 'Erro ao rejeitar trailer.')
            }
        } catch (err: any) {
            toast.error(err.message || 'Erro ao rejeitar trailer.')
        } finally {
            setIsProcessing(false)
        }
    }

    const handleDeleteActiveTrailer = async (courseId: string) => {
        if (!confirm('Tem certeza que deseja remover o trailer ativo deste curso?')) return
        setIsProcessing(true)
        try {
            const { deleteActiveTrailerAction } = await import('@/app/actions/admin')
            const result = await deleteActiveTrailerAction(courseId)
            if (result.success) {
                toast.success('Trailer ativo removido.')
                setAuditCourse(null)
                window.location.reload()
            } else {
                toast.error(result.error || 'Erro ao remover trailer.')
            }
        } catch (err: any) {
            toast.error(err.message || 'Erro ao remover trailer.')
        } finally {
            setIsProcessing(false)
        }
    }

    return (
        <div className="space-y-8 min-h-screen font-montserrat admin-page">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-4">
                <div>
                    <h1 className="text-4xl font-bold uppercase tracking-tighter">
                        CATÁLOGO GLOBAL
                    </h1>
                    <p className="text-[10px] font-bold uppercase tracking-[4px] mt-2">
                        Auditoria completa de todos os cursos
                    </p>
                </div>
            </div>

            {/* NOVO: Vitrine Categories Section */}
            <div className="bg-white border-2 border-slate-200 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-[10px] font-bold uppercase tracking-[4px] text-slate-700">
                        CATEGORIAS DA VITRINE
                    </h2>
                    {vitrineLoading && <Loader2 size={14} className="animate-spin text-slate-400" />}
                </div>

                {/* Badges */}
                <div className="flex flex-wrap gap-2 mb-2 min-h-[36px]">
                    {/* NOVO: Fixed system badges — removíveis como as demais */}
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-800 bg-slate-100 border border-slate-200 rounded-md">
                        TODOS
                        <button onClick={() => handleRemoveCategoria('TODOS')} className="text-slate-500 hover:text-slate-800 transition-colors">
                            <X size={12} />
                        </button>
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-800 bg-slate-100 border border-slate-200 rounded-md">
                        GRATUITO
                        <button onClick={() => handleRemoveCategoria('GRATUITO')} className="text-slate-500 hover:text-slate-800 transition-colors">
                            <X size={12} />
                        </button>
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-800 bg-slate-100 border border-slate-200 rounded-md">
                        NOVO
                        <button onClick={() => handleRemoveCategoria('NOVO')} className="text-slate-500 hover:text-slate-800 transition-colors">
                            <X size={12} />
                        </button>
                    </span>
                    {vitrineCategorias.length === 0 && !vitrineLoading && (
                        <span className="text-[10px] text-slate-400 italic self-center ml-2">Nenhuma categoria cadastrada</span>
                    )}
                    {vitrineCategorias.map(cat => (
                        <span key={cat} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-800 bg-slate-100 border border-slate-200 rounded-md">
                            {cat}
                            <button onClick={() => handleOpenEditor(cat)} className="text-slate-400 hover:text-slate-700 transition-colors" title="Editar cursos">
                                <Settings2 size={11} />
                            </button>
                            <button onClick={() => handleRemoveCategoria(cat)} className="text-slate-500 hover:text-slate-800 transition-colors">
                                <X size={12} />
                            </button>
                        </span>
                    ))}
                </div>

                {/* Input + Add Button */}
                <div className="flex gap-2 mb-4">
                    <input
                        type="text"
                        placeholder="Nova categoria..."
                        value={newCategoria}
                        onChange={(e) => setNewCategoria(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddCategoria() } }}
                        className="flex-1 max-w-xs px-4 py-2 bg-white border-2 border-slate-200 rounded-lg text-xs font-medium uppercase focus:border-[#1D5F31] focus:ring-2 focus:ring-green-700/20 focus:outline-none transition-colors"
                    />
                    <button
                        onClick={handleAddCategoria}
                        disabled={!newCategoria.trim()}
                        className="px-5 py-2 text-white text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all disabled:opacity-50"
                        style={{ backgroundColor: '#1D5F31' }}
                    >
                        ADICIONAR
                    </button>
                </div>

                {/* Suggestions from existing courses */}
                {existingCourseCategories.length > 0 && (
                    <div>
                        <p className="text-[9px] font-bold uppercase tracking-[3px] text-slate-400 mb-2">Sugestões dos cursos cadastrados:</p>
                        <div className="flex flex-wrap gap-1.5">
                            {existingCourseCategories
                                .filter(cat => !vitrineCategorias.includes(cat))
                                .map(cat => (
                                    <button
                                        key={cat}
                                        onClick={() => {
                                            setNewCategoria(cat)
                                        }}
                                        className="px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-slate-500 bg-slate-100 border border-slate-200 rounded-md hover:bg-slate-200 hover:text-slate-700 transition-colors"
                                    >
                                        {cat}
                                    </button>
                                ))
                            }
                        </div>
                    </div>
                )}

                {/* NOVO: Inline editor for course selection per category */}
                {editingCategoria && (
                    <div className="mt-4 border-t pt-4 border-slate-200">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-700">
                                CURSOS EM: {editingCategoria}
                            </h3>
                            <div className="flex gap-2">
                                <button
                                    onClick={handleSaveCursosFixados}
                                    className="px-5 py-2 text-white text-[10px] font-bold uppercase tracking-widest rounded-md transition-all"
                                    style={{ backgroundColor: '#1D5F31' }}
                                >
                                    SALVAR SELEÇÃO
                                </button>
                                <button
                                    onClick={() => setEditingCategoria(null)}
                                    className="px-4 py-2 text-slate-600 text-[10px] font-bold uppercase tracking-widest rounded-md border border-slate-300 hover:bg-slate-100 transition-all"
                                >
                                    FECHAR
                                </button>
                            </div>
                        </div>
                        <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-md">
                            {courses.map(course => (
                                <label
                                    key={course.id}
                                    className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 cursor-pointer border-b border-slate-100 last:border-b-0"
                                >
                                    <input
                                        type="checkbox"
                                        checked={selectedCourseIds.includes(course.id)}
                                        onChange={() => handleToggleCourse(course.id)}
                                        className="accent-[#1D5F31]"
                                    />
                                    <span className="text-xs font-medium text-slate-700 uppercase truncate">
                                        {course.title}
                                    </span>
                                    {course.category && (
                                        <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 ml-auto flex-shrink-0">
                                            {course.category}
                                        </span>
                                    )}
                                </label>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Filtros */}
            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center mb-6">
                {/* Busca por curso */}
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Buscar curso..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-white border-2 border-slate-200 rounded-lg text-sm font-medium focus:border-[#1D5F31] focus:ring-2 focus:ring-green-700/20 focus:outline-none transition-colors"
                    />
                </div>

                {/* Filtro por Professor */}
                <div className="relative min-w-[280px]">
                    <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Filtrar por professor..."
                            value={selectedTeacher ? teachers.find(t => t.id === selectedTeacher)?.full_name || teachers.find(t => t.id === selectedTeacher)?.name || '' : ''}
                            onChange={(e) => {
                                setSearchTerm(e.target.value)
                                setShowTeacherDropdown(true)
                            }}
                            onFocus={() => setShowTeacherDropdown(true)}
                            onBlur={() => setTimeout(() => setShowTeacherDropdown(false), 200)}
                            className="w-full pl-12 pr-10 py-3 bg-white border-2 border-slate-200 rounded-lg text-sm font-medium focus:border-[#1D5F31] focus:ring-2 focus:ring-green-700/20 focus:outline-none transition-colors cursor-pointer"
                            readOnly
                        />
                        {selectedTeacher && (
                            <button
                                onClick={() => {
                                    setSelectedTeacher('')
                                    setSearchTerm('')
                                }}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                            >
                                <X size={16} />
                            </button>
                        )}
                    </div>

                    {/* Dropdown de Professores */}
                    {showTeacherDropdown && (
                        <div className="absolute z-50 w-full mt-1 bg-white border-2 border-slate-200 rounded-lg max-h-60 overflow-y-auto shadow-lg">
                            {teachers.length === 0 ? (
                                <div className="p-3 text-sm text-slate-500 text-center">
                                    Nenhum professor encontrado
                                </div>
                            ) : (
                                teachers.map(teacher => (
                                    <button
                                        key={teacher.id}
                                        onClick={() => {
                                            setSelectedTeacher(teacher.id)
                                            setSearchTerm('')
                                            setShowTeacherDropdown(false)
                                        }}
                                        className={`w-full text-left px-4 py-3 text-sm hover:bg-[#1D5F31]/10 transition-colors ${
                                            selectedTeacher === teacher.id ? 'bg-[#1D5F31]/10 text-[#1D5F31]' : 'text-slate-700'
                                        }`}
                                    >
                                        {teacher.full_name || teacher.name || 'Sem nome'}
                                    </button>
                                ))
                            )}
                        </div>
                    )}
                </div>

                {/* Botão Limpar Filtros */}
                {hasFilters && (
                    <button
                        onClick={clearFilters}
                        className="flex items-center gap-2 px-4 py-3 border-2 border-slate-300 text-slate-600 font-bold text-xs uppercase tracking-wider hover:bg-slate-100 transition-colors"
                    >
                        <X size={14} />
                        Limpar Filtros
                    </button>
                )}
            </div>

            {/* Contador de resultados */}
            {hasFilters && (
                <div className="text-sm text-slate-500">
                    <span className="font-bold">{filteredCourses.length}</span> curso(s) encontrado(s)
                </div>
            )}

            {/* Tabela de Cursos */}
            <div className="bg-white border-2 border-slate-200 rounded-none shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-900 text-white">
                                <th className="p-6 text-[10px] font-bold uppercase tracking-wider">Curso</th>
                                <th className="p-6 text-[10px] font-bold uppercase tracking-wider">Professor</th>
                                <th className="p-6 text-[10px] font-bold uppercase tracking-wider">Categoria</th>
                                <th className="p-6 text-[10px] font-bold uppercase tracking-wider">Status</th>
                                <th className="p-6 text-[10px] font-bold uppercase tracking-wider text-right">Preço</th>
                                <th className="p-6 text-[10px] font-bold uppercase tracking-wider text-right">Ação</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredCourses.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="p-16 text-center">
                                        <div className="flex flex-col items-center gap-4">
                                            <BookOpen size={48} className="text-slate-300" />
                                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                                                {hasFilters 
                                                    ? 'Nenhum curso encontrado para este instrutor' 
                                                    : 'Nenhum curso encontrado'
                                                }
                                            </p>
                                            {hasFilters && (
                                                <button
                                                    onClick={clearFilters}
                                                    className="text-[#1D5F31] text-xs font-bold uppercase tracking-wider hover:underline"
                                                >
                                                    Limpar filtros
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredCourses.map((course) => (
                                    <tr key={course.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                                        <td className="p-6">
                                            <button onClick={() => handleOpenDetail(course.id)} className="flex items-center gap-4 text-left">
                                                <div className="w-16 h-16 bg-slate-100 rounded-none overflow-hidden flex-shrink-0 border border-slate-200">
                                                    {course.image_url ? (
                                                        <img src={course.image_url} alt={course.title} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center bg-slate-200">
                                                            <Tag size={20} className="text-slate-400" />
                                                        </div>
                                                    )}
                                                </div>
                                                <div>
                                                    <h3 className="font-bold uppercase text-sm text-slate-900 leading-tight max-w-[300px] truncate hover:text-[#1D5F31] transition-colors">
                                                        {course.title}
                                                    </h3>
                                                    <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider mt-1 truncate max-w-[300px]">
                                                        {course.subtitle || 'Sem subtítulo'}
                                                    </p>
                                                </div>
                                            </button>
                                        </td>
                                        <td className="p-6">
                                            <div className="flex items-center gap-2">
                                                <User size={14} className="text-slate-400" />
                                                <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                                                    {course.teacherName || 'N/A'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="p-6">
                                            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-600 bg-slate-100 px-3 py-1.5 rounded-none border border-slate-200">
                                                {course.category || 'N/A'}
                                            </span>
                                        </td>
                                        <td className="p-6">
                                            <div className="flex flex-col gap-1">
                                                {getStatusBadge(course.status)}
                                                {course.trailer_review_status === 'trailer_pending_review' && (
                                                    <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-amber-700 bg-amber-50 px-3 py-1 rounded-none border border-amber-300">
                                                        <AlertTriangle size={12} />
                                                        Trailer Pendente
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="p-6 text-right">
                                            <span className="text-sm font-bold text-slate-900">
                                                R$ {Number(course.price || 0).toFixed(2)}
                                            </span>
                                        </td>
                                        <td className="p-6 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <CourseDeleteButton courseId={String(course.id)} courseTitle={course.title} />
                                                {course.trailer_review_status === 'trailer_pending_review' && (
                                                    <button
                                                        onClick={() => setAuditCourse(course)}
                                                        className="inline-flex items-center gap-2 px-4 py-3 text-amber-700 text-[10px] font-bold uppercase tracking-widest transition-all rounded-lg border-2 border-amber-300 bg-amber-50 hover:bg-amber-100 active:scale-95"
                                                    >
                                                        <ShieldCheck size={14} />
                                                        Auditar Trailer
                                                    </button>
                                                )}
                                                <Link
                                                    href={`/admin/classroom/${String(course.id)}`}
                                                    className="inline-flex items-center gap-2 px-6 py-3 text-white text-[10px] font-bold uppercase tracking-widest transition-all rounded-lg active:scale-95"
                                                    style={{ backgroundColor: '#1D5F31' }}
                                                >
                                                    Acessar Sala
                                                </Link>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Product Details Modal */}
            {detailCourseId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 sm:p-6" onClick={() => !isLoadingDetail && setDetailCourseId(null)}>
                    <div className="bg-white rounded-xl shadow-2xl max-w-7xl w-full max-h-[95vh] flex flex-col border border-slate-200" onClick={e => e.stopPropagation()}>
                        {/* Header */}
                        <div className="flex items-center justify-between px-8 py-6 border-b border-slate-200">
                            <div className="min-w-0">
                                <h2 className="text-xl font-bold uppercase tracking-tighter">Detalhes do Curso</h2>
                                <p className="text-[10px] font-bold uppercase tracking-[4px] text-slate-500 mt-1 truncate max-w-[600px]">
                                    {detailData?.course?.title || 'Carregando...'}
                                </p>
                            </div>
                            <button onClick={() => setDetailCourseId(null)} className="p-2 text-slate-400 hover:text-slate-600 transition-colors flex-shrink-0">
                                <X size={24} />
                            </button>
                        </div>

                        {/* Loading State */}
                        {isLoadingDetail && (
                            <div className="flex-1 flex items-center justify-center p-16">
                                <Loader2 className="animate-spin text-[#1D5F31]" size={40} />
                            </div>
                        )}

                        {/* Content */}
                        {detailData && !isLoadingDetail && (
                            <div className="flex-1 flex flex-col lg:flex-row min-h-0">
                                {/* Left Column (Metadata) — 35% */}
                                <div className="lg:w-[35%] overflow-y-auto px-8 py-8 border-b lg:border-b-0 lg:border-r border-slate-200 space-y-6">
                                    {/* Image */}
                                    {detailData.course.image_url && (
                                        <div className="aspect-video bg-slate-100 rounded-lg overflow-hidden border border-slate-200">
                                            <img src={detailData.course.image_url} alt={detailData.course.title} className="w-full h-full object-cover" />
                                        </div>
                                    )}

                                    {/* Badges */}
                                    <div className="flex flex-wrap gap-2">
                                        {detailData.course.price !== undefined && (
                                            <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-green-700 bg-green-50 px-3 py-1.5 rounded-lg border border-green-200">
                                                <DollarSign size={12} />
                                                R$ {Number(detailData.course.price).toFixed(2)}
                                            </span>
                                        )}
                                        {detailData.course.duration && (
                                            <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-blue-700 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-200">
                                                <Clock size={12} />
                                                {detailData.course.duration}h
                                            </span>
                                        )}
                                        {detailData.course.category && (
                                            <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-700 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
                                                <FileText size={12} />
                                                {detailData.course.category}
                                            </span>
                                        )}
                                        <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-purple-700 bg-purple-50 px-3 py-1.5 rounded-lg border border-purple-200">
                                            <Layers size={12} />
                                            {detailData.modules?.length || 0} módulo(s)
                                        </span>
                                        <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-700 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
                                            <Play size={12} />
                                            {detailData.totalCount || 0} aula(s)
                                        </span>
                                    </div>

                                    {/* Pricing Type */}
                                    {detailData.course.pricing_type && (
                                        <div>
                                            <h4 className="text-[9px] font-bold uppercase tracking-[3px] text-slate-500 mb-1.5">Tipo de Precificação</h4>
                                            <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-700 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
                                                {detailData.course.pricing_type === 'free' ? 'Gratuito' : detailData.course.pricing_type === 'paid' ? 'Pago' : detailData.course.pricing_type}
                                            </span>
                                        </div>
                                    )}

                                    {/* Subtitle */}
                                    {detailData.course.subtitle && (
                                        <div>
                                            <h4 className="text-[9px] font-bold uppercase tracking-[3px] text-slate-500 mb-1.5">Subtítulo</h4>
                                            <p className="text-sm text-slate-700 leading-relaxed">{detailData.course.subtitle}</p>
                                        </div>
                                    )}

                                    {/* Description */}
                                    {detailData.course.description && (
                                        <div>
                                            <h4 className="text-[9px] font-bold uppercase tracking-[3px] text-slate-500 mb-1.5">Descrição</h4>
                                            <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">{detailData.course.description}</p>
                                        </div>
                                    )}

                                    {/* Tags */}
                                    {detailData.course.tags?.length > 0 && (
                                        <div>
                                            <h4 className="text-[9px] font-bold uppercase tracking-[3px] text-slate-500 mb-2">Tags</h4>
                                            <div className="flex flex-wrap gap-1.5">
                                                {(detailData.course.tags as string[]).map((tag: string, i: number) => (
                                                    <span key={i} className="text-[10px] font-medium text-slate-600 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">
                                                        {tag}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Right Column (Curriculum) — 65% */}
                                <div className="lg:w-[65%] flex flex-col min-h-0">
                                    <div className="flex-1 overflow-y-auto px-8 py-8">
                                        <h4 className="text-[9px] font-bold uppercase tracking-[3px] text-slate-500 mb-4">Grade Curricular</h4>
                                        {detailData.modules?.length === 0 ? (
                                            <div className="flex flex-col items-center gap-3 py-12 text-slate-400">
                                                <BookOpen size={40} />
                                                <p className="text-[10px] font-bold uppercase tracking-widest">Nenhum módulo encontrado</p>
                                            </div>
                                        ) : (
                                            <div className="space-y-3">
                                                {detailData.modules.map((mod: any, modIdx: number) => (
                                                    <div key={mod.id} className="border border-slate-200 rounded-lg overflow-hidden">
                                                        <button
                                                            onClick={() => setExpandedModules(prev => ({ ...prev, [mod.id]: !prev[mod.id] }))}
                                                            className="w-full flex items-center justify-between gap-3 px-5 py-4 bg-slate-50 hover:bg-slate-100 transition-colors text-left"
                                                        >
                                                            <div className="flex items-center gap-3 min-w-0">
                                                                {expandedModules[mod.id] ? <ChevronDown size={16} className="text-slate-500 flex-shrink-0" /> : <ChevronRight size={16} className="text-slate-500 flex-shrink-0" />}
                                                                <span className="font-bold text-sm text-slate-800 uppercase tracking-wide truncate">{mod.title}</span>
                                                                <span className="text-[10px] font-medium text-slate-500 bg-slate-200 px-2 py-0.5 rounded-md flex-shrink-0">{mod.lessons.length} aula(s)</span>
                                                            </div>
                                                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex-shrink-0">{modIdx + 1}</span>
                                                        </button>
                                                        {expandedModules[mod.id] && (
                                                            <div className="divide-y divide-slate-100">
                                                                {mod.lessons.map((lesson: any, idx: number) => (
                                                                    <div key={lesson.id} className="flex items-center justify-between gap-4 px-5 py-3.5 hover:bg-slate-50 transition-colors">
                                                                        <div className="flex items-center gap-3 min-w-0">
                                                                            {lesson.is_quiz ? (
                                                                                <HelpCircle size={16} className="text-amber-500 flex-shrink-0" />
                                                                            ) : (
                                                                                <Play size={16} className="text-[#1D5F31] flex-shrink-0" />
                                                                            )}
                                                                            <span className="text-sm text-slate-700 truncate">{lesson.title}</span>
                                                                        </div>
                                                                        <div className="flex items-center gap-3 flex-shrink-0">
                                                                            {lesson.duration && (
                                                                                <span className="text-[10px] font-medium text-slate-500">{lesson.duration}min</span>
                                                                            )}
                                                                            {lesson.status && (
                                                                                <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                                                                                    lesson.status === 'APROVADO' ? 'text-green-700 bg-green-50 border border-green-200' :
                                                                                    lesson.status === 'REJEITADO' ? 'text-red-700 bg-red-50 border border-red-200' :
                                                                                    lesson.status === 'PENDENTE' ? 'text-amber-700 bg-amber-50 border border-amber-200' :
                                                                                    'text-slate-500 bg-slate-100 border border-slate-200'
                                                                                }`}>
                                                                                    {lesson.status === 'APROVADO' ? 'OK' :
                                                                                     lesson.status === 'REJEITADO' ? 'REJ' :
                                                                                     lesson.status === 'PENDENTE' ? 'PEN' :
                                                                                     lesson.status || '—'}
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {/* Pagination Footer */}
                                        {detailData.totalCount > 0 && (
                                            <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-100">
                                                <p className="text-[10px] font-medium text-slate-500">
                                                    Exibindo <span className="font-bold text-slate-700">{Math.min(detailData.currentPage * detailPageSize, detailData.totalCount)}</span> de <span className="font-bold text-slate-700">{detailData.totalCount}</span> aulas
                                                </p>
                                                {detailData.hasMore && (
                                                    <button
                                                        onClick={handleLoadMoreLessons}
                                                        disabled={isLoadingMore}
                                                        className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[#1D5F31] hover:text-[#1D5F31]/80 transition-colors disabled:opacity-50"
                                                    >
                                                        {isLoadingMore ? (
                                                            <Loader2 size={12} className="animate-spin" />
                                                        ) : (
                                                            <ChevronDown size={14} />
                                                        )}
                                                        {isLoadingMore ? 'Carregando...' : 'Carregar Mais Aulas'}
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Footer */}
                        <div className="flex items-center justify-between px-8 py-4 border-t border-slate-200">
                            {detailData && (
                                <div className="flex items-center gap-2 text-[10px] text-slate-400 font-medium">
                                    <span className="bg-slate-100 px-2 py-0.5 rounded-md">{detailData?.course?.id ? `ID: ${detailData.course.id.substring(0, 8)}...` : ''}</span>
                                </div>
                            )}
                            <button
                                onClick={() => setDetailCourseId(null)}
                                className="px-8 py-3 bg-slate-100 text-slate-700 rounded-lg text-[10px] font-bold uppercase tracking-[4px] hover:bg-slate-200 transition-all"
                            >
                                Fechar Visualização
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Audit Trailer Modal */}
            {auditCourse && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => !isProcessing && setAuditCourse(null)}>
                    <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-slate-200" onClick={e => e.stopPropagation()}>
                        <div className="p-8 border-b border-slate-200 flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-bold uppercase tracking-tighter">Auditar Trailer</h2>
                                <p className="text-[10px] font-bold uppercase tracking-[4px] text-slate-500 mt-1">{auditCourse.title}</p>
                            </div>
                            <button onClick={() => { setAuditCourse(null); setRejectReason('') }} className="p-2 text-slate-400 hover:text-slate-600 transition-colors">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="p-8 space-y-8">
                            {/* Trailer Atual */}
                            {auditCourse.intro_video_playback_id && (
                                <div>
                                    <h3 className="text-[10px] font-bold uppercase tracking-[4px] text-slate-500 mb-4">Trailer Atual (Público)</h3>
                                    <div className="aspect-video bg-slate-900 rounded-lg overflow-hidden border border-slate-200">
                                        <SecureMuxPlayer
                                            cursoId={auditCourse.id}
                                            playbackId={auditCourse.intro_video_playback_id}
                                            className="w-full h-full"
                                            isPublic={true}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Trailer Pendente */}
                            <div>
                                <h3 className="text-[10px] font-bold uppercase tracking-[4px] text-amber-700 mb-4">Trailer Pendente (Privado - Aguardando Revisão)</h3>
                                <div className="aspect-video bg-slate-900 rounded-lg overflow-hidden border border-amber-300">
                                    <SecureMuxPlayer
                                        cursoId={auditCourse.id}
                                        playbackId={auditCourse.pendingTrailerPlaybackId || ''}
                                        className="w-full h-full"
                                        isPublic={false}
                                    />
                                </div>
                            </div>

                            {/* Ações */}
                            <div className="flex flex-col gap-6 pt-4 border-t border-slate-200">
                                <div className="flex items-center gap-4">
                                    <button
                                        onClick={() => handleApproveTrailer(auditCourse.id)}
                                        disabled={isProcessing}
                                        className="flex items-center gap-2 px-8 py-4 bg-[#1D5F31] text-white rounded-lg text-[10px] font-bold uppercase tracking-[4px] hover:bg-[#1D5F31]/90 transition-all disabled:opacity-50"
                                    >
                                        {isProcessing ? <Loader2 className="animate-spin" size={16} /> : <CheckCircle2 size={16} />}
                                        Aprovar Trailer
                                    </button>

                                    <button
                                        onClick={() => handleDeleteActiveTrailer(auditCourse.id)}
                                        disabled={isProcessing}
                                        className="flex items-center gap-2 px-6 py-4 bg-red-500 text-white rounded-lg text-[10px] font-bold uppercase tracking-[4px] hover:bg-red-600 transition-all disabled:opacity-50"
                                    >
                                        <Trash2 size={16} />
                                        Remover Trailer Ativo
                                    </button>
                                </div>

                                {/* Formulário de Rejeição */}
                                <div className="space-y-3">
                                    <label className="text-[9px] font-bold uppercase tracking-[3px] text-slate-600">Motivo da Rejeição</label>
                                    <textarea
                                        value={rejectReason}
                                        onChange={e => setRejectReason(e.target.value)}
                                        placeholder="Descreva o motivo da rejeição para o professor..."
                                        className="w-full bg-white border border-slate-300 rounded-lg px-4 py-3 text-sm focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none resize-none min-h-[80px]"
                                    />
                                    <button
                                        onClick={() => handleRejectTrailer(auditCourse.id)}
                                        disabled={isProcessing || !rejectReason.trim()}
                                        className="flex items-center gap-2 px-6 py-3 bg-red-50 text-red-700 border-2 border-red-300 rounded-lg text-[10px] font-bold uppercase tracking-[4px] hover:bg-red-100 transition-all disabled:opacity-50"
                                    >
                                        {isProcessing ? <Loader2 className="animate-spin" size={16} /> : <XCircle size={16} />}
                                        Rejeitar Trailer
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
