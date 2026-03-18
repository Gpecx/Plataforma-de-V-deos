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
        <div className="p-8 text-center text-slate-500 font-bold uppercase tracking-widest text-sm">
            Carregando Configurações...
        </div>
    )

    const BannerField = ({ id, label, description, items }: { id: keyof BannersData; label: string; description: string; items: BannerItem[] }) => (
        <Card className="mb-10 rounded-none border border-[#1D5F31]/30 shadow-lg bg-[#061629] overflow-hidden">
            <CardHeader className="bg-[#0b1f36] border-b border-[#1D5F31]/30 flex flex-row items-center justify-between py-6 px-8">
                <div>
                    <CardTitle className="text-xl italic uppercase tracking-tighter text-white font-black">{label}</CardTitle>
                    <CardDescription className="uppercase tracking-[3px] text-[10px] font-bold text-[#1D5F31] mt-1">{description}</CardDescription>
                </div>
                <Button onClick={() => addBanner(id)} className="bg-[#1D5F31] hover:bg-[#00A802] text-white text-[10px] font-black uppercase tracking-widest h-10 px-6 rounded-none shadow-lg transition-all hover:scale-105">
                    + Adicionar Slide
                </Button>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
                {items.length === 0 && (
                    <div className="text-center py-12 border-2 border-dashed border-[#1D5F31]/20 rounded-none bg-[#050505]/50">
                        <ImageIcon className="mx-auto text-slate-700 mb-3" size={40} />
                        <p className="text-slate-500 text-[11px] font-bold uppercase tracking-[4px]">Galeria de Banners Vazia</p>
                    </div>
                )}
                <div className="grid grid-cols-1 gap-6">
                    {items.sort((a, b) => a.order - b.order).map((item, index) => (
                        <div key={index} className="group relative p-6 border border-[#1D5F31]/20 rounded-none bg-[#0a0a0a] transition-all hover:border-[#1D5F31]/50 hover:bg-[#0d0d0d]">
                            <div className="flex flex-col lg:flex-row gap-8 items-start">
                                <div className="flex flex-col gap-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-[#1D5F31]">Posição</Label>
                                    <div className="flex flex-col gap-2 items-center">
                                        <Input
                                            type="number"
                                            value={item.order}
                                            onChange={(e) => updateBanner(id, index, 'order', e.target.value)}
                                            className="w-16 bg-[#061629] border-[#1D5F31]/40 rounded-none h-12 text-sm font-black text-center text-white focus:border-[#1D5F31]"
                                        />
                                        <div className="flex gap-1 w-full">
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                onClick={() => moveBanner(id, index, 'up')}
                                                disabled={index === 0}
                                                className="flex-1 h-10 rounded-none border-[#1D5F31]/30 text-slate-400 bg-[#061629] hover:bg-[#1D5F31] hover:text-white disabled:opacity-20"
                                            >
                                                <ArrowUp size={14} />
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                onClick={() => moveBanner(id, index, 'down')}
                                                disabled={index === items.length - 1}
                                                className="flex-1 h-10 rounded-none border-[#1D5F31]/30 text-slate-400 bg-[#061629] hover:bg-[#1D5F31] hover:text-white disabled:opacity-20"
                                            >
                                                <ArrowDown size={14} />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="flex-1 space-y-4 w-full">
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-end">
                                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Link da Imagem (URL)</Label>
                                            <button onClick={() => removeBanner(id, index)} className="text-red-900 hover:text-red-500 text-[10px] font-black uppercase tracking-widest transition-colors mb-1">
                                                Remover Item ✕
                                            </button>
                                        </div>
                                        <Input 
                                            value={item.url} 
                                            onChange={(e) => updateBanner(id, index, 'url', e.target.value)} 
                                            placeholder="https://images.unsplash.com/..." 
                                            className="bg-[#061629] border-[#1D5F31]/40 rounded-none h-12 text-xs text-white placeholder:text-slate-700 w-full" 
                                        />
                                    </div>

                                    {item.url && (
                                        <div className="relative rounded-none overflow-hidden bg-black aspect-[21/9] w-full border border-[#1D5F31]/20 shadow-2xl group-hover:border-[#1D5F31]/40 transition-all">
                                            <img src={item.url} alt={label} className="object-cover w-full h-full opacity-80 group-hover:opacity-100 transition-opacity duration-500" />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
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
        <div className="min-h-screen bg-transparent text-white">
            <div className="max-w-6xl mx-auto p-4 md:p-12 font-exo pb-32">
                {/* Header */}
                <div className="mb-10">
                    <h1 className="text-3xl font-black uppercase tracking-tighter text-white flex items-center gap-3">
                        <Settings className="text-[#1D5F31]" size={30} />
                        Configurações Globais
                    </h1>
                    <p className="text-slate-400 uppercase tracking-widest text-[10px] font-bold mt-1">
                        Gerencie o branding e os banners de toda a plataforma
                    </p>
                </div>

                {/* ─── BRANDING ─────────────────────────────── */}
                <div className="mb-12">
                    <div className="flex items-center gap-3 mb-5">
                        <Palette size={20} className="text-[#1D5F31]" />
                        <h2 className="text-lg font-black uppercase tracking-tighter text-white">Branding</h2>
                        <div className="flex-1 h-px bg-white/5" />
                    </div>

                    <Card className="rounded-none border border-[#1D5F31] shadow-sm bg-[#061629] mb-6">
                        <CardContent className="pt-8 px-8 space-y-10">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                                {/* Left Column: Site Name & Color */}
                                <div className="space-y-8">
                                    {/* Site Name */}
                                    <div className="space-y-3">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                            <Globe size={12} /> Nome do Site
                                        </Label>
                                        <Input
                                            value={settings.branding.siteName}
                                            onChange={(e) => setBranding('siteName', e.target.value)}
                                            placeholder="Ex: PowerPlay"
                                            className="rounded-none h-12 font-semibold text-white bg-[#061629] border-[#1D5F31] focus:ring-1 focus:ring-[#1D5F31]"
                                        />
                                    </div>

                                    {/* Primary Color */}
                                    <div className="space-y-3">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Cor Primária</Label>
                                        <div className="flex items-center gap-4">
                                            <div className="relative group">
                                                <input
                                                    type="color"
                                                    value={settings.branding.primaryColor}
                                                    onChange={(e) => setBranding('primaryColor', e.target.value)}
                                                    className="w-14 h-14 rounded-none cursor-pointer border border-[#1D5F31] p-1 bg-[#061629]"
                                                />
                                            </div>
                                            <div className="flex-1 space-y-1">
                                                <Input
                                                    value={settings.branding.primaryColor}
                                                    onChange={(e) => setBranding('primaryColor', e.target.value)}
                                                    placeholder="#1D5F31"
                                                    className="rounded-none h-12 font-mono text-sm bg-[#061629] border-[#1D5F31] text-white"
                                                />
                                            </div>
                                        </div>
                                        <div className="h-12 w-full flex items-center justify-center rounded-none text-white text-[10px] font-black uppercase tracking-widest border border-white/5 shadow-inner" style={{ backgroundColor: settings.branding.primaryColor }}>
                                            Preview de Identidade
                                        </div>
                                    </div>
                                </div>

                                {/* Right Column: Logo Upload */}
                                <div className="space-y-3">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                        <ImageIcon size={12} /> Logotipo da Plataforma
                                    </Label>

                                    <div className="flex flex-col gap-4">
                                        <div
                                            {...getRootProps()}
                                            className={`
                                                border-2 border-dashed rounded-none p-10 transition-all cursor-pointer flex flex-col items-center justify-center gap-3 text-center min-h-[160px]
                                                ${isDragActive ? 'border-[#1D5F31] bg-[#1D5F31]/10' : 'border-[#1D5F31]/40 hover:border-[#1D5F31] bg-[#061629]/50'}
                                            `}
                                        >
                                            <input {...getInputProps()} />
                                            {uploadingLogo ? (
                                                <Loader2 className="animate-spin text-[#1D5F31]" size={30} />
                                            ) : (
                                                <UploadCloud size={30} className="text-slate-500" />
                                            )}
                                            <div>
                                                <p className="text-[11px] font-black uppercase tracking-tight text-white">Carregar nova Logo</p>
                                                <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-1">PNG ou SVG preferencialmente</p>
                                            </div>
                                        </div>

                                        <div className="bg-[#050505] border border-[#1D5F31]/30 rounded-none p-8 flex flex-col items-center justify-center min-h-[160px] relative overflow-hidden group">
                                            <div className="absolute top-2 left-2 flex items-center gap-1 opacity-50">
                                                <div className="w-1.5 h-1.5 rounded-full bg-[#1D5F31]"></div>
                                                <span className="text-[8px] font-black uppercase tracking-widest text-white">Preview</span>
                                            </div>
                                            <div className="h-20 w-full flex items-center justify-center">
                                                <img
                                                    src={settings.branding.logoUrl || '/images/SPCSacademy2.png'}
                                                    alt="Logo Preview"
                                                    className="h-full w-auto object-contain transition-transform group-hover:scale-110 duration-500"
                                                />
                                            </div>
                                            {!settings.branding.logoUrl && (
                                                <p className="text-[8px] text-slate-600 font-bold mt-4 uppercase tracking-[2px] italic">Usando recurso padrão</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* ─── BANNERS ─────────────────────────────── */}
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-5">
                        <ImageIcon size={20} className="text-[#1D5F31]" />
                        <h2 className="text-lg font-black uppercase tracking-tighter text-white">Banners & Carrosséis</h2>
                        <div className="flex-1 h-px bg-white/5" />
                    </div>

                    <BannerField id="hero_home" label="Carrossel da Home" description="Seção imersiva da página inicial" items={settings.banners.hero_home} />
                    <BannerField id="hero_dashboard" label="Carrossel do Dashboard" description="Banner no painel do aluno" items={settings.banners.hero_dashboard} />
                    <BannerField id="hero_course" label="Carrossel de Cursos" description="Topo da página de catálogo" items={settings.banners.hero_course} />
                </div>
            </div>

            {/* Sticky Save Bar */}
            <div className="fixed bottom-0 left-0 right-0 bg-[#061629]/80 backdrop-blur-md border-t border-[#1D5F31] p-4 flex justify-end z-50">
                <Button
                    onClick={handleSave}
                    disabled={saving}
                    className="font-black uppercase tracking-[2px] px-10 h-12 text-[11px] rounded-none transition-all shadow-xl text-white"
                    style={{ backgroundColor: saving ? '#1D5F31' : saved ? '#22c55e' : '#1D5F31' }}
                >
                    {saving ? 'SALVANDO...' : saved ? '✓ SALVO!' : 'SALVAR ALTERAÇÕES'}
                </Button>
            </div>
        </div>
    )
}

