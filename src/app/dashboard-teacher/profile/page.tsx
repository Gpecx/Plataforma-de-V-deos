"use client"

import { useState } from 'react'
import { User, Mail, BookOpen, Camera, Save } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export default function TeacherProfilePage() {
    const [name, setName] = useState('Daniel Siqueira')
    const [email, setEmail] = useState('daniel.s@email.com')
    const [specialization, setSpecialization] = useState('Desenvolvimento Fullstack')
    const [bio, setBio] = useState('Especialista em React e Node.js com mais de 10 anos de experiência no mercado de educação tech.')

    return (
        <div className="min-h-screen bg-[#061629] p-8 md:p-12 space-y-12">
            <header>
                <h1 className="text-3xl font-black italic uppercase tracking-tighter">
                    Editar <span className="text-[#00FF00]">Perfil</span>
                </h1>
                <p className="text-gray-400 mt-1">Gerencie suas informações públicas e como os alunos te veem.</p>
            </header>

            <div className="max-w-4xl bg-[#0a1f3a]/40 border border-white/5 rounded-3xl p-8 md:p-12 backdrop-blur-md">
                <div className="flex flex-col md:flex-row gap-12">
                    {/* Foto de Perfil */}
                    <div className="flex flex-col items-center space-y-4">
                        <div className="relative group">
                            <div className="w-32 h-32 rounded-full bg-[#00FF00]/10 border-2 border-dashed border-[#00FF00]/30 flex items-center justify-center text-[#00FF00] overflow-hidden">
                                <User size={48} />
                            </div>
                            <button className="absolute bottom-0 right-0 w-10 h-10 bg-[#00FF00] text-black rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform">
                                <Camera size={20} />
                            </button>
                        </div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">Alterar Foto</p>
                    </div>

                    {/* Formulário */}
                    <div className="flex-grow space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-xs font-black uppercase tracking-widest text-[#00FF00]">Nome Completo</label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                                    <Input
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="bg-black/20 border-white/10 pl-10 focus:border-[#00FF00]"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-black uppercase tracking-widest text-[#00FF00]">E-mail Público</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                                    <Input
                                        value={email}
                                        readOnly
                                        className="bg-black/10 border-white/5 pl-10 text-gray-500 cursor-not-allowed"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-black uppercase tracking-widest text-[#00FF00]">Especialização</label>
                            <div className="relative">
                                <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                                <Input
                                    value={specialization}
                                    onChange={(e) => setSpecialization(e.target.value)}
                                    className="bg-black/20 border-white/10 pl-10 focus:border-[#00FF00]"
                                    placeholder="Ex: Marketing Digital, Design, Programação..."
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-black uppercase tracking-widest text-[#00FF00]">Biografia / Resumo</label>
                            <textarea
                                value={bio}
                                onChange={(e) => setBio(e.target.value)}
                                className="w-full min-h-[150px] bg-black/20 border border-white/10 rounded-xl p-4 text-sm focus:outline-none focus:border-[#00FF00] transition-colors resize-none"
                                placeholder="Conte um pouco sobre sua trajetória profissional..."
                            />
                        </div>

                        <div className="pt-4">
                            <Button className="bg-[#00FF00] text-black font-black uppercase tracking-widest py-6 px-10 rounded-2xl hover:brightness-110 shadow-[0_0_20px_rgba(0,255,0,0.3)] transition-all gap-2">
                                <Save size={20} />
                                Salvar Alterações
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
