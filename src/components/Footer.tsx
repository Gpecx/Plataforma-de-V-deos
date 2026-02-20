import Link from 'next/link'

export default function Footer() {
    return (
        <footer className="relative bg-[#061629] pt-12 pb-8 overflow-hidden">
            {/* Linha de brilho sutil no topo */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-px bg-gradient-to-r from-transparent via-[#00C402]/30 to-transparent"></div>

            <div className="max-w-7xl mx-auto px-8 md:px-12 relative z-10 flex flex-col items-center space-y-6">
                {/* Logo Principal (Aumentada) */}
                <Link href="/" className="hover:scale-105 transition-transform duration-500">
                    <img
                        src="/images/logo1.png"
                        alt="EXS Solutions"
                        className="h-24 md:h-28 w-auto brightness-125 drop-shadow-[0_0_30px_rgba(0,196,2,0.2)]"
                    />
                </Link>

                {/* Navegação Minimalista */}
                <div className="flex flex-wrap justify-center gap-x-10 gap-y-3 text-[10px] font-black uppercase italic tracking-widest text-gray-500">
                    <Link href="/" className="hover:text-[#00C402] transition-colors">Início</Link>
                    <Link href="/course" className="hover:text-[#00C402] transition-colors">Cursos</Link>
                    <Link href="/dashboard-student" className="hover:text-[#00C402] transition-colors">Painel</Link>
                    <Link href="/cart" className="hover:text-[#00C402] transition-colors">Carrinho</Link>
                </div>

                {/* Copyright Sutil */}
                <div className="pt-6 w-full border-t border-white/5 text-center">
                    <p className="text-gray-600 text-[8px] font-bold uppercase tracking-[0.3em]">
                        © 2024 EXS Solutions - Excelência em Tecnologia
                    </p>
                </div>
            </div>
        </footer>
    )
}
