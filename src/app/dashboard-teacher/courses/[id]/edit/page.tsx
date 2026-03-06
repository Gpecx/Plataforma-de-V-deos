"use client"

import { useState, useEffect, useRef } from 'react'
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
    UploadCloud,
    Save,
    ArrowLeft,
    CheckCircle2,
    Clock,
    Search,
    LayoutGrid,
    Check,
    Code, Paintbrush, Megaphone, Briefcase, DollarSign, HeartPulse, Zap, Database, BrainCircuit, ClipboardList, Scale, Languages,
    ChevronDown,
    RefreshCw
} from 'lucide-react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useDropzone } from 'react-dropzone'
import { db } from '@/lib/firebase'
import { useAuth } from '@/context/AuthProvider'
import { uploadCourseVideo, uploadCourseImage } from '@/lib/storage-utils'
import { updateCourseAction } from '../../actions'
import { Loader2 } from 'lucide-react'

const CATEGORIES = [
    { id: 'Desenvolvimento Web', label: 'Desenvolvimento Web', icon: Code },
    { id: 'Design', label: 'Design', icon: Paintbrush },
    { id: 'Marketing Digital', label: 'Marketing Digital', icon: Megaphone },
    { id: 'Negócios', label: 'Negócios', icon: Briefcase },
    { id: 'Finanças', label: 'Finanças', icon: DollarSign },
    { id: 'Saúde', label: 'Saúde', icon: HeartPulse },
    { id: 'Engenharia Elétrica', label: 'Engenharia Elétrica', icon: Zap },
    { id: 'Data Science', label: 'Data Science', icon: Database },
    { id: 'Inteligência Artificial', label: 'Inteligência Artificial', icon: BrainCircuit },
    { id: 'Gestão de Projetos', label: 'Gestão de Projetos', icon: ClipboardList },
    { id: 'Direito', label: 'Direito', icon: Scale },
    { id: 'Idiomas', label: 'Idiomas', icon: Languages },
    { id: 'Outros', label: 'Outros', icon: LayoutGrid }
]

interface Lesson {
    id: string
    title: string
    video_url: string
    position: number
}

