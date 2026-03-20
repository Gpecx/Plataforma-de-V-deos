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
            <header className="mb-16 animate-pulse">
                <div className="flex items-center gap-3 mb-4">
                    <div className="h-[1px] w-10 bg-slate-200" />
                    <div className="h-2 w-24 bg-slate-100 rounded" />
                </div>
                <div className="h-10 w-64 bg-slate-100 rounded mb-6" />
                <div className="h-4 w-96 bg-slate-100 rounded" />
            </header>
            <div className="space-y-12 opacity-50">
                <div className="h-[400px] bg-white border border-slate-100 rounded-[40px] animate-pulse" />
                <div className="h-[600px] bg-white border border-slate-100 rounded-[40px] animate-pulse" />
            </div>
        </div>
    )

    const BannerField = ({ id, label, description, items }: { id: keyof BannersData; label: string; description: string; items: BannerItem[] }) => (
        <Card className="mb-12 rounded-[40px] border border-black shadow-xl bg-white overflow-hidden group/card hover:border-[#1D5F31] transition-all duration-700">
            <CardHeader className="bg-slate-50/50 border-b border-slate-50 flex flex-col sm:flex-row items-start sm:items-center justify-between p-10 gap-6">
                <div>
                    <CardTitle className="text-2xl font-black uppercase tracking-tighter text-slate-900">{label}</CardTitle>
                    <CardDescription className="uppercase tracking-[3px] text-[10px] font-black text-[#1D5F31] mt-2 italic">{description}</CardDescription>
                </div>
                <Button onClick={() => addBanner(id)} className="bg-slate-900 text-white hover:bg-[#1D5F31] text-[10px] font-black uppercase tracking-[3px] h-14 px-8 rounded-2xl transition-all shadow-lg active:scale-95">
                    + Adicionar Slide
                </Button>
            </CardHeader>
            <CardContent className="p-10 space-y-10">
                {items.length === 0 && (
                    <div className="text-center py-20 border-2 border-dashed border-black rounded-[32px] bg-slate-50/50">
                        <ImageIcon className="mx-auto text-slate-400 mb-6" size={48} strokeWidth={1} />
                        <p className="!text-black font-black uppercase tracking-[4px] text-[11px] italic">Galeria de Banners Vazia</p>
                    </div>
                )}
                <div className="grid grid-cols-1 gap-8">
                    {items.sort((a, b) => a.order - b.order).map((item, index) => (
                        <div key={index} className="group/item relative p-8 border border-black rounded-[32px] bg-slate-50/30 transition-all hover:bg-white hover:border-[#1D5F31] hover:shadow-2xl">
                            <div className="flex flex-col lg:flex-row gap-10 items-start">
                                <div className="flex flex-col gap-4">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-[#1D5F31]">Ordenação</Label>
                                    <div className="flex flex-col gap-3">
                                        <Input
                                            type="number"
                                            value={item.order}
                                            onChange={(e) => updateBanner(id, index, 'order', e.target.value)}
                                            className="w-20 bg-white border border-black rounded-xl h-14 text-base font-black text-center !text-black focus:border-black shadow-inner"
                                        />
                                        <div className="flex gap-2">
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                onClick={() => moveBanner(id, index, 'up')}
                                                disabled={index === 0}
                                                className="w-9 h-9 rounded-lg border-black !text-black hover:text-[#1D5F31] hover:bg-[#1D5F31]/10 disabled:opacity-20 transition-all"
                                            >
                                                <ArrowUp size={16} strokeWidth={3} />
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                onClick={() => moveBanner(id, index, 'down')}
                                                disabled={index === items.length - 1}
                                                className="w-9 h-9 rounded-lg border-black !text-black hover:text-[#1D5F31] hover:bg-[#1D5F31]/10 disabled:opacity-20 transition-all"
                                            >
                                                <ArrowDown size={16} strokeWidth={3} />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="flex-1 space-y-6 w-full">
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-end">
                                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-900">Endpoint da Imagem (CDN URL)</Label>
                                            <button onClick={() => removeBanner(id, index)} className="text-slate-600 hover:text-rose-500 text-[9px] font-black uppercase tracking-widest transition-all mb-1 active:scale-90">
                                                REMOVER ITEM ✕
                                            </button>
                                        </div>
                                        <Input 
                                            value={item.url} 
                                            onChange={(e) => updateBanner(id, index, 'url', e.target.value)} 
                                            placeholder="https://images.unsplash.com/photo-..." 
                                            className="bg-white border border-black rounded-2xl h-14 text-[11px] !text-black font-bold placeholder:text-slate-400 w-full focus:border-black shadow-inner" 
                                        />
                                    </div>

                                    {item.url && (
                                        <div className="relative rounded-[24px] overflow-hidden bg-slate-50 aspect-[21/9] w-full border border-black shadow-2xl group-hover/item:border-[#1D5F31] transition-all group/preview">
                                            <img src={item.url} alt={label} className="object-cover w-full h-full opacity-90 group-hover/preview:scale-105 transition-transform duration-1000" />
                                            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/20 to-transparent pointer-events-none" />
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
                <div className="mb-16">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="h-[1px] w-12 bg-[#1D5F31]" />
                        <span className="text-[10px] font-black uppercase tracking-[5px] text-[#1D5F31]">Global Architecture</span>
                    </div>
                    <h1 className="text-5xl font-black uppercase tracking-tighter text-slate-900 flex items-center gap-6 leading-none">
                        Branding & <span className="text-[#1D5F31]">Banners</span>
                    </h1>
                    <p className="text-slate-900 uppercase tracking-widest text-[11px] font-black mt-8 max-w-2xl leading-relaxed italic">
                        Controle total sobre a identidade visual e estratégias de marketing imersivo da plataforma.
                    </p>
                </div>

                {/* ─── BRANDING ─────────────────────────────── */}
                <div className="mb-20">
                    <div className="flex items-center gap-4 mb-10">
                        <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-100">
                            <Palette size={20} className="text-[#1D5F31]" />
                        </div>
                        <div>
                            <h2 className="text-lg font-black uppercase tracking-widest text-slate-900">Identidade Visual</h2>
                            <p className="text-[10px] text-slate-900 font-black uppercase tracking-[2px]">Logística de Marca e Paleta Core</p>
                        </div>
                        <div className="flex-1 h-px bg-slate-50 ml-6" />
                    </div>

                    <Card className="rounded-[40px] border border-black shadow-xl bg-white overflow-hidden">
                        <CardContent className="p-12 space-y-16">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-20">
                                {/* Left Column: Site Name & Color */}
                                <div className="space-y-12">
                                    {/* Site Name */}
                                    <div className="space-y-5">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-900 flex items-center gap-2">
                                            <Globe size={14} className="text-[#1D5F31]" /> Título da Instância
                                        </Label>
                                        <Input
                                            value={settings.branding.siteName}
                                            onChange={(e) => setBranding('siteName', e.target.value)}
                                            placeholder="Ex: PowerPlay Academy"
                                            className="rounded-2xl h-16 font-black !text-black text-lg bg-slate-50 border border-black focus:border-black focus:bg-white transition-all shadow-inner px-8 placeholder:text-slate-500"
                                        />
                                    </div>

                                    {/* Primary Color */}
                                    <div className="space-y-5">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-900">Paleta Primária (Action Color)</Label>
                                        <div className="flex items-center gap-6">
                                            <div className="relative group">
                                                <input
                                                    type="color"
                                                    value={settings.branding.primaryColor}
                                                    onChange={(e) => setBranding('primaryColor', e.target.value)}
                                                    className="w-20 h-20 rounded-[24px] cursor-pointer border border-black p-2 bg-white shadow-xl group-hover:scale-110 transition-transform duration-500"
                                                />
                                            </div>
                                            <div className="flex-1 space-y-3">
                                                <Input
                                                    value={settings.branding.primaryColor}
                                                    onChange={(e) => setBranding('primaryColor', e.target.value)}
                                                    placeholder="#1D5F31"
                                                    className="rounded-2xl h-16 font-mono font-black !text-black bg-slate-50 border border-black px-8 placeholder:text-slate-500"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Right Column: Logo Upload */}
                                <div className="space-y-5">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-900 flex items-center gap-2">
                                        <ImageIcon size={14} className="text-[#1D5F31]" /> Assets de Logotipo
                                    </Label>

                                    <div className="grid grid-cols-1 gap-6">
                                        <div
                                            {...getRootProps()}
                                            className={`
                                                border-2 border-dashed rounded-[32px] p-12 transition-all cursor-pointer flex flex-col items-center justify-center gap-4 text-center min-h-[180px]
                                                ${isDragActive ? 'border-[#1D5F31] bg-[#1D5F31]/5' : 'border-black hover:border-[#1D5F31] bg-slate-50/50 hover:bg-white shadow-inner hover:shadow-2xl'}
                                            `}
                                        >
                                            <input {...getInputProps()} />
                                            {uploadingLogo ? (
                                                <Loader2 className="animate-spin text-[#1D5F31]" size={36} />
                                            ) : (
                                                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                                                    <UploadCloud size={24} className="text-slate-900" />
                                                </div>
                                            )}
                                            <div>
                                                <p className="text-[11px] font-black uppercase tracking-tight text-slate-900">Upload de Marca</p>
                                                <p className="text-[9px] text-slate-900 font-black uppercase tracking-widest mt-1">PNG, SVG (Max 5MB)</p>
                                            </div>
                                        </div>

                                        <div className="bg-slate-50 border border-black rounded-[32px] p-10 flex flex-col items-center justify-center min-h-[180px] relative overflow-hidden group/logo shadow-inner">
                                            <div className="absolute top-4 left-6 flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 rounded-full bg-[#1D5F31]"></div>
                                                <span className="text-[8px] font-black uppercase tracking-[3px] text-slate-900">Visualização de UI</span>
                                            </div>
                                            <div className="h-24 w-full flex items-center justify-center">
                                                <img
                                                    src={settings.branding.logoUrl || '/images/SPCSacademy2.png'}
                                                    alt="Logo Preview"
                                                    className="h-full w-auto object-contain transition-all group-hover/logo:scale-110 duration-700 drop-shadow-2xl"
                                                />
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
                    <div className="flex items-center gap-4 mb-12">
                        <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-100">
                            <ImageIcon size={20} className="text-[#1D5F31]" />
                        </div>
                        <div>
                            <h2 className="text-lg font-black uppercase tracking-widest text-slate-900">Curadoria de Banners</h2>
                            <p className="text-[10px] text-slate-900 font-black uppercase tracking-[2px]">Experiências Imersivas por Seção</p>
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
                    className="w-full text-white font-black uppercase tracking-[6px] h-20 text-[12px] rounded-full transition-all shadow-[0_30px_60px_rgba(0,0,0,0.2)] border-2 border-white/20 flex items-center justify-center gap-6 group overflow-hidden active:scale-95"
                    style={{ backgroundColor: saved ? '#22c55e' : '#1D5F31' }}
                >
                    {saving ? (
                        <div className="flex items-center gap-4">
                            <Loader2 size={24} className="animate-spin" />
                            <span>PROCESSANDO...</span>
                        </div>
                    ) : saved ? (
                        <div className="flex items-center gap-4">
                            <span>MUTAÇÃO CONCLUÍDA ✓</span>
                        </div>
                    ) : (
                        <div className="flex items-center gap-4">
                            <Settings size={22} className="group-hover:rotate-180 transition-transform duration-700" />
                            <span>APLICAR BRANDING</span>
                        </div>
                    )}
                    <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                </Button>
            </div>
        </div>
    )
}
