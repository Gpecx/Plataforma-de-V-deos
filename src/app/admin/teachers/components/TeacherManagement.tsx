"use client"

import { useState } from 'react'
import { Users, BookOpen, GraduationCap, Search, ChevronRight, Loader2 } from 'lucide-react'
import { getTeacherStudents } from '@/app/actions/admin'

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

    const filteredTeachers = initialTeachers.filter(t => 
        t.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.email?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <div className="grid lg:grid-cols-2 gap-12">
            {/* Teachers Table */}
            <div className="bg-[#061629]/40 backdrop-blur-md p-10 border border-[#1D5F31]/20">
                <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-10">
                    <div className="flex items-center gap-3">
                        <GraduationCap className="text-[#1D5F31]" size={24} />
                        <h2 className="text-xl font-black uppercase tracking-tighter">Gestão de Professores</h2>
                    </div>
                    <div className="relative w-full md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
                        <input
                            placeholder="Buscar professor..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-[#061629] border border-[#1D5F31]/30 rounded-none px-10 py-2.5 text-xs text-white focus:border-[#1D5F31] outline-none transition-all font-bold uppercase tracking-widest placeholder:text-slate-600"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-[#1D5F31]/20 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                                <th className="pb-6 px-4">Nome</th>
                                <th className="pb-6 px-4">Email</th>
                                <th className="pb-6 px-4 text-right">Ação</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm">
                            {filteredTeachers.map((teacher) => (
                                <tr 
                                    key={teacher.id} 
                                    className={`border-b border-white/5 hover:bg-[#1D5F31]/5 transition-all group cursor-pointer ${selectedTeacher?.id === teacher.id ? 'bg-[#1D5F31]/10' : ''}`}
                                    onClick={() => handleSelectTeacher(teacher)}
                                >
                                    <td className="py-6 px-4">
                                        <div className="font-black text-white uppercase tracking-widest text-[11px]">
                                            {teacher.full_name || 'N/A'}
                                        </div>
                                    </td>
                                    <td className="py-6 px-4 text-xs text-slate-400 font-bold tracking-tight">
                                        {teacher.email}
                                    </td>
                                    <td className="py-6 px-4 text-right">
                                        <ChevronRight 
                                            size={16} 
                                            className={`inline transition-transform duration-300 ${selectedTeacher?.id === teacher.id ? 'text-[#1D5F31] translate-x-1' : 'text-slate-700'}`} 
                                        />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Students View (Filtered) */}
            <div className="bg-[#061629]/40 backdrop-blur-md p-10 border border-[#1D5F31]/20 flex flex-col">
                <div className="flex items-center gap-4 mb-10 border-b border-[#1D5F31]/20 pb-6">
                    <Users className="text-[#1D5F31]" size={20} />
                    <h2 className="text-lg font-black uppercase tracking-tighter">
                        {selectedTeacher ? `Alunos de ${selectedTeacher.full_name}` : 'Selecione um Professor'}
                    </h2>
                </div>

                {loading ? (
                    <div className="flex-grow flex flex-col items-center justify-center py-24">
                        <Loader2 className="animate-spin text-[#1D5F31] mb-4" size={32} />
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 animate-pulse">Carregando Matrículas...</span>
                    </div>
                ) : selectedTeacher ? (
                    students.length > 0 ? (
                        <div className="space-y-4 max-h-[600px] overflow-y-auto custom-scrollbar pr-2">
                            {students.map((student) => (
                                <div key={student.id} className="bg-[#061629]/60 p-6 border border-[#1D5F31]/10 hover:border-[#1D5F31]/30 transition-all flex justify-between items-center group">
                                    <div>
                                        <h4 className="font-black text-xs uppercase tracking-widest text-white group-hover:text-[#1D5F31] transition-colors">{student.full_name}</h4>
                                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">{student.email}</p>
                                    </div>
                                    <div className="h-8 w-8 bg-[#1D5F31]/10 flex items-center justify-center text-[#1D5F31]">
                                        <BookOpen size={14} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex-grow flex flex-col items-center justify-center py-24 text-center opacity-40">
                            <BookOpen size={48} className="text-slate-700 mb-6" />
                            <p className="text-[10px] font-black uppercase tracking-[3px] text-slate-500">Este professor ainda não possui alunos matriculados.</p>
                        </div>
                    )
                ) : (
                    <div className="flex-grow flex flex-col items-center justify-center py-24 text-center opacity-40">
                        <Users size={48} className="text-slate-700 mb-6" />
                        <p className="text-[10px] font-black uppercase tracking-[3px] text-slate-500">Clique em um professor para visualizar seus alunos.</p>
                    </div>
                )}
            </div>
        </div>
    )
}
