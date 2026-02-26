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
    X
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const STEPS = [
    { id: 1, name: 'Informações Básicas', icon: Info },
    { id: 2, name: 'Mídia e Preço', icon: ImageIcon },
    { id: 3, name: 'Grade Curricular', icon: ListTree },
]

const CATEGORIES = [
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
    const [courseData, setCourseData] = useState({
        title: '',
        subtitle: '',
        category: '',
        description: '',
        price: '',
        thumbnail: null as File | null,
        sections: [
            { id: Date.now(), title: 'Módulo 1', lessons: [{ id: Date.now() + 1, title: 'Aula 1' }] }
        ]
    })

    const isStepValid = (step: number) => {
        if (step === 1) {
            return courseData.title && courseData.category && courseData.description
        }
        if (step === 2) {
            return courseData.price
        }
        if (step === 3) {
            return courseData.sections.length > 0 && courseData.sections.every(s => s.title && s.lessons.length > 0)
        }
        return false
    }

    const handleNext = () => {
        if (currentStep < 3) setCurrentStep(prev => prev + 1)
    }

    const handleBack = () => {
        if (currentStep > 1) setCurrentStep(prev => prev - 1)
    }

    const addSection = () => {
        setCourseData(prev => ({
            ...prev,
            sections: [...prev.sections, { id: Date.now(), title: `Módulo ${prev.sections.length + 1}`, lessons: [{ id: Date.now() + 1, title: 'Aula 1' }] }]
        }))
    }

    const removeSection = (id: number) => {
        setCourseData(prev => ({
            ...prev,
            sections: prev.sections.filter(s => s.id !== id)
        }))
    }

    const addLesson = (sectionId: number) => {
        setCourseData(prev => ({
            ...prev,
            sections: prev.sections.map(s =>
                s.id === sectionId
                    ? { ...s, lessons: [...s.lessons, { id: Date.now(), title: `Aula ${s.lessons.length + 1}` }] }
                    : s
            )
        }))
    }

    const removeLesson = (sectionId: number, lessonId: number) => {
        setCourseData(prev => ({
            ...prev,
            sections: prev.sections.map(s =>
                s.id === sectionId
                    ? { ...s, lessons: s.lessons.filter(l => l.id !== lessonId) }
                    : s
            )
        }))
    }

    const updateSectionTitle = (id: number, title: string) => {
        setCourseData(prev => ({
            ...prev,
            sections: prev.sections.map(s => s.id === id ? { ...s, title } : s)
        }))
    }

    const updateLessonTitle = (sectionId: number, lessonId: number, title: string) => {
        setCourseData(prev => ({
            ...prev,
            sections: prev.sections.map(s =>
                s.id === sectionId
                    ? { ...s, lessons: s.lessons.map(l => l.id === lessonId ? { ...l, title } : l) }
                    : s
            )
        }))
    }

    const isPublishable = isStepValid(1) && isStepValid(2) && isStepValid(3)

    return (
        <div className="min-h-screen bg-[#061629] text-white p-8 md:p-12">
            {/* Header com Botão Cancelar */}
            <div className="flex justify-between items-center mb-12">
                <div>
                    <h1 className="text-3xl font-black italic uppercase tracking-tighter">
                        Criar <span className="text-[#00FF00]">Novo Curso</span>
                    </h1>
                    <p className="text-gray-400 mt-1">Siga os passos abaixo para publicar seu conhecimento.</p>
                </div>
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-2 text-gray-400 hover:text-white transition group"
                >
                    <X size={20} className="group-hover:rotate-90 transition-transform" />
                    <span className="font-bold uppercase text-xs tracking-widest">Cancelar</span>
                </button>
            </div>

            {/* Stepper Superior */}
            <div className="max-w-4xl mx-auto mb-16 px-4">
                <div className="relative flex justify-between">
                    {/* Linha de progresso lateral */}
                    <div className="absolute top-1/2 left-0 w-full h-1 bg-white/5 -translate-y-1/2 -z-10" />
                    <div
                        className="absolute top-1/2 left-0 h-1 bg-[#00FF00] -translate-y-1/2 -z-10 transition-all duration-500 shadow-[0_0_15px_rgba(0,255,0,0.5)]"
                        style={{ width: `${((currentStep - 1) / (STEPS.length - 1)) * 100}%` }}
                    />

                    {STEPS.map((step) => {
                        const Icon = step.icon
                        const isActive = currentStep === step.id
                        const isCompleted = currentStep > step.id

                        return (
                            <div key={step.id} className="flex flex-col items-center">
                                <div
                                    className={`
                                        w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 border-2
                                        ${isActive ? 'bg-black border-[#00FF00] text-[#00FF00] scale-110 shadow-[0_0_20px_rgba(0,255,0,0.4)]' : ''}
                                        ${isCompleted ? 'bg-[#00FF00] border-[#00FF00] text-black' : ''}
                                        ${!isActive && !isCompleted ? 'bg-[#0a1f3a] border-white/10 text-gray-500' : ''}
                                    `}
                                >
                                    {isCompleted ? <Check size={24} strokeWidth={3} /> : <Icon size={24} />}
                                </div>
                                <span className={`mt-4 text-[10px] font-black uppercase tracking-widest ${isActive ? 'text-[#00FF00]' : 'text-gray-500'}`}>
                                    {step.name}
                                </span>
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* Conteúdo do Step */}
            <div className="max-w-4xl mx-auto bg-[#0a1f3a]/50 border border-white/5 rounded-3xl p-8 md:p-12 mb-12">

                {/* STEP 1: INFORMAÇÕES BÁSICAS */}
                {currentStep === 1 && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-2">
                                <Label className="text-xs font-black uppercase tracking-widest text-[#00FF00]">Título do Curso</Label>
                                <Input
                                    placeholder="Ex: Do Zero ao Mestre em React"
                                    className="bg-black/40 border-white/10 focus:border-[#00FF00] transition-all h-12"
                                    value={courseData.title}
                                    onChange={(e) => setCourseData({ ...courseData, title: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-black uppercase tracking-widest text-[#00FF00]">Categoria</Label>
                                <select
                                    className="w-full bg-black/40 border border-white/10 rounded-lg px-4 h-12 focus:border-[#00FF00] outline-none transition-all text-sm"
                                    value={courseData.category}
                                    onChange={(e) => setCourseData({ ...courseData, category: e.target.value })}
                                >
                                    <option value="" disabled>Selecione uma categoria</option>
                                    {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                </select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-xs font-black uppercase tracking-widest text-[#00FF00]">Subtítulo (Resumo Curto)</Label>
                            <Input
                                placeholder="Uma frase impactante sobre o seu curso"
                                className="bg-black/40 border-white/10 focus:border-[#00FF00] transition-all h-12"
                                value={courseData.subtitle}
                                onChange={(e) => setCourseData({ ...courseData, subtitle: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className="text-xs font-black uppercase tracking-widest text-[#00FF00]">Descrição Completa</Label>
                            <textarea
                                placeholder="Conte tudo o que o aluno vai aprender..."
                                className="w-full bg-black/40 border border-white/10 rounded-lg p-4 min-h-[200px] focus:border-[#00FF00] outline-none transition-all text-sm resize-none"
                                value={courseData.description}
                                onChange={(e) => setCourseData({ ...courseData, description: e.target.value })}
                            />
                        </div>
                    </div>
                )}

                {/* STEP 2: MÍDIA E PREÇO */}
                {currentStep === 2 && (
                    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="space-y-4">
                            <Label className="text-xs font-black uppercase tracking-widest text-[#00FF00]">Capa do Curso (Thumbnail)</Label>
                            <div className="border-2 border-dashed border-white/10 rounded-3xl p-12 flex flex-col items-center justify-center bg-black/20 hover:bg-black/40 hover:border-[#00FF00]/50 transition-all group cursor-pointer">
                                <div className="w-20 h-20 bg-white/5 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-[#00FF00]/10 transition-colors">
                                    <Upload size={32} className="text-gray-500 group-hover:text-[#00FF00] transition-colors" />
                                </div>
                                <h3 className="font-bold text-lg mb-2">Clique ou arraste sua imagem</h3>
                                <p className="text-gray-500 text-sm">Recomendado: 1280x720px (PNG ou JPG)</p>
                            </div>
                        </div>

                        <div className="max-w-xs space-y-2">
                            <Label className="text-xs font-black uppercase tracking-widest text-[#00FF00]">Preço de Venda</Label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#00FF00] font-black">R$</span>
                                <Input
                                    type="number"
                                    placeholder="0,00"
                                    className="bg-black/40 border-white/10 focus:border-[#00FF00] transition-all h-14 pl-12 text-xl font-bold"
                                    value={courseData.price}
                                    onChange={(e) => setCourseData({ ...courseData, price: e.target.value })}
                                />
                            </div>
                            <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold mt-2 italic">Dica: Preços entre R$ 197 e R$ 497 têm maior conversão.</p>
                        </div>
                    </div>
                )}

                {/* STEP 3: GRADE CURRICULAR */}
                {currentStep === 3 && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="flex justify-between items-center">
                            <Label className="text-xs font-black uppercase tracking-widest text-[#00FF00]">Estrutura do Curso</Label>
                            <Button
                                onClick={addSection}
                                className="bg-[#00FF00]/10 text-[#00FF00] border border-[#00FF00]/20 hover:bg-[#00FF00] hover:text-black font-bold uppercase text-[10px] tracking-widest px-4"
                            >
                                <Plus size={14} className="mr-2" /> Novo Módulo
                            </Button>
                        </div>

                        <div className="space-y-6">
                            {courseData.sections.map((section, sIdx) => (
                                <div key={section.id} className="bg-black/30 border border-white/5 rounded-2xl p-6 space-y-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-8 h-8 bg-white/5 rounded flex items-center justify-center font-black text-xs text-gray-500">
                                            {sIdx + 1}
                                        </div>
                                        <Input
                                            value={section.title}
                                            onChange={(e) => updateSectionTitle(section.id, e.target.value)}
                                            className="bg-transparent border-none text-lg font-bold p-0 focus-visible:ring-0"
                                            placeholder="Nome do Módulo"
                                        />
                                        <button
                                            onClick={() => removeSection(section.id)}
                                            className="text-gray-600 hover:text-red-500 transition ml-auto"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>

                                    <div className="pl-12 space-y-3">
                                        {section.lessons.map((lesson, lIdx) => (
                                            <div key={lesson.id} className="flex items-center gap-4 bg-white/5 p-3 rounded-lg border border-transparent hover:border-white/10 transition-all group">
                                                <span className="text-[10px] font-black text-gray-600 w-4">{lIdx + 1}</span>
                                                <Input
                                                    value={lesson.title}
                                                    onChange={(e) => updateLessonTitle(section.id, lesson.id, e.target.value)}
                                                    className="bg-transparent border-none text-sm p-0 focus-visible:ring-0 h-auto"
                                                    placeholder="Nome da Aula"
                                                />
                                                <button
                                                    onClick={() => removeLesson(section.id, lesson.id)}
                                                    className="text-gray-700 hover:text-red-500 opacity-0 group-hover:opacity-100 transition"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        ))}
                                        <button
                                            onClick={() => addLesson(section.id)}
                                            className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#00FF00]/60 hover:text-[#00FF00] transition pt-2"
                                        >
                                            <Plus size={14} /> Adicionar Aula
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

            </div>

            {/* Rodapé de Ações */}
            <div className="max-w-4xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
                <Button
                    variant="outline"
                    className="w-full md:w-auto border-white/10 hover:bg-white/5 text-gray-400 font-bold uppercase text-xs tracking-widest px-8 py-6 h-auto order-2 md:order-1"
                >
                    Salvar como Rascunho
                </Button>

                <div className="flex gap-4 w-full md:w-auto order-1 md:order-2">
                    {currentStep > 1 && (
                        <Button
                            variant="ghost"
                            onClick={handleBack}
                            className="flex-1 md:flex-none text-white hover:text-[#00FF00] font-bold uppercase text-xs tracking-widest px-6"
                        >
                            <ChevronLeft size={20} className="mr-2" /> Voltar
                        </Button>
                    )}

                    {currentStep < 3 ? (
                        <Button
                            onClick={handleNext}
                            disabled={!isStepValid(currentStep)}
                            className="flex-1 md:flex-none bg-[#00FF00] text-black hover:brightness-110 font-black uppercase text-xs tracking-widest px-8 py-6 h-auto shadow-[0_0_20px_rgba(0,255,0,0.3)] disabled:opacity-20 transition-all"
                        >
                            Próximo Passo <ChevronRight size={20} className="ml-2" />
                        </Button>
                    ) : (
                        <Button
                            disabled={!isPublishable}
                            className="flex-1 md:flex-none bg-[#00FF00] text-black hover:brightness-110 font-black uppercase text-xs tracking-widest px-12 py-6 h-auto shadow-[0_0_30px_rgba(0,255,0,0.5)] disabled:opacity-20 transition-all"
                        >
                            Publicar Curso <Check size={20} className="ml-2" />
                        </Button>
                    )}
                </div>
            </div>
        </div>
    )
}
