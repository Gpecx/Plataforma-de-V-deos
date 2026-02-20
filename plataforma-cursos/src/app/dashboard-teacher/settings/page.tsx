"use client"

import { useState } from 'react'
import { Settings, DollarSign, Bell, Shield, Wallet, Save } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export default function TeacherSettingsPage() {
    const [pixKey, setPixKey] = useState('')
    const [emailEnabled, setEmailEnabled] = useState(true)
    const [browserEnabled, setBrowserEnabled] = useState(false)

    return (
        <div className="min-h-screen bg-[#061629] p-8 md:p-12 space-y-12">
            <header>
                <h1 className="text-3xl font-black italic uppercase tracking-tighter">
                    Configurações do <span className="text-[#00FF00]">Professor</span>
                </h1>
                <p className="text-gray-400 mt-1">Gerencie suas preferências de pagamento e notificações.</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Configurações Financeiras */}
                <section className="bg-[#0a1f3a]/40 border border-white/5 rounded-3xl p-8 backdrop-blur-md space-y-8">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-green-500/10 rounded-xl text-green-500">
                            <Wallet size={24} />
                        </div>
                        <h2 className="text-xl font-bold italic tracking-tight uppercase">Dados de Faturamento</h2>
                    </div>

                    <div className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-xs font-black uppercase tracking-widest text-gray-500">Chave PIX para Recebimento</label>
                            <div className="relative">
                                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                <Input
                                    value={pixKey}
                                    onChange={(e) => setPixKey(e.target.value)}
                                    placeholder="CPF, E-mail ou Chave Aleatória"
                                    className="bg-black/20 border-white/10 pl-10 focus:border-[#00FF00]"
                                />
                            </div>
                            <p className="text-[10px] text-gray-500 italic">As comissões serão enviadas para esta chave automaticamente.</p>
                        </div>
                    </div>
                </section>

                {/* Notificações */}
                <section className="bg-[#0a1f3a]/40 border border-white/5 rounded-3xl p-8 backdrop-blur-md space-y-8">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-blue-500/10 rounded-xl text-blue-500">
                            <Bell size={24} />
                        </div>
                        <h2 className="text-xl font-bold italic tracking-tight uppercase">Notificações</h2>
                    </div>

                    <div className="space-y-6">
                        <div className="flex items-center justify-between p-4 bg-black/20 rounded-2xl border border-white/5">
                            <div>
                                <h3 className="text-sm font-bold">Relatórios Semanais</h3>
                                <p className="text-xs text-gray-500">Receba um resumo de vendas por e-mail.</p>
                            </div>
                            <button
                                onClick={() => setEmailEnabled(!emailEnabled)}
                                className={`w-12 h-6 rounded-full transition-colors relative ${emailEnabled ? 'bg-[#00FF00]' : 'bg-gray-700'}`}
                            >
                                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${emailEnabled ? 'right-1' : 'left-1'}`}></div>
                            </button>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-black/20 rounded-2xl border border-white/5">
                            <div>
                                <h3 className="text-sm font-bold">Novos Alunos</h3>
                                <p className="text-xs text-gray-500">Alertas em tempo real no seu navegador.</p>
                            </div>
                            <button
                                onClick={() => setBrowserEnabled(!browserEnabled)}
                                className={`w-12 h-6 rounded-full transition-colors relative ${browserEnabled ? 'bg-[#00FF00]' : 'bg-gray-700'}`}
                            >
                                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${browserEnabled ? 'right-1' : 'left-1'}`}></div>
                            </button>
                        </div>
                    </div>
                </section>

                {/* Segurança */}
                <section className="bg-[#0a1f3a]/40 border border-white/5 rounded-3xl p-8 backdrop-blur-md space-y-8 lg:col-span-2">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-amber-500/10 rounded-xl text-amber-500">
                            <Shield size={24} />
                        </div>
                        <h2 className="text-xl font-bold italic tracking-tight uppercase">Conta e Segurança</h2>
                    </div>

                    <div className="flex flex-col md:flex-row gap-8">
                        <div className="flex-grow space-y-4">
                            <h3 className="text-sm font-bold">Alterar Senha</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Input type="password" placeholder="Nova senha" className="bg-black/20 border-white/10 focus:border-[#00FF00]" />
                                <Input type="password" placeholder="Confirmar nova senha" className="bg-black/20 border-white/10 focus:border-[#00FF00]" />
                            </div>
                        </div>
                        <div className="flex items-end">
                            <Button variant="outline" className="border-white/10 text-white hover:bg-white/5 px-8">Atualizar Acesso</Button>
                        </div>
                    </div>
                </section>
            </div>

            <div className="flex justify-end pt-8">
                <Button className="bg-[#00FF00] text-black font-black uppercase tracking-widest py-6 px-12 rounded-2xl hover:brightness-110 shadow-[0_0_20px_rgba(0,255,0,0.3)] transition-all gap-2">
                    <Save size={20} />
                    Salvar Configurações
                </Button>
            </div>
        </div>
    )
}
