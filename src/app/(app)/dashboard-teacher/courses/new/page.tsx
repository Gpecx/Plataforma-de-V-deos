"use client"

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
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
    Loader2,
    Play,
    GripVertical,
    Video,
    FileText,
    AlertCircle,
    Clock,
    HelpCircle,
    RotateCcw,
    XCircle,
    Save
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import TagInput from '@/components/ui/TagInput'
import MuxPlayer from '@mux/mux-player-react'
import { toast } from 'sonner'

import { useCourseFormStore, Lesson } from "@/store/useCourseFormStore"
import { createCourseAction } from "../actions"
import { uploadCourseImage } from "@/lib/storage-helpers"
import { getMuxUploadUrl, getMuxUploadStatus, getLessonPlaybackToken } from "@/app/actions/mux"
import QuizForm from '@/app/(app)/dashboard-teacher/components/QuizForm'
import { Question } from "@/store/useCourseFormStore"

function LessonVideoPreview({ playbackId, title }: { playbackId: string, title: string }) {
    const [token, setToken] = useState<string>('')
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!playbackId) return;
        async function fetchToken() {
            try {
                const res = await getLessonPlaybackToken(playbackId)
                if (res.success && res.token) {
                    setToken(res.token)
                }
            } catch (err) {
                console.error("Error fetching preview token:", err)
            } finally {
                setLoading(false)
            }
        }
        fetchToken()
    }, [playbackId])

    if (loading) {
        return (
            <div className="aspect-video w-full bg-slate-100 rounded-md flex items-center justify-center border-2 border-black/5">
                <div className="flex flex-col items-center gap-2">
                    <Loader2 className="animate-spin text-[#1D5F31]" size={20} />
                    <span className="text-[8px] font-bold uppercase tracking-widest text-[#1D5F31]/60">Carregando Player...</span>
                </div>
            </div>
        )
    }

    return (
        <div className="relative group/player aspect-video w-full bg-black rounded-md overflow-hidden border-2 border-black transition-all hover:border-[#1D5F31] shadow-xl">
            <MuxPlayer
                playbackId={playbackId}
                tokens={{ playback: token }}
                streamType="on-demand"
                className="w-full h-full object-cover"
                accentColor="#1D5F31"
                metadata={{
                    video_title: title,
                }}
            />
            <div className="absolute inset-0 bg-black/20 group-hover/player:opacity-0 transition-opacity pointer-events-none flex items-center justify-center">
                <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center border border-white/20">
                    <Play size={20} className="text-white fill-white ml-1" />
                </div>
            </div>
        </div>
    )
}

const STEPS = [
    { id: 1, name: 'Informações Básicas', icon: Info },
    { id: 2, name: 'Mídia e Preço', icon: ImageIcon },
    { id: 3, name: 'Grade Curricular', icon: ListTree },
]

const CATEGORIES = [
    'Cibersegurança',
    'Ciência de Dados',
    'Cloud Computing',
    'Design',
    'Desenvolvimento Web',
    'Edição de Vídeo',
    'Empreendedorismo',
    'Engenharia Civil',
    'Engenharia Elétrica',
    'Engenharia Mecânica',
    'Estilo de Vida',
    'Finanças',
    'Fotografia',
    'Gastronomia',
    'Gestão de Projetos',
    'Idiomas',
    'Inteligência Artificial',
    'Liderança e Soft Skills',
    'Marketing Digital',
    'Motion Design',
    'Música',
    'Negócios',
    'Saúde',
    'Tecnologia da Informação',
    'UI/UX Design',
    'Vendas de Alta Performance',
    'Outros'
]

