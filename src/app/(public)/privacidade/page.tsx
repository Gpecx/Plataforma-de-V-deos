import { getPublicLegalDocsSettings } from "@/app/admin/legal/actions"

export default async function PrivacidadePage() {
    const settings = await getPublicLegalDocsSettings()
    const content = settings.privacy
    
    if (!content) {
        return (
            <div className="space-y-12">
                <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">PowerPlay Cursos</p>
                    <h1 className="text-3xl md:text-5xl font-bold uppercase text-[#1a1a1a] tracking-tighter mb-4">Política de Privacidade</h1>
                    <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">EM BREVE - CONTEÚDO SENDO ATUALIZADO</p>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div 
                className="prose prose-slate max-w-none prose-p:text-slate-700 prose-headings:text-black prose-strong:text-black prose-em:not-italic prose-i:not-italic" 
                style={{ fontStyle: 'normal' }}
                dangerouslySetInnerHTML={{ __html: content }} 
            />
        </div>
    )
}
