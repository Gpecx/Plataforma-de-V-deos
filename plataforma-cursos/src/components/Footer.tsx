import Link from 'next/link'

export default function Footer() {
    return (
        <footer className="relative bg-[#F4F7F9] pt-24 pb-20 overflow-hidden border-t border-slate-100 font-exo">
            <div className="max-w-7xl mx-auto px-8 md:px-12 relative z-10 flex flex-col items-center space-y-12">
                {/* Logo Principal (Aumentada) */}
                <Link href="/" className="hover:scale-105 transition-transform duration-500">
                    <img
                        src="/images/SPCS academy 2.png"
                        alt="SPCS Academy"
                        className="h-32 md:h-48 w-auto grayscale-0 opacity-100 hover:opacity-90 transition-all duration-300 object-contain"
                    />
                </Link>

                {/* Navegação Minimalista */}
                <div className="flex flex-wrap justify-center gap-x-16 gap-y-6 text-[12px] font-black uppercase tracking-widest text-[#1A1A1A]">
                    <Link href="/" className="hover:text-[#00C402] transition-colors duration-300">Início</Link>
                    <Link href="/course" className="hover:text-[#00C402] transition-colors duration-300">Cursos</Link>
                    <Link href="/dashboard-student" className="hover:text-[#00C402] transition-colors duration-300">Painel</Link>
                    <Link href="/cart" className="hover:text-[#00C402] transition-colors duration-300">Carrinho</Link>
                </div>

                {/* Copyright Sutil */}
                <div className="pt-10 w-full border-t border-slate-200/50 text-center">
                    <p className="text-slate-600 text-[10px] font-bold uppercase tracking-[0.5em]">
                        © 2024 SPCS Academy - Excelência em Tecnologia
                    </p>
                </div>
            </div>
        </footer>
    )
}
