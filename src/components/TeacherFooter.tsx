import Link from 'next/link'
import { LayoutDashboard, BookOpen, Users, DollarSign } from 'lucide-react'

export default function TeacherFooter() {
    return (
        <footer className="relative bg-[#061629] pt-12 pb-8 overflow-hidden">
            {/* Linha de brilho Neon no topo para indicar Modo Professor */}
            <div className="absolute top-0 left-0 w-full h-[2px] bg-[#00FF00] shadow-[0_0_15px_rgba(0,255,0,0.5)]"></div>

            <div className="max-w-7xl mx-auto px-8 md:px-12 relative z-10 flex flex-col items-center space-y-8">
                {/* Logo Principal */}
                <Link href="/dashboard-teacher" className="hover:scale-105 transition-transform duration-500">
                    <span className="text-2xl font-black italic tracking-tighter uppercase text-white">
                        CURSOS <span className="text-[#00FF00]">EXS</span> <span className="text-[10px] bg-[#00FF00] text-black px-2 py-0.5 rounded ml-2 not-italic tracking-normal">PAINEL</span>
                    </span>
                </Link>

                {/* Navegação de Gestão */}
                <div className="flex flex-wrap justify-center gap-x-12 gap-y-6">
                    <Link href="/dashboard-teacher" className="flex flex-col items-center gap-2 group">
                        <div className="p-3 rounded-full bg-white/5 text-gray-400 group-hover:bg-[#00FF00] group-hover:text-black transition-all">
                            <LayoutDashboard size={20} />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 group-hover:text-[#00FF00]">Início</span>
                    </Link>

                    <Link href="/dashboard-teacher/courses" className="flex flex-col items-center gap-2 group">
                        <div className="p-3 rounded-full bg-white/5 text-gray-400 group-hover:bg-[#00FF00] group-hover:text-black transition-all">
                            <BookOpen size={20} />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 group-hover:text-[#00FF00]">Meus Cursos</span>
                    </Link>

                    <Link href="/dashboard-teacher/students" className="flex flex-col items-center gap-2 group">
                        <div className="p-3 rounded-full bg-white/5 text-gray-400 group-hover:bg-[#00FF00] group-hover:text-black transition-all">
                            <Users size={20} />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 group-hover:text-[#00FF00]">Alunos</span>
                    </Link>

                    <Link href="/dashboard-teacher/analytics" className="flex flex-col items-center gap-2 group">
                        <div className="p-3 rounded-full bg-white/5 text-gray-400 group-hover:bg-[#00FF00] group-hover:text-black transition-all">
                            <DollarSign size={20} />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 group-hover:text-[#00FF00]">Financeiro</span>
                    </Link>
                </div>

                {/* Copyright Sutil */}
                <div className="pt-8 w-full border-t border-white/5 text-center">
                    <p className="text-gray-600 text-[8px] font-bold uppercase tracking-[0.3em]">
                        © 2024 EXS Solutions - Área do Instrutor
                    </p>
                </div>
            </div>
        </footer>
    )
}
