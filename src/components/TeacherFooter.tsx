import Link from 'next/link'
import { LayoutDashboard, BookOpen, Users, DollarSign, MessageSquare } from 'lucide-react'

export default function TeacherFooter() {
    return (
        <footer className="relative bg-[#F4F7F9] pt-20 pb-16 overflow-hidden border-t border-slate-100 font-exo">
            <div className="max-w-7xl mx-auto px-8 md:px-12 relative z-10 flex flex-col items-center space-y-10">
                {/* Logo Principal */}
                <Link href="/dashboard-teacher" className="hover:scale-105 transition-transform duration-500">
                    <span className="text-4xl font-black tracking-tighter uppercase text-slate-900 flex items-center gap-3">
                        SPCS <span className="text-[#00C402]">Academy</span>
                        <span className="text-[10px] bg-slate-900 text-white px-3 py-1 rounded-full font-black tracking-[2px] leading-none">TEACHER</span>
                    </span>
                </Link>

                {/* Navegação de Gestão */}
                <div className="flex flex-wrap justify-center gap-x-12 gap-y-8">
                    <Link href="/dashboard-teacher" className="flex flex-col items-center gap-2 group">
                        <div className="p-3 rounded-xl bg-white border border-slate-200 text-slate-400 group-hover:border-[#00C402]/40 group-hover:text-[#00C402] transition-all shadow-sm">
                            <LayoutDashboard size={18} />
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 group-hover:text-slate-900">Dashboard</span>
                    </Link>

                    <Link href="/dashboard-teacher/courses" className="flex flex-col items-center gap-2 group">
                        <div className="p-3 rounded-xl bg-white border border-slate-200 text-slate-400 group-hover:border-[#00C402]/40 group-hover:text-[#00C402] transition-all shadow-sm">
                            <BookOpen size={18} />
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 group-hover:text-slate-900">Meus Cursos</span>
                    </Link>

                    <Link href="/dashboard-teacher/students" className="flex flex-col items-center gap-2 group">
                        <div className="p-3 rounded-xl bg-white border border-slate-200 text-slate-400 group-hover:border-[#00C402]/40 group-hover:text-[#00C402] transition-all shadow-sm">
                            <Users size={18} />
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 group-hover:text-slate-900">Alunos</span>
                    </Link>

                    <Link href="/dashboard-teacher/chat" className="flex flex-col items-center gap-2 group">
                        <div className="p-3 rounded-xl bg-white border border-slate-200 text-slate-400 group-hover:border-[#00C402]/40 group-hover:text-[#00C402] transition-all shadow-sm">
                            <MessageSquare size={18} />
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 group-hover:text-slate-900">Mensagens</span>
                    </Link>

                    <Link href="/dashboard-teacher/analytics" className="flex flex-col items-center gap-2 group">
                        <div className="p-3 rounded-xl bg-white border border-slate-200 text-slate-400 group-hover:border-[#00C402]/40 group-hover:text-[#00C402] transition-all shadow-sm">
                            <DollarSign size={18} />
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 group-hover:text-slate-900">Financeiro</span>
                    </Link>
                </div>

                {/* Copyright Sutil */}
                <div className="pt-8 w-full border-t border-slate-100 text-center">
                    <p className="text-slate-400 text-[9px] font-medium uppercase tracking-[0.4em]">
                        © 2024 SPCS Academy - Área do Instrutor
                    </p>
                </div>
            </div>
        </footer>
    )
}
