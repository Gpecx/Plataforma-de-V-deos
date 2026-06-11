"use client"

import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent
} from '@dnd-kit/core'
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
    Plus,
    GripVertical,
    Video,
    FileText,
    Trash2,
    ChevronDown,
    ChevronUp,
    UploadCloud,
    Save,
    ArrowLeft,
    CheckCircle2,
    Loader2,
    X,
    GraduationCap,
    VideoIcon,
    Layout,
    Settings as SettingsIcon,
    Clock,
    Check,
    AlertCircle,
    RotateCcw,
    XCircle,
    HelpCircle,
    Play,
    Trash
} from 'lucide-react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useDropzone } from 'react-dropzone'
import { auth, db } from '@/lib/firebase'
import { doc, getDoc, collection, query, where, orderBy, getDocs } from 'firebase/firestore'
import { uploadCourseImage } from "@/lib/storage-helpers"
import { updateCourseAction, deleteVideoAction, cancelLessonDeletionRequest, deleteTrailerAction, autosaveCourseAction } from "../../actions"
import { getMuxUploadUrl, getMuxUploadStatus, deleteMuxAsset } from "@/app/actions/mux"
import { toast } from 'sonner'
import SecureMuxPlayer from "@/components/SecureMuxPlayer"
import { onAuthStateChanged, User } from 'firebase/auth'
import QuizForm from '@/app/(app)/dashboard-teacher/components/QuizForm'
import TagInput from '@/components/ui/TagInput'

import { Quiz, Question } from '@/lib/types/quiz'

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

// --- Main Builder Component ---
interface Lesson {
    id: string
    title: string
    video_url: string
    mux_upload_id?: string
    mux_playback_id?: string
    mux_asset_id?: string
    module_id?: string
    position: number
    description?: string
    notas?: string
    status?: string
    motivoRejeicao?: string
    type?: 'lesson' | 'quiz'
    quizData?: {
        id?: string
        title?: string
        description?: string
        questions?: Question[]
    }
}

interface Module {
    id: string
    title: string
    lessons: Lesson[]
}

// --- Sortable Item Component (Lesson) ---
function SortableLesson({ lesson, onDelete, onSelect, isSelected, onTitleChange, onResubmit, onCancel }: {
    lesson: Lesson,
    onDelete: () => void,
    onSelect: () => void,
    isSelected: boolean,
    onTitleChange: (newTitle: string) => void,
    onResubmit?: () => void,
    onCancel?: () => void
}) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
    } = useSortable({ id: lesson.id })

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    }

    return (
        <div
            ref={setNodeRef}
            style={style}
            onClick={onSelect}
            className={`group flex items-center justify-between p-4 cursor-pointer border-2 rounded-md transition-all duration-300 mb-3 ${isSelected ? 'bg-[#1D5F31] text-white border-[#1D5F31]' : 'bg-white border-[#1D5F31] hover:border-[#1D5F31]/50 text-black'
                }`}
        >
            <div className="flex items-center gap-6">
                <button {...attributes} {...listeners} className={`cursor-grab active:cursor-grabbing transition-colors p-1 ${isSelected ? 'text-white/70 hover:text-white' : 'text-slate-500 hover:text-[#1D5F31]'}`} onClick={(e) => e.stopPropagation()}>
                    <GripVertical size={20} />
                </button>
                <div className={`p-3 rounded-md transition-colors ${isSelected ? 'bg-white/20 text-white' : 'bg-white text-slate-500'}`}>
                    {lesson.type === 'quiz' ? <HelpCircle size={18} /> : <Video size={18} />}
                </div>
                <div>
                    <input
                        className={`bg-transparent border-none focus:outline-none text-base font-bold tracking-tight w-full mb-1 ${isSelected ? 'text-white placeholder:text-white/50' : 'text-black placeholder:text-black/40'}`}
                        value={lesson.title}
                        placeholder={lesson.type === 'quiz' ? 'Título do Quiz' : 'Título da Aula Digital'}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => onTitleChange(e.target.value)}
                    />
                    <div className="flex items-center gap-2 flex-wrap">
                        {lesson.status === 'REJEITADO' ? (
                            <>
                                <AlertCircle size={14} className="text-red-500 shrink-0" />
                                <span className="text-[9px] font-bold uppercase tracking-[2px] text-red-500">REJEITADA</span>
                            </>
                        ) : lesson.status === 'SOLICITADO_EXCLUSAO' ? (
                            <>
                                <Clock size={14} className="text-red-500 shrink-0" />
                                <span className="text-[9px] font-bold uppercase tracking-[2px] text-red-500">REMOÇÃO SOLICITADA</span>
                            </>
                        ) : lesson.status === 'APROVADO' ? (
                            <>
                                <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.7)] shrink-0" />
                                <span className={`text-[9px] font-bold uppercase tracking-widest ${isSelected ? 'text-white' : 'text-blue-500'}`}>APROVADO</span>
                                <span className={`text-[9px] font-bold uppercase tracking-[2px] ${isSelected ? 'text-white/40' : 'text-black/20'}`}>|</span>
                                <span className={`text-[9px] font-bold uppercase tracking-[2px] ${isSelected ? 'text-white/70' : 'text-black/50'}`}>
                                    {lesson.type === 'quiz' ? 'QUESTIONÁRIO' : (lesson.mux_playback_id ? 'VÍDEO MUX ATIVO' : (lesson.video_url ? 'VÍDEO ATIVO' : 'AGUARDANDO CONTEÚDO'))}
                                </span>
                            </>
                        ) : (
                            <>
                                <div className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.7)] animate-pulse shrink-0" />
                                <span className={`text-[9px] font-bold uppercase tracking-widest ${isSelected ? 'text-white' : 'text-amber-600'}`}>AGUARDANDO APROVAÇÃO</span>
                                <span className={`text-[9px] font-bold uppercase tracking-[2px] ${isSelected ? 'text-white/40' : 'text-black/20'}`}>|</span>
                                <span className={`text-[9px] font-bold uppercase tracking-[2px] ${isSelected ? 'text-white/70' : 'text-black/50'}`}>
                                    {lesson.type === 'quiz' ? 'QUESTIONÁRIO' : (lesson.mux_playback_id ? 'VÍDEO MUX ATIVO' : (lesson.video_url ? 'VÍDEO ATIVO' : 'AGUARDANDO CONTEÚDO'))}
                                </span>
                            </>
                        )}
                    </div>
                </div>
            </div>
            <div className="flex items-center gap-1">
                {lesson.status === 'REJEITADO' && onResubmit && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation()
                            onResubmit()
                        }}
                        className="p-3 text-amber-500 hover:text-amber-600 transition-all hover:bg-amber-50 rounded-md"
                        title="Reenviar para aprovação"
                    >
                        <RotateCcw size={18} />
                    </button>
                )}
                {lesson.status === 'SOLICITADO_EXCLUSAO' ? (
                    onCancel ? (
                        <button
                            onClick={(e) => {
                                e.stopPropagation()
                                onCancel()
                            }}
                            className="p-3 text-amber-500 hover:text-amber-600 transition-all hover:bg-amber-50 rounded-md"
                            title="Cancelar solicitação de exclusão"
                        >
                            <XCircle size={18} />
                        </button>
                    ) : (
                        <div className="p-3 text-red-400 rounded-md" title="Aguardando aprovação de exclusão">
                            <Clock size={18} />
                        </div>
                    )
                ) : (
                    <button
                        onClick={(e) => {
                            e.stopPropagation()
                            onDelete()
                        }}
                        className={`p-3 transition-all rounded-md ${isSelected ? 'text-white/70 hover:text-red-300 hover:bg-white/10' : 'text-slate-400 hover:text-red-500 hover:bg-red-500/10'}`}
                        title="Excluir aula"
                    >
                        <Trash2 size={18} />
                    </button>
                )}
            </div>
        </div>
    )
}

