"use client"

import { useState, useEffect } from 'react'
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
    Check
} from 'lucide-react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useDropzone } from 'react-dropzone'
import { auth, db } from '@/lib/firebase'
import { doc, getDoc, collection, query, where, orderBy, getDocs } from 'firebase/firestore'
import { uploadCourseImage, uploadCourseVideo } from "@/lib/storage-helpers"
import { updateCourseAction, deleteVideoAction } from "../../actions"
import { onAuthStateChanged, User } from 'firebase/auth'

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

// --- Main Builder Component ---
interface Lesson {
    id: string
    title: string
    video_url: string
    position: number
    description?: string
}

interface Module {
    id: string
    title: string
    lessons: Lesson[]
}

// --- Sortable Item Component (Lesson) ---
function SortableLesson({ lesson, onDelete, onSelect, isSelected, onTitleChange }: {
    lesson: Lesson,
    onDelete: () => void,
    onSelect: () => void,
    isSelected: boolean,
    onTitleChange: (newTitle: string) => void
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
            className={`group flex items-center justify-between p-4 cursor-pointer border-2 rounded-xl transition-all duration-300 mb-3 ${isSelected ? 'bg-white border-[#1D5F31] ring-2 ring-[#1D5F31]/10' : 'bg-white border-[#1D5F31] hover:border-[#1D5F31]/50'
                }`}
        >
            <div className="flex items-center gap-6">
                <button {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing text-slate-500 hover:text-[#1D5F31] transition-colors p-1" onClick={(e) => e.stopPropagation()}>
                    <GripVertical size={20} />
                </button>
                <div className={`p-3 rounded-xl transition-colors ${isSelected ? 'bg-[#1D5F31]/10 text-[#1D5F31]' : 'bg-white text-slate-500'}`}>
                    <Video size={18} />
                </div>
                <div>
                    <input
                        className="bg-transparent border-none focus:outline-none text-base font-black tracking-tight w-full text-black placeholder:text-black/40 mb-1"
                        value={lesson.title}
                        placeholder="Título da Aula Digital"
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => onTitleChange(e.target.value)}
                    />
                    <div className="flex items-center gap-2">
                        <div className={`w-1.5 h-1.5 rounded-xl ${lesson.video_url ? 'bg-[#1D5F31]' : 'bg-slate-700'}`}></div>
                        <span className="text-[9px] text-black/60 font-black uppercase tracking-[2px]">
                            {lesson.video_url ? 'VÍDEO ATIVO' : 'AGUARDANDO CONTEÚDO'}
                        </span>
                    </div>
                </div>
            </div>
            <button
                onClick={(e) => {
                    e.stopPropagation()
                    onDelete()
                }}
                className="opacity-0 group-hover:opacity-100 p-3 text-slate-400 hover:text-red-500 transition-all hover:bg-red-500/10 rounded-xl"
            >
                <Trash2 size={18} />
            </button>
        </div>
    )
}

// --- Sortable Module Component ---
function SortableModule({ module, onAddLesson, onDeleteLesson, onReorderLessons, onSelectLesson, selectedLessonId, onLessonTitleChange, onDeleteModule, canDeleteModule }: {
    module: Module,
    onAddLesson: () => void,
    onDeleteLesson: (lessonId: string) => void,
    onReorderLessons: (event: DragEndEvent) => void,
    onSelectLesson: (lesson: Lesson) => void,
    selectedLessonId?: string,
    onLessonTitleChange: (lessonId: string, newTitle: string) => void,
    onDeleteModule: () => void,
    canDeleteModule: boolean
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
            className="mb-8 bg-white border border-[#1D5F31]/20 rounded-xl overflow-hidden"
        >
            <div className="p-6 flex items-center justify-between bg-white border-b-2 border-[#1D5F31]">
                <div className="flex items-center gap-6">
                    <button {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing text-slate-500 hover:text-[#1D5F31] transition-colors p-1">
                        <GripVertical size={24} />
                    </button>
                    <div>
                        <input
                            className="bg-transparent border-none focus:outline-none text-xl font-black uppercase tracking-tighter w-full text-black"
                            value={module.title}
                            onChange={() => { }} // TODO: Implementar edição de título do módulo se necessário
                        />
                        <p className="text-[9px] font-bold uppercase tracking-[3px] text-[#1D5F31] mt-1">ESTRUTURA DE MÓDULO</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {canDeleteModule && (
                        <button
                            onClick={onDeleteModule}
                            className="flex items-center gap-2 px-4 py-3 text-slate-400 hover:text-red-500 hover:bg-red-500/10 rounded-xl text-[9px] font-black uppercase tracking-[3px] transition-all border border-transparent hover:border-red-500/30"
                        >
                            <Trash2 size={16} />
                            Excluir Módulo
                        </button>
                    )}
                    <button
                        onClick={onAddLesson}
                        className="flex items-center gap-3 px-6 py-3 bg-[#1D5F31] text-white rounded-xl text-[9px] font-black uppercase tracking-[3px] hover:bg-[#1D5F31]/90 transition-all border-none"
                    >
                        <Plus size={16} />
                        Adicionar Aula
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
                            />
                        ))}
                    </SortableContext>
                </DndContext>

                {module.lessons.length === 0 && (
                    <div className="py-16 border-2 border-dashed border-[#1D5F31]/30/30/30 rounded-xl flex flex-col items-center justify-center text-slate-500 bg-white/50">
                        <Video size={48} className="mb-4 opacity-20" />
                        <p className="text-[10px] font-black uppercase tracking-[3px]">Crie sua primeira entrega</p>
                        <p className="text-[9px] mt-2 font-medium italic">ESTE MÓDULO ESTÁ EM BRANCO</p>
                    </div>
                )}
            </div>
        </div>
    )
}

