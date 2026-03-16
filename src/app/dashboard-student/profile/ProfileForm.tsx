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
        <form action={formAction} className="space-y-10">
            <div className="space-y-8">
                <div className="flex items-center gap-6 mb-10">
                    <div className="w-20 h-20 bg-[#1e4d2b]/20 border border-[#1e4d2b] rounded-none flex items-center justify-center text-white shadow-sm relative overflow-hidden group/avatar">
                        <User size={40} className="group-hover/avatar:scale-110 transition-transform duration-500 text-slate-400" />
                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/avatar:opacity-100 transition-opacity" />
                    </div>
                    <div>
                        <h2 className="text-xl font-black tracking-tighter uppercase text-white leading-tight">Informações Básicas</h2>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[2px]">Como você aparece para os instrutores e colegas.</p>
                    </div>
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
                            className="w-full bg-[#1e4d2b]/20 border border-[#1e4d2b] rounded-none px-5 py-4 focus:outline-none focus:border-[#00C402] focus:ring-4 focus:ring-[#00C402]/5 transition-all text-white font-medium placeholder-slate-500"
                            placeholder="Seu nome"
                            required
                        />
                    </div>
                </div>

                {state?.success && (
                    <div className="flex items-center gap-2 p-4 bg-green-950/20 border border-green-900/40 rounded-none text-green-500 text-xs font-bold uppercase tracking-wider animate-in fade-in slide-in-from-top-2">
                        <CheckCircle2 size={16} />
                        Perfil atualizado com sucesso!
                    </div>
                )}

                {state?.error && (
                    <div className="flex items-center gap-2 p-4 bg-red-950/20 border border-red-900/40 rounded-none text-red-500 text-xs font-bold uppercase tracking-wider animate-in fade-in slide-in-from-top-2">
                        <AlertCircle size={16} />
                        {state.error}
                    </div>
                )}
            </div>

            <div className="pt-8 border-t border-[#1e4d2b]">
                <button
                    type="submit"
                    disabled={isPending}
                    className="flex items-center justify-center gap-3 w-full md:w-auto px-12 h-14 bg-[#00C402] text-white font-black uppercase tracking-[2px] rounded-none hover:bg-[#28b828] transition-all shadow-lg active:scale-95 disabled:opacity-50 disabled:hover:scale-100 group"
                >
                    <Save size={20} className={`${isPending ? 'animate-pulse' : ''} group-hover:scale-110 transition-transform`} />
                    {isPending ? 'Salvando...' : 'Salvar Alterações'}
                </button>
            </div>
        </form>
    )
}
