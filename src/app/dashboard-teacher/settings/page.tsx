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
        <div className="min-h-screen bg-[#F4F7F9] px-8 py-6 md:px-12 md:py-8 space-y-12 font-exo border-t border-slate-100">
            <header className="max-w-6xl mx-auto">
                <div className="flex items-center gap-3 mb-2">
                    <span className="text-[10px] font-black uppercase tracking-[5px] text-[#00C402]">WORKSPACE SETTINGS</span>
                </div>
                <h1 className="text-4xl font-black tracking-tighter text-slate-800">
                    CONFIGURAÇÕES DO <span className="text-[#00C402] uppercase">TEACHER</span>
                </h1>
                <p className="text-slate-500 mt-2 font-semibold text-xs tracking-widest uppercase">Gerencie suas preferências de faturamento e alertas de sistema.</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
                {/* Configurações Financeiras */}
                <section className="bg-white border border-slate-100 rounded-[32px] p-10 shadow-sm space-y-10">
                    <div className="flex items-center gap-4">
                        <div className="p-4 bg-slate-50 rounded-2xl text-slate-900 border border-slate-100">
                            <Wallet size={24} strokeWidth={2.5} />
                        </div>
                        <div>
                            <h2 className="text-xl font-black uppercase tracking-tighter text-slate-900 leading-none">Dados de Saída</h2>
                            <p className="text-[10px] font-bold uppercase tracking-[2px] text-slate-400 mt-2">Como você recebe seus lucros.</p>
                        </div>
                    </div>

                    <div className="space-y-8">
                        <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase tracking-[3px] text-slate-400 px-1">Chave PIX Estratégica</label>
                            <div className="relative group">
                                <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#00C402] transition-colors" size={20} />
                                <Input
                                    value={pixKey}
                                    onChange={(e) => setPixKey(e.target.value)}
                                    placeholder="CPF, E-mail ou Chave Aleatória"
                                    className="bg-slate-50 border-slate-100 rounded-2xl pl-12 h-14 focus:border-[#00C402] focus:ring-4 focus:ring-[#00C402]/5 font-bold text-sm"
                                />
                            </div>
                            <p className="text-[9px] text-slate-400 font-medium italic px-1">As comissões de vendas serão auditadas e enviadas para esta chave.</p>
                        </div>
                    </div>
                </section>

                {/* Notificações */}
                <section className="bg-white border border-slate-100 rounded-[32px] p-10 shadow-sm space-y-10">
                    <div className="flex items-center gap-4">
                        <div className="p-4 bg-slate-50 rounded-2xl text-slate-900 border border-slate-100">
                            <Bell size={24} strokeWidth={2.5} />
                        </div>
                        <div>
                            <h2 className="text-xl font-black uppercase tracking-tighter text-slate-900 leading-none">Alertas Digitais</h2>
                            <p className="text-[10px] font-bold uppercase tracking-[2px] text-slate-400 mt-2">Fique por dentro de cada nova venda.</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-6 bg-slate-50 rounded-2xl border border-slate-100 hover:border-slate-200 transition-all">
                            <div>
                                <h3 className="text-xs font-black uppercase tracking-widest text-slate-900">Relatórios de Performance</h3>
                                <p className="text-[10px] text-slate-500 font-medium mt-1">Resumo semanal do ecossistema por e-mail.</p>
                            </div>
                            <button
                                onClick={() => setEmailEnabled(!emailEnabled)}
                                className={`w-12 h-6 rounded-full transition-all relative ${emailEnabled ? 'bg-[#00C402]' : 'bg-slate-200 shadow-inner'}`}
                            >
                                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all shadow-md ${emailEnabled ? 'right-1' : 'left-1'}`}></div>
                            </button>
                        </div>

                        <div className="flex items-center justify-between p-6 bg-slate-50 rounded-2xl border border-slate-100 hover:border-slate-200 transition-all">
                            <div>
                                <h3 className="text-xs font-black uppercase tracking-widest text-slate-900">Novos Leads e Alunos</h3>
                                <p className="text-[10px] text-slate-500 font-medium mt-1">Push notifications em tempo real.</p>
                            </div>
                            <button
                                onClick={() => setBrowserEnabled(!browserEnabled)}
                                className={`w-12 h-6 rounded-full transition-all relative ${browserEnabled ? 'bg-[#00C402]' : 'bg-slate-200 shadow-inner'}`}
                            >
                                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all shadow-md ${browserEnabled ? 'right-1' : 'left-1'}`}></div>
                            </button>
                        </div>
                    </div>
                </section>

                {/* Segurança */}
                <section className="bg-white border border-slate-100 rounded-[32px] p-10 shadow-sm space-y-10 lg:col-span-2 relative overflow-hidden group">
                    <div className="flex items-center gap-4 relative z-10">
                        <div className="p-4 bg-slate-50 rounded-2xl text-[#00C402] border border-slate-100">
                            <Shield size={24} strokeWidth={2.5} />
                        </div>
                        <div>
                            <h2 className="text-xl font-black uppercase tracking-tighter text-slate-900 leading-none">Protocolos de Acesso</h2>
                            <p className="text-[10px] font-bold uppercase tracking-[2px] text-slate-400 mt-2">Proteção de dados e soberania da conta.</p>
                        </div>
                    </div>

                    <div className="flex flex-col md:flex-row gap-12 relative z-10">
                        <div className="flex-grow space-y-6">
                            <h3 className="text-[10px] font-black uppercase tracking-[3px] text-slate-400 px-1">Redefinição de Credenciais</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <Input type="password" placeholder="Nova senha master" className="bg-slate-50 border-slate-100 h-14 rounded-2xl text-slate-900 focus:border-[#00C402] placeholder:text-slate-400 font-bold text-sm" />
                                <Input type="password" placeholder="Confirmar nova senha" className="bg-slate-50 border-slate-100 h-14 rounded-2xl text-slate-900 focus:border-[#00C402] placeholder:text-slate-400 font-bold text-sm" />
                            </div>
                        </div>
                        <div className="flex items-end">
                            <Button variant="outline" className="border-slate-100 text-slate-400 hover:bg-slate-50 hover:text-slate-900 h-14 px-8 rounded-2xl font-black uppercase tracking-[2px] text-[10px] transition-all">Sincronizar Acesso</Button>
                        </div>
                    </div>
                </section>

                {/* Encerramento de Conta */}
                <section className="bg-white border border-red-100 rounded-[32px] p-10 shadow-sm space-y-8 lg:col-span-2 relative overflow-hidden group">
                    <div className="flex items-center gap-4 relative z-10">
                        <div className="p-4 bg-red-50 rounded-2xl text-red-500 border border-red-100">
                            <Shield size={24} strokeWidth={2.5} />
                        </div>
                        <div>
                            <h2 className="text-xl font-black uppercase tracking-tighter text-red-600 leading-none">Zona de Risco</h2>
                            <p className="text-[10px] font-bold uppercase tracking-[2px] text-slate-400 mt-2">Ações irreversíveis sobre o seu ecossistema.</p>
                        </div>
                    </div>

                    <div className="flex flex-col md:flex-row gap-8 relative z-10 items-start md:items-center justify-between bg-red-50/50 p-6 rounded-3xl border border-red-100">
                        <div>
                            <h3 className="text-sm font-black uppercase tracking-widest text-slate-900">Encerramento Definitivo</h3>
                            <p className="text-xs text-slate-500 font-medium mt-1">Ao excluir sua conta, todos os seus dados, alunos, comentários e faturamentos pendentes serão apagados permanentemente. Esta ação não pode ser desfeita.</p>
                        </div>
                        <div className="flex-shrink-0">
                            <Button variant="destructive" className="bg-red-600 hover:bg-red-700 text-white h-14 px-8 rounded-2xl font-black uppercase tracking-[2px] text-[10px] shadow-lg shadow-red-600/20 transition-all w-full md:w-auto">
                                Excluir Minha Conta
                            </Button>
                        </div>
                    </div>
                </section>
            </div>

            <div className="flex justify-end pt-8 max-w-6xl mx-auto">
                <Button className="bg-[#00C402] text-white font-black uppercase tracking-[3px] h-14 px-12 rounded-2xl hover:brightness-110 shadow-xl shadow-[#00C402]/20 transition-all gap-4 animate-in fade-in slide-in-from-bottom-4 text-[11px]">
                    <Save size={18} strokeWidth={3} />
                    Salvar Alterações
                </Button>
            </div>
        </div>
    )
}
