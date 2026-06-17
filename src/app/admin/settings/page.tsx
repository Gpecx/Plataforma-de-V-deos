'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { getSettings, saveSettings, GlobalSettings, BannersData, BannerItem, searchCourses, SearchedCourse, getCoursesByIds } from './actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Image as ImageIcon, Settings, Palette, Globe, UploadCloud, Loader2, ArrowUp, ArrowDown, Search, X, BookOpen, Plus, ChevronLeft, ChevronRight } from 'lucide-react'
import { useDropzone } from 'react-dropzone'
import { uploadCourseImage, uploadBannerImage } from '@/lib/storage-helpers'
import Logo from '@/components/Logo'

function CourseCard({ course, index, onAdd, onRemove, variant = 'search' }: {
    course: SearchedCourse
    index?: number
    onAdd?: () => void
    onRemove?: () => void
    variant?: 'search' | 'selected'
}) {
    return (
        <div className={`
            relative group overflow-hidden
            ${variant === 'selected'
                ? 'rounded-lg border border-black/10 bg-white transition-all duration-300 hover:border-black/40 hover:shadow-lg hover:-translate-y-1'
                : 'border-b border-black/5 last:border-b-0 bg-white hover:bg-slate-50 transition-all'
            }
        `}>
            {variant === 'selected' ? (
                <div className="p-4 flex flex-col gap-3">
                    <div className="relative aspect-[16/9] rounded-lg overflow-hidden bg-slate-100">
                        {course.image_url ? (
                            <img
                                src={course.image_url}
                                alt={course.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center">
                                <ImageIcon size={32} className="text-slate-300" strokeWidth={1} />
                            </div>
                        )}
                        {index !== undefined && (
                            <span className="absolute top-2 left-2 text-[10px] font-bold text-white bg-[#1D5F31] w-6 h-6 rounded-full flex items-center justify-center shadow-md">
                                {index + 1}
                            </span>
                        )}
                        {onRemove && (
                            <button
                                onClick={onRemove}
                                className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/40 backdrop-blur-sm hover:bg-rose-500 flex items-center justify-center transition-all hover:scale-110"
                            >
                                <X size={12} className="text-white" />
                            </button>
                        )}
                    </div>
                    <div className="space-y-1 px-0.5">
                        <p className="font-bold text-slate-900 text-xs leading-tight line-clamp-2">{course.title}</p>
                        <div className="flex items-center justify-between">
                            <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">{course.tag || 'CURSO'}</span>
                            <span className="text-[11px] font-bold text-[#1D5F31]">R$ {course.price.toFixed(2)}</span>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="flex items-center gap-3 px-4 py-3 cursor-default">
                    <div className="w-12 h-9 rounded-md overflow-hidden bg-slate-100 shrink-0">
                        {course.image_url ? (
                            <img src={course.image_url} alt={course.title} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center">
                                <ImageIcon size={14} className="text-slate-300" strokeWidth={1} />
                            </div>
                        )}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="font-bold text-slate-900 text-[11px] truncate leading-tight">{course.title}</p>
                        <p className="text-[9px] text-slate-500 mt-0.5">{course.tag || 'Curso'}</p>
                    </div>
                    <span className="text-[10px] font-bold text-[#1D5F31] shrink-0">R$ {course.price.toFixed(2)}</span>
                    {onAdd && (
                        <button
                            onClick={onAdd}
                            className="w-7 h-7 rounded-md bg-[#1D5F31] text-white flex items-center justify-center hover:bg-[#1a5230] hover:scale-110 transition-all shadow-sm shrink-0"
                        >
                            <Plus size={14} />
                        </button>
                    )}
                </div>
            )}
        </div>
    )
}

export default function AdminSettingsPage() {
    const [settings, setSettings] = useState<GlobalSettings>({
        banners: { hero_home: [], hero_dashboard: [], hero_course: [], hero_wishlist: [] },
        branding: { logoUrl: '', siteName: 'PowerPlay', primaryColor: '#1D5F31' },
        featuredCourseIds: []
    })
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [saving, setSaving] = useState(false)
    const [saved, setSaved] = useState(false)
    const [uploadingLogo, setUploadingLogo] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')
    const [searchResults, setSearchResults] = useState<SearchedCourse[]>([])
    const [searching, setSearching] = useState(false)
    const [selectedCourses, setSelectedCourses] = useState<SearchedCourse[]>([])
    const [searchTimeout, setSearchTimeout] = useState<ReturnType<typeof setTimeout> | null>(null)
    const [activeSlides, setActiveSlides] = useState<Record<string, number>>({})
    const [uploadingBannerCategory, setUploadingBannerCategory] = useState<keyof BannersData | null>(null)

    const setActiveSlide = useCallback((id: keyof BannersData, index: number) => {
        setActiveSlides(prev => ({ ...prev, [id]: index }))
    }, [])

    const [selectedCategory, setSelectedCategory] = useState<keyof BannersData>('hero_home')

    useEffect(() => {
        getSettings()
            .then(data => {
                setSettings(data)
                setLoading(false)
                if (data.featuredCourseIds && data.featuredCourseIds.length > 0) {
                    getCoursesByIds(data.featuredCourseIds).then(courses => {
                        setSelectedCourses(courses)
                    })
                }
            })
            .catch(err => {
                console.error('Error loading settings:', err)
                setError(err.message)
                setLoading(false)
            })
    }, [])

    const handleSearch = useCallback(async (term: string) => {
        if (term.length < 1) {
            setSearchResults([])
            return
        }
        setSearching(true)
        try {
            const results = await searchCourses(term)
            const filtered = results.filter(r => !selectedCourses.some(s => s.id === r.id))
            setSearchResults(filtered)
        } catch (e) {
            console.error('Search error:', e)
            setSearchResults([])
        } finally {
            setSearching(false)
        }
    }, [selectedCourses])

    useEffect(() => {
        if (searchTimeout) clearTimeout(searchTimeout)
        if (searchTerm.length >= 1) {
            const timeout = setTimeout(() => handleSearch(searchTerm), 300)
            setSearchTimeout(timeout)
        } else {
            setSearchResults([])
        }
        return () => {
            if (searchTimeout) clearTimeout(searchTimeout)
        }
    }, [searchTerm])

    const handleSave = async () => {
        setSaving(true)
        const result = await saveSettings(settings)
        setSaving(false)
        if (result.success) {
            setSaved(true)
            setTimeout(() => setSaved(false), 3000)
        } else {
            alert(result.error || 'Erro ao salvar')
        }
    }

    const setBranding = (key: keyof GlobalSettings['branding'], value: string) =>
        setSettings(s => ({ ...s, branding: { ...s.branding, [key]: value } }))

    const addBanner = (id: keyof BannersData) => {
        setSettings(prev => {
            const newList = [...prev.banners[id], { url: '', order: prev.banners[id].length + 1 }]
            return { ...prev, banners: { ...prev.banners, [id]: newList } }
        })
    }

    const removeBanner = (id: keyof BannersData, index: number) => {
        setSettings(prev => {
            const list = [...prev.banners[id]]
            list.splice(index, 1)
            const adjusted = list.map((item, i) => ({ ...item, order: i + 1 }))
            return { ...prev, banners: { ...prev.banners, [id]: adjusted } }
        })
        setActiveSlides(prev => {
            const current = prev[id] ?? 0
            const totalBefore = settings.banners[id].length - 1
            if (current >= totalBefore && totalBefore > 0) return { ...prev, [id]: totalBefore - 1 }
            if (totalBefore <= 0) return { ...prev, [id]: 0 }
            return prev
        })
    }

    const updateBanner = (id: keyof BannersData, index: number, field: keyof BannerItem, value: any) => {
        setSettings(prev => {
            const list = [...prev.banners[id]]
            list[index] = { ...list[index], [field]: field === 'order' ? Number(value) : value }
            return { ...prev, banners: { ...prev.banners, [id]: list } }
        })
    }

    const moveBanner = (id: keyof BannersData, index: number, direction: 'up' | 'down') => {
        setSettings(prev => {
            const list = [...prev.banners[id]]
            const targetIndex = direction === 'up' ? index - 1 : index + 1
            if (targetIndex < 0 || targetIndex >= list.length) return prev

            const temp = list[index]
            list[index] = list[targetIndex]
            list[targetIndex] = temp

            const adjusted = list.map((item, i) => ({ ...item, order: i + 1 }))
            return { ...prev, banners: { ...prev.banners, [id]: adjusted } }
        })
    }

    const onDropLogo = async (acceptedFiles: File[]) => {
        if (acceptedFiles.length === 0) return
        setUploadingLogo(true)
        try {
            const url = await uploadCourseImage(acceptedFiles[0])
            setBranding('logoUrl', url)
        } catch (error: any) {
            alert("Erro no upload: " + error.message)
        } finally {
            setUploadingLogo(false)
        }
    }

    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleBannerUpload = async (file: File) => {
        const category = selectedCategory
        if (!file || !category) return
        const items = settings.banners[category]
        const sortedItems = [...items].sort((a, b) => a.order - b.order)
        const totalSlides = sortedItems.length
        const rawIndex = activeSlides[category] ?? 0
        const index = Math.min(rawIndex, Math.max(0, totalSlides - 1))

        setUploadingBannerCategory(category)
        try {
            const url = await uploadBannerImage(file, category)
            updateBanner(category, index, 'url', url)
        } catch (error: any) {
            alert("Erro no upload do banner: " + error.message)
        } finally {
            setUploadingBannerCategory(null)
        }
    }

    const addFeaturedCourse = (course: SearchedCourse) => {
        if (selectedCourses.length >= 5) return
        if (selectedCourses.some(c => c.id === course.id)) return
        const newList = [...selectedCourses, course]
        setSelectedCourses(newList)
        setSettings(s => ({ ...s, featuredCourseIds: newList.map(c => c.id) }))
        setSearchTerm('')
        setSearchResults([])
    }

    const removeFeaturedCourse = (courseId: string) => {
        const newList = selectedCourses.filter(c => c.id !== courseId)
        setSelectedCourses(newList)
        setSettings(s => ({ ...s, featuredCourseIds: newList.map(c => c.id) }))
    }

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop: onDropLogo,
        accept: { 'image/*': [] },
        multiple: false
    })

    if (loading) return (
        <div className="max-w-6xl mx-auto p-8 md:p-16 font-montserrat">
            <header className="mb-8 flex flex-col items-center text-center animate-pulse">
                <div className="flex items-center gap-3 mb-4">
                    <div className="h-[1px] w-8 bg-slate-200" />
                    <div className="h-2 w-24 bg-slate-100 rounded" />
                    <div className="h-[1px] w-8 bg-slate-200" />
                </div>
                <div className="h-10 w-64 bg-slate-100 rounded mb-4" />
                <div className="h-4 w-96 bg-slate-100 rounded" />
            </header>
            <div className="space-y-8 opacity-50">
                <div className="h-[400px] bg-white border border-slate-200 rounded-md animate-pulse" />
                <div className="h-[600px] bg-white border border-slate-200 rounded-md animate-pulse" />
            </div>
        </div>
    )

    if (error) return (
        <div className="max-w-6xl mx-auto p-8 md:p-16 font-montserrat">
            <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center">
                <h2 className="text-xl font-bold text-red-600 mb-2">Erro ao carregar configurações</h2>
                <p className="text-red-500 text-sm mb-4">{error}</p>
                <Button onClick={() => window.location.reload()}>Tentar novamente</Button>
            </div>
        </div>
    )

    const BANNER_CATEGORIES: { id: keyof BannersData; label: string; description: string }[] = [
        { id: 'hero_home', label: 'Landing Hero', description: 'Primeira impressão na home pública' },
        { id: 'hero_dashboard', label: 'User Welcome', description: 'Cabeçalho do painel do aluno' },
        { id: 'hero_course', label: 'Catalog Header', description: 'Topo da listagem de cursos' },
        { id: 'hero_wishlist', label: 'Wishlist Banner', description: 'Banner da página Minha Lista' },
    ]

    return (
        <div className="min-h-screen bg-transparent text-slate-900 font-montserrat">
            <div className="max-w-6xl mx-auto p-8 md:p-16 pb-64 animate-in fade-in duration-1000">
                {/* Header */}
                <div className="mb-8 flex flex-col items-center text-center">
                    <div className="flex items-center gap-3 mb-4">


                    </div>
                    <h1 className="text-3xl font-bold uppercase tracking-tighter !text-[#000000] flex flex-wrap justify-center items-center gap-3 leading-none max-w-2xl">
                        <span className="text-[#1D5F31]">Configurações de Banners</span>
                    </h1>
                    <p className="!text-[#000000] uppercase tracking-widest text-[11px] font-medium mt-4 max-w-2xl leading-tight">
                        Controle total sobre a identidade visual e estratégias de marketing imersivo da plataforma.
                    </p>
                </div>

                {/* ─── BRANDING ─────────────────────────────── */}
                <div className="mb-20">
                    <div className="flex items-center gap-4 mb-10">
                        <div className="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center border border-slate-100">
                            <Palette size={20} className="text-[#1D5F31]" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold uppercase tracking-wider !text-[#000000]">Identidade Visual</h2>
                            <p className="text-[10px] !text-[#000000] font-medium uppercase tracking-widest">Logística de Marca e Paleta Core</p>
                        </div>
                        <div className="flex-1 h-px bg-slate-50 ml-6" />
                    </div>

                    <Card className="rounded-md border border-black shadow-sm bg-white overflow-hidden">
                        <CardContent className="p-12 space-y-16">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-20">
                                {/* Left Column: Site Name & Color */}
                                <div className="space-y-12">
                                    {/* Site Name */}
                                    <div className="space-y-4">
                                        <Label className="text-[10px] font-bold uppercase tracking-wider !text-[#000000] flex items-center gap-2">
                                            <Globe size={14} className="text-[#1D5F31]" /> Título da Instância
                                        </Label>
                                        <Input
                                            value={settings.branding.siteName}
                                            onChange={(e) => setBranding('siteName', e.target.value)}
                                            placeholder="Ex: PowerPlay Academy"
                                            className="rounded-xl h-14 font-bold text-slate-900 text-base bg-slate-50 border border-black focus:border-black focus:bg-white transition-all shadow-inner px-6 placeholder:text-slate-500"
                                        />
                                    </div>

                                    {/* Primary Color */}
                                    <div className="space-y-4">
                                        <Label className="text-[10px] font-bold uppercase tracking-wider !text-[#000000]">Paleta Primária (Action Color)</Label>
                                        <div className="flex items-center gap-6">
                                            <div className="relative group">
                                                <input
                                                    type="color"
                                                    value={settings.branding.primaryColor}
                                                    onChange={(e) => setBranding('primaryColor', e.target.value)}
                                                    className="w-16 h-16 rounded-xl cursor-pointer border border-black p-1.5 bg-white shadow-sm group-hover:scale-110 transition-transform duration-500"
                                                />
                                            </div>
                                            <div className="flex-1 space-y-3">
                                                <Input
                                                    value={settings.branding.primaryColor}
                                                    onChange={(e) => setBranding('primaryColor', e.target.value)}
                                                    placeholder="#1D5F31"
                                                    className="rounded-xl h-14 font-mono font-bold text-slate-900 bg-slate-50 border border-black px-6 placeholder:text-slate-500"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Right Column: Logo Upload */}
                                <div className="space-y-5">
                                    <Label className="text-[10px] font-bold uppercase tracking-wider !text-[#000000] flex items-center gap-2">
                                        <ImageIcon size={14} className="text-[#1D5F31]" /> Assets de Logotipo
                                    </Label>

                                    <div className="grid grid-cols-1 gap-6">
                                        <div
                                            {...getRootProps()}
                                            className={`
                                                border-2 border-dashed rounded-xl p-8 transition-all cursor-pointer flex flex-col items-center justify-center gap-4 text-center min-h-[160px]
                                                ${isDragActive ? 'border-black bg-[#1D5F31]/5' : 'border-black border-dashed hover:border-black/50 bg-slate-50/50 hover:bg-[#F5F5F7] shadow-inner hover:shadow-md'}
                                            `}
                                        >
                                            <input {...getInputProps()} />
                                            {uploadingLogo ? (
                                                <Loader2 className="animate-spin text-[#1D5F31]" size={36} />
                                            ) : (
                                                <div className="w-14 h-14 bg-white rounded-lg flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform border border-slate-50">
                                                    <UploadCloud size={24} className="text-slate-700" />
                                                </div>
                                            )}
                                            <div>
                                                <p className="text-[11px] font-bold uppercase tracking-tight !text-[#000000]">Upload de Marca</p>
                                                <p className="text-[9px] !text-[#000000] font-medium uppercase tracking-wider mt-1">PNG, SVG (Max 5MB)</p>
                                            </div>
                                        </div>

                                        <div className="bg-slate-50 border border-black rounded-xl p-8 flex flex-col items-center justify-center min-h-[160px] relative overflow-hidden group/logo shadow-inner">
                                            <div className="absolute top-4 left-6 flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 rounded-full bg-[#1D5F31]"></div>
                                                <span className="text-[8px] font-bold uppercase tracking-wider !text-[#000000]">Visualização de UI</span>
                                            </div>
                                            <div className="h-20 w-full flex items-center justify-center">
                                                {settings.branding.logoUrl ? (
                                                    <img
                                                        src={settings.branding.logoUrl}
                                                        alt="Logo Preview"
                                                        className="h-full w-auto object-contain transition-all group-hover/logo:scale-110 duration-700 drop-shadow-xl"
                                                    />
                                                ) : (
                                                    <div className="h-full flex items-center scale-75 origin-center">
                                                        <Logo light />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* ─── FEATURED COURSES ─────────────────────────────── */}
                <div className="mb-20">
                    <div className="flex items-center gap-4 mb-10">
                        <div className="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center border border-slate-100">
                            <BookOpen size={20} className="text-[#1D5F31]" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold uppercase tracking-wider !text-[#000000]">Cursos em Destaque</h2>
                            <p className="text-[10px] !text-[#000000] font-medium uppercase tracking-widest">Selecione até 5 cursos para a Landing Page</p>
                        </div>
                        <div className="flex-1 h-px bg-slate-50 ml-6" />
                    </div>

                    <Card className="rounded-md border border-black shadow-sm bg-white overflow-hidden">
                        <CardContent className="p-12 space-y-8">
                            <div className="relative space-y-4">
                                <Label className="text-[10px] font-bold uppercase tracking-wider !text-[#000000] flex items-center gap-2">
                                    <Search size={14} className="text-[#1D5F31]" /> Buscar Curso
                                </Label>
                                <div className="relative">
                                    <Input
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        placeholder="Digite o nome do curso (mínimo 3 caracteres)"
                                        disabled={selectedCourses.length >= 5}
                                        className="rounded-lg h-14 font-bold text-slate-900 text-base bg-slate-50 border border-black focus:border-black focus:bg-white transition-all shadow-inner px-6 placeholder:text-slate-500 pr-12"
                                    />
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                        {searching ? (
                                            <Loader2 size={20} className="animate-spin text-[#1D5F31]" />
                                        ) : searchTerm ? (
                                            <button onClick={() => { setSearchTerm(''); setSearchResults([]) }}>
                                                <X size={20} className="text-slate-400 hover:text-slate-600" />
                                            </button>
                                        ) : (
                                            <Search size={20} className="text-slate-400" />
                                        )}
                                    </div>
                                </div>
                                {searchResults.length > 0 && (
                                    <div className="absolute z-50 top-full mt-2 left-0 w-full bg-white border border-black/20 rounded-lg shadow-xl animate-in fade-in slide-in-from-top-2 duration-200 overflow-hidden">
                                        {searchResults.map(course => (
                                            <CourseCard 
                                                key={course.id} 
                                                course={course} 
                                                variant="search"
                                                onAdd={() => addFeaturedCourse(course)}
                                            />
                                        ))}
                                    </div>
                                )}
                                {!searching && searchTerm.length >= 1 && searchResults.length === 0 && selectedCourses.length < 5 && (
                                    <div className="absolute z-50 top-full mt-2 left-0 w-full bg-white border border-black/20 rounded-lg shadow-xl px-5 py-4 text-center">
                                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Nenhum curso encontrado</p>
                                    </div>
                                )}
                                {selectedCourses.length >= 5 && (
                                    <p className="text-xs text-amber-600 font-medium">Limite máximo de 5 cursos atingido</p>
                                )}
                            </div>

                            <div className="space-y-4">
                                <Label className="text-[10px] font-bold uppercase tracking-wider !text-[#000000]">
                                    Cursos Selecionados ({selectedCourses.length}/5)
                                </Label>
                                {selectedCourses.length === 0 ? (
                                    <div className="text-center py-12 border-2 border-dashed border-black/10 rounded-xl bg-slate-50/50">
                                        <BookOpen className="mx-auto text-black/30 mb-4" size={32} strokeWidth={1} />
                                        <p className="!text-[#000000] font-medium text-sm">Nenhum curso em destaque selecionado</p>
                                        <p className="!text-[#000000] text-[10px] uppercase tracking-wider mt-1">A página inicial mostrará os primeiros 5 cursos aprovados</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                                        {selectedCourses.map((course, index) => (
                                            <div 
                                                key={course.id} 
                                                className="animate-in fade-in zoom-in-95 duration-300"
                                                style={{ animationDelay: `${index * 50}ms` }}
                                            >
                                                <CourseCard 
                                                    course={course} 
                                                    index={index}
                                                    variant="selected"
                                                    onRemove={() => removeFeaturedCourse(course.id)}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* ─── BANNERS ─────────────────────────────── */}
                <div className="mb-8">
                    <div className="flex items-center gap-4 mb-10">
                        <div className="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center border border-slate-100">
                            <ImageIcon size={20} className="text-[#1D5F31]" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold uppercase tracking-wider !text-[#000000]">Curadoria de Banners</h2>
                            <p className="text-[10px] !text-[#000000] font-medium uppercase tracking-widest">Experiências Imersivas por Seção</p>
                        </div>
                        <div className="flex-1 h-px bg-slate-50 ml-6" />
                    </div>

                    {(() => {
                        const currentId = selectedCategory
                        const items = settings.banners[currentId]
                        const sortedItems = [...items].sort((a, b) => a.order - b.order)
                        const totalSlides = sortedItems.length
                        const rawIndex = activeSlides[currentId] ?? 0
                        const activeIndex = Math.min(rawIndex, Math.max(0, totalSlides - 1))
                        const activeItem = sortedItems[activeIndex]

                        return (
                            <Card className="mb-8 rounded-lg border border-black shadow-sm bg-white overflow-hidden">
                                <CardContent className="p-8 space-y-8">
                                    {totalSlides === 0 ? (
                                        <div className="text-center py-16 border-2 border-dashed border-black/10 rounded-lg bg-slate-50/50">
                                            <ImageIcon className="mx-auto text-black/30 mb-6" size={48} strokeWidth={1} />
                                            <p className="!text-[#000000] font-bold uppercase tracking-wider text-[10px]">{BANNER_CATEGORIES.find(c => c.id === currentId)?.label} — Galeria de Banners Vazia</p>
                                        </div>
                                    ) : (
                                        <>
                                            {/* Unified Carousel Preview */}
                                            <div className="relative rounded-lg border border-black/10 bg-slate-50/30 overflow-hidden">
                                                {activeItem.url ? (
                                                    <div className="relative aspect-[21/9] w-full bg-slate-100">
                                                        <img
                                                            src={activeItem.url}
                                                            alt={BANNER_CATEGORIES.find(c => c.id === currentId)?.label}
                                                            className="object-cover w-full h-full opacity-90"
                                                        />
                                                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/10 to-transparent pointer-events-none" />
                                                    </div>
                                                ) : (
                                                    <div className="aspect-[21/9] w-full flex items-center justify-center bg-slate-100 border-b border-black/5">
                                                        <div className="text-center">
                                                            <ImageIcon className="mx-auto text-black/20 mb-3" size={40} strokeWidth={1} />
                                                            <p className="text-[10px] font-bold uppercase tracking-wider text-black/30">Preview Indisponível</p>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Carousel Index Badge */}
                                                <div className="absolute top-3 right-3 bg-black/50 backdrop-blur-sm px-3 py-1.5 rounded-md">
                                                    <span className="text-white text-[10px] font-bold uppercase tracking-wider">
                                                        CAROUSEL INDEX: {activeIndex + 1} / {totalSlides}
                                                    </span>
                                                </div>

                                                {/* Navigation Arrows */}
                                                <div className="absolute inset-y-0 left-0 right-0 flex items-center justify-between pointer-events-none px-2">
                                                    <button
                                                        onClick={() => setActiveSlide(currentId, activeIndex - 1)}
                                                        disabled={activeIndex === 0}
                                                        className="pointer-events-auto w-10 h-10 flex items-center justify-center bg-black/40 backdrop-blur-sm text-white font-bold text-lg hover:bg-black/60 disabled:opacity-10 disabled:cursor-not-allowed transition-all rounded-md"
                                                    >
                                                        <ChevronLeft size={20} strokeWidth={3} />
                                                    </button>
                                                    <button
                                                        onClick={() => setActiveSlide(currentId, activeIndex + 1)}
                                                        disabled={activeIndex === totalSlides - 1}
                                                        className="pointer-events-auto w-10 h-10 flex items-center justify-center bg-black/40 backdrop-blur-sm text-white font-bold text-lg hover:bg-black/60 disabled:opacity-10 disabled:cursor-not-allowed transition-all rounded-md"
                                                    >
                                                        <ChevronRight size={20} strokeWidth={3} />
                                                    </button>
                                                </div>

                                                {/* Pagination Bullets */}
                                                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2">
                                                    {sortedItems.map((_, idx) => (
                                                        <button
                                                            key={idx}
                                                            onClick={() => setActiveSlide(currentId, idx)}
                                                            className={`rounded-full transition-all duration-300 ${
                                                                idx === activeIndex
                                                                    ? 'w-6 h-1.5 bg-[#1D5F31]'
                                                                    : 'w-2 h-1.5 bg-white/60 hover:bg-white/90'
                                                            }`}
                                                        />
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Category Tabs */}
                                            <div className="flex flex-wrap items-center gap-2">
                                                {BANNER_CATEGORIES.map(cat => {
                                                    const count = settings.banners[cat.id].length
                                                    const isActive = cat.id === currentId
                                                    return (
                                                        <button
                                                            key={cat.id}
                                                            onClick={() => setSelectedCategory(cat.id)}
                                                            className={`px-5 py-3 text-[10px] font-bold uppercase tracking-widest transition-all rounded-lg border ${
                                                                isActive
                                                                    ? 'bg-[#1D5F31] text-white border-[#1D5F31] shadow-sm'
                                                                    : 'bg-white text-slate-700 border-slate-200 hover:border-slate-400 hover:bg-slate-50'
                                                            }`}
                                                        >
                                                            {cat.label} <span className="opacity-70">({count})</span>
                                                        </button>
                                                    )
                                                })}
                                                <div className="flex-1" />
                                                <Button
                                                    onClick={() => { addBanner(currentId); setActiveSlide(currentId, totalSlides) }}
                                                    className="bg-[#1D5F31] text-white hover:bg-slate-900 text-xs font-bold uppercase h-12 px-8 rounded-lg transition-all shadow-sm active:scale-95"
                                                >
                                                    + Adicionar Slide
                                                </Button>
                                            </div>

                                            {/* Edit Controls for Active Slide */}
                                            <div className="border border-black/10 rounded-lg p-6 bg-slate-50/30">
                                                <div className="flex flex-col lg:flex-row gap-8 items-start">
                                                    <div className="flex flex-col gap-4">
                                                        <Label className="text-[10px] font-bold uppercase tracking-wider !text-[#000000]">Ordenação</Label>
                                                        <div className="flex flex-col gap-3">
                                                            <Input
                                                                type="number"
                                                                value={activeItem.order}
                                                                onChange={(e) => updateBanner(currentId, activeIndex, 'order', e.target.value)}
                                                                className="w-20 bg-white border border-black rounded-md h-12 text-base font-bold text-center text-slate-900 focus:border-black shadow-inner"
                                                            />
                                                            <div className="flex gap-2">
                                                                <Button
                                                                    variant="outline"
                                                                    size="icon"
                                                                    onClick={() => { moveBanner(currentId, activeIndex, 'up'); setActiveSlide(currentId, activeIndex - 1) }}
                                                                    disabled={activeIndex === 0}
                                                                    className="w-10 h-10 rounded-md border-slate-100 text-slate-700 hover:text-[#1D5F31] hover:bg-[#1D5F31]/10 disabled:opacity-20 transition-all"
                                                                >
                                                                    <ArrowUp size={16} strokeWidth={3} />
                                                                </Button>
                                                                <Button
                                                                    variant="outline"
                                                                    size="icon"
                                                                    onClick={() => { moveBanner(currentId, activeIndex, 'down'); setActiveSlide(currentId, activeIndex + 1) }}
                                                                    disabled={activeIndex === totalSlides - 1}
                                                                    className="w-10 h-10 rounded-md border-slate-100 text-slate-700 hover:text-[#1D5F31] hover:bg-[#1D5F31]/10 disabled:opacity-20 transition-all"
                                                                >
                                                                    <ArrowDown size={16} strokeWidth={3} />
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="flex-1 space-y-6 w-full">
                                                        <div className="space-y-4">
                                                            <div className="flex justify-between items-end">
                                                                <Label className="text-[10px] font-bold uppercase tracking-wider !text-[#000000]">Endpoint da Imagem (CDN URL)</Label>
                                                                <button onClick={() => removeBanner(currentId, activeIndex)} className="!text-[#000000] hover:text-rose-500 text-[9px] font-bold uppercase tracking-wider transition-all mb-1 active:scale-90">
                                                                    REMOVER ITEM ✕
                                                                </button>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <Input
                                                                    value={activeItem.url}
                                                                    onChange={(e) => updateBanner(currentId, activeIndex, 'url', e.target.value)}
                                                                    placeholder="https://images.unsplash.com/photo-..."
                                                                    className="bg-white border border-black rounded-md h-12 text-[11px] text-slate-900 font-bold placeholder:text-slate-500 w-full focus:border-black shadow-inner"
                                                                />
                                                                <input
                                                                    ref={fileInputRef}
                                                                    type="file"
                                                                    accept="image/jpeg,image/png,image/webp"
                                                                    className="hidden"
                                                                    onChange={(e) => {
                                                                        const file = e.target.files?.[0]
                                                                        if (file) {
                                                                            handleBannerUpload(file)
                                                                            e.target.value = ''
                                                                        }
                                                                    }}
                                                                />
                                                                <button
                                                                    type="button"
                                                                    onClick={() => fileInputRef.current?.click()}
                                                                    disabled={uploadingBannerCategory === currentId}
                                                                    className="w-12 h-12 rounded-md border border-black/20 bg-white flex items-center justify-center hover:bg-slate-50 hover:border-black/40 disabled:opacity-40 disabled:cursor-not-allowed transition-all shrink-0"
                                                                >
                                                                    {uploadingBannerCategory === currentId ? (
                                                                        <Loader2 size={18} className="animate-spin text-[#1D5F31]" />
                                                                    ) : (
                                                                        <UploadCloud size={18} className="text-slate-600" />
                                                                    )}
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </CardContent>
                            </Card>
                        )
                    })()}
            </div>
            </div>

            {/* Sticky Save Bar */}
            <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] w-full max-w-xl px-4 animate-in slide-in-from-bottom-10 duration-1000">
                <Button
                    onClick={handleSave}
                    disabled={saving}
                    className="w-full text-white font-bold uppercase tracking-widest h-16 text-[12px] rounded-xl transition-all shadow-xl flex items-center justify-center gap-6 group overflow-hidden active:scale-95 border-2 border-white/10"
                    style={{ backgroundColor: saved ? '#22c55e' : '#1D5F31' }}
                >
                    {saving ? (
                        <div className="flex items-center gap-4">
                            <Loader2 size={24} className="animate-spin" />
                            <span>PROCESSANDO...</span>
                        </div>
                    ) : saved ? (
                        <div className="flex items-center gap-4">
                            <span>CONFIGURAÇÕES SALVAS ✓</span>
                        </div>
                    ) : (
                        <div className="flex items-center gap-4">
                            <Settings size={22} className="group-hover:rotate-180 transition-transform duration-700" />
                            <span>APLICAR BRANDING</span>
                        </div>
                    )}
                </Button>
            </div>
        </div>
    )
}
