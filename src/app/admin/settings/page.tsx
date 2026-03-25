'use client'

import { useState, useEffect } from 'react'
import { getSettings, saveSettings, GlobalSettings, BannersData, BannerItem } from './actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Image as ImageIcon, Settings, Palette, Globe, UploadCloud, Loader2, ArrowUp, ArrowDown } from 'lucide-react'
import { useDropzone } from 'react-dropzone'
import { uploadCourseImage } from '@/lib/storage-helpers'
import Logo from '@/components/Logo'

export default function AdminSettingsPage() {
    const [settings, setSettings] = useState<GlobalSettings>({
        banners: { hero_home: [], hero_dashboard: [], hero_course: [] },
        branding: { logoUrl: '', siteName: 'PowerPlay', primaryColor: '#1D5F31' }
    })
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [saved, setSaved] = useState(false)
    const [uploadingLogo, setUploadingLogo] = useState(false)

    useEffect(() => {
        getSettings().then(data => {
            setSettings(data)
            setLoading(false)
        })
    }, [])

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

    const setBanners = (banners: BannersData) => setSettings(s => ({ ...s, banners }))
    const setBranding = (key: keyof GlobalSettings['branding'], value: string) =>
        setSettings(s => ({ ...s, branding: { ...s.branding, [key]: value } }))

    const addBanner = (id: keyof BannersData) => {
        const newList = [...settings.banners[id], { url: '', order: settings.banners[id].length + 1 }]
        setBanners({ ...settings.banners, [id]: newList })
    }

    const removeBanner = (id: keyof BannersData, index: number) => {
        const list = [...settings.banners[id]]; list.splice(index, 1)
        // Adjust orders
        const adjusted = list.map((item, i) => ({ ...item, order: i + 1 }))
        setBanners({ ...settings.banners, [id]: adjusted })
    }

    const updateBanner = (id: keyof BannersData, index: number, field: keyof BannerItem, value: any) => {
        const list = [...settings.banners[id]]
        list[index] = { ...list[index], [field]: field === 'order' ? Number(value) : value }
        setBanners({ ...settings.banners, [id]: list })
    }

    const moveBanner = (id: keyof BannersData, index: number, direction: 'up' | 'down') => {
        const list = [...settings.banners[id]]
        const targetIndex = direction === 'up' ? index - 1 : index + 1
        if (targetIndex < 0 || targetIndex >= list.length) return

        // Swap
        const temp = list[index]
        list[index] = list[targetIndex]
        list[targetIndex] = temp

        // Re-calculate orders based on new positions
        const adjusted = list.map((item, i) => ({ ...item, order: i + 1 }))
        setBanners({ ...settings.banners, [id]: adjusted })
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

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop: onDropLogo,
        accept: { 'image/*': [] },
        multiple: false
    })

    if (loading) return (
        <div className="max-w-6xl mx-auto p-8 md:p-16 font-exo">
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

    const BannerField = ({ id, label, description, items }: { id: keyof BannersData; label: string; description: string; items: BannerItem[] }) => (
        <Card className="mb-8 rounded-md border border-black shadow-sm bg-white overflow-hidden group/card hover:border-black/50 transition-all duration-700">
            <CardHeader className="bg-slate-50/50 border-b border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between p-8 gap-6">
                <div>
                    <CardTitle className="text-xl font-black uppercase tracking-tighter !text-[#000000]">{label}</CardTitle>
                    <CardDescription className="uppercase tracking-widest text-[10px] font-medium !text-[#000000] mt-2">{description}</CardDescription>
                </div>
                <Button onClick={() => addBanner(id)} className="bg-[#1D5F31] text-white hover:bg-slate-900 text-xs font-bold uppercase h-12 px-8 rounded-md transition-all shadow-sm active:scale-95 ml-auto">
                    + Adicionar Slide
                </Button>
            </CardHeader>
            <CardContent className="p-8 space-y-8">
                {items.length === 0 && (
                    <div className="text-center py-16 border-2 border-dashed border-black/10 rounded-xl bg-slate-50/50">
                        <ImageIcon className="mx-auto text-black/30 mb-6" size={48} strokeWidth={1} />
                        <p className="!text-[#000000] font-bold uppercase tracking-wider text-[10px]">Galeria de Banners Vazia</p>
                    </div>
                )}
                <div className="grid grid-cols-1 gap-8">
                    {items.sort((a, b) => a.order - b.order).map((item, index) => (
                        <div key={index} className="group/item relative p-6 border border-black/10 rounded-xl bg-slate-50/30 transition-all hover:bg-white hover:border-black/40 hover:shadow-lg">
                            <div className="flex flex-col lg:flex-row gap-8 items-start">
                                <div className="flex flex-col gap-4">
                                    <Label className="text-[10px] font-black uppercase tracking-wider !text-[#000000]">Ordenação</Label>
                                    <div className="flex flex-col gap-3">
                                        <Input
                                            type="number"
                                            value={item.order}
                                            onChange={(e) => updateBanner(id, index, 'order', e.target.value)}
                                            className="w-20 bg-white border border-black rounded-lg h-12 text-base font-black text-center text-slate-900 focus:border-black shadow-inner"
                                        />
                                        <div className="flex gap-2">
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                onClick={() => moveBanner(id, index, 'up')}
                                                disabled={index === 0}
                                                className="w-10 h-10 rounded-lg border-slate-100 text-slate-700 hover:text-[#1D5F31] hover:bg-[#1D5F31]/10 disabled:opacity-20 transition-all"
                                            >
                                                <ArrowUp size={16} strokeWidth={3} />
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                onClick={() => moveBanner(id, index, 'down')}
                                                disabled={index === items.length - 1}
                                                className="w-10 h-10 rounded-lg border-slate-100 text-slate-700 hover:text-[#1D5F31] hover:bg-[#1D5F31]/10 disabled:opacity-20 transition-all"
                                            >
                                                <ArrowDown size={16} strokeWidth={3} />
                                            </Button>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex-1 space-y-6 w-full">
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-end">
                                            <Label className="text-[10px] font-black uppercase tracking-wider !text-[#000000]">Endpoint da Imagem (CDN URL)</Label>
                                            <button onClick={() => removeBanner(id, index)} className="!text-[#000000] hover:text-rose-500 text-[9px] font-bold uppercase tracking-wider transition-all mb-1 active:scale-90">
                                                REMOVER ITEM ✕
                                            </button>
                                        </div>
                                        <Input
                                            value={item.url}
                                            onChange={(e) => updateBanner(id, index, 'url', e.target.value)}
                                            placeholder="https://images.unsplash.com/photo-..."
                                            className="bg-white border border-black rounded-xl h-12 text-[11px] text-slate-900 font-bold placeholder:text-slate-500 w-full focus:border-black shadow-inner"
                                        />
                                    </div>

                                    {item.url && (
                                        <div className="relative rounded-xl overflow-hidden bg-slate-50 aspect-[21/9] w-full border border-black shadow-sm group-hover/item:border-black/40 transition-all group/preview">
                                            <img src={item.url} alt={label} className="object-cover w-full h-full opacity-90 group-hover/preview:scale-105 transition-transform duration-1000" />
                                            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/10 to-transparent pointer-events-none" />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    )

    return (
        <div className="min-h-screen bg-transparent text-slate-900 font-exo">
            <div className="max-w-6xl mx-auto p-8 md:p-16 pb-64 animate-in fade-in duration-1000">
                {/* Header */}
                <div className="mb-8 flex flex-col items-center text-center">
                    <div className="flex items-center gap-3 mb-4">


                    </div>
                    <h1 className="text-5xl font-[900] uppercase tracking-tighter !text-[#000000] flex flex-wrap justify-center items-center gap-3 leading-none">
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
                            <h2 className="text-lg font-black uppercase tracking-wider !text-[#000000]">Identidade Visual</h2>
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
                                        <Label className="text-[10px] font-black uppercase tracking-wider !text-[#000000] flex items-center gap-2">
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
                                        <Label className="text-[10px] font-black uppercase tracking-wider !text-[#000000]">Paleta Primária (Action Color)</Label>
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
                                    <Label className="text-[10px] font-black uppercase tracking-wider !text-[#000000] flex items-center gap-2">
                                        <ImageIcon size={14} className="text-[#1D5F31]" /> Assets de Logotipo
                                    </Label>

                                    <div className="grid grid-cols-1 gap-6">
                                        <div
                                            {...getRootProps()}
                                            className={`
                                                border-2 border-dashed rounded-xl p-8 transition-all cursor-pointer flex flex-col items-center justify-center gap-4 text-center min-h-[160px]
                                                ${isDragActive ? 'border-black bg-[#1D5F31]/5' : 'border-black border-dashed hover:border-black/50 bg-slate-50/50 hover:bg-white shadow-inner hover:shadow-md'}
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
                                                <p className="text-[11px] font-black uppercase tracking-tight !text-[#000000]">Upload de Marca</p>
                                                <p className="text-[9px] !text-[#000000] font-medium uppercase tracking-wider mt-1">PNG, SVG (Max 5MB)</p>
                                            </div>
                                        </div>

                                        <div className="bg-slate-50 border border-black rounded-xl p-8 flex flex-col items-center justify-center min-h-[160px] relative overflow-hidden group/logo shadow-inner">
                                            <div className="absolute top-4 left-6 flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 rounded-full bg-[#1D5F31]"></div>
                                                <span className="text-[8px] font-black uppercase tracking-wider !text-[#000000]">Visualização de UI</span>
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

                {/* ─── BANNERS ─────────────────────────────── */}
                <div className="mb-8">
                    <div className="flex items-center gap-4 mb-10">
                        <div className="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center border border-slate-100">
                            <ImageIcon size={20} className="text-[#1D5F31]" />
                        </div>
                        <div>
                            <h2 className="text-lg font-black uppercase tracking-wider !text-[#000000]">Curadoria de Banners</h2>
                            <p className="text-[10px] !text-[#000000] font-medium uppercase tracking-widest">Experiências Imersivas por Seção</p>
                        </div>
                        <div className="flex-1 h-px bg-slate-50 ml-6" />
                    </div>

                    <BannerField id="hero_home" label="Landing Hero" description="Primeira impressão na home pública" items={settings.banners.hero_home} />
                    <BannerField id="hero_dashboard" label="User Welcome" description="Cabeçalho do painel do aluno" items={settings.banners.hero_dashboard} />
                    <BannerField id="hero_course" label="Catalog Header" description="Topo da listagem de cursos" items={settings.banners.hero_course} />
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
