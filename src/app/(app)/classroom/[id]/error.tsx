'use client'

import { AlertCircle, RefreshCw, ArrowRight } from 'lucide-react'

export default function ClassroomError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex-1 flex items-center justify-center p-8 bg-[#020617] min-h-[500px] border-l border-white/5">
      <div className="max-w-md w-full text-center animate-in zoom-in-95 duration-500">
        <div className="mb-8 flex justify-center">
          <div className="w-20 h-20 bg-amber-500/10 border border-amber-500/20 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(245,158,11,0.1)]">
            <AlertCircle className="text-amber-500" size={40} />
          </div>
        </div>

        <h2 className="text-2xl font-black italic uppercase tracking-tighter text-white mb-4">
          Não foi possível carregar esta aula
        </h2>
        
        <p className="text-slate-400 text-base mb-10 leading-relaxed">
          Tivemos um problema técnico ao carregar o conteúdo desta aula. Tente recarregar ou continue para a próxima lição usando a navegação lateral.
        </p>

        <div className="flex flex-col gap-4">
          <button
            onClick={() => reset()}
            className="group w-full flex items-center justify-center gap-3 px-8 py-5 bg-[#1D5F31] text-white font-black uppercase tracking-widest text-xs hover:bg-[#28b828] transition-all shadow-xl transform active:scale-95"
          >
            <RefreshCw size={18} className="group-hover:rotate-180 transition-transform duration-500" />
            Tentar Novamente
          </button>
          
          <div className="py-4 border-t border-white/5 mt-4">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-4">
              OU PULE PARA A PRÓXIMA
            </p>
            <div className="flex items-center justify-center gap-2 text-amber-500/60 font-bold text-xs uppercase tracking-widest italic">
              Use a trilha na lateral <ArrowRight size={14} />
            </div>
          </div>
        </div>
        
        {error.digest && (
          <p className="mt-8 text-[9px] text-slate-700 font-mono uppercase tracking-[0.2em]">
            REF: {error.digest}
          </p>
        )}
      </div>
    </div>
  )
}
