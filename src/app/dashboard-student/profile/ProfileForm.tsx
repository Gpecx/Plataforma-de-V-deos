'use client'

import { useState, useActionState } from 'react'
import { updateProfile, updatePassword, deleteAccount } from '../actions'
import { User, Save, CheckCircle2, AlertCircle, Lock, Trash2, KeyRound } from 'lucide-react'
import Image from 'next/image'

interface ProfileFormProps {
    initialFullName: string
    initialAvatarUrl?: string
}

const AVATARS = [
    { id: '1', url: '/avatars/avatar1.png', label: 'Robo Aura' },
    { id: '2', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Felix', label: 'Aventureiro' },
    { id: '3', url: 'https://api.dicebear.com/7.x/bottts-neutral/svg?seed=Pixel', label: 'Cyber Bot' },
    { id: '4', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Buster', label: 'Especialista' },
    { id: '5', url: 'https://api.dicebear.com/7.x/big-ears-neutral/svg?seed=Lucky', label: 'Mestre' },
]

const initialState = {
    success: false,
    error: undefined as string | undefined
}

export function ProfileForm({ initialFullName, initialAvatarUrl }: ProfileFormProps) {
    const [state, formAction, isPending] = useActionState(updateProfile, initialState)
    const [selectedAvatar, setSelectedAvatar] = useState(initialAvatarUrl || AVATARS[0].url)
    const [passwordState, setPasswordState] = useState<{ success?: boolean; error?: string }>({})
    const [isUpdatingPassword, setIsUpdatingPassword] = useState(false)

    const handlePasswordUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setIsUpdatingPassword(true)
        setPasswordState({})
        const formData = new FormData(e.currentTarget)
        try {
            const result = await updatePassword(formData)
            setPasswordState(result)
        } catch (err: any) {
            setPasswordState({ success: false, error: err.message })
        } finally {
            setIsUpdatingPassword(false)
        }
    }

    const handleDeleteAccount = async () => {
        if (confirm('TEM CERTEZA? Esta ação é IRREVERSÍVEL e todos os seus cursos e progresso serão perdidos permanentemente.')) {
            try {
                await deleteAccount()
            } catch (err: any) {
                alert('Erro ao excluir conta: ' + err.message)
            }
        }
    }

    return (
        <div className="space-y-16">
            {/* INFORMAÇÕES DO PERFIL */}
            <form action={formAction} className="space-y-12">
                <div className="space-y-10">
                    <div className="flex items-center gap-6">
                        <div className="w-16 h-16 bg-slate-900 border-4 border-white rounded-3xl flex items-center justify-center text-white shadow-xl relative overflow-hidden shrink-0">
                            {selectedAvatar ? (
                                <img src={selectedAvatar} alt="Avatar Selecionado" className="w-full h-full object-cover" />
                            ) : (
                                <User size={30} />
                            )}
                        </div>
                        <div>
                            <h2 className="text-xl font-black tracking-tighter uppercase text-slate-900 leading-tight">Personalização</h2>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[2px]">Escolha seu avatar e atualize seu nome.</p>
                        </div>
                    </div>

                    {/* GRID DE AVATARES */}
                    <div className="space-y-4">
                        <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">
                            Selecione seu Avatar (Estilo PlayStation)
                        </label>
                        <div className="grid grid-cols-5 gap-4 max-w-xl">
                            {AVATARS.map((avatar) => (
                                <button
                                    key={avatar.id}
                                    type="button"
                                    onClick={() => setSelectedAvatar(avatar.url)}
                                    className={`relative aspect-square rounded-2xl overflow-hidden border-2 transition-all p-1 ${selectedAvatar === avatar.url ? 'border-[#00C402] bg-[#00C402]/5 shadow-md scale-105' : 'border-slate-100 bg-slate-50 hover:border-slate-300'}`}
                                >
                                    <img src={avatar.url} alt={avatar.label} className="w-full h-full object-contain" />
                                    {selectedAvatar === avatar.url && (
                                        <div className="absolute top-1 right-1 bg-[#00C402] text-white rounded-full p-0.5">
                                            <CheckCircle2 size={10} />
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>
                        <input type="hidden" name="avatarUrl" value={selectedAvatar} />
                    </div>

                    <div className="grid grid-cols-1 gap-8 max-w-2xl">
                        <div className="space-y-2">
                            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">
                                Nome Completo
                            </label>
                            <input
                                type="text"
                                name="fullName"
                                defaultValue={initialFullName}
                                className="w-full bg-slate-50 border border-slate-100 rounded-xl px-6 py-4 focus:outline-none focus:border-[#00C402] focus:ring-4 focus:ring-[#00C402]/5 transition-all text-slate-900 font-bold text-sm uppercase tracking-wide placeholder-slate-300"
                                placeholder="COMO VOCÊ QUER SER CHAMADO?"
                                required
                            />
                        </div>
                    </div>

                    {state?.success && (
                        <div className="flex items-center gap-2 p-5 bg-[#00C402]/10 border border-[#00C402]/20 rounded-2xl text-[#00C402] text-[10px] font-black uppercase tracking-widest animate-in fade-in slide-in-from-top-2">
                            <CheckCircle2 size={16} />
                            Perfil atualizado com sucesso!
                        </div>
                    )}

                    {state?.error && (
                        <div className="flex items-center gap-2 p-5 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-[10px] font-black uppercase tracking-widest animate-in fade-in slide-in-from-top-2">
                            <AlertCircle size={16} />
                            {state.error}
                        </div>
                    )}
                </div>

                <div className="pt-6">
                    <button
                        type="submit"
                        disabled={isPending}
                        className="flex items-center justify-center gap-3 w-full md:w-auto px-10 h-14 bg-slate-900 text-white font-black uppercase tracking-[2px] rounded-2xl hover:bg-slate-800 transition-all shadow-lg active:scale-95 disabled:opacity-50 disabled:hover:scale-100 group"
                    >
                        <Save size={20} className={`${isPending ? 'animate-pulse' : ''} group-hover:scale-110 transition-transform`} />
                        {isPending ? 'Salvando...' : 'Salvar Perfil'}
                    </button>
                </div>
            </form>

            <div className="h-px bg-slate-100 w-full" />

            {/* SEGURANÇA - ALTERAR SENHA */}
            <section className="space-y-8">
                <div className="flex items-center gap-5">
                    <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center">
                        <Lock size={24} />
                    </div>
                    <div>
                        <h2 className="text-xl font-black tracking-tighter uppercase text-slate-900">Segurança</h2>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[2px]">Mantenha sua conta protegida.</p>
                    </div>
                </div>

                <form onSubmit={handlePasswordUpdate} className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-2xl items-end">
                    <div className="space-y-2">
                        <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">
                            Nova Senha
                        </label>
                        <div className="relative">
                            <input
                                type="password"
                                name="password"
                                className="w-full bg-slate-50 border border-slate-100 rounded-xl px-6 py-4 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all text-slate-900 font-bold text-sm"
                                placeholder="DIGITE A NOVA SENHA"
                                required
                                minLength={6}
                            />
                            <KeyRound size={18} className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300" />
                        </div>
                    </div>
                    <button
                        type="submit"
                        disabled={isUpdatingPassword}
                        className="h-14 bg-blue-600 text-white font-black uppercase tracking-[2px] rounded-2xl hover:bg-blue-700 transition-all shadow-lg active:scale-95 disabled:opacity-50"
                    >
                        {isUpdatingPassword ? 'ATUALIZANDO...' : 'ALTERAR SENHA'}
                    </button>
                </form>

                {passwordState?.success && (
                    <div className="flex items-center gap-2 p-5 bg-blue-50 border border-blue-100 rounded-2xl text-blue-600 text-[10px] font-black uppercase tracking-widest animate-in fade-in slide-in-from-top-2">
                        <CheckCircle2 size={16} />
                        Senha alterada com sucesso!
                    </div>
                )}
                {passwordState?.error && (
                    <div className="flex items-center gap-2 p-5 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-[10px] font-black uppercase tracking-widest animate-in fade-in slide-in-from-top-2">
                        <AlertCircle size={16} />
                        {passwordState.error}
                    </div>
                )}
            </section>

            <div className="h-px bg-slate-100 w-full" />

            {/* ZONA DE PERIGO - EXCLUIR CONTA */}
            <section className="space-y-8 pb-4">
                <div className="flex items-center gap-5">
                    <div className="w-12 h-12 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center">
                        <Trash2 size={24} />
                    </div>
                    <div>
                        <h2 className="text-xl font-black tracking-tighter uppercase text-red-600">Zona de Perigo</h2>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[2px]">Ações críticas para sua conta.</p>
                    </div>
                </div>

                <div className="bg-red-50/50 border border-red-100 p-8 rounded-[32px] max-w-2xl">
                    <h4 className="font-black uppercase text-xs text-red-600 mb-2">Excluir minha conta</h4>
                    <p className="text-xs text-slate-500 leading-relaxed mb-6 font-medium">
                        Ao excluir sua conta, todos os seus dados pessoais, certificados e acessos aos cursos serão removidos do nosso banco de dados. Esta ação não pode ser desfeita.
                    </p>
                    <button
                        onClick={handleDeleteAccount}
                        className="flex items-center justify-center gap-3 px-8 h-12 bg-red-600 text-white font-black uppercase tracking-widest text-[10px] rounded-xl hover:bg-red-700 transition-all shadow-md active:scale-95"
                    >
                        EXCLUIR CONTA PERMANENTEMENTE
                    </button>
                </div>
            </section>
        </div>
    )
}
