"use client"

import { useState } from 'react'
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
    UploadCloud,
    Save,
    ArrowLeft,
    CheckCircle2,
    Clock
} from 'lucide-react'
import Link from 'next/link'
import { useDropzone } from 'react-dropzone'

// --- Types ---
interface Lesson {
    id: string
    title: string
    duration: string
}

interface Module {
    id: string
    title: string
    lessons: Lesson[]
}

// --- Sortable Item Component (Lesson) ---
function SortableLesson({ lesson, onDelete }: { lesson: Lesson, onDelete: () => void }) {
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
            className="group flex items-center justify-between p-4 bg-black/20 border border-white/5 rounded-xl hover:border-[#00C402]/30 transition-all mb-2"
        >
            <div className="flex items-center gap-4">
                <button {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing text-gray-600 hover:text-white transition">
                    <GripVertical size={18} />
                </button>
                <div className="p-2 bg-white/5 rounded-lg">
                    <Video size={16} className="text-[#00C402]" />
                </div>
                <div>
                    <h4 className="text-sm font-bold uppercase italic tracking-tighter">{lesson.title}</h4>
                    <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{lesson.duration}</span>
                </div>
            </div>
            <button onClick={onDelete} className="opacity-0 group-hover:opacity-100 p-2 text-gray-600 hover:text-red-500 transition">
                <Trash2 size={16} />
            </button>
        </div>
    )
}

// --- Sortable Module Component ---
function SortableModule({ module, onAddLesson, onDeleteLesson, onReorderLessons }: {
    module: Module,
    onAddLesson: () => void,
    onDeleteLesson: (lessonId: string) => void,
    onReorderLessons: (event: DragEndEvent) => void
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
            className="mb-8 bg-white/5 border border-white/10 rounded-3xl overflow-hidden backdrop-blur-md"
        >
            <div className="p-6 flex items-center justify-between bg-white/5 border-b border-white/5">
                <div className="flex items-center gap-4">
                    <button {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing text-gray-600 hover:text-white transition">
                        <GripVertical size={20} />
                    </button>
                    <h3 className="text-lg font-black uppercase italic tracking-tighter">{module.title}</h3>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={onAddLesson}
                        className="flex items-center gap-2 px-4 py-2 bg-[#00C402]/10 text-[#00C402] border border-[#00C402]/20 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#00C402] hover:text-black transition-all"
                    >
                        <Plus size={14} />
                        Nova Aula
                    </button>
                    <button className="p-2 text-gray-500 hover:text-red-500 transition">
                        <Trash2 size={18} />
                    </button>
                </div>
            </div>

            <div className="p-6">
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
                                onDelete={() => onDeleteLesson(lesson.id)}
                            />
                        ))}
                    </SortableContext>
                </DndContext>

                {module.lessons.length === 0 && (
                    <div className="py-12 border-2 border-dashed border-white/5 rounded-2xl flex flex-col items-center justify-center text-gray-600 italic text-sm">
                        <Video size={32} className="mb-2 opacity-20" />
                        Nenhuma aula neste módulo ainda.
                    </div>
                )}
            </div>
        </div>
    )
}