// --- Sortable Lesson Row ---
function SortableLesson({ lesson, onDelete, onSelect, isSelected, onTitleChange }: {
    lesson: Lesson
    onDelete: () => void
    onSelect: () => void
    isSelected: boolean
    onTitleChange: (newTitle: string) => void
}) {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: lesson.id })

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    }

    return (
        <div
            ref={setNodeRef}
            style={style}
            onClick={onSelect}
            className={`group flex items-center justify-between p-4 cursor-pointer border rounded-2xl transition-all duration-200 mb-3 ${isSelected
                ? 'bg-white border-[#00C402] shadow-[0_8px_24px_-8px_rgba(0,196,2,0.2)] ring-4 ring-[#00C402]/5'
                : 'bg-white border-slate-100 hover:border-[#00C402]/30 hover:shadow-sm'
                }`}
        >
            <div className="flex items-center gap-4 flex-1 min-w-0">
                <button {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing text-slate-200 hover:text-slate-400 transition-colors p-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                    <GripVertical size={18} />
                </button>
                <div className={`p-2.5 rounded-xl shrink-0 transition-colors ${isSelected ? 'bg-[#00C402]/10 text-[#00C402]' : 'bg-slate-50 text-slate-300'}`}>
                    <Video size={16} />
                </div>
                <div className="flex-1 min-w-0">
                    <input
                        className="bg-transparent border-none focus:outline-none text-sm font-black tracking-tight w-full text-slate-800 placeholder:text-slate-200 truncate"
                        value={lesson.title}
                        placeholder="Título da Aula"
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => onTitleChange(e.target.value)}
                    />
                    <div className={`flex items-center gap-1.5 mt-0.5`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${lesson.video_url ? 'bg-[#00C402]' : 'bg-slate-300'}`} />
                        <span className={`text-[8px] font-black uppercase tracking-[1px] ${lesson.video_url ? 'text-[#00C402]' : 'text-slate-400'}`}>
                            {lesson.video_url ? 'Vídeo ativo' : 'Sem vídeo'}
                        </span>
                    </div>
                </div>
            </div>
            <button
                onClick={(e) => { e.stopPropagation(); onDelete() }}
                className="opacity-0 group-hover:opacity-100 p-2.5 text-slate-200 hover:text-red-500 transition-all hover:bg-red-50 rounded-xl ml-2 shrink-0"
            >
                <Trash2 size={16} />
            </button>
        </div>
    )
}

// --- Inline Video Dropzone ---
function VideoDropzone({ onUploadComplete }: { onUploadComplete: (url: string) => void }) {
    const [isUploading, setIsUploading] = useState(false)

    const onDrop = async (acceptedFiles: File[]) => {
        if (acceptedFiles.length === 0) return
        setIsUploading(true)
        try {
            const videoUrl = await uploadCourseVideo(acceptedFiles[0])
            onUploadComplete(videoUrl)
        } catch (error: any) {
            alert(error.message)
        } finally {
            setIsUploading(false)
        }
    }

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { 'video/*': [] },
        multiple: false
    })

    if (isUploading) {
        return (
            <div className="w-full aspect-video bg-slate-900 rounded-2xl flex flex-col items-center justify-center gap-4">
                <Loader2 className="animate-spin text-[#00C402]" size={36} />
                <div className="text-center">
                    <p className="text-[10px] font-black uppercase text-[#00C402] tracking-[4px]">Enviando vídeo...</p>
                    <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-1">Aguarde, isso pode levar alguns instantes</p>
                </div>
            </div>
        )
    }

    return (
        <div
            {...getRootProps()}
            className={`w-full aspect-video rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-4 cursor-pointer transition-all duration-300
                ${isDragActive ? 'border-[#00C402] bg-[#00C402]/5 shadow-xl' : 'border-slate-200 bg-slate-50 hover:border-[#00C402]/40 hover:bg-slate-100/50'}`}
        >
            <input {...getInputProps()} />
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all ${isDragActive ? 'bg-[#00C402] text-white' : 'bg-white text-slate-300 border border-slate-100'}`}>
                <UploadCloud size={28} strokeWidth={2} />
            </div>
            <div className="text-center">
                <p className="font-black uppercase tracking-tight text-base text-slate-700">
                    {isDragActive ? 'Solte aqui!' : 'Arraste o vídeo'}
                </p>
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-[3px] mt-1">ou clique para selecionar MP4</p>
            </div>
        </div>
    )
}

