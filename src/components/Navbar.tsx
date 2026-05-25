"use client"

import { useState, useEffect } from 'react'
import { auth, db } from '@/lib/firebase'
import { onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth'
import { collection, query, where, getDocs } from 'firebase/firestore'
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
import { useTrailerStore } from '@/store/useTrailerStore'
import { NotificationBell } from '@/components/NotificationBell'
import Logo from '@/components/Logo'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
    DropdownMenuPortal,
} from "@/components/ui/dropdown-menu"
import { useAuth } from '@/context/AuthProvider'
import { searchGlobal, SearchResult } from '@/app/actions/search'
import { motion, AnimatePresence } from 'framer-motion'
import NextImage from 'next/image'

interface NavbarProps {
    transparent?: boolean
    light?: boolean
    hidden?: boolean
}

export default function Navbar({ transparent, light = false, hidden: hiddenProp }: NavbarProps) {
    const { isOpen: trailerIsOpen } = useTrailerStore()
    const isHidden = hiddenProp || trailerIsOpen
    const pathname = usePathname()
    const router = useRouter()
    const searchParams = useSearchParams()
    const { isMfaPending } = useAuth()
    
    const isTeacherMode = pathname.startsWith('/dashboard-teacher') ||
        pathname.startsWith('/instructor') ||
        pathname.startsWith('/painel-professor')

    const isStudentMode = pathname.startsWith('/dashboard-student') ||
        pathname.startsWith('/classroom') ||
        pathname.startsWith('/course')

    const isTeacherLogin = pathname === '/auth/teacher/login' || 
                         pathname === '/login/teacher' || 
                         pathname === '/professor/login'
    // ... (no changes in inner hooks)
    const [userProfile, setUserProfile] = useState<{ 
        full_name: string | null; 
        role: 'student' | 'teacher' | 'admin' | null; 
        created_at: string | { seconds: number } | null; 
        photoURL?: string | null; 
    } | null>(null)
    const [isLoggedIn, setIsLoggedIn] = useState(false)
    const { items } = useCartStore()
    const [mounted, setMounted] = useState(false)
    const [isSearchOpen, setIsSearchOpen] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const [isScrolled, setIsScrolled] = useState(false)
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
    const [searchResults, setSearchResults] = useState<SearchResult[]>([])
    const [isSearching, setIsSearching] = useState(false)
    const [showSearchDropdown, setShowSearchDropdown] = useState(false)
    const [teacherCourses, setTeacherCourses] = useState<{ id: string; slug: string; title: string; image?: string; status: string }[]>([])

    useEffect(() => {
        const queryFromUrl = searchParams.get('s') || ''
        setSearchQuery(queryFromUrl)
    }, [searchParams])

    // Debounced search logic with stale-result cancellation (BUG-01 fix)
    useEffect(() => {
        let cancelled = false

        const timer = setTimeout(async () => {
            if (searchQuery.length >= 2 && isSearchOpen) {
                if (isTeacherMode) {
                    const filtered = teacherCourses.filter(course =>
                        course.title.toLowerCase().includes(searchQuery.toLowerCase())
                    )
                    if (!cancelled) {
                        setSearchResults(filtered.map(c => ({
                            id: c.id,
                            type: 'course' as const,
                            title: c.title,
                            slug: c.slug,
                            image: c.image,
                            subtitle: c.status
                        })))
                        setShowSearchDropdown(true)
                    }
                } else {
                    setIsSearching(true)
                    setShowSearchDropdown(true)
                    try {
                        const results = await searchGlobal(searchQuery)
                        if (!cancelled) setSearchResults(results)
                    } catch (error) {
                        console.error("Erro na busca:", error)
                        if (!cancelled) setSearchResults([])
                    } finally {
                        if (!cancelled) setIsSearching(false)
                    }
                }
            } else {
                setSearchResults([])
                setShowSearchDropdown(false)
            }
        }, 300)

        return () => {
            cancelled = true
            clearTimeout(timer)
        }
    }, [searchQuery, isSearchOpen, isTeacherMode, teacherCourses])

    // Close dropdown on click outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            const target = e.target as HTMLElement
            if (!target.closest('.search-container')) {
                setShowSearchDropdown(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

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
                        role: (data.role as 'student' | 'teacher' | 'admin') || null,
                        created_at: data.created_at || null,
                        photoURL: data.photoURL || null
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

    // Fetch teacher courses for live search
    useEffect(() => {
        if (!isLoggedIn || !isTeacherMode) {
            setTeacherCourses([])
            return
        }

        const user = auth.currentUser
        if (!user?.uid) return
        const uid: string = user.uid

        async function fetchCourses() {
            try {
                const q = query(
                    collection(db, 'courses'),
                    where('teacher_id', '==', uid)
                )
                const snapshot = await getDocs(q)
                const courses = snapshot.docs.map(doc => ({
                    id: doc.id,
                    slug: doc.data().slug || '',
                    title: doc.data().title || '',
                    image: doc.data().image_url || undefined,
                    status: doc.data().status || ''
                }))
                setTeacherCourses(courses)
            } catch (error) {
                console.error("Erro ao buscar cursos do professor:", error)
            }
        }

        fetchCourses()
    }, [isLoggedIn, isTeacherMode])

    // Close mobile menu on route change
    useEffect(() => {
        setIsMobileMenuOpen(false)
    }, [pathname])

    const formatDate = (dateInput: string | { seconds: number } | null) => {
        if (!dateInput) return ''
        // BUG-05 fix: suporte a Firestore Timestamp ({ seconds, nanoseconds })
        const date = typeof dateInput === 'object' && 'seconds' in dateInput
            ? new Date(dateInput.seconds * 1000)
            : new Date(dateInput as string)
        if (isNaN(date.getTime())) return ''
        return new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' }).format(date)
    }


    const isEffectivelyLoggedIn = isLoggedIn && !isMfaPending;

    const getInitials = (name: string) => {
        if (!name) return '??'
        const names = name.trim().split(' ')
        if (names.length === 1) return names[0].substring(0, 2).toUpperCase()
        return (names[0][0] + names[names.length - 1][0]).toUpperCase()
    }

    const studentLinks = [
        { href: '/course', label: 'Cursos' },
        ...(isEffectivelyLoggedIn ? [
            { href: '/dashboard-student', label: 'Meu Aprendizado' },
            { href: '/dashboard-student/my-list', label: 'lista de desejos' },
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
    // And hide all links on teacher login pages
    const filteredNavLinks = isHomePage
        ? navLinks.filter(link => link.label !== 'Cursos')
        : isTeacherLogin 
            ? [] 
            : navLinks

    if (isHidden) {
        return null
    }

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
                        <Logo 
                            className="h-14" 
                            light={light} 
                            href={isTeacherLogin ? null : (isEffectivelyLoggedIn ? (isTeacherMode || userProfile?.role === 'teacher' || userProfile?.role === 'admin' ? '/dashboard-teacher/courses' : '/course') : '/')} 
                        />
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
                        <div className={cn("flex items-center gap-2 relative search-container", isHomePage && !isLoggedIn && "!hidden")}>
                            <div className={cn(
                                "flex items-center rounded-xl px-3 py-1.5 transition-all duration-300",
                                light ? "bg-slate-100 border border-slate-200" : "bg-white/10 border border-white/20",
                                isSearchOpen ? 'w-40 md:w-64 opacity-100' : 'w-0 opacity-0 pointer-events-none border-none'
                            )}>
                                <Search size={16} className={cn(light ? "text-slate-400" : "text-white", "mr-2 shrink-0")} />
                                <input
                                    type="text"
                                    placeholder={isTeacherMode ? "BUSCAR MEUS CURSOS..." : (userProfile?.role === 'student' || pathname.includes('/dashboard') ? "Procure por qualquer coisa" : "Buscar cursos...")}
                                    className={cn(
                                        // font-size mínimo 16px em mobile previne zoom automático do iOS
                                        "bg-transparent border-none outline-none text-base md:text-[10px] font-bold uppercase tracking-widest w-full",
                                        light ? "placeholder:text-slate-400 text-slate-900" : "placeholder:text-white/50 text-white"
                                    )}
                                    value={searchQuery}
                                    onChange={e => {
                                        const value = e.target.value
                                        setSearchQuery(value)
                                        // A navegação automática foi removida em favor do dropdown Udemy
                                    }}
                                    onFocus={() => {
                                        if (searchResults.length > 0) setShowSearchDropdown(true)
                                    }}
                                    onKeyDown={e => {
                                        if (e.key === 'Enter') {
                                            if (isTeacherMode && searchQuery.trim()) {
                                                router.push(`/dashboard-teacher/courses?q=${encodeURIComponent(searchQuery.trim())}` as any)
                                            } else if (searchQuery.trim()) {
                                                router.push(`/course?s=${encodeURIComponent(searchQuery.trim())}` as any)
                                            }
                                            setSearchQuery('')
                                            setShowSearchDropdown(false)
                                            setIsSearchOpen(false)
                                        }
                                    }}
                                />
                            </div>

                            {/* Dropdown de Resultados Estilo Udemy */}
                            <AnimatePresence>
                                {showSearchDropdown && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 10 }}
                                        className={cn(
                                            "absolute top-full right-0 left-0 md:left-auto md:w-[450px] mt-2 shadow-2xl border z-[200] overflow-hidden rounded-xl search-container",
                                            light ? "bg-white border-slate-200" : "bg-[#061629] border-white/10"
                                        )}
                                    >
                                        <div className="max-h-[70vh] overflow-y-auto">
                                            {/* Indicador de Carregamento */}
                                            {isSearching && (
                                                <div className="p-8 flex flex-col items-center justify-center gap-3">
                                                    <div className="w-6 h-6 border-2 border-[#1D5F31] border-t-transparent rounded-full animate-spin" />
                                                    <p className={cn("text-[10px] font-bold uppercase tracking-widest opacity-50", light ? "text-slate-900" : "text-white")}>Buscando...</p>
                                                </div>
                                            )}

                                            {!isSearching && searchResults.length === 0 && searchQuery.length >= 2 && (
                                                <div className="p-8 text-center">
                                                    <p className={cn("text-[11px] font-bold uppercase tracking-widest opacity-50", light ? "text-slate-900" : "text-white")}>Nenhum resultado encontrado</p>
                                                </div>
                                            )}
                                            {/* Resultados de Cursos */}
                                            {searchResults.filter(r => r.type === 'course').length > 0 && (
                                                <div className="p-2">
                                                    <p className={cn("px-3 py-2 text-[10px] font-bold uppercase tracking-widest opacity-50", light ? "text-slate-900" : "text-white")}>Cursos Sugeridos</p>
                                                    {searchResults.filter(r => r.type === 'course').map(result => (
                                                        <Link
                                                            key={result.id}
                                                            href={(isTeacherMode ? `/dashboard-teacher/courses/${result.id}/edit` : `/course/${result.slug}`) as any}
                                                            onClick={() => {
                                                                setSearchQuery('')
                                                                setShowSearchDropdown(false)
                                                                setIsSearchOpen(false)
                                                            }}
                                                            className={cn(
                                                                "w-full flex items-center gap-4 p-3 rounded-xl transition-colors text-left group",
                                                                light ? "hover:bg-slate-50" : "hover:bg-white/5"
                                                            )}
                                                        >
                                                            <div className="w-14 h-10 rounded-md overflow-hidden border border-black/10 shrink-0 relative bg-slate-100 dark:bg-slate-800">
                                                                {result.image ? (
                                                                    <NextImage src={result.image} alt={result.title} fill className="object-cover" sizes="56px" />
                                                                ) : (
                                                                    <div className="w-full h-full" />
                                                                )}
                                                            </div>
                                                            <div className="flex flex-col min-w-0">
                                                                <span className={cn("text-[13px] font-bold leading-tight line-clamp-2 group-hover:text-[#1D5F31] transition-colors", light ? "text-slate-900" : "text-white")}>
                                                                    {result.title}
                                                                </span>
                                                                <span className={cn("text-[10px] font-medium uppercase tracking-tight opacity-60 mt-1", light ? "text-slate-600" : "text-white/60")}>
                                                                    {isTeacherMode ? (result.subtitle === 'published' ? 'Publicado' : result.subtitle === 'draft' ? 'Rascunho' : result.subtitle) : result.subtitle}
                                                                </span>
                                                            </div>
                                                        </Link>
                                                    ))}
                                                </div>
                                            )}

                                            {/* Divisor se houver ambos */}
                                            {searchResults.filter(r => r.type === 'course').length > 0 && searchResults.filter(r => r.type === 'teacher').length > 0 && (
                                                <div className={cn("h-[1px] mx-4", light ? "bg-slate-100" : "bg-white/5")} />
                                            )}

                                            {/* Resultados de Instrutores */}
                                            {searchResults.filter(r => r.type === 'teacher').length > 0 && (
                                                <div className="p-2">
                                                    <p className={cn("px-3 py-2 text-[10px] font-bold uppercase tracking-widest opacity-50", light ? "text-slate-900" : "text-white")}>Instrutores</p>
                                                    {searchResults.filter(r => r.type === 'teacher').map(result => (
                                                        <button
                                                            key={result.id}
                                                            onClick={() => {
                                                                router.push(`/professor/${result.id}` as any)
                                                                setShowSearchDropdown(false)
                                                                setIsSearchOpen(false)
                                                            }}
                                                            className={cn(
                                                                "w-full flex items-center gap-4 p-3 rounded-xl transition-colors text-left group",
                                                                light ? "hover:bg-slate-50" : "hover:bg-white/5"
                                                            )}
                                                        >
                                                            <div className="w-10 h-10 rounded-full overflow-hidden border border-black/10 shrink-0 bg-slate-100 flex items-center justify-center relative">
                                                                {result.image ? (
                                                                    <NextImage src={result.image} alt={result.title} fill className="object-cover" sizes="40px" />
                                                                ) : (
                                                                    <User size={20} className="text-slate-400" />
                                                                )}
                                                            </div>
                                                            <div className="flex flex-col min-w-0">
                                                                <span className={cn("text-[13px] font-bold leading-tight group-hover:text-[#1D5F31] transition-colors", light ? "text-slate-900" : "text-white")}>
                                                                    {result.title}
                                                                </span>
                                                                <span className={cn("text-[10px] font-medium uppercase tracking-tight opacity-60 mt-1", light ? "text-slate-600" : "text-white/60")}>
                                                                    {result.subtitle}
                                                                </span>
                                                            </div>
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        <button
                                            onClick={() => {
                                                if (isTeacherMode) {
                                                    router.push(`/dashboard-teacher/courses?q=${encodeURIComponent(searchQuery)}` as any)
                                                } else {
                                                    router.push(`/course?s=${encodeURIComponent(searchQuery)}` as any)
                                                }
                                                setSearchQuery('')
                                                setShowSearchDropdown(false)
                                                setIsSearchOpen(false)
                                            }}
                                            className={cn(
                                                "w-full p-4 text-[11px] font-bold uppercase tracking-widest text-center border-t hover:bg-[#1D5F31]/5 transition-colors",
                                                light ? "text-[#1D5F31] border-slate-100 bg-slate-50/50" : "text-[#1D5F31] border-white/5 bg-white/5"
                                            )}
                                        >
                                            {isTeacherMode ? 'Ver todos os meus cursos' : 'Ver todos os resultados'}
                                        </button>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                            <button
                                onClick={() => {
                                    if (isSearchOpen) {
                                        // BUG-04 fix: sempre limpa o dropdown ao fechar
                                        if (searchQuery && pathname === '/course') {
                                            router.replace('/course', { scroll: false })
                                        }
                                        setSearchQuery('')
                                        setShowSearchDropdown(false)
                                        setSearchResults([])
                                    }
                                    setIsSearchOpen(prev => !prev)
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
                                        "w-9 h-9 md:w-10 md:h-10 flex items-center justify-center font-bold transition-all cursor-pointer border-2 outline-none hover:scale-105 shadow-sm overflow-hidden rounded-full relative",
                                        light ? "bg-white text-slate-900 border-black/20" : "bg-slate-900 text-white border-black/20"
                                    )}>
                                        {userProfile?.photoURL ? (
                                            <NextImage src={userProfile.photoURL} alt="Avatar" fill className="object-cover" sizes="40px" />
                                        ) : (
                                            <span className="text-[10px] md:text-xs font-bold uppercase tracking-widest">
                                                {getInitials(userProfile?.full_name || '')}
                                            </span>
                                        )}
                                    </div>
                                </DropdownMenuTrigger>
                                <DropdownMenuPortal>
                                    <DropdownMenuContent className={cn(
                                        "w-[calc(100vw-2rem)] sm:w-64 max-h-[85vh] overflow-y-auto shadow-sm border rounded-2xl p-3 z-[9999] mt-2",
                                        light ? "bg-white text-slate-900 border-slate-200" : "bg-[#061629] text-white border-white/10"
                                    )} align="end" alignOffset={-30} sideOffset={10}>
                                    <div className={cn(
                                        "px-5 py-6 mb-2 rounded-xl",
                                        light ? "bg-slate-50" : "bg-white/5"
                                    )}>
                                        <p className={cn(
                                            "font-bold uppercase tracking-tighter text-sm line-clamp-1",
                                            light ? "!text-black opacity-100" : "text-white"
                                        )}>
                                            {isTeacherMode ? 'PROFESSOR POWERPLAY' : 'ESTUDANTE POWERPLAY'}
                                        </p>
                                        <p className={cn(
                                            "text-[10px] font-bold uppercase tracking-widest mt-1 line-clamp-1",
                                            light ? "!text-black opacity-100" : "text-white"
                                        )}>
                                            {userProfile?.full_name || 'Membro PowerPlay'}
                                        </p>
                                        <p className={cn(
                                            "text-[9px] font-bold uppercase tracking-[2px] mt-2",
                                            light ? "!text-slate-900 opacity-100" : "text-white/70"
                                        )}>
                                            Registrado em {formatDate(userProfile?.created_at || null)}
                                        </p>
                                    </div>

                                    <div className="p-1 space-y-1">
                                        {userProfile?.role === 'admin' && !isTeacherMode && (
                                            <>
                                                <DropdownMenuItem onSelect={() => router.push("/admin/dashboard")} className="flex items-center gap-4 px-4 py-3 rounded-xl cursor-pointer hover:bg-[#1D5F31]/20 text-[#22c55e] transition-colors outline-none focus:bg-[#1D5F31]/20 border border-[#1D5F31]/30 mb-1 bg-[#1D5F31]/10">
                                                    <ShieldAlert size={18} className="text-[#22c55e]" /><span className="text-[11px] font-bold uppercase tracking-widest leading-none">Voltar ao Painel Admin</span>
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator className={cn("my-2", light ? "bg-slate-100" : "bg-white/5")} />
                                            </>
                                        )}
                                        {isTeacherMode ? (
                                            <>
                                                {userProfile?.role === 'admin' && (
                                                    <DropdownMenuItem onSelect={() => router.push("/dashboard-student")} className="flex items-center gap-4 px-4 py-3 rounded-xl cursor-pointer hover:bg-[#1D5F31]/20 text-[#1D5F31] transition-colors outline-none focus:bg-[#1D5F31]/20 border border-[#1D5F31]/30 mb-1">
                                                        <GraduationCap size={18} className="text-[#1D5F31]" /><span className="text-[11px] font-bold uppercase tracking-widest leading-none">Modo Aluno</span>
                                                    </DropdownMenuItem>
                                                )}
                                                <DropdownMenuSeparator className={cn("my-2", light ? "bg-slate-100" : "bg-white/5")} />
                                                <DropdownMenuItem onSelect={() => router.push("/dashboard-teacher/profile")} className={cn("flex items-center gap-4 px-4 py-3 rounded-xl cursor-pointer transition-colors outline-none border-none", light ? "text-black hover:bg-green-50 hover:!text-[#1D5F31] focus:bg-green-50 focus:!text-[#1D5F31]" : "text-white hover:bg-green-50 hover:!text-[#1D5F31] focus:bg-green-50 focus:!text-[#1D5F31]")}>
                                                    <UserCog size={18} className={light ? "text-slate-900" : "text-white/80"} /><span className="text-[11px] font-bold uppercase tracking-widest leading-none">Editar Perfil</span>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onSelect={() => router.push("/dashboard-teacher/students")} className={cn("flex items-center gap-4 px-4 py-3 rounded-xl cursor-pointer transition-colors outline-none border-none", light ? "text-black hover:bg-green-50 hover:!text-[#1D5F31] focus:bg-green-50 focus:!text-[#1D5F31]" : "text-white hover:bg-green-50 hover:!text-[#1D5F31] focus:bg-green-50 focus:!text-[#1D5F31]")}>
                                                    <Users size={18} className={light ? "text-slate-900" : "text-white/80"} /><span className="text-[11px] font-bold uppercase tracking-widest leading-none">Alunos</span>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onSelect={() => router.push("/dashboard-teacher/courses")} className={cn("flex items-center gap-4 px-4 py-3 rounded-xl cursor-pointer transition-colors outline-none border-none", light ? "text-black hover:bg-green-50 hover:!text-[#1D5F31] focus:bg-green-50 focus:!text-[#1D5F31]" : "text-white hover:bg-green-50 hover:!text-[#1D5F31] focus:bg-green-50 focus:!text-[#1D5F31]")}>
                                                    <BookOpen size={18} className={light ? "text-slate-900" : "text-white/80"} /><span className="text-[11px] font-bold uppercase tracking-widest leading-none">Cursos</span>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onSelect={() => router.push("/dashboard-teacher/analytics")} className={cn("flex items-center gap-4 px-4 py-3 rounded-xl cursor-pointer transition-colors outline-none border-none", light ? "text-black hover:bg-green-50 hover:!text-[#1D5F31] focus:bg-green-50 focus:!text-[#1D5F31]" : "text-white hover:bg-green-50 hover:!text-[#1D5F31] focus:bg-green-50 focus:!text-[#1D5F31]")}>
                                                    <TrendingUp size={18} className={light ? "text-slate-900" : "text-white/80"} /><span className="text-[11px] font-bold uppercase tracking-widest leading-none">Vendas</span>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onSelect={() => router.push("/dashboard-teacher/chat")} className={cn("flex items-center gap-4 px-4 py-3 rounded-xl cursor-pointer transition-colors outline-none border-none", light ? "text-black hover:bg-green-50 hover:!text-[#1D5F31] focus:bg-green-50 focus:!text-[#1D5F31]" : "text-white hover:bg-green-50 hover:!text-[#1D5F31] focus:bg-green-50 focus:!text-[#1D5F31]")}>
                                                    <MessageSquare size={18} className={light ? "text-slate-900" : "text-white/80"} /><span className="text-[11px] font-bold uppercase tracking-widest leading-none">Mensagens</span>
                                                </DropdownMenuItem>
                                            </>
                                        ) : (
                                            <>
                                                <DropdownMenuItem onSelect={() => router.push("/dashboard-student/profile")} className={cn("flex items-center gap-4 px-4 py-3 rounded-xl cursor-pointer transition-colors outline-none border-none", light ? "text-black hover:bg-green-50 hover:!text-[#1D5F31] focus:bg-green-50 focus:!text-[#1D5F31]" : "text-white hover:bg-green-50 hover:!text-[#1D5F31] focus:bg-green-50 focus:!text-[#1D5F31]")}>
                                                    <User size={18} className={light ? "text-slate-900" : "text-white/80"} /><span className="text-[11px] font-bold uppercase tracking-widest leading-none">Meu Perfil</span>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onSelect={() => router.push("/dashboard-student/certificates")} className={cn("flex items-center gap-4 px-4 py-3 rounded-xl cursor-pointer transition-colors outline-none border-none", light ? "text-black hover:bg-green-50 hover:!text-[#1D5F31] focus:bg-green-50 focus:!text-[#1D5F31]" : "text-white hover:bg-green-50 hover:!text-[#1D5F31] focus:bg-green-50 focus:!text-[#1D5F31]")}>
                                                    <Award size={18} className={light ? "text-slate-900" : "text-white/80"} /><span className="text-[11px] font-bold uppercase tracking-widest leading-none">Meus Certificados</span>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onSelect={() => router.push("/dashboard-student/payments")} className={cn("flex items-center gap-4 px-4 py-3 rounded-xl cursor-pointer transition-colors outline-none border-none", light ? "text-black hover:bg-green-50 hover:!text-[#1D5F31] focus:bg-green-50 focus:!text-[#1D5F31]" : "text-white hover:bg-green-50 hover:!text-[#1D5F31] focus:bg-green-50 focus:!text-[#1D5F31]")}>
                                                    <CreditCard size={18} className={light ? "text-slate-900" : "text-white/80"} /><span className="text-[11px] font-bold uppercase tracking-widest leading-none">Histórico de Compras</span>
                                                </DropdownMenuItem>
{/* <DropdownMenuItem onSelect={() => router.push("/dashboard-student/subscriptions")} className={cn("flex items-center gap-4 px-4 py-3 rounded-xl cursor-pointer transition-colors outline-none border-none", light ? "text-black hover:bg-green-50 hover:!text-[#1D5F31] focus:bg-green-50 focus:!text-[#1D5F31]" : "text-white hover:bg-green-50 hover:!text-[#1D5F31] focus:bg-green-50 focus:!text-[#1D5F31]")}>
                                                    <Zap size={18} className={light ? "text-slate-900" : "text-white/80"} /><span className="text-[11px] font-bold uppercase tracking-widest leading-none">Assinaturas</span>
                                                </DropdownMenuItem> */}
                                                <DropdownMenuItem onSelect={() => router.push("/dashboard-student/my-list")} className={cn("flex items-center gap-4 px-4 py-3 rounded-xl cursor-pointer transition-colors outline-none border-none", light ? "text-black hover:bg-green-50 hover:!text-[#1D5F31] focus:bg-green-50 focus:!text-[#1D5F31]" : "text-white hover:bg-green-50 hover:!text-[#1D5F31] focus:bg-green-50 focus:!text-[#1D5F31]")}>
                                                    <Heart size={18} className={light ? "text-slate-900" : "text-white/80"} /><span className="text-[11px] font-bold uppercase tracking-widest leading-none">Minha Lista</span>
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
                            </DropdownMenuPortal>
                        </DropdownMenu>
                        ) : null}

                        {/* Hamburger Button (mobile only) */}
                        {!isHomePage && (
                             <button
                                onClick={() => setIsMobileMenuOpen(prev => !prev)}
                                className={`md:hidden flex items-center justify-center min-w-[44px] min-h-[44px] transition outline-none ml-1 ${'text-white hover:text-[#1D5F31]'}`}
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
                                        "flex items-center px-4 py-3 min-h-[44px] rounded-xl text-sm tracking-tight transition-colors font-medium",
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
