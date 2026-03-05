"use client"

import { History, Layout } from 'lucide-react'

export default function ActivityPage() {
    return (
        <div className="p-8 md:p-12 min-h-screen font-exo text-slate-800 animate-in fade-in duration-500">
            <header className="mb-12">
                <div className="flex items-center gap-3 mb-2">
                    <span className="text-[10px] font-black uppercase tracking-[5px] text-[#00C402]">HISTÓRICO</span>
                </div>
                <h1 className="text-4xl font-black tracking-tighter text-slate-900 uppercase">
                    LOGS DE <span className="text-[#00C402]">ATIVIDADES</span>
                </h1>
                <p className="text-slate-400 font-bold text-xs tracking-widest uppercase mt-2">Acompanhe seu progresso e acessos recentes.</p>
            </header>

            <div className="bg-white rounded-[40px] border border-slate-100 p-12 shadow-sm flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-200 mb-6">
                    <History size={32} />
                </div>
                <h3 className="text-sm font-black uppercase tracking-widest text-slate-300">Nenhuma atividade registrada hoje</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">Suas interações com a plataforma aparecerão aqui em tempo real.</p>

                <div className="mt-10 p-6 bg-[#F8F9FA] rounded-[32px] border border-slate-50 w-full max-w-md">
                    <div className="flex items-center justify-between opacity-30">
                        <div className="flex items-center gap-4">
                            <div className="w-2 h-2 rounded-full bg-[#00C402]" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Acesso à Plataforma</span>
                        </div>
                        <span className="text-[9px] font-bold text-slate-400 uppercase">09:42</span>
                    </div>
                </div>
            </div>
        </div>
    )
}
