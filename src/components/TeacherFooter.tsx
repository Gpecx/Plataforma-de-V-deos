import Link from 'next/link'
import { LayoutDashboard, BookOpen, Users, DollarSign, MessageSquare } from 'lucide-react'
import Logo from '@/components/Logo'

export default function TeacherFooter() {
    return (
        <footer className="relative pt-24 pb-20 overflow-hidden font-exo z-[10]" style={{ backgroundColor: '#0d2b17' }}>
            <div className="max-w-7xl mx-auto px-8 md:px-12 relative z-10 flex flex-col items-center space-y-12">
                {/* Logo Principal */}
                <div className="hover:scale-105 transition-transform duration-500">
                    <Logo className="h-14 md:h-20 w-auto" href="/dashboard-teacher" />
                </div>

                {/* Navegação de Gestão */}
                <div className="flex flex-wrap justify-center gap-x-12 gap-y-8">
                    <Link href="/dashboard-teacher" className="flex flex-col items-center gap-2 group">
                        <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-white/70 group-hover:border-[#00C402] group-hover:text-[#00C402] group-hover:bg-white/10 transition-all shadow-sm">
                            <LayoutDashboard size={18} />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-white/70 group-hover:text-[#00C402]">Dashboard</span>
                    </Link>

                    <Link href="/dashboard-teacher/courses" className="flex flex-col items-center gap-2 group">
                        <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-white/70 group-hover:border-[#00C402] group-hover:text-[#00C402] group-hover:bg-white/10 transition-all shadow-sm">
                            <BookOpen size={18} />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-white/70 group-hover:text-[#00C402]">Meus Cursos</span>
                    </Link>

                    <Link href="/dashboard-teacher/students" className="flex flex-col items-center gap-2 group">
                        <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-white/70 group-hover:border-[#00C402] group-hover:text-[#00C402] group-hover:bg-white/10 transition-all shadow-sm">
                            <Users size={18} />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-white/70 group-hover:text-[#00C402]">Alunos</span>
                    </Link>

                    <Link href="/dashboard-teacher/chat" className="flex flex-col items-center gap-2 group">
                        <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-white/70 group-hover:border-[#00C402] group-hover:text-[#00C402] group-hover:bg-white/10 transition-all shadow-sm">
                            <MessageSquare size={18} />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-white/70 group-hover:text-[#00C402]">Mensagens</span>
                    </Link>

                    <Link href="/dashboard-teacher/analytics" className="flex flex-col items-center gap-2 group">
                        <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-white/70 group-hover:border-[#00C402] group-hover:text-[#00C402] group-hover:bg-white/10 transition-all shadow-sm">
                            <DollarSign size={18} />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-white/70 group-hover:text-[#00C402]">Financeiro</span>
                    </Link>
                </div>

                {/* Copyright Sutil */}
                <div className="pt-8 w-full text-center">
                    <p className="text-white/40 text-[9px] font-black uppercase tracking-[0.4em]">
                        © 2026 PowerPlay - Área do Instrutor
                    </p>
                </div>
            </div>
        </footer>
    )
}