// --- Sortable Module Component ---
function SortableModule({ module, onAddLesson, onDeleteLesson, onReorderLessons, onSelectLesson, selectedLessonId, onLessonTitleChange, onDeleteModule, canDeleteModule, onResubmitLesson, onCancelLesson, onAddQuiz, onModuleTitleChange }: {
    module: Module,
    onAddLesson: () => void,
    onDeleteLesson: (lessonId: string) => void,
    onReorderLessons: (event: DragEndEvent) => void,
    onSelectLesson: (lesson: Lesson) => void,
    selectedLessonId?: string,
    onLessonTitleChange: (lessonId: string, newTitle: string) => void,
    onDeleteModule: () => void,
    canDeleteModule: boolean,
    onResubmitLesson?: (lessonId: string) => void,
    onCancelLesson?: (lessonId: string) => void,
    onAddQuiz?: () => void,
    onModuleTitleChange?: (moduleId: string, newTitle: string) => void
}) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
    } = useSortable({ id: module.id })

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    }

    return (
        <div
            ref={setNodeRef}
            style={style}
            className="mb-8 bg-white border border-[#1D5F31]/20 rounded-md overflow-hidden"
        >
            <div className="p-6 flex items-center justify-between bg-white border-b-2 border-[#1D5F31]">
                <div className="flex items-center gap-6">
                    <button {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing text-slate-500 hover:text-[#1D5F31] transition-colors p-1">
                        <GripVertical size={24} />
                    </button>
                    <div>
                        <input
                            className="bg-transparent border-none focus:outline-none text-xl font-bold uppercase tracking-tighter w-full text-black"
                            value={module.title}
                            onChange={(e) => onModuleTitleChange?.(module.id, e.target.value)}
                        />
                        <p className="text-[9px] font-bold uppercase tracking-[3px] text-[#1D5F31] mt-1">ESTRUTURA DE MÓDULO</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {canDeleteModule && (
                        <button
                            onClick={onDeleteModule}
                            className="flex items-center gap-2 px-4 py-3 text-slate-400 hover:text-red-500 hover:bg-red-500/10 rounded-md text-[9px] font-bold uppercase tracking-[3px] transition-all border border-transparent hover:border-red-500/30"
                        >
                            <Trash2 size={16} />
                            Excluir Módulo
                        </button>
                    )}
                    <button
                        onClick={onAddLesson}
                        className="flex items-center gap-2 px-4 py-3 bg-[#1D5F31] text-white rounded-md text-[9px] font-bold uppercase tracking-[3px] hover:bg-[#1D5F31]/90 transition-all border-none"
                    >
                        <Plus size={16} />
                        Adicionar Aula
                    </button>
                    <button
                        onClick={onAddQuiz}
                        className="flex items-center gap-2 px-4 py-3 bg-slate-800 text-white rounded-md text-[9px] font-bold uppercase tracking-[3px] hover:bg-slate-700 transition-all border-none"
                    >
                        <HelpCircle size={16} />
                        Adicionar Quiz
                    </button>
                </div>
            </div>

            <div className="p-8 bg-white/30">
                <DndContext
                    collisionDetection={closestCenter}
                    onDragEnd={onReorderLessons}
                >
                    <SortableContext
                        items={module.lessons.map(l => l.id)}
                        strategy={verticalListSortingStrategy}
                    >
                        {module.lessons.map((lesson) => (
                            <SortableLesson
                                key={lesson.id}
                                lesson={lesson}
                                isSelected={selectedLessonId === lesson.id}
                                onSelect={() => onSelectLesson(lesson)}
                                onDelete={() => onDeleteLesson(lesson.id)}
                                onTitleChange={(newTitle) => onLessonTitleChange(lesson.id, newTitle)}
                                onResubmit={() => onResubmitLesson && onResubmitLesson(lesson.id)}
                                onCancel={() => onCancelLesson && onCancelLesson(lesson.id)}
                            />
                        ))}
                    </SortableContext>
                </DndContext>

                {module.lessons.length === 0 && (
                    <div className="py-16 border-2 border-dashed border-[#1D5F31]/30/30/30 rounded-md flex flex-col items-center justify-center text-slate-500 bg-white/50">
                        <Video size={48} className="mb-4 opacity-20" />
                        <p className="text-[10px] font-bold uppercase tracking-[3px]">Crie sua primeira entrega</p>
                        <p className="text-[9px] mt-2 font-medium ">ESTE MÓDULO ESTÁ EM BRANCO</p>
                    </div>
                )}
            </div>
        </div>
    )
}

// --- Video Upload Component ---
function VideoUpload({ onUploadComplete, onUploadStart }: { onUploadComplete: (data: { url?: string, mux_upload_id?: string, mux_playback_id?: string, mux_asset_id?: string }) => void, onUploadStart?: () => void }) {
    const [isUploading, setIsUploading] = useState(false)
    const [progress, setProgress] = useState(0)
    const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'processing' | 'ready'>('idle')

    const onDrop = async (acceptedFiles: File[]) => {
        if (acceptedFiles.length === 0) return

        onUploadStart?.()
        setIsUploading(true)
        setUploadStatus('uploading')
        setProgress(0)

        try {
            // 1. Obter URL de upload do Mux
            const response = await getMuxUploadUrl('lesson')
            if (response.error || !response.url) {
                throw new Error(response.error || "Erro ao gerar URL de upload")
            }

            const { url, id: uploadId } = response

            // 2. Upload direto via XHR para acompanhar progresso
            return new Promise((resolve, reject) => {
                const xhr = new XMLHttpRequest()
                xhr.open('PUT', url)

                xhr.upload.onprogress = (event) => {
                    if (event.lengthComputable) {
                        const percentComplete = (event.loaded / event.total) * 100
                        setProgress(Math.round(percentComplete))
                    }
                }

                xhr.onload = async () => {
                    if (xhr.status >= 200 && xhr.status < 300) {
                        setUploadStatus('processing')
                        // 3. Notificar o ID do upload imediatamente — o pai assume o
                        //    polling e exibe o loading skeleton.
                        onUploadComplete({ mux_upload_id: uploadId })

                        let attempts = 0
                        const checkStatus = async () => {
                            if (attempts > 30) {
                                resolve(true)
                                return
                            }
                            const statusRes = await getMuxUploadStatus(uploadId)
                            if (statusRes.status === 'ready') {
                                onUploadComplete({
                                    mux_upload_id: uploadId,
                                    mux_playback_id: statusRes.playback_id,
                                    mux_asset_id: statusRes.asset_id
                                })
                                setUploadStatus('ready')
                                resolve(true)
                            } else {
                                attempts++
                                setTimeout(checkStatus, 3000)
                            }
                        }
                        checkStatus()
                    } else {
                        reject(new Error("Erro no upload para o Mux"))
                    }
                }

                xhr.onerror = () => reject(new Error("Erro de rede durante o upload"))
                xhr.send(acceptedFiles[0])
            })
        } catch (error: any) {
            toast.error(error.message)
        } finally {
            if (uploadStatus !== 'processing') {
                setIsUploading(false)
            }
        }
    }

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { 'video/*': [] },
        multiple: false,
        disabled: isUploading
    })

    return (
        <div className="space-y-6">
            <div
                {...getRootProps()}
                className={`
                    border-2 border-dashed rounded-md p-12 transition-all duration-500 cursor-pointer flex flex-col items-center justify-center gap-4
                    ${isDragActive ? 'border-slate-900 bg-slate-50' : 'border-slate-200 hover:border-slate-400 bg-white'}
                    ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}
                `}
            >
                <input {...getInputProps()} />
                <div className="w-16 h-16 rounded-md flex items-center justify-center bg-slate-100 text-slate-900 border border-slate-900">
                    {isUploading ? <Loader2 className="animate-spin" size={28} /> : <UploadCloud size={28} strokeWidth={2.5} />}
                </div>
                <div className="text-center">
                    <p className="font-black uppercase tracking-tighter text-lg text-slate-900 leading-none">
                        {isUploading ? 'Transferindo Dados' : 'Arraste seu vídeo'}
                    </p>
                    <p className="text-[9px] text-slate-500 font-bold uppercase tracking-[3px] mt-2">
                        {isUploading ? 'NÃO FECHE ESTA PÁGINA' : 'MP4, MOV OU MKV • PADRÃO INDUSTRIAL'}
                    </p>
                </div>
            </div>

            {isUploading && (
                <div className={`p-6 rounded-md shadow-sm border ${uploadStatus === 'processing' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-900'}`}>
                    <div className="flex justify-between items-center mb-4">
                        <span className={`text-[10px] font-black uppercase tracking-[3px] ${uploadStatus === 'processing' ? 'text-white' : 'text-slate-900'}`}>
                            {uploadStatus === 'uploading' ? `UPLOAD INDUSTRIAL: ${progress}%` : 'OTIMIZANDO VÍDEO PARA STREAMING...'}
                        </span>
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-[#1D5F31] rounded-md animate-pulse" />
                            <span className="text-[9px] font-bold uppercase text-[#1D5F31]">INFRA ATIVA</span>
                        </div>
                    </div>

                    {/* Barra de Progresso Industrial */}
                    <div className={`w-full h-3 rounded-md overflow-hidden border ${uploadStatus === 'processing' ? 'bg-white/10 border-white/10' : 'bg-slate-100 border-slate-200'}`}>
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${uploadStatus === 'processing' ? 100 : progress}%` }}
                            className={`h-full transition-all duration-300 ${uploadStatus === 'processing' ? 'bg-[#1D5F31]' : 'bg-slate-900'}`}
                        />
                    </div>

                    <p className={`text-[9px] mt-3 font-bold uppercase tracking-widest ${uploadStatus === 'processing' ? 'text-slate-400' : 'text-slate-500'}`}>
                        {uploadStatus === 'uploading' ? 'SINCRONIZANDO COM DATA CENTERS MUX' : 'GERANDO PLAYBACK ID DE ALTA PERFORMANCE'}
                    </p>
                </div>
            )}

            {uploadStatus === 'ready' && (
                <div className="bg-[#1D5F31]/10 border border-[#1D5F31] p-4 rounded-md flex items-center gap-3">
                    <CheckCircle2 className="text-[#1D5F31]" size={20} />
                    <span className="text-[10px] font-bold uppercase text-[#1D5F31] tracking-widest">Vídeo Processado e Pronto</span>
                </div>
            )}
        </div>
    )
}

// --- Course Image Upload Component ---
function CourseImageUpload({ currentImageUrl, onUploadComplete }: { currentImageUrl?: string, onUploadComplete: (url: string) => void }) {
    const [isUploading, setIsUploading] = useState(false)

    const onDrop = async (acceptedFiles: File[]) => {
        if (acceptedFiles.length === 0) return
        setIsUploading(true)
        try {
            const imageUrl = await uploadCourseImage(acceptedFiles[0])
            onUploadComplete(imageUrl)
        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setIsUploading(false)
        }
    }

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { 'image/*': [] },
        multiple: false
    })

    return (
        <div className="space-y-4">
            <div
                {...getRootProps()}
                className={`
                    relative group border-2 border-dashed rounded-md overflow-hidden transition-all duration-500 cursor-pointer h-40 flex flex-col items-center justify-center gap-2
                    ${isDragActive ? 'border-[#1D5F31] bg-[#1D5F31]/5' : 'border-[#1D5F31] hover:border-[#1D5F31]/30 bg-white'}
                `}
            >
                <input {...getInputProps()} />
                {currentImageUrl ? (
                    <>
                        <img src={currentImageUrl} alt="Capa do Curso" className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-40 transition-opacity" />
                        <div className="relative z-10 flex flex-col items-center gap-3 bg-white/80 backdrop-blur-md px-6 py-3 rounded-md border border-[#1D5F31]/20 opacity-0 group-hover:opacity-100 transition-all">
                            <UploadCloud size={20} className="text-[#1D5F31]" />
                            <span className="text-[9px] font-bold uppercase tracking-widest text-[#1D5F31]">Trocar Capa</span>
                        </div>
                    </>
                ) : (
                    <>
                        <div className="w-14 h-14 bg-white rounded-md flex items-center justify-center text-slate-500 border border-[#1D5F31]/20">
                            <UploadCloud size={28} />
                        </div>
                        <span className="text-[9px] font-bold uppercase tracking-[3px] text-black/60">Carregar Arte</span>
                    </>
                )}
            </div>

            {isUploading && (
                <div className="flex items-center gap-3 text-[#1D5F31] px-2 animate-pulse">
                    <Loader2 className="animate-spin" size={16} />
                    <span className="text-[9px] font-bold uppercase tracking-widest">Processando Imagem...</span>
                </div>
            )}
        </div>
    )
}

// --- Main Builder Component ---
export default function CourseBuilder() {
    const params = useParams()
    const router = useRouter()
    // const supabase = createClient() // Removed

    const [loading, setLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [showSuccess, setShowSuccess] = useState(false)
    const [isDeletingVideo, setIsDeletingVideo] = useState(false)

    // Efeito para carregar dados
    const [course, setCourse] = useState<any>(null)
    const [modules, setModules] = useState<Module[]>([])
    const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null)

    const [courseTitle, setCourseTitle] = useState('')
    const [courseSubtitle, setCourseSubtitle] = useState('')
    const [courseDescription, setCourseDescription] = useState('')
    const [courseCategory, setCourseCategory] = useState('')
    const [courseDuration, setCourseDuration] = useState(0)
    const [coursePrice, setCoursePrice] = useState('0.00')
    const [courseImage, setCourseImage] = useState('')
    const [courseIntroVideo, setCourseIntroVideo] = useState('')
    const [courseIntroVideoMuxId, setCourseIntroVideoMuxId] = useState('')
    const [courseIntroVideoAssetId, setCourseIntroVideoAssetId] = useState('')
    const [courseIntroVideoPlaybackId, setCourseIntroVideoPlaybackId] = useState('')
    const [coursePricingType, setCoursePricingType] = useState<'free' | 'standard'>('standard')
    const [courseCurriculum, setCourseCurriculum] = useState<string[]>([])
    const [isUploadingIntro, setIsUploadingIntro] = useState(false)
    const [introUploadProgress, setIntroUploadProgress] = useState(0)
    const [introUploadStatus, setIntroUploadStatus] = useState<'idle' | 'uploading' | 'processing' | 'ready'>('idle')
    const [isPlayingIntro, setIsPlayingIntro] = useState(false)
    const introFileInputRef = useRef<HTMLInputElement>(null)
    const [courseTags, setCourseTags] = useState<string[]>([])
    const [pendingTrailerPlaybackId, setPendingTrailerPlaybackId] = useState('')
    const [pendingTrailerUrl, setPendingTrailerUrl] = useState('')
    const [pendingTrailerAssetId, setPendingTrailerAssetId] = useState('')
    const [trailerReviewStatus, setTrailerReviewStatus] = useState('')
    const [processingUploadId, setProcessingUploadId] = useState<string | null>(null)
    const [isProcessingVideo, setIsProcessingVideo] = useState(false)

    // Autosave state
    const [autosaveStatus, setAutosaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
    const autosaveTimerRef = useRef<NodeJS.Timeout | null>(null)
    const skipInitialAutosaveRef = useRef(true)
    const forceImmediateAutosaveRef = useRef(false)

    const performAutosave = async () => {
        const allLessons = modules.flatMap(m => m.lessons)
        if (allLessons.length === 0) return
        setAutosaveStatus('saving')
        const result = await autosaveCourseAction(params.id as string, { modules })
        if (result.success) {
            setAutosaveStatus('saved')
            const idMap = 'idMap' in result ? result.idMap : undefined
            if (idMap && Object.keys(idMap).length > 0) {
                setModules(prev => prev.map(m => ({
                    ...m,
                    lessons: m.lessons.map(l => ({
                        ...l,
                        id: idMap[l.id] || l.id
                    }))
                })))
                setSelectedLesson(prev => prev ? { ...prev, id: idMap[prev.id] || prev.id } : null)
            }
            setTimeout(() => setAutosaveStatus(prev => prev === 'saved' ? 'idle' : prev), 2000)
        } else {
            setAutosaveStatus('error')
            console.error('[autosave]', result.error)
        }
    }

    // Autosave effect: observes modules and saves with debounce.
    // addLesson/deleteLesson/uploadComplete set forceImmediateAutosaveRef = true BEFORE changing modules.
    useEffect(() => {
        if (skipInitialAutosaveRef.current) {
            skipInitialAutosaveRef.current = false
            return
        }
        if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current)
        const delay = forceImmediateAutosaveRef.current ? 0 : 1500
        forceImmediateAutosaveRef.current = false
        autosaveTimerRef.current = setTimeout(performAutosave, delay)
        return () => {
            if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current)
        }
    }, [modules])

    // Reseta isProcessingVideo se a aula selecionada já estiver pronta
    useEffect(() => {
        if (selectedLesson?.mux_playback_id || selectedLesson?.video_url) {
            setIsProcessingVideo(false)
        }
    }, [selectedLesson?.id, selectedLesson?.mux_playback_id, selectedLesson?.video_url])

    // Polling: quando o upload de uma aula termina, busca o playback_id no Mux.
    // Atualiza a lesson correta no state local assim que ficar pronto.
    useEffect(() => {
        if (!processingUploadId) return
        let cancelled = false
        let attempts = 0
        const poll = async () => {
            if (cancelled || attempts > 30) {
                if (!cancelled) setProcessingUploadId(null)
                return
            }
            const statusRes = await getMuxUploadStatus(processingUploadId)
            if (statusRes.status === 'ready' && !cancelled) {
                forceImmediateAutosaveRef.current = true
                setModules(prev => prev.map(m => ({
                    ...m,
                    lessons: m.lessons.map(l =>
                        l.mux_upload_id === processingUploadId
                            ? { ...l, mux_playback_id: statusRes.playback_id || l.mux_playback_id, mux_asset_id: statusRes.asset_id || l.mux_asset_id }
                            : l
                    )
                })))
                setSelectedLesson(prev =>
                    prev?.mux_upload_id === processingUploadId
                        ? { ...prev, mux_playback_id: statusRes.playback_id || prev.mux_playback_id, mux_asset_id: statusRes.asset_id || prev.mux_asset_id }
                        : prev
                )
                setProcessingUploadId(null)
                setIsProcessingVideo(false)
            } else {
                attempts++
                setTimeout(poll, 3000)
            }
        }
        poll()
        return () => { cancelled = true }
    }, [processingUploadId])

    // 1. Carrega dados do Firestore
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user: User | null) => {
            if (user) {
                setLoading(true)
                const courseId = params.id as string

                try {
                    // Busca o curso
                    const courseDoc = await getDoc(doc(db, 'courses', courseId))
                    if (courseDoc.exists()) {
                        const cData = courseDoc.data()
                        const courseSerialized: Record<string, any> = { id: courseDoc.id }
                        for (const key of Object.keys(cData)) {
                            const val = cData[key]
                            if (val && typeof val.toDate === 'function') {
                                courseSerialized[key] = val.toDate().toISOString()
                            } else {
                                courseSerialized[key] = val
                            }
                        }
                        setCourse(courseSerialized)
                        setCourseTitle(cData.title)
                        setCourseSubtitle(cData.subtitle || '')
                        setCourseDescription(cData.description || '')
                        setCourseCategory(cData.category || '')
                        setCourseDuration(cData.duration || 0)
                        setCoursePrice(cData.price.toString().replace('.', ','))
                        setCourseImage(cData.image_url || '')
                        setCourseIntroVideo(cData.intro_video_url || '')
                        setCourseIntroVideoMuxId(cData.intro_video_mux_id || '')
                        setCourseIntroVideoAssetId(cData.intro_video_asset_id || '')
                        setCourseIntroVideoPlaybackId(cData.intro_video_playback_id || '')
                        setCoursePricingType(cData.pricing_type || 'standard')
                        setCourseCurriculum(cData.curriculum || [])
                        setCourseTags(cData.tags || [])
                        setPendingTrailerPlaybackId(cData.pendingTrailerPlaybackId || '')
                        setPendingTrailerUrl(cData.pendingTrailerUrl || '')
                        setPendingTrailerAssetId(cData.pendingTrailerAssetId || '')
                        setTrailerReviewStatus(cData.trailer_review_status || '')

                        // Busca as aulas
                        const lessonsRef = collection(db, 'lessons')
                        const q = query(
                            lessonsRef,
                            where('course_id', '==', courseId),
                            orderBy('position', 'asc')
                        )
                        const lessonsSnapshot = await getDocs(q)
                        const lData = lessonsSnapshot.docs.map(doc => {
                            const raw = doc.data()
                            const serialized: Record<string, any> = { id: doc.id }
                            for (const key of Object.keys(raw)) {
                                const val = raw[key]
                                if (val && typeof val.toDate === 'function') {
                                    serialized[key] = val.toDate().toISOString()
                                } else {
                                    serialized[key] = val
                                }
                            }
                            return serialized
                        }) as Lesson[]

                        // Reconstrói a estrutura hierárquica de módulos
                        const courseModules: { id: string; title: string; position: number }[] = cData.modules || []
                        let modulesData: Module[]

                        if (courseModules.length > 0) {
                            // Agrupa lições por module_id
                            const lessonsByModuleId: Record<string, Lesson[]> = {}
                            lData.forEach(lesson => {
                                const mid = lesson.module_id || 'default'
                                if (!lessonsByModuleId[mid]) lessonsByModuleId[mid] = []
                                lessonsByModuleId[mid].push(lesson)
                            })

                            modulesData = courseModules.map(m => ({
                                id: m.id,
                                title: m.title,
                                lessons: lessonsByModuleId[m.id] || [],
                            }))

                            // Inclui módulos que existem no Firestore mas não no course.modules (fallback)
                            Object.entries(lessonsByModuleId).forEach(([mid, lessons]) => {
                                if (!courseModules.some((cm: any) => cm.id === mid)) {
                                    modulesData.push({
                                        id: mid,
                                        title: 'MÓDULO ADICIONAL',
                                        lessons,
                                    })
                                }
                            })
                        } else {
                            // Fallback: dados legados sem module_id — coloca tudo em um módulo único
                            modulesData = [
                                {
                                    id: 'main-structure',
                                    title: 'ESTRUTURA DO CURSO',
                                    lessons: lData,
                                },
                            ]
                        }

                        setModules(modulesData)

                        // Seleciona a primeira aula por padrão se existir
                        if (lData.length > 0) {
                            setSelectedLesson(lData[0])
                        }
                    }
                } catch (error) {
                    console.error("Erro ao carregar dados:", error)
                } finally {
                    setLoading(false)
                }
            }
        })

        return () => unsubscribe()
    }, [params.id])

    useEffect(() => {
        if (selectedLesson) {
            window.scrollTo({ top: 0, behavior: 'smooth' })
        }
    }, [selectedLesson?.id])

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    )

    const handleLessonReorder = (moduleId: string, event: DragEndEvent) => {
        const { active, over } = event
        if (over && active.id !== over.id) {
            setModules((prevModules) => {
                return prevModules.map((mod) => {
                    if (mod.id === moduleId) {
                        const oldIndex = mod.lessons.findIndex((l) => l.id === active.id)
                        const newIndex = mod.lessons.findIndex((l) => l.id === over.id)
                        return {
                            ...mod,
                            lessons: arrayMove(mod.lessons, oldIndex, newIndex),
                        }
                    }
                    return mod
                })
            })
        }
    }

    const handleSave = async () => {
        setIsSaving(true)
        const allLessons = modules.flatMap(m => m.lessons)

        // Verifica se há aulas resubmetidas (status mudou de REJEITADO para PENDENTE)
        const hasResubmittedLessons = allLessons.some(l => l.status === 'PENDENTE' && l.id && !l.id.startsWith('new-'))

        // Se curso está REJEITADO e há aulas resubmetidas, muda status do curso para PENDENTE
        const newCourseStatus = (course?.status === 'REJEITADO' && hasResubmittedLessons) ? 'PENDENTE' : course?.status

        // Parse price safely
        let formattedPrice = 0
        try {
            formattedPrice = parseFloat(coursePrice.replace(',', '.'))
            if (isNaN(formattedPrice)) formattedPrice = 0
        } catch (e) {
            formattedPrice = 0
        }

        if (coursePricingType !== 'free' && formattedPrice <= 0) {
            toast.error("O curso Pago deve ter um valor maior que zero.")
            setIsSaving(false)
            return
        }

        try {
            // Constrói payload SEMPRE sem Timestamps do Firestore
            const payload: Record<string, any> = {
                title: courseTitle,
                subtitle: courseSubtitle,
                description: courseDescription,
                category: courseCategory,
                price: formattedPrice,
                pricing_type: coursePricingType,
                duration: courseDuration,
                image_url: courseImage,
                modules: modules.map((m, i) => ({
                    id: m.id,
                    title: m.title,
                    position: i,
                })),
                lessons: allLessons.map((l: any) => ({
                    id: l.id,
                    module_id: l.module_id,
                    title: l.title,
                    description: l.description,
                    video_url: l.video_url || '',
                    mux_upload_id: l.mux_upload_id || '',
                    mux_playback_id: l.mux_playback_id || '',
                    mux_asset_id: l.mux_asset_id || '',
                    notas: l.notas || '',
                    status: l.status,
                    type: l.type,
                    quizData: l.quizData,
                })),
                status: newCourseStatus,
                tags: courseTags,
                curriculum: courseCurriculum,
            }

            // Só envia intro_video_* se NÃO houver trailer pendente.
            // Quando há pending trailer, o auto-save já persistiu em pendingTrailer*,
            // e reenviar como intro_video_* faria updateCourseAction deletar o asset.
            if (trailerReviewStatus !== 'trailer_pending_review') {
                payload.intro_video_url = courseIntroVideo
                payload.intro_video_mux_id = courseIntroVideoMuxId
                payload.intro_video_asset_id = courseIntroVideoAssetId
                payload.intro_video_playback_id = courseIntroVideoPlaybackId
            }

            const result = await updateCourseAction(params.id as string, payload)

            if (result.success) {
                setShowSuccess(true)
                setTimeout(() => setShowSuccess(false), 3000)
            } else {
                console.error('Erro ao salvar:', result.error)
                toast.error("Erro ao salvar: " + result.error)
            }
        } catch (error: any) {
            console.error('Erro na comunicação:', error)
            toast.error("Falha na comunicação com o servidor: " + error.message)
        } finally {
            setIsSaving(false)
        }
    }

    if (loading) {
        return (
            <div className="h-screen bg-transparent flex items-center justify-center font-montserrat">
                <Loader2 className="animate-spin text-[#1D5F31]" size={48} />
            </div>
        )
    }

    return (
        <div className="px-4 pb-8 md:px-8 md:pb-12 pt-2 md:pt-4 min-h-screen bg-transparent text-black font-montserrat">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6 px-2">
                <div className="flex-grow">

                    <div className="flex items-center gap-3 mb-2">
                        <input
                            className="bg-transparent border-none focus:outline-none text-3xl font-bold tracking-tighter uppercase w-full py-1 transition-all placeholder:text-black/40 text-black"
                            placeholder="TÍTULO DO CURSO"
                            value={courseTitle}
                            onChange={(e) => setCourseTitle(e.target.value)}
                        />
                        <div className={`px-4 py-2 rounded-md border shrink-0 ${course?.status === 'APROVADO'
                                ? 'bg-[#1D5F31]/10 border-[#1D5F31]/30'
                                : course?.status === 'REJEITADO'
                                    ? 'bg-red-50 border-red-300'
                                    : 'bg-amber-50 border-amber-300'
                            }`}>
                            <span className={`text-[10px] font-bold uppercase tracking-widest ${course?.status === 'APROVADO' ? 'text-[#1D5F31]' :
                                    course?.status === 'REJEITADO' ? 'text-red-600' : 'text-amber-700'
                                }`}>
                                {course?.status === 'APROVADO' ? '✓ Aprovado' :
                                    course?.status === 'REJEITADO' ? '✕ Rejeitado' : '⏳ Pendente'}
                            </span>
                        </div>
                        {autosaveStatus !== 'idle' && (
                            <span className={`text-[9px] font-bold uppercase tracking-widest transition-opacity ${autosaveStatus === 'saving' ? 'text-amber-600' : autosaveStatus === 'saved' ? 'text-[#1D5F31]' : 'text-red-500'}`}>
                                {autosaveStatus === 'saving' ? '⟳ Salvando...' : autosaveStatus === 'saved' ? '✓ Salvo automaticamente' : '✕ Erro ao salvar'}
                            </span>
                        )}
                    </div>
                </div>

                {course?.status === 'REJEITADO' && course?.motivoRejeicao && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
                        <div className="flex items-center gap-2 mb-2">
                            <AlertCircle size={16} className="text-red-500" />
                            <span className="text-[10px] font-bold uppercase text-red-600 tracking-widest">Curso Rejeitado - Feedback do Admin</span>
                        </div>
                        <p className="text-sm text-red-700">{course.motivoRejeicao}</p>
                    </div>
                )}

                <div className="flex items-center gap-4 bg-white p-3 rounded-md border border-[#1D5F31]/20 shrink-0">
                    <button
                        onClick={() => router.push('/dashboard-teacher/courses')}
                        className="px-8 py-4 bg-[#061629] border-none rounded-md text-[10px] font-bold uppercase tracking-[4px] text-white hover:bg-[#061629]/90 transition-all font-montserrat"
                    >
                        SAIR
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className={`flex items-center gap-3 font-bold uppercase text-[10px] tracking-[4px] px-8 py-4 rounded-md transition-all border-2 disabled:opacity-50 ${showSuccess ? 'bg-[#1D5F31] border-none text-white' : 'bg-[#1D5F31] border-none text-white hover:bg-[#1D5F31]/90'}`}
                    >
                        {isSaving ? <Loader2 className="animate-spin" size={18} /> : (showSuccess ? <CheckCircle2 size={18} strokeWidth={3} /> : <Save size={18} strokeWidth={3} />)}
                        {isSaving ? 'Processando...' : (showSuccess ? 'Salvo com Sucesso' : 'Salvar Curso')}
                    </button>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 px-2">
                {/* Lado Esquerdo: Estrutura (D&D) */}
                <div className="lg:col-span-2 space-y-12">
                    <div className="flex items-center justify-between pb-6 border-b-2 border-[#1D5F31]">
                        <div>
                            <h2 className="text-xl font-bold uppercase tracking-tighter flex items-center gap-3 text-black leading-none">
                                <FileText size={20} className="text-[#1D5F31]" />
                                Arquitetura do Treinamento
                            </h2>
                            <p className="text-[10px] font-bold uppercase tracking-[2px] text-[#1D5F31] mt-2">Organize o fluxo de entrega de valor.</p>
                        </div>
                        <button
                            onClick={() => setModules([...modules, { id: Date.now().toString(), title: `MÓDULO DE APRENDIZADO ${modules.length + 1}`, lessons: [] }])}
                            className="text-[10px] font-bold uppercase tracking-[4px] text-white bg-[#061629] hover:bg-[#061629]/90 px-6 py-3 rounded-md border-none transition-all"
                        >
                            + Novo Módulo
                        </button>
                    </div>

                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={(e) => {
                            const { active, over } = e
                            if (over && active.id !== over.id) {
                                const oldIndex = modules.findIndex((m) => m.id === active.id)
                                const newIndex = modules.findIndex((m) => m.id === over.id)
                                if (oldIndex !== -1 && newIndex !== -1) {
                                    setModules(arrayMove(modules, oldIndex, newIndex))
                                }
                            }
                        }}
                    >
                        <SortableContext
                            items={modules.map(m => m.id)}
                            strategy={verticalListSortingStrategy}
                        >
                            {modules.map((module) => (
                                <SortableModule
                                    key={module.id}
                                    module={module}
                                    selectedLessonId={selectedLesson?.id}
                                    onSelectLesson={setSelectedLesson}
                                    onModuleTitleChange={(moduleId, newTitle) => {
                                        setModules(prev => prev.map(m =>
                                            m.id === moduleId ? { ...m, title: newTitle } : m
                                        ))
                                    }}
                                    onAddLesson={() => {
                                        const newLesson: Lesson = { id: `new-${Date.now()}`, title: 'Nova Aula Digital', video_url: '', module_id: module.id, position: 0, description: '' }
                                        forceImmediateAutosaveRef.current = true
                                        setModules(prev => prev.map(m => m.id === module.id ? { ...m, lessons: [newLesson, ...m.lessons] } : m))
                                    }}
                                    onDeleteLesson={(lessonId) => {
                                        forceImmediateAutosaveRef.current = true
                                        if (lessonId.startsWith('new-')) {
                                            setModules(prev => prev.map(m => m.id === module.id ? { ...m, lessons: m.lessons.filter(l => l.id !== lessonId) } : m))
                                            if (selectedLesson?.id === lessonId) setSelectedLesson(null)
                                            return
                                        }
                                        const targetLesson = modules.flatMap(m => m.lessons).find(l => l.id === lessonId)
                                        if (targetLesson?.status === 'APROVADO') {
                                            setModules(prev => prev.map(m => m.id === module.id ? {
                                                ...m,
                                                lessons: m.lessons.map(l => l.id === lessonId ? { ...l, status: 'SOLICITADO_EXCLUSAO' } : l)
                                            } : m))
                                            if (selectedLesson?.id === lessonId) {
                                                setSelectedLesson(prev => prev ? { ...prev, status: 'SOLICITADO_EXCLUSAO' } : null)
                                            }
                                            toast.info("Remoção solicitada. Salve o projeto para confirmar.")
                                        } else {
                                            setModules(prev => prev.map(m => m.id === module.id ? {
                                                ...m,
                                                lessons: m.lessons.filter(l => l.id !== lessonId)
                                            } : m))
                                            if (selectedLesson?.id === lessonId) setSelectedLesson(null)
                                        }
                                    }}
                                    onReorderLessons={(e) => handleLessonReorder(module.id, e)}
                                    onLessonTitleChange={(lessonId, newTitle) => {
                                        setModules(prev => prev.map(m => m.id === module.id ? {
                                            ...m,
                                            lessons: m.lessons.map(l => l.id === lessonId ? { ...l, title: newTitle } : l)
                                        } : m))
                                        if (selectedLesson?.id === lessonId) setSelectedLesson(prev => prev ? { ...prev, title: newTitle } : null)
                                    }}
                                    onDeleteModule={() => {
                                        toast("Confirmar Exclusão", {
                                            description: "Tem certeza que deseja excluir este módulo? Todas as aulas dentro dele serão removidas.",
                                            action: {
                                                label: "Excluir",
                                                onClick: () => {
                                                    setModules(prev => prev.filter(m => m.id !== module.id))
                                                    if (selectedLesson && module.lessons.some(l => l.id === selectedLesson.id)) {
                                                        setSelectedLesson(null)
                                                    }
                                                }
                                            }
                                        })
                                    }}
                                    canDeleteModule={modules.length > 1}
                                    onResubmitLesson={(lessonId) => {
                                        setModules(prev => prev.map(m => m.id === module.id ? {
                                            ...m,
                                            lessons: m.lessons.map(l => l.id === lessonId ? { ...l, status: 'PENDENTE' } : l)
                                        } : m))
                                        if (selectedLesson?.id === lessonId) {
                                            setSelectedLesson(prev => prev ? { ...prev, status: 'PENDENTE' } : null)
                                        }
                                    }}
                                    onCancelLesson={(lessonId) => {
                                        toast("Confirmar Ação", {
                                            description: "Deseja realmente cancelar a solicitação de exclusão desta aula?",
                                            action: {
                                                label: "Confirmar",
                                                onClick: async () => {
                                                    const result = await cancelLessonDeletionRequest(lessonId, params.id as string)
                                                    if (result.success) {
                                                        setModules(prev => prev.map(m => m.id === module.id ? {
                                                            ...m,
                                                            lessons: m.lessons.map(l => l.id === lessonId ? { ...l, status: 'APROVADO' } : l)
                                                        } : m))
                                                        if (selectedLesson?.id === lessonId) {
                                                            setSelectedLesson(prev => prev ? { ...prev, status: 'APROVADO' } : null)
                                                        }
                                                        toast.success('Solicitação de exclusão cancelada!')
                                                    } else {
                                                        toast.error('Erro ao cancelar: ' + result.error)
                                                    }
                                                }
                                            }
                                        })
                                    }}
                                    onAddQuiz={() => {
                                        const newQuiz: Lesson = {
                                            id: `quiz-${Date.now()}`,
                                            title: 'Novo Questionário',
                                            video_url: '',
                                            module_id: module.id,
                                            position: 0,
                                            description: '',
                                            type: 'quiz',
                                            quizData: {
                                                title: 'Novo Questionário',
                                                description: '',
                                                questions: [{ id: Math.random().toString(), text: '', options: ['', ''], correctAnswer: 0 }]
                                            }
                                        }
                                        // Insere no topo (unshift) para que o professor veja o novo quiz no início
                                        setModules(prev => prev.map(m => m.id === module.id ? { ...m, lessons: [newQuiz, ...m.lessons] } : m))
                                        setSelectedLesson(newQuiz)
                                    }}
                                />
                            ))}
                        </SortableContext>
                    </DndContext>

                    {/* Novo Studio de Multimídia (Coluna Principal) */}
                    <div className="pt-12 border-t-2 border-[#1D5F31]">
                        <div className="mb-8 flex items-start justify-between">
                            <div>
                                <h3 className="text-[10px] font-bold uppercase tracking-[5px] text-[#1D5F31] mb-1 ">Studio de Multimídia</h3>
                                <p className="text-[9px] font-bold uppercase tracking-[2px] text-black/60">Gerenciamento dinâmico de vídeo aulas</p>
                            </div>
                            {selectedLesson && (
                                <Trash
                                    className="h-5 w-5 text-red-500 hover:text-red-700 cursor-pointer transition-colors shrink-0"
                                    onClick={async () => {
                                        if (selectedLesson.status === 'APROVADO') {
                                            setModules(prev => prev.map(m => ({
                                                ...m,
                                                lessons: m.lessons.map(l => l.id === selectedLesson.id ? { ...l, status: 'SOLICITADO_EXCLUSAO' } : l)
                                            })))
                                            setSelectedLesson(prev => prev ? { ...prev, status: 'SOLICITADO_EXCLUSAO' } : null)
                                            toast.info("Remoção solicitada. Salve o projeto para confirmar.")
                                        } else {
                                            if (selectedLesson.mux_asset_id) {
                                                await deleteMuxAsset(selectedLesson.mux_asset_id)
                                            }
                                            const cleared = {
                                                video_url: '',
                                                mux_upload_id: '',
                                                mux_playback_id: '',
                                                mux_asset_id: '',
                                            }
                                            setModules(prev => prev.map(m => ({
                                                ...m,
                                                lessons: m.lessons.map(l => l.id === selectedLesson.id ? { ...l, ...cleared } : l)
                                            })))
                                            setSelectedLesson(prev => prev ? { ...prev, ...cleared } : null)
                                            toast.success("Vídeo removido da aula.")
                                        }
                                    }}
                                />
                            )}
                        </div>

                        {selectedLesson ? (
                            <div className="space-y-4 bg-white p-8 rounded-md border border-[#1D5F31]/20 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b-2 border-[#1D5F31]">
                                    <div className="space-y-2 flex-grow">
                                        <span className="text-[9px] font-bold uppercase text-[#1D5F31] tracking-[3px]">Título da Aula Digital</span>
                                        <input
                                            className="bg-transparent border-none focus:outline-none text-2xl font-bold uppercase tracking-tight text-black w-full"
                                            value={selectedLesson.title}
                                            onChange={(e) => {
                                                const newTitle = e.target.value
                                                setSelectedLesson({ ...selectedLesson, title: newTitle })
                                                setModules(prev => prev.map(m => ({
                                                    ...m,
                                                    lessons: m.lessons.map(l => l.id === selectedLesson.id ? { ...l, title: newTitle } : l)
                                                })))
                                            }}
                                        />
                                        <div className="mt-4">
                                            <span className="text-[9px] font-bold uppercase text-[#1D5F31] tracking-[3px]">Notas da Aula (Markdown ou Texto)</span>
                                            <textarea
                                                className="bg-transparent border-none focus:outline-none text-sm text-neutral-800 w-full mt-2 resize-none min-h-[120px]"
                                                placeholder="Principais tópicos, links úteis ou anotações desta aula..."
                                                value={selectedLesson.notas || ''}
                                                onChange={(e) => {
                                                    const newNotas = e.target.value
                                                    setSelectedLesson({ ...selectedLesson, notas: newNotas })
                                                    setModules(prev => prev.map(m => ({
                                                        ...m,
                                                        lessons: m.lessons.map(l => l.id === selectedLesson.id ? { ...l, notas: newNotas } : l)
                                                    })))
                                                }}
                                            />
                                        </div>
                                        {selectedLesson.status === 'REJEITADO' && selectedLesson.motivoRejeicao && (
                                            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <AlertCircle size={16} className="text-red-500" />
                                                    <span className="text-[10px] font-bold uppercase text-red-600 tracking-widest">Feedback do Admin</span>
                                                </div>
                                                <p className="text-sm text-red-700">{selectedLesson.motivoRejeicao}</p>
                                            </div>
                                        )}
                        </div>

                    </div>

                                <div className="grid grid-cols-1 gap-10">
                                    {selectedLesson.type === 'quiz' ? (
                                        <QuizForm
                                            initialData={selectedLesson.quizData}
                                            onSave={(quizData: {
                                                id?: string
                                                title?: string
                                                description?: string
                                                questions?: Question[]
                                            }) => {
                                                setSelectedLesson({ ...selectedLesson, quizData })
                                                setModules(prev => prev.map(m => ({
                                                    ...m,
                                                    lessons: m.lessons.map(l => l.id === selectedLesson.id ? { ...l, quizData } : l)
                                                })))
                                            }}
                                        />
                                    ) : (
                                        <>
                                            {(!isProcessingVideo && !selectedLesson.mux_playback_id && !selectedLesson.mux_upload_id && !selectedLesson.video_url) ? (
                                                <div className="animate-in fade-in zoom-in duration-500">
                                                    <VideoUpload
                                                        onUploadStart={() => setIsProcessingVideo(true)}
                                                        onUploadComplete={(data) => {
                                                        forceImmediateAutosaveRef.current = true
                                                        const updatedLesson = {
                                                            ...selectedLesson,
                                                            video_url: '',
                                                            mux_upload_id: data.mux_upload_id || selectedLesson.mux_upload_id,
                                                            mux_playback_id: data.mux_playback_id || selectedLesson.mux_playback_id,
                                                            mux_asset_id: data.mux_asset_id || selectedLesson.mux_asset_id
                                                        }
                                                        setSelectedLesson(updatedLesson)
                                                        setModules(prev => prev.map(m => ({
                                                            ...m,
                                                            lessons: m.lessons.map(l => l.id === selectedLesson.id ? updatedLesson : l)
                                                        })))
                                                        if (data.mux_upload_id && !data.mux_playback_id) {
                                                            setProcessingUploadId(data.mux_upload_id)
                                                            setIsProcessingVideo(true)
                                                        }
                                                    }} />
                                                </div>
                                            ) : (
                                                <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-right-4 duration-500">
                                                    <div className="aspect-video w-full bg-slate-900 rounded-md overflow-hidden border border-[#1D5F31]/20 group relative flex items-center justify-center">
                                                        {(processingUploadId || isProcessingVideo) ? (
                                                            <div className="w-full h-full flex flex-col items-center justify-center gap-4 bg-slate-900">
                                                                <div className="w-full h-full absolute inset-0 bg-slate-800 animate-pulse rounded-md" />
                                                                <div className="relative z-10 flex flex-col items-center gap-3">
                                                                    <div className="w-12 h-12 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                                                    <p className="font-black tracking-[4px] text-xs uppercase text-white!">Carregando Vídeo...</p>
                                                                </div>
                                                            </div>
                                                        ) : selectedLesson.mux_playback_id ? (
                                                            <SecureMuxPlayer 
                                                                cursoId={params.id as string} 
                                                                playbackId={selectedLesson.mux_playback_id} 
                                                                className="w-full h-full"
                                                            />
                                                        ) : selectedLesson.mux_upload_id ? (
                                                            <div className="w-full h-full flex flex-col items-center justify-center gap-4 bg-slate-900">
                                                                <div className="w-full h-full absolute inset-0 bg-slate-800 animate-pulse rounded-md" />
                                                                <div className="relative z-10 flex flex-col items-center gap-3">
                                                                    <div className="w-12 h-12 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                                                    <p className="font-black tracking-[4px] text-xs uppercase text-white!">Carregando Vídeo...</p>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <video
                                                                src={selectedLesson.video_url}
                                                                controls
                                                                className="w-full h-full object-contain"
                                                            />
                                                        )}
                                                        
                                                        {(selectedLesson.mux_playback_id || selectedLesson.video_url) && (
                                                            <div className="absolute top-4 right-4 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <div className="bg-white/80 backdrop-blur-md px-4 py-2 rounded-md border border-[#1D5F31]/20 text-[10px] font-bold uppercase text-[#1D5F31] tracking-widest flex items-center gap-2">
                                                                    <span className="w-2 h-2 rounded-md bg-[#1D5F31] animate-pulse"></span>
                                                                    Conteúdo Ativo
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="flex flex-col md:flex-row gap-6 items-center">
                                                        <div className="flex-1 p-6 bg-[#1D5F31]/10 rounded-md border border-[#1D5F31]/20/20 w-full">
                                                            <div className="flex items-center gap-4">
                                                                <div className="w-10 h-10 bg-[#1D5F31] rounded-md flex items-center justify-center text-white">
                                                                    <CheckCircle2 size={20} />
                                                                </div>
                                                                <div>
                                                                    <span className="text-[10px] font-bold uppercase text-[#1D5F31] tracking-[2px] block mb-1">
                                                                        {selectedLesson.mux_playback_id ? 'Infraestrutura Mux Consolidada' : 'Upload Concluído'}
                                                                    </span>
                                                                    <p className="text-[11px] text-black/60 font-medium truncate max-w-[400px]">
                                                                        {selectedLesson.mux_playback_id || selectedLesson.video_url || 'Processando metadata industrial...'}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="p-12 bg-white border border-[#1D5F31]/20 rounded-md flex flex-col items-center justify-center text-center relative overflow-hidden group border-dashed">
                                <div className="absolute inset-0 bg-[#1D5F31]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                                <div className="w-24 h-24 bg-white rounded-md flex items-center justify-center text-[#1D5F31] mb-8 border border-[#1D5F31]/20 relative z-10 group-hover:scale-105 transition-transform duration-500">
                                    <Video size={48} />
                                </div>
                                <p className="text-[11px] text-black/60 font-bold uppercase tracking-[4px] leading-relaxed max-w-[280px] mx-auto relative z-10">
                                    Selecione uma aula na arquitetura para gerenciar seu conteúdo digital.
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Lado Direito: Configurações e Capa */}
                <aside className="space-y-12">
                    <section className="bg-white p-8 rounded-md border border-[#1D5F31]/20 relative overflow-hidden group">
                        <h3 className="text-[10px] font-bold uppercase tracking-[5px] text-[#1D5F31] mb-10  relative z-10">Configurações Base</h3>
                        <div className="space-y-8 relative z-10">
                            <div className="space-y-4">
                                <label className="text-[9px] font-bold uppercase tracking-[3px] text-black/60 px-1">Subtítulo Estratégico</label>
                                <input
                                    type="text"
                                    value={courseSubtitle}
                                    onChange={(e) => setCourseSubtitle(e.target.value)}
                                    placeholder="Frase curta de impacto"
                                    className="w-full bg-white border border-[#1D5F31]/20 rounded-md px-5 py-3 focus:border-[#1D5F31] outline-none text-sm text-black transition-all"
                                />
                            </div>

                            <div className="space-y-4">
                                <label className="text-[9px] font-bold uppercase tracking-[3px] text-black/60 px-1">Descrição Completa</label>
                                <textarea
                                    value={courseDescription}
                                    onChange={(e) => setCourseDescription(e.target.value)}
                                    placeholder="O que o aluno vai aprender?"
                                    className="w-full bg-white border border-[#1D5F31]/20 rounded-md px-6 py-4 focus:border-[#1D5F31] outline-none text-sm text-black transition-all min-h-[120px]"
                                />
                            </div>

                            <div className="space-y-4">
                                <label className="text-[9px] font-bold uppercase tracking-[3px] text-black/60 px-1">Categoria</label>
                                <select
                                    value={courseCategory}
                                    onChange={(e) => setCourseCategory(e.target.value)}
                                    className="w-full bg-white border border-[#1D5F31]/20 rounded-md px-5 py-3 focus:border-[#1D5F31] outline-none text-sm text-black transition-all appearance-none"
                                >
                                    <option value="" disabled>Escolha o nicho...</option>
                                    {CATEGORIES.map((cat: string) => <option key={cat} value={cat}>{cat}</option>)}
                                </select>
                            </div>

                            <div className="space-y-4">
                                <label className="text-[9px] font-bold uppercase tracking-[3px] text-black/60 px-1">Carga Horária (h)</label>
                                <input
                                    type="number"
                                    value={courseDuration}
                                    onChange={(e) => setCourseDuration(Number(e.target.value))}
                                    className="w-full bg-white border border-[#1D5F31]/20 rounded-md px-6 py-4 focus:border-[#1D5F31] outline-none font-bold text-xl text-black transition-all"
                                />
                            </div>

                            <div className="space-y-4">
                                <label className="text-[9px] font-bold uppercase tracking-[3px] text-black/60 px-1">Tags para Busca</label>
                                <TagInput
                                    tags={courseTags}
                                    onChange={(tags) => setCourseTags(tags)}
                                    maxTags={5}
                                    placeholder="Digite uma tag e pressione Enter"
                                />
                            </div>

                            <div className="space-y-4">
                                <label className="text-[9px] font-bold uppercase tracking-[3px] text-black/60 px-1">Tipo de Precificação</label>
                                 <div className="grid grid-cols-3 gap-2">
                                     {[
                                         { id: 'standard', label: 'Pago' },
                                          { id: 'free', label: 'Gratuito' }
                                     ].map((type) => {
                                         const isLocked = course?.pricing_type === 'free' && type.id !== 'free';
                                         return (
                                             <button
                                                 key={type.id}
                                                 type="button"
                                                 disabled={isLocked}
                                                 onClick={() => {
                                                     setCoursePricingType(type.id as any)
                                                     if (type.id === 'free') setCoursePrice('0,00')
                                                 }}
                                                 className={`px-3 py-3 rounded-md text-[9px] font-bold uppercase tracking-widest transition-all border-2 ${
                                                     coursePricingType === type.id
                                                         ? 'bg-[#1D5F31] border-[#1D5F31] text-white'
                                                         : 'bg-white border-black text-black hover:border-[#1D5F31]'
                                                 } ${isLocked ? 'opacity-30 cursor-not-allowed grayscale' : ''}`}
                                                 title={isLocked ? "Cursos gratuitos não podem ser alterados para pagos" : ""}
                                             >
                                                 {type.label}
                                             </button>
                                         );
                                     })}
                                 </div>
                                 {course?.pricing_type === 'free' && (
                                     <p className="text-[8px] text-amber-600 font-bold uppercase tracking-widest mt-2 px-1">
                                         * Este curso é gratuito e não pode ser alterado para pago.
                                     </p>
                                 )}
                             </div>

                            <div className="space-y-4">
                                <label className="text-[9px] font-bold uppercase tracking-[3px] text-black/60 px-1">Valor do Investimento</label>
                                <div className="relative group">
                                    <span className={`absolute left-8 top-1/2 -translate-y-1/2 font-bold text-2xl transition-colors ${coursePricingType === 'free' ? 'text-black/20' : 'text-black group-focus-within:text-[#1D5F31]'}`}>R$</span>
                                    <input
                                        type="text"
                                        value={coursePrice}
                                        onChange={(e) => setCoursePrice(e.target.value)}
                                        disabled={coursePricingType === 'free'}
                                        className={`w-full bg-white border border-[#1D5F31]/20 rounded-md pl-24 pr-8 py-5 focus:border-[#1D5F31] outline-none font-bold text-2xl text-black transition-all ${coursePricingType === 'free' ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    />
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="text-[9px] font-bold uppercase tracking-[3px] text-black/60 px-1">Conteúdo Programático (Grade)</label>
                                    <p className="text-[8px] text-black/70 font-bold uppercase tracking-widest px-1 mt-1">
                                        Adicione os tópicos estratégicos do treinamento.
                                    </p>
                                </div>
                                <div className="space-y-3">
                                    {courseCurriculum.map((topic, idx) => (
                                        <div key={idx} className="flex gap-2">
                                            <input
                                                type="text"
                                                value={topic}
                                                onChange={(e) => {
                                                    const newCurriculum = [...courseCurriculum];
                                                    newCurriculum[idx] = e.target.value;
                                                    setCourseCurriculum(newCurriculum);
                                                }}
                                                placeholder={`Ex: Tópico ${idx + 1}`}
                                                className="w-full bg-white border border-[#1D5F31]/20 rounded-md px-4 h-12 focus:border-[#28b828] outline-none text-sm text-black transition-all placeholder:text-black/40"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const newCurriculum = courseCurriculum.filter((_, i) => i !== idx);
                                                    setCourseCurriculum(newCurriculum);
                                                }}
                                                className="w-12 h-12 text-slate-400 hover:text-red-500 hover:bg-red-500/10 border-2 border-transparent hover:border-red-500/30 rounded-md transition-all flex items-center justify-center shrink-0"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    ))}
                                    <button
                                        type="button"
                                        onClick={() => setCourseCurriculum([...courseCurriculum, ''])}
                                        className="w-full flex justify-center items-center h-12 bg-[#1D5F31]/10 text-black font-bold uppercase text-[9px] tracking-[3px] rounded-md border-2 border-dashed border-[#1D5F31]/30/30/30/50 hover:border-[#1D5F31] hover:bg-[#1D5F31]/20 transition-all text-center mt-2"
                                    >
                                        <Plus size={14} className="mr-2" />
                                        Adicionar Tópico
                                    </button>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section>
                        <h3 className="text-[10px] font-bold uppercase tracking-[5px] text-black/60 mb-6 px-1 ">Vídeo de Apresentação (Intro)</h3>
                        {trailerReviewStatus === 'trailer_pending_review' && (
                            <div className="mb-6 bg-amber-50 border-2 border-amber-300 rounded-md">
                                <div className="p-6">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Clock size={16} className="text-amber-600" />
                                        <span className="text-[10px] font-bold uppercase text-amber-700 tracking-widest">Trailer em Análise</span>
                                    </div>
                                    <p className="text-xs text-amber-800">
                                        Seu novo trailer foi enviado e está aguardando aprovação da moderação. 
                                        O trailer atual continua visível para os alunos durante a análise.
                                    </p>
                                </div>
                                {pendingTrailerPlaybackId && (
                                    <div className="border-t border-amber-300">
                                        <div className="p-6">
                                            <p className="text-[9px] font-bold uppercase text-amber-700 tracking-widest mb-2">Preview do Trailer Pendente:</p>
                                            <div className="aspect-video bg-slate-900 overflow-hidden border border-amber-300">
                                                <SecureMuxPlayer 
                                                    cursoId={params.id as string} 
                                                    playbackId={pendingTrailerPlaybackId} 
                                                    className="w-full h-full"
                                                    isPublic={false}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}
                                <div className="border-t border-amber-300 p-4 flex justify-end">
                                    <button
                                        onClick={async () => {
                                            try {
                                                await deleteTrailerAction(params.id as string)
                                                setCourseIntroVideo('')
                                                setCourseIntroVideoMuxId('')
                                                setCourseIntroVideoAssetId('')
                                                setCourseIntroVideoPlaybackId('')
                                                setPendingTrailerPlaybackId('')
                                                setPendingTrailerAssetId('')
                                                setPendingTrailerUrl('')
                                                setTrailerReviewStatus('')
                                                toast.success("Trailer pendente removido")
                                            } catch (err: any) {
                                                toast.error("Erro ao remover trailer pendente")
                                            }
                                        }}
                                        className="flex items-center gap-2 px-5 py-3 bg-red-500 text-white text-[10px] font-bold uppercase tracking-[3px] rounded-md hover:bg-red-600 transition-all"
                                    >
                                        <Trash2 size={14} />
                                        Remover Trailer Pendente
                                    </button>
                                </div>
                            </div>
                        )}

                        {trailerReviewStatus !== 'trailer_pending_review' && (
                        <div className="bg-white p-6 rounded-md border border-[#1D5F31]/20 space-y-6">
                            <div className="space-y-4">
                                <label className="text-[9px] font-bold uppercase tracking-[3px] text-black/60 px-1">Upload do Trailer</label>
                                <div className={`
                                    relative aspect-video rounded-md border-2 border-dashed transition-all flex flex-col items-center justify-center overflow-hidden cursor-pointer
                                    ${(courseIntroVideo || courseIntroVideoPlaybackId) ? 'border-[#1D5F31] bg-slate-900' : 'border-[#1D5F31] bg-white hover:border-[#1D5F31]/30'}
                                `}>
                                    {isUploadingIntro ? (
                                        <div className="w-full h-full flex flex-col items-center justify-center p-4">
                                            <Loader2 className="animate-spin text-[#1D5F31] mb-2" size={32} />
                                            <div className="w-full max-w-[150px] h-1.5 bg-white/10 rounded-md overflow-hidden border border-white/20">
                                                <div
                                                    className="h-full bg-[#1D5F31] transition-all"
                                                    style={{ width: `${introUploadStatus === 'processing' ? 100 : introUploadProgress}%` }}
                                                />
                                            </div>
                                            <span className="text-[8px] font-black uppercase text-white tracking-[4px] mt-3 text-center">
                                                {introUploadStatus === 'uploading' ? `TRANSFERINDO ${introUploadProgress}%` : 'OTIMIZANDO VÍDEO PARA STREAMING...'}
                                            </span>
                                        </div>
                                    ) : (trailerReviewStatus === 'trailer_pending_review' && pendingTrailerPlaybackId) || courseIntroVideoPlaybackId || courseIntroVideoAssetId ? (
                                        <div className="w-full h-full group relative">
                                            {(trailerReviewStatus === 'trailer_pending_review' && pendingTrailerPlaybackId) ? (
                                                <SecureMuxPlayer 
                                                    cursoId={params.id as string} 
                                                    playbackId={pendingTrailerPlaybackId} 
                                                    className="w-full h-full"
                                                    isPublic={false}
                                                />
                                            ) : courseIntroVideoPlaybackId ? <>
                                                    <SecureMuxPlayer 
                                                        cursoId={params.id as string} 
                                                        playbackId={courseIntroVideoPlaybackId} 
                                                        className="w-full h-full"
                                                        isPublic={true}
                                                    />
                                                    
                                                    {/* Central Play Button Overlay - Now functional to PLAY */}
                                                    {!isPlayingIntro && (
                                                        <div 
                                                            onClick={(e) => {
                                                                e.stopPropagation()
                                                                setIsPlayingIntro(true)
                                                            }}
                                                            className="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/40 transition-all cursor-pointer z-10"
                                                        >
                                                            <div className="w-16 h-16 bg-white/10 backdrop-blur-xl rounded-full flex items-center justify-center border border-white/30 hover:scale-110 hover:bg-white/20 transition-all duration-500">
                                                                <Play size={32} className="text-white fill-white ml-1.5 opacity-80" />
                                                            </div>
                                                            <span className="absolute bottom-12 text-[10px] font-bold text-white uppercase tracking-[4px]">Clique para Assistir</span>
                                                        </div>
                                                    )}

                                                    <div className="absolute bottom-2 right-2 flex gap-2 z-20">
                                                        <button
                                                            onClick={() => setIsPlayingIntro(!isPlayingIntro)}
                                                            className="text-[8px] font-bold text-white uppercase tracking-[3px] px-3 py-2 bg-[#061629] hover:bg-[#061629]/90 rounded-md transition-colors flex items-center gap-1.5"
                                                        >
                                                            <Play size={12} className={isPlayingIntro ? 'fill-white' : ''} />
                                                            {isPlayingIntro ? 'PAUSAR' : 'ASSISTIR'}
                                                        </button>

                                                        <button
                                                            onClick={async (e) => {
                                                                e.stopPropagation()
                                                                try {
                                                                    await deleteTrailerAction(params.id as string)
                                                                    setCourseIntroVideo('')
                                                                    setCourseIntroVideoMuxId('')
                                                                    setCourseIntroVideoAssetId('')
                                                                    setCourseIntroVideoPlaybackId('')
                                                                    setPendingTrailerPlaybackId('')
                                                                    setPendingTrailerAssetId('')
                                                                    setPendingTrailerUrl('')
                                                                    setTrailerReviewStatus('')
                                                                    toast.success("Vídeo de abertura removido")
                                                                } catch (err: any) {
                                                                    toast.error("Erro ao remover")
                                                                }
                                                            }}
                                                            className="text-[8px] font-bold text-white uppercase tracking-[3px] px-3 py-2 bg-red-500 hover:bg-red-600 rounded-md transition-colors flex items-center gap-1.5"
                                                        >
                                                            <Trash2 size={12} />
                                                            REMOVER
                                                        </button>
                                                    </div>
                                                </> : null}
                                        </div>
                                    ) : courseIntroVideo ? (
                                        <div className="flex flex-col items-center gap-1">
                                            <CheckCircle2 size={16} className="text-[#1D5F31]" />
                                            <span className="text-[8px] font-black text-[#1D5F31] uppercase tracking-widest">URL ATIVA</span>
                                        </div>
                                    ) : (
                                        <div className="text-center group-hover:scale-110 transition-transform">
                                            <UploadCloud size={24} className="mx-auto text-slate-400 mb-2" />
                                            <span className="text-[8px] font-black text-slate-900 uppercase tracking-[2px]">Subir Vídeo Industrial</span>
                                        </div>
                                    )}
                                    {!isUploadingIntro && (
                                        <input
                                            ref={introFileInputRef}
                                            type="file"
                                            accept="video/*"
                                            className={(courseIntroVideoPlaybackId && trailerReviewStatus !== 'trailer_pending_review') ? "hidden" : "absolute inset-0 opacity-0 cursor-pointer"}
                                            onChange={async (e) => {
                                                const file = e.target.files?.[0]
                                                if (!file) return

                                                setIsUploadingIntro(true)
                                                setIntroUploadStatus('uploading')
                                                setIntroUploadProgress(0)
                                                // Limpa dados antigos ao começar novo upload
                                                setCourseIntroVideo('')
                                                setCourseIntroVideoPlaybackId('')

                                                try {
                                                    const response = await getMuxUploadUrl('intro', params.id as string)
                                                    if (response.error || !response.url) throw new Error(response.error)

                                                    const { url, id: uploadId } = response
                                                    setCourseIntroVideoMuxId(uploadId)

                                                    const xhr = new XMLHttpRequest()
                                                    xhr.open('PUT', url)
                                                    xhr.upload.onprogress = (evt) => {
                                                        if (evt.lengthComputable) {
                                                            const pct = (evt.loaded / evt.total) * 100
                                                            setIntroUploadProgress(Math.round(pct))
                                                        }
                                                    }
                                                    xhr.onload = async () => {
                                                        if (xhr.status >= 200 && xhr.status < 300) {
                                                            setIntroUploadStatus('processing')
                                                            toast.success("Upload concluído. Sincronizando infraestrutura...")

                                                            let attempts = 0
                                                            const check = async () => {
                                                                if (attempts > 40) {
                                                                    setIsUploadingIntro(false)
                                                                    return
                                                                }
                                                                const res = await getMuxUploadStatus(uploadId)
                                                                if (res.status === 'ready') {
                                                                    setCourseIntroVideoPlaybackId(res.playback_id || '')
                                                                    setCourseIntroVideoAssetId(res.asset_id || '')
                                                                    setIntroUploadStatus('ready')
                                                                    setIsUploadingIntro(false)
                                                                    toast.success("PlayBack ID Ativo!")

                                                                    if (course?.status === 'APROVADO') {
                                                                        const allLessons = modules.flatMap(m => m.lessons)
                                                                        let autoPrice = 0
                                                                        try {
                                                                            autoPrice = parseFloat(coursePrice.replace(',', '.'))
                                                                            if (isNaN(autoPrice)) autoPrice = 0
                                                                        } catch (e) { autoPrice = 0 }
                                                                        await updateCourseAction(params.id as string, {
                                                                            title: courseTitle,
                                                                            subtitle: courseSubtitle,
                                                                            description: courseDescription,
                                                                            category: courseCategory,
                                                                            price: autoPrice,
                                                                            pricing_type: coursePricingType,
                                                                            duration: courseDuration,
                                                                            image_url: courseImage,
                                                                            intro_video_url: '',
                                                                            intro_video_mux_id: uploadId,
                                                                            intro_video_asset_id: res.asset_id || '',
                                                                            intro_video_playback_id: res.playback_id || '',
                                                                            curriculum: courseCurriculum,
                                                                            lessons: allLessons,
                                                                            status: course?.status,
                                                                            tags: courseTags
                                                                        })
                                                                        setTrailerReviewStatus('trailer_pending_review')
                                                                        setPendingTrailerPlaybackId(res.playback_id || '')
                                                                        setPendingTrailerAssetId(res.asset_id || '')
                                                                        setPendingTrailerUrl('')
                                                                        toast.success('Trailer enviado para análise da moderação!')
                                                                    }
                                                                } else {
                                                                    attempts++
                                                                    setTimeout(check, 3000)
                                                                }
                                                            }
                                                            check()
                                                        } else {
                                                            setIsUploadingIntro(false)
                                                            toast.error("Erro na infra Mux")
                                                        }
                                                    }
                                                    xhr.onerror = () => {
                                                        setIsUploadingIntro(false)
                                                        toast.error("Erro de conexão")
                                                    }
                                                    xhr.send(file)
                                                } catch (err: any) {
                                                    setIsUploadingIntro(false)
                                                    toast.error(err.message)
                                                }
                                            }}
                                        />
                                    )}
                                </div>
                            </div>
                        </div>
                        )}
                    </section>

                    <section>
                        <h3 className="text-[10px] font-bold uppercase tracking-[5px] text-black/60 mb-6 px-1 ">Capa do Produto</h3>
                        <div className="bg-white p-3 rounded-md border border-[#1D5F31]/20">
                            <CourseImageUpload
                                currentImageUrl={courseImage}
                                onUploadComplete={setCourseImage}
                            />
                        </div>
                    </section>
                </aside>
            </div>
        </div>
    )
}
