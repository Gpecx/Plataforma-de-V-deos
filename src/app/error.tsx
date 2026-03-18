'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { AlertTriangle, RefreshCcw, Home } from 'lucide-react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="min-h-[400px] flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-500">
      <div className="bg-red-500/10 border border-red-500/20 p-8 rounded-none max-w-lg w-full">
        <div className="flex justify-center mb-6">
          <div className="p-3 bg-red-500/20 rounded-full">
            <AlertTriangle className="text-red-500" size={32} />
          </div>
        </div>
        
        <h2 className="text-xl font-bold text-white mb-2 uppercase tracking-tight">
          Ops! Algo deu errado
        </h2>
        <p className="text-slate-400 mb-8 text-sm">
          Ocorreu um erro inesperado nesta seção. Você pode tentar recarregar o componente ou voltar para o início.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => reset()}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-[#1D5F31] hover:bg-[#28b828] text-white font-bold uppercase text-xs tracking-widest transition-all"
          >
            <RefreshCcw size={16} />
            Tentar Novamente
          </button>
          
          <Link
            href="/dashboard-student"
            className="flex items-center justify-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-bold uppercase text-xs tracking-widest border border-white/10 transition-all"
          >
            <Home size={16} />
            Voltar ao Início
          </Link>
        </div>
      </div>
    </div>
  )
}
