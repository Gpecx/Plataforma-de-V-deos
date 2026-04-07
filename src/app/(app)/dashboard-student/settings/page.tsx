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

    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [currentPassword, setCurrentPassword] = useState('')
    const [isUpdatingPassword, setIsUpdatingPassword] = useState(false)
    const [needsReauth, setNeedsReauth] = useState(false)

    const showNotification = useCartStore(state => state.showNotification)

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                setUser(user)
            }
            setLoading(false)
            // if (!user) {
            //     router.push('/login')
            // } 
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
                    </section>

                    {/* Dados Bancários */}
                    <section className="bg-white border border-black p-8 md:p-10 rounded-[24px] shadow-sm">
                        <div className="flex items-center gap-5 mb-8">
                            <div className="w-14 h-14 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center text-[#1D5F31] shadow-sm"><CreditCard size={24} /></div>
                            <div>
                                <h2 className="font-bold uppercase text-xl !text-black tracking-tight">Dados Bancários</h2>
                                <p className="text-[10px] !text-black uppercase tracking-[2px] font-bold">Informações para reembolsos</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-900 ml-1">Chave PIX</label>
                                <Input 
                                    value={pixKey} 
                                    onChange={(e) => setPixKey(e.target.value)} 
                                    className="bg-white border-black rounded-xl h-14 text-slate-900 placeholder:text-slate-600 font-medium focus-visible:ring-[#1D5F31]/20 focus-visible:border-black" 
                                    placeholder="CPF, E-mail ou Celular" 
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-900 ml-1">Instituição Bancária</label>
                                <Input 
                                    value={bank} 
                                    onChange={(e) => setBank(e.target.value)} 
                                    className="bg-white border-black rounded-xl h-14 text-slate-900 placeholder:text-slate-600 font-medium focus-visible:ring-[#1D5F31]/20 focus-visible:border-black" 
                                    placeholder="Ex: Nubank, Itaú..." 
                                />
                            </div>
                        </div>
                        <Button className="bg-white border border-black text-[#1D5F31] hover:bg-slate-50 font-bold uppercase rounded-xl h-14 px-10 transition-all active:scale-95 shadow-sm">Salvar Preferências</Button>
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