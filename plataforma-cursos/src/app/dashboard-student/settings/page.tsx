"use client"

import { auth } from '@/lib/firebase'
import { onAuthStateChanged } from 'firebase/auth'
import { useRouter } from 'next/navigation'
import { updatePassword } from '../actions'
import { Lock, CreditCard, Trash2, ArrowLeft, Save } from 'lucide-react'
import Link from 'next/link'
import DeleteAccountButton from '@/components/DeleteAccountButton'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export default function SettingsPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [user, setUser] = useState<any>(null)
    const [pixKey, setPixKey] = useState('')
    const [bank, setBank] = useState('')

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

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#F5F7FA]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#00C402]"></div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#F5F7FA] font-exo p-8 md:p-12 border-t border-slate-100">
            <div className="max-w-4xl mx-auto space-y-12">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-black tracking-tighter uppercase mb-1 text-slate-900 leading-none">
                            Configurações <span className="text-[#00C402]">Gerais</span>
                        </h1>
                        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[3px]">Gerencie sua segurança e dados de pagamento.</p>
                    </div>
                    <Link
                        href="/dashboard-student"
                        className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 transition group bg-white px-5 py-3 rounded-xl border border-slate-100 shadow-sm"
                    >
                        <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
                        Voltar
                    </Link>
                </div>

                <div className="grid grid-cols-1 gap-12">
                    {/* Segurança / Senha */}
                    <section className="bg-white border border-slate-100 rounded-[32px] p-8 md:p-10 shadow-sm space-y-8">
                        <div className="flex items-center gap-5">
                            <div className="w-14 h-14 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center text-slate-900 shadow-sm">
                                <Lock size={20} />
                            </div>
                            <div>
                                <h2 className="text-lg font-black tracking-tighter uppercase text-slate-900">Segurança da Conta</h2>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[2px]">Atualize sua senha de acesso.</p>
                            </div>
                        </div>

                        <form action={async (formData) => {
                            const res = await updatePassword(formData)
                            if (res.success) {
                                alert('Senha atualizada com sucesso!')
                            } else {
                                alert('Erro ao atualizar senha: ' + res.error)
                            }
                        }} className="space-y-6">
                            <div className="max-w-md space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Nova Senha</label>
                                <Input
                                    type="password"
                                    name="password"
                                    className="bg-slate-50 border-slate-100 focus:border-[#00C402] focus:ring-[#00C402] rounded-xl h-14 text-sm font-medium transition-all"
                                    placeholder="••••••••"
                                    required
                                    minLength={6}
                                />
                            </div>
                            <Button
                                type="submit"
                                className="bg-slate-900 hover:bg-slate-800 text-white font-black uppercase tracking-[2px] rounded-xl px-10 h-14 shadow-lg shadow-slate-100 transition-all flex items-center justify-center gap-2"
                            >
                                <Save size={18} />
                                Atualizar Senha
                            </Button>
                        </form>
                    </section>

                    {/* Dados Bancários */}
                    <section className="bg-white border border-slate-100 rounded-[32px] p-8 md:p-10 shadow-sm space-y-8">
                        <div className="flex items-center gap-5">
                            <div className="w-14 h-14 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center text-slate-900 shadow-sm">
                                <CreditCard size={20} />
                            </div>
                            <div>
                                <h2 className="text-lg font-black tracking-tighter uppercase text-slate-900">Dados Bancários</h2>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[2px]">Para recebimento de reembolsos ou parcerias.</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Chave PIX</label>
                                <Input
                                    type="text"
                                    value={pixKey}
                                    onChange={(e) => setPixKey(e.target.value)}
                                    className="bg-slate-50 border-slate-100 focus:border-[#00C402] focus:ring-[#00C402] rounded-xl h-14 text-sm font-medium transition-all"
                                    placeholder="CPF, Email ou Aleatória"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Banco</label>
                                <Input
                                    type="text"
                                    value={bank}
                                    onChange={(e) => setBank(e.target.value)}
                                    className="bg-slate-50 border-slate-100 focus:border-[#00C402] focus:ring-[#00C402] rounded-xl h-14 text-sm font-medium transition-all"
                                    placeholder="Ex: Nubank, Itaú..."
                                />
                            </div>
                        </div>
                        <Button
                            className="bg-white hover:bg-slate-50 border border-slate-100 text-slate-900 font-black uppercase tracking-[2px] rounded-xl px-10 h-14 shadow-sm transition-all"
                        >
                            Salvar Dados
                        </Button>
                    </section>

                    {/* Zona de Perigo */}
                    <section className="bg-red-50 border border-red-100 rounded-[32px] p-8 md:p-10 shadow-sm space-y-8">
                        <div className="flex items-center gap-5">
                            <div className="w-14 h-14 bg-white border border-red-100 rounded-2xl flex items-center justify-center text-red-500 shadow-sm">
                                <Trash2 size={20} />
                            </div>
                            <div>
                                <h2 className="text-lg font-black tracking-tighter uppercase text-red-500">Zona de Perigo</h2>
                                <p className="text-[10px] text-red-400/80 font-bold uppercase tracking-[2px]">Ações irreversíveis sobre sua conta.</p>
                            </div>
                        </div>

                        <p className="text-[11px] text-red-600/70 max-w-lg font-bold uppercase tracking-wider leading-relaxed bg-white/50 p-4 rounded-xl border border-red-100/50">
                            Ao excluir sua conta, você perderá acesso a todos os seus cursos adquiridos, certificados e progresso de forma definitiva.
                        </p>

                        <DeleteAccountButton />
                    </section>
                </div>
            </div>
        </div>
    )
}
