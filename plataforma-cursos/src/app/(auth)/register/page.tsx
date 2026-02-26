'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function RegisterPage() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [fullName, setFullName] = useState('')
    const [role, setRole] = useState<'student' | 'teacher'>('student')
    const [loading, setLoading] = useState(false)
    const router = useRouter()
    const supabase = createClient()

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        // 1. Cria o usuário no Supabase Auth
        const { data, error: authError } = await supabase.auth.signUp({
            email,
            password,
        })

        if (authError) {
            alert('Erro no cadastro: ' + authError.message)
            setLoading(false)
            return
        }

        if (data.user) {
            // 2. Insere o nome na tabela profiles que criamos no SQL
            const { error: profileError } = await supabase
                .from('profiles')
                .insert([
                    { id: data.user.id, full_name: fullName, role: role }
                ])

            if (profileError) {
                console.error('Erro ao salvar perfil:', profileError.message)
                // Mesmo com erro no perfil, o usuário foi criado.
            }

            // Redirecionamento baseado no cargo
            if (role === 'teacher') {
                router.push('/dashboard-teacher')
            } else {
                router.push('/dashboard-student')
            }
            router.refresh()
        }
        setLoading(false)
    }

    return (
        <div className="w-full">
            <div className="text-center space-y-4 pt-4 pb-10">
                <div className="flex justify-center mb-2">
                    <Link href="/" className="hover:scale-105 transition-transform duration-500">
                        <span className="text-2xl font-black tracking-tighter uppercase text-slate-700">
                            SPCS <span className="text-[#00C402]">Academy</span>
                        </span>
                    </Link>
                </div>
                <h2 className="text-3xl font-black tracking-tighter uppercase text-slate-700">Criar Conta Grátis</h2>
                <p className="text-slate-400 font-bold uppercase text-[10px] tracking-[3px]">Comece sua jornada de conhecimento</p>
            </div>

            <form onSubmit={handleRegister} className="space-y-6">
                <div className="flex gap-4 mb-6">
                    <button
                        type="button"
                        onClick={() => setRole('student')}
                        className={`flex-1 p-4 rounded-xl font-black text-xs uppercase tracking-widest transition-all border ${role === 'student' ? 'bg-[#00C402] text-white border-[#00C402]' : 'bg-slate-50 text-slate-400 border-slate-100 hover:border-slate-200'}`}
                    >
                        Sou Aluno
                    </button>
                    <button
                        type="button"
                        onClick={() => setRole('teacher')}
                        className={`flex-1 p-4 rounded-xl font-black text-xs uppercase tracking-widest transition-all border ${role === 'teacher' ? 'bg-[#00C402] text-white border-[#00C402]' : 'bg-slate-50 text-slate-400 border-slate-100 hover:border-slate-200'}`}
                    >
                        Sou Professor
                    </button>
                </div>

                <div className="space-y-4">
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Nome Completo</label>
                        <input
                            type="text" placeholder="SEU NOME COMPLETO" required
                            className="w-full p-4 rounded-xl bg-slate-50 text-slate-700 border border-slate-100 focus:border-[#00C402] outline-none text-sm font-medium transition-all"
                            onChange={(e) => setFullName(e.target.value)}
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">E-mail</label>
                            <input
                                type="email" placeholder="seu@email.com" required
                                className="w-full p-4 rounded-xl bg-slate-50 text-slate-700 border border-slate-100 focus:border-[#00C402] outline-none text-sm font-medium transition-all"
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Senha</label>
                            <input
                                type="password" placeholder="••••••••" required
                                className="w-full p-4 rounded-xl bg-slate-50 text-slate-700 border border-slate-100 focus:border-[#00C402] outline-none text-sm transition-all"
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                <button
                    disabled={loading}
                    className="w-full bg-[#00C402] hover:bg-[#00A802] text-white font-black uppercase tracking-[2px] p-4 h-16 rounded-2xl transition-all shadow-sm disabled:opacity-50 mt-4"
                >
                    {loading ? 'PROCESSANDO...' : 'CADASTRAR AGORA'}
                </button>

                <div className="mt-10 pt-8 border-t border-slate-50 text-center">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                        Já tem uma conta? <Link href="/login" className="text-[#00C402] font-black hover:underline underline-offset-4">Entrar na plataforma</Link>
                    </p>
                </div>
            </form>
        </div>
    )
}