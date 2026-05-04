'use client'

import { useActionState } from 'react'
import { auth } from '@/lib/firebase'
import { onAuthStateChanged, updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Lock, CreditCard, Trash2, ArrowLeft, Save, Key, MapPin, CheckCircle2, AlertCircle, Eye, EyeOff } from 'lucide-react'
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
    
    const [showCurrentPassword, setShowCurrentPassword] = useState(false)
    const [showNewPassword, setShowNewPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    


    const showNotification = useCartStore(state => state.showNotification)

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                setUser(user)

                
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
        
        if (!currentPassword) {
            showNotification('Digite sua senha atual para confirmar a alteração.', 'error')
            return
        }
        
        if (newPassword !== confirmPassword) {
            showNotification('As senhas não coincidem', 'error')
            return
        }
        if (newPassword.length < 6) {
            showNotification('A nova senha deve ter pelo menos 6 caracteres', 'error')
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
                const newToken = await user.getIdToken(true)
                await fetch('/api/auth/session', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ idToken: newToken })
                })
                
                showNotification('Senha atualizada com sucesso!', 'success')
                setNewPassword(''); setConfirmPassword(''); setCurrentPassword('')
                setNeedsReauth(false)
            }
        } catch (error: any) {
            console.error("Password Update Error:", error)

            // Protocolo 3: Tratamento de Erros sem Redirecionamento Punitivo
            if (error.code === 'auth/wrong-password') {
                showNotification('Senha atual incorreta.', 'error')
            } else if (error.code === 'auth/requires-recent-login') {
                setNeedsReauth(true)
                showNotification('Confirme sua senha atual.', 'info')
            } else {
                showNotification('Erro ao atualizar senha. Tente novamente.', 'error')
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
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-900 ml-1">Senha Atual</label>
                                <div className="relative">
                                    <Input 
                                        type={showCurrentPassword ? 'text' : 'password'} 
                                        value={currentPassword} 
                                        onChange={(e) => setCurrentPassword(e.target.value)} 
                                        className="bg-white border-black rounded-xl h-14 text-slate-900 placeholder:text-slate-600 font-medium focus-visible:ring-[#1D5F31]/20 focus-visible:border-black pr-12" 
                                        placeholder="Digite sua senha atual" 
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
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-900 ml-1">Nova Senha</label>
                                    <div className="relative">
                                        <Input 
                                            type={showNewPassword ? 'text' : 'password'} 
                                            value={newPassword} 
                                            onChange={(e) => setNewPassword(e.target.value)} 
                                            className="bg-white border-black rounded-xl h-14 text-slate-900 placeholder:text-slate-600 font-medium focus-visible:ring-[#1D5F31]/20 focus-visible:border-black pr-12" 
                                            placeholder="Nova senha (mín. 6 chars)" 
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
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-900 ml-1">Confirmar Senha</label>
                                    <div className="relative">
                                        <Input 
                                            type={showConfirmPassword ? 'text' : 'password'} 
                                            value={confirmPassword} 
                                            onChange={(e) => setConfirmPassword(e.target.value)} 
                                            className="bg-white border-black rounded-xl h-14 text-slate-900 placeholder:text-slate-600 font-medium focus-visible:ring-[#1D5F31]/20 focus-visible:border-black pr-12" 
                                            placeholder="Repita a nova senha" 
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
                            <Button type="submit" disabled={isUpdatingPassword} className="bg-[#1D5F31] border border-black hover:opacity-90 text-white font-bold uppercase rounded-xl h-14 px-10 shadow-lg shadow-[#1D5F31]/10 transition-all active:scale-95">
                                {isUpdatingPassword ? 'Atualizando...' : 'Atualizar Senha'}
                            </Button>
                        </form>


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
                                            value={addressData.cep || ''}
                                            onChange={(e) => setAddressData(prev => ({ ...prev, cep: e.target.value }))}
                                            onBlur={(e) => handleCepBlur(e.target.value)}
                                            className="bg-white border-black rounded-xl h-14 text-slate-900 placeholder:text-slate-600 font-medium focus-visible:ring-[#1D5F31]/20 focus-visible:border-black" 
                                            placeholder="00000-000"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-900 ml-1">Número</label>
                                        <Input 
                                            name="numero"
                                            value={addressData.numero || ''}
                                            onChange={(e) => setAddressData(prev => ({ ...prev, numero: e.target.value }))}
                                            className="bg-white border-black rounded-xl h-14 text-slate-900 placeholder:text-slate-600 font-medium focus-visible:ring-[#1D5F31]/20 focus-visible:border-black" 
                                            placeholder="Número" 
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2 mt-4">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-900 ml-1">Logradouro</label>
                                    <Input 
                                        name="logradouro"
                                        value={addressData.logradouro || ''}
                                        onChange={(e) => setAddressData(prev => ({ ...prev, logradouro: e.target.value }))}
                                        className="bg-white border-black rounded-xl h-14 text-slate-900 placeholder:text-slate-600 font-medium focus-visible:ring-[#1D5F31]/20 focus-visible:border-black" 
                                        placeholder="Rua, Avenida..." 
                                    />
                                </div>

                                <div className="space-y-2 mt-4">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-900 ml-1">Bairro</label>
                                    <Input 
                                        name="bairro"
                                        value={addressData.bairro || ''}
                                        onChange={(e) => setAddressData(prev => ({ ...prev, bairro: e.target.value }))}
                                        className="bg-white border-black rounded-xl h-14 text-slate-900 placeholder:text-slate-600 font-medium focus-visible:ring-[#1D5F31]/20 focus-visible:border-black" 
                                        placeholder="Bairro" 
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-900 ml-1">Cidade</label>
                                        <Input 
                                            name="cidade"
                                            value={addressData.cidade || ''}
                                            onChange={(e) => setAddressData(prev => ({ ...prev, cidade: e.target.value }))}
                                            className="bg-white border-black rounded-xl h-14 text-slate-900 placeholder:text-slate-600 font-medium focus-visible:ring-[#1D5F31]/20 focus-visible:border-black" 
                                            placeholder="Cidade" 
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-900 ml-1">Estado</label>
                                        <Input 
                                            name="estado"
                                            value={addressData.estado || ''}
                                            onChange={(e) => setAddressData(prev => ({ ...prev, estado: e.target.value }))}
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