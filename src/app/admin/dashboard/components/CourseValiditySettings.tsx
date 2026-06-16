"use client"

import { useState } from 'react'
import { updateCourseValidityMonths } from '@/app/actions/admin'
import { Settings, Save, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface CourseValiditySettingsProps {
    initialMonths: number
}

export default function CourseValiditySettings({ initialMonths }: CourseValiditySettingsProps) {
    const [months, setMonths] = useState(initialMonths)
    const [loading, setLoading] = useState(false)

    const isValid = Number.isInteger(months) && months >= 1 && months <= 60

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value
        // Permite campo vazio durante digitação sem converter para 0
        setMonths(val === '' ? ('' as any) : Number(val))
    }

    const handleSave = async () => {
        if (!isValid) {
            toast.error('Digite um valor entre 1 e 60 meses.')
            return
        }
        setLoading(true)
        const res = await updateCourseValidityMonths(months)
        setLoading(false)
        if (res.success) {
            toast.success('Validade atualizada com sucesso!')
        } else {
            toast.error(res.error || 'Erro ao atualizar validade.')
        }
    }

    return (
        <div className="bg-white p-8 border border-black/20 shadow-sm rounded-lg">
            <div className="flex items-center gap-3 mb-6">
                <Settings className="text-[#1D5F31]" size={20} />
                <h3 className="text-sm font-bold uppercase tracking-widest !text-[#000000]">
                    Validade de Acesso aos Cursos
                </h3>
            </div>

            <div className="space-y-6">
                <div>
                    <label className="text-[10px] font-bold uppercase tracking-[2px] block mb-3 !text-[#000000]">
                        Duração do acesso após a compra (em meses)
                    </label>
                    <div className="flex items-end gap-4">
                        <div className="flex-1">
                            <input
                                type="number"
                                min={1}
                                max={60}
                                value={months}
                                onChange={handleChange}
                                className={`w-full bg-white border-2 px-4 h-12 outline-none transition-all font-bold !text-[#000000] rounded-md ${!isValid && months !== ('' as any)
                                        ? 'border-red-400 focus:border-red-500'
                                        : 'border-black/20 focus:border-[#1D5F31]'
                                    }`}
                            />
                            {!isValid && months !== ('' as any) && (
                                <p className="text-[9px] font-bold uppercase tracking-wider text-red-500 mt-1">
                                    Digite um valor entre 1 e 60 meses.
                                </p>
                            )}
                        </div>
                        <button
                            onClick={handleSave}
                            disabled={loading || !isValid}
                            className="bg-[#1D5F31] text-white px-8 h-12 font-bold uppercase text-[10px] tracking-widest hover:bg-[#28b828] transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed rounded-md"
                        >
                            {loading
                                ? <Loader2 size={14} className="animate-spin" />
                                : <><Save size={14} /> Salvar</>
                            }
                        </button>
                    </div>
                </div>
                <div className="space-y-1">
                    <p className="text-[9px] font-bold uppercase tracking-wider !text-[#000000]">
                        * Aplicado a todos os novos cursos comprados a partir de agora.
                    </p>
                    <p className="text-[9px] font-bold uppercase tracking-wider text-black/40">
                        * Matrículas já existentes não são afetadas.
                    </p>
                </div>
            </div>
        </div>
    )
}