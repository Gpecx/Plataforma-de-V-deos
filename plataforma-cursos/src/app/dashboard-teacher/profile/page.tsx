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
        <div className="min-h-screen bg-[#F4F7F9] p-8 md:p-12 space-y-16 font-exo border-t border-slate-100">
            <header className="max-w-4xl mx-auto">
                <div className="flex items-center gap-3 mb-2">
                    <span className="text-[10px] font-black uppercase tracking-[5px] text-[#00C402]">PROFILE MANAGEMENT</span>
                </div>
                <h1 className="text-4xl font-black tracking-tighter text-slate-800">
                    IDENTIDADE DO <span className="text-[#00C402] uppercase">TEACHER</span>
                </h1>
                <p className="text-slate-500 mt-2 font-semibold text-xs tracking-widest uppercase">Gerencie como você se apresenta para o mercado e seus alunos.</p>
            </header>

            <div className="max-w-4xl mx-auto bg-white border border-slate-100 rounded-[48px] p-10 md:p-16 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-slate-50 rounded-full blur-3xl -mr-32 -mt-32 -z-10"></div>

                <div className="flex flex-col md:flex-row gap-16 relative z-10">
                    {/* Foto de Perfil */}
                    <div className="flex flex-col items-center space-y-6">
                        <div className="relative group">
                            <div className="w-40 h-40 rounded-[40px] bg-slate-50 border-2 border-dashed border-slate-200 flex items-center justify-center text-slate-300 overflow-hidden transition-all group-hover:border-[#00C402]/30 group-hover:bg-[#00C402]/5">
                                <User size={56} strokeWidth={1.5} />
                            </div>
                            <button className="absolute -bottom-4 -right-4 w-14 h-14 bg-slate-900 text-white rounded-[20px] flex items-center justify-center shadow-2xl hover:bg-slate-800 transition-all hover:scale-110 border-4 border-white">
                                <Camera size={24} />
                            </button>
                        </div>
                        <div className="text-center">
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Dimensões sugeridas</p>
                            <p className="text-[9px] font-bold text-slate-300 mt-1 uppercase">500x500px • JPG/PNG</p>
                        </div>
                    </div>

                    {/* Formulário */}
                    <div className="flex-grow space-y-10">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-3">
                                <label className="text-[10px] font-black uppercase tracking-[3px] text-slate-400 px-1">Nome de Exibição</label>
                                <div className="relative group">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#00C402] transition-colors" size={18} />
                                    <Input
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="bg-slate-50 border-slate-100 rounded-2xl pl-12 h-14 focus:border-[#00C402] focus:ring-4 focus:ring-[#00C402]/5 font-bold text-slate-900"
                                    />
                                </div>
                            </div>
                            <div className="space-y-3">
                                <label className="text-[10px] font-black uppercase tracking-[3px] text-slate-400 px-1">E-mail Administrativo</label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-200" size={18} />
                                    <Input
                                        value={email}
                                        readOnly
                                        className="bg-slate-50/50 border-slate-50 pl-12 h-14 text-slate-400 cursor-not-allowed rounded-2xl font-medium"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase tracking-[3px] text-slate-400 px-1">Expertise / Especialização</label>
                            <div className="relative group">
                                <BookOpen className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#00C402] transition-colors" size={18} />
                                <Input
                                    value={specialization}
                                    onChange={(e) => setSpecialization(e.target.value)}
                                    className="bg-slate-50 border-slate-100 rounded-2xl pl-12 h-14 focus:border-[#00C402] focus:ring-4 focus:ring-[#00C402]/5 font-bold text-slate-900"
                                    placeholder="Ex: Estrategista Digital, Especialista em Performance..."
                                />
                            </div>
                        </div>

                        <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase tracking-[3px] text-slate-400 px-1">Biografia Profissional</label>
                            <textarea
                                value={bio}
                                onChange={(e) => setBio(e.target.value)}
                                className="w-full min-h-[160px] bg-slate-50 border border-slate-100 rounded-[32px] p-6 text-sm font-medium focus:outline-none focus:border-[#00C402] focus:ring-4 focus:ring-[#00C402]/5 transition-all resize-none text-slate-700 leading-relaxed"
                                placeholder="Descreva sua jornada e o valor que você entrega aos seus alunos..."
                            />
                        </div>

                        <div className="pt-6">
                            <Button className="bg-slate-900 text-white font-black uppercase tracking-[4px] py-8 px-12 rounded-[24px] hover:bg-slate-800 shadow-2xl shadow-slate-200 transition-all gap-4 w-full md:w-auto h-auto">
                                <Save size={24} strokeWidth={3} />
                                Sincronizar Perfil
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