// --- Video Upload Component ---
function VideoUpload() {
    const [progress, setProgress] = useState(0)
    const [isUploading, setIsUploading] = useState(false)

    const onDrop = (acceptedFiles: File[]) => {
        setIsUploading(true)
        // Simulando upload progress
        let currentProgress = 0
        const interval = setInterval(() => {
            currentProgress += 5
            setProgress(currentProgress)
            if (currentProgress >= 100) {
                clearInterval(interval)
                setIsUploading(false)
            }
        }, 100)
    }

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { 'video/*': [] },
        multiple: false
    })

    return (
        <div className="space-y-4">
            <div
                {...getRootProps()}
                className={`
                    border-2 border-dashed rounded-3xl p-12 transition-all cursor-pointer flex flex-col items-center justify-center gap-4
                    ${isDragActive ? 'border-[#00C402] bg-[#00C402]/5' : 'border-white/10 hover:border-[#00C402]/30 bg-white/5'}
                `}
            >
                <input {...getInputProps()} />
                <div className="w-16 h-16 bg-[#00C402]/10 rounded-2xl flex items-center justify-center text-[#00C402]">
                    <UploadCloud size={32} />
                </div>
                <div className="text-center">
                    <p className="font-black uppercase italic tracking-tighter text-lg">Arraste seu vídeo aqui</p>
                    <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-1">Ou clique para selecionar um arquivo (MP4, MOV, MKV)</p>
                </div>
            </div>

            {isUploading && (
                <div className="bg-white/5 border border-white/10 p-6 rounded-2xl">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-black uppercase text-[#00C402] tracking-[3px]">Carregando Arquivo...</span>
                        <span className="text-xs font-black text-white">{progress}%</span>
                    </div>
                    <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-[#00C402] transition-all duration-300 shadow-[0_0_15px_rgba(0,196,2,0.5)]"
                            style={{ width: `${progress}%` }}
                        ></div>
                    </div>
                </div>
            )}
        </div>
    )
}

// --- Main Builder Component ---
export default function CourseBuilder() {
    const [isPublished, setIsPublished] = useState(false)
    const [modules, setModules] = useState<Module[]>([
        {
            id: 'm1',
            title: '01. Introdução à Engenharia EXS',
            lessons: [
                { id: 'l1', title: 'Boas-vindas ao Treinamento', duration: '05:20' },
                { id: 'l2', title: 'Nossa Mentalidade de Excelência', duration: '12:45' },
            ]
        },
        {
            id: 'm2',
            title: '02. Ferramentas e Configurações',
            lessons: []
        }
    ])

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    )

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event
        if (over && active.id !== over.id) {
            setModules((items) => {
                const oldIndex = items.findIndex((i) => i.id === active.id)
                const newIndex = items.findIndex((i) => i.id === over.id)
                return arrayMove(items, oldIndex, newIndex)
            })
        }
    }

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

    return (
        <div className="p-8 md:p-12 min-h-screen bg-[#061629] text-white font-exo">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
                <div className="flex items-center gap-6">
                    <Link href="/dashboard-teacher" className="p-3 bg-white/5 rounded-2xl border border-white/10 hover:border-[#00C402]/30 transition-all text-gray-400 hover:text-white">
                        <ArrowLeft size={24} />
                    </Link>
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <span className="text-[10px] font-black uppercase tracking-[5px] text-[#00C402] italic">Course Builder</span>
                            <div className="h-1 w-1 rounded-full bg-white/20"></div>
                            <span className="text-[10px] font-black uppercase tracking-[5px] text-gray-500 italic">ID: EXS-982</span>
                        </div>
                        <h1 className="text-3xl font-black italic tracking-tighter uppercase whitespace-nowrap">Engenharia de Software EXS</h1>
                    </div>
                </div>

                <div className="flex items-center gap-4 bg-white/5 p-2 rounded-2xl border border-white/10 backdrop-blur-md shrink-0">
                    <div className="flex items-center gap-3 px-4">
                        <span className={`text-[10px] font-black uppercase tracking-widest ${isPublished ? 'text-[#00C402]' : 'text-yellow-500'}`}>
                            {isPublished ? 'Publicado' : 'Rascunho'}
                        </span>
                        <button
                            onClick={() => setIsPublished(!isPublished)}
                            className={`w-12 h-6 rounded-full relative transition-all duration-300 ${isPublished ? 'bg-[#00C402]' : 'bg-gray-700'}`}
                        >
                            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-300 ${isPublished ? 'left-7' : 'left-1'}`}></div>
                        </button>
                    </div>
                    <button className="flex items-center gap-2 bg-[#00C402] text-black font-black uppercase italic tracking-widest px-6 py-3 rounded-xl hover:brightness-110 transition shadow-lg">
                        <Save size={18} strokeWidth={3} />
                        Salvar Alterações
                    </button>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                {/* Lado Esquerdo: Estrutura (D&D) */}
                <div className="lg:col-span-2">
                    <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/5">
                        <h2 className="text-xl font-black uppercase italic tracking-tighter flex items-center gap-2">
                            <FileText size={20} className="text-[#00C402]" />
                            Estrutura do Treinamento
                        </h2>
                        <button
                            onClick={() => setModules([...modules, { id: Date.now().toString(), title: `Novo Módulo ${modules.length + 1}`, lessons: [] }])}
                            className="text-[10px] font-black uppercase tracking-[3px] text-[#00C402] hover:underline"
                        >
                            + Adicionar Módulo
                        </button>
                    </div>

                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                    >
                        <SortableContext
                            items={modules.map(m => m.id)}
                            strategy={verticalListSortingStrategy}
                        >
                            {modules.map((module) => (
                                <SortableModule
                                    key={module.id}
                                    module={module}
                                    onAddLesson={() => {
                                        const newLesson = { id: Date.now().toString(), title: 'Nova Aula de Teste', duration: '00:00' }
                                        setModules(prev => prev.map(m => m.id === module.id ? { ...m, lessons: [...m.lessons, newLesson] } : m))
                                    }}
                                    onDeleteLesson={(lessonId) => {
                                        setModules(prev => prev.map(m => m.id === module.id ? { ...m, lessons: m.lessons.filter(l => l.id !== lessonId) } : m))
                                    }}
                                    onReorderLessons={(e) => handleLessonReorder(module.id, e)}
                                />
                            ))}
                        </SortableContext>
                    </DndContext>
                </div>

                {/* Lado Direito: Upload e Configs Rápidas */}
                <aside className="space-y-12">
                    <section>
                        <h3 className="text-sm font-black uppercase tracking-[5px] text-[#00C402] mb-6 italic">Upload de Conteúdo</h3>
                        <VideoUpload />
                        <div className="mt-4 p-4 bg-[#00C402]/5 border border-[#00C402]/10 rounded-2xl flex items-start gap-3">
                            <CheckCircle2 size={18} className="text-[#00C402] shrink-0 mt-0.5" />
                            <p className="text-[10px] text-gray-400 font-bold leading-relaxed uppercase tracking-wider">
                                O processamento é automático. Seus alunos terão acesso à melhor qualidade via streaming Mux.
                            </p>
                        </div>
                    </section>

                    <section className="bg-white/5 p-8 rounded-3xl border border-white/10 backdrop-blur-xl">
                        <h3 className="text-sm font-black uppercase tracking-[5px] text-white mb-6 italic">Configurações Rápidas</h3>
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Preço do Treinamento</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-black italic">R$</span>
                                    <input
                                        type="text"
                                        defaultValue="297,00"
                                        className="w-full bg-black/20 border border-white/10 rounded-xl px-12 py-3 focus:border-[#00C402] outline-none font-black italic text-lg"
                                    />
                                </div>
                            </div>
                            <div className="flex items-center justify-between p-4 bg-black/20 rounded-xl border border-white/5">
                                <div className="flex items-center gap-3">
                                    <Clock size={16} className="text-blue-400" />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Acesso Vitalício</span>
                                </div>
                                <div className="w-10 h-5 bg-[#00C402] rounded-full flex items-center px-1">
                                    <div className="w-3 h-3 bg-white rounded-full ml-auto"></div>
                                </div>
                            </div>
                        </div>
                    </section>
                </aside>
            </div>
        </div>
    )
}
