"use client"

import { auth } from '@/lib/firebase'
import { onAuthStateChanged, updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Lock, CreditCard, Trash2, ArrowLeft, Save, Key } from 'lucide-react'
import Link from 'next/link'
import DeleteAccountButton from '@/components/DeleteAccountButton'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useCartStore } from '@/store/useCartStore'

export default function SettingsPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [user, setUser] = useState<any>(null)
    const [pixKey, setPixKey] = useState('')
    const [bank, setBank] = useState('')

    // States para troca de senha
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [currentPassword, setCurrentPassword] = useState('')
    const [isUpdatingPassword, setIsUpdatingPassword] = useState(false)
    const [needsReauth, setNeedsReauth] = useState(false)

    const showNotification = useCartStore(state => state.showNotification)

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (!user) {
                router.push('/login')
            } else {
                setUser(user)
                setLoading(false)
            }
        })
        return () => unsubscribe()
    }, [router])

    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault()

        if (newPassword !== confirmPassword) {
            showNotification('As senhas não coincidem', 'error')
            return
        }

        if (newPassword.length < 6) {
            showNotification('A senha deve ter pelo menos 6 caracteres', 'error')
            return
        }

        setIsUpdatingPassword(true)

        try {
            if (user) {
                // Se o usuário precisa se reautenticar (currentPassword preenchida)
                if (currentPassword) {
                    const credential = EmailAuthProvider.credential(user.email!, currentPassword)
                    await reauthenticateWithCredential(user, credential)
                    setNeedsReauth(false)
                }

                await updatePassword(user, newPassword)
                showNotification('Senha atualizada com sucesso!', 'success')
                setNewPassword('')
                setConfirmPassword('')
                setCurrentPassword('')
            }
        } catch (error: any) {
            console.error("Erro ao atualizar senha:", error)

            if (error.code === 'auth/requires-recent-login') {
                setNeedsReauth(true)
                showNotification('Para sua segurança, confirme sua senha atual antes de prosseguir.', 'info')
            } else if (error.code === 'auth/wrong-password') {
                showNotification('Senha atual incorreta.', 'error')
            } else {
                showNotification('Erro ao atualizar senha: ' + (error.message || 'Erro desconhecido'), 'error')
            }
        } finally {
            setIsUpdatingPassword(false)
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#F5F7FA]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#00C402]"></div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#F5F7FA] font-exo p-8 md:p-12 border-t border-slate-100">
            <div className="max-w-4xl mx-auto space-y-12">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-black tracking-tighter uppercase mb-1 text-slate-900 leading-none">
                            Configurações <span className="text-[#00C402]">Gerais</span>
                        </h1>
                        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[3px]">Gerencie sua segurança e dados de pagamento.</p>
                    </div>
                    <Link
                        href="/dashboard-student"
                        className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 transition group bg-white px-5 py-3 rounded-xl border border-slate-100 shadow-sm"
                    >
                        <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
                        Voltar
                    </Link>
                </div>

                <div className="grid grid-cols-1 gap-12">
                    {/* Segurança / Senha */}
                    <section className="bg-white border border-slate-100 rounded-[32px] p-8 md:p-10 shadow-sm space-y-8">
                        <div className="flex items-center gap-5">
                            <div className="w-14 h-14 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center text-slate-900 shadow-sm">
                                <Lock size={20} />
                            </div>
                            <div>
                                <h2 className="text-lg font-black tracking-tighter uppercase text-slate-900">Segurança da Conta</h2>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[2px]">Atualize sua senha de acesso.</p>
                            </div>
                        </div>

                        <form onSubmit={handleUpdatePassword} className="space-y-6">
                            {needsReauth && (
                                <div className="max-w-md space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-[#00C402] px-1 flex items-center gap-2">
                                        <Key size={12} />
                                        Senha Atual Necessária
                                    </label>
                                    <Input
                                        type="password"
                                        value={currentPassword}
                                        onChange={(e) => setCurrentPassword(e.target.value)}
                                        className="bg-[#00C402]/5 border-[#00C402]/20 focus:border-[#00C402] focus:ring-[#00C402] rounded-xl h-14 text-sm font-medium transition-all"
                                        placeholder="Confirme sua senha atual"
                                        required
                                    />
                                </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Nova Senha</label>
                                    <Input
                                        type="password"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        className="bg-slate-50 border-slate-100 focus:border-[#00C402] focus:ring-[#00C402] rounded-xl h-14 text-sm font-medium transition-all"
                                        placeholder="Mínimo 6 caracteres"
                                        required
                                        minLength={6}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Confirmar Senha</label>
                                    <Input
                                        type="password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="bg-slate-50 border-slate-100 focus:border-[#00C402] focus:ring-[#00C402] rounded-xl h-14 text-sm font-medium transition-all"
                                        placeholder="Repita a nova senha"
                                        required
                                        minLength={6}
                                    />
                                </div>
                            </div>

                            <Button
                                type="submit"
                                disabled={isUpdatingPassword}
                                className="bg-slate-900 hover:bg-slate-800 text-white font-black uppercase tracking-[2px] rounded-xl px-10 h-14 shadow-lg shadow-slate-100 transition-all flex items-center justify-center gap-2"
                            >
                                {isUpdatingPassword ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <Save size={18} />
                                )}
                                {needsReauth ? 'Confirmar e Atualizar' : 'Atualizar Senha'}
                            </Button>
                        </form>
                    </section>

                    {/* Dados Bancários */}
                    <section className="bg-white border border-slate-100 rounded-[32px] p-8 md:p-10 shadow-sm space-y-8">
                        <div className="flex items-center gap-5">
                            <div className="w-14 h-14 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center text-slate-900 shadow-sm">
                                <CreditCard size={20} />
                            </div>
                            <div>
                                <h2 className="text-lg font-black tracking-tighter uppercase text-slate-900">Dados Bancários</h2>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[2px]">Para recebimento de reembolsos ou parcerias.</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Chave PIX</label>
                                <Input
                                    type="text"
                                    value={pixKey}
                                    onChange={(e) => setPixKey(e.target.value)}
                                    className="bg-slate-50 border-slate-100 focus:border-[#00C402] focus:ring-[#00C402] rounded-xl h-14 text-sm font-medium transition-all"
                                    placeholder="CPF, Email ou Aleatória"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Banco</label>
                                <Input
                                    type="text"
                                    value={bank}
                                    onChange={(e) => setBank(e.target.value)}
                                    className="bg-slate-50 border-slate-100 focus:border-[#00C402] focus:ring-[#00C402] rounded-xl h-14 text-sm font-medium transition-all"
                                    placeholder="Ex: Nubank, Itaú..."
                                />
                            </div>
                        </div>
                        <Button
                            className="bg-white hover:bg-slate-50 border border-slate-100 text-slate-900 font-black uppercase tracking-[2px] rounded-xl px-10 h-14 shadow-sm transition-all"
                        >
                            Salvar Dados
                        </Button>
                    </section>

                    {/* Zona de Perigo */}
                    <section className="bg-red-50 border border-red-100 rounded-[32px] p-8 md:p-10 shadow-sm space-y-8">
                        <div className="flex items-center gap-5">
                            <div className="w-14 h-14 bg-white border border-red-100 rounded-2xl flex items-center justify-center text-red-500 shadow-sm">
                                <Trash2 size={20} />
                            </div>
                            <div>
                                <h2 className="text-lg font-black tracking-tighter uppercase text-red-500">Zona de Perigo</h2>
                                <p className="text-[10px] text-red-400/80 font-bold uppercase tracking-[2px]">Ações irreversíveis sobre sua conta.</p>
                            </div>
                        </div>

                        <p className="text-[11px] text-red-600/70 max-w-lg font-bold uppercase tracking-wider leading-relaxed bg-white/50 p-4 rounded-xl border border-red-100/50">
                            Ao excluir sua conta, você perderá acesso a todos os seus cursos adquiridos, certificados e progresso de forma definitiva.
                        </p>

                        <DeleteAccountButton />
                    </section>
                </div>
            </div>
        </div>
    )
}

