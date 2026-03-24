"use client"

import { useState, useEffect } from 'react'
import { auth } from '@/lib/firebase'
import { onAuthStateChanged, updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth'
import { useRouter } from 'next/navigation'
import { Settings, DollarSign, Bell, Shield, Wallet, Save, Key, Trash2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useCartStore } from '@/store/useCartStore'
import DeleteAccountButton from '@/components/DeleteAccountButton'

export default function TeacherSettingsPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [user, setUser] = useState<any>(null)
    const [pixKey, setPixKey] = useState('')
    const [emailEnabled, setEmailEnabled] = useState(true)
    const [browserEnabled, setBrowserEnabled] = useState(false)

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
                showNotification('Para sua segurança, confirme sua senha atual.', 'info')
            } else if (error.code === 'auth/wrong-password') {
                showNotification('Senha atual incorreta.', 'error')
            } else {
                showNotification('Erro ao atualizar senha', 'error')
            }
        } finally {
            setIsUpdatingPassword(false)
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-transparent">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#1D5F31]"></div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-transparent p-8 md:p-12 space-y-16 font-exo border-t border-black pb-32">
            <header className="max-w-6xl mx-auto">
                <div className="flex items-center gap-3 mb-2">
                    <span className="text-[10px] font-black uppercase tracking-[5px] text-[#1D5F31]">WORKSPACE SETTINGS</span>
                </div>
                <h1 className="text-4xl font-black tracking-tighter text-slate-900">
                    CONFIGURAÇÕES DO <span className="text-[#1D5F31] uppercase">TEACHER</span>
                </h1>
                <p className="text-slate-600 mt-2 font-semibold text-xs tracking-widest uppercase">Gerencie suas preferências de faturamento e alertas de sistema.</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
                {/* Configurações Financeiras - rounded-xl */}
                <section className="bg-white border border-black rounded-xl p-10 shadow-sm space-y-10">
                    <div className="flex items-center gap-4">
                        <div className="p-4 bg-slate-50 rounded-xl text-[#1D5F31] border border-black">
                            <Wallet size={24} strokeWidth={2.5} />
                        </div>
                        <div>
                            <h2 className="text-xl font-black uppercase tracking-tighter text-slate-900 leading-none">Dados de Saída</h2>
                            <p className="text-[10px] font-bold uppercase tracking-[2px] text-slate-600 mt-2">Como você recebe seus lucros.</p>
                        </div>
                    </div>

                    <div className="space-y-8">
                        <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase tracking-[3px] text-slate-900 px-1">Chave PIX Estratégica</label>
                            <div className="relative group">
                                <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#1D5F31] transition-colors" size={20} />
                                <Input
                                    value={pixKey}
                                    onChange={(e) => setPixKey(e.target.value)}
                                    placeholder="CPF, E-mail ou Chave Aleatória"
                                    className="bg-slate-50 border-black rounded-xl pl-12 h-14 focus:border-[#1D5F31] focus:ring-4 focus:ring-[#1D5F31]/5 font-bold text-sm text-slate-900 placeholder:text-slate-400"
                                />
                            </div>
                            <p className="text-[9px] text-slate-600 font-medium italic px-1">As comissões de vendas serão auditadas e enviadas para esta chave.</p>
                        </div>
                    </div>
                </section>

                {/* Notificações - rounded-xl */}
                <section className="bg-white border border-black rounded-xl p-10 shadow-sm space-y-10">
                    <div className="flex items-center gap-4">
                        <div className="p-4 bg-slate-50 rounded-xl text-[#1D5F31] border border-black">
                            <Bell size={24} strokeWidth={2.5} />
                        </div>
                        <div>
                            <h2 className="text-xl font-black uppercase tracking-tighter text-slate-900 leading-none">Alertas Digitais</h2>
                            <p className="text-[10px] font-bold uppercase tracking-[2px] text-slate-600 mt-2">Fique por dentro de cada nova venda.</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-6 bg-slate-50 rounded-xl border border-black hover:border-black/30 transition-all">
                            <div>
                                <h3 className="text-xs font-black uppercase tracking-widest text-slate-900">Relatórios de Performance</h3>
                                <p className="text-[10px] text-slate-600 font-medium mt-1">Resumo semanal do ecossistema por e-mail.</p>
                            </div>
                            <button
                                onClick={() => setEmailEnabled(!emailEnabled)}
                                className={`w-12 h-6 rounded-xl transition-all relative ${emailEnabled ? 'bg-[#1D5F31]' : 'bg-slate-200 shadow-inner'}`}
                            >
                                <div className={`absolute top-1 w-4 h-4 rounded-xl bg-white transition-all shadow-md ${emailEnabled ? 'right-1' : 'left-1'}`}></div>
                            </button>
                        </div>

                        <div className="flex items-center justify-between p-6 bg-slate-50 rounded-xl border border-black hover:border-black/30 transition-all">
                            <div>
                                <h3 className="text-xs font-black uppercase tracking-widest text-slate-900">Novos Leads e Alunos</h3>
                                <p className="text-[10px] text-slate-600 font-medium mt-1">Push notifications em tempo real.</p>
                            </div>
                            <button
                                onClick={() => setBrowserEnabled(!browserEnabled)}
                                className={`w-12 h-6 rounded-xl transition-all relative ${browserEnabled ? 'bg-[#1D5F31]' : 'bg-slate-200 shadow-inner'}`}
                            >
                                <div className={`absolute top-1 w-4 h-4 rounded-xl bg-white transition-all shadow-md ${browserEnabled ? 'right-1' : 'left-1'}`}></div>
                            </button>
                        </div>
                    </div>
                </section>

                {/* Segurança - rounded-xl */}
                <section className="bg-white border border-black rounded-xl p-10 shadow-sm space-y-10 lg:col-span-2 relative overflow-hidden group">
                    <div className="flex items-center gap-4 relative z-10">
                        <div className="p-4 bg-slate-50 rounded-xl text-[#1D5F31] border border-black">
                            <Shield size={24} strokeWidth={2.5} />
                        </div>
                        <div>
                            <h2 className="text-xl font-black uppercase tracking-tighter text-slate-900 leading-none">Protocolos de Acesso</h2>
                            <p className="text-[10px] font-bold uppercase tracking-[2px] text-slate-600 mt-2">Proteção de dados e soberania da conta.</p>
                        </div>
                    </div>

                    <form onSubmit={handleUpdatePassword} className="space-y-8 relative z-10">
                        {needsReauth && (
                            <div className="max-w-md space-y-3 animate-in fade-in slide-in-from-top-2">
                                <label className="text-[10px] font-black uppercase tracking-[3px] text-slate-900 px-1 flex items-center gap-2">
                                    <Key size={14} />
                                    Senha Atual Necessária
                                </label>
                                <Input
                                    type="password"
                                    value={currentPassword}
                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                    placeholder="Confirme sua senha atual"
                                    className="bg-slate-50 border-black h-14 rounded-xl text-slate-900 focus:border-[#1D5F31] font-bold text-sm placeholder:text-slate-400"
                                    required
                                />
                            </div>
                        )}

                        <div className="flex flex-col md:flex-row gap-8">
                            <div className="flex-grow space-y-6">
                                <h3 className="text-[10px] font-black uppercase tracking-[3px] text-slate-900 px-1">Redefinição de Credenciais</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <Input
                                        type="password"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        placeholder="Nova senha master"
                                        className="bg-slate-50 border-black h-14 rounded-xl text-slate-900 focus:border-[#1D5F31] placeholder:text-slate-400 font-bold text-sm"
                                        required
                                        minLength={6}
                                    />
                                    <Input
                                        type="password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        placeholder="Confirmar nova senha"
                                        className="bg-slate-50 border-black h-14 rounded-xl text-slate-900 focus:border-[#1D5F31] placeholder:text-slate-400 font-bold text-sm"
                                        required
                                        minLength={6}
                                    />
                                </div>
                            </div>
                            <div className="flex items-end">
                                <Button
                                    type="submit"
                                    disabled={isUpdatingPassword}
                                    variant="outline"
                                    className="border-black text-slate-600 hover:bg-slate-50 hover:text-slate-900 h-14 px-8 rounded-xl font-black uppercase tracking-[2px] text-[10px] transition-all gap-2"
                                >
                                    {isUpdatingPassword ? (
                                        <div className="w-4 h-4 border-2 border-slate-200 border-t-[#1D5F31] rounded-xl animate-spin" />
                                    ) : (
                                        <Save size={16} />
                                    )}
                                    {needsReauth ? 'Confirmar Mudança' : 'Sincronizar Acesso'}
                                </Button>
                            </div>
                        </div>
                    </form>
                </section>

                {/* Zona de Perigo - rounded-xl */}
                <section className="bg-red-50 border border-black rounded-xl p-10 shadow-sm space-y-8 lg:col-span-2">
                    <div className="flex items-center gap-4">
                        <div className="p-4 bg-white border border-black rounded-xl text-red-500 shadow-sm">
                            <Trash2 size={24} strokeWidth={2.5} />
                        </div>
                        <div>
                            <h2 className="text-xl font-black uppercase tracking-tighter text-red-600 leading-none">Zona de Perigo</h2>
                            <p className="text-[10px] font-bold uppercase tracking-[2px] text-red-500/80 mt-2">Ações irreversíveis sobre sua conta e cursos criados.</p>
                        </div>
                    </div>

                    <p className="text-[11px] text-red-600/70 max-w-2xl font-bold uppercase tracking-wider leading-relaxed bg-white p-6 rounded-xl border border-black">
                        AVISO: Ao excluir sua conta, todos os seus cursos, matrículas de alunos e dados financeiros serão removidos permanentemente. Esta ação não pode ser desfeita.
                    </p>

                    <DeleteAccountButton />
                </section>
            </div>

            <div className="flex justify-end pt-8 max-w-6xl mx-auto">
                <Button className="bg-[#1D5F31] text-white font-black uppercase tracking-[3px] h-14 px-12 rounded-xl hover:bg-[#28b828] shadow-xl shadow-[#1D5F31]/20 transition-all gap-4 animate-in fade-in slide-in-from-bottom-4 text-[11px]">
                    <Save size={18} strokeWidth={3} />
                    Salvar Todas Alterações
                </Button>
            </div>
        </div>
    )
}