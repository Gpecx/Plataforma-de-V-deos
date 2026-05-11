import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { getLegalDocsSettings } from '@/app/admin/legal/actions'
import { notFound } from 'next/navigation'
import PrintButton from '@/components/legal/PrintButton'

export default async function RefundPolicy() {
    const settings = await getLegalDocsSettings()
    const content = settings.refund

    if (!content) {
        return notFound()
    }

    return (
        <div className="min-h-screen bg-white text-black font-montserrat animate-in fade-in duration-500 pb-20">
            {/* Header / Hero Section */}
            <header className="bg-white border-b border-slate-100 py-16">
                <div className="max-w-4xl mx-auto px-6">
                    <Link 
                        href="/dashboard-student" 
                        className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[3px] text-black hover:text-[#1D5F31] transition-colors mb-8"
                    >
                        <ArrowLeft size={14} /> Voltar
                    </Link>
                    
                    <h1 className="text-4xl md:text-5xl font-bold uppercase tracking-tighter mb-4 text-black leading-none">
                        Política de <span className="text-[#1D5F31]">Reembolso</span>
                    </h1>
                    <p className="text-black font-bold text-xs uppercase tracking-[4px] max-w-xl">
                        DIRETRIZES PARA SOLICITAÇÕES DE ESTORNO E CANCELAMENTO.
                    </p>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-6 py-12">
                <div className="space-y-12">
                    
                    {/* Conteúdo Dinâmico Renderizado */}
                    <article className="prose prose-slate max-w-none 
                        prose-headings:uppercase prose-headings:tracking-tighter prose-headings:font-bold 
                        prose-p:text-sm prose-p:leading-relaxed prose-p:text-black 
                        prose-strong:text-[#1D5F31]
                        prose-em:not-italic prose-i:not-italic
                        prose-li:text-sm prose-li:font-bold prose-li:uppercase prose-li:tracking-wide
                        prose-img:rounded-none prose-img:border prose-img:border-black"
                    >
                        <div dangerouslySetInnerHTML={{ __html: content }} />
                    </article>

                    <footer className="pt-12 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-black">
                            POLÍTICA OFICIAL POWERPLAY
                        </p>
                        <PrintButton />
                    </footer>
                </div>
            </main>
        </div>
    )
}
