"use client"

import { useState, useEffect } from 'react'
import { auth } from '@/lib/firebase'
import { onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth'
import { getPublicProfile } from '@/app/actions/profile'
import { removeSessionCookie } from '@/app/actions/auth'
import Link from 'next/link'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
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
    BookOpen,
    Menu,
    ShieldAlert,
    Heart
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useCartStore } from '@/store/useCartStore'
import { NotificationBell } from '@/components/NotificationBell'
import Logo from '@/components/Logo'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAuth } from '@/context/AuthProvider'

interface NavbarProps {
    transparent?: boolean
    light?: boolean
}

export default function Navbar({ transparent, light = false }: NavbarProps) {
    const pathname = usePathname()
    const router = useRouter()
    const searchParams = useSearchParams()
    const { isMfaPending } = useAuth()
    // ... (no changes in inner hooks)
    const [userProfile, setUserProfile] = useState<{ full_name: string | null, role: string | null, created_at: any } | null>(null)
    const [isLoggedIn, setIsLoggedIn] = useState(false)
    const { items } = useCartStore()
    const [mounted, setMounted] = useState(false)
    const [isSearchOpen, setIsSearchOpen] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const [isScrolled, setIsScrolled] = useState(false)
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

    useEffect(() => {
        const queryFromUrl = searchParams.get('s') || ''
        setSearchQuery(queryFromUrl)
    }, [searchParams])

    useEffect(() => {
        setMounted(true)

        const handleScroll = () => {
            setIsScrolled(window.scrollY > 50)
        }
        window.addEventListener('scroll', handleScroll, { passive: true })

        async function getProfile(userId: string) {
            try {
                const data = await getPublicProfile(userId)
                if (data) {
                    setUserProfile({
                        full_name: data.full_name || null,
                        role: data.role as any || null,
                        created_at: (data as any).created_at
                    })
                }
            } catch (error) {
                console.error("Erro ao buscar perfil:", error)
            }
        }

        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                setIsLoggedIn(true)
                await getProfile(user.uid)
            } else {
                setIsLoggedIn(false)
                setUserProfile(null)
            }
        })

        return () => {
            unsubscribe()
            window.removeEventListener('scroll', handleScroll)
        }
    }, [])

    // Close mobile menu on route change
    useEffect(() => {
        setIsMobileMenuOpen(false)
    }, [pathname])

    const formatDate = (dateString: string | null) => {
        if (!dateString) return ''
        const date = new Date(dateString)
        return new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' }).format(date)
    }

    const isTeacherMode = pathname.startsWith('/dashboard-teacher') ||
        pathname.startsWith('/instructor') ||
        pathname.startsWith('/painel-professor')

    const isEffectivelyLoggedIn = isLoggedIn && !isMfaPending;

    const studentLinks = [
        { href: '/course', label: 'Cursos' },
        ...(isEffectivelyLoggedIn ? [
            { href: '/dashboard-student', label: 'Meu Aprendizado' },
            { href: '/dashboard-student/my-list', label: 'Favoritos' },
            { href: '/dashboard-student/settings', label: 'Configurações' },
            { href: '/dashboard-student/chat', label: 'Chat' },
        ] : []),
    ]

    const teacherLinks = [
        ...(isEffectivelyLoggedIn ? [
            { href: '/dashboard-teacher', label: 'Dashboard' },
            { href: '/dashboard-teacher/courses', label: 'Meus Cursos' },
            { href: '/dashboard-teacher/analytics', label: 'Desempenho' },
            { href: '/dashboard-teacher/settings', label: 'Configurações' },
        ] : []),
    ]

    const navLinks = isTeacherMode ? teacherLinks : studentLinks
    const isHomePage = pathname === '/'

    // Filter out 'Cursos' on the home page as requested
    const filteredNavLinks = isHomePage
        ? navLinks.filter(link => link.label !== 'Cursos')
        : navLinks

    return (
        <>
            <header
                className={cn(
                    "fixed top-0 left-0 right-0 z-[100] w-full transition-all duration-300 antialiased border-b",
                    light ? "bg-white/80 border-slate-200" : "bg-[#061629]/80 border-[#1D5F31]"
                )}
                style={{
                    backdropFilter: 'blur(12px)',
                    WebkitBackdropFilter: 'blur(12px)',
                }}
            >
                <nav className={cn(
                    "flex items-center justify-between px-6 md:px-12 py-5 font-montserrat w-full",
                    light ? "text-slate-900" : "text-white"
                )}>
                    {/* Left: Logo + Desktop Nav */}
                    <div className="flex items-center gap-6 lg:gap-10">
                        <Logo className="h-14" light={light} href={isEffectivelyLoggedIn ? (isTeacherMode || userProfile?.role === 'teacher' || userProfile?.role === 'admin' ? '/dashboard-teacher/courses' : '/course') : '/'} />
                        {isTeacherMode && isEffectivelyLoggedIn && (
                            <span className={cn(
                                "hidden sm:inline ml-1 text-[8px] px-2 py-0.5 rounded-xl font-bold tracking-widest uppercase",
                                light ? "bg-slate-100 text-slate-600" : "bg-slate-900 text-white"
                            )}>Painel</span>
                        )}

                        {/* Desktop Nav Links */}
                        <div className={`hidden md:flex gap-2 items-center ${isHomePage && !isLoggedIn ? '!hidden' : ''}`}>
                            {filteredNavLinks.map(link => (
                                <Link
                                    key={link.href}
                                    href={link.href as any}
                                        className={cn(
                                            "transition-colors duration-200 text-[13px] font-medium uppercase tracking-tight px-4 py-2 font-montserrat",
                                            pathname === link.href
                                                ? 'text-black font-bold border-b-2 border-[#1D5F31]'
                                                : light ? 'text-slate-400 hover:text-black' : 'text-white/60 hover:text-white'
                                        )}
                                >
                                    {link.label}
                                </Link>
                            ))}
                            {userProfile?.role === 'admin' && isEffectivelyLoggedIn && (
                                <>
                                    <Link href="/admin/dashboard" className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#22c55e] border border-[#22c55e]/30 px-3 py-2 rounded-xl hover:bg-[#22c55e]/10 transition-all duration-300 ml-2">
                                        Painel Admin
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-3 md:gap-6 ml-auto">

                        {/* Search */}
                        <div className={`flex items-center gap-2 relative ${isHomePage && !isLoggedIn ? '!hidden' : ''}`}>
                            <div className={cn(
                                "flex items-center rounded-xl px-3 py-1.5 transition-all duration-300",
                                light ? "bg-slate-100 border border-slate-200" : "bg-white/10 border border-white/20",
                                isSearchOpen ? 'w-40 md:w-64 opacity-100' : 'w-0 opacity-0 pointer-events-none border-none'
                            )}>
                                <Search size={16} className={cn(light ? "text-slate-400" : "text-white", "mr-2 shrink-0")} />
                                <input
                                    type="text"
                                    placeholder="Buscar cursos..."
                                    className={cn(
                                        "bg-transparent border-none outline-none text-[10px] font-bold uppercase tracking-widest w-full",
                                        light ? "placeholder:text-slate-400 text-slate-900" : "placeholder:text-white/50 text-white"
                                    )}
                                    value={searchQuery}
                                    onChange={e => {
                                        const value = e.target.value
                                        setSearchQuery(value)
                                        
                                        if (value.trim()) {
                                            const encodedQuery = encodeURIComponent(value.trim())
                                            if (pathname !== '/course') {
                                                router.push(`/course?s=${encodedQuery}`)
                                            } else {
                                                router.replace(`/course?s=${encodedQuery}`, { scroll: false })
                                            }
                                        } else {
                                            if (pathname === '/course') {
                                                router.replace('/course', { scroll: false })
                                            }
                                        }
                                    }}
                                    onKeyDown={e => {
                                        if (e.key === 'Enter') {
                                            setIsSearchOpen(false)
                                        }
                                    }}
                                />
                            </div>
                            <button
                                onClick={() => {
                                    if (isSearchOpen && searchQuery) {
                                        setSearchQuery('')
                                        if (pathname === '/course') {
                                            router.replace('/course', { scroll: false })
                                        }
                                    }
                                    setIsSearchOpen(!isSearchOpen)
                                }}
                                className={cn(
                                    "transition cursor-pointer outline-none flex items-center justify-center",
                                    light ? "text-slate-900 hover:text-[#1D5F31]" : "text-white hover:opacity-70"
                                )}
                            >
                                {isSearchOpen ? <X size={20} /> : <Search size={20} />}
                            </button>
                        </div>

                        {/* Notifications */}
                        {isEffectivelyLoggedIn && (
                            <div className="flex items-center justify-center">
                                <NotificationBell
                                    accent={isTeacherMode ? '#1D5F31' : '#1D5F31'}
                                    isTeacher={isTeacherMode}
                                    light={light}
                                />
                            </div>
                        )}

                        {/* Cart */}
                        {isEffectivelyLoggedIn && !isTeacherMode && (
                            <Link href="/cart" className={cn(
                                "transition cursor-pointer relative flex items-center justify-center",
                                light ? "text-slate-900 hover:text-[#1D5F31]" : "text-white hover:opacity-70"
                            )}>
                                <ShoppingCart size={20} />
                                {mounted && items.length > 0 && (
                                    <span className={cn(
                                        "absolute -top-1.5 -right-2 min-w-[20px] h-5 px-1 rounded-full bg-[#1D5F31] !text-white text-[11px] font-bold flex items-center justify-center border-2",
                                        light ? "border-white" : "border-[#061629]"
                                    )}>
                                        {items.length > 99 ? '99+' : items.length}
                                    </span>
                                )}
                            </Link>
                        )}

                        {/* Auth: Not logged in (desktop) */}
                        {!isEffectivelyLoggedIn && (
                            <div className="flex items-center gap-3">
                                {!isHomePage && (
                                    <Link href="/contact" className={cn("transition text-xs font-bold uppercase tracking-widest", light ? "text-slate-600 hover:text-slate-900" : "text-white/70 hover:text-white")}>
                                        Contato
                                    </Link>
                                )}
                                <Link href="/login">
                                    <button className="text-[10px] font-bold uppercase tracking-widest px-3 md:px-4 py-2 rounded-xl transition-all bg-[#1D5F31] text-white hover:brightness-110">
                                        Login
                                    </button>
                                </Link>
                                <Link href="/register" className={isHomePage ? 'hidden' : ''}>
                                    <button className={`text-[10px] font-bold uppercase tracking-widest px-3 md:px-4 py-2 rounded-xl transition-all ${'bg-[#1D5F31] text-white hover:brightness-110'}`}>
                                        Inscreva-se
                                    </button>
                                </Link>
                            </div>
                        )}

                        {/* User Dropdown (logged in) */}
                        {isEffectivelyLoggedIn ? (
                            <DropdownMenu modal={false}>
                                <DropdownMenuTrigger asChild>
                                    <div className={cn(
                                        "w-9 h-9 md:w-10 md:h-10 flex items-center justify-center font-bold transition-all cursor-pointer border-2 outline-none hover:scale-105 shadow-sm overflow-hidden rounded-full",
                                        light ? "bg-white text-slate-900 border-black/20" : "bg-slate-900 text-white border-black/20"
                                    )}>
                                        <User size={20} />
                                    </div>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className={cn(
                                    "w-[calc(100vw-2rem)] sm:w-64 max-h-[85vh] overflow-y-auto shadow-sm border rounded-2xl p-3 z-[120] mt-2",
                                    light ? "bg-white text-slate-900 border-slate-200" : "bg-[#061629] text-white border-white/10"
                                )} align="end" alignOffset={-30} sideOffset={10}>
                                    <div className={cn(
                                        "px-5 py-6 mb-2 rounded-xl",
                                        light ? "bg-slate-50" : "bg-white/5"
                                    )}>
                                        <p className={cn(
                                            "font-bold uppercase tracking-tighter text-sm line-clamp-1",
                                            light ? "text-slate-900" : "text-white"
                                        )}>
                                            {isTeacherMode || userProfile?.role === 'teacher' || userProfile?.role === 'admin' ? 'PROFESSOR POWERPLAY' : 'ESTUDANTE POWERPLAY'}
                                        </p>
                                        <p className={cn(
                                            "text-[10px] font-bold uppercase tracking-widest mt-1 line-clamp-1",
                                            light ? "text-slate-900" : "text-white"
                                        )}>
                                            {userProfile?.full_name || 'Membro PowerPlay'}
                                        </p>
                                        <p className={cn(
                                            "text-[9px] font-bold uppercase tracking-[2px] mt-2",
                                            light ? "text-slate-600" : "text-white/70"
                                        )}>
                                            Registrado em {formatDate(userProfile?.created_at || null)}
                                        </p>
                                    </div>

                                    <div className="p-1 space-y-1">
                                        {isTeacherMode || userProfile?.role === 'teacher' || userProfile?.role === 'admin' ? (
                                            <>
                                                {userProfile?.role === 'admin' && (
                                                    <>
                                                        <DropdownMenuItem onSelect={() => router.push("/admin/dashboard")} className="flex items-center gap-4 px-4 py-3 rounded-xl cursor-pointer hover:bg-[#1D5F31]/20 text-[#22c55e] transition-colors outline-none focus:bg-[#1D5F31]/20 border border-[#1D5F31]/30 mb-1 bg-[#1D5F31]/10">
                                                            <ShieldAlert size={18} className="text-[#22c55e]" /><span className="text-[11px] font-bold uppercase tracking-widest leading-none">Acessar Painel Admin</span>
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onSelect={() => router.push("/dashboard-student")} className="flex items-center gap-4 px-4 py-3 rounded-xl cursor-pointer hover:bg-[#1D5F31]/20 text-[#1D5F31] transition-colors outline-none focus:bg-[#1D5F31]/20 border border-[#1D5F31]/30 mb-1">
                                                            <GraduationCap size={18} className="text-[#1D5F31]" /><span className="text-[11px] font-bold uppercase tracking-widest leading-none">Modo Aluno</span>
                                                        </DropdownMenuItem>

                                                    </>
                                                )}
                                                <DropdownMenuSeparator className={cn("my-2", light ? "bg-slate-100" : "bg-white/5")} />
                                                <DropdownMenuItem onSelect={() => router.push("/dashboard-teacher/profile")} className={cn("flex items-center gap-4 px-4 py-3 rounded-xl cursor-pointer transition-colors outline-none border-none", light ? "text-slate-900 hover:!text-[#1D5F31] focus:!text-[#1D5F31]" : "text-white hover:!text-[#1D5F31] focus:!text-[#1D5F31]")}>
                                                    <UserCog size={18} className={light ? "text-slate-600" : "text-white/80"} /><span className="text-[11px] font-bold uppercase tracking-widest leading-none">Editar Perfil</span>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onSelect={() => router.push("/dashboard-teacher/students")} className={cn("flex items-center gap-4 px-4 py-3 rounded-xl cursor-pointer transition-colors outline-none border-none", light ? "text-slate-900 hover:!text-[#1D5F31] focus:!text-[#1D5F31]" : "text-white hover:!text-[#1D5F31] focus:!text-[#1D5F31]")}>
                                                    <Users size={18} className={light ? "text-slate-600" : "text-white/80"} /><span className="text-[11px] font-bold uppercase tracking-widest leading-none">Alunos</span>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onSelect={() => router.push("/dashboard-teacher/courses")} className={cn("flex items-center gap-4 px-4 py-3 rounded-xl cursor-pointer transition-colors outline-none border-none", light ? "text-slate-900 hover:text-[#1D5F31] focus:!text-[#1D5F31]" : "text-white hover:!text-[#1D5F31] focus:!text-[#1D5F31]")}>
                                                    <BookOpen size={18} className={light ? "text-slate-600" : "text-white/80"} /><span className="text-[11px] font-bold uppercase tracking-widest leading-none">Cursos</span>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onSelect={() => router.push("/dashboard-teacher/analytics")} className={cn("flex items-center gap-4 px-4 py-3 rounded-xl cursor-pointer transition-colors outline-none border-none", light ? "text-slate-900 hover:!text-[#1D5F31] focus:!text-[#1D5F31]" : "text-white hover:!text-[#1D5F31] focus:!text-[#1D5F31]")}>
                                                    <TrendingUp size={18} className={light ? "text-slate-600" : "text-white/80"} /><span className="text-[11px] font-bold uppercase tracking-widest leading-none">Vendas</span>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onSelect={() => router.push("/dashboard-teacher/chat")} className={cn("flex items-center gap-4 px-4 py-3 rounded-xl cursor-pointer transition-colors outline-none border-none", light ? "text-slate-900 hover:!text-[#1D5F31] focus:!text-[#1D5F31]" : "text-white hover:!text-[#1D5F31] focus:!text-[#1D5F31]")}>
                                                    <MessageSquare size={18} className={light ? "text-slate-600" : "text-white/80"} /><span className="text-[11px] font-bold uppercase tracking-widest leading-none">Mensagens</span>
                                                </DropdownMenuItem>
                                            </>
                                        ) : (
                                            <>
                                                <DropdownMenuItem onSelect={() => router.push("/dashboard-student/profile")} className={cn("flex items-center gap-4 px-4 py-3 rounded-xl cursor-pointer transition-colors outline-none border-none", light ? "text-slate-900 hover:!text-[#1D5F31] focus:!text-[#1D5F31]" : "text-white hover:!text-[#1D5F31] focus:!text-[#1D5F31]")}>
                                                    <User size={18} className={light ? "text-slate-600" : "text-white/80"} /><span className="text-[11px] font-bold uppercase tracking-widest leading-none">Meu Perfil</span>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onSelect={() => router.push("/dashboard-student/certificates")} className={cn("flex items-center gap-4 px-4 py-3 rounded-xl cursor-pointer transition-colors outline-none border-none", light ? "text-slate-900 hover:!text-[#1D5F31] focus:!text-[#1D5F31]" : "text-white hover:!text-[#1D5F31] focus:!text-[#1D5F31]")}>
                                                    <Award size={18} className={light ? "text-slate-600" : "text-white/80"} /><span className="text-[11px] font-bold uppercase tracking-widest leading-none">Meus Certificados</span>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onSelect={() => router.push("/dashboard-student/payments")} className={cn("flex items-center gap-4 px-4 py-3 rounded-xl cursor-pointer transition-colors outline-none border-none", light ? "text-slate-900 hover:!text-[#1D5F31] focus:!text-[#1D5F31]" : "text-white hover:!text-[#1D5F31] focus:!text-[#1D5F31]")}>
                                                    <CreditCard size={18} className={light ? "text-slate-600" : "text-white/80"} /><span className="text-[11px] font-bold uppercase tracking-widest leading-none">Pagamentos</span>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onSelect={() => router.push("/dashboard-student/subscriptions")} className={cn("flex items-center gap-4 px-4 py-3 rounded-xl cursor-pointer transition-colors outline-none border-none", light ? "text-slate-900 hover:!text-[#1D5F31] focus:!text-[#1D5F31]" : "text-white hover:!text-[#1D5F31] focus:!text-[#1D5F31]")}>
                                                    <Zap size={18} className={light ? "text-slate-600" : "text-white/80"} /><span className="text-[11px] font-bold uppercase tracking-widest leading-none">Assinaturas</span>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onSelect={() => router.push("/dashboard-student/my-list")} className={cn("flex items-center gap-4 px-4 py-3 rounded-xl cursor-pointer transition-colors outline-none border-none", light ? "text-slate-900 hover:!text-[#1D5F31] focus:!text-[#1D5F31]" : "text-white hover:!text-[#1D5F31] focus:!text-[#1D5F31]")}>
                                                    <Heart size={18} className={light ? "text-slate-600" : "text-white/80"} /><span className="text-[11px] font-bold uppercase tracking-widest leading-none">Minha Lista</span>
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator className={cn("my-2", light ? "bg-slate-100" : "bg-white/5")} />
                                                <DropdownMenuItem onSelect={() => router.push("/contact")} className={cn("flex items-center gap-4 px-4 py-3 rounded-xl cursor-pointer transition-colors outline-none border-none", light ? "text-slate-900 hover:!text-[#1D5F31] focus:!text-[#1D5F31]" : "text-white hover:!text-[#1D5F31] focus:!text-[#1D5F31]")}>
                                                    <HelpCircle size={18} className={light ? "text-slate-600" : "text-white/80"} /><span className="text-[11px] font-bold uppercase tracking-widest leading-none">Central de Ajuda</span>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onSelect={() => router.push("/dashboard-student/sugestoes")} className={cn("flex items-center gap-4 px-4 py-3 rounded-xl cursor-pointer transition-colors outline-none border-none", light ? "text-slate-900 hover:!text-[#1D5F31] focus:!text-[#1D5F31]" : "text-white hover:!text-[#1D5F31] focus:!text-[#1D5F31]")}>
                                                    <MessageSquare size={18} className={light ? "text-slate-600" : "text-white/80"} /><span className="text-[11px] font-bold uppercase tracking-widest leading-none">Sugestões</span>
                                                </DropdownMenuItem>
                                            </>
                                        )}
                                    </div>

                                    <DropdownMenuSeparator className={cn("my-2", light ? "bg-slate-100" : "bg-white/5")} />
                                    <DropdownMenuItem
                                        onSelect={async () => {
                                            try {
                                                await firebaseSignOut(auth);
                                                await removeSessionCookie();
                                                setIsLoggedIn(false);
                                                setUserProfile(null);
                                                router.push('/');
                                                router.refresh();
                                            } catch (error) {
                                                console.error("Erro ao sair:", error);
                                            }
                                        }}
                                        className="flex items-center gap-4 px-4 py-4 rounded-xl cursor-pointer hover:bg-red-50 text-red-500 transition-colors outline-none focus:bg-red-50 group mb-1"
                                    >
                                        <LogOut size={18} className="group-hover:scale-110 transition-transform" />
                                        <span className="text-[12px] font-bold uppercase tracking-[2px]">Encerrar Sessão</span>
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        ) : (
                            /* Mobile: icon for contact when not logged in */
                            <div className={`md:hidden ${'hidden'}`}>
                                <Link href="/contact" className="text-slate-500 hover:text-slate-900 transition">
                                    <User size={22} />
                                </Link>
                            </div>
                        )}

                        {/* Hamburger Button (mobile only) */}
                        {!isHomePage && (
                            <button
                                onClick={() => setIsMobileMenuOpen(prev => !prev)}
                                className={`md:hidden flex items-center justify-center transition outline-none ml-1 ${'text-white hover:text-[#1D5F31]'}`}
                                aria-label="Abrir menu"
                            >
                                {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                            </button>
                        )}
                    </div>
                </nav>

                {/* Mobile Menu Dropdown */}
                {isMobileMenuOpen && (
                    <div className={cn(
                        "md:hidden border-t px-4 py-4 space-y-1 animate-in slide-in-from-top-2 duration-200 shadow-sm border max-h-[calc(100vh-70px)] overflow-y-auto backdrop-blur-[6px]",
                        light ? "bg-white/90 border-slate-200" : "bg-[#061629]/90 border-white/10"
                    )}>
                        {filteredNavLinks.map(link => (
                            <Link
                                key={link.href}
                                href={link.href as any}
                                onClick={() => setIsMobileMenuOpen(false)}
                                className={cn(
                                    "flex items-center px-4 py-3 rounded-none text-sm tracking-tight transition-colors font-medium",
                                    pathname === link.href
                                        ? 'text-[#1D5F31] font-bold border-l-4 border-[#1D5F31]'
                                        : light ? 'text-slate-500' : 'text-white/70'
                                )}
                            >
                                {link.label}
                            </Link>
                        ))}

                        {!isEffectivelyLoggedIn && (
                            <div className={cn(
                                "pt-3 space-y-2 border-t mt-3",
                                light ? "border-slate-100" : "border-white/10"
                            )}>
                                {!isHomePage && (
                                    <Link href="/contact" onClick={() => setIsMobileMenuOpen(false)} className={cn(
                                        "flex items-center px-4 py-3 rounded-xl font-bold text-sm transition",
                                        light ? "text-slate-500 hover:!text-[#1D5F31]" : "text-white/80 hover:!text-[#1D5F31]"
                                    )}>
                                        Contato
                                    </Link>
                                )}
                                <div className="flex gap-2">
                                    <Link href="/login" className="flex-1" onClick={() => setIsMobileMenuOpen(false)}>
                                        <button className="w-full text-[10px] font-bold uppercase tracking-widest px-4 py-2.5 rounded-xl transition bg-[#1D5F31] text-white hover:brightness-110">
                                            Login
                                        </button>
                                    </Link>
                                    <Link href="/register" className={`flex-1 ${isHomePage ? 'hidden' : ''}`} onClick={() => setIsMobileMenuOpen(false)}>
                                        <button className="w-full text-[10px] font-bold uppercase tracking-widest px-4 py-2.5 rounded-xl transition bg-[#1D5F31] text-white hover:brightness-110">Inscreva-se</button>
                                    </Link>
                                </div>
                            </div>
                        )}


                    </div>
                )}
            </header>
        </>
    )
}
