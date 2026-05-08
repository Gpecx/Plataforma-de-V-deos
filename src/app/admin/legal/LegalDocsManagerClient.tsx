"use client"

import { useState, useEffect } from "react"
import { LegalDocsSettings, saveLegalDocsSettings, getLegalDocsDefaults } from "./actions"
import { Save, Loader2, CheckCircle2, ShieldAlert, FileText, Lock, RefreshCcw, RotateCcw, AlertTriangle } from "lucide-react"
import { toast } from "sonner"
import RichTextEditor from "@/components/ui/rich-text-editor"
import DOMPurify from 'isomorphic-dompurify'

export default function LegalDocsManagerClient({ initialData }: { initialData: LegalDocsSettings }) {
    const [docs, setDocs] = useState<LegalDocsSettings>(initialData)
    const [isSaving, setIsSaving] = useState<string | null>(null)
    const [saveSuccess, setSaveSuccess] = useState<string | null>(null)
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    const handleSave = async (type: keyof LegalDocsSettings) => {
        setIsSaving(type)
        setSaveSuccess(null)
        
        // Sanitização final antes de persistir no Firestore
        const sanitizedContent = DOMPurify.sanitize(docs[type])

        const result = await saveLegalDocsSettings({
            [type]: sanitizedContent
        })

        if (result.success) {
            setSaveSuccess(type)
            toast.success(`${type.toUpperCase()} atualizado com sucesso!`)
            setTimeout(() => setSaveSuccess(null), 3000)
        } else {
            toast.error("Erro ao salvar documento")
        }
        setIsSaving(null)
    }

    const handleResetDefault = async (type: keyof LegalDocsSettings) => {
        if (!confirm(`Deseja realmente resetar o conteúdo de ${type} para o padrão oficial?`)) return
        
        const defaults = await getLegalDocsDefaults()
        setDocs(prev => ({ ...prev, [type]: defaults[type] }))
        toast.info("Conteúdo resetado. Clique em atualizar para salvar permanentemente.")
    }

    const sections = [
        { id: 'terms', title: 'Termos de Uso', icon: <FileText size={20} />, color: '#1D5F31' },
        { id: 'privacy', title: 'Política de Privacidade', icon: <Lock size={20} />, color: '#1D5F31' },
        { id: 'refund', title: 'Política de Reembolso', icon: <RefreshCcw size={20} />, color: '#1D5F31' },
        { id: 'lgpd', title: 'Conformidade LGPD', icon: <ShieldAlert size={20} />, color: '#1D5F31' },
    ] as const

    if (!mounted) return null

    return (
        <div className="admin-page p-4 md:p-12 max-w-[1400px] mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header Padrão Admin */}
            <div className="mb-12 flex flex-col md:flex-row justify-between items-end gap-6">
                <div>
                    <h1 className="text-3xl md:text-4xl font-bold uppercase tracking-tighter text-black leading-none mb-4">
                        Gerenciar <span className="text-[#1D5F31]">Documentos Oficiais</span>
                    </h1>
                    <p className="text-black font-bold text-xs uppercase tracking-[4px]">
                        Configurações centrais de conformidade e termos legais.
                    </p>
                </div>
                <div className="flex flex-col items-end">
                    <p className="text-black font-bold text-[10px] uppercase tracking-[3px]">
                        Última Auditoria: {new Date().toLocaleDateString()}
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-20">
                {sections.map((section) => (
                    <div key={section.id} className="relative group">
                        {/* Indicador Lateral */}
                        <div className="absolute -left-4 top-0 bottom-0 w-1 bg-slate-100 group-hover:bg-[#1D5F31] transition-colors" />
                        
                        <div className="flex flex-col md:flex-row gap-8">
                            <div className="md:w-1/4">
                                <div className="sticky top-8">
                                    <div className="bg-black text-white p-4 inline-flex mb-6 rounded-xl shadow-[4px_4px_0px_0px_rgba(29,95,49,1)]">
                                        {section.icon}
                                    </div>
                                    <h2 className="text-2xl font-black uppercase tracking-tight text-black mb-2">
                                        {section.title}
                                    </h2>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[2px] leading-relaxed mb-6">
                                        Controle de texto legal para conformidade com a legislação brasileira.
                                    </p>
                                    
                                    <div className="flex flex-col gap-3">
                                        <button 
                                            onClick={() => handleSave(section.id)}
                                            disabled={!!isSaving}
                                            className="w-full flex items-center justify-center gap-3 bg-[#1D5F31] text-white px-6 py-4 text-[11px] font-black uppercase tracking-[2px] hover:bg-black transition-all disabled:opacity-50 rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-1 active:translate-y-1"
                                        >
                                            {isSaving === section.id ? (
                                                <Loader2 size={16} className="animate-spin" />
                                            ) : saveSuccess === section.id ? (
                                                <CheckCircle2 size={16} />
                                            ) : (
                                                <Save size={16} />
                                            )}
                                            {saveSuccess === section.id ? "Salvo!" : isSaving === section.id ? "Salvando..." : `Atualizar`}
                                        </button>

                                        <button 
                                            onClick={() => handleResetDefault(section.id)}
                                            className="w-full flex items-center justify-center gap-2 text-[9px] font-bold uppercase tracking-[2px] text-slate-400 hover:text-red-600 transition-colors py-2"
                                        >
                                            <RotateCcw size={12} /> Resetar Padrão
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="md:w-3/4">
                                <div className="relative">
                                    <div className="absolute -top-3 right-6 bg-white px-3 text-[9px] font-black uppercase tracking-[2px] text-slate-300 border border-slate-100 z-10">
                                        Editando: {section.id}.html
                                    </div>
                                    <RichTextEditor 
                                        value={docs[section.id]}
                                        onChange={(value) => setDocs(prev => ({ ...prev, [section.id]: value }))}
                                        placeholder={`Escreva os ${section.title} aqui...`}
                                    />
                                </div>
                                
                                <div className="mt-4 flex items-start gap-3 bg-slate-50 p-4 border border-slate-200 rounded-xl">
                                    <AlertTriangle size={14} className="text-slate-400 mt-0.5 shrink-0" />
                                    <p className="text-[10px] text-slate-500 leading-normal font-medium">
                                        As alterações neste documento refletem instantaneamente em toda a plataforma. 
                                        Recomendamos revisar cuidadosamente antes de clicar em "Atualizar".
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Footer de Auditoria */}
            <div className="mt-32 pt-12 border-t border-black flex flex-col md:flex-row justify-between items-center gap-8 text-slate-400">
                <div className="flex items-center gap-6">
                    <span className="text-[10px] font-black uppercase tracking-[4px]">PwrPlay v4.0</span>
                    <span className="text-[10px] font-black uppercase tracking-[4px]">Auth: Admin_Encrypted</span>
                </div>
                <div className="flex gap-4">
                    <div className="w-8 h-8 border border-slate-200 rounded-lg" />
                    <div className="w-8 h-8 border border-slate-200 bg-slate-50 rounded-lg" />
                    <div className="w-8 h-8 border border-slate-200 bg-slate-100 rounded-lg" />
                </div>
            </div>

            <style dangerouslySetInnerHTML={{ __html: `
                .admin-page {
                    font-family: 'Inter', sans-serif;
                }
                .admin-page * {
                    font-style: normal !important;
                }
                ::selection {
                    background: #1D5F31;
                    color: white;
                }
            ` }} />
        </div>
    )
}
