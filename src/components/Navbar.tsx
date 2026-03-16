"use client"

import { useState, useEffect } from 'react'
import { auth } from '@/lib/firebase'
import { onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth'
import { getPublicProfile } from '@/app/actions/profile'
import { removeSessionCookie } from '@/app/actions/auth'
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
    BookOpen,
    Menu
} from 'lucide-react'
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

interface NavbarProps {
    transparent?: boolean
}

export default function Navbar({ transparent }: NavbarProps) {
    const pathname = usePathname()
    const router = useRouter()
    const [userProfile, setUserProfile] = useState<{ full_name: string | null, role: string | null, created_at: any } | null>(null)
    const [isLoggedIn, setIsLoggedIn] = useState(false)
    const { items } = useCartStore()
    const [mounted, setMounted] = useState(false)
    const [isSearchOpen, setIsSearchOpen] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const [isScrolled, setIsScrolled] = useState(false)
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

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

    const studentLinks = [
        { href: '/course', label: 'Cursos' },
        ...(isLoggedIn ? [
            { href: '/dashboard-student', label: 'Minha Lista' },
            { href: '/dashboard-student/settings', label: 'Configurações' },
            { href: '/dashboard-student/chat', label: 'Chat' },
        ] : []),
    ]

    const teacherLinks = [
        { href: '/dashboard-teacher', label: 'Dashboard' },
        { href: '/dashboard-teacher/courses', label: 'Meus Cursos' },
        { href: '/dashboard-teacher/analytics', label: 'Desempenho' },
        { href: '/dashboard-teacher/settings', label: 'Configurações' },
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
                className="fixed top-0 left-0 right-0 z-[100] w-full transition-all duration-300 antialiased"
                style={{
                    background: '#0d2b17',
                    backdropFilter: 'blur(6px)',
                    WebkitBackdropFilter: 'blur(6px)',
                }}
            >
                <nav className={`flex items-center justify-between px-4 md:px-8 lg:px-12 py-5 font-exo ${'text-white'}`}>
                    {/* Left: Logo + Desktop Nav */}
                    <div className="flex items-center gap-6 lg:gap-10">
                        <Logo className="h-14" />
                        {isTeacherMode && (
                            <span className="hidden sm:inline ml-1 text-[8px] bg-slate-900 text-white px-2 py-0.5 rounded font-black tracking-widest uppercase">Painel</span>
                        )}

                        {/* Desktop Nav Links */}
                        <div className={`hidden md:flex gap-6 lg:gap-8 text-sm font-bold font-exo ${isHomePage && !isLoggedIn ? '!hidden' : ''}`}>
                            {filteredNavLinks.map(link => (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className={`transition-colors duration-300 ${pathname === link.href ? 'text-[#32cd32]' : 'hover:text-[#32cd32] text-white'}`}
                                >
                                    {link.label}
                                </Link>
                            ))}
                        </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-3 md:gap-6 ml-auto">

                        {/* Search */}
                        <div className={`flex items-center gap-2 relative ${isHomePage && !isLoggedIn ? '!hidden' : ''}`}>
                            <div className={`flex items-center rounded-xl px-3 py-1.5 transition-all duration-300 ${'bg-white/10 border border-white/20'} ${isSearchOpen ? 'w-40 md:w-64 opacity-100' : 'w-0 opacity-0 pointer-events-none border-none'}`}>
                                <Search size={16} className={`${'text-white'} mr-2 shrink-0`} />
                                <input
                                    type="text"
                                    placeholder="Buscar cursos..."
                                    className={`bg-transparent border-none outline-none text-[10px] font-bold uppercase tracking-widest w-full ${'placeholder:text-white/50 text-white'}`}
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    onKeyDown={e => {
                                        if (e.key === 'Enter') {
                                            router.push(`/course?s=${searchQuery}`)
                                            setIsSearchOpen(false)
                                        }
                                    }}
                                />
                            </div>
                            <button
                                onClick={() => setIsSearchOpen(!isSearchOpen)}
                                className={`${'text-white'} hover:opacity-70 transition cursor-pointer outline-none flex items-center justify-center`}
                            >
                                {isSearchOpen ? <X size={20} /> : <Search size={20} />}
                            </button>
                        </div>

                        {/* Notifications */}
                        {isLoggedIn && (
                            <div className="flex items-center justify-center">
                                <NotificationBell
                                    accent={isTeacherMode ? '#0f172a' : '#32cd32'}
                                    isTeacher={isTeacherMode}
                                />
                            </div>
                        )}

                        {/* Cart */}
                        {isLoggedIn && !isTeacherMode && (
                            <Link href="/cart" className={`${'text-white'} hover:opacity-70 transition cursor-pointer relative flex items-center justify-center`}>
                                <ShoppingCart size={20} />
                                {mounted && items.length > 0 && (
                                    <span className="absolute -top-1 -right-1.5 w-4 h-4 rounded-full bg-[#32cd32] text-white text-[9px] font-black flex items-center justify-center border-2 border-white">
                                        {items.length}
                                    </span>
                                )}
                            </Link>
                        )}

                        {/* Auth: Not logged in (desktop) */}
                        {!isLoggedIn && (
                            <div className="flex items-center gap-3">
                                {!isHomePage && (
                                    <Link href="/contact" className="text-slate-500 hover:text-slate-900 transition text-xs font-black uppercase tracking-widest">
                                        Contato
                                    </Link>
                                )}
                                <Link href="/login">
                                    <button className={`text-[10px] font-black uppercase tracking-widest border px-3 md:px-4 py-2 transition-all ${'text-white border-white/20 hover:bg-white/10'}`}>
                                        Login
                                    </button>
                                </Link>
                                <Link href="/register" className={isHomePage ? 'hidden' : ''}>
                                    <button className={`text-[10px] font-black uppercase tracking-widest px-3 md:px-4 py-2 transition-all ${'bg-[#32cd32] text-white hover:bg-[#28b828]'}`}>
                                        Inscreva-se
                                    </button>
                                </Link>
                            </div>
                        )}

                        {/* User Dropdown (logged in) */}
                        {isLoggedIn ? (
                            <DropdownMenu modal={false}>
                                <DropdownMenuTrigger asChild>
                                    <div className={`w-9 h-9 md:w-10 md:h-10 flex items-center justify-center text-white font-bold transition-all cursor-pointer border-2 outline-none hover:scale-105 bg-slate-900 shadow-sm overflow-hidden ${'border-white/20'}`}>
                                        <User size={20} />
                                    </div>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="bg-[#0d2b17] text-white w-[calc(100vw-2rem)] sm:w-64 max-h-[85vh] overflow-y-auto shadow-2xl rounded-none p-3 z-[120] border border-white/10 mt-2" align="end" alignOffset={-30} sideOffset={10}>
                                    <div className="px-5 py-6 bg-white/5 mb-2 rounded-none">
                                        <p className="font-black uppercase tracking-tighter text-sm text-white line-clamp-1">
                                            {isTeacherMode || userProfile?.role === 'teacher' || userProfile?.role === 'admin' ? 'PROFESSOR POWERPLAY' : 'ESTUDANTE POWERPLAY'}
                                        </p>
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-white/70 mt-1 line-clamp-1">
                                            {userProfile?.full_name || 'Membro PowerPlay'}
                                        </p>
                                        <p className="text-[9px] font-black uppercase tracking-[2px] text-white/40 mt-2">
                                            Registrado em {formatDate(userProfile?.created_at || null)}
                                        </p>
                                    </div>

                                    <div className="p-1 space-y-1">
                                        {isTeacherMode || userProfile?.role === 'teacher' || userProfile?.role === 'admin' ? (
                                            <>
                                                {userProfile?.role === 'admin' && (
                                                    <DropdownMenuItem onSelect={() => router.push("/admin/settings")} className="flex items-center gap-4 px-4 py-3 rounded-none cursor-pointer hover:bg-white/10 text-white/80 transition-colors outline-none focus:bg-white/10 border border-white/5 mb-1">
                                                        <Settings size={18} className="text-white/40" /><span className="text-[11px] font-bold uppercase tracking-widest leading-none">Configurações do Site</span>
                                                    </DropdownMenuItem>
                                                )}
                                                <DropdownMenuItem onSelect={() => router.push("/dashboard-teacher/profile")} className="flex items-center gap-4 px-4 py-3 rounded-none cursor-pointer hover:bg-white/10 text-white/80 transition-colors outline-none focus:bg-white/10 border-none">
                                                    <UserCog size={18} className="text-white/40" /><span className="text-[11px] font-bold uppercase tracking-widest leading-none">Editar Perfil</span>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onSelect={() => router.push("/dashboard-teacher/students")} className="flex items-center gap-4 px-4 py-3 rounded-none cursor-pointer hover:bg-white/10 text-white/80 transition-colors outline-none focus:bg-white/10 border-none">
                                                    <Users size={18} className="text-white/40" /><span className="text-[11px] font-bold uppercase tracking-widest leading-none">Alunos</span>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onSelect={() => router.push("/dashboard-teacher/courses")} className="flex items-center gap-4 px-4 py-3 rounded-none cursor-pointer hover:bg-white/10 text-white/80 transition-colors outline-none focus:bg-white/10 border-none">
                                                    <BookOpen size={18} className="text-white/40" /><span className="text-[11px] font-bold uppercase tracking-widest leading-none">Cursos</span>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onSelect={() => router.push("/dashboard-teacher/analytics")} className="flex items-center gap-4 px-4 py-3 rounded-none cursor-pointer hover:bg-white/10 text-white/80 transition-colors outline-none focus:bg-white/10 border-none">
                                                    <TrendingUp size={18} className="text-white/40" /><span className="text-[11px] font-bold uppercase tracking-widest leading-none">Vendas</span>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onSelect={() => router.push("/dashboard-teacher/chat")} className="flex items-center gap-4 px-4 py-3 rounded-none cursor-pointer hover:bg-white/10 text-white/80 transition-colors outline-none focus:bg-white/10 border-none">
                                                    <MessageSquare size={18} className="text-white/40" /><span className="text-[11px] font-bold uppercase tracking-widest leading-none">Mensagens</span>
                                                </DropdownMenuItem>
                                            </>
                                        ) : (
                                            <>
                                                <DropdownMenuItem onSelect={() => router.push("/dashboard-student/profile")} className="flex items-center gap-4 px-4 py-3 rounded-none cursor-pointer hover:bg-white/10 text-white/80 transition-colors outline-none focus:bg-white/10 border-none">
                                                    <User size={18} className="text-white/40" /><span className="text-[11px] font-bold uppercase tracking-widest leading-none">Meu Perfil</span>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onSelect={() => router.push("/dashboard-student/certificates")} className="flex items-center gap-4 px-4 py-3 rounded-none cursor-pointer hover:bg-white/10 text-white/80 transition-colors outline-none focus:bg-white/10 border-none">
                                                    <Award size={18} className="text-white/40" /><span className="text-[11px] font-bold uppercase tracking-widest leading-none">Meus Certificados</span>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onSelect={() => router.push("/dashboard-student/payments")} className="flex items-center gap-4 px-4 py-3 rounded-none cursor-pointer hover:bg-white/10 text-white/80 transition-colors outline-none focus:bg-white/10 border-none">
                                                    <CreditCard size={18} className="text-white/40" /><span className="text-[11px] font-bold uppercase tracking-widest leading-none">Pagamentos</span>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onSelect={() => router.push("/dashboard-student/subscriptions")} className="flex items-center gap-4 px-4 py-3 rounded-none cursor-pointer hover:bg-white/10 text-white/80 transition-colors outline-none focus:bg-white/10 border-none">
                                                    <Zap size={18} className="text-white/40" /><span className="text-[11px] font-bold uppercase tracking-widest leading-none">Assinaturas</span>
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator className="bg-white/5 my-2" />
                                                <DropdownMenuItem onSelect={() => router.push("/contact")} className="flex items-center gap-4 px-4 py-3 rounded-none cursor-pointer hover:bg-white/10 text-white/80 transition-colors outline-none focus:bg-white/10 border-none">
                                                    <HelpCircle size={18} className="text-white/40" /><span className="text-[11px] font-bold uppercase tracking-widest leading-none">Central de Ajuda</span>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onSelect={() => router.push("/dashboard-student/sugestoes")} className="flex items-center gap-4 px-4 py-3 rounded-none cursor-pointer hover:bg-white/10 text-white/80 transition-colors outline-none focus:bg-white/10 border-none">
                                                    <MessageSquare size={18} className="text-white/40" /><span className="text-[11px] font-bold uppercase tracking-widest leading-none">Sugestões</span>
                                                </DropdownMenuItem>
                                            </>
                                        )}
                                    </div>

                                    <DropdownMenuSeparator className="bg-white/5 my-2" />
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
                                        className="flex items-center gap-4 px-4 py-4 rounded-none cursor-pointer hover:bg-red-50 text-red-500 transition-colors outline-none focus:bg-red-50 group mb-1"
                                    >
                                        <LogOut size={18} className="group-hover:scale-110 transition-transform" />
                                        <span className="text-[12px] font-black uppercase tracking-[2px]">Encerrar Sessão</span>
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
                                className={`md:hidden flex items-center justify-center transition outline-none ml-1 ${'text-white hover:text-[#32cd32]'}`}
                                aria-label="Abrir menu"
                            >
                                {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                            </button>
                        )}
                    </div>
                </nav>

                {/* Mobile Menu Dropdown */}
                {isMobileMenuOpen && (
                    <div className={`md:hidden border-t px-4 py-4 space-y-1 animate-in slide-in-from-top-2 duration-200 shadow-lg max-h-[calc(100vh-70px)] overflow-y-auto backdrop-blur-[6px] ${'bg-[#0d2b17]/90 border-white/10'}`}>
                        {filteredNavLinks.map(link => (
                            <Link
                                key={link.href}
                                href={link.href}
                                onClick={() => setIsMobileMenuOpen(false)}
                                className={`flex items-center px-4 py-3 rounded-xl font-bold text-sm tracking-tight transition-colors ${pathname === link.href
                                    ? 'bg-[#32cd32]/20 text-[#32cd32]'
                                    : 'text-white/80 hover:bg-white/5 hover:text-[#32cd32]'
                                    }`}
                            >
                                {link.label}
                            </Link>
                        ))}

                        {!isLoggedIn && (
                            <div className={`pt-3 space-y-2 border-t mt-3 ${'border-white/10'}`}>
                                {!isHomePage && (
                                    <Link href="/contact" onClick={() => setIsMobileMenuOpen(false)} className={`flex items-center px-4 py-3 rounded-xl font-bold text-sm transition ${'text-white/50 hover:bg-white/5'}`}>
                                        Contato
                                    </Link>
                                )}
                                <div className="flex gap-2">
                                    <Link href="/login" className="flex-1" onClick={() => setIsMobileMenuOpen(false)}>
                                        <button className={`w-full text-[10px] font-black uppercase tracking-widest px-4 py-2.5 rounded-xl transition ${'text-white border border-white/20 hover:bg-white/10'}`}>Login</button>
                                    </Link>
                                    <Link href="/register" className={`flex-1 ${isHomePage ? 'hidden' : ''}`} onClick={() => setIsMobileMenuOpen(false)}>
                                        <button className={`w-full text-[10px] font-black uppercase tracking-widest px-4 py-2.5 rounded-xl transition ${'bg-[#32cd32] text-white hover:bg-[#28b828]'}`}>Inscreva-se</button>
                                    </Link>
                                </div>
                            </div>
                        )}

                        {userProfile?.role === 'admin' && (
                            <div className={`pt-3 border-t mt-3 ${'border-white/10'}`}>
                                <Link href="/admin/settings" onClick={() => setIsMobileMenuOpen(false)} className={`flex items-center gap-2 px-4 py-3 rounded-xl font-bold text-sm transition ${'text-white/50 hover:bg-white/5'}`}>
                                    <Settings size={16} /> Configurações do Site
                                </Link>
                            </div>
                        )}

                    </div>
                )}
            </header>
        </>
    )
}
