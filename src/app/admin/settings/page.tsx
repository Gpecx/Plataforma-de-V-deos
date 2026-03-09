'use client'

import { useState, useEffect } from 'react'
import { getSettings, saveSettings, GlobalSettings, BannersData } from './actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Image as ImageIcon, Settings, Palette, Globe, UploadCloud, Loader2 } from 'lucide-react'
import { useDropzone } from 'react-dropzone'
import { uploadCourseImage } from '@/lib/storage-helpers'

export default function AdminSettingsPage() {
    const [settings, setSettings] = useState<GlobalSettings>({
        banners: { hero_home: [], hero_dashboard: [], hero_course: [] },
        branding: { logoUrl: '', siteName: 'SPCS Academy', primaryColor: '#00C402' }
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

    const addBanner = (id: keyof BannersData) => setBanners({ ...settings.banners, [id]: [...settings.banners[id], ''] })
    const removeBanner = (id: keyof BannersData, index: number) => {
        const list = [...settings.banners[id]]; list.splice(index, 1)
        setBanners({ ...settings.banners, [id]: list })
    }
    const updateBanner = (id: keyof BannersData, index: number, value: string) => {
        const list = [...settings.banners[id]]; list[index] = value
        setBanners({ ...settings.banners, [id]: list })
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

    const BannerField = ({ id, label, description, items }: { id: keyof BannersData; label: string; description: string; items: string[] }) => (
        <Card className="mb-6 rounded-2xl border border-slate-100 shadow-sm bg-white">
            <CardHeader className="bg-slate-50 border-b border-slate-100 flex flex-row items-center justify-between py-4 rounded-t-2xl">
                <div>
                    <CardTitle className="text-base uppercase tracking-tighter text-slate-800 font-black">{label}</CardTitle>
                    <CardDescription className="uppercase tracking-[2px] text-[9px] font-bold text-slate-500">{description}</CardDescription>
                </div>
                <Button onClick={() => addBanner(id)} className="bg-[#00C402] hover:bg-[#00A802] text-white text-[9px] font-black uppercase tracking-widest h-8 px-4 rounded-lg">
                    + Adicionar
                </Button>
            </CardHeader>
            <CardContent className="space-y-4 pt-5">
                {items.length === 0 && (
                    <div className="text-center py-6 border-2 border-dashed border-slate-100 rounded-xl">
                        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Nenhum banner adicionado</p>
                    </div>
                )}
                {items.map((url, index) => (
                    <div key={index} className="space-y-3 p-4 border border-slate-100 rounded-xl bg-slate-50/50">
                        <div className="flex gap-3 items-start">
                            <div className="flex-1 space-y-1">
                                <Label className="text-[9px] font-black uppercase tracking-widest text-slate-500">Banner #{index + 1}</Label>
                                <Input value={url} onChange={(e) => updateBanner(id, index, e.target.value)} placeholder="https://..." className="bg-white border-slate-200 rounded-xl h-9 text-xs" />
                            </div>
                            <Button variant="outline" onClick={() => removeBanner(id, index)} className="mt-5 border-red-100 text-red-400 hover:bg-red-50 h-9 px-3 rounded-xl text-xs">✕</Button>
                        </div>
                        {url && (
                            <div className="rounded-xl overflow-hidden bg-slate-100 aspect-video max-w-xs">
                                <img src={url} alt={label} className="object-cover w-full h-full" />
                            </div>
                        )}
                    </div>
                ))}
            </CardContent>
        </Card>
    )

    return (
        <div className="max-w-4xl mx-auto p-4 md:p-8 font-exo pb-24">
            {/* Header */}
            <div className="mb-10">
                <h1 className="text-3xl font-black uppercase tracking-tighter text-slate-900 flex items-center gap-3">
                    <Settings className="text-[#00C402]" size={30} />
                    Configurações Globais
                </h1>
                <p className="text-slate-500 uppercase tracking-widest text-[10px] font-bold mt-1">
                    Gerencie o branding e os banners de toda a plataforma
                </p>
            </div>

            {/* ─── BRANDING ─────────────────────────────── */}
            <div className="mb-12">
                <div className="flex items-center gap-3 mb-5">
                    <Palette size={20} className="text-[#00C402]" />
                    <h2 className="text-lg font-black uppercase tracking-tighter text-slate-800">Branding</h2>
                    <div className="flex-1 h-px bg-slate-100" />
                </div>

                <Card className="rounded-2xl border border-slate-100 shadow-sm bg-white mb-6">
                    <CardContent className="pt-6 space-y-8">
                        {/* Site Name */}
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-700 flex items-center gap-2">
                                <Globe size={12} /> Nome do Site
                            </Label>
                            <Input
                                value={settings.branding.siteName}
                                onChange={(e) => setBranding('siteName', e.target.value)}
                                placeholder="Ex: SPCS Academy"
                                className="rounded-xl h-11 font-semibold text-slate-800"
                            />
                        </div>

                        {/* Logo Upload */}
                        <div className="space-y-4">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-700 flex items-center gap-2">
                                <ImageIcon size={12} /> Logotipo da Plataforma
                            </Label>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                                <div
                                    {...getRootProps()}
                                    className={`
                                        border-2 border-dashed rounded-2xl p-8 transition-all cursor-pointer flex flex-col items-center justify-center gap-3 text-center
                                        ${isDragActive ? 'border-[#00C402] bg-[#00C402]/5' : 'border-slate-100 hover:border-slate-200 bg-slate-50/50'}
                                    `}
                                >
                                    <input {...getInputProps()} />
                                    {uploadingLogo ? (
                                        <Loader2 className="animate-spin text-[#00C402]" size={24} />
                                    ) : (
                                        <UploadCloud size={24} className="text-slate-400" />
                                    )}
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-tight text-slate-700">Carregar nova Logo</p>
                                        <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest">Arraste ou clique para selecionar</p>
                                    </div>
                                </div>

                                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6 flex flex-col items-center justify-center min-h-[140px]">
                                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mb-4">Logo Atual</p>
                                    <div className="h-16 w-full flex items-center justify-center">
                                        <img
                                            src={settings.branding.logoUrl || '/images/SPCSacademy2.png'}
                                            alt="Logo Preview"
                                            className="h-full w-auto object-contain"
                                        />
                                    </div>
                                    {!settings.branding.logoUrl && (
                                        <p className="text-[8px] text-slate-400 font-medium mt-2 italic">(Usando padrão do sistema)</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Primary Color */}
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-700">Cor Primária</Label>
                            <div className="flex items-center gap-3">
                                <input
                                    type="color"
                                    value={settings.branding.primaryColor}
                                    onChange={(e) => setBranding('primaryColor', e.target.value)}
                                    className="w-11 h-11 rounded-xl cursor-pointer border border-slate-200 p-1 bg-white"
                                />
                                <Input
                                    value={settings.branding.primaryColor}
                                    onChange={(e) => setBranding('primaryColor', e.target.value)}
                                    placeholder="#00C402"
                                    className="rounded-xl h-11 font-mono text-sm max-w-[150px]"
                                />
                                <div className="h-11 px-4 flex items-center rounded-xl text-white text-xs font-black uppercase tracking-widest" style={{ backgroundColor: settings.branding.primaryColor }}>
                                    Preview
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* ─── BANNERS ─────────────────────────────── */}
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-5">
                    <ImageIcon size={20} className="text-[#00C402]" />
                    <h2 className="text-lg font-black uppercase tracking-tighter text-slate-800">Banners & Carrosséis</h2>
                    <div className="flex-1 h-px bg-slate-100" />
                </div>

                <BannerField id="hero_home" label="Carrossel da Home" description="Seção imersiva da página inicial" items={settings.banners.hero_home} />
                <BannerField id="hero_dashboard" label="Carrossel do Dashboard" description="Banner no painel do aluno" items={settings.banners.hero_dashboard} />
                <BannerField id="hero_course" label="Carrossel de Cursos" description="Topo da página de catálogo" items={settings.banners.hero_course} />
            </div>

            {/* Sticky Save Bar */}
            <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md border-t border-slate-100 p-4 flex justify-end z-50">
                <Button
                    onClick={handleSave}
                    disabled={saving}
                    className="font-black uppercase tracking-[2px] px-10 h-12 text-[11px] rounded-2xl transition-all shadow-xl text-white"
                    style={{ backgroundColor: saving ? '#9ca3af' : saved ? '#22c55e' : '#00C402' }}
                >
                    {saving ? 'SALVANDO...' : saved ? '✓ SALVO!' : 'SALVAR ALTERAÇÕES'}
                </Button>
            </div>
        </div>
    )
}

