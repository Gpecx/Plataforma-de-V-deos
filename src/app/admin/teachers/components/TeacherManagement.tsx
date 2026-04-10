"use client"

import { useState, useMemo } from 'react'
import { Users, BookOpen, GraduationCap, Search, ChevronRight, Check, X, Mail, Calendar, MapPin, Briefcase, Monitor } from 'lucide-react'
import { getTeacherStudents, banTeacher, reactivateTeacher } from '@/app/actions/admin'
import { AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'

interface Teacher {
    id: string
    full_name?: string
    email?: string
    avatar_url?: string
    ativo?: boolean
    teacher_status?: 'active' | 'banned'
    created_at?: string
    teacher_application_data?: {
        primary_topic?: string
        experience_level?: string
        hardware_check?: string
        qualification_summary?: string
    }
    cpf_cnpj?: string
    birth_date?: string
    cep?: string
    rua?: string
    numero?: string
    complemento?: string
    bairro?: string
    cidade?: string
    estado?: string
}

interface Student {
    id: string
    full_name?: string
    email?: string
}

interface TeacherManagementProps {
    initialTeachers: any[]
}

const TOPIC_MAP: Record<string, string> = {
    'business': 'Gestão Empresarial',
    'marketing': 'Marketing Digital',
    'sales': 'Vendas e Negociação',
    'leadership': 'Liderança e Times',
    'finance': 'Finanças Pessoais',
    'technology': 'Tecnologia',
    'design': 'Design',
    'programming': 'Programação',
    'data': 'Ciência de Dados',
    'other': 'Outros'
}

const EXPERIENCE_MAP: Record<string, string> = {
    '1-2': '1 a 2 anos',
    '3-5': '3 a 5 anos',
    '5-10': '5 a 10 anos',
    '10+': 'Mais de 10 anos'
}

const HARDWARE_MAP: Record<string, string> = {
    'basic': 'Básico (Celular/Webcam)',
    'intermediate': 'Intermediário (USB Mic)',
    'advanced': 'Avançado (Estúdio Próprio)',
    'professional': 'Profissional (Equipamento Completo)'
}

export default function TeacherManagement({ initialTeachers }: TeacherManagementProps) {
    const [activeTab, setActiveTab] = useState<'ativos' | 'banidos'>('ativos')
    const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null)
    const [students, setStudents] = useState<Student[]>([])
    const [loading, setLoading] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')
    const [processingId, setProcessingId] = useState<string | null>(null)

    const bannedTeachers = useMemo(() => 
        initialTeachers.filter(t => t.teacher_status === 'banned'), 
        [initialTeachers]
    )
    const activeTeachers = useMemo(() => 
        initialTeachers.filter(t => t.teacher_status !== 'banned'), 
        [initialTeachers]
    )

    const filteredTeachers = useMemo(() => {
        const list = activeTab === 'ativos' ? activeTeachers : bannedTeachers
        return list.filter(t =>
            t.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            t.email?.toLowerCase().includes(searchTerm.toLowerCase())
        )
    }, [activeTab, activeTeachers, bannedTeachers, searchTerm])

    const isNewTeacher = (createdAt?: string) => {
        if (!createdAt) return false
        const created = new Date(createdAt)
        const now = new Date()
        const diffDays = Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24))
        return diffDays <= 7
    }

    const handleSelectTeacher = async (teacher: Teacher) => {
        setSelectedTeacher(teacher)
        if (activeTab === 'ativos') {
            setLoading(true)
            try {
                const res = await getTeacherStudents(teacher.id)
                setStudents(res as Student[])
            } catch (error) {
                console.error("Erro ao buscar alunos:", error)
            } finally {
                setLoading(false)
            }
        }
    }

    const handleBan = async (teacherId: string) => {
        if (!confirm('Deseja banir este professor? Esta ação pode ser revertida.')) return
        
        setProcessingId(teacherId)
        try {
            const result = await banTeacher(teacherId)
            if (result.success) {
                toast.success(result.message)
                setSelectedTeacher(null)
                window.location.reload()
            } else {
                toast.error(result.error || 'Erro ao banir professor')
            }
        } catch (error) {
            toast.error('Erro ao banir professor')
        } finally {
            setProcessingId(null)
        }
    }

    const handleReactivate = async (teacherId: string) => {
        if (!confirm('Deseja reativar este professor?')) return
        
        setProcessingId(teacherId)
        try {
            const result = await reactivateTeacher(teacherId)
            if (result.success) {
                toast.success(result.message)
                setSelectedTeacher(null)
                window.location.reload()
            } else {
                toast.error(result.error || 'Erro ao reativar professor')
            }
        } catch (error) {
            toast.error('Erro ao reativar professor')
        } finally {
            setProcessingId(null)
        }
    }

    const formatDate = (dateString?: string) => {
        if (!dateString) return '-'
        return new Date(dateString).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        })
    }

    const formatAddress = (teacher: Teacher) => {
        const parts = [
            teacher.rua,
            teacher.numero,
            teacher.complemento,
            teacher.bairro,
            teacher.cidade,
            teacher.estado
        ].filter(Boolean)
        return parts.length > 0 ? parts.join(', ') : '-'
    }

    return (
        <div className="grid lg:grid-cols-2 gap-8 p-2">
            <div className="bg-white p-8 rounded-2xl border border-slate-300 shadow-sm flex flex-col h-fit">
                <div className="flex items-center justify-between gap-6 mb-10">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center border border-slate-300">
                            <GraduationCap className="text-[#1D5F31]" size={24} strokeWidth={2.5} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold uppercase tracking-tighter !text-[#1D5F31] leading-none">Gestão de Professores</h2>
                            <p className="text-[10px] font-bold !text-[#1D5F31] uppercase tracking-widest mt-1">Controle de Acessos</p>
                        </div>
                    </div>
                </div>

                <div className="flex gap-2 mb-6 border-b border-slate-200">
                    <button
                        onClick={() => { setActiveTab('ativos'); setSearchTerm(''); setSelectedTeacher(null); }}
                        className={`px-4 py-2 text-[11px] font-bold uppercase tracking-wider transition-all border-b-2 -mb-[2px] ${
                            activeTab === 'ativos' 
                                ? 'border-[#1D5F31] text-[#1D5F31]' 
                                : 'border-transparent text-slate-400 hover:text-slate-600'
                        }`}
                    >
                        Ativos
                    </button>
                    <button
                        onClick={() => { setActiveTab('banidos'); setSearchTerm(''); setSelectedTeacher(null); }}
                        className={`px-4 py-2 text-[11px] font-bold uppercase tracking-wider transition-all border-b-2 -mb-[2px] flex items-center gap-2 ${
                            activeTab === 'banidos' 
                                ? 'border-[#1D5F31] text-[#1D5F31]' 
                                : 'border-transparent text-slate-400 hover:text-slate-600'
                        }`}
                    >
                        Banidos
                        {bannedTeachers.length > 0 && (
                            <span className="bg-red-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-full">
                                {bannedTeachers.length}
                            </span>
                        )}
                    </button>
                </div>

                <div className="relative w-full mb-6 group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#1D5F31] transition-colors group-focus-within:text-[#1D5F31]" size={16} strokeWidth={3} />
                    <input
                        placeholder="BUSCAR NOME OU EMAIL..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-slate-100 border-2 border-slate-200 rounded-xl pl-12 pr-4 py-3 text-[11px] text-[#000000] focus:border-[#1D5F31] focus:bg-white outline-none transition-all font-bold uppercase tracking-wider placeholder:text-[#64748b]"
                    />
                </div>

                <div className="overflow-hidden">
                    {filteredTeachers.length === 0 ? (
                        <div className="text-center py-10">
                            <p className="text-xs font-bold uppercase text-slate-400">
                                Nenhum professor encontrado
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {filteredTeachers.map((teacher) => (
                                <div
                                    key={teacher.id}
                                    className={`group cursor-pointer transition-all bg-slate-50 rounded-xl border-2 p-4 hover:border-[#1D5F31] ${
                                        selectedTeacher?.id === teacher.id ? 'border-[#1D5F31] bg-[#1D5F31]/5' : 'border-slate-200'
                                    }`}
                                    onClick={() => handleSelectTeacher(teacher)}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-[#1D5F31]/10 rounded-full flex items-center justify-center flex-shrink-0">
                                                <Users size={20} className="text-[#1D5F31]" />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-[#000000] uppercase tracking-tight text-[13px] block">
                                                        {teacher.full_name}
                                                    </span>
                                                    {activeTab === 'ativos' && isNewTeacher(teacher.created_at) && (
                                                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[9px] font-bold uppercase rounded border border-emerald-300">
                                                            NOVO
                                                        </span>
                                                    )}
                                                    {activeTab === 'banidos' && (
                                                        <span className="px-2 py-0.5 bg-red-100 text-red-700 text-[9px] font-bold uppercase rounded border border-red-300">
                                                            BANIDO
                                                        </span>
                                                    )}
                                                </div>
                                                <span className="text-[11px] text-[#334155] font-bold block">
                                                    {teacher.email}
                                                </span>
                                            </div>
                                        </div>
                                        <div className={`inline-flex items-center justify-center w-8 h-8 rounded-lg border border-slate-300 transition-all ${selectedTeacher?.id === teacher.id ? 'bg-[#1D5F31] text-white rotate-90' : 'bg-white text-black group-hover:bg-[#1D5F31] group-hover:text-white'}`}>
                                            <ChevronRight size={18} strokeWidth={3} />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <div className="bg-white p-8 rounded-2xl border border-slate-300 shadow-sm flex flex-col min-h-[600px]">
                <div className="flex items-center gap-4 mb-10 border-b border-slate-200 pb-6">
                    <div className="w-12 h-12 rounded-xl bg-[#1D5F31] flex items-center justify-center shadow-lg">
                        <Users className="text-white" size={24} strokeWidth={2} />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold uppercase tracking-tighter !text-[#1D5F31]">
                            {selectedTeacher 
                                ? `Detalhes: ${selectedTeacher.full_name?.split(' ')[0]}` 
                                : 'Detalhes do Instrutor'
                            }
                        </h2>
                        <p className="text-[10px] font-bold !text-[#1D5F31] uppercase tracking-widest mt-1">
                            {activeTab === 'ativos' ? 'Auditória de Alunos' : 'Informações do Banido'}
                        </p>
                    </div>
                </div>

                <AnimatePresence mode="wait">
                    {loading ? (
                        <div className="flex-grow flex flex-col items-center justify-center py-20">
                            <div className="w-12 h-12 border-4 border-[#1D5F31] border-t-transparent rounded-full animate-spin mb-4" />
                            <span className="text-[11px] font-bold uppercase tracking-widest text-[#000000]">Buscando na base...</span>
                        </div>
                    ) : selectedTeacher ? (
                        activeTab === 'ativos' ? (
                            <div className="space-y-3 max-h-[650px] overflow-y-auto pr-2 custom-scrollbar">
                                {students.length > 0 ? (
                                    students.map((student) => (
                                        <div key={student.id} className="bg-slate-50 p-5 rounded-xl border border-slate-200 hover:border-[#1D5F31] transition-all flex justify-between items-center group">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-lg bg-[#1D5F31] flex items-center justify-center text-white font-bold text-sm shadow-md">
                                                    {student.full_name?.charAt(0)}
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-[13px] uppercase tracking-tight text-[#000000]">{student.full_name}</h4>
                                                    <p className="text-[11px] text-[#334155] font-bold tracking-tight">{student.email}</p>
                                                </div>
                                            </div>
                                            <div className="p-2 bg-white border border-slate-200 rounded-lg text-[#000000] group-hover:bg-[#1D5F31] group-hover:text-white transition-colors">
                                                <BookOpen size={18} strokeWidth={2.5} />
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-20 px-10">
                                        <p className="text-xs font-bold uppercase text-[#000000] tracking-wider">Nenhum aluno encontrado</p>
                                    </div>
                                )}

                                <div className="mt-6 pt-6 border-t border-slate-200">
                                    <button
                                        onClick={() => handleBan(selectedTeacher.id)}
                                        disabled={processingId === selectedTeacher.id}
                                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-bold text-sm uppercase"
                                    >
                                        {processingId === selectedTeacher.id ? (
                                            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        ) : (
                                            <X size={16} />
                                        )}
                                        Banir Professor
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                                            <X size={32} className="text-red-600" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-lg text-[#000000] uppercase tracking-tight">
                                                {selectedTeacher.full_name}
                                            </h3>
                                            <p className="text-sm text-red-600 font-medium">
                                                Professor Banido
                                            </p>
                                        </div>
                                    </div>
                                    
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-3 text-sm">
                                            <Mail size={16} className="text-red-600" />
                                            <span className="font-medium text-slate-700">{selectedTeacher.email}</span>
                                        </div>
                                        <div className="flex items-center gap-3 text-sm">
                                            <Calendar size={16} className="text-red-600" />
                                            <span className="font-medium text-slate-700">Cadastrado em {formatDate(selectedTeacher.created_at)}</span>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={() => handleReactivate(selectedTeacher.id)}
                                    disabled={processingId === selectedTeacher.id}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#1D5F31] text-white rounded-lg hover:bg-[#1D5F31]/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-bold text-sm uppercase"
                                >
                                    {processingId === selectedTeacher.id ? (
                                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <Check size={16} />
                                    )}
                                    Reativar Professor
                                </button>
                            </div>
                        )
                    ) : (
                        <div className="flex-grow flex flex-col items-center justify-center py-20 text-center">
                            <Users size={40} className="text-slate-300 mb-4" />
                            <p className="text-xs font-bold uppercase tracking-widest text-[#000000] max-w-[200px] leading-relaxed">
                                Selecione um professor para ver os detalhes
                            </p>
                        </div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    )
}