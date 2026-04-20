'use client'

import { useActionState } from 'react'
import { auth } from '@/lib/firebase'
import { onAuthStateChanged, updatePassword, EmailAuthProvider, reauthenticateWithCredential, multiFactor, TotpMultiFactorGenerator, TotpSecret, reload } from 'firebase/auth'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Lock, CreditCard, Trash2, ArrowLeft, Save, Key, ShieldCheck, MapPin, CheckCircle2, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import DeleteAccountButton from '@/components/DeleteAccountButton'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useCartStore } from '@/store/useCartStore'
import { updateSettings, getProfile } from '../actions'

const initialState = {
    success: false,
    error: undefined as string | undefined
}

interface AddressData {
    logradouro?: string
    numero?: string
    bairro?: string
    cidade?: string
    estado?: string
    cep?: string
}

interface SettingsData {
    cpf_cnpj?: string
    pix_key?: string
    bank_name?: string
}

export default function SettingsPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [user, setUser] = useState<any>(null)
    const [settingsData, setSettingsData] = useState<SettingsData>({})
    const [addressData, setAddressData] = useState<AddressData>({})
    const [isLoadingData, setIsLoadingData] = useState(false)
    const [state, formAction, isPending] = useActionState(updateSettings, initialState)

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
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                setUser(user)
                setIsMFAActive(multiFactor(user).enrolledFactors.length > 0)
                
                try {
                    const result = await getProfile()
                    if (result.success && result.data) {
                        setSettingsData({
                            cpf_cnpj: result.data.cpf_cnpj || '',
                            pix_key: result.data.pix_key || '',
                            bank_name: result.data.bank_name || ''
                        })
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

        setIsLoadingData(true)
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
            setIsLoadingData(false)
        }
    }

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
                setNewPassword(''); setConfirmPassword(''); setCurrentPassword('')
            }
        } catch (error: any) {
            if (error.code === 'auth/requires-recent-login') {
                setNeedsReauth(true)
                showNotification('Confirme sua senha atual.', 'info')
            } else {
                showNotification('Erro ao atualizar.', 'error')
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
            console.log("Tentando inscribir usuário no MFA...")
            await multiFactor(user).enroll(assertion, 'Authenticator App')
            
            await user.getIdToken(true)
            await reload(user)
            
            const factors = multiFactor(auth.currentUser!).enrolledFactors
            
            if (factors.length === 0) {
                console.error("ERRO CRÍTICO: O SDK diz que não há fatores inscritos após o enroll!")
            }

            setIsMFAActive(factors.length > 0)
            setShowMFAEnroll(false)
            setMfaSecret(null)
            setMfaCode("")
            showNotification('2FA ativado com sucesso!', 'success')
        } catch (error: any) {
            console.error("MFA Enrollment Error:", error)
            setMfaError("Código inválido. Tente novamente.")
        } finally {
            setIsEnrollingMFA(false)
        }
    }

    const handleDisableMFA = async () => {
        if (!confirm("Tem certeza que deseja desativar o 2FA? Sua conta ficará menos segura.")) return

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
        <div className="min-h-screen bg-transparent font-montserrat p-4 md:p-8 lg:p-12">
            <div className="max-w-4xl mx-auto space-y-10">

                {/* Header da Página */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold uppercase !text-black tracking-tighter max-w-4xl">Configurações</h1>
                        <p className="!text-black text-xs uppercase tracking-[3px] mt-1 font-bold">Gerencie sua conta e fluxos de pagamento</p>
                    </div>
                    <Link href="/dashboard-student" className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest text-slate-600 hover:text-slate-900 bg-white px-6 py-3.5 rounded-xl border border-black transition-all shadow-sm hover:shadow-md active:scale-95 w-fit">
                        <ArrowLeft size={16} /> Voltar ao Painel
                    </Link>
                </div>

                <div className="space-y-10">
                    {/* Segurança */}
                    <section className="bg-white border border-black p-8 md:p-10 rounded-[24px] shadow-sm">
                        <div className="flex items-center gap-5 mb-8">
                            <div className="w-14 h-14 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center text-[#1D5F31] shadow-sm"><Lock size={24} /></div>
                            <div>
                                <h2 className="font-bold uppercase text-xl !text-black tracking-tight">Segurança</h2>
                                <p className="text-[10px] !text-black uppercase tracking-[2px] font-bold">Proteção e acesso à conta</p>
                            </div>
                        </div>
                        <form onSubmit={handleUpdatePassword} className="space-y-6">
                            {needsReauth && (
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-900 ml-1">Senha Atual para Confirmação</label>
                                    <Input 
                                        type="password" 
                                        value={currentPassword} 
                                        onChange={(e) => setCurrentPassword(e.target.value)} 
                                        className="bg-white border-black rounded-xl h-14 text-slate-900 placeholder:text-slate-600 font-medium focus-visible:ring-[#1D5F31]/20 focus-visible:border-black" 
                                        placeholder="Digite sua senha atual" 
                                    />
                                </div>
                            )}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-900 ml-1">Nova Senha</label>
                                    <Input 
                                        type="password" 
                                        value={newPassword} 
                                        onChange={(e) => setNewPassword(e.target.value)} 
                                        className="bg-white border-black rounded-xl h-14 text-slate-900 placeholder:text-slate-600 font-medium focus-visible:ring-[#1D5F31]/20 focus-visible:border-black" 
                                        placeholder="Nova senha (mín. 6 chars)" 
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-900 ml-1">Confirmar Senha</label>
                                    <Input 
                                        type="password" 
                                        value={confirmPassword} 
                                        onChange={(e) => setConfirmPassword(e.target.value)} 
                                        className="bg-white border-black rounded-xl h-14 text-slate-900 placeholder:text-slate-600 font-medium focus-visible:ring-[#1D5F31]/20 focus-visible:border-black" 
                                        placeholder="Repita a nova senha" 
                                    />
                                </div>
                            </div>
                            <Button type="submit" className="bg-[#1D5F31] border border-black hover:opacity-90 text-white font-bold uppercase rounded-xl h-14 px-10 shadow-lg shadow-[#1D5F31]/10 transition-all active:scale-95">Atualizar Senha</Button>
                        </form>

                        <div className="mt-12 pt-10 border-t border-slate-100">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                <div className="space-y-1">
                                    <h3 className="font-bold uppercase text-lg !text-black flex items-center gap-2">
                                        <ShieldCheck size={20} className="text-[#1D5F31]" />
                                        Autenticação em Duas Etapas (2FA)
                                    </h3>
                                    <p className="text-[10px] !text-black uppercase tracking-[2px] font-bold">Camada extra de proteção via aplicativo</p>
                                </div>
                                
                                {isMFAActive ? (
                                    <Button onClick={handleDisableMFA} className="bg-white border border-red-200 text-red-600 hover:bg-red-50 font-bold uppercase rounded-xl h-14 px-8 transition-all">Desativar 2FA</Button>
                                ) : (
                                    <Button onClick={handleStartMFAEnroll} className="bg-white border border-black text-[#1D5F31] hover:bg-slate-50 font-bold uppercase rounded-xl h-14 px-8 transition-all">Ativar 2FA</Button>
                                )}
                            </div>

                            {showMFAEnroll && mfaSecret && (
                                <div className="mt-8 p-6 bg-slate-50 border border-slate-100 rounded-2xl animate-in zoom-in-95 duration-200">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                                        <div className="flex flex-col items-center justify-center p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
                                            <img 
                                                src={`https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(mfaSecret.generateQrCodeUrl(user.email!, 'PowerPlay'))}&size=200x200`} 
                                                alt="QR Code 2FA" 
                                                className="w-[180px] h-[180px]"
                                            />
                                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest text-center">Escaneie com Google Authenticator ou Authy</p>
                                        </div>
                                        
                                        <div className="space-y-6">
                                            <div className="space-y-1.5">
                                                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-900 ml-1">Código de Confirmação</label>
                                                <Input 
                                                    value={mfaCode}
                                                    onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, ''))}
                                                    maxLength={6}
                                                    className="bg-white border-black rounded-xl h-14 text-slate-900 placeholder:text-slate-600 font-bold text-center text-xl tracking-widest focus-visible:ring-[#1D5F31]/20" 
                                                    placeholder="000000" 
                                                />
                                                {mfaError && <p className="text-[9px] font-bold text-red-600 uppercase mt-1">{mfaError}</p>}
                                            </div>
                                            <div className="flex flex-col gap-3">
                                                <Button 
                                                    onClick={handleConfirmMFAEnroll}
                                                    disabled={isEnrollingMFA || mfaCode.length < 6}
                                                    className="bg-[#1D5F31] text-white font-bold uppercase rounded-xl h-14 transition-all w-full"
                                                >
                                                    {isEnrollingMFA ? 'Processando...' : 'Confirmar e Ativar'}
                                                </Button>
                                                <button onClick={() => setShowMFAEnroll(false)} className="text-[10px] font-bold uppercase text-slate-500 hover:text-black transition-colors">Cancelar</button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </section>

                    {/* Dados Fiscais e Pagamento */}
                    <section className="bg-white border border-black p-8 md:p-10 rounded-[24px] shadow-sm">
                        <form action={formAction} className="space-y-8">
                            <div className="flex items-center gap-5 mb-8">
                                <div className="w-14 h-14 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center text-[#1D5F31] shadow-sm"><CreditCard size={24} /></div>
                                <div>
                                    <h2 className="font-bold uppercase text-xl !text-black tracking-tight">Dados Fiscais e Pagamento</h2>
                                    <p className="text-[10px] !text-black uppercase tracking-[2px] font-bold">Informações para notas e reembolsos</p>
                                </div>
                            </div>
                            
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-900 ml-1">CPF ou CNPJ</label>
                                <Input 
                                    name="cpf_cnpj"
                                    defaultValue={settingsData.cpf_cnpj || ''}
                                    className="bg-white border-black rounded-xl h-14 text-slate-900 placeholder:text-slate-600 font-medium focus-visible:ring-[#1D5F31]/20 focus-visible:border-black" 
                                    placeholder="000.000.000-00"
                                />
                                <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Necessário para emissão de notas fiscais.</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-900 ml-1">Chave PIX</label>
                                    <Input 
                                        name="pix_key"
                                        defaultValue={settingsData.pix_key || ''}
                                        className="bg-white border-black rounded-xl h-14 text-slate-900 placeholder:text-slate-600 font-medium focus-visible:ring-[#1D5F31]/20 focus-visible:border-black" 
                                        placeholder="CPF, E-mail ou Celular" 
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-900 ml-1">Instituição Bancária</label>
                                    <Input 
                                        name="bank_name"
                                        defaultValue={settingsData.bank_name || ''}
                                        className="bg-white border-black rounded-xl h-14 text-slate-900 placeholder:text-slate-600 font-medium focus-visible:ring-[#1D5F31]/20 focus-visible:border-black" 
                                        placeholder="Ex: Nubank, Itaú..." 
                                    />
                                </div>
                            </div>

                            <div className="pt-8 border-t border-slate-100">
                                <div className="flex items-center gap-5 mb-6">
                                    <div className="w-14 h-14 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center text-[#1D5F31] shadow-sm"><MapPin size={24} /></div>
                                    <div>
                                        <h2 className="font-bold uppercase text-xl !text-black tracking-tight">Endereço Residencial</h2>
                                        <p className="text-[10px] !text-black uppercase tracking-[2px] font-bold">Seu endereço para correspondências</p>
                                    </div>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-900 ml-1">CEP</label>
                                        <Input 
                                            name="cep"
                                            defaultValue={addressData.cep || ''}
                                            onBlur={(e) => handleCepBlur(e.target.value)}
                                            className="bg-white border-black rounded-xl h-14 text-slate-900 placeholder:text-slate-600 font-medium focus-visible:ring-[#1D5F31]/20 focus-visible:border-black" 
                                            placeholder="00000-000"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-900 ml-1">Número</label>
                                        <Input 
                                            name="numero"
                                            defaultValue={addressData.numero || ''}
                                            className="bg-white border-black rounded-xl h-14 text-slate-900 placeholder:text-slate-600 font-medium focus-visible:ring-[#1D5F31]/20 focus-visible:border-black" 
                                            placeholder="Número" 
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2 mt-4">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-900 ml-1">Logradouro</label>
                                    <Input 
                                        name="logradouro"
                                        defaultValue={addressData.logradouro || ''}
                                        className="bg-white border-black rounded-xl h-14 text-slate-900 placeholder:text-slate-600 font-medium focus-visible:ring-[#1D5F31]/20 focus-visible:border-black" 
                                        placeholder="Rua, Avenida..." 
                                    />
                                </div>

                                <div className="space-y-2 mt-4">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-900 ml-1">Bairro</label>
                                    <Input 
                                        name="bairro"
                                        defaultValue={addressData.bairro || ''}
                                        className="bg-white border-black rounded-xl h-14 text-slate-900 placeholder:text-slate-600 font-medium focus-visible:ring-[#1D5F31]/20 focus-visible:border-black" 
                                        placeholder="Bairro" 
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-900 ml-1">Cidade</label>
                                        <Input 
                                            name="cidade"
                                            defaultValue={addressData.cidade || ''}
                                            className="bg-white border-black rounded-xl h-14 text-slate-900 placeholder:text-slate-600 font-medium focus-visible:ring-[#1D5F31]/20 focus-visible:border-black" 
                                            placeholder="Cidade" 
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-900 ml-1">Estado</label>
                                        <Input 
                                            name="estado"
                                            defaultValue={addressData.estado || ''}
                                            className="bg-white border-black rounded-xl h-14 text-slate-900 placeholder:text-slate-600 font-medium focus-visible:ring-[#1D5F31]/20 focus-visible:border-black" 
                                            placeholder="UF" 
                                        />
                                    </div>
                                </div>
                            </div>

                            {state?.success && (
                                <div className="flex items-center gap-2 p-4 bg-green-50 border border-green-200/40 rounded-xl text-green-700 text-[10px] font-bold uppercase tracking-widest animate-in fade-in slide-in-from-top-2">
                                    <CheckCircle2 size={16} />
                                    Dados atualizados com sucesso!
                                </div>
                            )}

                            {state?.error && (
                                <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200/40 rounded-xl text-red-700 text-[10px] font-bold uppercase tracking-widest animate-in fade-in slide-in-from-top-2">
                                    <AlertCircle size={16} />
                                    {state.error}
                                </div>
                            )}

                            <Button 
                                type="submit" 
                                disabled={isPending}
                                className="bg-[#1D5F31] border border-black hover:opacity-90 text-white font-bold uppercase rounded-xl h-14 px-10 shadow-lg shadow-[#1D5F31]/10 transition-all active:scale-95"
                            >
                                {isPending ? 'Salvando...' : 'Salvar Tudo'}
                            </Button>
                        </form>
                    </section>

                    {/* Zona de Perigo */}
                    <section className="bg-red-50 border border-red-100 p-8 md:p-10 rounded-[24px]">
                        <div className="flex items-center gap-5 mb-6">
                            <div className="w-14 h-14 bg-white border border-red-100 rounded-2xl flex items-center justify-center text-red-500 shadow-sm"><Trash2 size={24} /></div>
                            <div>
                                <h2 className="font-bold uppercase text-xl text-red-600 tracking-tight">Zona de Perigo</h2>
                                <p className="text-[10px] text-red-400 uppercase tracking-[2px] font-bold">Ações irreversíveis</p>
                            </div>
                        </div>
                        <div className="bg-white border border-red-100 p-6 rounded-xl mb-6">
                            <p className="text-sm !text-black leading-relaxed">Ao excluir sua conta, todos os seus dados e acessos aos cursos serão permanentemente removidos. Esta ação não pode ser desfeita.</p>
                        </div>
                        <DeleteAccountButton />
                    </section>
                </div>
            </div>
        </div>
    )
}