"use client"

import { useState, useEffect } from 'react'
import { useActionState } from 'react'
import { auth } from '@/lib/firebase'
import { onAuthStateChanged, updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth'
import { useRouter } from 'next/navigation'
import { Settings, DollarSign, Bell, Shield, Wallet, Save, Key, Trash2, MapPin, Eye, EyeOff } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useCartStore } from '@/store/useCartStore'
import DeleteAccountButton from '@/components/DeleteAccountButton'
import { updateTeacherSettings, getTeacherProfile } from '../profile/actions'

const initialState: { success: boolean; error?: string } = {
    success: false,
    error: undefined
}

interface AddressData {
    logradouro?: string
    numero?: string
    bairro?: string
    cidade?: string
    estado?: string
    cep?: string
}

function maskPhone(value: string): string {
    const digits = value.replace(/\D/g, '').slice(0, 11)
    if (digits.length <= 10) {
        return digits
            .replace(/^(\d{2})(\d)/, '($1) $2')
            .replace(/(\d{4})(\d)/, '$1-$2')
    }
    return digits
        .replace(/^(\d{2})(\d)/, '($1) $2')
        .replace(/(\d{5})(\d)/, '$1-$2')
}

export default function TeacherSettingsPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [user, setUser] = useState<any>(null)
    const [phone, setPhone] = useState('')
    const [pixKey, setPixKey] = useState('')
    const [bankName, setBankName] = useState('')
    const [bankAgency, setBankAgency] = useState('')
    const [bankAccount, setBankAccount] = useState('')
    const [bankAccountType, setBankAccountType] = useState('')
    const [addressData, setAddressData] = useState<AddressData>({})
    const [state, formAction, isPending] = useActionState(updateTeacherSettings, initialState)

    const [emailEnabled, setEmailEnabled] = useState(true)
    const [browserEnabled, setBrowserEnabled] = useState(false)
    const [isLoadingCep, setIsLoadingCep] = useState(false)

    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [currentPassword, setCurrentPassword] = useState('')
    const [isUpdatingPassword, setIsUpdatingPassword] = useState(false)
    const [needsReauth, setNeedsReauth] = useState(false)

    const [showCurrentPassword, setShowCurrentPassword] = useState(false)
    const [showNewPassword, setShowNewPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)



    const showNotification = useCartStore(state => state.showNotification)

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                setUser(user)


                try {
                    const result = await getTeacherProfile()
                    if (result.success && result.data) {
                        setPhone(result.data.phone || '')
                        setPixKey(result.data.pix_key || '')
                        setBankName(result.data.bank_name || '')
                        setBankAgency(result.data.bank_agency || '')
                        setBankAccount(result.data.bank_account || '')
                        setBankAccountType(result.data.bank_account_type || '')
                        setAddressData({
                            logradouro: result.data.logradouro || '',
                            numero: result.data.numero || '',
                            bairro: result.data.bairro || '',
                            cidade: result.data.cidade || '',
                            estado: result.data.estado || '',
                            cep: result.data.cep || ''
                        })
                    }
                } catch (error) {
                    console.error('Erro ao carregar dados:', error)
                }
            }
            setLoading(false)
        })
        return () => unsubscribe()
    }, [router])

    const handleCepBlur = async (cep: string) => {
        const cleanCep = cep.replace(/\D/g, '')
        if (cleanCep.length !== 8) return

        setIsLoadingCep(true)
        try {
            const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`)
            const data = await response.json()

            if (!data.erro) {
                setAddressData(prev => ({
                    ...prev,
                    logradouro: data.logradouro || '',
                    bairro: data.bairro || '',
                    cidade: data.localidade || '',
                    estado: data.uf || '',
                    cep: cleanCep
                }))
            }
        } catch (error) {
            console.error('Erro ao buscar CEP:', error)
        } finally {
            setIsLoadingCep(false)
        }
    }

    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!currentPassword) {
            showNotification('Digite sua senha atual para confirmar a alteração.', 'error')
            return
        }

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
                // Protocolo 1: Reautenticação Obrigatória
                const credential = EmailAuthProvider.credential(user.email!, currentPassword)
                await reauthenticateWithCredential(user, credential)
                
                // Protocolo 2: Update Silencioso
                await updatePassword(user, newPassword)

                // Protocolo: Sincronização de Sessão (Server-side)
                // Após a troca da senha, o idToken muda. Precisamos atualizar o cookie de sessão.
                const newToken = await user.getIdToken(true)
                await fetch('/api/auth/session', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ idToken: newToken })
                })

                // Feedback Visual de Sucesso (#1D5F31)
                showNotification('Senha atualizada com sucesso!', 'success')
                
                // Limpeza de campos
                setNewPassword('')
                setConfirmPassword('')
                setCurrentPassword('')
                setNeedsReauth(false)
            }
        } catch (error: any) {
            console.error("Erro ao atualizar senha:", error)

            // Protocolo 3: Tratamento de Erros sem Redirecionamento Punitivo
            if (error.code === 'auth/wrong-password') {
                showNotification('Senha atual incorreta.', 'error')
            } else if (error.code === 'auth/requires-recent-login') {
                setNeedsReauth(true)
                showNotification('Para sua segurança, confirme sua senha atual.', 'info')
            } else {
                showNotification('Erro ao atualizar senha. Tente novamente.', 'error')
            }
            // Mantenha o usuário na tela; sem router.push ou setUser(null)
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
        <div className="min-h-screen bg-[#F0F2F5] p-8 md:p-12 space-y-16 font-montserrat pb-32">
            <header className="max-w-6xl mx-auto">
                <div className="flex items-center gap-3 mb-2">

                </div>
                <h1 className="text-2xl md:text-3xl font-bold tracking-tighter text-slate-900 max-w-4xl">
                    CONFIGURAÇÕES DO <span className="text-[#1D5F31] uppercase">TEACHER</span>
                </h1>
                <p className="text-sm text-slate-500 mt-2 font-medium tracking-tight">Gerencie suas preferências de faturamento e alertas de sistema.</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
                {/* Dados Fiscais e Endereço - rounded-lg */}
                <section className="bg-white border border-gray-200 rounded-2xl p-10 shadow-sm space-y-10 lg:col-span-2">
                    <form action={formAction} className="space-y-10">
                        <div className="flex items-center gap-4">
                            <div className="p-4 bg-slate-50 rounded-lg text-[#1D5F31] border border-black/20">
                                <Wallet size={24} strokeWidth={2.5} />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold uppercase tracking-tight text-slate-900 leading-none">Dados de Saída</h2>
                                <p className="text-sm font-medium tracking-tight text-slate-500 mt-2">Como você recebe seus lucros.</p>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="space-y-3">
                                <label className="text-sm font-bold uppercase tracking-tight text-slate-900 px-1">Celular</label>
                                <div className="relative group">
                                    <Input
                                        name="phone"
                                        value={phone}
                                        onChange={(e) => setPhone(maskPhone(e.target.value))}
                                        placeholder="(00) 00000-0000"
                                        className="bg-slate-50 border-black/20 rounded-lg px-6 h-14 focus:border-[#1D5F31] focus:ring-4 focus:ring-[#1D5F31]/5 font-bold text-sm text-slate-900 placeholder:text-slate-400"
                                    />
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="text-sm font-bold uppercase tracking-tight text-slate-900 px-1">Chave PIX</label>
                                <div className="relative group">
                                    <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#1D5F31] transition-colors" size={20} />
                                    <Input
                                        name="pix_key"
                                        value={pixKey}
                                        onChange={(e) => setPixKey(e.target.value)}
                                        placeholder="CPF, E-mail ou Chave Aleatória"
                                        className="bg-slate-50 border-black/20 rounded-lg pl-12 h-14 focus:border-[#1D5F31] focus:ring-4 focus:ring-[#1D5F31]/5 font-bold text-sm text-slate-900 placeholder:text-slate-400"
                                    />
                                </div>
                            </div>

                            <div className="pt-6 border-t border-slate-100 space-y-6">
                                <div className="flex items-center gap-4 mb-2">
                                    <div className="p-3 bg-slate-50 rounded-lg text-[#1D5F31] border border-black/20">
                                        <Wallet size={20} strokeWidth={2.5} />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold uppercase tracking-tight text-slate-900 leading-none">Conta Bancária</h3>
                                        <p className="text-sm font-medium tracking-tight text-slate-500 mt-1">Para depósitos via transferência.</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-3">
                                        <label className="text-sm font-bold uppercase tracking-tight text-slate-900 px-1">Banco</label>
                                        <Input
                                            name="bank_name"
                                            value={bankName}
                                            onChange={(e) => setBankName(e.target.value)}
                                            placeholder="Ex: Nubank, Itaú..."
                                            className="bg-slate-50 border-black/20 rounded-lg px-6 h-14 focus:border-[#1D5F31] focus:ring-4 focus:ring-[#1D5F31]/5 font-bold text-sm text-slate-900 placeholder:text-slate-400"
                                        />
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-sm font-bold uppercase tracking-tight text-slate-900 px-1">Tipo de Conta</label>
                                        <select
                                            name="bank_account_type"
                                            value={bankAccountType}
                                            onChange={(e) => setBankAccountType(e.target.value)}
                                            className="w-full bg-slate-50 border border-black/20 rounded-lg px-6 h-14 focus:border-[#1D5F31] focus:ring-4 focus:ring-[#1D5F31]/5 font-bold text-sm text-slate-900 outline-none appearance-none"
                                        >
                                            <option value="">Selecione...</option>
                                            <option value="corrente">Conta Corrente</option>
                                            <option value="poupanca">Conta Poupança</option>
                                        </select>
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-sm font-bold uppercase tracking-tight text-slate-900 px-1">Agência</label>
                                        <Input
                                            name="bank_agency"
                                            value={bankAgency}
                                            onChange={(e) => setBankAgency(e.target.value)}
                                            placeholder="0001"
                                            className="bg-slate-50 border-black/20 rounded-lg px-6 h-14 focus:border-[#1D5F31] focus:ring-4 focus:ring-[#1D5F31]/5 font-bold text-sm text-slate-900 placeholder:text-slate-400"
                                        />
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-sm font-bold uppercase tracking-tight text-slate-900 px-1">Número da Conta</label>
                                        <Input
                                            name="bank_account"
                                            value={bankAccount}
                                            onChange={(e) => setBankAccount(e.target.value)}
                                            placeholder="000000-0"
                                            className="bg-slate-50 border-black/20 rounded-lg px-6 h-14 focus:border-[#1D5F31] focus:ring-4 focus:ring-[#1D5F31]/5 font-bold text-sm text-slate-900 placeholder:text-slate-400"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="pt-6 border-t border-slate-100">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="p-3 bg-slate-50 rounded-lg text-[#1D5F31] border border-black/20">
                                    <MapPin size={20} strokeWidth={2.5} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold uppercase tracking-tight text-slate-900 leading-none">Endereço</h3>
                                    <p className="text-sm font-medium tracking-tight text-slate-500 mt-1">Para emitância de notas fiscais.</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-3">
                                    <label className="text-sm font-bold uppercase tracking-tight text-slate-900 px-1">CEP {isLoadingCep && <span className="text-[#1D5F31] animate-pulse">buscando...</span>}</label>
                                    <div className="relative group">
                                        <MapPin className={`absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#1D5F31] transition-colors ${isLoadingCep ? 'animate-pulse' : ''}`} size={20} />
                                        <Input
                                            name="cep"
                                            value={addressData.cep || ''}
                                            onChange={(e) => setAddressData(prev => ({ ...prev, cep: e.target.value }))}
                                            onBlur={(e) => handleCepBlur(e.target.value)}
                                            disabled={isLoadingCep}
                                            placeholder="00000-000"
                                            className="bg-slate-50 border-black/20 rounded-lg pl-12 h-14 focus:border-[#1D5F31] focus:ring-4 focus:ring-[#1D5F31]/5 font-bold text-sm text-slate-900 placeholder:text-slate-400 disabled:opacity-50"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <label className="text-sm font-bold uppercase tracking-tight text-slate-900 px-1">Número</label>
                                    <div className="relative group">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" style={{ fontSize: '10px' }}>Nº</span>
                                        <Input
                                            name="numero"
                                            value={addressData.numero || ''}
                                            onChange={(e) => setAddressData(prev => ({ ...prev, numero: e.target.value }))}
                                            placeholder="Número"
                                            className="bg-slate-50 border-black/20 rounded-lg pl-12 h-14 focus:border-[#1D5F31] focus:ring-4 focus:ring-[#1D5F31]/5 font-bold text-sm text-slate-900 placeholder:text-slate-400"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-3 md:col-span-2">
                                    <label className="text-sm font-bold uppercase tracking-tight text-slate-900 px-1">Logradouro</label>
                                    <div className="relative group">
                                        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#1D5F31] transition-colors" size={20} />
                                        <Input
                                            name="logradouro"
                                            value={addressData.logradouro || ''}
                                            onChange={(e) => setAddressData(prev => ({ ...prev, logradouro: e.target.value }))}
                                            placeholder="Rua, Avenida..."
                                            className="bg-slate-50 border-black/20 rounded-lg pl-12 h-14 focus:border-[#1D5F31] focus:ring-4 focus:ring-[#1D5F31]/5 font-bold text-sm text-slate-900 placeholder:text-slate-400"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <label className="text-sm font-bold uppercase tracking-tight text-slate-900 px-1">Bairro</label>
                                    <div className="relative group">
                                        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#1D5F31] transition-colors" size={20} />
                                        <Input
                                            name="bairro"
                                            value={addressData.bairro || ''}
                                            onChange={(e) => setAddressData(prev => ({ ...prev, bairro: e.target.value }))}
                                            placeholder="Bairro"
                                            className="bg-slate-50 border-black/20 rounded-lg pl-12 h-14 focus:border-[#1D5F31] focus:ring-4 focus:ring-[#1D5F31]/5 font-bold text-sm text-slate-900 placeholder:text-slate-400"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <label className="text-sm font-bold uppercase tracking-tight text-slate-900 px-1">Cidade</label>
                                    <div className="relative group">
                                        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#1D5F31] transition-colors" size={20} />
                                        <Input
                                            name="cidade"
                                            value={addressData.cidade || ''}
                                            onChange={(e) => setAddressData(prev => ({ ...prev, cidade: e.target.value }))}
                                            placeholder="Cidade"
                                            className="bg-slate-50 border-black/20 rounded-lg pl-12 h-14 focus:border-[#1D5F31] focus:ring-4 focus:ring-[#1D5F31]/5 font-bold text-sm text-slate-900 placeholder:text-slate-400"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <label className="text-sm font-bold uppercase tracking-tight text-slate-900 px-1">Estado</label>
                                    <div className="relative group">
                                        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#1D5F31] transition-colors" size={20} />
                                        <Input
                                            name="estado"
                                            value={addressData.estado || ''}
                                            onChange={(e) => setAddressData(prev => ({ ...prev, estado: e.target.value }))}
                                            placeholder="UF"
                                            className="bg-slate-50 border-black/20 rounded-lg pl-12 h-14 focus:border-[#1D5F31] focus:ring-4 focus:ring-[#1D5F31]/5 font-bold text-sm text-slate-900 placeholder:text-slate-400"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {state?.success && (
                            <div className="flex items-center gap-2 p-4 bg-green-50 border border-green-200/40 rounded-lg text-green-700 text-sm font-bold uppercase tracking-widest animate-in fade-in slide-in-from-top-2">
                                <Save size={16} />
                                Dados atualizados com sucesso!
                            </div>
                        )}

                        {(state as any)?.error && (
                            <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200/40 rounded-lg text-red-700 text-sm font-bold uppercase tracking-widest animate-in fade-in slide-in-from-top-2">
                                {(state as any).error}
                            </div>
                        )}

                        <Button
                            type="submit"
                            disabled={isPending}
                            className="bg-[#1D5F31] text-white font-bold uppercase tracking-[3px] h-14 px-12 rounded-lg hover:bg-[#28b828] shadow-xl shadow-[#1D5F31]/20 transition-all gap-4 text-[11px]"
                        >
                            {isPending ? (
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-lg animate-spin" />
                            ) : (
                                <Save size={18} strokeWidth={3} />
                            )}
                            {isPending ? 'Salvando...' : 'Salvar Dados'}
                        </Button>
                        
                        <input type="hidden" name="notifications_email" value={emailEnabled ? 'on' : 'off'} />
                        <input type="hidden" name="notifications_push" value={browserEnabled ? 'on' : 'off'} />
                    </form>
                </section>

                {/* Segurança - rounded-lg */}
                <section className="bg-white border border-gray-200 rounded-2xl p-10 shadow-sm space-y-10 lg:col-span-2 relative overflow-hidden group">
                    <div className="flex items-center gap-4 relative z-10">
                        <div className="p-4 bg-slate-50 rounded-lg text-[#1D5F31] border border-black/20">
                            <Shield size={24} strokeWidth={2.5} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold uppercase tracking-tight text-slate-900 leading-none">Protocolos de Acesso</h2>
                            <p className="text-sm font-medium tracking-tight text-slate-500 mt-2">Proteção de dados e soberania da conta.</p>
                        </div>
                    </div>

                    <form onSubmit={handleUpdatePassword} className="space-y-8 relative z-10">
                        <div className="space-y-6">
                            <h3 className="text-sm font-bold uppercase tracking-tight text-slate-900 px-1">Redefinição de Credenciais</h3>
                            
                            <div className="space-y-3">
                                <label className="text-sm font-bold uppercase tracking-tight text-slate-900 px-1 flex items-center gap-2">
                                    <Key size={14} />
                                    Senha Atual
                                </label>
                                <div className="relative group">
                                    <Input
                                        type={showCurrentPassword ? 'text' : 'password'}
                                        value={currentPassword}
                                        onChange={(e) => setCurrentPassword(e.target.value)}
                                        placeholder="Digite sua senha atual"
                                        className="bg-slate-50 border-black/20 h-14 rounded-lg text-slate-900 focus:border-[#1D5F31] font-bold text-sm placeholder:text-slate-400 pr-12"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                    >
                                        {showCurrentPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-3">
                                    <label className="text-sm font-bold uppercase tracking-tight text-slate-900 px-1">Nova Senha</label>
                                    <div className="relative group">
                                        <Input
                                            type={showNewPassword ? 'text' : 'password'}
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            placeholder="Nova senha (mín. 6 chars)"
                                            className="bg-slate-50 border-black/20 h-14 rounded-lg text-slate-900 focus:border-[#1D5F31] placeholder:text-slate-400 font-bold text-sm pr-12"
                                            required
                                            minLength={6}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowNewPassword(!showNewPassword)}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                        >
                                            {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                        </button>
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <label className="text-sm font-bold uppercase tracking-tight text-slate-900 px-1">Confirmar Senha</label>
                                    <div className="relative group">
                                        <Input
                                            type={showConfirmPassword ? 'text' : 'password'}
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            placeholder="Repita a nova senha"
                                            className="bg-slate-50 border-black/20 h-14 rounded-lg text-slate-900 focus:border-[#1D5F31] placeholder:text-slate-400 font-bold text-sm pr-12"
                                            required
                                            minLength={6}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                        >
                                            {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-end">
                            <Button
                                type="submit"
                                disabled={isUpdatingPassword}
                                variant="outline"
                                className="border-black/20 text-slate-600 hover:bg-slate-50 hover:text-slate-900 h-14 px-8 rounded-lg font-bold uppercase tracking-[2px] text-[10px] transition-all gap-2"
                            >
                                {isUpdatingPassword ? (
                                    <div className="w-4 h-4 border-2 border-slate-200 border-t-[#1D5F31] rounded-lg animate-spin" />
                                ) : (
                                    <Save size={16} />
                                )}
                                {isUpdatingPassword ? 'Atualizando...' : 'Atualizar Senha'}
                            </Button>
                        </div>
                    </form>


                </section>

                {/* Zona de Perigo - rounded-lg */}
                <section className="bg-red-50 border border-gray-200 rounded-2xl p-10 shadow-sm space-y-8 lg:col-span-2">
                    <div className="flex items-center gap-4">
                        <div className="p-4 bg-white border border-black/20 rounded-lg text-red-500 shadow-sm">
                            <Trash2 size={24} strokeWidth={2.5} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold uppercase tracking-tight text-red-600 leading-none">Zona de Perigo</h2>
                            <p className="text-sm font-medium tracking-tight text-red-500/80 mt-2">Ações irreversíveis sobre sua conta e cursos criados.</p>
                        </div>
                    </div>

                    <p className="text-sm text-red-600/70 max-w-2xl font-bold uppercase tracking-tight leading-relaxed bg-white p-6 rounded-lg border border-black/20">
                        AVISO: Ao excluir sua conta, todos os seus cursos, matrículas de alunos e dados financeiros serão removidos permanentemente. Esta ação não pode ser desfeita.
                    </p>

                    <DeleteAccountButton />
                </section>
            </div>
        </div>
    )
}