import Link from 'next/link'
import { LayoutDashboard, BookOpen, Users, DollarSign, MessageSquare } from 'lucide-react'
import Logo from '@/components/Logo'

export default function TeacherFooter() {
    return (
        <footer className="relative pt-24 pb-20 overflow-hidden font-exo z-[10]" style={{ backgroundColor: 'transparent' }}>
            <div className="max-w-7xl mx-auto px-8 md:px-12 relative z-10 flex flex-col items-center space-y-12">
                {/* Logo Principal */}
                <div className="hover:scale-105 transition-transform duration-500">
                    <Logo className="h-24 w-auto" href="/dashboard-teacher" />
                </div>

                {/* Navegação de Gestão */}
                <div className="flex flex-wrap justify-center gap-x-12 gap-y-8">
                    <Link href="/dashboard-teacher" className="flex flex-col items-center gap-2 group">
                        <span className="text-[10px] font-black uppercase tracking-widest text-[#061629] group-hover:text-[#1D5F31]">Dashboard</span>
                    </Link>

                    <Link href="/dashboard-teacher/courses" className="flex flex-col items-center gap-2 group">
                        <span className="text-[10px] font-black uppercase tracking-widest text-[#061629] group-hover:text-[#1D5F31]">Meus Cursos</span>
                    </Link>

                    <Link href="/dashboard-teacher/students" className="flex flex-col items-center gap-2 group">
                        <span className="text-[10px] font-black uppercase tracking-widest text-[#061629] group-hover:text-[#1D5F31]">Alunos</span>
                    </Link>

                    <Link href="/dashboard-teacher/chat" className="flex flex-col items-center gap-2 group">
                        <span className="text-[10px] font-black uppercase tracking-widest text-[#061629] group-hover:text-[#1D5F31]">Mensagens</span>
                    </Link>

                    <Link href="/dashboard-teacher/analytics" className="flex flex-col items-center gap-2 group">
                        <span className="text-[10px] font-black uppercase tracking-widest text-[#061629] group-hover:text-[#1D5F31]">Financeiro</span>
                    </Link>
                </div>

                {/* Copyright Sutil */}
                <div className="pt-8 w-full text-center">
                    <p className="text-[#061629]/50 text-[9px] font-black uppercase tracking-[0.4em]">
                        © 2026 PowerPlay - Área do Instrutor
                    </p>
                </div>
            </div>
        </footer>
    )
}
