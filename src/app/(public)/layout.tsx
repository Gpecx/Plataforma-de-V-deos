import type { Metadata } from 'next'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Páginas Legais | PowerPlay',
}

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-white text-slate-900 font-montserrat flex flex-col theme-clean-white">
      <header className="w-full bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-6 py-6 flex items-center">
          <Link href="/" className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#1D5F31] hover:text-[#28b828] transition-colors group">
            <div className="p-1.5 border border-transparent rounded-none group-hover:border-[#1D5F31] transition-colors">
              <ArrowLeft size={16} />
            </div>
            Voltar à Plataforma
          </Link>
        </div>
      </header>
      <main className="flex-1 w-full max-w-4xl mx-auto px-6 py-12 md:py-20 lg:py-24">
        {children}
      </main>
      <footer className="w-full border-t border-slate-100 bg-slate-50 mt-auto">
         <div className="max-w-4xl mx-auto px-6 py-8 text-center">
             <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">© {new Date().getFullYear()} POWERPLAY. TODOS OS DIREITOS RESERVADOS.</p>
         </div>
      </footer>
    </div>
  )
}
