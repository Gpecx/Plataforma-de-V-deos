"use client"

import { useState, useEffect } from 'react'
import { auth } from '@/lib/firebase'
import { onAuthStateChanged, updatePassword, EmailAuthProvider, reauthenticateWithCredential, multiFactor, TotpMultiFactorGenerator, TotpSecret } from 'firebase/auth'
import { useRouter } from 'next/navigation'
import { Settings, DollarSign, Bell, Shield, Wallet, Save, Key, Trash2, ShieldCheck } from 'lucide-react'
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

    const [showMFAEnroll, setShowMFAEnroll] = useState(false)
    const [mfaSecret, setMfaSecret] = useState<TotpSecret | null>(null)
    const [mfaCode, setMfaCode] = useState("")
    const [isEnrollingMFA, setIsEnrollingMFA] = useState(false)
    const [mfaError, setMfaError] = useState("")
    const [isMFAActive, setIsMFAActive] = useState(false)

    const showNotification = useCartStore(state => state.showNotification)

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                setUser(user)
                setIsMFAActive(multiFactor(user).enrolledFactors.length > 0)
            }
            setLoading(false)
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

    const handleStartMFAEnroll = async () => {
        if (!user.emailVerified) {
            showNotification('Verifique seu e-mail antes de ativar o 2FA.', 'error')
            return
        }

        try {
            const secret = await TotpMultiFactorGenerator.generateSecret(user)
            setMfaSecret(secret)
            setShowMFAEnroll(true)
        } catch (error) {
            console.error("MFA Secret Generation Error:", error)
            showNotification('Erro ao gerar segredo do 2FA. Tente reautenticar.', 'error')
        }
    }

    const handleConfirmMFAEnroll = async () => {
        if (!mfaSecret || mfaCode.length < 6) return

        setIsEnrollingMFA(true)
        setMfaError("")
        try {
            const assertion = TotpMultiFactorGenerator.assertionForEnrollment(mfaSecret, mfaCode)
            console.log("Tentando inscrever Professor no MFA...")
            await multiFactor(user).enroll(assertion, 'Authenticator App')
            
            // Força a atualização do token e recarga
            console.log("Inscrição enviada (Teacher). Sincronizando...")
            await user.getIdToken(true)
            await reload(user)
            
            const factors = multiFactor(auth.currentUser!).enrolledFactors
            console.log("MFA Inscribed (Teacher)! Fatores detectados:", factors)

            setIsMFAActive(factors.length > 0)
            setShowMFAEnroll(false)
            setMfaSecret(null)
            setMfaCode("")
            showNotification('2FA ativado com sucesso!', 'success')
        } catch (error: any) {
            console.error("MFA Enrollment Error (Teacher):", error)
            setMfaError("Código inválido. Tente novamente.")
        } finally {
            setIsEnrollingMFA(false)
        }
    }

    const handleDisableMFA = async () => {
        if (!confirm("Tem certeza que deseja desativar o 2FA?")) return

        try {
            const mfaUser = multiFactor(user)
            const enrollment = mfaUser.enrolledFactors[0]
            await mfaUser.unenroll(enrollment)
            setIsMFAActive(false)
            showNotification('2FA desativado.', 'info')
        } catch (error) {
            console.error("MFA Unenroll Error:", error)
            showNotification('Erro ao desativar 2FA.', 'error')
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
        <div className="min-h-screen bg-transparent p-8 md:p-12 space-y-16 font-montserrat border-t border-black pb-32">
            <header className="max-w-6xl mx-auto">
                <div className="flex items-center gap-3 mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-[5px] text-[#1D5F31]">WORKSPACE SETTINGS</span>
                </div>
                <h1 className="text-2xl md:text-3xl font-bold tracking-tighter text-slate-900 max-w-4xl">
                    CONFIGURAÇÕES DO <span className="text-[#1D5F31] uppercase">TEACHER</span>
                </h1>
                <p className="text-sm text-slate-500 mt-2 font-medium tracking-tight">Gerencie suas preferências de faturamento e alertas de sistema.</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
                {/* Configurações Financeiras - rounded-xl */}
                <section className="bg-white border border-black rounded-xl p-10 shadow-sm space-y-10">
                    <div className="flex items-center gap-4">
                        <div className="p-4 bg-slate-50 rounded-xl text-[#1D5F31] border border-black">
                            <Wallet size={24} strokeWidth={2.5} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold uppercase tracking-tight text-slate-900 leading-none">Dados de Saída</h2>
                            <p className="text-sm font-medium tracking-tight text-slate-500 mt-2">Como você recebe seus lucros.</p>
                        </div>
                    </div>

                    <div className="space-y-8">
                        <div className="space-y-3">
                            <label className="text-sm font-bold uppercase tracking-tight text-slate-900 px-1">Chave PIX Estratégica</label>
                            <div className="relative group">
                                <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#1D5F31] transition-colors" size={20} />
                                <Input
                                    value={pixKey}
                                    onChange={(e) => setPixKey(e.target.value)}
                                    placeholder="CPF, E-mail ou Chave Aleatória"
                                    className="bg-slate-50 border-black rounded-xl pl-12 h-14 focus:border-[#1D5F31] focus:ring-4 focus:ring-[#1D5F31]/5 font-bold text-sm text-slate-900 placeholder:text-slate-400"
                                />
                            </div>
                            <p className="text-sm text-slate-500 font-medium px-1">As comissões de vendas serão auditadas e enviadas para esta chave.</p>
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
                            <h2 className="text-xl font-bold uppercase tracking-tight text-slate-900 leading-none">Alertas Digitais</h2>
                            <p className="text-sm font-medium tracking-tight text-slate-500 mt-2">Fique por dentro de cada nova venda.</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-6 bg-slate-50 rounded-xl border border-black hover:border-black/30 transition-all">
                            <div>
                                <h3 className="text-sm font-bold uppercase tracking-tight text-slate-900">Relatórios de Performance</h3>
                                <p className="text-sm text-slate-500 font-medium mt-1">Resumo semanal do ecossistema por e-mail.</p>
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
                                <h3 className="text-sm font-bold uppercase tracking-tight text-slate-900">Novos Leads e Alunos</h3>
                                <p className="text-sm text-slate-500 font-medium mt-1">Push notifications em tempo real.</p>
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
                            <h2 className="text-xl font-bold uppercase tracking-tight text-slate-900 leading-none">Protocolos de Acesso</h2>
                            <p className="text-sm font-medium tracking-tight text-slate-500 mt-2">Proteção de dados e soberania da conta.</p>
                        </div>
                    </div>

                    <form onSubmit={handleUpdatePassword} className="space-y-8 relative z-10">
                        {needsReauth && (
                            <div className="max-w-md space-y-3 animate-in fade-in slide-in-from-top-2">
                                <label className="text-sm font-bold uppercase tracking-tight text-slate-900 px-1 flex items-center gap-2">
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
                                <h3 className="text-sm font-bold uppercase tracking-tight text-slate-900 px-1">Redefinição de Credenciais</h3>
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
                                    className="border-black text-slate-600 hover:bg-slate-50 hover:text-slate-900 h-14 px-8 rounded-xl font-bold uppercase tracking-[2px] text-[10px] transition-all gap-2"
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

                    <div className="mt-12 pt-10 border-t border-slate-100 relative z-10">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div className="space-y-1">
                                <h3 className="font-bold uppercase text-lg !text-black flex items-center gap-2">
                                    <ShieldCheck size={20} className="text-[#1D5F31]" />
                                    Autenticação em Duas Etapas (2FA)
                                </h3>
                                <p className="text-sm font-medium tracking-tight text-slate-500">Aumente a segurança do seu workspace de instrutor.</p>
                            </div>
                            
                            {isMFAActive ? (
                                <Button onClick={handleDisableMFA} variant="outline" className="border-red-200 text-red-600 hover:bg-red-50 font-bold uppercase rounded-xl h-14 px-8 transition-all">Desativar 2FA</Button>
                            ) : (
                                <Button onClick={handleStartMFAEnroll} variant="outline" className="border-black text-[#1D5F31] hover:bg-slate-50 font-bold uppercase rounded-xl h-14 px-8 transition-all">Ativar 2FA</Button>
                            )}
                        </div>

                        {showMFAEnroll && mfaSecret && (
                            <div className="mt-8 p-6 bg-slate-50 border border-slate-100 rounded-2xl animate-in zoom-in-95 duration-200">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                                    <div className="flex flex-col items-center justify-center p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
                                        <img 
                                            src={`https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(mfaSecret.generateQrCodeUrl(user.email!, 'PowerPlay Teacher'))}&size=200x200`} 
                                            alt="QR Code 2FA" 
                                            className="w-[180px] h-[180px]"
                                        />
                                        <p className="text-[9px] font-bold text-slate-400 mt-4 uppercase tracking-widest text-center">Escaneie com seu App de Autenticação</p>
                                    </div>
                                    
                                    <div className="space-y-6">
                                        <div className="space-y-1.5">
                                            <label className="text-sm font-bold uppercase tracking-tight text-slate-900 px-1">Código de Confirmação</label>
                                            <Input 
                                                value={mfaCode}
                                                onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, ''))}
                                                maxLength={6}
                                                className="bg-white border-black rounded-xl h-14 text-slate-900 placeholder:text-slate-400 font-bold text-center text-xl tracking-widest focus:border-[#1D5F31]" 
                                                placeholder="000000" 
                                            />
                                            {mfaError && <p className="text-[10px] font-bold text-red-600 uppercase mt-1 px-1">{mfaError}</p>}
                                        </div>
                                        <div className="flex flex-col gap-3">
                                            <Button 
                                                onClick={handleConfirmMFAEnroll}
                                                disabled={isEnrollingMFA || mfaCode.length < 6}
                                                className="bg-[#1D5F31] text-white font-bold uppercase rounded-xl h-14 transition-all w-full"
                                            >
                                                {isEnrollingMFA ? 'Processando...' : 'Confirmar e Ativar'}
                                            </Button>
                                            <button onClick={() => setShowMFAEnroll(false)} className="text-[10px] font-bold uppercase text-slate-500 hover:text-black transition-colors">Cancelar Setup</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </section>

                {/* Zona de Perigo - rounded-xl */}
                <section className="bg-red-50 border border-black rounded-xl p-10 shadow-sm space-y-8 lg:col-span-2">
                    <div className="flex items-center gap-4">
                        <div className="p-4 bg-white border border-black rounded-xl text-red-500 shadow-sm">
                            <Trash2 size={24} strokeWidth={2.5} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold uppercase tracking-tight text-red-600 leading-none">Zona de Perigo</h2>
                            <p className="text-sm font-medium tracking-tight text-red-500/80 mt-2">Ações irreversíveis sobre sua conta e cursos criados.</p>
                        </div>
                    </div>

                    <p className="text-sm text-red-600/70 max-w-2xl font-bold uppercase tracking-tight leading-relaxed bg-white p-6 rounded-xl border border-black">
                        AVISO: Ao excluir sua conta, todos os seus cursos, matrículas de alunos e dados financeiros serão removidos permanentemente. Esta ação não pode ser desfeita.
                    </p>

                    <DeleteAccountButton />
                </section>
            </div>

            <div className="flex justify-end pt-8 max-w-6xl mx-auto">
                <Button className="bg-[#1D5F31] text-white font-bold uppercase tracking-[3px] h-14 px-12 rounded-xl hover:bg-[#28b828] shadow-xl shadow-[#1D5F31]/20 transition-all gap-4 animate-in fade-in slide-in-from-bottom-4 text-[11px]">
                    <Save size={18} strokeWidth={3} />
                    Salvar Todas Alterações
                </Button>
            </div>
        </div>
    )
}