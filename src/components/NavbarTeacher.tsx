"use client"

import { useState, useEffect } from 'react'
import { auth, db } from '@/lib/firebase'
import { onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { formatDateBR } from '@/lib/date-utils'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import {
    Search,
    User,
    Settings,
    LogOut,
    X,
    HelpCircle,
    MessageSquare,
    Users,
    UserCog,
    Menu
} from 'lucide-react'
import { NotificationBell } from '@/components/NotificationBell'

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export default function NavbarTeacher() {
    const pathname = usePathname()
    const router = useRouter()
    const [userProfile, setUserProfile] = useState<{ full_name: string | null, role: string | null, created_at: string | null, avatar_url?: string } | null>(null)
    const [isLoggedIn, setIsLoggedIn] = useState(false)
    const [mounted, setMounted] = useState(false)
    const [isSearchOpen, setIsSearchOpen] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')

    useEffect(() => {
        setMounted(true)
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                setIsLoggedIn(true)
                try {
                    const docRef = doc(db, 'profiles', user.uid);
                    const docSnap = await getDoc(docRef);
                    if (docSnap.exists()) {
                        setUserProfile(docSnap.data() as any);
                    }
                } catch (error) {
                    console.error("Error fetching profile:", error);
                }
            } else {
                setIsLoggedIn(false)
                setUserProfile(null)
            }
        });
        return () => unsubscribe();
    }, [])

    const handleSignOut = async () => {
        try {
            await firebaseSignOut(auth);
            router.push('/');
        } catch (error) {
            console.error("Error signing out:", error);
        }
    };

    const formatDate = (dateValue: any) => {
        return formatDateBR(dateValue)
    }

    return (
        <header className="sticky top-0 left-0 right-0 z-[100] w-full bg-white border-b border-[#E5E7EB] transition-all duration-300 pointer-events-auto" style={{ height: '64px' }}>
            <nav className="flex items-center justify-between px-4 sm:px-8 md:px-12 h-full text-slate-800" style={{ fontFamily: "'Inter', 'Geist', sans-serif" }}>

                {/* Logo & Navigation */}
                <div className="flex items-center gap-4 lg:gap-10">

                    {/* Hamburger Menu Mobile */}
                    <div className="md:hidden flex items-center">
                        <DropdownMenu modal={false}>
                            <DropdownMenuTrigger asChild>
                                <button className="p-2 border border-slate-200 rounded-xl bg-slate-50 text-slate-700 hover:bg-slate-100 transition-colors outline-none cursor-pointer">
                                    <Menu size={20} />
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start" sideOffset={8} className="w-56 bg-white p-2 rounded-2xl border-none shadow-2xl z-[200]">
                                <div className="px-3 py-2 text-[10px] font-medium text-slate-500 mb-1">
                                    Painel do Professor
                                </div>
                                <DropdownMenuItem onSelect={() => router.push("/dashboard-teacher")} className="px-3 py-3 text-sm font-medium text-[#374151] focus:bg-slate-50 rounded-xl cursor-pointer hover:text-black">Dashboard</DropdownMenuItem>
                                <DropdownMenuItem onSelect={() => router.push("/dashboard-teacher/courses")} className="px-3 py-3 text-sm font-medium text-[#374151] focus:bg-slate-50 rounded-xl cursor-pointer hover:text-black">Meus Cursos</DropdownMenuItem>
                                <DropdownMenuItem onSelect={() => router.push("/dashboard-teacher/analytics")} className="px-3 py-3 text-sm font-medium text-[#374151] focus:bg-slate-50 rounded-xl cursor-pointer hover:text-black">Vendas</DropdownMenuItem>
                                <DropdownMenuItem onSelect={() => router.push("/dashboard-teacher/settings")} className="px-3 py-3 text-sm font-medium text-[#374151] focus:bg-slate-50 rounded-xl cursor-pointer hover:text-black">Configurações</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>

                    <Link href="/dashboard-teacher" className="flex items-center outline-none hover:opacity-80 transition-opacity">
                        <img
                            src="/images/SPCS academy 2.png"
                            alt="PowerPlay"
                            className="h-10 sm:h-12 md:h-14 w-auto"
                        />
                    </Link>

                    <div className="hidden md:flex gap-6 items-center">
                        <Link href="/dashboard-teacher" className="text-sm font-medium text-[#374151] hover:text-black transition-colors py-3">Dashboard</Link>
                        <Link href="/dashboard-teacher/courses" className="text-sm font-medium text-[#374151] hover:text-black transition-colors py-3">Meus Cursos</Link>
                        <Link href="/dashboard-teacher/analytics" className="text-sm font-medium text-[#374151] hover:text-black transition-colors py-3">Vendas</Link>
                        <Link href="/dashboard-teacher/settings" className="text-sm font-medium text-[#374151] hover:text-black transition-colors py-3">Configurações</Link>
                    </div>
                </div>

                {/* Right Side Actions */}
                <div className="flex items-center gap-3 sm:gap-6 justify-end">



                    {/* Search Component */}
                    <div className="flex items-center gap-2 relative">
                        <div className={`flex items-center bg-slate-50 border border-slate-100 rounded-xl px-3 py-1.5 transition-all duration-300 ${isSearchOpen ? 'w-36 sm:w-48 md:w-64 opacity-100' : 'w-0 opacity-0 pointer-events-none border-none'}`}>
                            <Search size={16} className="text-slate-400 mr-2" />
                            <input
                                type="text"
                                placeholder="Buscar no painel..."
                                className="bg-transparent border-none outline-none text-[10px] font-bold uppercase tracking-widest w-full placeholder:text-slate-400 text-slate-700"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <button
                            onClick={() => setIsSearchOpen(!isSearchOpen)}
                            className={`text-slate-900 hover:text-slate-500 transition cursor-pointer outline-none ${isSearchOpen ? 'text-slate-500' : ''}`}
                        >
                            {isSearchOpen ? <X size={20} /> : <Search size={20} />}
                        </button>
                    </div>

                    {/* Notifications */}
                    {isLoggedIn && (
                        <NotificationBell
                            accent="#0f172a"
                            isTeacher={true}
                        />
                    )}

                    {/* Logged In User Avatar Dropdown */}
                    {isLoggedIn && (
                        <DropdownMenu modal={false}>
                            <DropdownMenuTrigger asChild>
                                <button className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold transition-all outline-none hover:scale-105 bg-slate-900 shadow-sm overflow-hidden border-2 border-transparent hover:border-slate-200 relative">
                                    {userProfile?.avatar_url ? (
                                        <img src={userProfile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                                    ) : (
                                        <User size={22} />
                                    )}
                                </button>
                            </DropdownMenuTrigger>

                            <DropdownMenuContent
                                align="end"
                                sideOffset={8}
                                className="bg-white text-slate-900 w-[calc(100vw-32px)] sm:w-72 shadow-2xl rounded-[24px] overflow-hidden p-3 border-none z-[200] animate-in slide-in-from-top-2"
                            >
                                <div className="px-5 py-6 bg-slate-50/50 mb-2 rounded-[18px]">
                                    <p className="font-black uppercase tracking-tighter text-sm text-slate-800 line-clamp-1">
                                        PROFESSOR POWERPLAY
                                    </p>
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-700 mt-1 line-clamp-1">
                                        {userProfile?.full_name || 'Membro PowerPlay'}
                                    </p>
                                    <p className="text-[9px] font-black uppercase tracking-[2px] text-slate-400 mt-2">
                                        Registrado em {formatDate(userProfile?.created_at || null)}
                                    </p>
                                </div>

                                <div className="p-1 space-y-1">
                                    <DropdownMenuItem onSelect={() => router.push("/dashboard-teacher/profile")} className="flex items-center gap-4 px-4 py-3 rounded-xl cursor-pointer hover:bg-slate-50 text-slate-600 transition-colors focus:bg-slate-50">
                                        <UserCog size={18} className="text-slate-400" />
                                        <span className="text-[11px] font-bold uppercase tracking-widest leading-none">Editar Perfil</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onSelect={() => router.push("/dashboard-teacher/settings")} className="flex items-center gap-4 px-4 py-3 rounded-xl cursor-pointer hover:bg-slate-50 text-slate-600 transition-colors focus:bg-slate-50">
                                        <Settings size={18} className="text-slate-400" />
                                        <span className="text-[11px] font-bold uppercase tracking-widest leading-none">Configurações</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onSelect={() => router.push("/dashboard-teacher/students")} className="flex items-center gap-4 px-4 py-3 rounded-xl cursor-pointer hover:bg-slate-50 text-slate-600 transition-colors focus:bg-slate-50">
                                        <Users size={18} className="text-slate-400" />
                                        <span className="text-[11px] font-bold uppercase tracking-widest leading-none">Alunos</span>
                                    </DropdownMenuItem>

                                    <DropdownMenuSeparator className="my-2 bg-slate-100" />

                                    <div className="px-3 py-2">
                                        <p className="text-[9px] font-black uppercase tracking-[2px] text-slate-400 mb-2 px-2">Suporte & Ajuda</p>
                                        <div className="grid grid-cols-2 gap-2">
                                            <DropdownMenuItem onSelect={() => router.push("/contact")} className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer focus:bg-slate-100">
                                                <HelpCircle size={20} className="mb-2 text-slate-400" />
                                                <span className="text-[9px] font-bold uppercase tracking-widest">FAQ</span>
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onSelect={() => router.push("/dashboard-teacher/chat")} className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-[#00C402] transition-colors cursor-pointer focus:bg-slate-100">
                                                <MessageSquare size={20} className="mb-2" />
                                                <span className="text-[9px] font-bold uppercase tracking-widest text-slate-600">Chat</span>
                                            </DropdownMenuItem>
                                        </div>
                                    </div>

                                    <DropdownMenuSeparator className="my-2 bg-slate-100" />

                                    <DropdownMenuItem
                                        onSelect={handleSignOut}
                                        className="flex items-center justify-between px-4 py-3 rounded-xl cursor-pointer bg-red-50/50 hover:bg-red-100 text-red-600 transition-colors mt-2 focus:bg-red-100"
                                    >
                                        <span className="text-[11px] font-black uppercase tracking-widest">Sair da Conta</span>
                                        <LogOut size={16} />
                                    </DropdownMenuItem>
                                </div>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                </div>
            </nav>
        </header>
    )
}
