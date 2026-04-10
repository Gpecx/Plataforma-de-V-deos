'use client'

import { useState } from 'react'
import { runMigration } from '@/app/actions/migration'
import { CheckCircle, AlertTriangle, Play, Loader2 } from 'lucide-react'

export default function MigrationPage() {
    const [loading, setLoading] = useState(false)
    const [result, setResult] = useState<any>(null)

    const handleRunMigration = async () => {
        if (!confirm('Tem certeza que deseja executar a migração agora? Esta ação é irreversível.')) {
            return
        }

        setLoading(true)
        try {
            const response = await runMigration()
            setResult(response)
        } catch (error: any) {
            setResult({ error: `Erro inesperado: ${error.message}` })
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="p-8 max-w-2xl mx-auto space-y-8">
            <header className="space-y-4">
                <div className="flex items-center gap-3">
                    <div className="h-[2px] w-8 bg-[#1D5F31]" />
                    <span className="text-[10px] font-bold uppercase tracking-[5px] text-[#1D5F31]">Sistema PowerPlay</span>
                </div>
                <h1 className="text-4xl font-bold tracking-tighter uppercase leading-none">
                    Migração de <span className="text-[#1D5F31]">Dados</span>
                </h1>
                <p className="text-slate-900 text-sm font-bold leading-relaxed">
                    Este script percorre as coleções <code className="text-[#1D5F31]">courses</code> e <code className="text-[#1D5F31]">lessons</code> para adicionar o campo <code className="text-[#1D5F31]">status: "APROVADO"</code> aos documentos antigos.
                </p>
            </header>

            <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-xl space-y-4">
                <div className="flex items-center gap-3 text-amber-500">
                    <AlertTriangle size={20} />
                    <span className="text-xs font-bold uppercase tracking-widest">Atenção</span>
                </div>
                <p className="text-slate-300 text-sm">
                    Recomendamos fazer um backup do Firestore antes de prosseguir. Esta ferramenta deve ser usada apenas uma vez.
                </p>
                
                <button
                    onClick={handleRunMigration}
                    disabled={loading}
                    className="flex items-center gap-3 bg-[#1D5F31] text-black px-6 py-3 font-bold uppercase text-xs tracking-widest hover:bg-white transition-all disabled:opacity-50"
                >
                    {loading ? (
                        <Loader2 size={16} className="animate-spin" />
                    ) : (
                        <Play size={16} fill="currentColor" />
                    )}
                    <span>{loading ? 'Executando...' : 'Iniciar Migração'}</span>
                </button>
            </div>

            {result && (
                <div className={`p-6 border ${result.success ? 'bg-emerald-950/20 border-emerald-800' : 'bg-rose-950/20 border-rose-800'} space-y-4 animate-in fade-in zoom-in duration-300`}>
                    <div className="flex items-center gap-3">
                        {result.success ? (
                            <CheckCircle size={24} className="text-emerald-500" />
                        ) : (
                            <AlertTriangle size={24} className="text-rose-500" />
                        )}
                        <h2 className={`font-bold uppercase tracking-widest text-sm ${result.success ? 'text-emerald-500' : 'text-rose-500'}`}>
                            {result.success ? 'Sucesso' : 'Falha'}
                        </h2>
                    </div>
                    
                    <p className="text-slate-300 text-sm">
                        {result.message || result.error}
                    </p>

                    {result.details && (
                        <pre className="text-[10px] bg-black/40 p-4 border border-white/5 font-mono text-[#1D5F31]">
                            {JSON.stringify(result.details, null, 2)}
                        </pre>
                    )}
                </div>
            )}
        </div>
    )
}
