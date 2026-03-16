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
            <div className="min-h-screen flex items-center justify-center bg-[#0d2b17]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#00C402]"></div>
            </div>
        )
    }

    return (
        // Alterado para pt-32 para dar mais espaço abaixo do header fixo
        <div className="min-h-screen bg-[#0d2b17] font-exo p-8 md:p-12 pt-32">
            <div className="max-w-4xl mx-auto space-y-8">

                {/* Header da Página */}
                <div className="flex items-center justify-between pb-8 border-b border-[#1e4d2b]">
                    <div>
                        <h1 className="text-3xl font-black uppercase text-white">Configurações</h1>
                        <p className="text-slate-400 text-xs uppercase tracking-[2px]">Gerencie sua conta e pagamentos</p>
                    </div>
                    <Link href="/dashboard-student" className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white bg-[#1e4d2b]/20 px-5 py-3 rounded-none border border-[#1e4d2b] transition-all">
                        <ArrowLeft size={14} /> Voltar
                    </Link>
                </div>

                <div className="space-y-8">
                    {/* Segurança - rounded-none aplicado */}
                    <section className="bg-[#0f1f14] border border-[#1e4d2b] p-8 rounded-none">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-12 h-12 bg-[#1e4d2b]/20 border border-[#1e4d2b] rounded-none flex items-center justify-center text-white"><Lock size={20} /></div>
                            <div>
                                <h2 className="font-black uppercase text-white">Segurança</h2>
                                <p className="text-[10px] text-slate-400 uppercase tracking-[2px]">Atualize sua senha</p>
                            </div>
                        </div>
                        <form onSubmit={handleUpdatePassword} className="space-y-4">
                            {needsReauth && (
                                <Input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="bg-[#1e4d2b]/20 border-[#1e4d2b] rounded-none h-12 text-white" placeholder="Confirme sua senha atual" />
                            )}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="bg-[#1e4d2b]/20 border-[#1e4d2b] rounded-none h-12 text-white" placeholder="Nova senha" />
                                <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="bg-[#1e4d2b]/20 border-[#1e4d2b] rounded-none h-12 text-white" placeholder="Confirmar nova senha" />
                            </div>
                            <Button type="submit" className="bg-[#00C402] hover:bg-[#28b828] text-white font-black uppercase rounded-none h-12 px-8">Atualizar Senha</Button>
                        </form>
                    </section>

                    {/* Dados Bancários - rounded-none aplicado */}
                    <section className="bg-[#0f1f14] border border-[#1e4d2b] p-8 rounded-none">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-12 h-12 bg-[#1e4d2b]/20 border border-[#1e4d2b] rounded-none flex items-center justify-center text-white"><CreditCard size={20} /></div>
                            <div>
                                <h2 className="font-black uppercase text-white">Dados Bancários</h2>
                                <p className="text-[10px] text-slate-400 uppercase tracking-[2px]">Informações de pagamento</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <Input value={pixKey} onChange={(e) => setPixKey(e.target.value)} className="bg-[#1e4d2b]/20 border-[#1e4d2b] rounded-none h-12 text-white" placeholder="Chave PIX" />
                            <Input value={bank} onChange={(e) => setBank(e.target.value)} className="bg-[#1e4d2b]/20 border-[#1e4d2b] rounded-none h-12 text-white" placeholder="Banco" />
                        </div>
                        <Button className="bg-[#1e4d2b]/40 border border-[#1e4d2b] text-white font-black uppercase rounded-none h-12 px-8">Salvar Dados</Button>
                    </section>

                    {/* Zona de Perigo - rounded-none aplicado */}
                    <section className="bg-red-950/10 border border-red-900/30 p-8 rounded-none">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-12 h-12 bg-red-950/40 border border-red-900/40 rounded-none flex items-center justify-center text-red-500"><Trash2 size={20} /></div>
                            <h2 className="font-black uppercase text-red-500">Zona de Perigo</h2>
                        </div>
                        <DeleteAccountButton />
                    </section>
                </div>
            </div>
        </div>
    )
}