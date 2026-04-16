"use client"

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    LayoutDashboard,
    Users,
    Settings,
    BarChart3,
    ShieldAlert,
    LogOut,
    ChevronRight,
    Loader2,
    BookOpen,
    GraduationCap
} from 'lucide-react'
import { cn } from '@/lib/utils'
import Logo from './Logo'
import { useState, useEffect } from 'react'
import { auth, db } from '@/lib/firebase'
import { onAuthStateChanged } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'

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
        title: 'Branding & Banners',
        icon: LayoutDashboard,
        href: '/admin/settings',
        description: 'Identidade e Marketing'
    },
    {
        title: 'Moderação de Conteúdo',
        icon: ShieldAlert,
        href: '/admin/approvals',
        description: 'Cursos e Aulas'
    },
    {
        title: 'Cursos',
        icon: BookOpen,
        href: '/admin/all-courses',
        description: 'Catálogo Global'
    },
]

export default function AdminSidebar() {
    const pathname = usePathname()
    const router = useRouter()
    const [isLoggingOut, setIsLoggingOut] = useState(false)
    const [userProfile, setUserProfile] = useState<{ role: string | null } | null>(null)

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                try {
                    const docRef = doc(db, 'profiles', user.uid)
                    const docSnap = await getDoc(docRef)
                    if (docSnap.exists()) {
                        setUserProfile(docSnap.data() as any)
                    }
                } catch (error) {
                    console.error("Erro ao buscar perfil:", error)
                }
            }
        })
        return () => unsubscribe()
    }, [])

    const handleExitPanel = () => {
        setIsLoggingOut(true)
        router.push('/dashboard-teacher')
    }

    return (
        <aside className="fixed left-0 top-0 h-screen w-72 bg-[#F8F9FA] border-r border-[#D1D7DC] flex flex-col z-50">
            <div className="p-8 border-b border-slate-200">
                <Logo href="/dashboard-teacher/courses" light />

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
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button
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
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-56 bg-white border border-slate-200 rounded-xl p-2 shadow-sm z-[200]">
                        {userProfile?.role === 'admin' && (
                            <>
                                <DropdownMenuItem 
                                    onSelect={() => router.push('/dashboard-student')}
                                    className="flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer hover:bg-green-50 hover:text-[#1D5F31] text-slate-700 transition-colors outline-none focus:bg-green-50 focus:text-[#1D5F31]"
                                >
                                    <GraduationCap size={18} className="text-[#1D5F31]" />
                                    <span className="text-[11px] font-bold uppercase tracking-widest leading-none">Modo Aluno</span>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator className="my-2 bg-slate-100" />
                            </>
                        )}
                        <DropdownMenuItem 
                            onSelect={handleExitPanel}
                            disabled={isLoggingOut}
                            className="flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer hover:bg-red-50 text-red-600 transition-colors outline-none focus:bg-red-50"
                        >
                            <LogOut size={18} />
                            <span className="text-[11px] font-bold uppercase tracking-widest leading-none">Sair do Painel</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </aside>
    )
}
