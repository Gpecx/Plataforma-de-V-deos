"use client"

import { useState } from "react"
import { LegalDocsSettings, saveLegalDocsSettings, getLegalDocsDefaults } from "./actions"
import { Save, Loader2, CheckCircle2, ShieldAlert, FileText, Lock, RefreshCcw, RotateCcw } from "lucide-react"
import { toast } from "sonner"

export default function LegalDocsManagerClient({ initialData }: { initialData: LegalDocsSettings }) {
    const [docs, setDocs] = useState<LegalDocsSettings>(initialData)
    const [isSaving, setIsSaving] = useState<string | null>(null)
    const [saveSuccess, setSaveSuccess] = useState<string | null>(null)

    const handleSave = async (type: keyof LegalDocsSettings) => {
        setIsSaving(type)
        setSaveSuccess(null)
        
        const result = await saveLegalDocsSettings({
            [type]: docs[type]
        })

        if (result.success) {
            setSaveSuccess(type)
            toast.success("Documento atualizado com sucesso!")
            setTimeout(() => setSaveSuccess(null), 3000)
        } else {
            toast.error("Erro ao salvar documento")
        }
        setIsSaving(null)
    }

    const handleResetDefault = async (type: keyof LegalDocsSettings) => {
        if (!confirm(`Deseja realmente resetar o conteúdo de ${type} para o padrão oficial?`)) return
        
        const defaults = await getLegalDocsDefaults()
        const newDocs = { ...docs, [type]: defaults[type] }
        setDocs(newDocs)
        toast.info("Conteúdo resetado para o padrão. Não esqueça de salvar!")
    }

    const sections = [
        { id: 'terms', title: 'Termos de Uso', icon: <FileText size={18} /> },
        { id: 'privacy', title: 'Política de Privacidade', icon: <Lock size={18} /> },
        { id: 'refund', title: 'Política de Reembolso', icon: <RefreshCcw size={18} /> },
        { id: 'lgpd', title: 'Conformidade LGPD', icon: <ShieldAlert size={18} /> },
    ] as const

    return (
        <div className="admin-page p-8 max-w-6xl mx-auto animate-in fade-in duration-500">
            <div className="mb-12">
                <h1 className="text-4xl font-bold uppercase tracking-tighter text-black leading-none mb-4">
                    Gerenciar <span className="text-[#1D5F31]">Documentos Oficiais</span>
                </h1>
                <p className="text-black font-bold text-xs uppercase tracking-[4px]">
                    Configurações centrais de conformidade e termos legais.
                </p>
            </div>

            <div className="space-y-12">
                {sections.map((section) => (
                    <div key={section.id} className="border border-black p-8 bg-white relative overflow-hidden group">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="bg-black text-white p-2">
                                    {section.icon}
                                </div>
                                <h2 className="text-sm font-bold uppercase tracking-widest text-black">
                                    {section.title} <span className="text-slate-400 font-medium">(HTML)</span>
                                </h2>
                            </div>
                            
                            <div className="text-[10px] font-bold uppercase tracking-[2px] text-slate-400">
                                Identificador: settings/legal_docs.{section.id}
                            </div>
                        </div>

                        <div className="relative">
                            <textarea 
                                value={docs[section.id]}
                                onChange={(e) => setDocs({ ...docs, [section.id]: e.target.value })}
                                className="w-full h-80 p-6 font-mono text-xs border border-slate-200 focus:border-[#1D5F31] focus:ring-0 outline-none rounded-none bg-[#FAFAFA] text-black resize-y transition-colors italic-none"
                                style={{ fontStyle: 'normal' }}
                                placeholder={`Insira o conteúdo HTML para ${section.title}...`}
                            />
                        </div>

                        <div className="mt-6 flex justify-between items-center">
                            <button 
                                onClick={() => handleResetDefault(section.id)}
                                className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[2px] text-slate-400 hover:text-black transition-colors"
                            >
                                <RotateCcw size={14} /> Resetar para o Padrão
                            </button>

                            <button 
                                onClick={() => handleSave(section.id)}
                                disabled={!!isSaving}
                                className="flex items-center gap-3 bg-[#1D5F31] text-white px-10 py-4 text-[11px] font-bold uppercase tracking-[2px] hover:bg-black transition-all disabled:opacity-50 rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]"
                            >
                                {isSaving === section.id ? (
                                    <Loader2 size={16} className="animate-spin text-white" />
                                ) : saveSuccess === section.id ? (
                                    <CheckCircle2 size={16} className="text-white" />
                                ) : (
                                    <Save size={16} className="text-white" />
                                )}
                                <span className="text-white">
                                    {saveSuccess === section.id ? "Atualizado!" : isSaving === section.id ? "Salvando..." : `Atualizar ${section.title}`}
                                </span>
                            </button>
                        </div>

                        {/* Decorator Industrial */}
                        <div className="absolute right-0 top-0 opacity-[0.02] pointer-events-none translate-x-1/4 -translate-y-1/4">
                            {section.icon}
                        </div>
                    </div>
                ))}
            </div>

            <style dangerouslySetInnerHTML={{ __html: `
                .admin-page textarea, .admin-page h1, .admin-page h2, .admin-page p, .admin-page span, .admin-page button {
                    font-style: normal !important;
                }
            ` }} />
        </div>
    )
}
