"use client"

import { useState } from 'react'
import { User, Mail, BookOpen, Camera, Save, Globe, Linkedin, Twitter, Youtube, Loader2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { updateTeacherProfile } from './actions'
import { uploadCourseImage } from '@/lib/storage-helpers'
import { useRouter } from 'next/navigation'

export default function ClientProfileForm({ initialData, email }: { initialData: any, email: string }) {
    const router = useRouter()
    
    const [name, setName] = useState(initialData?.full_name || '')
    const [specialization, setSpecialization] = useState(initialData?.specialty || '')
    const [bio, setBio] = useState(initialData?.bio || '')
    
    // Redes sociais
    const [website, setWebsite] = useState(initialData?.website || '')
    const [linkedin, setLinkedin] = useState(initialData?.linkedin || '')
    const [twitter, setTwitter] = useState(initialData?.twitter || '')
    const [youtube, setYoutube] = useState(initialData?.youtube || '')

    // Avatar
    const [avatarUrl, setAvatarUrl] = useState(initialData?.avatar_url || '')
    const [isUploading, setIsUploading] = useState(false)
    const [isSaving, setIsSaving] = useState(false)

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setIsUploading(true)
        try {
            // Reusing uploadCourseImage helper since it works for generic images, 
            // but ideally we could have an uploadProfileImage. Here we just use what we have.
            const url = await uploadCourseImage(file)
            setAvatarUrl(url)
        } catch (error) {
            console.error("Erro ao fazer upload da imagem:", error)
        } finally {
            setIsUploading(false)
        }
    }

    const handleSave = async () => {
        setIsSaving(true)
        try {
            await updateTeacherProfile({
                full_name: name,
                specialty: specialization,
                bio,
                avatar_url: avatarUrl,
                website,
                linkedin,
                twitter,
                youtube
            })
            // Opcional: toast de sucesso
            router.refresh()
        } catch (error) {
            console.error("Erro ao salvar:", error)
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <div className="max-w-4xl mx-auto bg-[#061629] border border-[#1D5F31] rounded-none p-10 md:p-16 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#061629] rounded-none blur-3xl -mr-32 -mt-32 -z-10 opacity-20"></div>

            <div className="flex flex-col md:flex-row gap-16 relative z-10">
                {/* Foto de Perfil */}
                <div className="flex flex-col items-center space-y-6 shrink-0">
                    <div className="relative group">
                        <div className="w-40 h-40 rounded-none bg-[#061629] border-2 border-dashed border-[#1D5F31] flex items-center justify-center text-slate-500 overflow-hidden transition-all group-hover:border-[#1D5F31]/30 group-hover:bg-[#1D5F31]/5">
                            {avatarUrl ? (
                                <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                            ) : (
                                <User size={56} strokeWidth={1.5} />
                            )}
                        </div>
                        
                        <label className="absolute -bottom-4 -right-4 w-14 h-14 bg-black text-white rounded-none flex items-center justify-center shadow-2xl hover:bg-slate-900 transition-all hover:scale-110 border-4 border-[#061629] cursor-pointer group-hover:bg-[#1D5F31]">
                            {isUploading ? <Loader2 className="animate-spin" size={24} /> : <Camera size={24} />}
                            <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={isUploading} />
                        </label>
                    </div>
                    <div className="text-center">
                        <p className="text-[10px] font-black uppercase tracking-widest text-[#1D5F31]">Foto Quadrada</p>
                        <p className="text-[9px] font-bold text-slate-500 mt-1 uppercase">JPG/PNG Ideal 500x500px</p>
                    </div>
                </div>

                {/* Formulário */}
                <div className="flex-grow space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase tracking-[3px] text-slate-500 px-1">Nome de Exibição</label>
                            <div className="relative group">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-[#1D5F31] transition-colors" size={18} />
                                <Input
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="bg-[#061629] border-[#1D5F31] rounded-none pl-12 h-14 focus:border-[#1D5F31] focus:ring-1 focus:ring-[#1D5F31]/20 font-bold text-white placeholder:text-slate-600"
                                />
                            </div>
                        </div>
                        <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase tracking-[3px] text-slate-500 px-1">E-mail Administrativo</label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-700" size={18} />
                                <Input
                                    value={email}
                                    readOnly
                                    className="bg-black/20 border-[#1D5F31]/50 pl-12 h-14 text-slate-500 cursor-not-allowed rounded-none font-medium"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-[3px] text-slate-500 px-1">Expertise / Especialização</label>
                        <div className="relative group">
                            <BookOpen className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-[#1D5F31] transition-colors" size={18} />
                            <Input
                                value={specialization}
                                onChange={(e) => setSpecialization(e.target.value)}
                                className="bg-[#061629] border-[#1D5F31] rounded-none pl-12 h-14 focus:border-[#1D5F31] focus:ring-1 focus:ring-[#1D5F31]/20 font-bold text-white placeholder:text-slate-600"
                                placeholder="Ex: Estrategista Digital, Especialista em Performance..."
                            />
                        </div>
                    </div>

                    <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-[3px] text-slate-500 px-1">Biografia Profissional</label>
                        <textarea
                            value={bio}
                            onChange={(e) => setBio(e.target.value)}
                            className="w-full min-h-[160px] bg-[#061629] border border-[#1D5F31] rounded-none p-6 text-sm font-medium focus:outline-none focus:border-[#1D5F31] focus:ring-1 focus:ring-[#1D5F31]/20 transition-all resize-none text-slate-300 leading-relaxed placeholder:text-slate-600"
                            placeholder="Descreva sua jornada e o valor que você entrega aos seus alunos..."
                        />
                    </div>

                    {/* Redes Sociais */}
                    <div className="space-y-6 pt-4 border-t border-white/5">
                        <h3 className="text-sm font-black text-white uppercase tracking-tighter">Links Sociais e Contato</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-3">
                                <label className="text-[10px] font-black uppercase tracking-[3px] text-slate-500 px-1">Website</label>
                                <div className="relative group">
                                    <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-[#1D5F31] transition-colors" size={18} />
                                    <Input
                                        value={website}
                                        onChange={(e) => setWebsite(e.target.value)}
                                        className="bg-[#061629] border-[#1D5F31] rounded-none pl-12 h-14 focus:border-[#1D5F31] focus:ring-1 focus:ring-[#1D5F31]/20 font-bold text-white text-sm placeholder:text-slate-600"
                                        placeholder="https://seu-site.com"
                                    />
                                </div>
                            </div>
                            <div className="space-y-3">
                                <label className="text-[10px] font-black uppercase tracking-[3px] text-slate-500 px-1">LinkedIn</label>
                                <div className="relative group">
                                    <Linkedin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors" size={18} />
                                    <Input
                                        value={linkedin}
                                        onChange={(e) => setLinkedin(e.target.value)}
                                        className="bg-[#061629] border-[#1D5F31] rounded-none pl-12 h-14 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 font-bold text-white text-sm placeholder:text-slate-600"
                                        placeholder="URL do Perfil"
                                    />
                                </div>
                            </div>
                            <div className="space-y-3">
                                <label className="text-[10px] font-black uppercase tracking-[3px] text-slate-500 px-1">Twitter / X</label>
                                <div className="relative group">
                                    <Twitter className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-sky-500 transition-colors" size={18} />
                                    <Input
                                        value={twitter}
                                        onChange={(e) => setTwitter(e.target.value)}
                                        className="bg-[#061629] border-[#1D5F31] rounded-none pl-12 h-14 focus:border-sky-500 focus:ring-1 focus:ring-sky-500/20 font-bold text-white text-sm placeholder:text-slate-600"
                                        placeholder="URL do Perfil"
                                    />
                                </div>
                            </div>
                            <div className="space-y-3">
                                <label className="text-[10px] font-black uppercase tracking-[3px] text-slate-500 px-1">Youtube</label>
                                <div className="relative group">
                                    <Youtube className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-red-500 transition-colors" size={18} />
                                    <Input
                                        value={youtube}
                                        onChange={(e) => setYoutube(e.target.value)}
                                        className="bg-[#061629] border-[#1D5F31] rounded-none pl-12 h-14 focus:border-red-500 focus:ring-1 focus:ring-red-500/20 font-bold text-white text-sm placeholder:text-slate-600"
                                        placeholder="URL do Canal"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="pt-6">
                        <Button 
                            onClick={handleSave}
                            disabled={isSaving || isUploading}
                            className="bg-[#1D5F31] text-white font-black uppercase tracking-[4px] py-8 px-12 rounded-none hover:bg-[#00A802] shadow-2xl transition-all gap-4 w-full md:w-auto h-auto"
                        >
                            {isSaving ? <Loader2 className="animate-spin" size={24} strokeWidth={3} /> : <Save size={24} strokeWidth={3} />}
                            {isSaving ? 'Sincronizando...' : 'Sincronizar Perfil'}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}
