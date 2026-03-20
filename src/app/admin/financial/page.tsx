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
        <div className="max-w-[1600px] mx-auto p-8 md:p-16 font-exo pb-64">
            <header className="mb-16 animate-pulse">
                <div className="flex items-center gap-3 mb-4">
                    <div className="h-[1px] w-10 bg-slate-200" />
                    <div className="h-2 w-24 bg-slate-100 rounded" />
                </div>
                <div className="h-10 w-64 bg-slate-100 rounded mb-6" />
                <div className="h-4 w-96 bg-slate-100 rounded" />
            </header>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-12 items-start opacity-50">
                <div className="xl:col-span-4 lg:col-span-12">
                    <div className="h-[400px] bg-white border border-slate-100 rounded-[40px] animate-pulse shadow-sm" />
                </div>
                <div className="xl:col-span-8 lg:col-span-12 space-y-10">
                    <div className="h-[500px] bg-white border border-slate-100 rounded-[40px] animate-pulse shadow-sm" />
                </div>
            </div>
        </div>
    )

    return (
        <div className="max-w-[1600px] mx-auto p-8 md:p-16 font-exo pb-64 animate-in fade-in duration-1000">
            <header className="mb-16">
                <div className="flex items-center gap-4 mb-6">
                    <div className="h-[1px] w-12 bg-[#1D5F31]" />
                    <span className="text-[10px] font-black uppercase tracking-[5px] text-[#1D5F31]">Financeiro & Planos</span>
                </div>
                <h1 className="text-5xl font-black tracking-tighter uppercase leading-none text-slate-900">
                    Configurações <span className="text-[#1D5F31]">Estratégicas</span>
                </h1>
                <p className="text-slate-900 font-bold text-[11px] tracking-[3px] uppercase mt-8 max-w-2xl leading-relaxed italic">
                    Gestão centralizada de taxas de intermediação e arquitetura de precificação recursiva.
                </p>
            </header>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-12 items-start">
                {/* ─── TAXA DA PLATAFORMA ─────────────────────────── */}
                <div className="xl:col-span-4 lg:col-span-12">
                    <Card className="rounded-[40px] border border-slate-200 shadow-xl bg-white overflow-hidden sticky top-32">
                        <CardHeader className="p-10 border-b border-slate-50">
                            <CardTitle className="text-xs font-black uppercase tracking-[3px] text-slate-900 flex items-center gap-3">
                                <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-100">
                                    <Percent size={14} className="text-[#1D5F31]" strokeWidth={3} />
                                </div>
                                Fee da Plataforma
                            </CardTitle>
                            <CardDescription className="text-[10px] uppercase font-bold text-slate-900 mt-2">Dedução Automática por Transação</CardDescription>
                        </CardHeader>
                        <CardContent className="p-10 space-y-8">
                            <div className="space-y-4">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-[#1D5F31]/60">Alíquota de Desconto (%)</Label>
                                <div className="relative group">
                                    <Input 
                                        type="number" 
                                        value={settings.platformTax} 
                                        onChange={(e) => setSettings({ ...settings, platformTax: Number(e.target.value) })}
                                        className="bg-slate-50 border border-slate-100 rounded-3xl h-20 text-4xl font-black text-slate-900 px-10 focus:border-[#1D5F31]/30 focus:bg-white transition-all shadow-inner"
                                    />
                                    <div className="absolute right-10 top-1/2 -translate-y-1/2 text-slate-900 font-black text-2xl">%</div>
                                </div>
                            </div>
                            <div className="p-8 bg-slate-50 rounded-[32px] border border-slate-200 border-dashed">
                                <p className="text-[10px] text-slate-900 font-bold uppercase tracking-tight leading-relaxed italic">
                                    * Este parâmetro impacta o split em tempo real. Uma taxa de {settings.platformTax}% resulta em um repasse líquido de {100 - settings.platformTax}% para o produtor.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* ─── PLANOS DE ASSINATURA ────────────────────────── */}
                <div className="xl:col-span-8 lg:col-span-12 space-y-10 min-h-[600px]">
                    <div className="flex items-center justify-between mb-8 bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center border border-slate-100">
                                <ShieldCheck className="text-[#1D5F31]" size={24} strokeWidth={2.5} />
                            </div>
                            <div>
                                <h2 className="text-base font-black uppercase tracking-widest text-[#000000]">Catálogo de Assinaturas</h2>
                                <p className="text-[10px] text-slate-900 font-black uppercase tracking-[2px]">Estruturas de Acesso Recorrente</p>
                            </div>
                        </div>
                        <Button onClick={addPlan} className="bg-slate-900 text-white hover:bg-[#1D5F31] text-[10px] font-black uppercase tracking-[3px] h-14 px-8 rounded-2xl transition-all shadow-lg active:scale-95">
                            <Plus size={16} className="mr-2" /> Novo Modelo
                        </Button>
                    </div>

                    <div className="space-y-8">
                        {settings.plans.map((plan, pIdx) => (
                            <Card key={plan.id} className="rounded-[40px] border border-slate-200 bg-white hover:border-[#1D5F31]/30 transition-all duration-500 group overflow-hidden shadow-sm hover:shadow-2xl">
                                <CardHeader className="flex flex-row items-center justify-between bg-slate-50/50 border-b border-slate-50 py-8 px-10">
                                    <div className="flex-1">
                                        <Input 
                                            value={plan.name} 
                                            onChange={(e) => updatePlan(pIdx, 'name', e.target.value)}
                                            className="bg-transparent border-none text-xl font-black uppercase tracking-tighter text-slate-900 p-0 h-auto focus-visible:ring-0 placeholder:text-slate-500"
                                            placeholder="NOME DO PLANO"
                                        />
                                    </div>
                                    <Button variant="ghost" onClick={() => removePlan(pIdx)} className="w-12 h-12 p-0 text-slate-900 font-black hover:text-rose-600 hover:bg-rose-50 transition-all rounded-full active:scale-75">
                                        <Trash2 size={20} />
                                    </Button>
                                </CardHeader>
                                <CardContent className="p-10 grid grid-cols-1 md:grid-cols-2 gap-16">
                                    <div className="space-y-8">
                                        <div className="space-y-4">
                                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-900">Mensalidade Nominal (BRL)</Label>
                                            <div className="relative group">
                                                <DollarSign size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-900 group-hover:text-[#1D5F31] transition-colors" />
                                                <Input 
                                                    type="number" 
                                                    value={plan.price} 
                                                    onChange={(e) => updatePlan(pIdx, 'price', e.target.value)}
                                                    className="bg-slate-50 border border-slate-100 rounded-2xl h-16 pl-14 text-lg text-slate-900 font-mono font-black focus:border-[#1D5F31]/30 focus:bg-white transition-all shadow-inner"
                                                />
                                            </div>
                                        </div>
                                        <div 
                                            onClick={() => updatePlan(pIdx, 'active', !plan.active)}
                                            className={`flex items-center gap-4 p-4 rounded-3xl cursor-pointer border transition-all ${
                                                plan.active 
                                                ? 'bg-emerald-50 border-emerald-100 text-emerald-700' 
                                                : 'bg-slate-50 border-slate-100 text-slate-400'
                                            }`}
                                        >
                                            <div className={`w-3 h-3 rounded-full ${plan.active ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                                            <span className="text-[10px] font-black uppercase tracking-[3px]">Status: {plan.active ? 'ATIVO NO MERCADO' : 'EM MODO RASCUNHO'}</span>
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-900 flex items-center justify-between">
                                            Vantagens Competitivas
                                            <span className="text-[8px] opacity-50">{plan.features.length} ITENS</span>
                                        </Label>
                                        <div className="space-y-3">
                                            {plan.features.map((feat, fIdx) => (
                                                <div key={fIdx} className="flex gap-3 group/feature">
                                                    <Input 
                                                        value={feat} 
                                                        onChange={(e) => updateFeature(pIdx, fIdx, e.target.value)}
                                                        className="bg-slate-50 border border-slate-200 rounded-xl h-12 text-[11px] text-slate-900 font-black focus:bg-white focus:border-[#1D5F31]/20 transition-all"
                                                        placeholder="Vantagem técnica..."
                                                    />
                                                    <Button variant="ghost" size="icon" onClick={() => removeFeature(pIdx, fIdx)} className="h-12 w-12 text-slate-900 font-black hover:text-rose-600 hover:bg-rose-50 transition-all rounded-xl active:scale-75">
                                                        <Trash2 size={14} />
                                                    </Button>
                                                </div>
                                            ))}
                                            <Button 
                                                variant="ghost" 
                                                onClick={() => addFeature(pIdx)}
                                                className="w-full border-2 border-dashed border-slate-400 text-slate-900 hover:text-[#1D5F31] hover:bg-[#1D5F31]/5 hover:border-[#1D5F31]/20 text-[10px] font-black uppercase tracking-widest h-12 rounded-xl transition-all"
                                            >
                                                + Adicionar Recurso
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </div>

            {/* Fixed Save Bar */}
            <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] w-full max-w-xl px-4 animate-in slide-in-from-bottom-10 duration-1000">
                <Button
                    onClick={handleSave}
                    disabled={saving}
                    className="w-full bg-[#1D5F31] hover:bg-slate-900 text-white font-black uppercase tracking-[6px] h-20 text-[12px] rounded-full transition-all shadow-[0_30px_60px_rgba(29,95,49,0.3)] border-2 border-white/20 flex items-center justify-center gap-6 group overflow-hidden active:scale-95"
                >
                    {saving ? (
                        <div className="flex items-center gap-4">
                            <Loader2 size={24} className="animate-spin" />
                            <span>COMPROMETENDO...</span>
                        </div>
                    ) : (
                        <div className="flex items-center gap-4">
                            <Save size={24} className="group-hover:scale-125 transition-transform" />
                            <span>SINCRONIZAR ARQUITETURA</span>
                        </div>
                    )}
                    <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                </Button>
            </div>
        </div>
    )
}
