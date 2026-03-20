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
        <div className="space-y-10 font-exo mb-12">
            {/* Search Bar Container */}
            <div className="bg-white p-10 rounded-[32px] border border-slate-200 shadow-sm">
                <div className="relative max-w-xl group">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#1D5F31] transition-colors" size={18} />
                    <input
                        placeholder="Buscar aluno por nome ou email corporativo..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-14 py-5 text-[10px] text-slate-900 focus:border-[#1D5F31]/30 focus:bg-white outline-none transition-all font-black uppercase tracking-[2px] placeholder:text-slate-400 shadow-inner"
                    />
                </div>
            </div>

            {/* List Container */}
            <div className="bg-white rounded-[40px] border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-50 bg-slate-50/30">
                                <th className="p-8 text-[10px] font-black uppercase tracking-widest text-slate-600">Identificação</th>
                                <th className="p-8 text-[10px] font-black uppercase tracking-widest text-slate-600">Status Firewall</th>
                                <th className="p-8 text-[10px] font-black uppercase tracking-widest text-slate-600 text-right">Diretrizes</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {filteredStudents.map((student) => (
                                <tr key={student.id} className="group hover:bg-slate-50/50 transition-colors">
                                    <td className="p-8">
                                        <div className="flex items-center gap-6">
                                            <div className="w-12 h-12 bg-slate-900 rounded-full flex items-center justify-center text-white border-2 border-white shadow-lg">
                                                <UserIcon size={20} strokeWidth={2.5} />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="font-black text-slate-900 uppercase tracking-tight text-[13px] group-hover:text-[#1D5F31] transition-colors">{student.full_name || 'N/A'}</span>
                                                <span className="text-[10px] text-slate-600 font-bold tracking-widest uppercase italic mt-1">{student.email}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-8">
                                        <div className={`inline-flex items-center gap-2.5 px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest shadow-sm ${student.ativo !== false ? 'bg-[#1D5F31] text-white' : 'bg-rose-500 text-white'}`}>
                                            {student.ativo !== false ? <ShieldCheck size={14} strokeWidth={3} /> : <ShieldAlert size={14} strokeWidth={3} />}
                                            {student.ativo !== false ? 'ACESSO ATIVO' : 'SISTEMA SUSPENSO'}
                                        </div>
                                    </td>
                                    <td className="p-8 text-right">
                                        <button 
                                            onClick={() => handleToggleStatus(student.id, student.ativo ?? true)}
                                            disabled={loadingId === student.id}
                                            className={`min-w-[120px] px-6 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all shadow-sm border ${
                                                student.ativo !== false 
                                                ? 'bg-white text-rose-500 border-rose-100 hover:bg-rose-500 hover:text-white hover:border-rose-500' 
                                                : 'bg-white text-[#1D5F31] border-[#1D5F31]/10 hover:bg-[#1D5F31] hover:text-white hover:border-[#1D5F31]'
                                            }`}
                                        >
                                            {loadingId === student.id ? <Loader2 size={16} className="animate-spin mx-auto" /> : (student.ativo !== false ? 'SUSPENDER' : 'REATIVAR ABA')}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {filteredStudents.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-32 bg-slate-50/50">
                        <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-inner border border-slate-100 mb-6">
                            <Search size={32} className="text-slate-400" />
                        </div>
                        <p className="text-slate-600 font-black uppercase tracking-[4px] text-[10px] italic">Protocolo de busca: Nenhum registro localizado</p>
                    </div>
                )}
            </div>
        </div>
    )
}
