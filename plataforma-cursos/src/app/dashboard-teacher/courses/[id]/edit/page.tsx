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
            className={`group flex items-center justify-between p-5 cursor-pointer border rounded-[24px] transition-all duration-300 mb-4 ${isSelected ? 'bg-white border-[#00C402] shadow-[0_20px_40px_-12px_rgba(0,196,2,0.15)] ring-4 ring-[#00C402]/5' : 'bg-white border-slate-100 hover:border-[#00C402]/30 hover:shadow-md'
                }`}
        >
            <div className="flex items-center gap-6">
                <button {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing text-slate-200 hover:text-slate-400 transition-colors p-1" onClick={(e) => e.stopPropagation()}>
                    <GripVertical size={20} />
                </button>
                <div className={`p-3 rounded-2xl transition-colors ${isSelected ? 'bg-[#00C402]/10 text-[#00C402]' : 'bg-slate-50 text-slate-300'}`}>
                    <Video size={18} />
                </div>
                <div>
                    <input
                        className="bg-transparent border-none focus:outline-none text-base font-black tracking-tight w-full text-slate-800 placeholder:text-slate-200 mb-1"
                        value={lesson.title}
                        placeholder="Título da Aula Digital"
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => onTitleChange(e.target.value)}
                    />
                    <div className="flex items-center gap-2">
                        <div className={`w-1.5 h-1.5 rounded-full ${lesson.video_url ? 'bg-[#00C402]' : 'bg-slate-200'}`}></div>
                        <span className="text-[9px] text-slate-500 font-black uppercase tracking-[2px]">
                            {lesson.video_url ? 'PÍXEL DE VÍDEO ATIVO' : 'AGUARDANDO CONTEÚDO'}
                        </span>
                    </div>
                </div>
            </div>
            <button
                onClick={(e) => {
                    e.stopPropagation()
                    onDelete()
                }}
                className="opacity-0 group-hover:opacity-100 p-3 text-slate-200 hover:text-red-500 transition-all hover:bg-red-50 rounded-xl"
            >
                <Trash2 size={18} />
            </button>
        </div>
    )
}

