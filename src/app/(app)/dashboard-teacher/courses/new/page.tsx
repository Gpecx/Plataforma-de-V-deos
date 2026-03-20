"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
    ChevronRight,
    ChevronLeft,
    Check,
    Upload,
    Plus,
    Trash2,
    Info,
    Image as ImageIcon,
    ListTree,
    BookOpen,
    X,
    Loader2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

// Importamos a Store, a Action e o utilitário de Storage
import { useCourseFormStore, Lesson } from "@/store/useCourseFormStore"
import { createCourseAction } from "../actions"
import { uploadCourseImage, uploadCourseVideo } from "@/lib/storage-helpers"

const STEPS = [
    { id: 1, name: 'Informações Básicas', icon: Info },
    { id: 2, name: 'Mídia e Preço', icon: ImageIcon },
    { id: 3, name: 'Grade Curricular', icon: ListTree },
]

const CATEGORIES = [
    'Engenharia Elétrica',
    'Engenharia Civil',
    'Engenharia Mecânica',
    'Tecnologia da Informação',
    'Desenvolvimento Web',
    'Design',
    'Marketing Digital',
    'Negócios',
    'Finanças',
    'Saúde',
    'Outros'
]

export default function NewCoursePage() {
    const router = useRouter()
    const [currentStep, setCurrentStep] = useState(1)
    const [isPublishing, setIsPublishing] = useState(false)
    const [isUploading, setIsUploading] = useState(false)
    const [isUploadingIntro, setIsUploadingIntro] = useState(false)

    // Automatiza o scroll para o topo ao mudar de passo
    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }, [currentStep])

    // Usamos a Store em vez do useState local
    const { formData, setStepData, setLessons, resetForm } = useCourseFormStore()

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setIsUploading(true)
        try {
            const publicUrl = await uploadCourseImage(file)
            setStepData({ image_url: publicUrl })
            console.log("Upload concluído:", publicUrl)
        } catch (error) {
            console.error(error)
            alert("Erro ao subir imagem. Verifique sua conexão.")
        } finally {
            setIsUploading(false)
        }
    }

    const [uploadingVideos, setUploadingVideos] = useState<Record<number, boolean>>({})

    const handleAddLesson = () => {
        const newLesson: Lesson = {
            title: '',
            video_url: '',
            position: formData.lessons.length + 1
        }
        setLessons([...formData.lessons, newLesson])
    }

    const handleRemoveLesson = (index: number) => {
        const newLessons = formData.lessons.filter((_, i) => i !== index)
        setLessons(newLessons)
    }

    const handleUpdateLesson = (index: number, data: Partial<Lesson>) => {
        const newLessons = [...formData.lessons]
        newLessons[index] = { ...newLessons[index], ...data }
        setLessons(newLessons)
    }

    const handleVideoUpload = async (index: number, file: File) => {
        if (!file) return

        setUploadingVideos(prev => ({ ...prev, [index]: true }))
        try {
            const publicUrl = await uploadCourseVideo(file)
            handleUpdateLesson(index, { video_url: publicUrl })
        } catch (error: any) {
            alert(error.message || "Erro ao subir vídeo.")
        } finally {
            setUploadingVideos(prev => ({ ...prev, [index]: false }))
        }
    }

    const isStepValid = (step: number) => {
        if (step === 1) {
            return formData.title && formData.category && formData.description
        }
        if (step === 2) {
            return formData.price > 0
        }
        if (step === 3) {
            return true // Grade opcional na validação simples, ou adicione sua lógica
        }
        return false
    }

    const handleNext = () => {
        if (currentStep < 3) setCurrentStep(prev => prev + 1)
    }

    const handleBack = () => {
        if (currentStep > 1) setCurrentStep(prev => prev - 1)
    }

    // Função para disparar a gravação no Firebase
    const handlePublish = async () => {
        setIsPublishing(true)
        try {
            const result = await createCourseAction(formData)
            if (result.success) {
                alert("🚀 CURSO LANÇADO COM SUCESSO!")
                resetForm()
                router.push("/dashboard-teacher/courses")
            } else {
                alert("Erro: " + result.error)
            }
        } catch (error) {
            console.error(error)
        } finally {
            setIsPublishing(false)
        }
    }

    const isPublishable = isStepValid(1) && isStepValid(2)

    return (
        <div className="min-h-screen bg-transparent text-black/90 p-8 md:p-12 font-exo border-t border-black/5">
            {/* Header */}
            <div className="flex justify-between items-center mb-16 px-4 max-w-6xl mx-auto">
                <div>
                    <h1 className="text-3xl font-black tracking-tighter uppercase leading-none text-black">
                        Criar <span className="text-black">Novo Curso</span>
                    </h1>
                    <p className="text-black/80 mt-2 text-[10px] font-bold uppercase tracking-[3px]">Siga os passos abaixo para publicar seu conhecimento.</p>
                </div>
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-3 text-white hover:text-white transition group bg-[#1D5F31] border-2 border-[#1D5F31] px-6 py-3 rounded-xl shadow-none hover:bg-[#1D5F31]/80"
                >
                    <X size={18} className="group-hover:rotate-90 transition-transform" />
                    <span className="font-black uppercase text-[10px] tracking-widest">Sair do Studio</span>
                </button>
            </div>

            {/* Stepper */}
            <div className="max-w-4xl mx-auto mb-20 px-4">
                <div className="relative flex justify-between">
                    <div className="absolute top-1/2 left-0 w-full h-[2px] bg-black/10 -translate-y-1/2 -z-10" />
                    <div
                        className="absolute top-1/2 left-0 h-[2px] bg-[#1D5F31] -translate-y-1/2 -z-10 transition-all duration-700 shadow-[0_0_15px_#1D5F31/0.3]"
                        style={{ width: `${((currentStep - 1) / (STEPS.length - 1)) * 100}%` }}
                    />


                    {STEPS.map((step) => {
                        const Icon = step.icon
                        const isActive = currentStep === step.id
                        const isCompleted = currentStep > step.id

                        return (
                            <div key={step.id} className="flex flex-col items-center">
                                <div className={`
                                    w-14 h-14 rounded-xl flex items-center justify-center transition-all duration-500 border-2 shadow-none
                                    ${isActive ? 'bg-[#1D5F31] text-white border-[#1D5F31] scale-110' : ''}
                                    ${isCompleted ? 'bg-[#1D5F31] border-[#1D5F31] text-white shadow-[#1D5F31]/20' : ''}
                                    ${!isActive && !isCompleted ? 'bg-white border-black text-black/60' : ''}
                                `}>
                                    {isCompleted ? <Check size={24} strokeWidth={4} /> : <Icon size={24} />}
                                </div>
                                <span className={`mt-5 text-[9px] font-black uppercase tracking-[2px] ${isActive || isCompleted ? 'text-black' : 'text-black/60'}`}>
                                    {step.name}
                                </span>
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* Conteúdo Central */}
            <div className="max-w-4xl mx-auto bg-white border-2 border-black rounded-xl p-8 md:p-14 mb-16 shadow-none">


                {currentStep === 1 && (
                    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-6 duration-700">
                        {/* Upload de Capa */}
                        <div className="space-y-4">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-black px-1 italic">Capa do Treinamento</Label>
                            <div className="relative group overflow-hidden rounded-xl border-2 border-dashed border-black hover:border-black/50 transition-all duration-500 bg-white aspect-video flex flex-col items-center justify-center cursor-pointer">
                                {formData.image_url ? (
                                    <>
                                        <img
                                            src={formData.image_url}
                                            alt="Preview"
                                            className="w-full h-full object-cover group-hover:scale-105 transition-all duration-1000 opacity-80"
                                        />
                                        <div className="absolute inset-0 bg-white/40 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center">
                                            <Button variant="outline" className="bg-[#1D5F31] border-2 border-[#1D5F31] text-white hover:bg-[#1D5F31]/90 font-black uppercase text-[10px] tracking-widest h-12 px-8 rounded-xl">
                                                Trocar Arte
                                            </Button>
                                        </div>
                                    </>
                                ) : (
                                    <div className="text-center p-8">
                                        {isUploading ? (
                                            <div className="flex flex-col items-center gap-5">
                                                <Loader2 className="animate-spin text-black" size={40} />
                                                <p className="text-[10px] font-black tracking-widest text-black animate-pulse">PROCESSANDO UPLOAD...</p>
                                            </div>
                                        ) : (
                                            <>
                                                <Upload size={48} className="mx-auto text-black/40 mb-6 group-hover:text-black group-hover:scale-110 transition-all duration-500" />
                                                <p className="text-[10px] font-black uppercase tracking-[3px] text-black">Clique para subir a capa</p>
                                                <p className="text-[9px] text-black/60 mt-2 font-black italic tracking-widest">DIMENSÕES IDEAIS: 1280X720PX</p>
                                            </>
                                        )}
                                    </div>
                                )}
                                <input

                                    type="file"
                                    accept="image/*"
                                    className="absolute inset-0 opacity-0 cursor-pointer disabled:cursor-not-allowed"
                                    onChange={handleImageUpload}
                                    disabled={isUploading}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            <div className="md:col-span-2 lg:col-span-1 space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-black px-1">Nome do Curso</Label>
                                <Input
                                    placeholder="Ex: Do Zero ao Mestre em React"
                                    className="bg-white border-2 border-black focus:border-black focus:ring-black h-14 rounded-xl text-sm font-medium transition-all text-black placeholder:text-black/50"
                                    value={formData.title}
                                    onChange={(e) => setStepData({ title: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-black px-1">Carga Horária (horas)</Label>
                                <Input
                                    type="number"
                                    placeholder="Ex: 40"
                                    className="bg-white border-2 border-black focus:border-black focus:ring-black h-14 rounded-xl text-sm font-medium transition-all text-black placeholder:text-black/50"
                                    value={formData.duration}
                                    onChange={(e) => setStepData({ duration: Number(e.target.value) })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-black px-1">Categoria Principal</Label>
                                <select
                                    className="w-full bg-white border-2 border-black text-black rounded-xl px-5 h-14 focus:border-black focus:ring-black outline-none text-sm font-medium transition-all appearance-none"
                                    value={formData.category}
                                    onChange={(e) => setStepData({ category: e.target.value })}
                                >
                                    <option value="" disabled>Escolha o nicho...</option>
                                    {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                </select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-black px-1">Subtítulo Estratégico</Label>
                            <Input
                                placeholder="Uma frase curta que resume a transformação"
                                className="bg-white border-2 border-black focus:border-black h-14 rounded-xl text-sm font-medium transition-all text-black placeholder:text-black/50"
                                value={formData.subtitle}
                                onChange={(e) => setStepData({ subtitle: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-black px-1">Descrição Completa</Label>
                            <textarea
                                className="w-full bg-white border-2 border-black rounded-xl p-6 min-h-[180px] focus:border-black outline-none text-sm font-medium transition-all leading-relaxed text-black placeholder:text-black/50"
                                placeholder="Descreva os benefícios e o que o aluno vai aprender..."
                                value={formData.description}
                                onChange={(e) => setStepData({ description: e.target.value })}
                            />
                        </div>

                    </div>
                )}

                {currentStep === 2 && (
                    <div className="space-y-12 animate-in fade-in duration-700">
                        {/* Seção de Vídeo de Introdução */}
                        <div className="space-y-6 pb-8 border-b border-black/10">
                            <div className="text-center space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-black block">Vídeo de Apresentação (Intro)</Label>
                                <p className="text-[9px] text-black/50 font-bold uppercase tracking-widest">Atraia mais alunos com um pitch de vendas visual.</p>
                            </div>

                            <div className="grid md:grid-cols-2 gap-8">
                                {/* Opção Upload */}
                                <div className="space-y-4">
                                    <Label className="text-[9px] font-black uppercase tracking-widest text-black/40 px-1">Upload Direto</Label>
                                    <div className={`
                                        relative h-40 rounded-xl border-2 border-dashed transition-all flex flex-col items-center justify-center overflow-hidden cursor-pointer
                                        ${formData.intro_video_url && !formData.intro_video_url.includes('youtube.com') && !formData.intro_video_url.includes('vimeo.com')
                                            ? 'border-black bg-black/5' : 'border-black bg-white hover:border-black/50 text-black/60'}
                                    `}>
                                        {isUploadingIntro ? (
                                            <div className="flex flex-col items-center gap-3">
                                                <Loader2 className="animate-spin text-black" size={24} />
                                                <span className="text-[8px] font-black uppercase tracking-[2px] animate-pulse text-black">UPLOADING...</span>
                                            </div>
                                        ) : formData.intro_video_url && !formData.intro_video_url.includes('youtube.com') && !formData.intro_video_url.includes('vimeo.com') ? (
                                            <div className="flex flex-col items-center gap-2">
                                                <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center text-white">
                                                    <Check size={20} strokeWidth={4} />
                                                </div>
                                                <span className="text-[9px] font-black uppercase tracking-widest text-black">VÍDEO CARREGADO</span>
                                                <button
                                                    className="text-[8px] text-black/60 hover:text-black font-black uppercase italic tracking-widest mt-2"
                                                    onClick={() => setStepData({ intro_video_url: '' })}
                                                >
                                                    [ REMOVER ]
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="text-center px-6">
                                                <Upload size={24} className="mx-auto text-black/40 mb-3" />
                                                <span className="text-[9px] font-black uppercase tracking-widest text-black">SUBIR MP4</span>
                                                <p className="text-[8px] text-black mt-2 font-black uppercase tracking-widest px-2 italic bg-black/10">MÁXIMO 5 MINUTOS</p>
                                            </div>
                                        )}
                                        {!isUploadingIntro && (

                                            <input
                                                type="file"
                                                accept="video/*"
                                                className="absolute inset-0 opacity-0 cursor-pointer"
                                                onChange={async (e) => {
                                                    const file = e.target.files?.[0]
                                                    if (!file) return

                                                    // Validação simples de duração se possível (via URL.createObjectURL e metadata)
                                                    setIsUploadingIntro(true)
                                                    try {
                                                        const publicUrl = await uploadCourseVideo(file)
                                                        setStepData({ intro_video_url: publicUrl })
                                                    } catch (err) {
                                                        alert("Erro no upload do vídeo.")
                                                    } finally {
                                                        setIsUploadingIntro(false)
                                                    }
                                                }}
                                            />
                                        )}
                                    </div>
                                </div>

                                {/* Opção Link Externo */}
                                <div className="space-y-4">
                                    <Label className="text-[9px] font-black uppercase tracking-widest text-black/40 px-1">Link YouTube / Vimeo</Label>
                                    <div className="h-40 bg-white border-2 border-black rounded-xl p-6 flex flex-col justify-center gap-4">
                                        <Input
                                            placeholder="https://youtube.com/watch?v=..."
                                            className="bg-black/5 border-2 border-black focus:border-black h-12 rounded-xl text-xs text-black placeholder:text-black/50"
                                            value={formData.intro_video_url || ''}
                                            onChange={(e) => setStepData({ intro_video_url: e.target.value })}
                                        />
                                        <p className="text-[8px] text-black/70 font-bold uppercase tracking-widest leading-relaxed">
                                            Recomendado para vídeos hospedados externamente. Certifique-se de que o vídeo seja público ou não listado.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-black text-center block italic">Investimento Sugerido</Label>
                            <div className="relative max-w-sm mx-auto group">
                                <span className="absolute left-6 top-1/2 -translate-y-1/2 text-black font-black text-2xl group-focus-within:text-black transition-colors">R$</span>
                                <Input
                                    type="number"
                                    className="bg-white border-2 border-black focus:border-black h-24 pl-16 rounded-xl text-6xl font-black text-black shadow-none transition-all text-center pr-8 placeholder:text-black/20"
                                    placeholder="0"
                                    value={formData.price || ''}
                                    onChange={(e) => setStepData({ price: Number(e.target.value) })}
                                />
                            </div>
                            <p className="text-center text-[10px] text-black/70 font-black uppercase tracking-[5px]">Defina o valor do seu conteúdo Premium</p>
                        </div>
                    </div>

                )}

                {currentStep === 3 && (
                    <div className="space-y-10 animate-in fade-in duration-700">
                        <div className="flex justify-between items-center bg-white p-6 rounded-xl border-2 border-black">
                            <div>
                                <h2 className="text-xl font-black tracking-tighter uppercase text-black leading-none italic"> Grade Curricular </h2>
                                <p className="text-[10px] text-black font-black uppercase tracking-[2px] mt-2">Organize o fluxo de aprendizado.</p>
                            </div>
                            <Button
                                onClick={handleAddLesson}
                                className="bg-[#1D5F31] hover:bg-[#1D5F31]/90 text-white text-[10px] font-black uppercase tracking-widest px-8 rounded-xl h-12 shadow-none border-2 border-[#1D5F31]"
                            >
                                <Plus size={18} className="mr-2" /> Adicionar Aula
                            </Button>
                        </div>

                        {formData.lessons.length === 0 ? (
                            <div className="text-center py-24 bg-white/40 rounded-xl border-2 border-dashed border-black">
                                <BookOpen size={48} className="mx-auto text-black mb-6" />
                                <p className="text-black/70 font-black uppercase text-[10px] tracking-[3px]">Nenhuma aula adicionada</p>
                                <p className="text-black text-[10px] mt-2 font-black italic tracking-widest">CONSTRUA SUA GRADE CURRICULAR AGORA</p>
                            </div>

                        ) : (
                            <div className="space-y-6">
                                {formData.lessons.map((lesson, index) => (
                                    <div key={index} className="bg-white border-2 border-black rounded-xl p-8 hover:border-black/50 transition-all group shadow-none">
                                        <div className="flex flex-col md:flex-row gap-10">
                                            <div className="flex-grow space-y-6 text-black">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-[9px] font-black uppercase tracking-[3px] text-black italic">ESTÁGIO #{index + 1}</span>
                                                    <button
                                                        onClick={() => handleRemoveLesson(index)}
                                                        className="text-black/40 hover:text-red-500 hover:bg-red-500/10 p-2 rounded-xl transition-all"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-[10px] font-black uppercase tracking-widest text-black/90 px-1 italic">Título da Aula</Label>
                                                    <Input
                                                        placeholder="Ex: Introdução ao Módulo 1"
                                                        className="bg-white border-2 border-black focus:border-black h-12 rounded-xl text-sm font-medium text-black placeholder:text-black/50"
                                                        value={lesson.title}
                                                        onChange={(e) => handleUpdateLesson(index, { title: e.target.value })}
                                                    />
                                                </div>
                                            </div>

                                            <div className="w-full md:w-72 space-y-2">
                                                <Label className="text-[10px] font-black uppercase tracking-widest text-black/90 px-1 italic">Vídeo da Aula</Label>
                                                <div className={`
                                                    relative h-32 rounded-xl border-2 border-dashed transition-all flex flex-col items-center justify-center overflow-hidden
                                                    ${lesson.video_url ? 'border-black bg-white' : 'border-black bg-white hover:border-black/50'}
                                                `}>
                                                    {uploadingVideos[index] ? (
                                                        <div className="flex flex-col items-center gap-3">
                                                            <Loader2 className="animate-spin text-black" size={24} />
                                                            <span className="text-[8px] font-black uppercase tracking-[2px] animate-pulse text-black">UPLOADING...</span>
                                                        </div>
                                                    ) : lesson.video_url ? (
                                                        <div className="flex flex-col items-center gap-2">
                                                            <div className="w-10 h-10 bg-black/5 rounded-xl flex items-center justify-center text-black border border-black/20">
                                                                <Check size={20} strokeWidth={4} />
                                                            </div>
                                                            <span className="text-[9px] font-black uppercase tracking-widest text-black">MULTIMÍDIA PRONTA</span>
                                                            <button
                                                                className="text-[8px] text-black/40 hover:text-black font-black uppercase tracking-widest mt-1 italic"
                                                                onClick={() => handleUpdateLesson(index, { video_url: '' })}
                                                            >
                                                                [ SUBSTITUIR ]
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <div className="text-center px-6">
                                                            <Upload size={24} className="mx-auto text-black/30 mb-3" />
                                                            <span className="text-[9px] font-black uppercase tracking-widest text-black/60">SUBIR MP4</span>
                                                        </div>
                                                    )}

                                                    {!uploadingVideos[index] && !lesson.video_url && (
                                                        <input
                                                            type="file"
                                                            accept="video/*"
                                                            className="absolute inset-0 opacity-0 cursor-pointer"
                                                            onChange={(e) => {
                                                                const file = e.target.files?.[0]
                                                                if (file) handleVideoUpload(index, file)
                                                            }}
                                                        />
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Footer de Ações */}
            <div className="max-w-4xl mx-auto flex justify-between items-center gap-8 mb-20 md:mb-0">
                <Button
                    variant="ghost"
                    onClick={handleBack}
                    disabled={currentStep === 1}
                    className="text-black/70 hover:text-black hover:bg-black/5 font-black uppercase text-[10px] tracking-[4px] px-10 h-14 rounded-xl disabled:opacity-0 transition-all border-2 border-transparent hover:border-black"
                >
                    <ChevronLeft size={20} className="mr-3" /> VOLTAR
                </Button>

                <div className="flex gap-4">
                    {currentStep < 3 ? (
                        <Button
                            onClick={handleNext}
                            disabled={!isStepValid(currentStep)}
                            className="bg-[#1D5F31] text-white hover:bg-[#1D5F31]/90 font-black uppercase text-[10px] tracking-[4px] px-12 h-16 rounded-xl shadow-none border-2 border-[#1D5F31] disabled:opacity-30 group transition-all"
                        >
                            PRÓXIMO PASSO <ChevronRight size={20} className="ml-3 group-hover:translate-x-1 transition-transform" />
                        </Button>
                    ) : (
                        <Button
                            onClick={handlePublish}
                            disabled={!isPublishable || isPublishing}
                            className="bg-[#1D5F31] text-white hover:bg-[#1D5F31]/90 font-black uppercase text-[10px] tracking-[4px] px-16 h-16 rounded-xl shadow-none border-2 border-[#1D5F31] disabled:opacity-30 group transition-all"
                        >
                            {isPublishing ? (
                                <Loader2 className="animate-spin mr-3" />
                            ) : (
                                <Check size={20} className="mr-3" />
                            )}
                            {isPublishing ? "PROCESSANDO..." : " LANÇAR CURSO "}
                        </Button>
                    )}
                </div>
            </div>

        </div>
    )
}