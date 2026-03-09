'use client'

import { useState, useEffect } from 'react'
import { getBanners, saveBanners, BannersData } from './actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Image as ImageIcon } from 'lucide-react'

export default function BannersAdminPage() {
    const [banners, setBanners] = useState<BannersData>({
        hero_home: [],
        hero_dashboard: [],
        hero_course: []
    })
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        getBanners().then(data => {
            setBanners(data)
            setLoading(false)
        })
    }, [])

    const handleSave = async () => {
        setSaving(true)
        const result = await saveBanners(banners)
        setSaving(false)
        if (result.success) {
            alert('Banners salvos com sucesso!')
        } else {
            alert(result.error || 'Erro ao salvar')
        }
    }

    const addBanner = (id: keyof BannersData) => {
        setBanners({
            ...banners,
            [id]: [...banners[id], '']
        })
    }

    const removeBanner = (id: keyof BannersData, index: number) => {
        const newList = [...banners[id]]
        newList.splice(index, 1)
        setBanners({
            ...banners,
            [id]: newList
        })
    }

    const updateBanner = (id: keyof BannersData, index: number, value: string) => {
        const newList = [...banners[id]]
        newList[index] = value
        setBanners({
            ...banners,
            [id]: newList
        })
    }

    if (loading) return <div className="p-8 text-center text-slate-500 font-bold uppercase tracking-widest text-sm">Carregando Banners...</div>

    const BannerField = ({ id, label, description, items }: { id: keyof BannersData, label: string, description: string, items: string[] }) => (
        <Card className="mb-8 rounded-3xl border-none shadow-sm overflow-hidden bg-white">
            <CardHeader className="bg-slate-50 border-b border-slate-100 flex flex-row items-center justify-between py-4">
                <div>
                    <CardTitle className="text-xl uppercase tracking-tighter text-slate-800 font-black">{label}</CardTitle>
                    <CardDescription className="uppercase tracking-[2px] text-[9px] font-bold text-slate-500">{description}</CardDescription>
                </div>
                <Button
                    onClick={() => addBanner(id)}
                    className="bg-[#00C402] hover:bg-[#00A802] text-white text-[9px] font-black uppercase tracking-widest h-8 px-4 rounded-lg transition-all"
                >
                    + Adicionar
                </Button>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
                {items.length === 0 && (
                    <div className="text-center py-8 border-2 border-dashed border-slate-100 rounded-2xl">
                        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Nenhum banner adicionado</p>
                    </div>
                )}
                {items.map((url, index) => (
                    <div key={index} className="space-y-4 p-4 border border-slate-100 rounded-2xl bg-white shadow-sm relative group/item">
                        <div className="flex gap-4 items-start">
                            <div className="flex-1 space-y-2">
                                <Label className="uppercase tracking-widest text-[9px] font-black text-slate-500 flex justify-between">
                                    <span>Banner #{index + 1}</span>
                                </Label>
                                <Input
                                    value={url}
                                    onChange={(e) => updateBanner(id, index, e.target.value)}
                                    placeholder="https://..."
                                    className="font-medium bg-slate-50 border-slate-200 focus:border-[#00C402] focus:ring-[#00C402] rounded-xl h-10 text-xs"
                                />
                            </div>
                            <Button
                                variant="outline"
                                onClick={() => removeBanner(id, index)}
                                className="mt-6 border-red-100 text-red-500 hover:bg-red-50 h-10 px-3 rounded-xl transition-all"
                            >
                                <ImageIcon size={16} className="text-red-400" />
                            </Button>
                        </div>
                        {url && (
                            <div className="border rounded-xl overflow-hidden bg-slate-100 flex items-center justify-center relative min-h-[100px] aspect-video w-full shadow-inner max-w-md mx-auto">
                                <img src={url} alt={`${label} ${index + 1}`} className="object-cover w-full h-full" />
                            </div>
                        )}
                    </div>
                ))}
            </CardContent>
        </Card>
    )

    return (
        <div className="max-w-4xl mx-auto p-4 md:p-8 font-exo">
            <div className="mb-8 flex flex-col items-center md:items-start text-center md:text-left">
                <h1 className="text-3xl font-black uppercase tracking-tighter text-slate-900 flex items-center gap-3">
                    <ImageIcon className="text-[#00C402]" size={32} />
                    Gestão de Banners
                </h1>
                <p className="text-slate-500 uppercase tracking-widest text-[10px] font-bold mt-1">
                    Crie carrosséis de imagens para as páginas principais da SPCS
                </p>
            </div>

            <BannerField
                id="hero_home"
                label="Carrossel da Home"
                description="Imagens exibidas na seção imersiva da página inicial."
                items={banners.hero_home}
            />

            <BannerField
                id="hero_dashboard"
                label="Carrossel do Dashboard Aluno"
                description="Imagens exibidas no banner principal do painel do aluno."
                items={banners.hero_dashboard}
            />

            <BannerField
                id="hero_course"
                label="Carrossel da Coleção de Cursos"
                description="Imagens exibidas no topo da página de cursos."
                items={banners.hero_course}
            />

            <div className="flex justify-end pt-4 pb-12 sticky bottom-4">
                <Button
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-[#00C402] hover:bg-[#00A802] text-white font-black uppercase tracking-[2px] px-8 h-14 text-[11px] rounded-2xl transition-all shadow-xl shadow-[#00C402]/20 w-full md:w-auto"
                >
                    {saving ? 'SALVANDO...' : 'SALVAR ALTERAÇÕES'}
                </Button>
            </div>
        </div>
    )
}
