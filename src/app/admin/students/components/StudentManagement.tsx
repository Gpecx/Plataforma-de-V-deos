'use client'

import { useState } from 'react'
import { Search, User as UserIcon, Loader2, ShieldCheck, ShieldAlert } from 'lucide-react'
import { toggleUserStatus } from '@/app/actions/admin'

interface Student {
    id: string
    full_name?: string
    email?: string
    ativo?: boolean
}

interface StudentManagementProps {
    initialStudents: any[]
}

export default function StudentManagement({ initialStudents }: StudentManagementProps) {
    const [students, setStudents] = useState<Student[]>(initialStudents)
    const [searchTerm, setSearchTerm] = useState('')
    const [loadingId, setLoadingId] = useState<string | null>(null)

    const handleToggleStatus = async (uid: string, currentStatus: boolean) => {
        if (!confirm(`Deseja ${currentStatus ? 'desativar' : 'ativar'} este aluno?`)) return
        
        setLoadingId(uid)
        try {
            const res = await toggleUserStatus(uid, currentStatus)
            if (res.success) {
                setStudents(students.map(s => s.id === uid ? { ...s, ativo: !currentStatus } : s))
            } else {
                alert(res.error)
            }
        } catch (error) {
            alert('Erro ao atualizar status')
        } finally {
            setLoadingId(null)
        }
    }

    const filteredStudents = students.filter(s => 
        s.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.email?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <div className="space-y-8">
            {/* Search Bar */}
            <div className="bg-slate-900/50 border border-white/5 p-8">
                <div className="relative max-w-md">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                    <input
                        placeholder="Buscar aluno por nome ou email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-black border border-white/10 p-4 pl-12 text-xs text-white focus:border-[#1D5F31] outline-none transition-all uppercase font-bold tracking-widest placeholder:text-slate-700"
                    />
                </div>
            </div>

            {/* List */}
            <div className="overflow-x-auto border-x border-white/5">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-y border-white/10 bg-black/40">
                            <th className="p-6 text-[10px] font-black uppercase tracking-widest text-[#1D5F31]">Aluno</th>
                            <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-500">Email</th>
                            <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-500">Status</th>
                            <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-500 text-right">Ação</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredStudents.map((student) => (
                            <tr key={student.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors group">
                                <td className="p-6">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-[#1D5F31]/10 rounded-full flex items-center justify-center text-[#1D5F31]">
                                            <UserIcon size={18} />
                                        </div>
                                        <span className="font-bold text-white uppercase italic tracking-tighter">{student.full_name || 'N/A'}</span>
                                    </div>
                                </td>
                                <td className="p-6 text-xs text-slate-400 font-bold">
                                    {student.email}
                                </td>
                                <td className="p-6">
                                    <div className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest ${student.ativo !== false ? 'text-[#1D5F31]' : 'text-rose-500'}`}>
                                        {student.ativo !== false ? <ShieldCheck size={14} /> : <ShieldAlert size={14} />}
                                        {student.ativo !== false ? 'Ativo' : 'Suspenso'}
                                    </div>
                                </td>
                                <td className="p-6 text-right">
                                    <button 
                                        onClick={() => handleToggleStatus(student.id, student.ativo ?? true)}
                                        disabled={loadingId === student.id}
                                        className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest transition-all ${
                                            student.ativo !== false 
                                            ? 'bg-rose-950/20 text-rose-500 hover:bg-rose-600 hover:text-white' 
                                            : 'bg-[#1D5F31]/20 text-[#1D5F31] hover:bg-[#1D5F31] hover:text-black'
                                        }`}
                                    >
                                        {loadingId === student.id ? <Loader2 size={14} className="animate-spin" /> : (student.ativo !== false ? 'Suspender' : 'Reativar')}
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {filteredStudents.length === 0 && (
                <div className="flex flex-col items-center justify-center py-24 bg-slate-900/10 border-2 border-dashed border-slate-800">
                    <p className="text-slate-500 font-black uppercase tracking-widest text-xs italic">Nenhum aluno encontrado</p>
                </div>
            )}
        </div>
    )
}
