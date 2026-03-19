'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { AlertCircle, RefreshCcw, LayoutDashboard } from 'lucide-react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Dashboard Error Boundary:', error)
  }, [error])

  return (
    <div className="min-h-[500px] flex flex-col items-center justify-center p-6 text-center animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="bg-[#0f172a] border border-red-500/20 p-10 rounded-none max-w-xl w-full shadow-2xl relative overflow-hidden">
        {/* Decorative background element */}
        <div className="absolute top-0 left-0 w-full h-1 bg-red-500/50" />
        
        <div className="flex justify-center mb-8">
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-full">
            <AlertCircle className="text-red-500" size={40} />
          </div>
        </div>
        
        <h2 className="text-2xl font-black italic text-white mb-3 uppercase tracking-tighter">
          Algo não carregou corretamente
        </h2>
        
        <p className="text-slate-400 mb-10 text-base leading-relaxed max-w-md mx-auto">
          Ocorreu um erro inesperado nesta seção do dashboard. A navegação global continua ativa. Tente recarregar este módulo ou volte para a página inicial.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => reset()}
            className="group flex-1 flex items-center justify-center gap-2 px-8 py-4 bg-[#1D5F31] hover:bg-[#28b828] text-white font-black uppercase text-xs tracking-[0.2em] transition-all transform active:scale-95"
          >
            <RefreshCcw size={18} className="group-hover:rotate-180 transition-transform duration-500" />
            Tentar Novamente
          </button>
          
          <Link
            href="/dashboard-student"
            className="flex-1 flex items-center justify-center gap-2 px-8 py-4 bg-white/5 hover:bg-white/10 text-white font-black uppercase text-xs tracking-[0.2em] border border-white/10 transition-all transform active:scale-95"
          >
            <LayoutDashboard size={18} />
            Início do Painel
          </Link>
        </div>
        
        {error.digest && (
          <p className="mt-8 text-[10px] text-slate-600 font-mono uppercase tracking-widest">
            ID do Erro: {error.digest}
          </p>
        )}
      </div>
    </div>
  )
}