export default function NewCoursePage() {
    const router = useRouter()
    const [currentStep, setCurrentStep] = useState(1)
    const [isPublishing, setIsPublishing] = useState(false)
    const [isUploading, setIsUploading] = useState(false)
    const [isUploadingIntro, setIsUploadingIntro] = useState(false)
    const [uploadingVideoStatus, setUploadingVideoStatus] = useState<Record<number, 'idle' | 'uploading' | 'processing' | 'ready'>>({})
    const [uploadingVideoProgress, setUploadingVideoProgress] = useState<Record<number, number>>({})
    const [introUploadStatus, setIntroUploadStatus] = useState<'idle' | 'uploading' | 'processing' | 'ready'>('idle')
    const [introUploadProgress, setIntroUploadProgress] = useState(0)
    const [selectedLessonIndex, setSelectedLessonIndex] = useState<number | null>(null)
    const [selectedLessonNotas, setSelectedLessonNotas] = useState('')
    const [isHydrated, setIsHydrated] = useState(false)

    // Aguarda a hidratação do Zustand persist antes de renderizar os dados salvos
    useEffect(() => {
        const unsub = useCourseFormStore.persist.onFinishHydration(() => {
            setIsHydrated(true)
        })
        if (useCourseFormStore.persist.hasHydrated()) {
            setIsHydrated(true)
        }
        return () => unsub()
    }, [])

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
            toast.error("FALHA NO UPLOAD", {
                description: "Erro ao subir imagem. Verifique sua conexão.",
                style: { background: '#fff', color: '#ef4444', border: '2px solid #ef4444', borderRadius: '12px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '2px', boxShadow: 'none' }
            })
        } finally {
            setIsUploading(false)
        }
    }

    const [uploadingVideos, setUploadingVideos] = useState<Record<number, boolean>>({})

    const handleAddLesson = (type: 'lesson' | 'quiz' = 'lesson') => {
        const newLesson: Lesson = {
            title: type === 'quiz' ? 'Novo Questionário' : '',
            video_url: '',
            position: 0,
            type: type
        }
        if (type === 'quiz') {
            newLesson.quizData = {
                title: 'Novo Questionário',
                description: '',
                questions: [{ id: Math.random().toString(), text: '', options: ['', ''], correctAnswer: 0 }]
            }
        }
        setLessons([newLesson, ...formData.lessons])
        setSelectedLessonIndex(0)
        setSelectedLessonNotas('')
    }

    const handleAddQuiz = () => handleAddLesson('quiz')

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
        setUploadingVideoStatus(prev => ({ ...prev, [index]: 'uploading' }))
        setUploadingVideoProgress(prev => ({ ...prev, [index]: 0 }))

        try {
            const response = await getMuxUploadUrl('lesson')
            if (response.error || !response.url) throw new Error(response.error || 'Erro ao gerar URL')

            const { url, id: uploadId } = response
            handleUpdateLesson(index, { mux_upload_id: uploadId })

            await new Promise<void>((resolve, reject) => {
                const xhr = new XMLHttpRequest()
                xhr.open('PUT', url)
                xhr.upload.onprogress = (evt) => {
                    if (evt.lengthComputable) {
                        setUploadingVideoProgress(prev => ({ ...prev, [index]: Math.round((evt.loaded / evt.total) * 100) }))
                    }
                }
                xhr.onload = async () => {
                    if (xhr.status >= 200 && xhr.status < 300) {
                        setUploadingVideoStatus(prev => ({ ...prev, [index]: 'processing' }))
                        let attempts = 0
                        const poll = async () => {
                            if (attempts > 30) { resolve(); return }
                            const res = await getMuxUploadStatus(uploadId)
                            if (res.status === 'ready') {
                                handleUpdateLesson(index, {
                                    mux_upload_id: uploadId,
                                    mux_playback_id: res.playback_id,
                                    mux_asset_id: res.asset_id,
                                    video_url: `https://stream.mux.com/${res.playback_id}.m3u8`
                                })
                                setUploadingVideoStatus(prev => ({ ...prev, [index]: 'ready' }))
                                resolve()
                            } else { attempts++; setTimeout(poll, 3000) }
                        }
                        poll()
                    } else { reject(new Error('Erro no upload para o Mux')) }
                }
                xhr.onerror = () => reject(new Error('Erro de rede'))
                xhr.send(file)
            })
        } catch (error: any) {
            toast.error("FALHA NO UPLOAD", {
                description: error.message || 'Erro ao subir vídeo.',
                style: { background: '#fff', color: '#ef4444', border: '2px solid #ef4444', borderRadius: '12px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '2px', boxShadow: 'none' }
            })
        } finally {
            setUploadingVideos(prev => ({ ...prev, [index]: false }))
        }
    }

    const isStepValid = (step: number) => {
        if (step === 1) {
            return formData.title && formData.category && formData.description
        }
        if (step === 2) {
            if (formData.pricing_type === 'free') return true
            if (formData.pricing_type === 'premium') return formData.price > 0
            return formData.price >= 0
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
                toast.success("CURSO LANÇADO COM SUCESSO!", {
                    style: { background: '#1D5F31', color: '#fff', border: '2px solid #1D5F31', borderRadius: '12px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '2px', boxShadow: 'none' },
                    icon: '🚀'
                })
                resetForm()
                router.push("/dashboard-teacher/courses")
            } else {
                toast.error("ERRO AO LANÇAR", {
                    description: result.error,
                    style: { background: '#fff', color: '#ef4444', border: '2px solid #ef4444', borderRadius: '12px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '2px', boxShadow: 'none' }
                })
            }
        } catch (error) {
            console.error(error)
        } finally {
            setIsPublishing(false)
        }
    }

    const isPublishable = isStepValid(1) && isStepValid(2)

    return (
        <div className="min-h-screen bg-transparent text-black/90 p-8 md:p-12 font-montserrat border-t border-black/5">
            {!isHydrated ? (
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="flex flex-col items-center gap-4">
                        <Loader2 className="animate-spin text-[#1D5F31]" size={32} />
                        <span className="text-[10px] font-bold uppercase tracking-widest text-black/60">RESTAURANDO RASCUNHO...</span>
                    </div>
                </div>
            ) : (
            <>
            {/* Header */}
            <div className="flex justify-between items-center mb-16 px-4 w-full">
                <div>
                    <h1 className="text-2xl font-bold tracking-tighter uppercase leading-none text-black max-w-xl">
                        Criar <span className="text-black">Novo Curso</span>
                    </h1>
                    <p className="text-black/80 mt-2 text-[10px] font-bold uppercase tracking-[3px]">Siga os passos abaixo para publicar seu conhecimento.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => {
                            toast("Tem certeza que deseja apagar todo o formulário?", {
                                description: "Esta ação não pode ser desfeita.",
                                action: {
                                    label: "LIMPAR TUDO",
                                    onClick: () => {
                                        resetForm()
                                        setSelectedLessonIndex(null)
                                        setSelectedLessonNotas('')
                                        toast.success("FORMULÁRIO LIMPO", {
                                            style: { background: '#fff', color: '#000', border: '2px solid #000', borderRadius: '12px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '2px', boxShadow: 'none' }
                                        })
                                    }
                                },
                                cancel: {
                                    label: "CANCELAR",
                                    onClick: () => {}
                                },
                                style: { background: '#fff', color: '#000', border: '2px solid #dc2626', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '2px' }
                            })
                        }}
                        className="flex items-center gap-2 text-black/60 hover:text-red-600 transition group bg-transparent border-2 border-black/20 hover:border-red-400 px-5 py-3 rounded-md shadow-none font-bold uppercase text-[10px] tracking-widest"
                    >
                        <Trash2 size={16} className="group-hover:scale-110 transition-transform" />
                        <span>Limpar</span>
                    </button>
                    <button
                        onClick={() => router.back()}
                        className="flex items-center gap-3 text-white hover:text-white transition group bg-[#1D5F31] border-2 border-[#1D5F31] px-6 py-3 rounded-md shadow-none hover:bg-[#1D5F31]/80"
                    >
                        <X size={18} className="group-hover:rotate-90 transition-transform" />
                        <span className="font-bold uppercase text-[10px] tracking-widest">Sair do Studio</span>
                    </button>
                </div>
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
                                    w-14 h-14 rounded-full flex items-center justify-center transition-all duration-500 border-2 shadow-none
                                    ${isActive ? 'bg-[#1D5F31] text-white border-[#1D5F31] scale-110' : ''}
                                    ${isCompleted ? 'bg-[#1D5F31] border-[#1D5F31] text-white shadow-[#1D5F31]/20' : ''}
                                    ${!isActive && !isCompleted ? 'bg-white border-black text-black/60' : ''}
                                `}>
                                    {isCompleted ? <Check size={24} strokeWidth={4} /> : <Icon size={24} />}
                                </div>
                                <span className={`mt-5 text-[9px] font-bold uppercase tracking-[2px] ${isActive || isCompleted ? 'text-black' : 'text-black/60'}`}>
                                    {step.name}
                                </span>
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* Conteúdo Central */}
            <div className="w-full bg-white border border-black/5 rounded-md p-8 md:p-14 mb-16 shadow-none">

                {currentStep === 1 && (
                    <div className="max-w-5xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-6 duration-700">
                        {/* Upload de Capa */}
                        <div className="space-y-4">
                            <Label className="text-[10px] font-bold uppercase tracking-widest text-black px-1 ">Capa do Treinamento</Label>
                            <div className="relative group overflow-hidden rounded-md border-2 border-dashed border-black hover:border-black/50 transition-all duration-500 bg-white aspect-video flex flex-col items-center justify-center cursor-pointer">
                                {formData.image_url ? (
                                    <>
                                        <img
                                            src={formData.image_url}
                                            alt="Preview"
                                            className="w-full h-full object-cover group-hover:scale-105 transition-all duration-1000 opacity-80"
                                        />
                                        <div className="absolute inset-0 bg-white/40 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center">
                                            <Button variant="outline" className="bg-[#1D5F31] border-2 border-[#1D5F31] text-white hover:bg-[#1D5F31]/90 font-bold uppercase text-[10px] tracking-widest h-12 px-8 rounded-md">
                                                Trocar Arte
                                            </Button>
                                        </div>
                                    </>
                                ) : (
                                    <div className="text-center p-8">
                                        {isUploading ? (
                                            <div className="flex flex-col items-center gap-5">
                                                <Loader2 className="animate-spin text-black" size={40} />
                                                <p className="text-[10px] font-bold tracking-widest text-black animate-pulse rounded-none">PROCESSANDO UPLOAD...</p>
                                            </div>
                                        ) : (
                                            <>
                                                <Upload size={48} className="mx-auto text-black/40 mb-6 group-hover:text-black group-hover:scale-110 transition-all duration-500" />
                                                <p className="text-[10px] font-bold uppercase tracking-[3px] text-black">Clique para subir a capa</p>
                                                <p className="text-[9px] text-black/60 mt-2 font-bold  tracking-widest">DIMENSÕES IDEAIS: 1280X720PX</p>
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
                                <Label className="text-[10px] font-bold uppercase tracking-widest text-black px-1">Nome do Curso</Label>
                                <Input
                                    placeholder="Ex: Do Zero ao Mestre em React"
                                    className="bg-white border-2 border-black focus:border-black focus:ring-black h-14 rounded-md text-sm font-medium transition-all text-black placeholder:text-black/50"
                                    value={formData.title}
                                    onChange={(e) => setStepData({ title: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-bold uppercase tracking-widest text-black px-1">Carga Horária (horas)</Label>
                                <Input
                                    type="number"
                                    placeholder="Ex: 40"
                                    className="bg-white border-2 border-black focus:border-black focus:ring-black h-14 rounded-md text-sm font-medium transition-all text-black placeholder:text-black/50"
                                    value={formData.duration}
                                    onChange={(e) => setStepData({ duration: Number(e.target.value) })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-bold uppercase tracking-widest text-black px-1">Categoria Principal</Label>
                                <select
                                    className="w-full bg-white border-2 border-black text-black rounded-md px-5 h-14 focus:border-black focus:ring-black outline-none text-sm font-medium transition-all appearance-none"
                                    value={formData.category}
                                    onChange={(e) => setStepData({ category: e.target.value })}
                                >
                                    <option value="" disabled>Escolha o nicho...</option>
                                    {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                </select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-[10px] font-bold uppercase tracking-widest text-black px-1">Subtítulo Estratégico</Label>
                            <Input
                                placeholder="Uma frase curta que resume a transformação"
                                className="bg-white border-2 border-black focus:border-black h-14 rounded-md text-sm font-medium transition-all text-black placeholder:text-black/50"
                                value={formData.subtitle}
                                onChange={(e) => setStepData({ subtitle: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-bold uppercase tracking-widest text-black px-1">Descrição Completa</Label>
                            <textarea
                                className="w-full bg-white border-2 border-black rounded-md p-6 min-h-[180px] focus:border-black outline-none text-sm font-medium transition-all leading-relaxed text-black placeholder:text-black/50"
                                placeholder="Descreva os benefícios e o que o aluno vai aprender..."
                                value={formData.description}
                                onChange={(e) => setStepData({ description: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-bold uppercase tracking-widest text-black px-1">Tags para Busca</Label>
                            <TagInput
                                tags={formData.tags || []}
                                onChange={(tags) => setStepData({ tags })}
                                maxTags={5}
                                placeholder="Digite uma tag e pressione Enter"
                            />
                        </div>
                        <div className="space-y-4 pt-4 border-t border-black/10">
                            <div>
                                <Label className="text-[10px] font-bold uppercase tracking-widest text-black px-1">Conteúdo Programático (Grade)</Label>
                                <p className="text-[9px] text-black/60 font-bold uppercase tracking-widest px-1 mt-1">
                                    Adicione os tópicos que os alunos aprenderão neste treinamento.
                                </p>
                            </div>
                            <div className="space-y-3">
                                {formData.curriculum.map((topic, idx) => (
                                    <div key={idx} className="flex gap-2">
                                        <Input
                                            value={topic}
                                            onChange={(e) => {
                                                const newCurriculum = [...formData.curriculum];
                                                newCurriculum[idx] = e.target.value;
                                                setStepData({ curriculum: newCurriculum });
                                            }}
                                            placeholder={`Ex: Módulo ${idx + 1} - Fundamentos`}
                                            className="bg-white border-2 border-black hover:border-[#1D5F31] focus:border-[#1D5F31] focus:ring-[#1D5F31] h-12 rounded-md text-sm font-medium transition-all text-black placeholder:text-black/50"
                                        />
                                        <button 
                                            type="button"
                                            onClick={() => {
                                                const newCurriculum = formData.curriculum.filter((_, i) => i !== idx);
                                                setStepData({ curriculum: newCurriculum });
                                            }}
                                            className="px-4 text-slate-400 hover:text-red-500 hover:bg-red-50 border-2 border-transparent hover:border-red-200 rounded-md transition-all flex items-center justify-center shrink-0"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                ))}
                                <Button
                                    type="button"
                                    onClick={() => setStepData({ curriculum: [...formData.curriculum, ''] })}
                                    className="w-full bg-slate-50 text-black border-2 border-dashed border-black/30 hover:border-black hover:bg-slate-100 font-bold uppercase text-[10px] tracking-widest h-12 rounded-md shadow-none mt-2 transition-all"
                                >
                                    <Plus size={16} className="mr-2" />
                                    Adicionar Tópico
                                </Button>
                            </div>
                        </div>

                    </div>
                )}

                {currentStep === 2 && (
                    <div className="max-w-5xl mx-auto space-y-12 animate-in fade-in duration-700">
                        {/* Seção de Vídeo de Introdução - Upload Direto Mux */}
                        <div className="space-y-6 pb-8 border-b border-black/10">
                            <div className="text-center space-y-2">
                                <Label className="text-[10px] font-bold uppercase tracking-widest text-black block">Vídeo de Apresentação (Intro)</Label>
                                <p className="text-[9px] text-black/50 font-bold uppercase tracking-widest">Atraia mais alunos com um pitch de vendas visual.</p>
                            </div>

                            <div className={`
                                relative h-48 w-full border-2 border-dashed transition-all flex flex-col items-center justify-center overflow-hidden cursor-pointer rounded-md
                                ${formData.intro_video_playback_id
                                    ? 'border-[#1D5F31] bg-[#1D5F31]/5' : 'border-black bg-white hover:border-black/50 text-black/60'}
                            `}>
                                {isUploadingIntro ? (
                                    <div className="flex flex-col items-center gap-3">
                                        <Loader2 className="animate-spin text-[#1D5F31]" size={24} />
                                        <span className="text-[8px] font-bold uppercase tracking-[2px] animate-pulse text-[#1D5F31]">UPLOADING...</span>
                                    </div>
                                ) : formData.intro_video_playback_id ? (
                                    <div className="flex flex-col gap-2 w-full h-full p-2">
                                        <div className="aspect-video w-full bg-black overflow-hidden rounded-md">
                                            <MuxPlayer
                                                playbackId={formData.intro_video_playback_id}
                                                streamType="on-demand"
                                                muted
                                                className="w-full h-full"
                                                accentColor="#1D5F31"
                                            />
                                        </div>
                                        <span className="text-[9px] font-bold uppercase tracking-widest text-[#1D5F31]">
                                            {introUploadStatus === 'processing' ? 'PROCESSANDO...' : 'VÍDEO PRONTO'}
                                        </span>
                                        <button
                                            className="text-[8px] text-[#1D5F31]/60 hover:text-red-500 font-bold uppercase tracking-widest mt-2"
                                            onClick={() => setStepData({ 
                                                intro_video_url: '',
                                                intro_video_mux_id: '',
                                                intro_video_asset_id: '',
                                                intro_video_playback_id: ''
                                            })}
                                        >
                                            [ REMOVER ]
                                        </button>
                                    </div>
                                ) : (
                                    <div className="text-center px-6">
                                        <Upload size={24} className="mx-auto text-black/40 mb-3" />
                                        <span className="text-[9px] font-bold uppercase tracking-widest text-black">SUBIR MP4</span>
                                        <p className="text-[8px] text-black mt-2 font-bold uppercase tracking-widest px-2 bg-black/10">MÁXIMO 5 MINUTOS</p>
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

                                            setIsUploadingIntro(true)
                                            setIntroUploadProgress(0)
                                            setIntroUploadStatus('uploading')
                                            try {
                                                const response = await getMuxUploadUrl('intro')
                                                if (response.error || !response.url) throw new Error(response.error || 'Erro ao gerar URL')

                                                const { url, id: uploadId } = response
                                                setStepData({ intro_video_mux_id: uploadId })

                                                await new Promise<void>((resolve, reject) => {
                                                    const xhr = new XMLHttpRequest()
                                                    xhr.open('PUT', url)
                                                    xhr.upload.onprogress = (evt) => {
                                                        if (evt.lengthComputable) {
                                                            setIntroUploadProgress(Math.round((evt.loaded / evt.total) * 100))
                                                        }
                                                    }
                                                    xhr.onload = async () => {
                                                        if (xhr.status >= 200 && xhr.status < 300) {
                                                            setIntroUploadStatus('processing')
                                                            let attempts = 0
                                                            const poll = async () => {
                                                                if (attempts > 30) { resolve(); return }
                                                                const res = await getMuxUploadStatus(uploadId)
                                                                if (res.status === 'ready') {
                                                                    setStepData({
                                                                        intro_video_mux_id: uploadId,
                                                                        intro_video_asset_id: res.asset_id,
                                                                        intro_video_playback_id: res.playback_id,
                                                                        intro_video_url: `https://stream.mux.com/${res.playback_id}.m3u8`
                                                                    })
                                                                    setIntroUploadStatus('ready')
                                                                    resolve()
                                                                } else { attempts++; setTimeout(poll, 3000) }
                                                            }
                                                            poll()
                                                        } else { reject(new Error('Erro no upload para o Mux')) }
                                                    }
                                                    xhr.onerror = () => reject(new Error('Erro de rede'))
                                                    xhr.send(file)
                                                })
                                            } catch (err: any) {
                                                toast.error("FALHA NO UPLOAD", {
                                                    description: err.message || 'Erro ao subir vídeo.',
                                                    style: { background: '#fff', color: '#ef4444', border: '2px solid #ef4444', borderRadius: '12px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '2px', boxShadow: 'none' }
                                                })
                                            } finally {
                                                setIsUploadingIntro(false)
                                            }
                                        }}
                                    />
                                )}
                            </div>
                        </div>

                        <div className="space-y-6">
                            <Label className="text-[10px] font-bold uppercase tracking-widest text-black text-center block ">Tipo de Precificação</Label>
                            <div className="flex justify-center gap-4">
                                {[
                                    { id: 'standard', label: 'Padrão' },
                                    { id: 'free', label: 'Gratuito' },
                                    { id: 'premium', label: 'Premium' }
                                ].map((type) => (
                                    <button
                                        key={type.id}
                                        type="button"
                                        onClick={() => {
                                            const newData: any = { pricing_type: type.id }
                                            if (type.id === 'free') newData.price = 0
                                            setStepData(newData)
                                        }}
                                        className={`px-6 py-3 rounded-md text-[10px] font-bold uppercase tracking-widest transition-all border-2 ${
                                            formData.pricing_type === type.id
                                                ? 'bg-[#1D5F31] border-[#1D5F31] text-white'
                                                : 'bg-white border-black text-black hover:border-[#1D5F31]'
                                        }`}
                                    >
                                        {type.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-6">
                            <Label className="text-[10px] font-bold uppercase tracking-widest text-black text-center block ">Investimento Sugerido</Label>
                            <div className="relative max-w-sm mx-auto group">
                                <span className={`absolute left-6 top-1/2 -translate-y-1/2 font-bold text-2xl transition-colors ${formData.pricing_type === 'free' ? 'text-black/20' : 'text-black'}`}>R$</span>
                                <Input
                                    type="number"
                                    className={`bg-white border-2 border-black focus:border-black h-24 pl-16 rounded-md text-6xl font-bold text-black shadow-none transition-all text-center pr-8 placeholder:text-black/20 ${formData.pricing_type === 'free' ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    placeholder="0"
                                    value={formData.price || ''}
                                    onChange={(e) => setStepData({ price: Number(e.target.value) })}
                                    disabled={formData.pricing_type === 'free'}
                                />
                            </div>
                            <p className="text-center text-[10px] text-black/70 font-bold uppercase tracking-[5px]">
                                {formData.pricing_type === 'free' ? 'Conteúdo disponibilizado gratuitamente' : 'Defina o valor do seu conteúdo Premium'}
                            </p>
                        </div>
                    </div>

                )}

                {currentStep === 3 && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 animate-in fade-in duration-700">
                        {/* Coluna Principal — Arquitetura + Studio */}
                        <div className="lg:col-span-2 space-y-12">
                            {/* Seção de Módulos */}
                            <div>
                                <div className="flex items-center justify-between pb-6 border-b-2 border-[#1D5F31]">
                                    <div>
                                        <h2 className="text-xl font-bold uppercase tracking-tighter flex items-center gap-3 text-black leading-none">
                                            <FileText size={20} className="text-[#1D5F31]" />
                                            Arquitetura do Treinamento
                                        </h2>
                                        <p className="text-[10px] font-bold uppercase tracking-[2px] text-[#1D5F31] mt-2">Organize o fluxo de entrega de valor.</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleAddLesson('lesson')}
                                            className="text-[10px] font-bold uppercase tracking-[4px] text-white bg-[#061629] hover:bg-[#061629]/90 px-6 py-3 rounded-md border-none transition-all"
                                        >
                                            + Nova Aula
                                        </button>
                                        <button
                                            onClick={handleAddQuiz}
                                            className="text-[10px] font-bold uppercase tracking-[4px] text-white bg-slate-800 hover:bg-slate-900 px-6 py-3 rounded-md border-none transition-all"
                                        >
                                            + Quiz
                                        </button>
                                    </div>
                                </div>

                                <div className="mt-8 space-y-6">
                                    {formData.lessons.length === 0 ? (
                                        <div className="text-center py-20 bg-white border-2 border-dashed border-[#1D5F31]/20 rounded-md">
                                            <BookOpen size={48} className="mx-auto text-black/20 mb-6" />
                                            <p className="text-black/50 font-bold uppercase text-[10px] tracking-[3px]">Nenhuma aula adicionada</p>
                                            <p className="text-black/30 text-[10px] mt-2 font-bold tracking-widest">CLIQUE EM "+ NOVA AULA" PARA COMEÇAR</p>
                                        </div>
                                    ) : (
                                        <div className="bg-white border border-[#1D5F31]/20 rounded-md overflow-hidden">
                                        <div className="bg-[#1D5F31] px-6 py-3 flex items-center gap-3">
                                            <BookOpen size={16} className="text-white" />
                                            <span className="text-[10px] font-bold uppercase tracking-widest text-white">ESTRUTURA DO CURSO</span>
                                            <span className="text-[9px] text-white/60 ml-auto font-bold uppercase">{formData.lessons.length} aula{formData.lessons.length !== 1 ? 's' : ''}</span>
                                            {formData.lessons.length > 0 && (
                                                <button
                                                    onClick={() => {
                                                        toast("EXCLUIR TODAS AS AULAS?", {
                                                            description: "Esta ação não pode ser desfeita.",
                                                            action: {
                                                                label: "EXCLUIR",
                                                                onClick: () => {
                                                                    setLessons([])
                                                                    setSelectedLessonIndex(null)
                                                                }
                                                            },
                                                            cancel: {
                                                                label: "CANCELAR",
                                                                onClick: () => {}
                                                            },
                                                            style: { background: '#fff', color: '#000', border: '2px solid #dc2626', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '2px' }
                                                        })
                                                    }}
                                                    className="text-[8px] text-white/50 hover:text-red-300 font-bold uppercase tracking-widest transition-colors ml-2"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            )}
                                        </div>
                                            <div className="p-4">
                                                {formData.lessons.map((lesson, index) => (
                                                    <div
                                                        key={index}
                                                        onClick={() => {
                                                            setSelectedLessonIndex(index)
                                                            setSelectedLessonNotas(lesson.notas || '')
                                                        }}
                                                        className={`flex items-center justify-between p-4 cursor-pointer border-2 rounded-md transition-all duration-300 mb-3 ${
                                                            selectedLessonIndex === index
                                                                ? 'bg-[#1D5F31] text-white border-[#1D5F31]'
                                                                : 'bg-white border-[#1D5F31] hover:border-[#1D5F31]/50 text-black'
                                                        }`}
                                                    >
                                                        <div className="flex items-center gap-6">
                                                            <div className={`p-2 transition-colors rounded-md ${selectedLessonIndex === index ? 'text-white' : 'text-slate-400'}`}>
                                                                <GripVertical size={18} />
                                                            </div>
                                                            <div className={`p-3 transition-colors rounded-md ${selectedLessonIndex === index ? 'bg-white/20 text-white' : 'bg-white text-slate-500'}`}>
                                                                {lesson.type === 'quiz' ? <HelpCircle size={18} /> : <Video size={18} />}
                                                            </div>
                                                            <div>
                                                                <input
                                                                    className={`bg-transparent border-none focus:outline-none text-base font-bold tracking-tight w-full mb-1 ${
                                                                        selectedLessonIndex === index ? 'text-white placeholder:text-white/50' : 'text-black placeholder:text-black/40'
                                                                    }`}
                                                                    value={lesson.title || (lesson.type === 'quiz' ? 'Novo Quiz' : 'Nova Aula Digital')}
                                                                    placeholder={lesson.type === 'quiz' ? 'Título do Quiz' : 'Título da Aula Digital'}
                                                                    onClick={(e) => e.stopPropagation()}
                                                                    onChange={(e) => handleUpdateLesson(index, { title: e.target.value })}
                                                                />
                                                                <div className="flex items-center gap-2 flex-wrap">
                                                                    {lesson.status === 'REJEITADO' ? (
                                                                        <>
                                                                            <AlertCircle size={14} className="text-red-500 shrink-0" />
                                                                            <span className={`text-[9px] font-bold uppercase tracking-[2px] ${selectedLessonIndex === index ? 'text-white' : 'text-red-500'}`}>REJEITADA</span>
                                                                        </>
                                                                    ) : lesson.status === 'SOLICITADO_EXCLUSAO' ? (
                                                                        <>
                                                                            <Clock size={14} className="text-red-500 shrink-0" />
                                                                            <span className={`text-[9px] font-bold uppercase tracking-[2px] ${selectedLessonIndex === index ? 'text-white' : 'text-red-500'}`}>REMOÇÃO SOLICITADA</span>
                                                                        </>
                                                                    ) : lesson.status === 'APROVADO' ? (
                                                                        <>
                                                                            <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.7)] shrink-0" />
                                                                            <span className={`text-[9px] font-bold uppercase tracking-widest ${selectedLessonIndex === index ? 'text-white' : 'text-blue-500'}`}>APROVADO</span>
                                                                            <span className={`text-[9px] font-bold uppercase tracking-[2px] ${selectedLessonIndex === index ? 'text-white/40' : 'text-black/20'}`}>|</span>
                                                                            <span className={`text-[9px] font-bold uppercase tracking-[2px] ${selectedLessonIndex === index ? 'text-white/70' : 'text-black/50'}`}>
                                                                                {lesson.type === 'quiz' ? 'QUESTIONÁRIO' : (lesson.mux_playback_id ? 'VÍDEO MUX ATIVO' : (lesson.video_url ? 'VÍDEO ATIVO' : 'AGUARDANDO CONTEÚDO'))}
                                                                            </span>
                                                                        </>
                                                                    ) : (
                                                                        <>
                                                                            <div className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.7)] animate-pulse shrink-0" />
                                                                            <span className={`text-[9px] font-bold uppercase tracking-widest ${selectedLessonIndex === index ? 'text-white' : 'text-amber-600'}`}>AGUARDANDO APROVAÇÃO</span>
                                                                            <span className={`text-[9px] font-bold uppercase tracking-[2px] ${selectedLessonIndex === index ? 'text-white/40' : 'text-black/20'}`}>|</span>
                                                                            <span className={`text-[9px] font-bold uppercase tracking-[2px] ${selectedLessonIndex === index ? 'text-white/70' : 'text-black/50'}`}>
                                                                                {lesson.type === 'quiz' ? 'QUESTIONÁRIO' : (lesson.mux_playback_id ? 'VÍDEO MUX ATIVO' : (lesson.video_url ? 'VÍDEO ATIVO' : 'AGUARDANDO CONTEÚDO'))}
                                                                            </span>
                                                                        </>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-1 shrink-0">
                                                            {lesson.status === 'REJEITADO' ? (
                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); handleUpdateLesson(index, { status: 'PENDENTE' }); }}
                                                                    className={`p-3 rounded-md transition-all ${selectedLessonIndex === index ? 'text-amber-300 hover:text-amber-200' : 'text-amber-500 hover:text-amber-600 hover:bg-amber-50'}`}
                                                                    title="Reenviar para aprovação"
                                                                >
                                                                    <RotateCcw size={16} />
                                                                </button>
                                                            ) : lesson.status === 'SOLICITADO_EXCLUSAO' ? (
                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); handleUpdateLesson(index, { status: 'APROVADO' }); }}
                                                                    className={`p-3 rounded-md transition-all ${selectedLessonIndex === index ? 'text-amber-300 hover:text-amber-200' : 'text-amber-500 hover:text-amber-600 hover:bg-amber-50'}`}
                                                                    title="Cancelar solicitação de exclusão"
                                                                >
                                                                    <XCircle size={16} />
                                                                </button>
                                                            ) : (
                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); handleRemoveLesson(index); if (selectedLessonIndex === index) setSelectedLessonIndex(null); }}
                                                                    className={`p-3 rounded-md transition-all ${selectedLessonIndex === index ? 'text-white/70 hover:text-red-300 hover:bg-white/10' : 'text-slate-400 hover:text-red-500 hover:bg-red-500/10'}`}
                                                                >
                                                                    <Trash2 size={16} />
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Studio de Multimídia */}
                            {selectedLessonIndex !== null && formData.lessons[selectedLessonIndex] && (() => {
                                const lesson = formData.lessons[selectedLessonIndex]
                                return (
                                    <div className="space-y-4 bg-white p-8 rounded-md border border-[#1D5F31]/20 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                        <div className="flex items-center gap-3 pb-4 border-b border-[#1D5F31]/20">
                                            <Video size={20} className="text-[#1D5F31]" />
                                            <h2 className="text-lg font-bold uppercase tracking-tighter text-black leading-none">Studio de Multimídia</h2>
                                        </div>

                                        <div className="space-y-8">
                                            {lesson.type === 'quiz' ? (
                                                <div className="border-2 border-black/5 p-6 bg-slate-50/30 rounded-md">
                                                    <QuizForm
                                                        key={selectedLessonIndex}
                                                        initialData={lesson.quizData}
                                                        onSave={(quizData) => {
                                                            handleUpdateLesson(selectedLessonIndex, {
                                                                quizData: quizData as any,
                                                                title: quizData.title || lesson.title
                                                            })
                                                            setSelectedLessonIndex(null)
                                                        }}
                                                    />
                                                </div>
                                            ) : (
                                                <>
                                                    {/* Título */}
                                                    <div className="space-y-2">
                                                        <label className="text-[10px] font-bold uppercase tracking-widest text-black/60">Título da Aula Digital</label>
                                                        <input
                                                            className="w-full bg-white border border-[#1D5F31]/20 rounded-md px-5 py-3 focus:border-[#1D5F31] outline-none text-sm font-bold text-black transition-all"
                                                            placeholder="Ex: Introdução ao Módulo 1"
                                                            value={lesson.title || ''}
                                                            onChange={(e) => handleUpdateLesson(selectedLessonIndex, { title: e.target.value })}
                                                        />
                                                    </div>

                                                    {/* Notas */}
                                                    <div className="space-y-2">
                                                        <label className="text-[10px] font-bold uppercase tracking-widest text-black/60">Notas da Aula (Markdown ou Texto)</label>
                                                        <textarea
                                                            className="w-full bg-white border border-[#1D5F31]/20 rounded-md px-6 py-4 focus:border-[#1D5F31] outline-none text-sm font-medium text-black transition-all min-h-[120px]"
                                                            placeholder="Escreva aqui o roteiro, referências ou instruções internas para esta aula..."
                                                            value={selectedLessonNotas}
                                                            onChange={(e) => {
                                                                setSelectedLessonNotas(e.target.value)
                                                                handleUpdateLesson(selectedLessonIndex, { notas: e.target.value })
                                                            }}
                                                        />
                                                    </div>

                                                    {lesson.status === 'REJEITADO' && lesson.motivoRejeicao && (
                                                        <div className="p-4 bg-red-50 border-2 border-red-200 rounded-md">
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <AlertCircle size={16} className="text-red-500 shrink-0" />
                                                                <span className="text-[9px] font-bold uppercase text-red-600 tracking-widest">Feedback do Admin</span>
                                                            </div>
                                                            <p className="text-xs text-red-700 leading-relaxed">{lesson.motivoRejeicao}</p>
                                                        </div>
                                                    )}

                                                    {/* Vídeo */}
                                                    <div className="space-y-2">
                                                        <label className="text-[10px] font-bold uppercase tracking-widest text-black/60">Vídeo da Aula</label>
                                                        <div className={`
                                                            relative rounded-md border transition-all flex flex-col items-center justify-center overflow-hidden
                                                            ${lesson.mux_playback_id ? 'border-[#1D5F31]/20 bg-white' : 'border-dashed border-[#1D5F31]/20 h-48 bg-white hover:border-[#1D5F31]/50'}
                                                        `}>
                                                            {uploadingVideos[selectedLessonIndex] ? (
                                                                <div className="flex flex-col items-center gap-3 p-8 text-center">
                                                                    <div className="relative">
                                                                        <Loader2 className="animate-spin text-[#1D5F31]" size={32} />
                                                                        <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-[#1D5F31]">
                                                                            {uploadingVideoProgress[selectedLessonIndex]}%
                                                                        </span>
                                                                    </div>
                                                                    <span className="text-[9px] font-bold uppercase tracking-[2px] animate-pulse text-[#1D5F31]">ENVIANDO PARA O STUDIO...</span>
                                                                </div>
                                                            ) : lesson.mux_playback_id ? (
                                                                <div className="flex flex-col gap-3 w-full p-3">
                                                                    <LessonVideoPreview
                                                                        playbackId={lesson.mux_playback_id}
                                                                        title={lesson.title || `Aula ${selectedLessonIndex + 1}`}
                                                                    />
                                                                    <div className="flex justify-between items-center px-1">
                                                                        <span className="text-[9px] font-bold uppercase tracking-widest text-[#1D5F31] flex items-center gap-2">
                                                                            <div className="w-2 h-2 rounded-full bg-[#1D5F31]" />
                                                                            {uploadingVideoStatus[selectedLessonIndex] === 'processing' ? 'PROCESSANDO...' : 'STUDIO READY'}
                                                                        </span>
                                                                        <button
                                                                            className="text-[9px] text-red-500 hover:text-red-600 font-bold uppercase tracking-widest transition-colors flex items-center gap-1"
                                                                            onClick={() => handleUpdateLesson(selectedLessonIndex, {
                                                                                video_url: '',
                                                                                mux_upload_id: '',
                                                                                mux_playback_id: '',
                                                                                mux_asset_id: ''
                                                                            })}
                                                                        >
                                                                            <X size={12} /> REMOVER
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            ) : lesson.mux_upload_id ? (
                                                                <div className="flex flex-col items-center gap-3 p-8 text-center">
                                                                    <Loader2 className="animate-spin text-amber-500" size={28} />
                                                                    <span className="text-[9px] font-bold uppercase tracking-[2px] animate-pulse text-amber-600">PROCESSANDO VÍDEO...</span>
                                                                </div>
                                                            ) : (
                                                                <div className="text-center px-6 py-12">
                                                                    <div className="w-12 h-12 bg-black/5 rounded-md flex items-center justify-center mx-auto mb-4">
                                                                        <Upload size={20} className="text-black/40" />
                                                                    </div>
                                                                    <span className="text-[10px] font-bold uppercase tracking-widest text-black">Upload da Aula</span>
                                                                    <p className="text-[8px] text-black/50 mt-1 font-bold uppercase tracking-widest">ARQUIVOS MP4 OU MOV</p>
                                                                </div>
                                                            )}

                                                            {!uploadingVideos[selectedLessonIndex] && !lesson.mux_playback_id && !lesson.mux_upload_id && (
                                                                <input
                                                                    type="file"
                                                                    accept="video/*"
                                                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                                                    onChange={(e) => {
                                                                        const file = e.target.files?.[0]
                                                                        if (file) handleVideoUpload(selectedLessonIndex, file)
                                                                    }}
                                                                />
                                                            )}
                                                        </div>
                                                    </div>

                                                    <div className="flex justify-end pt-4">
                                                        <button
                                                            type="button"
                                                            onClick={() => setSelectedLessonIndex(null)}
                                                            className="flex items-center gap-3 bg-slate-900 text-white px-10 py-4 rounded-md font-bold uppercase tracking-[3px] text-[11px] hover:bg-black transition-all active:scale-95 shadow-xl"
                                                        >
                                                            <Save size={18} />
                                                            SALVAR VÍDEO AULA
                                                        </button>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                )
                            })()}
                        </div>

                        {/* Sidebar — Configurações Base */}
                        <aside className="space-y-12">
                            <section className="bg-white p-8 rounded-md border border-[#1D5F31]/20">
                                <h3 className="text-[10px] font-bold uppercase tracking-[5px] text-black/60 mb-6">Configurações Base</h3>

                                <div className="space-y-8">
                                    {/* Subtítulo */}
                                    <div className="space-y-4">
                                        <label className="text-[9px] font-bold uppercase tracking-[3px] text-black/60 px-1">Subtítulo Estratégico</label>
                                        <input
                                            className="w-full bg-white border border-[#1D5F31]/20 rounded-md px-5 py-3 focus:border-[#1D5F31] outline-none text-sm text-black transition-all"
                                            placeholder="Ex: Do zero ao avançado"
                                            value={formData.subtitle || ''}
                                            onChange={(e) => setStepData({ subtitle: e.target.value })}
                                        />
                                    </div>

                                    {/* Descrição */}
                                    <div className="space-y-4">
                                        <label className="text-[9px] font-bold uppercase tracking-[3px] text-black/60 px-1">Descrição Completa</label>
                                        <textarea
                                            className="w-full bg-white border border-[#1D5F31]/20 rounded-md px-6 py-4 focus:border-[#1D5F31] outline-none text-sm text-black transition-all min-h-[120px]"
                                            placeholder="Descreva o curso em detalhes..."
                                            value={formData.description || ''}
                                            onChange={(e) => setStepData({ description: e.target.value })}
                                        />
                                    </div>

                                    {/* Categoria */}
                                    <div className="space-y-4">
                                        <label className="text-[9px] font-bold uppercase tracking-[3px] text-black/60 px-1">Categoria</label>
                                        <select
                                            className="w-full bg-white border border-[#1D5F31]/20 rounded-md px-5 py-3 focus:border-[#1D5F31] outline-none text-sm text-black transition-all appearance-none"
                                            value={formData.category || ''}
                                            onChange={(e) => setStepData({ category: e.target.value })}
                                        >
                                            <option value="">Selecione...</option>
                                            {CATEGORIES.map((cat) => (
                                                <option key={cat} value={cat}>{cat}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Carga Horária */}
                                    <div className="space-y-4">
                                        <label className="text-[9px] font-bold uppercase tracking-[3px] text-black/60 px-1">Carga Horária (h)</label>
                                        <input
                                            type="number"
                                            className="w-full bg-white border border-[#1D5F31]/20 rounded-md px-6 py-4 focus:border-[#1D5F31] outline-none font-bold text-xl text-black transition-all"
                                            placeholder="0"
                                            value={formData.duration || ''}
                                            onChange={(e) => setStepData({ duration: Number(e.target.value) })}
                                        />
                                    </div>

                                    {/* Tags */}
                                    <div className="space-y-4">
                                        <label className="text-[9px] font-bold uppercase tracking-[3px] text-black/60 px-1">Tags para Busca</label>
                                        <TagInput
                                            tags={formData.tags || []}
                                            onChange={(tags) => setStepData({ tags })}
                                        />
                                    </div>

                                    {/* Tipo de Precificação */}
                                    <div className="space-y-4">
                                        <label className="text-[9px] font-bold uppercase tracking-[3px] text-black/60 px-1">Tipo de Precificação</label>
                                        <div className="flex gap-2">
                                            {[
                                                { id: 'standard' as const, label: 'Padrão' },
                                                { id: 'free' as const, label: 'Gratuito' },
                                                { id: 'premium' as const, label: 'Premium' }
                                            ].map((type) => (
                                                <button
                                                    key={type.id}
                                                    type="button"
                                                    onClick={() => {
                                                        const newData: any = { pricing_type: type.id }
                                                        if (type.id === 'free') newData.price = 0
                                                        setStepData(newData)
                                                    }}
                                                    className={`flex-1 px-3 py-3 rounded-md text-[9px] font-bold uppercase tracking-widest transition-all border-2 ${
                                                        formData.pricing_type === type.id
                                                            ? 'bg-[#1D5F31] border-[#1D5F31] text-white'
                                                            : 'bg-white border-[#1D5F31]/20 text-black/60 hover:border-[#1D5F31]'
                                                    }`}
                                                >
                                                    {type.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Valor */}
                                    {formData.pricing_type !== 'free' && (
                                        <div className="space-y-4">
                                            <label className="text-[9px] font-bold uppercase tracking-[3px] text-black/60 px-1">Valor do Investimento</label>
                                            <div className="relative">
                                                <span className="absolute left-6 top-1/2 -translate-y-1/2 font-bold text-lg text-black/40">R$</span>
                                                <input
                                                    type="number"
                                                    className="w-full bg-white border border-[#1D5F31]/20 rounded-md pl-24 pr-8 py-5 focus:border-[#1D5F31] outline-none font-bold text-2xl text-black transition-all"
                                                    placeholder="0"
                                                    value={formData.price || ''}
                                                    onChange={(e) => setStepData({ price: Number(e.target.value) })}
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </section>
                        </aside>
                    </div>
                )}
            </div>

            {/* Footer de Ações */}
            <div className="w-full flex justify-between items-center gap-8 mb-20 md:mb-0">
                <Button
                    variant="ghost"
                    onClick={handleBack}
                    disabled={currentStep === 1}
                    className="text-black/70 hover:text-black hover:bg-black/5 font-bold uppercase text-[10px] tracking-[4px] px-10 h-14 disabled:opacity-0 transition-all border-2 border-transparent hover:border-black rounded-md"
                >
                    <ChevronLeft size={20} className="mr-3" /> VOLTAR
                </Button>

                <div className="flex gap-4">
                    {currentStep < 3 ? (
                        <Button
                            onClick={handleNext}
                            disabled={!isStepValid(currentStep)}
                            className="bg-[#1D5F31] text-white hover:bg-[#1D5F31]/90 font-bold uppercase text-[10px] tracking-[4px] px-12 h-16 shadow-none border-2 border-[#1D5F31] disabled:opacity-30 group transition-all rounded-md"
                        >
                            PRÓXIMO PASSO <ChevronRight size={20} className="ml-3 group-hover:translate-x-1 transition-transform" />
                        </Button>
                    ) : (
                        <Button
                            onClick={handlePublish}
                            disabled={!isPublishable || isPublishing}
                            className={`bg-[#1D5F31] text-white hover:bg-[#1D5F31]/90 font-bold uppercase text-[10px] tracking-[4px] px-16 h-16 shadow-none border-2 border-[#1D5F31] disabled:opacity-30 group transition-all rounded-md ${isPublishing ? '' : ''}`}
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

            </>
            )}
        </div>
    )
}