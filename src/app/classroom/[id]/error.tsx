'use client'

import { AlertCircle, RefreshCw, ChevronRight } from 'lucide-react'

export default function ClassroomError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex-1 flex items-center justify-center p-6 bg-[#061629] min-h-[500px]">
      <div className="max-w-md w-full text-center animate-in zoom-in-95 duration-500">
        <div className="mb-6 flex justify-center">
          <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/20 rounded-full flex items-center justify-center">
            <AlertCircle className="text-amber-500" size={32} />
          </div>
        </div>

        <h2 className="text-xl font-black italic uppercase tracking-tighter text-white mb-4">
          Não foi possível carregar esta aula
        </h2>
        
        <p className="text-slate-400 text-sm mb-8 leading-relaxed">
          Tivemos um problema técnico ao processar o conteúdo. Tente recarregar ou continue para a próxima lição na barra lateral.
        </p>

        <div className="flex flex-col gap-3">
          <button
            onClick={() => reset()}
            className="w-full flex items-center justify-center gap-2 px-8 py-4 bg-[#1D5F31] text-white font-black uppercase tracking-tighter hover:bg-[#28b828] transition-all shadow-lg"
          >
            <RefreshCw size={18} />
            Tentar Novamente
          </button>
          
          <div className="text-[10px] font-black uppercase tracking-[3px] text-slate-500 mt-4">
            OU USE A NAVEGAÇÃO LATERAL PARA PULAR
          </div>
        </div>
      </div>
    </div>
  )
}
