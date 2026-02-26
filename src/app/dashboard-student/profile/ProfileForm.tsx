'use client'

import { useActionState } from 'react'
import { updateProfile } from '../actions'
import { User, Save, CheckCircle2, AlertCircle } from 'lucide-react'

interface ProfileFormProps {
    initialFullName: string
}

const initialState = {
    success: false,
    error: undefined as string | undefined
}

export function ProfileForm({ initialFullName }: ProfileFormProps) {
    const [state, formAction, isPending] = useActionState(updateProfile, initialState)

    return (
        <form action={formAction} className="space-y-8">
            <div className="space-y-6">
                <div className="flex items-center gap-4 mb-8">
                    <div className="w-16 h-16 bg-[#00C402] rounded-full flex items-center justify-center text-black shadow-[0_0_20px_rgba(0,196,2,0.3)]">
                        <User size={32} />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold">Informações Básicas</h2>
                        <p className="text-sm text-gray-400">Como você aparece para os instrutores e colegas.</p>
                    </div>
                </div>

                <div className="group relative">
                    <label className="block text-xs font-bold uppercase tracking-widest text-[#00C402] mb-2 px-1">
                        Nome Completo
                    </label>
                    <input
                        type="text"
                        name="fullName"
                        defaultValue={initialFullName}
                        className="w-full bg-[#0a1f3a] border border-white/10 rounded-xl px-4 py-4 focus:outline-none focus:border-[#00C402] focus:ring-1 focus:ring-[#00C402] transition-all text-white placeholder-gray-600"
                        placeholder="Seu nome"
                        required
                    />
                </div>

                {state?.success && (
                    <div className="flex items-center gap-2 p-4 bg-green-500/10 border border-green-500/20 rounded-xl text-green-400 text-sm animate-in fade-in slide-in-from-top-2">
                        <CheckCircle2 size={16} />
                        Perfil atualizado com sucesso!
                    </div>
                )}

                {state?.error && (
                    <div className="flex items-center gap-2 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm animate-in fade-in slide-in-from-top-2">
                        <AlertCircle size={16} />
                        {state.error}
                    </div>
                )}
            </div>

            <div className="pt-4 border-t border-white/5">
                <button
                    type="submit"
                    disabled={isPending}
                    className="flex items-center justify-center gap-3 w-full md:w-auto px-10 py-4 bg-[#00C402] text-black font-black uppercase italic rounded-xl hover:scale-105 transition-all shadow-[0_0_20px_rgba(0,196,2,0.2)] active:scale-95 disabled:opacity-50 disabled:hover:scale-100"
                >
                    <Save size={20} className={isPending ? 'animate-pulse' : ''} />
                    {isPending ? 'Salvando...' : 'Salvar Alterações'}
                </button>
            </div>
        </form>
    )
}
