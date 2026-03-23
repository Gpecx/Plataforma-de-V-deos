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
            <header className="mb-8 animate-pulse">
                <div className="flex items-center gap-3 mb-4">
                    <div className="h-[1px] w-10 bg-slate-200" />
                    <div className="h-2 w-24 bg-slate-100 rounded" />
                </div>
                <div className="h-10 w-64 bg-slate-100 rounded mb-4" />
                <div className="h-4 w-96 bg-slate-100 rounded" />
            </header>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start opacity-50">
                <div className="xl:col-span-4 lg:col-span-12">
                    <div className="h-[400px] bg-white border border-slate-200 rounded-md animate-pulse shadow-sm" />
                </div>
                <div className="xl:col-span-8 lg:col-span-12 space-y-8">
                    <div className="h-[500px] bg-white border border-slate-200 rounded-md animate-pulse shadow-sm" />
                </div>
            </div>
        </div>
    )

    return (
        <div className="max-w-[1600px] mx-auto p-8 md:p-16 font-exo pb-64 animate-in fade-in duration-1000">
            <header className="mb-8 flex flex-col items-center text-center">
                <div className="flex items-center gap-3 mb-4">
                    <div className="h-[1px] w-8 bg-slate-200" />
                    <span className="text-[11px] font-medium uppercase tracking-widest text-slate-900">Financeiro &amp; Planos</span>
                    <div className="h-[1px] w-8 bg-slate-200" />
                </div>
                <h1 className="text-5xl font-[900] tracking-tighter uppercase italic leading-none text-slate-950 text-center">
                    <span className="text-[#1D5F31]">Configurações Estratégicas</span>
                </h1>
                <p className="text-slate-900 font-medium text-[11px] tracking-widest uppercase mt-4 max-w-2xl leading-tight">

                </p>
            </header>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
                {/* ─── TAXA DA PLATAFORMA ─────────────────────────── */}
                <div className="xl:col-span-4 lg:col-span-12">
                    <Card className="rounded-md border border-slate-200 shadow-sm bg-white overflow-hidden sticky top-32">
                        <CardHeader className="p-8 border-b border-slate-50">
                            <CardTitle className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center border border-slate-100">
                                    <Percent size={14} className="text-[#000000]" strokeWidth={3} />
                                </div>
                                Fee da Plataforma
                            </CardTitle>
                            <CardDescription className="text-[10px] uppercase font-medium text-slate-900 tracking-widest mt-2">Dedução Automática por Transação</CardDescription>
                        </CardHeader>
                        <CardContent className="p-8 space-y-8">
                            <div className="space-y-4">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-[#000000]/60">Alíquota de Desconto (%)</Label>
                                <div className="relative group">
                                    <Input
                                        type="number"
                                        value={settings.platformTax}
                                        onChange={(e) => setSettings({ ...settings, platformTax: Number(e.target.value) })}
                                        className="bg-slate-50 border border-slate-100 rounded-xl h-16 text-3xl font-black text-slate-900 px-8 focus:border-[#000000]/30 focus:bg-white transition-all shadow-inner"
                                    />
                                    <div className="absolute right-8 top-1/2 -translate-y-1/2 text-slate-900 font-black text-xl">%</div>
                                </div>
                            </div>
                            <div className="p-6 bg-slate-50 rounded-xl border border-slate-100 border-dashed">
                                <p className="text-[10px] text-slate-950 font-medium uppercase tracking-wider leading-tight italic">

                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* ─── PLANOS DE ASSINATURA ────────────────────────── */}
                <div className="xl:col-span-8 lg:col-span-12 space-y-8 min-h-[600px]">
                    <div className="flex items-center justify-between mb-6 bg-white p-8 rounded-md border border-slate-200 shadow-sm">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-100">
                                <ShieldCheck className="text-[#000000]" size={24} strokeWidth={2.5} />
                            </div>
                            <div>
                                <h2 className="text-base font-black uppercase tracking-wider text-slate-900">Catálogo de Assinaturas</h2>
                                <p className="text-[10px] text-slate-900 font-medium uppercase tracking-widest">Estruturas de Acesso Recorrente</p>
                            </div>
                        </div>
                        <Button onClick={addPlan} className="bg-[#000000] text-white hover:bg-slate-900 text-xs font-bold uppercase h-12 px-8 rounded-md transition-all shadow-sm active:scale-95 ml-auto">
                            <Plus size={16} className="mr-2" /> Novo Modelo
                        </Button>
                    </div>

                    <div className="space-y-8">
                        {settings.plans.map((plan, pIdx) => (
                            <Card key={plan.id} className="rounded-md border border-slate-200 bg-white hover:border-[#000000]/30 transition-all duration-500 group overflow-hidden shadow-sm hover:shadow-md">
                                <CardHeader className="flex flex-row items-center justify-between bg-slate-50/50 border-b border-slate-50 py-6 px-8">
                                    <div className="flex-1">
                                        <Input
                                            value={plan.name}
                                            onChange={(e) => updatePlan(pIdx, 'name', e.target.value)}
                                            className="bg-transparent border-none text-xl font-black uppercase tracking-tighter text-slate-900 p-0 h-auto focus-visible:ring-0 placeholder:text-slate-700"
                                            placeholder="NOME DO PLANO"
                                        />
                                    </div>
                                    <Button variant="ghost" onClick={() => removePlan(pIdx)} className="w-10 h-10 p-0 text-slate-700 hover:text-rose-600 hover:bg-rose-50 transition-all rounded-full active:scale-75">
                                        <Trash2 size={20} />
                                    </Button>
                                </CardHeader>
                                <CardContent className="p-8 grid grid-cols-1 md:grid-cols-2 gap-12">
                                    <div className="space-y-8">
                                        <div className="space-y-4">
                                            <Label className="text-[10px] font-black uppercase tracking-widest text-black">Mensalidade Nominal (BRL)</Label>
                                            <div className="relative group">
                                                <DollarSign size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-black group-hover:text-[#1D5F31] transition-colors" />
                                                <Input
                                                    type="number"
                                                    value={plan.price}
                                                    onChange={(e) => updatePlan(pIdx, 'price', e.target.value)}
                                                    className="bg-slate-50 border border-slate-100 rounded-2xl h-16 pl-14 text-lg text-black font-mono font-black focus:border-[#1D5F31]/30 focus:bg-white transition-all shadow-inner"
                                                />
                                            </div>
                                        </div>
                                        <div
                                            onClick={() => updatePlan(pIdx, 'active', !plan.active)}
                                            className={`flex items-center gap-4 p-4 rounded-xl cursor-pointer border transition-all ${plan.active
                                                ? 'bg-emerald-50 border-emerald-100 text-emerald-700'
                                                : 'bg-slate-50 border-slate-100 text-slate-700'
                                                }`}
                                        >
                                            <div className={`w-3 h-3 rounded-full ${plan.active ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                                            <span className="text-[10px] font-black uppercase tracking-wider">Status: {plan.active ? 'ATIVO NO MERCADO' : 'EM MODO RASCUNHO'}</span>
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        <Label className="text-[10px] font-black uppercase tracking-wider text-slate-900 flex items-center justify-between">
                                            Vantagens Competitivas
                                            <span className="text-[8px] opacity-50 font-light">{plan.features.length} ITENS</span>
                                        </Label>
                                        <div className="space-y-3">
                                            {plan.features.map((feat, fIdx) => (
                                                <div key={fIdx} className="flex gap-3 group/feature">
                                                    <Input
                                                        value={feat}
                                                        onChange={(e) => updateFeature(pIdx, fIdx, e.target.value)}
                                                        className="bg-slate-50 border border-slate-200 rounded-xl h-12 text-[11px] text-black font-black focus:bg-white focus:border-[#000000]/20 transition-all"
                                                        placeholder="Vantagem técnica..."
                                                    />
                                                    <Button variant="ghost" size="icon" onClick={() => removeFeature(pIdx, fIdx)} className="h-12 w-12 text-black font-black hover:text-rose-600 hover:bg-rose-50 transition-all rounded-xl active:scale-75">
                                                        <Trash2 size={14} />
                                                    </Button>
                                                </div>
                                            ))}
                                            <Button
                                                variant="ghost"
                                                onClick={() => addFeature(pIdx)}
                                                className="w-full border-2 border-dashed border-slate-200 text-slate-700 hover:text-[#000000] hover:bg-[#000000]/5 hover:border-[#000000]/20 text-[10px] font-bold uppercase tracking-wider h-12 rounded-xl transition-all"
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
            <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] w-full max-w-md px-4 animate-in slide-in-from-bottom-10 duration-1000">
                <Button
                    onClick={handleSave}
                    disabled={saving}
                    className="w-full bg-[#1D5F31] hover:bg-slate-900 text-white font-bold uppercase tracking-wider h-14 text-[11px] rounded-xl transition-all shadow-lg flex items-center justify-center gap-4 active:scale-95"
                >
                    {saving ? (
                        <div className="flex items-center gap-3">
                            <Loader2 size={18} className="animate-spin" />
                            <span>SINCRONIZANDO...</span>
                        </div>
                    ) : (
                        <div className="flex items-center gap-3">
                            <Save size={18} className="group-hover:scale-110 transition-transform" />
                            <span>SINCRONIZAR ARQUITETURA</span>
                        </div>
                    )}
                </Button>
            </div>
        </div>
    )
}
