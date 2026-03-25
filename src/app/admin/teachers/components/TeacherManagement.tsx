"use client"

import { useState } from 'react'
import { Users, BookOpen, GraduationCap, Search, ChevronRight } from 'lucide-react'
import { getTeacherStudents, toggleUserStatus } from '@/app/actions/admin'
import { motion, AnimatePresence } from 'framer-motion'

interface Teacher {
    id: string
    full_name?: string
    email?: string
    avatar_url?: string
    ativo?: boolean
}

interface Student {
    id: string
    full_name?: string
    email?: string
}

interface TeacherManagementProps {
    initialTeachers: any[]
}

export default function TeacherManagement({ initialTeachers }: TeacherManagementProps) {
    const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null)
    const [students, setStudents] = useState<Student[]>([])
    const [loading, setLoading] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')

    const handleSelectTeacher = async (teacher: Teacher) => {
        setSelectedTeacher(teacher)
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

    const filteredTeachers = initialTeachers.filter(t =>
        t.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.email?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <div className="grid lg:grid-cols-2 gap-8 p-2">
            {/* Lista de Professores */}
            <div className="bg-white p-8 rounded-2xl border border-slate-300 shadow-sm flex flex-col h-fit">
                <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 mb-10">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center border border-slate-300">
                            <GraduationCap className="text-[#1D5F31]" size={24} strokeWidth={2.5} />
                        </div>
                        <div>
                            <h2 className="text-xl font-black uppercase tracking-tighter !text-[#1D5F31] leading-none">Gestão de Professores</h2>
                            <p className="text-[10px] font-bold !text-[#1D5F31] uppercase tracking-widest mt-1">Controle de Acessos</p>
                        </div>
                    </div>

                    <div className="relative w-full xl:w-64 group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#1D5F31] transition-colors group-focus-within:text-[#1D5F31]" size={16} strokeWidth={3} />
                        <input
                            placeholder="BUSCAR NOME OU EMAIL..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            /* Background levemente escurecido para o texto branco não sumir */
                            className="w-full bg-slate-100 border-2 border-slate-200 rounded-xl pl-12 pr-4 py-3 text-[11px] text-[#000000] focus:border-[#1D5F31] focus:bg-white outline-none transition-all font-black uppercase tracking-wider placeholder:text-[#64748b]"
                        />
                    </div>
                </div>

                <div className="overflow-hidden">
                    <table className="w-full text-left border-separate border-spacing-y-3">
                        <thead>
                            <tr className="text-[11px] font-black uppercase tracking-widest text-[#1D5F31]">
                                <th className="pb-4 px-4">Institucional</th>
                                <th className="pb-4 px-4">Status</th>
                                <th className="pb-4 px-4 text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredTeachers.map((teacher) => (
                                <tr
                                    key={teacher.id}
                                    className={`group cursor-pointer transition-all ${selectedTeacher?.id === teacher.id ? 'bg-slate-100' : 'hover:bg-slate-50'}`}
                                    onClick={() => handleSelectTeacher(teacher)}
                                >
                                    <td className="py-4 px-4 rounded-l-xl border-y border-l border-slate-200 group-hover:border-[#1D5F31]">
                                        <div className="flex flex-col">
                                            {/* Nome em Preto Sólido */}
                                            <span className="font-black text-[#000000] uppercase tracking-tight text-[13px] group-hover:text-[#1D5F31] transition-colors">
                                                {teacher.full_name || 'Sem Nome'}
                                            </span>
                                            {/* Email em Cinza Escuro (Slate-700) sem opacidade */}
                                            <span className="text-[11px] text-[#334155] font-bold tracking-tight mt-0.5">
                                                {teacher.email}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="py-4 px-4 border-y border-slate-200 group-hover:border-[#1D5F31]">
                                        <button
                                            onClick={(e) => handleToggleStatus(teacher.id, teacher.ativo ?? true, e)}
                                            className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${teacher.ativo !== false
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
                </div>
            </div>

            {/* Painel de Matrículas (Direita) */}
            <div className="bg-white p-8 rounded-2xl border border-slate-300 shadow-sm flex flex-col min-h-[600px]">
                <div className="flex items-center gap-4 mb-10 border-b border-slate-200 pb-6">
                    <div className="w-12 h-12 rounded-xl bg-[#1D5F31] flex items-center justify-center shadow-lg">
                        <Users className="text-white" size={24} strokeWidth={2} />
                    </div>
                    <div>
                        <h2 className="text-xl font-black uppercase tracking-tighter !text-[#1D5F31]">
                            {selectedTeacher ? `Matrículas: ${selectedTeacher.full_name?.split(' ')[0]}` : 'Detalhes do Instrutor'}
                        </h2>
                        <p className="text-[10px] font-bold !text-[#1D5F31] uppercase tracking-widest mt-1">Auditória de Alunos</p>
                    </div>
                </div>

                <AnimatePresence mode="wait">
                    {loading ? (
                        <div className="flex-grow flex flex-col items-center justify-center py-20">
                            <div className="w-12 h-12 border-4 border-[#1D5F31] border-t-transparent rounded-full animate-spin mb-4" />
                            <span className="text-[11px] font-black uppercase tracking-widest text-[#000000]">Buscando na base...</span>
                        </div>
                    ) : selectedTeacher ? (
                        <div className="space-y-3 max-h-[650px] overflow-y-auto pr-2 custom-scrollbar">
                            {students.length > 0 ? (
                                students.map((student) => (
                                    <div key={student.id} className="bg-slate-50 p-5 rounded-xl border border-slate-200 hover:border-[#1D5F31] transition-all flex justify-between items-center group">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-lg bg-[#1D5F31] flex items-center justify-center text-white font-black text-sm shadow-md">
                                                {student.full_name?.charAt(0)}
                                            </div>
                                            <div>
                                                <h4 className="font-black text-[13px] uppercase tracking-tight text-[#000000]">{student.full_name}</h4>
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
                                    <p className="text-xs font-black uppercase text-[#000000] tracking-wider">Nenhum aluno encontrado</p>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="flex-grow flex flex-col items-center justify-center py-20 text-center">
                            <Users size={40} className="text-slate-300 mb-4" />
                            <p className="text-xs font-black uppercase tracking-widest text-[#000000] max-w-[200px] leading-relaxed">
                                Selecione um professor para visualizar as turmas
                            </p>
                        </div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    )
}