// --- Video Upload Component ---
function VideoUpload({ onUploadComplete }: { onUploadComplete: (url: string) => void }) {
    const [isUploading, setIsUploading] = useState(false)

    const onDrop = async (acceptedFiles: File[]) => {
        if (acceptedFiles.length === 0) return
        setIsUploading(true)
        try {
            const videoUrl = await uploadCourseVideo(acceptedFiles[0])
            onUploadComplete(videoUrl)
            alert("Upload concluído com sucesso!")
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

    return (
        <div className="space-y-6">
            <div
                {...getRootProps()}
                className={`
                    border-2 border-dashed rounded-xl p-12 transition-all duration-500 cursor-pointer flex flex-col items-center justify-center gap-4
                    ${isDragActive ? 'border-[#1D5F31] bg-[#1D5F31]/5 ring-8 ring-[#1D5F31]/5' : 'border-[#1D5F31] hover:border-[#1D5F31]/30 bg-white'}
                `}
            >
                <input {...getInputProps()} />
                <div className={`w-16 h-16 rounded-xl flex items-center justify-center transition-all duration-500 ${isDragActive ? 'bg-[#1D5F31] text-black' : 'bg-white text-slate-500 border border-[#1D5F31]'}`}>
                    <UploadCloud size={28} strokeWidth={2.5} />
                </div>
                <div className="text-center">
                    <p className="font-black uppercase tracking-tight text-lg text-black leading-none">Arraste seu conteúdo</p>
                    <p className="text-[9px] text-black/60 font-bold uppercase tracking-[3px] mt-2">OU CLIQUE PARA SELECIONAR MP4</p>
                </div>
            </div>

            {isUploading && (
                <div className="bg-white border border-[#1D5F31]/20 p-6 rounded-xl flex items-center gap-6 animate-pulse">
                    <Loader2 className="animate-spin text-[#1D5F31]" size={28} />
                    <div>
                        <span className="text-[10px] font-black uppercase text-[#1D5F31] tracking-[4px] block mb-1">Upload Estratégico em Curso</span>
                        <span className="text-[9px] text-black/60 font-bold uppercase tracking-widest">Sincronizando com Servidores Firebase...</span>
                    </div>
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
        <div className="space-y-4">
            <div
                {...getRootProps()}
                className={`
                    relative group border-2 border-dashed rounded-xl overflow-hidden transition-all duration-500 cursor-pointer h-40 flex flex-col items-center justify-center gap-2
                    ${isDragActive ? 'border-[#1D5F31] bg-[#1D5F31]/5' : 'border-[#1D5F31] hover:border-[#1D5F31]/30 bg-white'}
                `}
            >
                <input {...getInputProps()} />
                {currentImageUrl ? (
                    <>
                        <img src={currentImageUrl} alt="Capa do Curso" className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-40 transition-opacity" />
                        <div className="relative z-10 flex flex-col items-center gap-3 bg-white/80 backdrop-blur-md px-6 py-3 rounded-xl border border-[#1D5F31]/20 opacity-0 group-hover:opacity-100 transition-all">
                            <UploadCloud size={20} className="text-[#1D5F31]" />
                            <span className="text-[9px] font-black uppercase tracking-widest text-[#1D5F31]">Trocar Capa</span>
                        </div>
                    </>
                ) : (
                    <>
                        <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center text-slate-500 border border-[#1D5F31]/20">
                            <UploadCloud size={28} />
                        </div>
                        <span className="text-[9px] font-black uppercase tracking-[3px] text-black/60">Carregar Arte</span>
                    </>
                )}
            </div>

            {isUploading && (
                <div className="flex items-center gap-3 text-[#1D5F31] px-2 animate-pulse">
                    <Loader2 className="animate-spin" size={16} />
                    <span className="text-[9px] font-black uppercase tracking-widest">Processando Imagem...</span>
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
    const [courseCurriculum, setCourseCurriculum] = useState<string[]>([])
    const [isUploadingIntro, setIsUploadingIntro] = useState(false)

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
                        setCourse({ id: courseDoc.id, ...cData })
                        setCourseTitle(cData.title)
                        setCourseSubtitle(cData.subtitle || '')
                        setCourseDescription(cData.description || '')
                        setCourseCategory(cData.category || '')
                        setCourseDuration(cData.duration || 0)
                        setCoursePrice(cData.price.toString().replace('.', ','))
                        setCourseImage(cData.image_url || '')
                        setCourseIntroVideo(cData.intro_video_url || '')
                        setCourseCurriculum(cData.curriculum || [])

                        // Busca as aulas
                        const lessonsRef = collection(db, 'lessons')
                        const q = query(
                            lessonsRef,
                            where('course_id', '==', courseId),
                            orderBy('position', 'asc')
                        )
                        const lessonsSnapshot = await getDocs(q)
                        const lData = lessonsSnapshot.docs.map(doc => ({
                            id: doc.id,
                            ...doc.data()
                        }))

                        const modulesData = [
                            {
                                id: 'main-structure',
                                title: 'ESTRUTURA DO CURSO',
                                lessons: lData as Lesson[]
                            }
                        ]
                        setModules(modulesData)

                        // Seleciona a primeira aula por padrão se existir
                        if (lData.length > 0) {
                            setSelectedLesson(lData[0] as Lesson)
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

        // Parse price safely
        let formattedPrice = 0
        try {
            formattedPrice = parseFloat(coursePrice.replace(',', '.'))
            if (isNaN(formattedPrice)) formattedPrice = 0
        } catch (e) {
            formattedPrice = 0
        }

        try {
            const result = await updateCourseAction(params.id as string, {
                title: courseTitle,
                subtitle: courseSubtitle,
                description: courseDescription,
                category: courseCategory,
                price: formattedPrice,
                duration: courseDuration,
                image_url: courseImage,
                intro_video_url: courseIntroVideo,
                curriculum: courseCurriculum,
                lessons: allLessons,
                status: course?.status // Preserve status
            })

            if (result.success) {
                setShowSuccess(true)
                setTimeout(() => setShowSuccess(false), 3000)
            } else {
                console.error('Erro ao salvar:', result.error)
                alert("Erro ao salvar: " + result.error)
            }
        } catch (error: any) {
            console.error('Erro na comunicação:', error)
            alert("Falha na comunicação com o servidor: " + error.message)
        } finally {
            setIsSaving(false)
        }
    }

    if (loading) {
        return (
            <div className="h-screen bg-transparent flex items-center justify-center font-exo">
                <Loader2 className="animate-spin text-[#1D5F31]" size={48} />
            </div>
        )
    }

    return (
        <div className="px-4 pb-8 md:px-8 md:pb-12 pt-2 md:pt-4 min-h-screen bg-transparent text-black font-exo">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6 px-2">
                <div className="flex-grow">

                    <div className="flex items-center gap-3 mb-2">
                        <input
                            className="bg-transparent border-none focus:outline-none text-3xl font-black tracking-tighter uppercase w-full py-1 transition-all placeholder:text-black/40 text-black"
                            placeholder="TÍTULO DO CURSO"
                            value={courseTitle}
                            onChange={(e) => setCourseTitle(e.target.value)}
                        />
                        <div className={`px-4 py-2 rounded-xl border shrink-0 ${
                            course?.status === 'APROVADO' 
                                ? 'bg-[#1D5F31]/10 border-[#1D5F31]/30' 
                                : 'bg-amber-50 border-amber-300'
                        }`}>
                            <span className={`text-[10px] font-black uppercase tracking-widest ${
                                course?.status === 'APROVADO' ? 'text-[#1D5F31]' : 'text-amber-700'
                            }`}>
                                {course?.status === 'APROVADO' ? '✓ Aprovado' : '⏳ Pendente'}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-4 bg-white p-3 rounded-xl border border-[#1D5F31]/20 shrink-0">
                    <button
                        onClick={() => router.push('/dashboard-teacher/courses')}
                        className="px-8 py-4 bg-[#061629] border-none rounded-xl text-[10px] font-black uppercase tracking-[4px] text-white hover:bg-[#061629]/90 transition-all font-exo"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className={`flex items-center gap-3 font-black uppercase text-[10px] tracking-[4px] px-8 py-4 rounded-xl transition-all border-2 disabled:opacity-50 ${showSuccess ? 'bg-[#1D5F31] border-none text-white' : 'bg-[#1D5F31] border-none text-white hover:bg-[#1D5F31]/90'}`}
                    >
                        {isSaving ? <Loader2 className="animate-spin" size={18} /> : (showSuccess ? <CheckCircle2 size={18} strokeWidth={3} /> : <Save size={18} strokeWidth={3} />)}
                        {isSaving ? 'Processando...' : (showSuccess ? 'Salvo com Sucesso' : 'Salvar Projeto')}
                    </button>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 px-2">
                {/* Lado Esquerdo: Estrutura (D&D) */}
                <div className="lg:col-span-2 space-y-12">
                    <div className="flex items-center justify-between pb-6 border-b-2 border-[#1D5F31]">
                        <div>
                            <h2 className="text-xl font-black uppercase tracking-tighter flex items-center gap-3 text-black leading-none">
                                <FileText size={20} className="text-[#1D5F31]" />
                                Arquitetura do Treinamento
                            </h2>
                            <p className="text-[10px] font-bold uppercase tracking-[2px] text-[#1D5F31] mt-2">Organize o fluxo de entrega de valor.</p>
                        </div>
                        <button
                            onClick={() => setModules([...modules, { id: Date.now().toString(), title: `MÓDULO DE APRENDIZADO ${modules.length + 1}`, lessons: [] }])}
                            className="text-[10px] font-black uppercase tracking-[4px] text-white bg-[#061629] hover:bg-[#061629]/90 px-6 py-3 rounded-xl border-none transition-all"
                        >
                            + Novo Módulo
                        </button>
                    </div>

                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={(e) => {
                            // No momento só temos um módulo, mas o handleLessonReorder cuida das aulas.
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
                                    onAddLesson={() => {
                                        const newLesson: Lesson = { id: `new-${Date.now()}`, title: 'Nova Aula Digital', video_url: '', position: module.lessons.length + 1, description: '' }
                                        setModules(prev => prev.map(m => m.id === module.id ? { ...m, lessons: [...m.lessons, newLesson] } : m))
                                    }}
                                    onDeleteLesson={(lessonId) => {
                                        setModules(prev => prev.map(m => m.id === module.id ? { ...m, lessons: m.lessons.filter(l => l.id !== lessonId) } : m))
                                        if (selectedLesson?.id === lessonId) setSelectedLesson(null)
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
                                        if (!confirm('Tem certeza que deseja excluir este módulo? Todas as aulas dentro dele serão excluídas.')) return
                                        setModules(prev => prev.filter(m => m.id !== module.id))
                                        if (selectedLesson && module.lessons.some(l => l.id === selectedLesson.id)) {
                                            setSelectedLesson(null)
                                        }
                                    }}
                                    canDeleteModule={modules.length > 1}
                                />
                            ))}
                        </SortableContext>
                    </DndContext>

                    {/* Novo Studio de Multimídia (Coluna Principal) */}
                    <div className="pt-12 border-t-2 border-[#1D5F31]">
                        <div className="mb-8">
                            <h3 className="text-[10px] font-black uppercase tracking-[5px] text-[#1D5F31] mb-1 italic">Studio de Multimídia</h3>
                            <p className="text-[9px] font-bold uppercase tracking-[2px] text-black/60">Gerenciamento dinâmico de vídeo aulas</p>
                        </div>

                        {selectedLesson ? (
                            <div className="space-y-8 bg-white p-8 rounded-xl border border-[#1D5F31]/20 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b-2 border-[#1D5F31]">
                                    <div className="space-y-2 flex-grow">
                                        <span className="text-[9px] font-black uppercase text-[#1D5F31] tracking-[3px]">Título da Aula Digital</span>
                                        <input
                                            className="bg-transparent border-none focus:outline-none text-2xl font-black uppercase tracking-tight text-black w-full"
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
                                        <span className="text-[9px] font-black uppercase text-[#1D5F31] tracking-[3px]">Descrição da Aula</span>
                                        <textarea
                                            className="bg-transparent border-none focus:outline-none text-sm text-black/70 w-full mt-1 resize-none"
                                            placeholder="Descreva o que o aluno aprenderá nesta aula..."
                                            value={selectedLesson.description || ''}
                                            onChange={(e) => {
                                                const newDescription = e.target.value
                                                setSelectedLesson({ ...selectedLesson, description: newDescription })
                                                setModules(prev => prev.map(m => ({
                                                    ...m,
                                                    lessons: m.lessons.map(l => l.id === selectedLesson.id ? { ...l, description: newDescription } : l)
                                                })))
                                            }}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-10">
                                    {!selectedLesson.video_url ? (
                                        <div className="animate-in fade-in zoom-in duration-500">
                                            <VideoUpload onUploadComplete={(url) => {
                                                setSelectedLesson({ ...selectedLesson, video_url: url })
                                                setModules(prev => prev.map(m => ({
                                                    ...m,
                                                    lessons: m.lessons.map(l => l.id === selectedLesson.id ? { ...l, video_url: url } : l)
                                                })))
                                            }} />
                                        </div>
                                    ) : (
                                        <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-right-4 duration-500">
                                            <div className="aspect-video w-full bg-black rounded-xl overflow-hidden border border-[#1D5F31]/20 group relative">
                                                <video
                                                    src={selectedLesson.video_url}
                                                    controls
                                                    className="w-full h-full object-contain"
                                                />
                                                <div className="absolute top-4 right-4 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <div className="bg-white/80 backdrop-blur-md px-4 py-2 rounded-xl border border-[#1D5F31]/20 text-[10px] font-black uppercase text-[#1D5F31] tracking-widest flex items-center gap-2">
                                                        <span className="w-2 h-2 rounded-xl bg-[#1D5F31] animate-pulse"></span>
                                                        Conteúdo Ativo
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex flex-col md:flex-row gap-6 items-center">
                                                <div className="flex-1 p-6 bg-[#1D5F31]/10 rounded-xl border border-[#1D5F31]/20/20 w-full">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 bg-[#1D5F31] rounded-xl flex items-center justify-center text-white">
                                                            <CheckCircle2 size={20} />
                                                        </div>
                                                        <div>
                                                            <span className="text-[10px] font-black uppercase text-[#1D5F31] tracking-[2px] block mb-1">Upload Processado com Sucesso</span>
                                                            <p className="text-[11px] text-black/60 font-medium truncate max-w-[400px]">{selectedLesson.video_url}</p>
                                                        </div>
                                                    </div>
                                                </div>

                                                <button
                                                    onClick={async () => {
                                                        if (!confirm("Tem certeza que deseja apagar permanentemente este vídeo? Isso não pode ser desfeito.")) return

                                                        setIsDeletingVideo(true)
                                                        try {
                                                            const result = await deleteVideoAction(selectedLesson.id, 'lessons', selectedLesson.video_url)
                                                            if (result.success) {
                                                                setSelectedLesson({ ...selectedLesson, video_url: '' })
                                                                setModules(prev => prev.map(m => ({
                                                                    ...m,
                                                                    lessons: m.lessons.map(l => l.id === selectedLesson.id ? { ...l, video_url: '' } : l)
                                                                })))
                                                            } else {
                                                                alert(result.error)
                                                            }
                                                        } catch (error) {
                                                            alert("Houve um erro técnico ao tentar remover o vídeo.")
                                                        } finally {
                                                            setIsDeletingVideo(false)
                                                        }
                                                    }}
                                                    disabled={isDeletingVideo}
                                                    className="w-full md:w-auto flex items-center justify-center gap-3 px-8 py-5 bg-red-500/10 text-red-500 rounded-xl text-xs font-black uppercase tracking-[3px] hover:bg-red-500/20 transition-all border-2 border-red-500/20 disabled:opacity-50 group"
                                                >
                                                    {isDeletingVideo ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} className="group-hover:scale-110 transition-transform" />}
                                                    {isDeletingVideo ? 'Processando Exclusão...' : 'Substituir Conteúdo'}
                                                </button>
                                            </div>


                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="p-12 bg-white border border-[#1D5F31]/20 rounded-xl flex flex-col items-center justify-center text-center relative overflow-hidden group border-dashed">
                                <div className="absolute inset-0 bg-[#1D5F31]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                                <div className="w-24 h-24 bg-white rounded-xl flex items-center justify-center text-[#1D5F31] mb-8 border border-[#1D5F31]/20 relative z-10 group-hover:scale-105 transition-transform duration-500">
                                    <Video size={48} />
                                </div>
                                <p className="text-[11px] text-black/60 font-black uppercase tracking-[4px] leading-relaxed max-w-[280px] mx-auto relative z-10">
                                    Selecione uma aula na arquitetura para gerenciar seu conteúdo digital.
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Lado Direito: Configurações e Capa */}
                <aside className="space-y-12">
                    <section className="bg-white p-8 rounded-xl border border-[#1D5F31]/20 relative overflow-hidden group">
                        <h3 className="text-[10px] font-black uppercase tracking-[5px] text-[#1D5F31] mb-10 italic relative z-10">Configurações Base</h3>
                        <div className="space-y-8 relative z-10">
                            <div className="space-y-4">
                                <label className="text-[9px] font-black uppercase tracking-[3px] text-black/60 px-1">Subtítulo Estratégico</label>
                                <input
                                    type="text"
                                    value={courseSubtitle}
                                    onChange={(e) => setCourseSubtitle(e.target.value)}
                                    placeholder="Frase curta de impacto"
                                    className="w-full bg-white border border-[#1D5F31]/20 rounded-xl px-5 py-3 focus:border-[#1D5F31] outline-none text-sm text-black transition-all"
                                />
                            </div>

                            <div className="space-y-4">
                                <label className="text-[9px] font-black uppercase tracking-[3px] text-black/60 px-1">Descrição Completa</label>
                                <textarea
                                    value={courseDescription}
                                    onChange={(e) => setCourseDescription(e.target.value)}
                                    placeholder="O que o aluno vai aprender?"
                                    className="w-full bg-white border border-[#1D5F31]/20 rounded-xl px-6 py-4 focus:border-[#1D5F31] outline-none text-sm text-black transition-all min-h-[120px]"
                                />
                            </div>

                            <div className="space-y-4">
                                <label className="text-[9px] font-black uppercase tracking-[3px] text-black/60 px-1">Categoria</label>
                                <select
                                    value={courseCategory}
                                    onChange={(e) => setCourseCategory(e.target.value)}
                                    className="w-full bg-white border border-[#1D5F31]/20 rounded-xl px-5 py-3 focus:border-[#1D5F31] outline-none text-sm text-black transition-all appearance-none"
                                >
                                    <option value="" disabled>Escolha o nicho...</option>
                                    {CATEGORIES.map((cat: string) => <option key={cat} value={cat}>{cat}</option>)}
                                </select>
                            </div>

                            <div className="space-y-4">
                                <label className="text-[9px] font-black uppercase tracking-[3px] text-black/60 px-1">Carga Horária (h)</label>
                                <input
                                    type="number"
                                    value={courseDuration}
                                    onChange={(e) => setCourseDuration(Number(e.target.value))}
                                    className="w-full bg-white border border-[#1D5F31]/20 rounded-xl px-6 py-4 focus:border-[#1D5F31] outline-none font-black text-xl text-black transition-all"
                                />
                            </div>

                            <div className="space-y-4">
                                <label className="text-[9px] font-black uppercase tracking-[3px] text-black/60 px-1">Valor do Investimento</label>
                                <div className="relative group">
                                    <span className="absolute left-8 top-1/2 -translate-y-1/2 text-black font-black text-2xl group-focus-within:text-[#1D5F31] transition-colors">R$</span>
                                    <input
                                        type="text"
                                        value={coursePrice}
                                        onChange={(e) => setCoursePrice(e.target.value)}
                                        className="w-full bg-white border border-[#1D5F31]/20 rounded-xl pl-24 pr-8 py-5 focus:border-[#1D5F31] outline-none font-black text-2xl text-black transition-all"
                                    />
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="text-[9px] font-black uppercase tracking-[3px] text-black/60 px-1">Conteúdo Programático (Grade)</label>
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
                                                className="w-full bg-white border border-[#1D5F31]/20 rounded-none px-4 h-12 focus:border-[#28b828] outline-none text-sm text-black transition-all placeholder:text-black/40"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const newCurriculum = courseCurriculum.filter((_, i) => i !== idx);
                                                    setCourseCurriculum(newCurriculum);
                                                }}
                                                className="w-12 h-12 text-slate-400 hover:text-red-500 hover:bg-red-500/10 border-2 border-transparent hover:border-red-500/30 rounded-none transition-all flex items-center justify-center shrink-0"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    ))}
                                    <button
                                        type="button"
                                        onClick={() => setCourseCurriculum([...courseCurriculum, ''])}
                                        className="w-full flex justify-center items-center h-12 bg-[#1D5F31]/10 text-black font-black uppercase text-[9px] tracking-[3px] rounded-none border-2 border-dashed border-[#1D5F31]/30/30/30/50 hover:border-[#1D5F31] hover:bg-[#1D5F31]/20 transition-all text-center mt-2"
                                    >
                                        <Plus size={14} className="mr-2" />
                                        Adicionar Tópico
                                    </button>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section>
                        <h3 className="text-[10px] font-black uppercase tracking-[5px] text-black/60 mb-6 px-1 italic">Vídeo de Apresentação (Intro)</h3>
                        <div className="bg-white p-6 rounded-xl border border-[#1D5F31]/20 space-y-6">
                            <div className="space-y-4">
                                <label className="text-[9px] font-black uppercase tracking-[3px] text-black/60 px-1">Upload ou Link</label>
                                <div className={`
                                    relative h-32 rounded-xl border-2 border-dashed transition-all flex flex-col items-center justify-center overflow-hidden cursor-pointer
                                    ${courseIntroVideo && !courseIntroVideo.includes('youtube.com') && !courseIntroVideo.includes('vimeo.com')
                                        ? 'border-[#1D5F31] bg-[#1D5F31]/5' : 'border-[#1D5F31] bg-white hover:border-[#1D5F31]/30'}
                                `}>
                                    {isUploadingIntro ? (
                                        <Loader2 className="animate-spin text-[#1D5F31]" size={20} />
                                    ) : courseIntroVideo && !courseIntroVideo.includes('youtube.com') && !courseIntroVideo.includes('vimeo.com') ? (
                                        <div className="flex flex-col items-center gap-1">
                                            <Check size={16} className="text-[#1D5F31]" />
                                            <span className="text-[8px] font-black text-[#1D5F31]">VÍDEO CARREGADO</span>
                                        </div>
                                    ) : (
                                        <div className="text-center">
                                            <UploadCloud size={20} className="mx-auto text-slate-200 mb-2" />
                                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">SUBIR MP4</span>
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
                                                try {
                                                    const url = await uploadCourseVideo(file)
                                                    setCourseIntroVideo(url)
                                                } catch (err) { alert("Erro no upload.") }
                                                finally { setIsUploadingIntro(false) }
                                            }}
                                        />
                                    )}
                                </div>
                            </div>

                            <div className="space-y-4">
                                <label className="text-[9px] font-black uppercase tracking-[3px] text-black/60 px-1">Ou Link Externo</label>
                                <input
                                    type="text"
                                    value={courseIntroVideo}
                                    onChange={(e) => setCourseIntroVideo(e.target.value)}
                                    placeholder="Link YouTube/Vimeo"
                                    className="w-full bg-white border border-[#1D5F31]/20 rounded-xl px-4 py-3 focus:border-[#1D5F31] outline-none text-xs text-black transition-all"
                                />
                                <p className="text-[8px] text-[#1D5F31] font-black uppercase tracking-widest">Máximo 5 minutos recomendados para conversão.</p>
                            </div>
                        </div>
                    </section>

                    <section>
                        <h3 className="text-[10px] font-black uppercase tracking-[5px] text-black/60 mb-6 px-1 italic">Capa do Produto</h3>
                        <div className="bg-white p-3 rounded-xl border border-[#1D5F31]/20">
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
