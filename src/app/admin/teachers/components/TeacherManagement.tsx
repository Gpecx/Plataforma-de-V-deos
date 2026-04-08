"use client"

import { useState } from 'react'
import { Users, BookOpen, GraduationCap, Search, ChevronRight, Check, X, Clock, Mail, Calendar } from 'lucide-react'
import { getTeacherStudents, toggleUserStatus, handleTeacherApproval } from '@/app/actions/admin'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'

interface Teacher {
    id: string
    full_name?: string
    email?: string
    avatar_url?: string
    ativo?: boolean
    teacher_status?: 'pending' | 'approved' | 'rejected'
    specialty?: string
    createdAt?: string
}

interface Student {
    id: string
    full_name?: string
    email?: string
}

interface TeacherManagementProps {
    initialTeachers: any[]
}

const mockPendingTeachers: Teacher[] = [
    {
        id: 'teacher-001',
        full_name: 'Carlos Eduardo Santos',
        email: 'carlos.santos@email.com',
        specialty: 'Gestão Empresarial',
        createdAt: '2026-04-05T10:30:00Z',
        ativo: true,
        teacher_status: 'pending'
    },
    {
        id: 'teacher-002',
        full_name: 'Mariana Costa Oliveira',
        email: 'mariana.costa@email.com',
        specialty: 'Marketing Digital',
        createdAt: '2026-04-06T14:15:00Z',
        ativo: true,
        teacher_status: 'pending'
    },
    {
        id: 'teacher-003',
        full_name: 'Roberto Ferreira Lima',
        email: 'roberto.ferreira@email.com',
        specialty: 'Vendas e Negociação',
        createdAt: '2026-04-07T09:00:00Z',
        ativo: true,
        teacher_status: 'pending'
    },
    {
        id: 'teacher-004',
        full_name: 'Ana Paula Rodrigues',
        email: 'ana.rodrigues@email.com',
        specialty: 'Liderança e Times',
        createdAt: '2026-04-08T16:45:00Z',
        ativo: true,
        teacher_status: 'pending'
    },
    {
        id: 'teacher-005',
        full_name: 'Paulo Henrique Almeida',
        email: 'paulo.almeida@email.com',
        specialty: 'Finanças Pessoais',
        createdAt: '2026-04-08T11:20:00Z',
        ativo: true,
        teacher_status: 'pending'
    }
]

