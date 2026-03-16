"use client"

import { Award, Lock, BookOpen } from 'lucide-react'
import Link from 'next/link'

export default function CertificatesPage() {
    return (
        <div className="p-8 md:p-12 min-h-screen font-exo text-white bg-[#0d2b17] animate-in fade-in duration-500">
            <header className="mb-12">
                <div className="flex items-center gap-3 mb-2">
                    <span className="text-[10px] font-black uppercase tracking-[5px] text-[#00C402]">CONQUISTAS</span>
                </div>
                <h1 className="text-4xl font-black tracking-tighter text-white uppercase">
                    MEUS <span className="text-[#00C402]">CERTIFICADOS</span>
                </h1>
                <p className="text-slate-400 font-bold text-xs tracking-widest uppercase mt-2">Sua trajetória de sucesso documentada.</p>
            </header>

            <div className="w-full">
                {/* Empty State / Placeholder Reformulado */}
                <div className="bg-[#0f1f14] border-2 border-[#1e4d2b] py-24 md:py-32 flex flex-col items-center text-center relative overflow-hidden">
                    {/* Elemento decorativo de fundo para preencher espaço */}
                    <Award size={300} className="absolute -bottom-10 -right-10 text-[#1e4d2b]/10 rotate-12 pointer-events-none" />

                    <div className="relative z-10">
                        <div className="w-24 h-24 bg-[#0d2b17] border-2 border-[#1e4d2b] flex items-center justify-center text-[#1e4d2b] mb-8 mx-auto shadow-2xl">
                            <Award size={48} />
                        </div>

                        <h2 className="text-2xl font-black uppercase tracking-tighter text-white mb-4">
                            Nenhum Certificado <span className="text-[#00C402]">Emitido</span>
                        </h2>

                        <p className="text-[10px] font-bold uppercase tracking-[3px] text-slate-400 mt-2 max-w-md mx-auto leading-relaxed">
                            Sua galeria de conquistas está aguardando. <br />
                            Conclua seus treinamentos 100% para liberar seus documentos oficiais PowerPlay.
                        </p>

                        <div className="mt-12 flex flex-col md:flex-row items-center justify-center gap-4">
                            <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[3px] text-slate-500 bg-[#0d2b17] px-6 py-4 border border-[#1e4d2b]">
                                <Lock size={12} className="text-[#00C402]" /> ÁREA PROTEGIDA
                            </div>

                            <Link href="/course" className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[3px] text-white bg-[#00C402] px-8 py-4 hover:brightness-110 transition-all shadow-lg shadow-[#00C402]/10">
                                <BookOpen size={14} /> EXPLORAR TREINAMENTOS
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}