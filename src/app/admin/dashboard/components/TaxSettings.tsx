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
        <div className="bg-white p-8 border border-[#D1D7DC] shadow-sm rounded-xl">
            <div className="flex items-center gap-3 mb-6">
                <Settings className="text-[#1D5F31]" size={20} />
                <h3
                    className="text-sm font-black uppercase tracking-widest"
                    style={{ color: '#000000' }}
                >Configurações Globais</h3>
            </div>
            
            <div className="space-y-6">
                <div>
                    <label
                        className="text-[10px] font-black uppercase tracking-[2px] block mb-3"
                        style={{ color: '#000000' }}
                    >
                        Taxa da Plataforma (%)
                    </label>
                    <div className="flex gap-4">
                        <input 
                            type="number" 
                            value={tax} 
                            onChange={(e) => setTax(Number(e.target.value))}
                            className="bg-white border-2 border-[#D1D7DC] px-4 py-3 outline-none focus:border-[#1D5F31] transition-all flex-grow font-black"
                            style={{ color: '#000000', backgroundColor: '#ffffff' }}
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
                <p
                    className="text-[9px] font-black uppercase tracking-wider italic"
                    style={{ color: '#000000' }}
                >
                    * Esta taxa será aplicada em todos os novos cálculos de repasse.
                </p>
            </div>
        </div>
    )
}
