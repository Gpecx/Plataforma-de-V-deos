"use client"

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { Search, User, Settings, ShoppingCart, LogOut, GraduationCap } from 'lucide-react'
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
    const [userRole, setUserRole] = useState<string | null>(null)
    const [isLoggedIn, setIsLoggedIn] = useState(false)
    const { items } = useCartStore()
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
        async function getRole() {
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                setIsLoggedIn(true)
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', user.id)
                    .single()
                setUserRole(profile?.role || null)
            } else {
                setIsLoggedIn(false)
            }
        }
        getRole()
    }, [])

    // Identifica se estamos na área do professor
    const isTeacherMode = pathname.startsWith('/dashboard-teacher') ||
        pathname.startsWith('/instructor') ||
        pathname.startsWith('/painel-professor')

    return (
        <nav className={`fixed top-0 w-full z-50 flex items-center justify-between px-8 md:px-12 py-4 backdrop-blur-md border-b text-white transition-colors duration-500 ${isTeacherMode ? 'bg-[#061629]/80 border-[#00FF00]/20' : 'bg-black/20 border-white/10'}`}>
            <div className="flex items-center gap-10">
                <Link href={isTeacherMode ? "/dashboard-teacher" : "/dashboard-student"} className="flex items-center outline-none">
                    <span className="text-2xl font-black italic tracking-tighter uppercase">
                        CURSOS <span className={isTeacherMode ? "text-[#00FF00]" : "text-[#00C402]"}>EXS</span>
                    </span>
                    {isTeacherMode && (
                        <span className="ml-2 text-[8px] bg-[#00FF00] text-black px-1.5 py-0.5 rounded font-black tracking-widest uppercase not-italic">Painel</span>
                    )}
                </Link>

                <div className="hidden md:flex gap-6 text-sm font-medium text-gray-300">
                    {!isTeacherMode ? (
                        <>
                            <Link href="/" className="hover:text-[#00C402] transition">Início</Link>
                            <Link href="/course" className="hover:text-[#00C402] transition">Cursos</Link>
                            <Link href="/dashboard-student" className="hover:text-[#00C402] transition">Minha Lista</Link>
                            <Link href="/dashboard-student/chat" className="hover:text-[#00C402] transition">Chat</Link>
                        </>
                    ) : (
                        <>
                            <Link href="/dashboard-teacher" className="hover:text-[#00FF00] transition">Dashboard</Link>
                            <Link href="/dashboard-teacher/courses" className="hover:text-[#00FF00] transition">Meus Cursos</Link>
                            <Link href="/dashboard-teacher/analytics" className="hover:text-[#00FF00] transition">Desempenho</Link>
                        </>
                    )}
                </div>
            </div>

            <div className="flex items-center gap-6">
                {/* Botão de Alternar Modo */}
                {/* Botão de Alternar Modo - Visível apenas se for professor ou já estiver no modo professor */}
                {isTeacherMode ? (
                    <Link
                        href="/dashboard-student"
                        className="hidden md:flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#00FF00] border border-[#00FF00]/30 px-3 py-1.5 rounded-lg hover:bg-[#00FF00] hover:text-black transition-all outline-none"
                    >
                        <GraduationCap size={14} />
                        Alternar para Aluno
                    </Link>
                ) : userRole === 'teacher' && (
                    <Link
                        href="/dashboard-teacher"
                        className="hidden md:flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400 border border-white/10 px-3 py-1.5 rounded-lg hover:border-[#00C402] hover:text-[#00C402] transition-all outline-none"
                    >
                        Modo Professor
                    </Link>
                )}

                <button className="text-gray-400 hover:text-white transition cursor-pointer outline-none">
                    <Search size={20} />
                </button>
                {/* Sininho: apenas para usuários logados */}
                {isLoggedIn && (
                    <NotificationBell accent={isTeacherMode ? '#00FF00' : '#00C402'} />
                )}
                {/* Carrinho: apenas para usuários logados e fora do modo professor */}
                {isLoggedIn && !isTeacherMode && (
                    <Link href="/cart" className="text-gray-400 hover:text-white transition cursor-pointer outline-none relative">
                        <ShoppingCart size={20} />
                        {mounted && items.length > 0 && (
                            <span className="absolute -top-1 -right-1.5 w-4 h-4 rounded-full bg-[#00C402] text-black text-[9px] font-black flex items-center justify-center border border-[#061629]">
                                {items.length}
                            </span>
                        )}
                    </Link>
                )}

                {/* Avatar / Profile Dropdown Menu */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-black font-bold transition-all cursor-pointer border border-white/10 outline-none hover:scale-105 ${isTeacherMode ? 'bg-[#00FF00] shadow-[0_0_15px_rgba(0,255,0,0.3)]' : 'bg-[#00C402] shadow-[0_0_15px_rgba(0,196,2,0.3)]'}`}>
                            <User size={22} />
                        </div>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="bg-[#0a1f3a]/95 backdrop-blur-lg border-white/10 text-white w-56 mt-2 shadow-2xl" align="end">
                        <DropdownMenuLabel className={`font-bold uppercase tracking-wider text-xs px-4 py-3 ${isTeacherMode ? 'text-[#00FF00]' : 'text-[#00C402]'}`}>
                            {isTeacherMode ? 'Gerenciar Conta' : 'Minha Conta'}
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator className="bg-white/10" />

                        <DropdownMenuItem
                            onSelect={() => router.push(isTeacherMode ? "/dashboard-teacher/profile" : "/dashboard-student/profile")}
                            className={`cursor-pointer transition-colors px-4 py-3 gap-3 outline-none ${isTeacherMode ? 'hover:bg-[#00FF00] hover:text-black focus:bg-[#00FF00] focus:text-black' : 'hover:bg-[#00C402] hover:text-black focus:bg-[#00C402] focus:text-black'}`}
                        >
                            <User size={18} />
                            <span>Editar Perfil</span>
                        </DropdownMenuItem>

                        <DropdownMenuItem
                            onSelect={() => router.push(isTeacherMode ? "/dashboard-teacher/settings" : "/dashboard-student/settings")}
                            className={`cursor-pointer transition-colors px-4 py-3 gap-3 outline-none ${isTeacherMode ? 'hover:bg-[#00FF00] hover:text-black focus:bg-[#00FF00] focus:text-black' : 'hover:bg-[#00C402] hover:text-black focus:bg-[#00C402] focus:text-black'}`}
                        >
                            <Settings size={18} />
                            <span>Configurações</span>
                        </DropdownMenuItem>

                        <DropdownMenuSeparator className="bg-white/10" />

                        <DropdownMenuItem
                            onSelect={async () => {
                                await signOut();
                            }}
                            className="cursor-pointer hover:bg-red-500 hover:text-white focus:bg-red-500 focus:text-white transition-colors px-4 py-3 gap-3 text-red-400 outline-none"
                        >
                            <LogOut size={18} />
                            <span>Sair</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </nav>
    )
}

