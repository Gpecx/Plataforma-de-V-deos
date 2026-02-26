"use client"

import { useState } from 'react'
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
import { uploadCourseImage, uploadCourseVideo } from "@/utils/supabase/storage"

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

    // Função para disparar a gravação no Supabase
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
        <div className="min-h-screen bg-[#F4F7F9] text-slate-800 p-8 md:p-12 font-exo border-t border-slate-100">
            {/* Header */}
            <div className="flex justify-between items-center mb-16 px-4 max-w-6xl mx-auto">
                <div>
                    <h1 className="text-3xl font-black tracking-tighter uppercase leading-none">
                        Criar <span className="text-[#00C402]">Novo Curso</span>
                    </h1>
                    <p className="text-black mt-2 text-[10px] font-bold uppercase tracking-[3px]">Siga os passos abaixo para publicar seu conhecimento.</p>
                </div>
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-3 text-black hover:text-slate-800 transition group bg-white border border-slate-100 px-6 py-3 rounded-2xl shadow-sm"
                >
                    <X size={18} className="group-hover:rotate-90 transition-transform" />
                    <span className="font-black uppercase text-[10px] tracking-widest">Sair do Studio</span>
                </button>
            </div>

            {/* Stepper */}
            <div className="max-w-4xl mx-auto mb-20 px-4">
                <div className="relative flex justify-between">
                    <div className="absolute top-1/2 left-0 w-full h-[2px] bg-slate-100 -translate-y-1/2 -z-10" />
                    <div
                        className="absolute top-1/2 left-0 h-[2px] bg-[#00C402] -translate-y-1/2 -z-10 transition-all duration-700 shadow-[0_0_15px_rgba(0,196,2,0.3)]"
                        style={{ width: `${((currentStep - 1) / (STEPS.length - 1)) * 100}%` }}
                    />

                    {STEPS.map((step) => {
                        const Icon = step.icon
                        const isActive = currentStep === step.id
                        const isCompleted = currentStep > step.id

                        return (
                            <div key={step.id} className="flex flex-col items-center">
                                <div className={`
                                    w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 border border-slate-100 shadow-sm
                                    ${isActive ? 'bg-slate-900 text-white border-slate-900 scale-110 shadow-xl' : ''}
                                    ${isCompleted ? 'bg-[#00C402] border-[#00C402] text-white shadow-[#00C402]/20 shadow-lg' : ''}
                                    ${!isActive && !isCompleted ? 'bg-white text-slate-300' : ''}
                                `}>
                                    {isCompleted ? <Check size={24} strokeWidth={4} /> : <Icon size={24} />}
                                </div>
                                <span className={`mt-5 text-[9px] font-black uppercase tracking-[2px] text-black`}>
                                    {step.name}
                                </span>
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* Conteúdo Central */}
            <div className="max-w-4xl mx-auto bg-white border border-slate-100 rounded-[48px] p-8 md:p-14 mb-16 shadow-sm">

                {currentStep === 1 && (
                    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-6 duration-700">
                        {/* Upload de Capa */}
                        <div className="space-y-4">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-black px-1">Capa do Treinamento</Label>
                            <div className="relative group overflow-hidden rounded-3xl border-2 border-dashed border-slate-100 hover:border-[#00C402]/30 transition-all duration-500 bg-slate-50/50 aspect-video flex flex-col items-center justify-center cursor-pointer">
                                {formData.image_url ? (
                                    <>
                                        <img
                                            src={formData.image_url}
                                            alt="Preview"
                                            className="w-full h-full object-cover group-hover:scale-105 transition-all duration-1000"
                                        />
                                        <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center">
                                            <Button variant="outline" className="bg-white border-white text-slate-900 font-black uppercase text-[10px] tracking-widest h-12 px-8 rounded-xl shadow-xl">
                                                Trocar Arte
                                            </Button>
                                        </div>
                                    </>
                                ) : (
                                    <div className="text-center p-8">
                                        {isUploading ? (
                                            <div className="flex flex-col items-center gap-5">
                                                <Loader2 className="animate-spin text-[#00C402]" size={40} />
                                                <p className="text-[10px] font-black tracking-widest text-black animate-pulse">PROCESSANDO UPLOAD...</p>
                                            </div>
                                        ) : (
                                            <>
                                                <Upload size={48} className="mx-auto text-slate-200 mb-6 group-hover:text-[#00C402] group-hover:scale-110 transition-all duration-500" />
                                                <p className="text-[10px] font-black uppercase tracking-[3px] text-black">Clique para subir a capa</p>
                                                <p className="text-[9px] text-slate-600 mt-2 font-bold italic">DIMENSÕES IDEAIS: 1280X720PX</p>
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
                                    className="bg-slate-50 border-slate-100 focus:border-[#00C402] focus:ring-[#00C402] h-14 rounded-2xl text-sm font-medium transition-all text-black"
                                    value={formData.title}
                                    onChange={(e) => setStepData({ title: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-black px-1">Carga Horária (horas)</Label>
                                <Input
                                    type="number"
                                    placeholder="Ex: 40"
                                    className="bg-slate-50 border-slate-100 focus:border-[#00C402] focus:ring-[#00C402] h-14 rounded-2xl text-sm font-medium transition-all text-black"
                                    value={formData.duration}
                                    onChange={(e) => setStepData({ duration: Number(e.target.value) })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-black px-1">Categoria Principal</Label>
                                <select
                                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 h-14 focus:border-[#00C402] focus:ring-[#00C402] focus:ring-4 focus:ring-[#00C402]/5 outline-none text-sm font-medium transition-all appearance-none"
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
                                className="bg-slate-50 border-slate-100 focus:border-[#00C402] h-14 rounded-2xl text-sm font-medium transition-all text-black"
                                value={formData.subtitle}
                                onChange={(e) => setStepData({ subtitle: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-black px-1">Descrição Completa</Label>
                            <textarea
                                className="w-full bg-slate-50 border border-slate-100 rounded-[32px] p-6 min-h-[180px] focus:border-[#00C402] focus:ring-4 focus:ring-[#00C402]/5 outline-none text-sm font-medium transition-all leading-relaxed text-black"
                                placeholder="Descreva os benefícios e o que o aluno vai aprender..."
                                value={formData.description}
                                onChange={(e) => setStepData({ description: e.target.value })}
                            />
                        </div>
                    </div>
                )}

                {currentStep === 2 && (
                    <div className="space-y-12 animate-in fade-in duration-700">
                        <div className="space-y-6">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-black px-1 text-center block">Investimento Sugerido</Label>
                            <div className="relative max-w-sm mx-auto group">
                                <span className="absolute left-6 top-1/2 -translate-y-1/2 text-black font-black text-2xl group-focus-within:text-[#00C402] transition-colors">R$</span>
                                <Input
                                    type="number"
                                    className="bg-slate-50 border-slate-100 focus:border-[#00C402] focus:ring-[#00C402] focus:ring-8 focus:ring-[#00C402]/5 h-24 pl-16 rounded-[40px] text-4xl font-black text-slate-900 shadow-sm transition-all text-center pr-8"
                                    value={formData.price}
                                    onChange={(e) => setStepData({ price: Number(e.target.value) })}
                                />
                            </div>
                            <p className="text-center text-[10px] text-black font-bold uppercase tracking-widest">Defina o valor do seu conteúdo Premium</p>
                        </div>
                    </div>
                )}

                {currentStep === 3 && (
                    <div className="space-y-10 animate-in fade-in duration-700">
                        <div className="flex justify-between items-center bg-slate-50 p-6 rounded-[32px] border border-slate-100">
                            <div>
                                <h2 className="text-xl font-black tracking-tighter uppercase text-slate-800 leading-none"> Grade Curricular </h2>
                                <p className="text-[10px] text-black font-bold uppercase tracking-[2px] mt-2">Organize o fluxo de aprendizado.</p>
                            </div>
                            <Button
                                onClick={handleAddLesson}
                                className="bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-black uppercase tracking-widest px-8 rounded-2xl h-12 shadow-lg shadow-slate-200"
                            >
                                <Plus size={18} className="mr-2" /> Adicionar Aula
                            </Button>
                        </div>

                        {formData.lessons.length === 0 ? (
                            <div className="text-center py-24 bg-slate-50/50 rounded-[40px] border-2 border-dashed border-slate-100">
                                <BookOpen size={48} className="mx-auto text-slate-200 mb-6" />
                                <p className="text-black font-black uppercase text-[10px] tracking-[3px]">Nenhuma aula adicionada</p>
                                <p className="text-black text-[10px] mt-2 font-medium">CONSTRUA SUA GRADE CURRICULAR AGORA</p>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {formData.lessons.map((lesson, index) => (
                                    <div key={index} className="bg-slate-50/30 border border-slate-100 rounded-[32px] p-8 hover:border-[#00C402]/20 hover:bg-white transition-all group shadow-sm">
                                        <div className="flex flex-col md:flex-row gap-10">
                                            <div className="flex-grow space-y-6 text-slate-900">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-[9px] font-black uppercase tracking-[3px] text-black">ESTÁGIO #{index + 1}</span>
                                                    <button
                                                        onClick={() => handleRemoveLesson(index)}
                                                        className="text-slate-200 hover:text-red-500 hover:bg-red-50 p-2 rounded-lg transition-all"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-[10px] font-black uppercase tracking-widest text-black px-1">Título da Aula</Label>
                                                    <Input
                                                        placeholder="Ex: Introdução ao Módulo 1"
                                                        className="bg-white border-slate-100 focus:border-[#00C402] h-12 rounded-xl text-sm font-medium"
                                                        value={lesson.title}
                                                        onChange={(e) => handleUpdateLesson(index, { title: e.target.value })}
                                                    />
                                                </div>
                                            </div>

                                            <div className="w-full md:w-72 space-y-2">
                                                <Label className="text-[10px] font-black uppercase tracking-widest text-black px-1">Vídeo da Aula</Label>
                                                <div className={`
                                                    relative h-32 rounded-[24px] border-2 border-dashed transition-all flex flex-col items-center justify-center overflow-hidden
                                                    ${lesson.video_url ? 'border-[#00C402]/40 bg-white' : 'border-slate-100 bg-white hover:border-slate-200'}
                                                `}>
                                                    {uploadingVideos[index] ? (
                                                        <div className="flex flex-col items-center gap-3">
                                                            <Loader2 className="animate-spin text-[#00C402]" size={24} />
                                                            <span className="text-[8px] font-black uppercase tracking-[2px] animate-pulse">UPLOADING...</span>
                                                        </div>
                                                    ) : lesson.video_url ? (
                                                        <div className="flex flex-col items-center gap-2">
                                                            <div className="w-10 h-10 bg-green-50 rounded-full flex items-center justify-center text-green-500">
                                                                <Check size={20} strokeWidth={4} />
                                                            </div>
                                                            <span className="text-[9px] font-black uppercase tracking-widest text-[#00C402]">MULTIMÍDIA PRONTA</span>
                                                            <button
                                                                className="text-[8px] text-slate-400 hover:text-slate-900 font-bold uppercase tracking-tighter"
                                                                onClick={() => handleUpdateLesson(index, { video_url: '' })}
                                                            >
                                                                [ SUBSTITUIR ]
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <div className="text-center px-6">
                                                            <Upload size={24} className="mx-auto text-slate-200 mb-3" />
                                                            <span className="text-[9px] font-black uppercase tracking-widest text-black">SUBIR MP4</span>
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
                    className="text-slate-400 hover:text-slate-900 hover:bg-white font-black uppercase text-[10px] tracking-[4px] px-10 h-14 rounded-2xl disabled:opacity-0 transition-all"
                >
                    <ChevronLeft size={20} className="mr-3" /> VOLTAR
                </Button>

                <div className="flex gap-4">
                    {currentStep < 3 ? (
                        <Button
                            onClick={handleNext}
                            disabled={!isStepValid(currentStep)}
                            className="bg-slate-900 text-white hover:bg-slate-800 font-black uppercase text-[10px] tracking-[4px] px-12 h-16 rounded-[24px] shadow-xl shadow-slate-100 disabled:opacity-10 group"
                        >
                            PRÓXIMO PASSO <ChevronRight size={20} className="ml-3 group-hover:translate-x-1 transition-transform" />
                        </Button>
                    ) : (
                        <Button
                            onClick={handlePublish}
                            disabled={!isPublishable || isPublishing}
                            className="bg-slate-900 text-white hover:bg-slate-800 font-black uppercase text-[10px] tracking-[4px] px-16 h-16 rounded-[24px] shadow-2xl shadow-slate-200 disabled:opacity-10 group"
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