// --- Sortable Module Component ---
function SortableModule({ module, onAddLesson, onDeleteLesson, onReorderLessons, onSelectLesson, selectedLessonId, onLessonTitleChange }: {
    module: Module,
    onAddLesson: () => void,
    onDeleteLesson: (lessonId: string) => void,
    onReorderLessons: (event: DragEndEvent) => void,
    onSelectLesson: (lesson: Lesson) => void,
    selectedLessonId?: string,
    onLessonTitleChange: (lessonId: string, newTitle: string) => void
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
            className="mb-10 bg-white border border-slate-100 rounded-[40px] overflow-hidden shadow-sm"
        >
            <div className="p-8 flex items-center justify-between bg-white border-b border-slate-50">
                <div className="flex items-center gap-6">
                    <button {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing text-slate-200 hover:text-slate-400 transition-colors p-1">
                        <GripVertical size={24} />
                    </button>
                    <div>
                        <input
                            className="bg-transparent border-none focus:outline-none text-xl font-black uppercase tracking-tighter w-full text-slate-800"
                            value={module.title}
                            onChange={() => { }} // TODO: Implementar edição de título do módulo se necessário
                        />
                        <p className="text-[9px] font-bold uppercase tracking-[3px] text-slate-500 mt-1">ESTRUTURA DE MÓDULO</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={onAddLesson}
                        className="flex items-center gap-3 px-6 py-3 bg-slate-900 text-white rounded-2xl text-[9px] font-black uppercase tracking-[3px] hover:bg-slate-800 transition-all shadow-lg shadow-slate-200"
                    >
                        <Plus size={16} />
                        Adicionar Aula
                    </button>
                </div>
            </div>

            <div className="p-8 bg-slate-50/20">
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
                    <div className="py-16 border-2 border-dashed border-slate-100 rounded-[32px] flex flex-col items-center justify-center text-slate-300 bg-white">
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
                    border-2 border-dashed rounded-[32px] p-16 transition-all duration-500 cursor-pointer flex flex-col items-center justify-center gap-6
                    ${isDragActive ? 'border-[#00C402] bg-[#00C402]/5 shadow-xl ring-8 ring-[#00C402]/5' : 'border-slate-100 hover:border-[#00C402]/30 bg-slate-50/50'}
                `}
            >
                <input {...getInputProps()} />
                <div className={`w-20 h-20 rounded-[24px] flex items-center justify-center transition-all duration-500 ${isDragActive ? 'bg-[#00C402] text-white' : 'bg-slate-100 text-slate-300'}`}>
                    <UploadCloud size={32} strokeWidth={2.5} />
                </div>
                <div className="text-center">
                    <p className="font-black uppercase tracking-tight text-xl text-slate-800 leading-none">Arraste seu conteúdo</p>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[3px] mt-3">OU CLIQUE PARA SELECIONAR MP4</p>
                </div>
            </div>

            {isUploading && (
                <div className="bg-slate-900 border border-slate-800 p-8 rounded-[32px] flex items-center gap-6 shadow-2xl animate-pulse">
                    <Loader2 className="animate-spin text-[#00C402]" size={28} />
                    <div>
                        <span className="text-[10px] font-black uppercase text-[#00C402] tracking-[4px] block mb-1">Upload Estratégico em Curso</span>
                        <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Sincronizando com Servidores Firebase...</span>
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
                    relative group border-2 border-dashed rounded-[24px] overflow-hidden transition-all duration-500 cursor-pointer h-48 flex flex-col items-center justify-center gap-3
                    ${isDragActive ? 'border-[#00C402] bg-[#00C402]/5' : 'border-slate-50 hover:border-slate-100 bg-slate-50/30'}
                `}
            >
                <input {...getInputProps()} />
                {currentImageUrl ? (
                    <>
                        <img src={currentImageUrl} alt="Capa do Curso" className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-40 transition-opacity" />
                        <div className="relative z-10 flex flex-col items-center gap-3 bg-white/80 backdrop-blur-md px-6 py-3 rounded-2xl shadow-xl border border-white opacity-0 group-hover:opacity-100 transition-all">
                            <UploadCloud size={20} className="text-slate-900" />
                            <span className="text-[9px] font-black uppercase tracking-widest text-slate-900">Trocar Capa</span>
                        </div>
                    </>
                ) : (
                    <>
                        <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-slate-200 shadow-sm border border-slate-50">
                            <UploadCloud size={28} />
                        </div>
                        <span className="text-[9px] font-black uppercase tracking-[3px] text-slate-500">Carregar Arte</span>
                    </>
                )}
            </div>

            {isUploading && (
                <div className="flex items-center gap-3 text-[#00C402] px-2 animate-pulse">
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
                                title: 'ESTRUTURA DO TREINAMENTO',
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
            <div className="h-screen bg-[#F4F7F9] flex items-center justify-center font-exo">
                <Loader2 className="animate-spin text-slate-800" size={48} />
            </div>
        )
    }

    return (
        <div className="p-8 md:p-12 min-h-screen bg-[#F5F7FA] text-slate-900 font-exo border-t border-slate-100">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-16 gap-8 px-4">
                <div className="flex items-center gap-8">
                    <Link href="/dashboard-teacher" className="p-4 bg-white rounded-2xl border border-slate-100 hover:border-[#00C402]/30 transition-all text-slate-400 hover:text-slate-900 shadow-sm">
                        <ArrowLeft size={24} />
                    </Link>
                    <div className="flex-grow">
                        <div className="flex items-center gap-4 mb-2">
                            <span className="text-[10px] font-black uppercase tracking-[5px] text-[#00C402]">Builder Studio</span>
                            <div className="h-1 w-1 rounded-full bg-slate-200"></div>
                            <span className="text-[10px] font-black uppercase tracking-[5px] text-slate-500">ID: {params.id?.slice(0, 8)}</span>
                        </div>
                        <input
                            className="bg-transparent border-none focus:outline-none text-3xl font-black tracking-tighter uppercase w-full py-1 transition-all placeholder:text-slate-200 text-slate-800"
                            placeholder="TÍTULO DO CURSO"
                            value={courseTitle}
                            onChange={(e) => setCourseTitle(e.target.value)}
                        />
                    </div>
                </div>

                <div className="flex items-center gap-4 bg-white p-3 rounded-2xl border border-slate-100 shadow-sm shrink-0">
                    <button
                        onClick={() => router.push('/dashboard-teacher/courses')}
                        className="px-8 py-4 bg-white border border-slate-100 rounded-xl text-[10px] font-black uppercase tracking-[4px] text-slate-400 hover:text-slate-900 transition-all shadow-sm"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className={`flex items-center gap-3 font-black uppercase text-[10px] tracking-[4px] px-8 py-4 rounded-xl transition-all shadow-lg disabled:opacity-50 ${showSuccess ? 'bg-[#00C402] text-white' : 'bg-slate-900 text-white hover:bg-slate-800'}`}
                    >
                        {isSaving ? <Loader2 className="animate-spin" size={18} /> : (showSuccess ? <CheckCircle2 size={18} strokeWidth={3} /> : <Save size={18} strokeWidth={3} />)}
                        {isSaving ? 'Processando...' : (showSuccess ? 'Salvo com Sucesso' : 'Salvar Projeto')}
                    </button>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-16 px-4">
                {/* Lado Esquerdo: Estrutura (D&D) */}
                <div className="lg:col-span-2 space-y-12">
                    <div className="flex items-center justify-between pb-6 border-b border-slate-100">
                        <div>
                            <h2 className="text-xl font-black uppercase tracking-tighter flex items-center gap-3 text-slate-800 leading-none">
                                <FileText size={20} className="text-[#00C402]" />
                                Arquitetura do Treinamento
                            </h2>
                            <p className="text-[10px] font-bold uppercase tracking-[2px] text-slate-500 mt-2">Organize o fluxo de entrega de valor.</p>
                        </div>
                        <button
                            onClick={() => setModules([...modules, { id: Date.now().toString(), title: `MÓDULO DE APRENDIZADO ${modules.length + 1}`, lessons: [] }])}
                            className="text-[10px] font-black uppercase tracking-[4px] text-[#00C402] hover:bg-[#00C402]/5 px-6 py-3 rounded-xl border border-[#00C402]/10 transition-all"
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
                                        const newLesson: Lesson = { id: `new-${Date.now()}`, title: 'Nova Aula Digital', video_url: '', position: module.lessons.length + 1 }
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
                                />
                            ))}
                        </SortableContext>
                    </DndContext>

                    {/* Novo Studio de Multimídia (Coluna Principal) */}
                    <div className="pt-12 border-t border-slate-100">
                        <div className="mb-8">
                            <h3 className="text-[10px] font-black uppercase tracking-[5px] text-[#00C402] mb-1 italic">Studio de Multimídia</h3>
                            <p className="text-[9px] font-bold uppercase tracking-[2px] text-slate-400">Gerenciamento dinâmico de vídeo aulas</p>
                        </div>

                        {selectedLesson ? (
                            <div className="space-y-8 bg-white p-10 rounded-[48px] border border-slate-100 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-slate-50">
                                    <div className="space-y-2 flex-grow">
                                        <span className="text-[9px] font-black uppercase text-slate-400 tracking-[3px]">Título da Aula Digital</span>
                                        <input
                                            className="bg-transparent border-none focus:outline-none text-2xl font-black uppercase tracking-tight text-slate-800 w-full"
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
                                            <div className="aspect-video w-full bg-slate-900 rounded-[32px] overflow-hidden shadow-2xl border border-slate-800 group relative">
                                                <video
                                                    src={selectedLesson.video_url}
                                                    controls
                                                    className="w-full h-full object-contain"
                                                />
                                                <div className="absolute top-4 right-4 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/20 text-[10px] font-black uppercase text-white tracking-widest flex items-center gap-2">
                                                        <span className="w-2 h-2 rounded-full bg-[#00C402] animate-pulse"></span>
                                                        Conteúdo Ativo
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex flex-col md:flex-row gap-6 items-center">
                                                <div className="flex-1 p-6 bg-[#00C402]/5 rounded-[24px] border border-[#00C402]/10 w-full">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 bg-[#00C402] rounded-xl flex items-center justify-center text-white shadow-lg shadow-[#00C402]/20">
                                                            <CheckCircle2 size={20} />
                                                        </div>
                                                        <div>
                                                            <span className="text-[10px] font-black uppercase text-[#00C402] tracking-[2px] block mb-1">Upload Processado com Sucesso</span>
                                                            <p className="text-[11px] text-slate-500 font-medium truncate max-w-[400px]">{selectedLesson.video_url}</p>
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
                                                    className="w-full md:w-auto flex items-center justify-center gap-3 px-8 py-5 bg-red-50 text-red-500 rounded-[28px] text-xs font-black uppercase tracking-[3px] hover:bg-red-100 transition-all border border-red-100 disabled:opacity-50 group shadow-sm hover:shadow-md"
                                                >
                                                    {isDeletingVideo ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} className="group-hover:scale-110 transition-transform" />}
                                                    {isDeletingVideo ? 'Processando Exclusão...' : 'Substituir Conteúdo'}
                                                </button>
                                            </div>

                                            <div className="p-6 bg-slate-900 border border-slate-800 rounded-[24px] shadow-xl">
                                                <p className="text-[9px] font-black uppercase tracking-[4px] text-white italic mb-2">Dica de Especialista</p>
                                                <p className="text-[10px] text-slate-400 leading-relaxed font-medium">Use vídeos curtos e objetivos para manter a retenção máxima de seus alunos.</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="p-20 bg-white border border-slate-100 rounded-[64px] flex flex-col items-center justify-center text-center shadow-sm relative overflow-hidden group border-dashed">
                                <div className="absolute inset-0 bg-slate-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                                <div className="w-24 h-24 bg-slate-50 rounded-[32px] flex items-center justify-center text-slate-200 mb-8 border border-slate-100 relative z-10 group-hover:scale-110 transition-transform duration-500">
                                    <Video size={48} />
                                </div>
                                <p className="text-[11px] text-slate-500 font-black uppercase tracking-[4px] leading-relaxed max-w-[280px] mx-auto relative z-10">
                                    Selecione uma aula na arquitetura para gerenciar seu conteúdo digital.
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Lado Direito: Configurações e Capa */}
                <aside className="space-y-16">
                    <section className="bg-white p-10 rounded-[48px] border border-slate-100 shadow-sm relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-[#00C402]/5 blur-3xl -mr-16 -mt-16 group-hover:bg-[#00C402]/10 transition-all duration-1000"></div>
                        <h3 className="text-[10px] font-black uppercase tracking-[5px] text-[#00C402] mb-10 italic relative z-10">Configurações Base</h3>
                        <div className="space-y-8 relative z-10">
                            <div className="space-y-4">
                                <label className="text-[9px] font-black uppercase tracking-[3px] text-slate-400 px-1">Subtítulo Estratégico</label>
                                <input
                                    type="text"
                                    value={courseSubtitle}
                                    onChange={(e) => setCourseSubtitle(e.target.value)}
                                    placeholder="Frase curta de impacto"
                                    className="w-full bg-slate-50 border border-slate-100 rounded-[20px] px-6 py-4 focus:border-[#00C402] outline-none text-sm text-slate-800 transition-all shadow-sm"
                                />
                            </div>

                            <div className="space-y-4">
                                <label className="text-[9px] font-black uppercase tracking-[3px] text-slate-400 px-1">Descrição Completa</label>
                                <textarea
                                    value={courseDescription}
                                    onChange={(e) => setCourseDescription(e.target.value)}
                                    placeholder="O que o aluno vai aprender?"
                                    className="w-full bg-slate-50 border border-slate-100 rounded-[20px] px-6 py-4 focus:border-[#00C402] outline-none text-sm text-slate-800 transition-all shadow-sm min-h-[120px]"
                                />
                            </div>

                            <div className="space-y-4">
                                <label className="text-[9px] font-black uppercase tracking-[3px] text-slate-400 px-1">Categoria</label>
                                <select
                                    value={courseCategory}
                                    onChange={(e) => setCourseCategory(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-100 rounded-[20px] px-6 py-4 focus:border-[#00C402] outline-none text-sm text-slate-800 transition-all shadow-sm appearance-none"
                                >
                                    <option value="" disabled>Escolha o nicho...</option>
                                    {CATEGORIES.map((cat: string) => <option key={cat} value={cat}>{cat}</option>)}
                                </select>
                            </div>

                            <div className="space-y-4">
                                <label className="text-[9px] font-black uppercase tracking-[3px] text-slate-400 px-1">Carga Horária (h)</label>
                                <input
                                    type="number"
                                    value={courseDuration}
                                    onChange={(e) => setCourseDuration(Number(e.target.value))}
                                    className="w-full bg-slate-50 border border-slate-100 rounded-[24px] px-6 py-4 focus:border-[#00C402] outline-none font-black text-xl text-slate-800 transition-all shadow-sm"
                                />
                            </div>

                            <div className="space-y-4">
                                <label className="text-[9px] font-black uppercase tracking-[3px] text-slate-400 px-1">Valor do Investimento</label>
                                <div className="relative group">
                                    <span className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 font-black text-2xl group-focus-within:text-[#00C402] transition-colors">R$</span>
                                    <input
                                        type="text"
                                        value={coursePrice}
                                        onChange={(e) => setCoursePrice(e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-100 rounded-[24px] px-16 py-6 focus:border-[#00C402] outline-none font-black text-3xl text-slate-800 transition-all shadow-sm"
                                    />
                                </div>
                            </div>
                        </div>
                    </section>

                    <section>
                        <h3 className="text-[10px] font-black uppercase tracking-[5px] text-slate-500 mb-6 px-1">Capa do Produto</h3>
                        <div className="bg-white p-3 rounded-[32px] border border-slate-100 shadow-sm">
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
