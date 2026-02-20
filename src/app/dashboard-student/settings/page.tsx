"use client"

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { updatePassword } from '../actions'
import { Lock, CreditCard, Trash2, ArrowLeft, Save } from 'lucide-react'
import Link from 'next/link'
import DeleteAccountButton from '@/components/DeleteAccountButton'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export default function SettingsPage() {
    const supabase = createClient()
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [user, setUser] = useState<any>(null)
    const [pixKey, setPixKey] = useState('')
    const [bank, setBank] = useState('')

    useEffect(() => {
        async function getUser() {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                router.push('/login')
            } else {
                setUser(user)
                setLoading(false)
            }
        }
        getUser()
    }, [supabase, router])

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#061629]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#00C402]"></div>
            </div>
        )
    }

    return (
        <div className="max-w-4xl mx-auto p-8 md:p-12 space-y-12">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-4xl font-black italic tracking-tighter uppercase mb-2">
                        Configurações <span className="text-[#00C402]">Gerais</span>
                    </h1>
                    <p className="text-gray-400">Gerencie sua segurança e dados de pagamento.</p>
                </div>
                <Link
                    href="/dashboard-student"
                    className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition group"
                >
                    <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                    Voltar
                </Link>
            </div>

            <div className="grid grid-cols-1 gap-8">
                {/* Segurança / Senha */}
                <section className="bg-white/5 border border-white/10 rounded-3xl p-8 shadow-2xl space-y-8 backdrop-blur-md">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-[#00C402]/10 rounded-xl flex items-center justify-center text-[#00C402]">
                            <Lock size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold italic tracking-tight uppercase">Segurança da Conta</h2>
                            <p className="text-sm text-gray-400">Atualize sua senha de acesso.</p>
                        </div>
                    </div>

                    <form action={async (formData) => {
                        const res = await updatePassword(formData)
                        if (res.success) {
                            alert('Senha atualizada com sucesso!')
                        } else {
                            alert('Erro ao atualizar senha: ' + res.error)
                        }
                    }} className="space-y-6">
                        <div className="max-w-md space-y-2">
                            <label className="text-xs font-black uppercase tracking-widest text-gray-500">Nova Senha</label>
                            <Input
                                type="password"
                                name="password"
                                className="bg-black/20 border-white/10 focus:border-[#00C402]"
                                placeholder="••••••••"
                                required
                                minLength={6}
                            />
                        </div>
                        <Button
                            type="submit"
                            className="bg-black/20 border border-[#00C402]/30 text-[#00C402] font-black uppercase italic rounded-xl hover:bg-[#00C402] hover:text-black transition-all px-8 py-6 h-auto"
                        >
                            Atualizar Senha
                        </Button>
                    </form>
                </section>

                {/* Dados Bancários */}
                <section className="bg-white/5 border border-white/10 rounded-3xl p-8 shadow-2xl space-y-8 backdrop-blur-md">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-400">
                            <CreditCard size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold italic tracking-tight uppercase">Dados Bancários</h2>
                            <p className="text-sm text-gray-400">Para recebimento de reembolsos ou parcerias.</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-2">
                        <div className="space-y-2">
                            <label className="text-xs font-black uppercase tracking-widest text-gray-500">Chave PIX</label>
                            <Input
                                type="text"
                                value={pixKey}
                                onChange={(e) => setPixKey(e.target.value)}
                                className="bg-black/20 border-white/10 focus:border-blue-400"
                                placeholder="CPF, Email ou Aleatória"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-black uppercase tracking-widest text-gray-500">Banco</label>
                            <Input
                                type="text"
                                value={bank}
                                onChange={(e) => setBank(e.target.value)}
                                className="bg-black/20 border-white/10 focus:border-blue-400"
                                placeholder="Ex: Nubank, Itaú..."
                            />
                        </div>
                    </div>
                    <Button
                        className="bg-black/20 border border-blue-400/30 text-blue-400 font-black uppercase italic rounded-xl hover:bg-blue-400 hover:text-black transition-all px-8 py-6 h-auto"
                    >
                        Salvar Dados
                    </Button>
                </section>

                {/* Zona de Perigo */}
                <section className="bg-red-500/5 border border-red-500/20 rounded-3xl p-8 shadow-2xl space-y-6 backdrop-blur-md">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-red-500/10 rounded-xl flex items-center justify-center text-red-500">
                            <Trash2 size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold italic tracking-tight uppercase text-red-500">Zona de Perigo</h2>
                            <p className="text-sm text-gray-400">Ações irreversíveis sobre sua conta.</p>
                        </div>
                    </div>

                    <p className="text-sm text-gray-400 max-w-lg font-medium leading-relaxed">
                        Ao excluir sua conta, você perderá acesso a todos os seus cursos adquiridos, certificados e progresso de forma definitiva.
                    </p>

                    <DeleteAccountButton />
                </section>
            </div>
        </div>
    )
}
