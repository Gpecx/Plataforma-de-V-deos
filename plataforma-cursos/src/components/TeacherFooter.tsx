import Link from 'next/link'
import { LayoutDashboard, BookOpen, Users, DollarSign, MessageSquare } from 'lucide-react'

export default function TeacherFooter() {
    return (
        <footer className="relative bg-[#F4F7F9] pt-24 pb-20 overflow-hidden border-t border-slate-100 font-exo">
            <div className="max-w-7xl mx-auto px-8 md:px-12 relative z-10 flex flex-col items-center space-y-12">
                {/* Logo Principal (Aumentada) */}
                <Link href="/dashboard-teacher" className="hover:scale-105 transition-transform duration-500">
                    <img
                        src="/images/SPCS academy 2.png"
                        alt="SPCS Academy"
                        className="h-24 md:h-36 w-auto grayscale-0 opacity-100 hover:opacity-90 transition-all duration-300 object-contain"
                    />
                </Link>

                {/* Navegação de Gestão */}
                <div className="flex flex-wrap justify-center gap-x-12 gap-y-8">
                    <Link href="/dashboard-teacher" className="flex flex-col items-center gap-2 group">
                        <div className="p-3 rounded-xl bg-white border-2 border-slate-100 text-black group-hover:border-[#00C402] group-hover:text-[#00C402] transition-all shadow-sm">
                            <LayoutDashboard size={18} />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-black group-hover:text-[#00C402]">Dashboard</span>
                    </Link>

                    <Link href="/dashboard-teacher/courses" className="flex flex-col items-center gap-2 group">
                        <div className="p-3 rounded-xl bg-white border-2 border-slate-100 text-black group-hover:border-[#00C402] group-hover:text-[#00C402] transition-all shadow-sm">
                            <BookOpen size={18} />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-black group-hover:text-[#00C402]">Meus Cursos</span>
                    </Link>

                    <Link href="/dashboard-teacher/students" className="flex flex-col items-center gap-2 group">
                        <div className="p-3 rounded-xl bg-white border-2 border-slate-100 text-black group-hover:border-[#00C402] group-hover:text-[#00C402] transition-all shadow-sm">
                            <Users size={18} />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-black group-hover:text-[#00C402]">Alunos</span>
                    </Link>

                    <Link href="/dashboard-teacher/chat" className="flex flex-col items-center gap-2 group">
                        <div className="p-3 rounded-xl bg-white border-2 border-slate-100 text-black group-hover:border-[#00C402] group-hover:text-[#00C402] transition-all shadow-sm">
                            <MessageSquare size={18} />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-black group-hover:text-[#00C402]">Mensagens</span>
                    </Link>

                    <Link href="/dashboard-teacher/analytics" className="flex flex-col items-center gap-2 group">
                        <div className="p-3 rounded-xl bg-white border-2 border-slate-100 text-black group-hover:border-[#00C402] group-hover:text-[#00C402] transition-all shadow-sm">
                            <DollarSign size={18} />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-black group-hover:text-[#00C402]">Financeiro</span>
                    </Link>
                </div>

                {/* Copyright Sutil */}
                <div className="pt-8 w-full border-t border-slate-100 text-center">
                    <p className="text-black text-[9px] font-black uppercase tracking-[0.4em]">
                        © 2024 SPCS Academy - Área do Instrutor
                    </p>
                </div>
            </div>
        </footer>
    )
}