export default function TeacherManagement({ initialTeachers }: TeacherManagementProps) {
    const [activeTab, setActiveTab] = useState<'ativos' | 'pendentes'>('ativos')
    const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null)
    const [pendingTeacher, setPendingTeacher] = useState<Teacher | null>(null)
    const [students, setStudents] = useState<Student[]>([])
    const [loading, setLoading] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')
    const [processingId, setProcessingId] = useState<string | null>(null)
    const [pendingTeachers, setPendingTeachers] = useState<Teacher[]>(mockPendingTeachers)

    const activeTeachers = initialTeachers.filter(t => t.ativo !== false)
    const filteredActiveTeachers = activeTeachers.filter(t =>
        t.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.email?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const handleSelectTeacher = async (teacher: Teacher) => {
        setSelectedTeacher(teacher)
        setPendingTeacher(null)
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

    const handleSelectPending = (teacher: Teacher) => {
        setPendingTeacher(teacher)
        setSelectedTeacher(null)
    }

    const handleToggleStatus = async (uid: string, currentStatus: boolean, e: React.MouseEvent) => {
        e.stopPropagation()
        const acao = currentStatus ? 'desativar' : 'ativar'
        if (!confirm(`Deseja ${acao} este usuário?`)) return

        try {
            const res = await toggleUserStatus(uid, currentStatus)
            if (res.success) {
                window.location.reload()
            } else {
                alert(res.error)
            }
        } catch (error) {
            alert('Erro ao atualizar status')
        }
    }

    const handleApproval = async (teacherId: string, action: 'approve' | 'reject') => {
        setProcessingId(teacherId)
        
        try {
            const result = await handleTeacherApproval(teacherId, action)
            
            if (result.success) {
                toast.success(result.message)
                setPendingTeachers(prev => prev.filter(t => t.id !== teacherId))
                if (pendingTeacher?.id === teacherId) {
                    setPendingTeacher(null)
                }
            } else {
                toast.error(result.error || 'Erro ao processar solicitação')
            }
        } catch (error) {
            toast.error('Erro ao processar solicitação')
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

    return (
        <div className="grid lg:grid-cols-2 gap-8 p-2">
            {/* Lista de Professores */}
            <div className="bg-white p-8 rounded-2xl border border-slate-300 shadow-sm flex flex-col h-fit">
                {/* Tabs */}
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

                {/* Tab Buttons */}
                <div className="flex gap-2 mb-6 border-b border-slate-200">
                    <button
                        onClick={() => { setActiveTab('ativos'); setSearchTerm(''); setSelectedTeacher(null); setPendingTeacher(null); }}
                        className={`px-4 py-2 text-[11px] font-bold uppercase tracking-wider transition-all border-b-2 -mb-[2px] ${
                            activeTab === 'ativos' 
                                ? 'border-[#1D5F31] text-[#1D5F31]' 
                                : 'border-transparent text-slate-400 hover:text-slate-600'
                        }`}
                    >
                        Ativos
                    </button>
                    <button
                        onClick={() => { setActiveTab('pendentes'); setSearchTerm(''); setSelectedTeacher(null); setPendingTeacher(null); }}
                        className={`px-4 py-2 text-[11px] font-bold uppercase tracking-wider transition-all border-b-2 -mb-[2px] flex items-center gap-2 ${
                            activeTab === 'pendentes' 
                                ? 'border-[#1D5F31] text-[#1D5F31]' 
                                : 'border-transparent text-slate-400 hover:text-slate-600'
                        }`}
                    >
                        Pendentes
                        {pendingTeachers.length > 0 && (
                            <span className="bg-[#1D5F31] text-white text-[9px] font-bold px-2 py-0.5 rounded-full">
                                {pendingTeachers.length}
                            </span>
                        )}
                    </button>
                </div>

                {/* Search */}
                <div className="relative w-full mb-6 group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#1D5F31] transition-colors group-focus-within:text-[#1D5F31]" size={16} strokeWidth={3} />
                    <input
                        placeholder="BUSCAR NOME OU EMAIL..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-slate-100 border-2 border-slate-200 rounded-xl pl-12 pr-4 py-3 text-[11px] text-[#000000] focus:border-[#1D5F31] focus:bg-white outline-none transition-all font-bold uppercase tracking-wider placeholder:text-[#64748b]"
                    />
                </div>

                {/* Content */}
                <div className="overflow-hidden">
                    {activeTab === 'ativos' ? (
                        <table className="w-full text-left border-separate border-spacing-y-3">
                            <thead>
                                <tr className="text-[11px] font-bold uppercase tracking-widest text-[#1D5F31]">
                                    <th className="pb-4 px-4">Institucional</th>
                                    <th className="pb-4 px-4">Status</th>
                                    <th className="pb-4 px-4 text-right">Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredActiveTeachers.map((teacher) => (
                                    <tr
                                        key={teacher.id}
                                        className={`group cursor-pointer transition-all ${selectedTeacher?.id === teacher.id ? 'bg-slate-100' : 'hover:bg-slate-50'}`}
                                        onClick={() => handleSelectTeacher(teacher)}
                                    >
                                        <td className="py-4 px-4 rounded-l-xl border-y border-l border-slate-200 group-hover:border-[#1D5F31]">
                                            <div className="flex flex-col">
                                                <span className="font-bold text-[#000000] uppercase tracking-tight text-[13px] group-hover:text-[#1D5F31] transition-colors">
                                                    {teacher.full_name || 'Sem Nome'}
                                                </span>
                                                <span className="text-[11px] text-[#334155] font-bold tracking-tight mt-0.5">
                                                    {teacher.email}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="py-4 px-4 border-y border-slate-200 group-hover:border-[#1D5F31]">
                                            <button
                                                onClick={(e) => handleToggleStatus(teacher.id, teacher.ativo ?? true, e)}
                                                className={`px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-widest transition-all ${teacher.ativo !== false
                                                    ? 'bg-[#1D5F31] text-white'
                                                    : 'bg-rose-600 text-white'
                                                }`}
                                            >
                                                {teacher.ativo !== false ? 'ATIVO' : 'SUSPENSO'}
                                            </button>
                                        </td>
                                        <td className="py-4 px-4 text-right rounded-r-xl border-y border-r border-slate-200 group-hover:border-[#1D5F31]">
                                            <div className={`inline-flex items-center justify-center w-8 h-8 rounded-lg border border-slate-300 transition-all duration-300 ${selectedTeacher?.id === teacher.id ? 'bg-[#1D5F31] text-white rotate-90' : 'bg-white text-black group-hover:bg-[#1D5F31] group-hover:text-white'}`}>
                                                <ChevronRight size={18} strokeWidth={3} />
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <div className="space-y-3">
                            {pendingTeachers
                                .filter(t => 
                                    !searchTerm || 
                                    t.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                    t.email?.toLowerCase().includes(searchTerm.toLowerCase())
                                )
                                .map((teacher) => (
                                    <div
                                        key={teacher.id}
                                        className={`group cursor-pointer transition-all bg-slate-50 rounded-xl border-2 p-4 hover:border-[#1D5F31] ${
                                            pendingTeacher?.id === teacher.id ? 'border-[#1D5F31] bg-[#1D5F31]/5' : 'border-slate-200'
                                        }`}
                                        onClick={() => handleSelectPending(teacher)}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 bg-[#1D5F31]/10 rounded-full flex items-center justify-center flex-shrink-0">
                                                    <Clock size={20} className="text-[#1D5F31]" />
                                                </div>
                                                <div>
                                                    <span className="font-bold text-[#000000] uppercase tracking-tight text-[13px] block">
                                                        {teacher.full_name}
                                                    </span>
                                                    <span className="text-[11px] text-[#334155] font-bold block">
                                                        {teacher.email}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className={`inline-flex items-center justify-center w-8 h-8 rounded-lg border border-slate-300 transition-all ${pendingTeacher?.id === teacher.id ? 'bg-[#1D5F31] text-white rotate-90' : 'bg-white text-black group-hover:bg-[#1D5F31] group-hover:text-white'}`}>
                                                <ChevronRight size={18} strokeWidth={3} />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Painel de Detalhes (Direita) */}
            <div className="bg-white p-8 rounded-2xl border border-slate-300 shadow-sm flex flex-col min-h-[600px]">
                <div className="flex items-center gap-4 mb-10 border-b border-slate-200 pb-6">
                    <div className="w-12 h-12 rounded-xl bg-[#1D5F31] flex items-center justify-center shadow-lg">
                        <Users className="text-white" size={24} strokeWidth={2} />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold uppercase tracking-tighter !text-[#1D5F31]">
                            {selectedTeacher 
                                ? `Matrículas: ${selectedTeacher.full_name?.split(' ')[0]}` 
                                : pendingTeacher 
                                    ? 'Detalhes do Candidato' 
                                    : 'Detalhes do Instrutor'
                            }
                        </h2>
                        <p className="text-[10px] font-bold !text-[#1D5F31] uppercase tracking-widest mt-1">
                            {selectedTeacher ? 'Auditória de Alunos' : pendingTeacher ? 'Informações do Candidato' : 'Auditória de Alunos'}
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
                        </div>
                    ) : pendingTeacher ? (
                        <div className="space-y-6">
                            {/* Info Card */}
                            <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="w-16 h-16 bg-[#1D5F31]/10 rounded-full flex items-center justify-center">
                                        <Clock size={32} className="text-[#1D5F31]" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg text-[#000000] uppercase tracking-tight">
                                            {pendingTeacher.full_name}
                                        </h3>
                                        <p className="text-sm text-[#334155] font-medium">
                                            Candidato a Instrutor
                                        </p>
                                    </div>
                                </div>
                                
                                <div className="space-y-3 mt-6">
                                    <div className="flex items-center gap-3 text-sm">
                                        <Mail size={16} className="text-[#1D5F31]" />
                                        <span className="font-medium text-slate-700">{pendingTeacher.email}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm">
                                        <Calendar size={16} className="text-[#1D5F31]" />
                                        <span className="font-medium text-slate-700">Cadastrado em {formatDate(pendingTeacher.createdAt)}</span>
                                    </div>
                                    {pendingTeacher.specialty && (
                                        <div className="inline-block mt-2 px-3 py-1 bg-[#1D5F31]/10 rounded-full text-xs font-bold text-[#1D5F31]">
                                            {pendingTeacher.specialty}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Área de Proposta/Currículo (Mock) */}
                            <div className="bg-white p-6 rounded-xl border border-slate-200">
                                <h4 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">Proposta do Candidato</h4>
                                <p className="text-sm text-slate-700 leading-relaxed">
                                    Professor com mais de 10 anos de experiência em {pendingTeacher.specialty || 'sua área de atuação'}. 
                                    Especializado em treinamentos corporativos e desenvolvimento de lideranças. 
                                    Metodologia exclusiva focada em resultados práticos.
                                </p>
                            </div>

                            {/* Ações */}
                            <div className="flex gap-3 pt-4">
                                <button
                                    onClick={() => handleApproval(pendingTeacher.id, 'reject')}
                                    disabled={processingId === pendingTeacher.id}
                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-bold text-sm uppercase"
                                >
                                    {processingId === pendingTeacher.id ? (
                                        <span className="w-4 h-4 border-2 border-red-300 border-t-red-600 rounded-full animate-spin" />
                                    ) : (
                                        <X size={16} />
                                    )}
                                    Rejeitar
                                </button>
                                <button
                                    onClick={() => handleApproval(pendingTeacher.id, 'approve')}
                                    disabled={processingId === pendingTeacher.id}
                                    className="flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-[#1D5F31] text-white rounded-lg hover:bg-[#1D5F31]/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-bold text-sm uppercase"
                                >
                                    {processingId === pendingTeacher.id ? (
                                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <Check size={16} />
                                    )}
                                    Aprovar
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex-grow flex flex-col items-center justify-center py-20 text-center">
                            <Users size={40} className="text-slate-300 mb-4" />
                            <p className="text-xs font-bold uppercase tracking-widest text-[#000000] max-w-[200px] leading-relaxed">
                                {activeTab === 'pendentes' 
                                    ? 'Selecione um candidato para ver os detalhes' 
                                    : 'Selecione um professor para visualizar as turmas'
                                }
                            </p>
                        </div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    )
}
