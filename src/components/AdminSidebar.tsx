"use client"

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
    LayoutDashboard,
    Users,
    Settings,
    BarChart3,
    ShieldAlert,
    Clapperboard,
    LogOut,
    ChevronRight,
    Loader2,
    BookOpen,
    Terminal,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import Logo from './Logo'
import { useState } from 'react'
import { auth } from '@/lib/firebase'
import { signOut } from 'firebase/auth'
import { removeSessionCookie } from '@/app/actions/auth'

interface MenuItem {
    title: string;
    icon: any;
    href: string;
    description: string;
}

const menuItems: MenuItem[] = [
    {
        title: 'Dashboard Financeiro',
        icon: BarChart3,
        href: '/admin/dashboard',
        description: 'Métricas e Lucros'
    },
    {
        title: 'Gestão de Repasses',
        icon: Settings,
        href: '/admin/financial',
        description: 'Taxas e Planos'
    },
    {
        title: 'Gestão de Professores',
        icon: Users,
        href: '/admin/teachers',
        description: 'Filtro por Professor'
    },
    {
        title: 'Gestão de Alunos',
        icon: Users,
        href: '/admin/students',
        description: 'Métricas e Acessos'
    },
    {
        title: 'Gestão Admin',
        icon: ShieldAlert,
        href: '/admin/management',
        description: 'Operadores e Segurança'
    },
    {
        title: 'Branding & Banners',
        icon: LayoutDashboard,
        href: '/admin/settings',
        description: 'Identidade e Marketing'
    },
    {
        title: 'Moderação de Conteúdo',
        icon: Clapperboard,
        href: '/admin/approvals',
        description: 'Cursos e Aulas'
    },
    {
        title: 'Cursos',
        icon: BookOpen,
        href: '/admin/all-courses',
        description: 'Catálogo Global'
    },
    {
        title: 'Documentos Legais',
        icon: ShieldAlert,
        href: '/admin/legal',
        description: 'LGPD, Termos e Políticas'
    },
    {
        title: 'Modo Desenvolvedor',
        icon: Terminal,
        href: '/admin/dev-mode',
        description: 'Monitoramento de Telas'
    },
]

export default function AdminSidebar() {
    const pathname = usePathname()
    const router = useRouter()
    const [isLoggingOut, setIsLoggingOut] = useState(false)

    const handleExitPanel = async () => {
        setIsLoggingOut(true)
        try {
            await signOut(auth)
            await removeSessionCookie()
            router.push('/')
            router.refresh()
        } catch (error) {
            console.error("Erro ao sair:", error)
            setIsLoggingOut(false)
        }
    }

    return (
        <aside className="fixed left-0 top-0 h-screen w-72 bg-[#F8F9FA] border-r border-[#D1D7DC] flex flex-col z-50">
            <div className="p-8 border-b border-slate-200">
                <Logo href={null} light />

            </div>

            <nav className="flex-grow py-8 px-4 space-y-2 overflow-y-auto custom-scrollbar">
                {menuItems.map((item) => {
                    const isActive = pathname === item.href
                    return (
                        <Link
                            key={item.href}
                            href={item.href as any}
                            className={cn(
                                "group flex items-center gap-4 p-4 transition-all duration-300 relative",
                                isActive
                                    ? "text-[#1D5F31] bg-green-100"
                                    : "text-slate-700 hover:!text-[#1D5F31] font-medium hover:bg-green-100 hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)] hover:rounded-xl"
                            )}
                        >
                            <item.icon
                                size={20}
                                className={cn(
                                    "transition-colors duration-300",
                                    isActive ? "text-[#1D5F31]" : "text-slate-700 group-hover:text-[#1D5F31]"
                                )}
                            />
                            <div className="flex flex-col">
                                <span className={cn(
                                    "text-xs font-bold uppercase tracking-widest",
                                    isActive ? "text-[#1D5F31]" : "!text-[#000000] group-hover:text-[#1D5F31]"
                                )}>
                                    {item.title}
                                </span>
                                <span className={cn(
                                    "text-[9px] uppercase font-bold tracking-tighter mt-0.5",
                                    isActive ? "text-[#1D5F31]" : "!text-[#334155] group-hover:text-[#1D5F31]"
                                )}>
                                    {item.description}
                                </span>
                            </div>
                            <ChevronRight
                                size={14}
                                className={cn(
                                    "ml-auto transition-transform duration-300",
                                    isActive ? "text-[#1D5F31] translate-x-0" : "text-slate-400 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0"
                                )}
                            />
                        </Link>
                    )
                })}
            </nav>

            <div className="p-8 border-t border-slate-200">
                <button
                    onClick={handleExitPanel}
                    disabled={isLoggingOut}
                    className="flex items-center gap-3 !text-[#000000] hover:!text-[#1D5F31] transition-colors uppercase font-bold text-[10px] tracking-widest group disabled:opacity-50 w-full"
                >
                    {isLoggingOut ? (
                        <Loader2 className="animate-spin" size={16} />
                    ) : (
                        <LogOut size={16} />
                    )}
                    <span>{isLoggingOut ? "Redirecionando..." : "Sair do Painel"}</span>
                </button>
            </div>
        </aside>
    )
}
