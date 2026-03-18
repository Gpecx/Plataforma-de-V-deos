"use client"

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { 
    LayoutDashboard, 
    Users, 
    Settings, 
    BarChart3, 
    ShieldAlert, 
    LogOut,
    ChevronRight,
    Loader2
} from 'lucide-react'
import { cn } from '@/lib/utils'
import Logo from './Logo'
import { useState } from 'react'

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
        title: 'Branding & Marketing',
        icon: LayoutDashboard,
        href: '/admin/settings',
        description: 'Banners e Logos'
    },
    {
        title: 'Auditoria de Vendas',
        icon: ShieldAlert,
        href: '/admin/audit',
        description: 'Logs Financeiros'
    },
]

export default function AdminSidebar() {
    const pathname = usePathname()
    const router = useRouter()
    const [isLoggingOut, setIsLoggingOut] = useState(false)

    const handleExitPanel = () => {
        setIsLoggingOut(true)
        router.push('/dashboard-teacher')
    }

    return (
        <aside className="fixed left-0 top-0 h-screen w-72 bg-[#061629]/80 backdrop-blur-xl border-r border-[#1D5F31]/30 flex flex-col z-50">
            <div className="p-8 border-b border-[#1D5F31]/20">
                <Logo />
                <div className="mt-4 flex items-center gap-2">
                    <div className="w-2 h-2 bg-[#1D5F31] animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-[4px] text-slate-400">Admin Panel</span>
                </div>
            </div>

            <nav className="flex-grow py-8 px-4 space-y-2 overflow-y-auto custom-scrollbar">
                {menuItems.map((item) => {
                    const isActive = pathname === item.href
                    return (
                        <Link 
                            key={item.href} 
                            href={item.href}
                            className={cn(
                                "group flex items-center gap-4 p-4 text-white transition-all duration-300 relative overflow-hidden",
                                isActive ? "bg-[#1D5F31]/20 border-l-4 border-[#1D5F31]" : "hover:bg-[#1D5F31]/10 border-l-4 border-transparent"
                            )}
                        >
                            <item.icon 
                                size={20} 
                                className={cn(
                                    "transition-colors duration-300",
                                    isActive ? "text-[#1D5F31]" : "text-slate-500 group-hover:text-white"
                                )} 
                            />
                            <div className="flex flex-col">
                                <span className={cn(
                                    "text-xs font-black uppercase tracking-widest",
                                    isActive ? "text-white" : "text-slate-400 group-hover:text-white"
                                )}>
                                    {item.title}
                                </span>
                                <span className="text-[9px] text-slate-600 uppercase font-bold tracking-tighter mt-0.5">
                                    {item.description}
                                </span>
                            </div>
                            <ChevronRight 
                                size={14} 
                                className={cn(
                                    "ml-auto transition-transform duration-300",
                                    isActive ? "text-[#1D5F31] translate-x-0" : "text-slate-700 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0"
                                )} 
                            />
                        </Link>
                    )
                })}
            </nav>

            <div className="p-8 border-t border-[#1D5F31]/20">
                <button 
                    onClick={handleExitPanel}
                    disabled={isLoggingOut}
                    className="flex items-center gap-3 text-slate-500 hover:text-red-500 transition-colors uppercase font-black text-[10px] tracking-widest group disabled:opacity-50"
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
