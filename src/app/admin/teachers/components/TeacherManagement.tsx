"use client"

import { useState } from 'react'
import { Users, BookOpen, GraduationCap, Search, ChevronRight, Loader2 } from 'lucide-react'
import { getTeacherStudents, toggleUserStatus } from '@/app/actions/admin'

interface Teacher {
    id: string
    full_name?: string
    email?: string
    avatar_url?: string
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
        const res = await getTeacherStudents(teacher.id)
        setStudents(res as Student[])
        setLoading(false)
    }

    const handleToggleStatus = async (uid: string, currentStatus: boolean, e: React.MouseEvent) => {
        e.stopPropagation()
        if (!confirm(`Deseja ${currentStatus ? 'desativar' : 'ativar'} este usuário?`)) return
        
        try {
            const res = await toggleUserStatus(uid, currentStatus)
            if (res.success) {
                // Como teachers vem da prop initialTeachers, precisamos localmente atualizar se quisermos refletir imediato
                // Ou podemos revalidar (o action já faz revalidatePath)
                window.location.reload() // Simples para este contexto de admin
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
        <div className="grid lg:grid-cols-2 gap-10">
            {/* Teachers Table */}
            <div className="bg-white p-12 rounded-[40px] border border-black shadow-sm overflow-hidden flex flex-col h-fit">
                <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-8 mb-12">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center border border-black">
                            <GraduationCap className="text-[#1D5F31]" size={20} strokeWidth={2.5} />
                        </div>
                        <h2 className="text-xl font-black uppercase tracking-tighter text-slate-900">Gestão de Professores</h2>
                    </div>
                    <div className="relative w-full xl:w-72 group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-900 transition-colors group-focus-within:text-[#1D5F31]" size={16} />
                        <input
                            placeholder="Buscar professor por nome..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-slate-50 border border-black rounded-2xl px-12 py-4 text-[10px] !text-black focus:border-black focus:bg-white outline-none transition-all font-black uppercase tracking-widest placeholder:text-slate-500 shadow-inner"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-black text-[10px] font-black uppercase tracking-[2px] !text-black">
                                <th className="pb-8 px-4">Institucional</th>
                                <th className="pb-8 px-4">Status</th>
                                <th className="pb-8 px-4 text-right">Ficha</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm">
                            {filteredTeachers.map((teacher) => (
                                <tr 
                                    key={teacher.id} 
                                    className={`border-b border-slate-200 hover:bg-slate-50/50 transition-all group cursor-pointer ${selectedTeacher?.id === teacher.id ? 'bg-slate-50' : ''}`}
                                    onClick={() => handleSelectTeacher(teacher)}
                                >
                                    <td className="py-8 px-4">
                                        <div className="flex flex-col">
                                            <span className="font-black text-slate-900 uppercase tracking-tight text-[12px] group-hover:text-[#1D5F31] transition-colors">
                                                {teacher.full_name || 'N/A'}
                                            </span>
                                            <span className="text-[10px] text-slate-900 font-black tracking-widest uppercase mt-1 italic">
                                                {teacher.email}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="py-8 px-4">
                                        <button 
                                            onClick={(e) => handleToggleStatus(teacher.id, teacher.ativo ?? true, e)}
                                            className={`px-4 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all shadow-sm ${
                                                teacher.ativo !== false 
                                                ? 'bg-[#1D5F31] text-white hover:opacity-90' 
                                                : 'bg-rose-500 text-white hover:opacity-90'
                                            }`}
                                        >
                                            {teacher.ativo !== false ? 'ATIVO' : 'SUSPENSO'}
                                        </button>
                                    </td>
                                    <td className="py-8 px-4 text-right">
                                        <div className={`inline-flex items-center justify-center w-8 h-8 rounded-full border border-black transition-all duration-300 ${selectedTeacher?.id === teacher.id ? 'bg-[#1D5F31] border-[#1D5F31] text-white translate-x-1' : 'bg-white text-black group-hover:border-[#1D5F31] group-hover:text-[#1D5F31]'}`}>
                                            <ChevronRight size={16} strokeWidth={3} />
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Students View (Filtered) */}
            <div className="bg-white p-12 rounded-[40px] border border-black shadow-sm flex flex-col min-h-[600px]">
                <div className="flex items-center gap-4 mb-12 border-b border-slate-200 pb-8">
                    <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center border border-black">
                        <Users className="text-[#1D5F31]" size={20} strokeWidth={2.5} />
                    </div>
                    <h2 className="text-xl font-black uppercase tracking-tighter text-slate-900">
                        {selectedTeacher ? `Matrículas de ${selectedTeacher.full_name?.split(' ')[0]}` : 'Selecione um Professor'}
                    </h2>
                </div>

                {loading ? (
                    <div className="flex-grow flex flex-col items-center justify-center py-24">
                        <div className="relative">
                            <div className="w-16 h-16 rounded-full border-4 border-slate-100 border-t-[#1D5F31] animate-spin"></div>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <Users size={20} className="text-[#1D5F31]" />
                            </div>
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-[4px] text-slate-900 mt-6 animate-pulse">Auditando Registros...</span>
                    </div>
                ) : selectedTeacher ? (
                    students.length > 0 ? (
                        <div className="space-y-4 max-h-[700px] overflow-y-auto custom-scrollbar pr-4">
                            {students.map((student) => (
                                <div key={student.id} className="bg-slate-50/50 p-8 rounded-[24px] border border-black hover:border-[#1D5F31] transition-all flex justify-between items-center group shadow-sm">
                                    <div className="flex items-center gap-5">
                                        <div className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center text-white font-black text-xs border-2 border-white shadow-md">
                                            {student.full_name?.charAt(0)}
                                        </div>
                                        <div>
                                            <h4 className="font-black text-xs uppercase tracking-widest text-slate-900 group-hover:text-[#1D5F31] transition-colors">{student.full_name}</h4>
                                            <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest mt-1 italic">{student.email}</p>
                                        </div>
                                    </div>
                                    <div className="h-10 w-10 bg-white border border-black rounded-xl flex items-center justify-center text-black group-hover:text-[#1D5F31] group-hover:border-[#1D5F31] transition-all shadow-sm">
                                        <BookOpen size={16} strokeWidth={2.5} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex-grow flex flex-col items-center justify-center py-24 text-center">
                            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-8 border border-black shadow-inner">
                                <BookOpen size={32} className="text-slate-900" />
                            </div>
                            <p className="text-[10px] font-black uppercase tracking-[4px] text-slate-900 max-w-[200px] mx-auto">Este instrutor ainda não possui registros de matrículas identificados.</p>
                        </div>
                    )
                ) : (
                    <div className="flex-grow flex flex-col items-center justify-center py-24 text-center">
                        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-8 border border-black shadow-inner">
                            <Users size={32} className="text-slate-900" />
                        </div>
                        <p className="text-[10px] font-black uppercase tracking-[4px] text-slate-900 max-w-[200px] mx-auto">Selecione um professor na lista ao lado para auditar suas turmas.</p>
                    </div>
                )}
            </div>
        </div>
    )
}