// --- Course Image Upload ---
function CourseImageUpload({ currentImageUrl, onUploadComplete }: { currentImageUrl?: string, onUploadComplete: (url: string) => void }) {
    const [isUploading, setIsUploading] = useState(false)

    const onDrop = async (acceptedFiles: File[]) => {
        if (acceptedFiles.length === 0) return
        setIsUploading(true)
        try {
            const imageUrl = await uploadCourseImage(acceptedFiles[0])
            onUploadComplete(imageUrl)
        } catch (error: any) {
            alert(error.message)
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
        <div className="space-y-3">
            <div
                {...getRootProps()}
                className={`relative group border-2 border-dashed rounded-2xl overflow-hidden transition-all duration-300 cursor-pointer h-40 flex flex-col items-center justify-center gap-3
                    ${isDragActive ? 'border-[#00C402] bg-[#00C402]/5' : 'border-slate-100 hover:border-slate-200 bg-slate-50/50'}`}
            >
                <input {...getInputProps()} />
                {currentImageUrl ? (
                    <>
                        <img src={currentImageUrl} alt="Capa" className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-40 transition-opacity" />
                        <div className="relative z-10 flex flex-col items-center gap-2 bg-white/90 backdrop-blur-sm px-4 py-2.5 rounded-xl shadow-md border border-white opacity-0 group-hover:opacity-100 transition-all">
                            <UploadCloud size={18} className="text-slate-900" />
                            <span className="text-[9px] font-black uppercase tracking-widest text-slate-900">Trocar Capa</span>
                        </div>
                    </>
                ) : (
                    <>
                        <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-slate-200 border border-slate-100">
                            <UploadCloud size={24} />
                        </div>
                        <span className="text-[9px] font-black uppercase tracking-[3px] text-slate-400">Carregar Arte</span>
                    </>
                )}
            </div>
            {isUploading && (
                <div className="flex items-center gap-2 text-[#00C402] px-2 animate-pulse">
                    <Loader2 className="animate-spin" size={14} />
                    <span className="text-[9px] font-black uppercase tracking-widest">Processando Imagem...</span>
                </div>
            )}
        </div>
    )
}

// --- Main Page ---
export default function CourseEditStudio() {
    const params = useParams()
    const router = useRouter()
    const { user, role, loading: authLoading } = useAuth()

    const [loading, setLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [showSuccess, setShowSuccess] = useState(false)
    const [course, setCourse] = useState<any>(null)
    const [lessons, setLessons] = useState<Lesson[]>([])

    // Centralized active lesson state
    const [activeLesson, setActiveLesson] = useState<Lesson | null>(null)
    // Whether to show the swap dropzone for the active lesson
    const [showSwapZone, setShowSwapZone] = useState(false)

    const [courseTitle, setCourseTitle] = useState('')
    const [courseSubtitle, setCourseSubtitle] = useState('')
    const [courseDescription, setCourseDescription] = useState('')
    const [courseCategory, setCourseCategory] = useState('')
    const [coursePrice, setCoursePrice] = useState('0.00')
    const [courseImage, setCourseImage] = useState('')

    const [isCategoryOpen, setIsCategoryOpen] = useState(false)
    const [categorySearch, setCategorySearch] = useState('')

    const videoRef = useRef<HTMLVideoElement>(null)

    // Helper: select lesson and reset swap zone
    const selectLesson = (lesson: Lesson) => {
        setActiveLesson(lesson)
        setShowSwapZone(false)
    }

    // Helper: update a lesson in state and keep activeLesson in sync
    const updateLesson = (id: string, patch: Partial<Lesson>) => {
        setLessons(prev => prev.map(l => l.id === id ? { ...l, ...patch } : l))
        setActiveLesson(prev => prev?.id === id ? { ...prev, ...patch } : prev)
    }

    useEffect(() => {
        if (!authLoading && !user) { router.push('/'); return }
        if (!authLoading && user && role !== 'teacher' && role !== 'admin') { router.push('/dashboard-student'); return }

        async function fetchCourseData() {
            if (!user) return
            setLoading(true)
            const courseId = params.id as string
            try {
                const { doc, getDoc, collection, query, where, getDocs, orderBy } = await import('firebase/firestore')
                const courseSnap = await getDoc(doc(db, 'courses', courseId))
                if (!courseSnap.exists()) { setLoading(false); return }
                const cData = { id: courseSnap.id, ...courseSnap.data() as any }

                const lessonsSnap = await getDocs(
                    query(collection(db, 'lessons'), where('course_id', '==', courseId), orderBy('position', 'asc'))
                )
                const lData: Lesson[] = lessonsSnap.docs.map(d => ({ id: d.id, ...d.data() as any }))

                setCourse(cData)
                setCourseTitle(cData.title || '')
                setCourseSubtitle(cData.subtitle || '')
                setCourseDescription(cData.description || '')
                setCourseCategory(cData.category || '')
                setCoursePrice((cData.price ?? 0).toString().replace('.', ','))
                setCourseImage(cData.image_url || '')
                setLessons(lData)
                if (lData.length > 0) setActiveLesson(lData[0])
            } catch (e) {
                console.error(e)
            } finally {
                setLoading(false)
            }
        }

        if (user && (role === 'teacher' || role === 'admin')) fetchCourseData()
    }, [params.id, user, authLoading, role, router])

    // Reload video element when url changes
    useEffect(() => {
        if (videoRef.current && activeLesson?.video_url) {
            videoRef.current.load()
        }
    }, [activeLesson?.video_url])

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    )

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event
        if (over && active.id !== over.id) {
            setLessons(prev => {
                const oldIndex = prev.findIndex(l => l.id === active.id)
                const newIndex = prev.findIndex(l => l.id === over.id)
                return arrayMove(prev, oldIndex, newIndex)
            })
        }
    }

    const handleAddLesson = () => {
        const newLesson: Lesson = { id: `new-${Date.now()}`, title: 'Nova Aula', video_url: '', position: lessons.length + 1 }
        setLessons(prev => [...prev, newLesson])
        selectLesson(newLesson)
    }

    const handleDeleteLesson = (id: string) => {
        setLessons(prev => {
            const next = prev.filter(l => l.id !== id)
            if (activeLesson?.id === id) {
                setActiveLesson(next.length > 0 ? next[0] : null)
            }
            return next
        })
    }

    const handleSave = async () => {
        setIsSaving(true)
        let price = 0
        try { price = parseFloat(coursePrice.replace(',', '.')); if (isNaN(price)) price = 0 } catch { price = 0 }
        try {
            const result = await updateCourseAction(params.id as string, {
                title: courseTitle,
                subtitle: courseSubtitle,
                description: courseDescription,
                category: courseCategory,
                price,
                image_url: courseImage,
                lessons,
                status: course?.status
            })
            if (result.success) {
                setShowSuccess(true)
                setTimeout(() => setShowSuccess(false), 3000)
            } else {
                alert("Erro ao salvar: " + result.error)
            }
        } catch (e: any) {
            alert("Falha na comunicação: " + e.message)
        } finally {
            setIsSaving(false)
        }
    }

    if (authLoading || loading) {
        return (
            <div className="h-screen bg-[#F4F7F9] flex items-center justify-center">
                <Loader2 className="animate-spin text-slate-800" size={48} />
            </div>
        )
    }

    if (!user || (role !== 'teacher' && role !== 'admin')) return null

    return (
        <div className="min-h-screen bg-[#F5F7FA] font-exo">
            {/* Top Header */}
            <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-100 px-8 py-4 flex items-center justify-between gap-6 shadow-sm">
                <div className="flex items-center gap-5 min-w-0">
                    <Link href="/dashboard-teacher" className="p-3 bg-slate-50 rounded-xl border border-slate-100 hover:border-[#00C402]/30 transition-all text-slate-400 hover:text-slate-900 shrink-0">
                        <ArrowLeft size={20} />
                    </Link>
                    <div className="min-w-0">
                        <span className="text-[9px] font-black uppercase tracking-[5px] text-[#00C402] block">Studio de Edição</span>
                        <input
                            className="bg-transparent border-none focus:outline-none text-xl font-black tracking-tight uppercase w-full text-slate-800 placeholder:text-slate-300 truncate"
                            placeholder="TÍTULO DO CURSO"
                            value={courseTitle}
                            onChange={e => setCourseTitle(e.target.value)}
                        />
                    </div>
                </div>

                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className={`flex items-center gap-3 font-black uppercase text-[10px] tracking-[4px] px-7 py-3.5 rounded-xl transition-all shadow-lg shrink-0 disabled:opacity-50 ${showSuccess ? 'bg-[#00C402] text-white' : 'bg-slate-900 text-white hover:bg-slate-700'}`}
                >
                    {isSaving ? <Loader2 className="animate-spin" size={16} /> : showSuccess ? <CheckCircle2 size={16} strokeWidth={3} /> : <Save size={16} strokeWidth={3} />}
                    {isSaving ? 'Salvando...' : showSuccess ? 'Salvo!' : 'Salvar'}
                </button>
            </header>

            <div className="flex h-[calc(100vh-73px)]">

                {/* ============ LEFT: List of Lessons ============ */}
                <aside className="w-[320px] xl:w-[360px] shrink-0 border-r border-slate-100 bg-white flex flex-col">
                    <div className="px-6 pt-6 pb-4 border-b border-slate-100">
                        <div className="flex items-center justify-between mb-1">
                            <h2 className="text-[10px] font-black uppercase tracking-[4px] text-slate-500">Aulas do Curso</h2>
                            <span className="text-[9px] font-bold text-slate-400">{lessons.length} aula{lessons.length !== 1 ? 's' : ''}</span>
                        </div>
                    </div>

                    {/* Scrollable lesson list */}
                    <div className="flex-1 overflow-y-auto px-4 py-4 space-y-0">
                        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                            <SortableContext items={lessons.map(l => l.id)} strategy={verticalListSortingStrategy}>
                                {lessons.map(lesson => (
                                    <SortableLesson
                                        key={lesson.id}
                                        lesson={lesson}
                                        isSelected={activeLesson?.id === lesson.id}
                                        onSelect={() => selectLesson(lesson)}
                                        onDelete={() => handleDeleteLesson(lesson.id)}
                                        onTitleChange={newTitle => updateLesson(lesson.id, { title: newTitle })}
                                    />
                                ))}
                            </SortableContext>
                        </DndContext>

                        {lessons.length === 0 && (
                            <div className="py-12 border-2 border-dashed border-slate-100 rounded-2xl flex flex-col items-center justify-center text-slate-300">
                                <Video size={36} className="mb-3 opacity-30" />
                                <p className="text-[9px] font-black uppercase tracking-[3px]">Sem aulas ainda</p>
                            </div>
                        )}
                    </div>

                    <div className="p-4 border-t border-slate-100">
                        <button
                            onClick={handleAddLesson}
                            className="w-full flex items-center justify-center gap-2 py-3 bg-slate-900 text-white rounded-xl text-[9px] font-black uppercase tracking-[2px] hover:bg-slate-700 transition-all"
                        >
                            <Plus size={14} />
                            Adicionar Aula
                        </button>
                    </div>
                </aside>

                {/* ============ CENTER: Video Player (sticky) ============ */}
                <div className="flex-1 min-w-0 flex flex-col overflow-hidden bg-slate-900">
                    {/* Video area */}
                    <div className="flex-1 flex items-center justify-center p-6 overflow-hidden">
                        {activeLesson ? (
                            activeLesson.video_url && !showSwapZone ? (
                                <video
                                    ref={videoRef}
                                    key={activeLesson.id}
                                    controls
                                    className="w-full h-full max-h-[calc(100vh-220px)] rounded-2xl object-contain shadow-2xl"
                                >
                                    <source src={activeLesson.video_url} />
                                </video>
                            ) : (
                                <div className="w-full max-w-2xl">
                                    <VideoDropzone onUploadComplete={url => {
                                        updateLesson(activeLesson.id, { video_url: url })
                                        setShowSwapZone(false)
                                    }} />
                                </div>
                            )
                        ) : (
                            <div className="flex flex-col items-center justify-center gap-4 text-slate-600">
                                <Video size={52} className="opacity-20" />
                                <p className="text-[10px] font-black uppercase tracking-[3px] text-slate-500">Selecione uma aula à esquerda</p>
                            </div>
                        )}
                    </div>

                    {/* Video bottom bar */}
                    {activeLesson && (
                        <div className="shrink-0 bg-slate-800 border-t border-slate-700 px-6 py-3 flex items-center justify-between gap-6">
                            <div className="flex items-center gap-3 min-w-0">
                                <div className={`w-2 h-2 rounded-full shrink-0 ${activeLesson.video_url ? 'bg-[#00C402]' : 'bg-slate-500'}`} />
                                <span className="text-[10px] font-black uppercase tracking-[3px] text-slate-300 truncate">
                                    {activeLesson.title}
                                </span>
                            </div>
                            {activeLesson.video_url && (
                                <button
                                    onClick={() => setShowSwapZone(v => !v)}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-[2px] border transition-all shrink-0 ${showSwapZone
                                        ? 'bg-[#00C402]/10 border-[#00C402]/30 text-[#00C402]'
                                        : 'bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600'
                                        }`}
                                >
                                    <RefreshCw size={13} />
                                    {showSwapZone ? 'Cancelar' : 'Trocar Vídeo'}
                                </button>
                            )}
                        </div>
                    )}
                </div>

                {/* ============ RIGHT: Edit Panel ============ */}
                <aside className="w-[320px] xl:w-[360px] shrink-0 border-l border-slate-100 bg-white flex flex-col overflow-y-auto">
                    {activeLesson ? (
                        <div className="p-6 space-y-6">
                            {/* Editing label */}
                            <div className="flex items-center gap-2 px-4 py-3 bg-[#00C402]/5 border border-[#00C402]/15 rounded-2xl">
                                <div className="w-2 h-2 rounded-full bg-[#00C402] shrink-0" />
                                <div className="min-w-0">
                                    <span className="text-[8px] font-black uppercase tracking-[3px] text-[#00C402] block">Editando</span>
                                    <span className="text-[11px] font-black text-slate-700 truncate block">{activeLesson.title}</span>
                                </div>
                            </div>

                            {/* Lesson title */}
                            <div className="space-y-2">
                                <label className="text-[9px] font-black uppercase tracking-[2px] text-slate-400 px-1">Título da Aula</label>
                                <input
                                    className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 focus:outline-none focus:border-[#00C402] text-sm font-black tracking-tight text-slate-800 transition-all"
                                    value={activeLesson.title}
                                    onChange={e => updateLesson(activeLesson.id, { title: e.target.value })}
                                />
                            </div>

                            {/* Remove video button */}
                            {activeLesson.video_url && (
                                <button
                                    onClick={() => {
                                        if (confirm("Remover o vídeo desta aula?")) {
                                            updateLesson(activeLesson.id, { video_url: '' })
                                            setShowSwapZone(false)
                                        }
                                    }}
                                    className="w-full flex items-center justify-center gap-2 py-3 bg-red-50 hover:bg-red-100 text-red-500 rounded-xl text-[9px] font-black uppercase tracking-[2px] border border-red-100 hover:border-red-200 transition-all"
                                >
                                    <Trash2 size={14} />
                                    Remover Vídeo desta Aula
                                </button>
                            )}

                            <div className="h-px bg-slate-100" />

                            {/* Course cover */}
                            <div className="space-y-2">
                                <label className="text-[9px] font-black uppercase tracking-[4px] text-slate-400 px-1">Capa do Curso</label>
                                <CourseImageUpload currentImageUrl={courseImage} onUploadComplete={setCourseImage} />
                            </div>

                            <div className="h-px bg-slate-100" />

                            {/* Course settings */}
                            <div className="space-y-5">
                                <h3 className="text-[9px] font-black uppercase tracking-[4px] text-slate-400">Configurações do Curso</h3>

                                {/* Category */}
                                <div className="space-y-2 relative z-50">
                                    <label className="text-[9px] font-black uppercase tracking-[2px] text-slate-400 px-1">Categoria</label>
                                    <div className="relative">
                                        <button
                                            type="button"
                                            onClick={() => setIsCategoryOpen(!isCategoryOpen)}
                                            className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 h-12 focus:border-[#00C402] hover:border-slate-200 focus:outline-none text-sm font-semibold transition-all flex items-center justify-between text-slate-900"
                                        >
                                            {courseCategory ? (
                                                <div className="flex items-center gap-2">
                                                    {(() => { const C = CATEGORIES.find(c => c.id === courseCategory)?.icon || LayoutGrid; return <C size={16} className="text-[#00C402]" /> })()}
                                                    <span className="text-sm">{CATEGORIES.find(c => c.id === courseCategory)?.label || courseCategory}</span>
                                                </div>
                                            ) : (
                                                <span className="text-slate-400 text-sm">Escolha o nicho...</span>
                                            )}
                                            <ChevronDown size={18} className={`text-slate-400 transition-transform ${isCategoryOpen ? 'rotate-180' : ''}`} />
                                        </button>

                                        {isCategoryOpen && (
                                            <>
                                                <div className="fixed inset-0 z-40" onClick={() => setIsCategoryOpen(false)} />
                                                <div className="absolute top-[calc(100%+6px)] left-0 w-full bg-white border border-slate-100 rounded-2xl shadow-xl z-50 overflow-hidden flex flex-col max-h-[280px]">
                                                    <div className="p-2.5 border-b border-slate-100 sticky top-0 bg-white">
                                                        <div className="relative">
                                                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                                            <input
                                                                type="text"
                                                                placeholder="Buscar..."
                                                                className="w-full bg-slate-50 h-9 pl-8 rounded-xl text-sm outline-none"
                                                                value={categorySearch}
                                                                onChange={e => setCategorySearch(e.target.value)}
                                                                autoFocus
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="overflow-y-auto py-1">
                                                        {CATEGORIES.filter(c => c.label.toLowerCase().includes(categorySearch.toLowerCase())).map(cat => {
                                                            const Icon = cat.icon
                                                            const isSelected = courseCategory === cat.id
                                                            return (
                                                                <button
                                                                    key={cat.id}
                                                                    type="button"
                                                                    className={`w-full flex items-center gap-3 px-4 py-2.5 hover:bg-green-50 transition-all text-sm font-medium text-left border-l-4 ${isSelected ? 'bg-green-50/50 border-[#00C402] text-slate-900' : 'border-transparent text-slate-600'}`}
                                                                    onClick={() => { setCourseCategory(cat.id); setIsCategoryOpen(false); setCategorySearch('') }}
                                                                >
                                                                    <Icon size={16} className={isSelected ? 'text-[#00C402]' : 'text-slate-400'} />
                                                                    {cat.label}
                                                                    {isSelected && <Check size={14} className="ml-auto text-[#00C402]" />}
                                                                </button>
                                                            )
                                                        })}
                                                    </div>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>

                                {/* Subtitle */}
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black uppercase tracking-[2px] text-slate-400 px-1">Subtítulo</label>
                                    <input
                                        placeholder="Frase de transformação"
                                        className="w-full bg-slate-50 border border-slate-100 hover:border-slate-200 focus:border-[#00C402] h-12 rounded-xl px-4 text-sm font-semibold outline-none transition-all text-slate-900 placeholder:text-slate-400"
                                        value={courseSubtitle}
                                        onChange={e => setCourseSubtitle(e.target.value)}
                                    />
                                </div>

                                {/* Description */}
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black uppercase tracking-[2px] text-slate-400 px-1">Descrição</label>
                                    <textarea
                                        className="w-full bg-slate-50 border border-slate-100 hover:border-slate-200 rounded-xl p-4 min-h-[120px] focus:border-[#00C402] focus:outline-none text-sm font-semibold transition-all text-slate-900 placeholder:text-slate-400 resize-none"
                                        placeholder="Descreva os benefícios..."
                                        value={courseDescription}
                                        onChange={e => setCourseDescription(e.target.value)}
                                    />
                                </div>

                                {/* Price */}
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black uppercase tracking-[2px] text-slate-400 px-1">Preço (R$)</label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-black text-lg">R$</span>
                                        <input
                                            type="text"
                                            value={coursePrice}
                                            onChange={e => setCoursePrice(e.target.value)}
                                            className="w-full bg-slate-50 border border-slate-100 hover:border-slate-200 rounded-xl px-12 py-3.5 focus:border-[#00C402] focus:outline-none font-black text-2xl text-slate-900 transition-all"
                                        />
                                    </div>
                                </div>

                                {/* Lifetime badge */}
                                <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-xl">
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 bg-white rounded-lg flex items-center justify-center text-[#00C402] border border-slate-100">
                                            <Clock size={18} />
                                        </div>
                                        <span className="text-[10px] font-black uppercase tracking-[2px] text-slate-500">Entrega Vitalícia</span>
                                    </div>
                                    <div className="w-9 h-5 bg-[#00C402] rounded-full flex items-center px-1">
                                        <div className="w-3 h-3 bg-white rounded-full ml-auto shadow-sm" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center gap-4 text-slate-300 p-8 text-center">
                            <FileText size={40} className="opacity-30" />
                            <p className="text-[10px] font-black uppercase tracking-[3px]">Selecione uma aula para editar</p>
                        </div>
                    )}
                </aside>
            </div>
        </div>
    )
}
