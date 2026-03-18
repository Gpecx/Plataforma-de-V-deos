"use client"

import { useState } from 'react'
import { updatePlatformTax } from '@/app/actions/admin'
import { Settings, Save, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface TaxSettingsProps {
    currentTax: number
}

export default function TaxSettings({ currentTax }: TaxSettingsProps) {
    const [tax, setTax] = useState(currentTax)
    const [loading, setLoading] = useState(false)

    const handleSave = async () => {
        setLoading(true)
        const res = await updatePlatformTax(tax)
        setLoading(false)
        if (res.success) {
            toast.success("Taxa atualizada com sucesso!")
            setTimeout(() => window.location.reload(), 1000)
        } else {
            toast.error("Erro ao atualizar taxa.")
        }
    }

    return (
        <div className="bg-[#061629]/40 backdrop-blur-md p-8 border border-[#1D5F31]/30">
            <div className="flex items-center gap-3 mb-6">
                <Settings className="text-[#1D5F31]" size={20} />
                <h3 className="text-sm font-black uppercase tracking-widest text-white">Configurações Globais</h3>
            </div>
            
            <div className="space-y-6">
                <div>
                    <label className="text-[10px] font-black uppercase tracking-[2px] text-slate-500 block mb-3">
                        Taxa da Plataforma (%)
                    </label>
                    <div className="flex gap-4">
                        <input 
                            type="number" 
                            value={tax} 
                            onChange={(e) => setTax(Number(e.target.value))}
                            className="bg-[#061629] border border-[#1D5F31]/50 px-4 py-3 text-white outline-none focus:border-[#1D5F31] transition-all flex-grow font-bold"
                        />
                        <button 
                            onClick={handleSave}
                            disabled={loading}
                            className="bg-[#1D5F31] text-white px-8 py-3 font-black uppercase text-[10px] tracking-widest hover:bg-[#28b828] transition-all flex items-center gap-2 disabled:opacity-50"
                        >
                            {loading ? <Loader2 size={14} className="animate-spin" /> : <><Save size={14} /> Salvar</>}
                        </button>
                    </div>
                </div>
                <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider italic">
                    * Esta taxa será aplicada em todos os novos cálculos de repasse.
                </p>
            </div>
        </div>
    )
}
