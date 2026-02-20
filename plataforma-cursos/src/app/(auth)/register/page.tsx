'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'

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
        <div className="min-h-screen bg-brand-dark flex items-center justify-center p-4">
            <form onSubmit={handleRegister} className="bg-gray-900 p-8 rounded-lg shadow-xl w-full max-w-md space-y-4 border border-gray-800">
                <h2 className="text-2xl font-bold text-white text-center">Criar Conta Grátis</h2>

                <div className="flex gap-4 mb-4">
                    <button
                        type="button"
                        onClick={() => setRole('student')}
                        className={`flex-1 p-3 rounded font-bold transition-all border ${role === 'student' ? 'bg-brand-green text-brand-dark border-brand-green' : 'bg-gray-800 text-gray-400 border-gray-700 hover:border-gray-600'}`}
                    >
                        Estudante
                    </button>
                    <button
                        type="button"
                        onClick={() => setRole('teacher')}
                        className={`flex-1 p-3 rounded font-bold transition-all border ${role === 'teacher' ? 'bg-brand-green text-brand-dark border-brand-green' : 'bg-gray-800 text-gray-400 border-gray-700 hover:border-gray-600'}`}
                    >
                        Professor
                    </button>
                </div>

                <input
                    type="text" placeholder="Nome Completo" required
                    className="w-full p-3 rounded bg-gray-800 text-white border border-gray-700 focus:border-brand-green outline-none"
                    onChange={(e) => setFullName(e.target.value)}
                />
                <input
                    type="email" placeholder="Seu e-mail" required
                    className="w-full p-3 rounded bg-gray-800 text-white border border-gray-700 focus:border-brand-green outline-none"
                    onChange={(e) => setEmail(e.target.value)}
                />
                <input
                    type="password" placeholder="Sua senha" required
                    className="w-full p-3 rounded bg-gray-800 text-white border border-gray-700 focus:border-brand-green outline-none"
                    onChange={(e) => setPassword(e.target.value)}
                />

                <button
                    disabled={loading}
                    className="w-full bg-brand-green text-brand-dark font-bold p-3 rounded hover:bg-green-600 transition-all"
                >
                    {loading ? 'Processando...' : 'Cadastrar na Plataforma'}
                </button>
            </form>
        </div>
    )
}