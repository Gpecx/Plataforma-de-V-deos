'use client'

import { useState, useEffect } from 'react'
import { getFinancialSettings, saveFinancialSettings, FinancialSettings, PlanData } from '@/app/actions/financial'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { DollarSign, Percent, Save, Loader2, Plus, Trash2, ShieldCheck } from 'lucide-react'
import { toast } from 'sonner'

export default function AdminFinancialPage() {
    const [settings, setSettings] = useState<FinancialSettings | null>(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        getFinancialSettings().then(data => {
            setSettings(data)
            setLoading(false)
        })
    }, [])

    const handleSave = async () => {
        if (!settings) return
        setSaving(true)
        const res = await saveFinancialSettings(settings)
        setSaving(false)
        if (res.success) {
            toast.success("Configurações financeiras salvas!")
        } else {
            toast.error(res.error || "Erro ao salvar")
        }
    }

    const updatePlan = (index: number, field: keyof PlanData, value: any) => {
        if (!settings) return
        const newPlans = [...settings.plans]
        newPlans[index] = { ...newPlans[index], [field]: field === 'price' ? Number(value) : value }
        setSettings({ ...settings, plans: newPlans })
    }

    const addPlan = () => {
        if (!settings) return
        const newPlan: PlanData = {
            id: `plan-${Date.now()}`,
            name: 'Novo Plano',
            price: 0,
            features: [],
            active: true
        }
        setSettings({ ...settings, plans: [...settings.plans, newPlan] })
    }

    const removePlan = (index: number) => {
        if (!settings) return
        const newPlans = [...settings.plans]
        newPlans.splice(index, 1)
        setSettings({ ...settings, plans: newPlans })
    }

    const updateFeature = (planIndex: number, featureIndex: number, value: string) => {
        if (!settings) return
        const newPlans = [...settings.plans]
        newPlans[planIndex].features[featureIndex] = value
        setSettings({ ...settings, plans: newPlans })
    }

    const addFeature = (planIndex: number) => {
        if (!settings) return
        const newPlans = [...settings.plans]
        newPlans[planIndex].features.push('')
        setSettings({ ...settings, plans: newPlans })
    }

    const removeFeature = (planIndex: number, featureIndex: number) => {
        if (!settings) return
        const newPlans = [...settings.plans]
        newPlans[planIndex].features.splice(featureIndex, 1)
        setSettings({ ...settings, plans: newPlans })
    }

    if (loading || !settings) return (
        <div className="max-w-[1600px] mx-auto p-4 md:p-12 font-exo pb-64">
            <header className="mb-16 animate-pulse">
                <div className="flex items-center gap-3 mb-2">
                    <div className="h-[2px] w-8 bg-slate-800" />
                    <div className="h-2 w-24 bg-slate-800 rounded" />
                </div>
                <div className="h-10 w-64 bg-slate-800 rounded mb-4" />
                <div className="h-4 w-96 bg-slate-800 rounded" />
            </header>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-12 items-start opacity-50">
                <div className="xl:col-span-4 lg:col-span-12">
                    <div className="h-[300px] bg-slate-900/50 border border-slate-800 rounded-none animate-pulse" />
                </div>
                <div className="xl:col-span-8 lg:col-span-12 space-y-10">
                    <div className="h-[400px] bg-slate-900/50 border border-slate-800 rounded-none animate-pulse" />
                    <div className="h-[400px] bg-slate-900/50 border border-slate-800 rounded-none animate-pulse" />
                </div>
            </div>
        </div>
    )

    return (
        <div className="max-w-[1600px] mx-auto p-4 md:p-12 font-exo pb-64 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <header className="mb-16">
                <div className="flex items-center gap-3 mb-2">
                    <div className="h-[2px] w-8 bg-[#1D5F31]" />
                    <span className="text-[10px] font-black uppercase tracking-[5px] text-[#1D5F31]">Financeiro & Planos</span>
                </div>
                <h1 className="text-4xl font-black tracking-tighter uppercase leading-none text-white">
                    Configurações <span className="text-[#1D5F31]">Estratégicas</span>
                </h1>
                <p className="text-slate-400 font-bold text-xs tracking-widest uppercase mt-2">Gestão de taxas de repasse e precificação de assinaturas.</p>
            </header>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-12 items-start">
                {/* ─── TAXA DA PLATAFORMA ─────────────────────────── */}
                <div className="xl:col-span-4 lg:col-span-12">
                    <Card className="rounded-none border-2 border-[#1D5F31] shadow-[0_0_50px_rgba(29,95,49,0.15)] bg-[#061629]/80 backdrop-blur-xl sticky top-24">
                        <CardHeader className="border-b border-[#1D5F31]/20">
                            <CardTitle className="text-sm font-black uppercase tracking-widest text-white flex items-center gap-2">
                                <Percent size={16} className="text-[#1D5F31]" /> Taxa da Plataforma
                            </CardTitle>
                            <CardDescription className="text-[10px] uppercase font-bold text-slate-500">Comissão por venda de cursos</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-8 space-y-6">
                            <div className="space-y-3">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Porcentagem (%)</Label>
                                <div className="relative">
                                    <Input 
                                        type="number" 
                                        value={settings.platformTax} 
                                        onChange={(e) => setSettings({ ...settings, platformTax: Number(e.target.value) })}
                                        className="bg-[#061629] border-[#1D5F31]/50 rounded-none h-14 text-2xl font-mono font-black text-white px-6 focus:border-[#1D5F31] transition-all"
                                    />
                                    <div className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-500 font-black">%</div>
                                </div>
                            </div>
                            <div className="p-4 bg-[#1D5F31]/10 border border-[#1D5F31]/20">
                                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider leading-relaxed">
                                    * Esta taxa define quanto a plataforma retém de cada venda. Ex: Se um curso custa R$ 100,00 e a taxa é {settings.platformTax}%, a plataforma fica com R$ {Number(100 * (settings.platformTax/100)).toFixed(2)} e o professor com R$ {Number(100 * (1 - settings.platformTax/100)).toFixed(2)}.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* ─── PLANOS DE ASSINATURA ────────────────────────── */}
                <div className="xl:col-span-8 lg:col-span-12 space-y-10 min-h-[600px]">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <ShieldCheck className="text-[#1D5F31]" size={20} />
                            <h2 className="text-lg font-black uppercase tracking-tighter text-white">Planos de Assinatura</h2>
                        </div>
                        <Button onClick={addPlan} className="bg-white text-black hover:bg-[#1D5F31] hover:text-white text-[10px] font-black uppercase tracking-widest h-10 px-6 rounded-none transition-all">
                            <Plus size={14} className="mr-2" /> Novo Plano
                        </Button>
                    </div>

                    {settings.plans.map((plan, pIdx) => (
                        <Card key={plan.id} className="rounded-none border border-[#1D5F31]/40 bg-[#061629]/60 hover:border-[#1D5F31] transition-all group overflow-hidden shadow-2xl">
                            <CardHeader className="flex flex-row items-center justify-between bg-[#1D5F31]/10 border-b border-[#1D5F31]/20 py-6 px-8">
                                <div className="flex-1">
                                    <Input 
                                        value={plan.name} 
                                        onChange={(e) => updatePlan(pIdx, 'name', e.target.value)}
                                        className="bg-transparent border-none text-base font-black uppercase tracking-tighter text-white p-0 h-auto focus-visible:ring-0"
                                    />
                                </div>
                                <Button variant="ghost" onClick={() => removePlan(pIdx)} className="text-slate-600 hover:text-red-500 hover:bg-red-500/10 transition-colors rounded-none">
                                    <Trash2 size={20} />
                                </Button>
                            </CardHeader>
                            <CardContent className="p-8 grid grid-cols-1 md:grid-cols-2 gap-12">
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label className="text-[9px] font-black uppercase tracking-widest text-slate-500">Preço Mensal (R$)</Label>
                                        <div className="relative">
                                            <DollarSign size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#1D5F31]" />
                                            <Input 
                                                type="number" 
                                                value={plan.price} 
                                                onChange={(e) => updatePlan(pIdx, 'price', e.target.value)}
                                                className="bg-[#061629] border-[#1D5F31]/20 rounded-none h-11 pl-10 text-white font-mono font-bold"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 mt-4">
                                        <input 
                                            type="checkbox" 
                                            checked={plan.active} 
                                            onChange={(e) => updatePlan(pIdx, 'active', e.target.checked)}
                                            className="w-5 h-5 accent-[#1D5F31] cursor-pointer"
                                        />
                                        <span className="text-[11px] font-black uppercase tracking-widest text-[#1D5F31]">Instância Ativa</span>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <Label className="text-[9px] font-black uppercase tracking-widest text-slate-500">Benefícios / Features</Label>
                                    <div className="space-y-2 min-h-[150px]">
                                        {plan.features.map((feat, fIdx) => (
                                            <div key={fIdx} className="flex gap-2">
                                                <Input 
                                                    value={feat} 
                                                    onChange={(e) => updateFeature(pIdx, fIdx, e.target.value)}
                                                    className="bg-[#061629] border-[#1D5F31]/10 rounded-none h-9 text-[11px] text-slate-300"
                                                    placeholder="Ex: Acesso offline"
                                                />
                                                <Button variant="ghost" size="icon" onClick={() => removeFeature(pIdx, fIdx)} className="h-9 w-9 text-slate-700 hover:text-red-800">
                                                    <Trash2 size={12} />
                                                </Button>
                                            </div>
                                        ))}
                                        <Button 
                                            variant="ghost" 
                                            onClick={() => addFeature(pIdx)}
                                            className="w-full border border-dashed border-[#1D5F31]/30 text-slate-500 hover:text-[#1D5F31] hover:bg-[#1D5F31]/5 text-[9px] font-black uppercase tracking-widest h-9"
                                        >
                                            + Adicionar Benefício
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>

            {/* Fixed Save Button - Lateral Direita */}
            <div className="fixed bottom-6 right-6 z-[100]">
                <Button
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-[#1D5F31] hover:bg-[#22c55e] text-white font-black uppercase tracking-[4px] w-[320px] h-16 text-[14px] rounded-none transition-all shadow-[0_20px_50px_rgba(29,95,49,0.4)] border border-[#1D5F31] flex items-center justify-center gap-4 group"
                >
                    {saving ? (
                        <><Loader2 size={20} className="animate-spin" /> SINCRONIZANDO...</>
                    ) : (
                        <><Save size={20} className="group-hover:scale-110 transition-transform" /> APLICAR ALTERAÇÕES</>
                    )}
                </Button>
            </div>
        </div>
    )
}
