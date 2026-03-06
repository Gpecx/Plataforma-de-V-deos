import Link from 'next/link'

export default function Footer() {
    return (
        <footer className="relative bg-white pt-20 pb-16 overflow-hidden border-t border-slate-100 font-exo">
            <div className="max-w-7xl mx-auto px-8 md:px-12 relative z-10 flex flex-col items-center space-y-8">
                {/* Logo Principal (Aumentada) */}
                <Link href="/" className="hover:scale-105 transition-transform duration-500">
                    <img
                        src="/images/SPCS Academy.png"
                        alt="SPCS Academy"
                        className="h-24 md:h-32 w-auto grayscale-0 opacity-100 hover:opacity-90 transition-all duration-300"
                    />
                </Link>

                {/* Navegação Minimalista */}
                <div className="flex flex-wrap justify-center gap-x-12 gap-y-4 text-[11px] font-bold uppercase tracking-widest text-slate-500">
                    <Link href="/" className="hover:text-[#00C402] transition-colors">Início</Link>
                    <Link href="/course" className="hover:text-[#00C402] transition-colors">Cursos</Link>
                    <Link href="/dashboard-student" className="hover:text-[#00C402] transition-colors">Painel</Link>
                    <Link href="/cart" className="hover:text-[#00C402] transition-colors">Carrinho</Link>
                </div>

                {/* Copyright Sutil */}
                <div className="pt-8 w-full border-t border-slate-100 text-center">
                    <p className="text-slate-400 text-[9px] font-medium uppercase tracking-[0.4em]">
                        © 2024 SPCS Academy - Excelência em Tecnologia
                    </p>
                </div>
            </div>
        </footer>
    )
}
