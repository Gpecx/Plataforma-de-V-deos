"use client"

import { Banknote } from "lucide-react"

export default function PrintButton() {
    return (
        <button 
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[#1D5F31] hover:underline"
        >
            <Banknote size={14} /> Versão para Impressão
        </button>
    )
}
