'use client'

import { useState } from 'react'
import { Plus, User, Mail, Lock, Shield, ArrowRight, Loader2, CheckCircle2, Key, X as CloseIcon } from 'lucide-react'
import { createAdminUser, updateAdminPassword } from './actions'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'

interface Admin {
    id: string
    full_name: string
    email: string
    created_at: string
}

interface ManagementClientProps {
    initialAdmins: Admin[]
}

export default function ManagementClient({ initialAdmins }: ManagementClientProps) {
    const [admins, setAdmins] = useState<Admin[]>(initialAdmins)
    const [loading, setLoading] = useState(false)
    const [showForm, setShowForm] = useState(false)
    
    // Form state
    const [fullName, setFullName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')

    // Password update state
    const [updatingPasswordId, setUpdatingPasswordId] = useState<string | null>(null)
    const [newAdminPassword, setNewAdminPassword] = useState('')
    const [isUpdating, setIsUpdating] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            const result = await createAdminUser({ fullName, email, password })

            if (result.success) {
                toast.success(result.message)
                setFullName('')
                setEmail('')
                setPassword('')
                setShowForm(false)
                // Recarregar a página ou atualizar o estado local se necessário
                window.location.reload()
            } else {
                toast.error(result.error)
            }
        } catch (error) {
            toast.error('Erro ao processar solicitação')
        } finally {
            setLoading(false)
        }
    }

    const handleUpdatePassword = async (adminId: string) => {
        if (!newAdminPassword || newAdminPassword.length < 6) {
            toast.error('A senha deve ter pelo menos 6 caracteres')
            return
        }

        setIsUpdating(true)
        try {
            const result = await updateAdminPassword(adminId, newAdminPassword)
            if (result.success) {
                toast.success(result.message)
                setUpdatingPasswordId(null)
                setNewAdminPassword('')
            } else {
                toast.error(result.error)
            }
        } catch (error) {
            toast.error('Erro ao atualizar senha')
        } finally {
            setIsUpdating(false)
        }
    }

    return (
        <div className="grid lg:grid-cols-12 gap-8 max-w-[1400px] mx-auto w-full">
            {/* Lista de Admins */}
            <div className="lg:col-span-7 space-y-6">
                <div className="bg-white border border-slate-200 p-12 rounded-2xl shadow-sm min-h-[500px]">
                    <div className="flex items-center justify-between mb-8 border-b border-slate-100 pb-4">
                        <div className="flex items-center gap-3">
                            <Shield className="text-[#1D5F31]" size={20} strokeWidth={3} />
                            <h2 className="text-xl font-black uppercase tracking-tighter !text-[#000000]">
                                Operadores Ativos
                            </h2>
                        </div>
                        <span className="bg-slate-100 !text-black text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest">
                            {admins.length} Total
                        </span>
                    </div>

                    <div className="space-y-4">
                        {admins.map((admin) => (
                            <div key={admin.id} className="space-y-3">
                                <div 
                                    className="group border border-slate-100 p-4 rounded-xl hover:border-[#1D5F31] hover:bg-[#1D5F31]/5 transition-all flex items-center justify-between bg-slate-50/50"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-[#1D5F31]/10 flex items-center justify-center text-[#1D5F31] rounded-lg font-black text-sm">
                                            {admin.full_name?.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-black uppercase text-sm tracking-tight">
                                                {admin.full_name}
                                            </h3>
                                            <p className="text-[10px] !text-black font-bold uppercase tracking-wider">
                                                {admin.email}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-6">
                                        <button
                                            onClick={() => setUpdatingPasswordId(updatingPasswordId === admin.id ? null : admin.id)}
                                            className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#1D5F31] hover:text-black transition-colors"
                                        >
                                            <Key size={12} />
                                            Trocar Senha
                                        </button>
                                        <div className="text-[9px] font-black !text-black uppercase tracking-widest text-right">
                                            Iniciado em <br />
                                            {admin.created_at ? new Date(admin.created_at).toLocaleDateString('pt-BR') : 'N/A'}
                                        </div>
                                    </div>
                                </div>

                                <AnimatePresence>
                                    {updatingPasswordId === admin.id && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            className="overflow-hidden"
                                        >
                                            <div className="p-6 bg-slate-100 rounded-xl border-2 border-[#1D5F31] flex items-center gap-4">
                                                <div className="flex-1 relative">
                                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-black" size={14} />
                                                    <input 
                                                        type="password"
                                                        placeholder="NOVA SENHA DO OPERADOR"
                                                        value={newAdminPassword}
                                                        onChange={(e) => setNewAdminPassword(e.target.value)}
                                                        className="w-full bg-white border border-slate-200 rounded-lg p-3 pl-10 text-black text-[10px] font-black uppercase tracking-wider focus:border-[#1D5F31] focus:outline-none transition-all placeholder:text-black/40"
                                                    />
                                                </div>
                                                <button
                                                    onClick={() => handleUpdatePassword(admin.id)}
                                                    disabled={isUpdating}
                                                    className="bg-[#1D5F31] text-white px-6 py-3 rounded-lg font-black text-[10px] uppercase tracking-widest hover:bg-black transition-all disabled:opacity-50"
                                                >
                                                    {isUpdating ? <Loader2 className="animate-spin" size={14} /> : 'Salvar'}
                                                </button>
                                                <button
                                                    onClick={() => { setUpdatingPasswordId(null); setNewAdminPassword(''); }}
                                                    className="p-3 text-black hover:text-red-500 transition-colors"
                                                >
                                                    <CloseIcon size={16} />
                                                </button>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Formulário de Cadastro */}
            <div className="lg:col-span-5">
                <div className="sticky top-8">
                    <div className="bg-white border border-slate-200 p-12 rounded-2xl shadow-sm min-h-[500px] flex flex-col justify-between">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-8 h-8 bg-[#1D5F31] flex items-center justify-center">
                                <Plus size={18} className="text-white" strokeWidth={3} />
                            </div>
                            <h2 className="text-xl font-black uppercase tracking-tighter !text-[#000000]">
                                Novo Administrador
                            </h2>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] !text-black block">
                                    Nome Completo
                                </label>
                                <div className="relative">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-black" size={16} />
                                    <input 
                                        required
                                        type="text"
                                        placeholder="EX: JOÃO DA SILVA"
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value.toUpperCase())}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 pl-12 text-black text-xs font-bold uppercase tracking-wider focus:border-[#1D5F31] focus:bg-white focus:outline-none transition-all placeholder:text-black/40"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] !text-black block">
                                    E-mail Corporativo
                                </label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-black" size={16} />
                                    <input 
                                        required
                                        type="email"
                                        placeholder="EX: ADMIN@GPECX.COM"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 pl-12 text-slate-900 text-xs font-bold tracking-wider focus:border-[#1D5F31] focus:bg-white focus:outline-none transition-all"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] !text-black block">
                                    Senha de Acesso
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-black" size={16} />
                                    <input 
                                        required
                                        type="password"
                                        placeholder="********"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 pl-12 text-slate-900 text-xs font-bold tracking-wider focus:border-[#1D5F31] focus:bg-white focus:outline-none transition-all"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-[#1D5F31] hover:bg-[#257a3f] text-white py-5 rounded-xl font-black text-xs uppercase tracking-[0.3em] transition-all shadow-lg shadow-[#1D5F31]/20 flex items-center justify-center gap-3 disabled:opacity-50 group"
                            >
                                {loading ? (
                                    <Loader2 className="animate-spin" size={18} />
                                ) : (
                                    <>
                                        Provisionar Acesso
                                        <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                    </>
                                )}
                            </button>
                        </form>

                        <div className="mt-8 pt-8 border-t border-slate-100">
                            <div className="flex items-start gap-3">
                                <div className="p-2 bg-amber-500/10 text-amber-500">
                                    <Shield size={16} strokeWidth={3} />
                                </div>
                                <div>
                                    <h4 className="text-[10px] font-black !text-[#000000] uppercase tracking-wider mb-1">Nota de Segurança</h4>
                                    <p className="text-[9px] !text-black font-bold uppercase leading-relaxed">
                                        Ao criar um novo administrador, você concede permissões totais sobre o sistema. Esta ação é auditada e vinculada ao seu perfil atual.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
