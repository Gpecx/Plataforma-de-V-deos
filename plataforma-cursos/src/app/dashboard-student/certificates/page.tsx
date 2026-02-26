"use client"

import { Award, Lock } from 'lucide-react'

export default function CertificatesPage() {
    return (
        <div className="p-8 md:p-12 min-h-screen font-exo text-slate-800 animate-in fade-in duration-500">
            <header className="mb-12">
                <div className="flex items-center gap-3 mb-2">
                    <span className="text-[10px] font-black uppercase tracking-[5px] text-[#00C402]">CONQUISTAS</span>
                </div>
                <h1 className="text-4xl font-black tracking-tighter text-slate-900 uppercase">
                    MEUS <span className="text-[#00C402]">CERTIFICADOS</span>
                </h1>
                <p className="text-slate-400 font-bold text-xs tracking-widest uppercase mt-2">Sua trajetória de sucesso documentada.</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {/* Empty State / Placeholder */}
                <div className="col-span-full py-32 flex flex-col items-center text-center">
                    <div className="w-24 h-24 rounded-[32px] bg-white border border-slate-100 flex items-center justify-center text-slate-100 mb-8 shadow-sm">
                        <Award size={48} />
                    </div>
                    <h2 className="text-xl font-black uppercase tracking-tighter text-slate-300">Nenhum Certificado Emitido</h2>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-2 max-w-xs">Conclua seus treinamentos 100% para liberar seus documentos oficiais SPCS Academy.</p>

                    <div className="mt-12 flex items-center gap-2 text-[9px] font-black uppercase tracking-[3px] text-[#00C402] bg-[#00C402]/5 px-6 py-3 rounded-full border border-[#00C402]/10">
                        <Lock size={12} /> ÁREA PROTEGIDA
                    </div>
                </div>
            </div>
        </div>
    )
}
