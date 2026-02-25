"use client"

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import {
    Search,
    User,
    Settings,
    ShoppingCart,
    LogOut,
    GraduationCap,
    X,
    Award,
    CreditCard,
    Zap,
    History,
    HelpCircle,
    MessageSquare,
    Users,
    UserCog,
    TrendingUp,
    BookOpen
} from 'lucide-react'
import { signOut } from '@/app/dashboard-student/actions'
import { useCartStore } from '@/store/useCartStore'
import { NotificationBell } from '@/components/NotificationBell'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export default function Navbar() {
    const pathname = usePathname()
    const router = useRouter()
    const supabase = createClient()
    const [userProfile, setUserProfile] = useState<{ full_name: string | null, role: string | null, created_at: string | null } | null>(null)
    const [isLoggedIn, setIsLoggedIn] = useState(false)
    const { items } = useCartStore()
    const [mounted, setMounted] = useState(false)
    const [isSearchOpen, setIsSearchOpen] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')

    useEffect(() => {
        setMounted(true)
        async function getProfile() {
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                setIsLoggedIn(true)
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('role, full_name, created_at')
                    .eq('id', user.id)
                    .single()
                setUserProfile(profile)
            } else {
                setIsLoggedIn(false)
            }
        }
        getProfile()
    }, [])

    const formatDate = (dateString: string | null) => {
        if (!dateString) return ''
        const date = new Date(dateString)
        return new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' }).format(date)
    }

    // Identifica se estamos na área do professor
    const isTeacherMode = pathname.startsWith('/dashboard-teacher') ||
        pathname.startsWith('/instructor') ||
        pathname.startsWith('/painel-professor')

    return (
        <>
            <header className="relative w-full bg-white shadow-sm border-b border-slate-100 transition-all duration-300 pointer-events-auto">
                <nav className={`flex items-center justify-between px-8 md:px-12 py-4 text-slate-800 font-exo`}>
                    <div className="flex items-center gap-10">
                        <Link href={isTeacherMode ? "/dashboard-teacher" : "/dashboard-student"} className="flex items-center outline-none hover:opacity-80 transition-opacity">
                            <img
                                src="/images/SPCS academy 2.png"
                                alt="SPCS Academy"
                                className="h-16 md:h-20 w-auto"
                            />
                            {isTeacherMode && (
                                <span className="ml-3 text-[8px] bg-slate-900 text-white px-2 py-0.5 rounded font-black tracking-widest uppercase">Painel</span>
                            )}
                        </Link>

                        <div className="hidden md:flex gap-6 text-base font-medium text-slate-500">
                            {!isTeacherMode ? (
                                <>
                                    <Link href="/" className="hover:text-slate-900 transition">Início</Link>
                                    <Link href="/course" className="hover:text-slate-900 transition">Cursos</Link>
                                    <Link href="/dashboard-student" className="hover:text-slate-900 transition">Minha Lista</Link>
                                    {isLoggedIn && <Link href="/dashboard-student/chat" className="hover:text-slate-900 transition">Chat</Link>}
                                </>
                            ) : (
                                <>
                                    <Link href="/dashboard-teacher" className="hover:text-slate-900 transition">Dashboard</Link>
                                    <Link href="/dashboard-teacher/courses" className="hover:text-slate-900 transition">Meus Cursos</Link>
                                    <Link href="/dashboard-teacher/analytics" className="hover:text-slate-900 transition">Desempenho</Link>
                                </>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-6 justify-end">
                        {isTeacherMode ? (
                            <Link
                                href="/"
                                className="hidden md:flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-600 border border-slate-200 px-3 py-1.5 rounded-lg hover:bg-slate-50 transition-all outline-none"
                            >
                                <GraduationCap size={14} />
                                Alternar para Aluno
                            </Link>
                        ) : userProfile?.role === 'teacher' && (
                            <Link
                                href="/dashboard-teacher"
                                className="hidden md:flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-600 border border-slate-200 px-3 py-1.5 rounded-lg hover:bg-slate-50 transition-all outline-none"
                            >
                                Modo Professor
                            </Link>
                        )}

                        <div className="flex items-center gap-2 relative">
                            <div className={`flex items-center bg-slate-50 border border-slate-100 rounded-xl px-3 py-1.5 transition-all duration-300 ${isSearchOpen ? 'w-48 md:w-64 opacity-100' : 'w-0 opacity-0 pointer-events-none border-none'}`}>
                                <Search size={16} className="text-slate-400 mr-2" />
                                <input
                                    type="text"
                                    placeholder="Buscar cursos..."
                                    className="bg-transparent border-none outline-none text-[10px] font-bold uppercase tracking-widest w-full placeholder:text-slate-400 text-slate-700"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            router.push(`/course?s=${searchQuery}`)
                                            setIsSearchOpen(false)
                                        }
                                    }}
                                />
                            </div>
                            <button
                                onClick={() => setIsSearchOpen(!isSearchOpen)}
                                className={`text-slate-500 hover:text-slate-900 transition cursor-pointer outline-none ${isSearchOpen ? 'text-slate-900' : ''}`}
                            >
                                {isSearchOpen ? <X size={20} /> : <Search size={20} />}
                            </button>
                        </div>

                        {isLoggedIn && (
                            <NotificationBell
                                accent={isTeacherMode ? '#0f172a' : '#00C402'}
                                isTeacher={isTeacherMode}
                            />
                        )}

                        {isLoggedIn && !isTeacherMode && (
                            <Link href="/cart" className="text-slate-500 hover:text-slate-900 transition cursor-pointer outline-none relative">
                                <ShoppingCart size={20} />
                                {mounted && items.length > 0 && (
                                    <span className="absolute -top-1 -right-1.5 w-4 h-4 rounded-full bg-[#00C402] text-white text-[9px] font-black flex items-center justify-center border-2 border-white">
                                        {items.length}
                                    </span>
                                )}
                            </Link>
                        )}

                        {!isLoggedIn && (
                            <div className="hidden md:flex items-center gap-4">
                                <Link href="/contact" className="text-slate-500 hover:text-slate-900 transition text-xs font-black uppercase tracking-widest">
                                    Contato
                                </Link>
                                <Link href="/login">
                                    <button className="text-[10px] font-black uppercase tracking-widest text-slate-700 border border-slate-200 px-4 py-2 rounded-lg hover:bg-slate-50 transition-all outline-none">
                                        Login
                                    </button>
                                </Link>
                                <Link href="/register">
                                    <button className="text-[10px] font-black uppercase tracking-widest bg-slate-900 text-white px-4 py-2 rounded-lg hover:bg-slate-800 transition-all outline-none">
                                        Inscreva-se
                                    </button>
                                </Link>
                            </div>
                        )}

                        {isLoggedIn ? (
                            <div className="relative">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold transition-all cursor-pointer border-2 border-slate-100 outline-none hover:scale-105 bg-slate-900 shadow-sm overflow-hidden`}>
                                            <User size={22} />
                                        </div>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent className="bg-white text-slate-900 w-64 shadow-2xl rounded-[24px] overflow-hidden p-3 z-[120] border-none absolute right-0 top-full mt-2" align="end" sideOffset={10}>
                                        <div className="px-5 py-6 bg-slate-50/50 mb-2 rounded-[18px]">
                                            <p className="font-black uppercase tracking-tighter text-sm text-slate-800 line-clamp-1">
                                                {isTeacherMode || userProfile?.role === 'teacher' || userProfile?.role === 'admin' ? 'PROFESSOR SPCS' : 'ESTUDANTE SPCS'}
                                            </p>
                                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-700 mt-1 line-clamp-1">
                                                {userProfile?.full_name || 'Membro SPCS Academy'}
                                            </p>
                                            <p className="text-[9px] font-black uppercase tracking-[2px] text-slate-400 mt-2">
                                                Registrado em {formatDate(userProfile?.created_at || null)}
                                            </p>
                                        </div>

                                        <div className="p-1 space-y-1">
                                            {isTeacherMode || userProfile?.role === 'teacher' || userProfile?.role === 'admin' ? (
                                                <>
                                                    <DropdownMenuItem
                                                        onSelect={() => router.push("/dashboard-teacher/profile")}
                                                        className="flex items-center gap-4 px-4 py-3 rounded-xl cursor-pointer hover:bg-slate-50 text-slate-600 transition-colors outline-none focus:bg-slate-50"
                                                    >
                                                        <UserCog size={18} className="text-slate-400" />
                                                        <span className="text-[11px] font-bold uppercase tracking-widest leading-none">Editar Perfil</span>
                                                    </DropdownMenuItem>

                                                    <DropdownMenuItem
                                                        onSelect={() => router.push("/dashboard-teacher/settings")}
                                                        className="flex items-center gap-4 px-4 py-3 rounded-xl cursor-pointer hover:bg-slate-50 text-slate-600 transition-colors outline-none focus:bg-slate-50"
                                                    >
                                                        <Settings size={18} className="text-slate-400" />
                                                        <span className="text-[11px] font-bold uppercase tracking-widest leading-none">Configurações</span>
                                                    </DropdownMenuItem>

                                                    <DropdownMenuItem
                                                        onSelect={() => router.push("/dashboard-teacher/students")}
                                                        className="flex items-center gap-4 px-4 py-3 rounded-xl cursor-pointer hover:bg-slate-50 text-slate-600 transition-colors outline-none focus:bg-slate-50"
                                                    >
                                                        <Users size={18} className="text-slate-400" />
                                                        <span className="text-[11px] font-bold uppercase tracking-widest leading-none">Alunos</span>
                                                    </DropdownMenuItem>

                                                    <DropdownMenuItem
                                                        onSelect={() => router.push("/dashboard-teacher/courses")}
                                                        className="flex items-center gap-4 px-4 py-3 rounded-xl cursor-pointer hover:bg-slate-50 text-slate-600 transition-colors outline-none focus:bg-slate-50"
                                                    >
                                                        <BookOpen size={18} className="text-slate-400" />
                                                        <span className="text-[11px] font-bold uppercase tracking-widest leading-none">Cursos</span>
                                                    </DropdownMenuItem>

                                                    <DropdownMenuItem
                                                        onSelect={() => router.push("/dashboard-teacher/analytics")}
                                                        className="flex items-center gap-4 px-4 py-3 rounded-xl cursor-pointer hover:bg-slate-50 text-slate-600 transition-colors outline-none focus:bg-slate-50"
                                                    >
                                                        <TrendingUp size={18} className="text-slate-400" />
                                                        <span className="text-[11px] font-bold uppercase tracking-widest leading-none">Vendas</span>
                                                    </DropdownMenuItem>
                                                </>
                                            ) : (
                                                <>
                                                    <DropdownMenuItem
                                                        onSelect={() => router.push("/dashboard-student/profile")}
                                                        className="flex items-center gap-4 px-4 py-3 rounded-xl cursor-pointer hover:bg-slate-50 text-slate-600 transition-colors outline-none focus:bg-slate-50"
                                                    >
                                                        <User size={18} className="text-slate-400" />
                                                        <span className="text-[11px] font-bold uppercase tracking-widest leading-none">Meu Perfil</span>
                                                    </DropdownMenuItem>

                                                    <DropdownMenuItem
                                                        onSelect={() => router.push("/dashboard-student/certificates")}
                                                        className="flex items-center gap-4 px-4 py-3 rounded-xl cursor-pointer hover:bg-slate-50 text-slate-600 transition-colors outline-none focus:bg-slate-50"
                                                    >
                                                        <Award size={18} className="text-slate-400" />
                                                        <span className="text-[11px] font-bold uppercase tracking-widest leading-none">Meus Certificados</span>
                                                    </DropdownMenuItem>

                                                    <DropdownMenuItem
                                                        onSelect={() => router.push("/dashboard-student/payments")}
                                                        className="flex items-center gap-4 px-4 py-3 rounded-xl cursor-pointer hover:bg-slate-50 text-slate-600 transition-colors outline-none focus:bg-slate-50"
                                                    >
                                                        <CreditCard size={18} className="text-slate-400" />
                                                        <span className="text-[11px] font-bold uppercase tracking-widest leading-none">Pagamentos</span>
                                                    </DropdownMenuItem>

                                                    <DropdownMenuItem
                                                        onSelect={() => router.push("/dashboard-student/subscriptions")}
                                                        className="flex items-center gap-4 px-4 py-3 rounded-xl cursor-pointer hover:bg-slate-50 text-slate-600 transition-colors outline-none focus:bg-slate-50"
                                                    >
                                                        <Zap size={18} className="text-slate-400" />
                                                        <span className="text-[11px] font-bold uppercase tracking-widest leading-none">Assinaturas</span>
                                                    </DropdownMenuItem>

                                                    <DropdownMenuItem
                                                        onSelect={() => router.push("/dashboard-student/activity")}
                                                        className="flex items-center gap-4 px-4 py-3 rounded-xl cursor-pointer hover:bg-slate-50 text-slate-600 transition-colors outline-none focus:bg-slate-50"
                                                    >
                                                        <History size={18} className="text-slate-400" />
                                                        <span className="text-[11px] font-bold uppercase tracking-widest leading-none">Logs de Atividades</span>
                                                    </DropdownMenuItem>

                                                    <DropdownMenuSeparator className="bg-slate-50 my-2" />

                                                    <DropdownMenuItem
                                                        onSelect={() => router.push("/contact")}
                                                        className="flex items-center gap-4 px-4 py-3 rounded-xl cursor-pointer hover:bg-slate-50 text-slate-600 transition-colors outline-none focus:bg-slate-50"
                                                    >
                                                        <HelpCircle size={18} className="text-slate-400" />
                                                        <span className="text-[11px] font-bold uppercase tracking-widest leading-none">Central de Ajuda</span>
                                                    </DropdownMenuItem>

                                                    <DropdownMenuItem
                                                        onSelect={() => router.push("/dashboard-student/sugestoes")}
                                                        className="flex items-center gap-4 px-4 py-3 rounded-xl cursor-pointer hover:bg-slate-50 text-slate-600 transition-colors outline-none focus:bg-slate-50"
                                                    >
                                                        <MessageSquare size={18} className="text-slate-400" />
                                                        <span className="text-[11px] font-bold uppercase tracking-widest leading-none">Sugestões</span>
                                                    </DropdownMenuItem>
                                                </>
                                            )}
                                        </div>

                                        <DropdownMenuSeparator className="bg-slate-50 my-2" />

                                        <DropdownMenuItem
                                            onSelect={async () => {
                                                await signOut();
                                            }}
                                            className="flex items-center gap-4 px-4 py-4 rounded-xl cursor-pointer hover:bg-red-50 text-red-500 transition-colors outline-none focus:bg-red-50 group mb-1"
                                        >
                                            <LogOut size={18} className="group-hover:scale-110 transition-transform" />
                                            <span className="text-[12px] font-black uppercase tracking-[2px]">Encerrar Sessão</span>
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        ) : (
                            /* Mobile version of the contact link when not logged in */
                            <div className="md:hidden">
                                <Link href="/contact" className="text-slate-500 hover:text-slate-900 transition">
                                    <User size={22} />
                                </Link>
                            </div>
                        )}
                    </div>
                </nav>
            </header >
        </>
    )
}
