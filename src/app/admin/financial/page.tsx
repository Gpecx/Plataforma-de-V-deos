'use client'

import { useState, useEffect, useCallback } from 'react'
import { getFinancialSettings, saveFinancialSettings, FinancialSettings, PlanData, getTeachersWithCourses, saveCustomCourseFee, TeacherItem, TeacherCourseItem } from '@/app/actions/financial'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { DollarSign, Percent, Save, Loader2, Plus, Trash2, ShieldCheck, User, BookOpen, ChevronDown, ChevronRight, AlertCircle } from 'lucide-react'
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

    const [teachers, setTeachers] = useState<TeacherItem[]>([])
    const [teachersLoading, setTeachersLoading] = useState(true)
    const [expandedTeacher, setExpandedTeacher] = useState<string | null>(null)
    const [savingFee, setSavingFee] = useState<string | null>(null)
    const [localFees, setLocalFees] = useState<Record<string, number | null>>({})

    useEffect(() => {
        getTeachersWithCourses().then(data => {
            setTeachers(data)
            const fees: Record<string, number | null> = {}
            data.forEach(t => t.courses.forEach(c => { fees[c.id] = c.customFeePlatform }))
            setLocalFees(fees)
            setTeachersLoading(false)
        })
    }, [])

    const handleFeeChange = useCallback((courseId: string, value: number) => {
        const clamped = Math.min(100, Math.max(0, value))
        setLocalFees(prev => ({ ...prev, [courseId]: clamped }))
    }, [])

    const handleSaveFee = useCallback(async (courseId: string) => {
        setSavingFee(courseId)
        const fee = localFees[courseId] ?? null
        const res = await saveCustomCourseFee(courseId, fee)
        setSavingFee(null)
        if (res.success) {
            toast.success('Taxa salva!')
            setTeachers(prev => prev.map(t => ({
                ...t,
                courses: t.courses.map(c => c.id === courseId ? { ...c, customFeePlatform: fee } : c)
            })))
        } else {
            toast.error(res.error || 'Erro ao salvar taxa')
        }
    }, [localFees])

    const isCustomFee = (courseId: string) => {
        const fee = localFees[courseId]
        if (fee === null || fee === undefined) return false
        return fee !== settings?.platformTax
    }

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
        <div className="max-w-[1600px] mx-auto p-8 md:p-16 font-montserrat pb-64">
            <header className="mb-8 animate-pulse">
                <div className="flex items-center gap-3 mb-4">
                    <div className="h-[1px] w-10 bg-slate-200" />
                    <div className="h-2 w-24 bg-slate-100 rounded" />
                </div>
                <div className="h-10 w-64 bg-slate-100 rounded mb-4" />
                <div className="h-4 w-96 bg-slate-100 rounded" />
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start opacity-50">
                <div className="lg:col-span-4 flex flex-col gap-6">
                    <div className="h-[400px] bg-white border border-black/20 rounded-md animate-pulse shadow-sm" />
                    <div className="h-[200px] bg-white border border-black/20 rounded-md animate-pulse shadow-sm" />
                </div>
                <div className="lg:col-span-8 flex flex-col gap-6">
                    <div className="h-[500px] bg-white border border-black/20 rounded-md animate-pulse shadow-sm" />
                    <div className="h-[300px] bg-white border border-black/20 rounded-md animate-pulse shadow-sm" />
                </div>
            </div>
        </div>
    )

    return (
        <div className="max-w-[1600px] mx-auto p-8 md:p-16 font-montserrat pb-64 animate-in fade-in duration-1000">
            <header className="mb-8 flex flex-col items-center text-center">
                <div className="flex items-center gap-3 mb-4">

                </div>
                <h1 className="text-3xl font-bold tracking-tighter uppercase leading-none !text-[#000000] text-center max-w-2xl">
                    <span className="text-[#1D5F31]">Configurações Estratégicas</span>
                </h1>
                <p className="!text-[#000000] font-bold text-[11px] tracking-widest uppercase mt-4 max-w-2xl leading-tight">

                </p>
            </header>

            {/* ABA DE PROFESSORES */}
            <div className="mb-12 flex flex-col gap-6">
                {/* CABEÇALHO REPASSES CUSTOMIZADOS */}
                <Card className="rounded-md border border-black/20 shadow-sm bg-white overflow-hidden">
                    <CardContent className="p-8 flex flex-col gap-4">
                        <div className="w-12 h-12 rounded-md bg-slate-50 flex items-center justify-center border border-black/20">
                            <Percent className="text-[#000000]" size={24} strokeWidth={2.5} />
                        </div>
                        <div>
                            <h2 className="text-base font-bold uppercase tracking-wider !text-[#000000]">Repasses Customizados</h2>
                            <p className="text-[10px] !text-[#000000] font-bold uppercase tracking-widest mt-2">
                                Configure taxas de repasse específicas para incentivar ou bonificar professores em cursos selecionados.
                            </p>
                        </div>
                    </CardContent>
                </Card>
                {/* LISTA DE PROFESSORES E CURSOS */}
                <div className="space-y-4">
                    {teachersLoading ? (
                        <div className="flex items-center justify-center py-20 bg-white border border-black/20 rounded-md shadow-sm">
                            <Loader2 size={24} className="animate-spin text-black/40" />
                        </div>
                    ) : teachers.length === 0 ? (
                        <Card className="rounded-md border border-black/20 shadow-sm bg-white">
                            <CardContent className="p-12 text-center">
                                <User size={32} className="mx-auto text-black/20 mb-4" />
                                <p className="text-xs font-bold uppercase tracking-wider text-black/40">Nenhum professor ou curso encontrado</p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="space-y-4">
                            {teachers.map((teacher) => {
                                const isOpen = expandedTeacher === teacher.id
                                const activeCourses = teacher.courses.filter(c => c.status === 'APROVADO' || c.status === 'PENDENTE')
                                return (
                                    <Card key={teacher.id} className="rounded-md border border-black/20 bg-white overflow-hidden shadow-sm hover:shadow-md transition-all duration-300">
                                        <div
                                            className="flex items-center justify-between p-6 cursor-pointer select-none hover:bg-slate-50/50 transition-colors"
                                            onClick={() => setExpandedTeacher(isOpen ? null : teacher.id)}
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-md bg-slate-50 flex items-center justify-center border border-black/20">
                                                    {teacher.avatarUrl ? (
                                                        <img src={teacher.avatarUrl} alt="" className="w-10 h-10 rounded-md object-cover" />
                                                    ) : (
                                                        <span className="text-xs font-bold text-black">{teacher.fullName.charAt(0)}</span>
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold uppercase tracking-tight !text-[#000000]">{teacher.fullName}</p>
                                                    <p className="text-[10px] text-black/50 font-bold uppercase tracking-wider">{teacher.email} &middot; {activeCourses.length} curso{activeCourses.length !== 1 ? 's' : ''}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                {activeCourses.some(c => isCustomFee(c.id)) && (
                                                    <span className="text-[8px] font-bold uppercase bg-amber-50 text-amber-700 border border-amber-200 px-2 py-1 rounded-md tracking-wider">Bônus Ativo</span>
                                                )}
                                                {isOpen ? <ChevronDown size={18} className="text-black/40" /> : <ChevronRight size={18} className="text-black/40" />}
                                            </div>
                                        </div>

                                        {isOpen && (
                                            <div className="border-t border-black/10">
                                                {activeCourses.length === 0 ? (
                                                    <div className="p-8 text-center">
                                                        <p className="text-[10px] font-bold uppercase tracking-wider text-black/30">Nenhum curso encontrado para este professor</p>
                                                    </div>
                                                ) : (
                                                    <div className="overflow-x-auto">
                                                        <table className="w-full text-left">
                                                            <thead>
                                                                <tr className="border-b border-black/10 bg-slate-50/50">
                                                                    <th className="p-4 text-[9px] font-bold uppercase tracking-wider text-black/50">Curso</th>
                                                                    <th className="p-4 text-[9px] font-bold uppercase tracking-wider text-black/50">Preço</th>
                                                                    <th className="p-4 text-[9px] font-bold uppercase tracking-wider text-black/50">Taxa Plataforma (%)</th>
                                                                    <th className="p-4 text-[9px] font-bold uppercase tracking-wider text-black/50">Repasse Professor (%)</th>
                                                                    <th className="p-4 text-[9px] font-bold uppercase tracking-wider text-black/50">Status</th>
                                                                    <th className="p-4 text-[9px] font-bold uppercase tracking-wider text-black/50"></th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {activeCourses.map((course) => {
                                                                    const fee = localFees[course.id] ?? settings.platformTax
                                                                    const teacherShare = 100 - fee
                                                                    const custom = isCustomFee(course.id)
                                                                    const savingThis = savingFee === course.id
                                                                    return (
                                                                        <tr key={course.id} className="border-b border-black/5 hover:bg-slate-50/30 transition-colors">
                                                                            <td className="p-4">
                                                                                <p className="text-[11px] font-bold !text-[#000000] uppercase tracking-tight">{course.title}</p>
                                                                            </td>
                                                                            <td className="p-4">
                                                                                <p className="text-[11px] font-bold !text-[#000000]">R$ {course.price.toFixed(2)}</p>
                                                                            </td>
                                                                            <td className="p-4 w-48 align-middle">
                                                                                <div className="relative max-w-[120px] flex items-center">
                                                                                    <Input
                                                                                        type="number"
                                                                                        min={0}
                                                                                        max={100}
                                                                                        value={fee}
                                                                                        onChange={(e) => handleFeeChange(course.id, Number(e.target.value))}
                                                                                        className={`bg-slate-50 border rounded-md h-10 text-sm font-bold !text-[#000000] px-4 pr-8 focus:bg-white transition-all ${custom ? 'border-amber-300 bg-amber-50/50' : 'border-black/20'}`}
                                                                                    />
                                                                                    <span className="absolute right-3 text-[10px] font-bold text-black/40">%</span>
                                                                                </div>
                                                                            </td>
                                                                            <td className="p-4">
                                                                                <p className="text-[11px] font-bold !text-[#000000]">{teacherShare}%</p>
                                                                            </td>
                                                                            <td className="p-4">
                                                                                {custom ? (
                                                                                    <span className="inline-flex items-center gap-1 text-[8px] font-bold uppercase bg-amber-50 text-amber-700 border border-amber-200 px-2 py-1 rounded-md tracking-wider">
                                                                                        <AlertCircle size={10} />
                                                                                        Taxa Customizada
                                                                                    </span>
                                                                                ) : (
                                                                                    <span className="text-[8px] font-bold uppercase text-black/30 tracking-wider">Global</span>
                                                                                )}
                                                                            </td>
                                                                            <td className="p-4 align-middle">
                                                                                <Button
                                                                                    size="sm"
                                                                                    onClick={() => handleSaveFee(course.id)}
                                                                                    disabled={savingThis}
                                                                                    className="bg-[#000000] text-white hover:bg-slate-800 text-[9px] font-bold uppercase h-10 px-4 rounded-md transition-all disabled:opacity-50 flex items-center justify-center w-full max-w-[100px]"
                                                                                >
                                                                                    {savingThis ? <Loader2 size={12} className="animate-spin" /> : 'Salvar'}
                                                                                </Button>
                                                                            </td>
                                                                        </tr>
                                                                    )
                                                                })}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </Card>
                                )
                            })}
                        </div>
                    )}
                </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* ─── COLUNA DA ESQUERDA ─────────────────────────── */}
                <div className="lg:col-span-4 flex flex-col gap-6">
                    {/* TAXA DA PLATAFORMA */}
                    <Card className="rounded-md border border-black/20 shadow-sm bg-white overflow-hidden sticky top-32">
                        <CardHeader className="p-8 border-b border-black/20">
                            <CardTitle className="text-xs font-bold uppercase tracking-wider !text-[#000000] flex items-center gap-3">
                                <div className="w-8 h-8 rounded-md bg-slate-50 flex items-center justify-center border border-black/20">
                                    <Percent size={14} className="text-[#000000]" strokeWidth={3} />
                                </div>
                                Fee da Plataforma
                            </CardTitle>
                            <CardDescription className="text-[10px] uppercase font-bold !text-[#000000] tracking-widest mt-2">Dedução Automática por Transação</CardDescription>
                        </CardHeader>
                        <CardContent className="p-8 space-y-8">
                            <div className="space-y-4">
                                <Label className="text-[10px] font-bold uppercase tracking-wider !text-[#000000]">Aliquota de Desconto (%)</Label>
                                <div className="relative group">
                                    <Input
                                        type="number"
                                        value={settings.platformTax}
                                        onChange={(e) => setSettings({ ...settings, platformTax: Number(e.target.value) })}
                                        className="bg-slate-50 border border-black/20 rounded-md h-16 text-3xl font-bold !text-[#000000] px-8 focus:border-[#000000]/30 focus:bg-white transition-all shadow-inner"
                                    />
                                    <div className="absolute right-8 top-1/2 -translate-y-1/2 !text-[#000000] font-bold text-xl">%</div>
                                </div>
                                <p className="text-[10px] !text-[#000000] font-bold uppercase tracking-wider leading-tight">
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                </div>

                {/* ─── COLUNA PRINCIPAL DIREITA ───────────────────── */}
                <div className="lg:col-span-8 flex flex-col gap-6">
                    {/* PLANOS DE ASSINATURA */}
                    <div className="space-y-6">
                        <div className="flex items-center justify-between bg-white p-8 rounded-md border border-black/20 shadow-sm">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-md bg-slate-50 flex items-center justify-center border border-black/20">
                                    <ShieldCheck className="text-[#000000]" size={24} strokeWidth={2.5} />
                                </div>
                                <div>
                                    <h2 className="text-base font-bold uppercase tracking-wider !text-[#000000]">Catálogo de Assinaturas</h2>
                                    <p className="text-[10px] !text-[#000000] font-bold uppercase tracking-widest">Estruturas de Acesso Recorrente</p>
                                </div>
                            </div>
                            <Button onClick={addPlan} className="bg-[#000000] text-white hover:bg-slate-900 text-xs font-bold uppercase h-12 px-8 rounded-md transition-all shadow-sm active:scale-95 ml-auto">
                                <Plus size={16} className="mr-2" /> Novo Modelo
                            </Button>
                        </div>

                        <div className="space-y-6">
                            {settings.plans.map((plan, pIdx) => (
                                <Card key={plan.id} className="rounded-md border border-black/20 bg-white hover:border-[#000000]/30 transition-all duration-500 group overflow-hidden shadow-sm hover:shadow-md">
                                    <CardHeader className="flex flex-row items-center justify-between bg-slate-50/50 border-b border-black/20 py-6 px-8">
                                        <div className="flex-1">
                                            <Input
                                                value={plan.name}
                                                onChange={(e) => updatePlan(pIdx, 'name', e.target.value)}
                                                className="bg-transparent border-none text-xl font-bold uppercase tracking-tighter !text-[#000000] p-0 h-auto focus-visible:ring-0 placeholder:text-black/40"
                                                placeholder="NOME DO PLANO"
                                            />
                                        </div>
                                        <Button variant="ghost" onClick={() => removePlan(pIdx)} className="w-10 h-10 p-0 !text-[#000000] hover:text-rose-600 hover:bg-rose-50 transition-all rounded-full active:scale-75">
                                            <Trash2 size={20} />
                                        </Button>
                                    </CardHeader>
                                    <CardContent className="p-8 grid grid-cols-1 md:grid-cols-2 gap-12">
                                        <div className="space-y-8">
                                            <div className="space-y-4">
                                                <Label className="text-[10px] font-bold uppercase tracking-wider !text-[#000000]">Mensalidade Nominal (BRL)</Label>
                                                <div className="relative group">
                                                    <DollarSign size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-black group-hover:text-[#1D5F31] transition-colors" />
                                                    <Input
                                                        type="number"
                                                        value={plan.price}
                                                        onChange={(e) => updatePlan(pIdx, 'price', e.target.value)}
                                                        className="bg-slate-50 border border-black/20 rounded-md h-16 pl-14 text-lg !text-[#000000] font-mono font-bold focus:border-[#1D5F31]/30 focus:bg-white transition-all shadow-inner"
                                                    />
                                                </div>
                                            </div>
                                            <div
                                                onClick={() => updatePlan(pIdx, 'active', !plan.active)}
                                                className={`flex items-center gap-4 p-4 rounded-md cursor-pointer border transition-all ${plan.active
                                                    ? 'bg-emerald-50 border-emerald-100 text-emerald-700'
                                                    : 'bg-slate-50 border-black/10 text-slate-700'
                                                    }`}
                                            >
                                                <div className={`w-3 h-3 rounded-full ${plan.active ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                                                <span className="text-[10px] font-bold uppercase tracking-wider">Status: {plan.active ? 'ATIVO NO MERCADO' : 'EM MODO RASCUNHO'}</span>
                                            </div>
                                        </div>

                                        <div className="space-y-6">
                                            <Label className="text-[10px] font-bold uppercase tracking-wider !text-[#000000] flex items-center justify-between">
                                                Vantagens Competitivas
                                                <span className="text-[8px] !text-[#000000] font-bold">{plan.features.length} ITENS</span>
                                            </Label>
                                            <div className="space-y-3">
                                                {plan.features.map((feat, fIdx) => (
                                                    <div key={fIdx} className="flex gap-3 group/feature">
                                                        <Input
                                                            value={feat}
                                                            onChange={(e) => updateFeature(pIdx, fIdx, e.target.value)}
                                                            className="bg-slate-50 border border-black/20 rounded-md h-12 text-[11px] !text-[#000000] font-bold focus:bg-white focus:border-[#000000]/20 transition-all"
                                                            placeholder="Vantagem técnica..."
                                                        />
                                                        <Button variant="ghost" size="icon" onClick={() => removeFeature(pIdx, fIdx)} className="h-12 w-12 !text-[#000000] font-bold hover:text-rose-600 hover:bg-rose-50 transition-all rounded-md active:scale-75">
                                                            <Trash2 size={14} />
                                                        </Button>
                                                    </div>
                                                ))}
                                                <Button
                                                    variant="ghost"
                                                    onClick={() => addFeature(pIdx)}
                                                    className="w-full border-2 border-dashed border-black/20 !text-[#000000] hover:bg-[#000000]/5 hover:border-[#000000]/20 text-[10px] font-bold uppercase tracking-wider h-12 rounded-md transition-all"
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
