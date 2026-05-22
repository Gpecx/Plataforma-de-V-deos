'use client'

import { useState } from 'react'
import { Search, User as UserIcon, Loader2, ShieldCheck, ShieldAlert, ChevronRight, BookOpen, Clock, Medal } from 'lucide-react'
import { toggleUserStatus } from '@/app/actions/admin'
import StudentDetailsDrawer from './StudentDetailsDrawer'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog'

interface Student {
    id: string
    uid: string
    full_name?: string
    email?: string
    ativo?: boolean
    coursesCount: number
    certificatesCount: number
    watchedTime: number
    lastAccess?: string
    createdAt?: string
}

interface StudentManagementProps {
    initialStudents: Student[]
}

function SkeletonRow() {
    return (
        <tr className="border-b" style={{ borderColor: '#e2e8f0' }}>
            <td className="p-6">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full animate-pulse" style={{ backgroundColor: '#e2e8f0' }} />
                    <div className="space-y-2">
                        <div className="h-4 w-32 rounded animate-pulse" style={{ backgroundColor: '#e2e8f0' }} />
                        <div className="h-3 w-48 rounded animate-pulse" style={{ backgroundColor: '#e2e8f0' }} />
                    </div>
                </div>
            </td>
            <td className="p-6">
                <div className="h-5 w-12 rounded animate-pulse" style={{ backgroundColor: '#e2e8f0' }} />
            </td>
            <td className="p-6">
                <div className="h-5 w-12 rounded animate-pulse" style={{ backgroundColor: '#e2e8f0' }} />
            </td>
            <td className="p-6">
                <div className="h-5 w-16 rounded animate-pulse" style={{ backgroundColor: '#e2e8f0' }} />
            </td>
            <td className="p-6">
                <div className="h-6 w-20 rounded-full animate-pulse" style={{ backgroundColor: '#e2e8f0' }} />
            </td>
            <td className="p-6 text-right">
                <div className="h-10 w-10 rounded-lg animate-pulse ml-auto" style={{ backgroundColor: '#e2e8f0' }} />
            </td>
        </tr>
    )
}

export default function StudentManagement({ initialStudents }: StudentManagementProps) {
    const [students, setStudents] = useState<Student[]>(initialStudents)
    const [searchTerm, setSearchTerm] = useState('')
    const [loadingId, setLoadingId] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [selectedStudentUid, setSelectedStudentUid] = useState<string | null>(null)
    const [alertOpen, setAlertOpen] = useState(false)
    const [pendingToggle, setPendingToggle] = useState<{ uid: string; currentStatus: boolean } | null>(null)

    const handleToggleStatus = (uid: string, currentStatus: boolean) => {
        setPendingToggle({ uid, currentStatus })
        setAlertOpen(true)
    }

    const handleConfirmToggle = async () => {
        if (!pendingToggle) return
        const { uid, currentStatus } = pendingToggle
        setLoadingId(uid)
        setAlertOpen(false)
        setPendingToggle(null)
        try {
            const res = await toggleUserStatus(uid, currentStatus)
            if (res.success) {
                setStudents(students.map(s => s.uid === uid ? { ...s, ativo: !currentStatus } : s))
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
        <div className="space-y-6 font-montserrat">
            {/* Search Card */}
            <div className="p-6 rounded-none border-2" style={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0' }}>
                <div className="relative max-w-xl">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2" size={18} style={{ color: '#64748b' }} />
                    <input
                        placeholder="BUSCAR ALUNO POR NOME OU E-MAIL..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full border rounded-none px-12 py-4 text-[10px] outline-none transition-all font-bold uppercase tracking-wider"
                        style={{ 
                            backgroundColor: '#f8fafc', 
                            borderColor: '#e2e8f0',
                            color: '#0f172a'
                        }}
                    />
                </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto rounded-none border-2" style={{ borderColor: '#e2e8f0', backgroundColor: '#fff' }}>
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr style={{ backgroundColor: '#0f172a' }}>
                            <th className="p-6 text-[10px] font-bold uppercase tracking-wider text-left" style={{ color: '#fff' }}>Institucional</th>
                            <th className="p-6 text-[10px] font-bold uppercase tracking-wider text-left" style={{ color: '#fff' }}>
                                <div className="flex items-center gap-2">
                                    <BookOpen size={14} />
                                    CURSOS
                                </div>
                            </th>
                            <th className="p-6 text-[10px] font-bold uppercase tracking-wider text-left" style={{ color: '#fff' }}>
                                <div className="flex items-center gap-2">
                                    <Medal size={14} />
                                    CERTIFICADOS
                                </div>
                            </th>
                            <th className="p-6 text-[10px] font-bold uppercase tracking-wider text-left" style={{ color: '#fff' }}>
                                <div className="flex items-center gap-2">
                                    <Clock size={14} />
                                    TEMPO
                                </div>
                            </th>
                            <th className="p-6 text-[10px] font-bold uppercase tracking-wider text-left" style={{ color: '#fff' }}>Status</th>
                            <th className="p-6 text-[10px] font-bold uppercase tracking-wider text-right" style={{ color: '#fff' }}>Ação</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
                        ) : filteredStudents.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="p-16 text-center">
                                    <div className="flex flex-col items-center gap-4">
                                        <Search size={48} style={{ color: '#cbd5e1' }} />
                                        <p className="font-bold uppercase tracking-wider text-[10px]" style={{ color: '#64748b' }}>
                                            Nenhum registro localizado
                                        </p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            filteredStudents.map((student) => (
                                <tr 
                                    key={student.id}
                                    className="border-b transition-all duration-300 hover:shadow-xl"
                                    style={{ borderColor: '#e2e8f0', backgroundColor: '#ffffff' }}
                                >
                                    <td className="p-6">
                                        <div className="flex items-center gap-4">
                                            <button 
                                                onClick={() => setSelectedStudentUid(student.uid)}
                                                className="w-12 h-12 rounded-full flex items-center justify-center transition-all hover:scale-110 active:scale-95 group relative" 
                                                style={{ backgroundColor: '#f1f5f9', border: '1px solid #e2e8f0' }}
                                                title="Ver perfil completo"
                                            >
                                                <UserIcon size={20} className="group-hover:text-[#1D5F31] transition-colors" style={{ color: '#1D5F31' }} />
                                                <div className="absolute inset-0 rounded-full border-2 border-transparent group-hover:border-[#1D5F31] transition-all" />
                                            </button>
                                            <div className="flex flex-col cursor-pointer" onClick={() => setSelectedStudentUid(student.uid)}>
                                                <span className="font-bold uppercase tracking-tight text-sm hover:text-[#1D5F31] transition-colors" style={{ color: '#0f172a' }}>
                                                    {student.full_name || 'N/A'}
                                                </span>
                                                <span className="text-[10px] font-bold uppercase tracking-wider mt-1" style={{ color: '#64748b' }}>
                                                    {student.email}
                                                </span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-6">
                                        <span className="text-sm font-bold" style={{ color: '#334155' }}>
                                            {student.coursesCount || 0}
                                        </span>
                                    </td>
                                    <td className="p-6">
                                        <div 
                                            className="text-sm font-bold flex items-center gap-2" 
                                            style={{ color: '#0f172a' }}
                                            title="Cursos concluídos com certificado emitido"
                                        >
                                            {student.certificatesCount || 0}
                                            {student.certificatesCount > 0 && (
                                                <Medal size={14} style={{ color: '#1D5F31' }} />
                                            )}
                                        </div>
                                    </td>
                                    <td className="p-6">
                                        <span className="text-sm font-bold" style={{ color: '#334155' }}>
                                            {(() => {
                                                const totalSeconds = Number(student.watchedTime) || 0;
                                                const totalMinutes = Math.floor(totalSeconds / 60);
                                                const hours = Math.floor(totalMinutes / 60);
                                                const minutes = totalMinutes % 60;
                                                return hours > 0 ? `${hours}h ${minutes}min` : `${totalMinutes}min`;
                                            })()}
                                        </span>
                                    </td>
                                    <td className="p-6">
                                        <div 
                                            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-wider"
                                            style={{ 
                                                backgroundColor: student.ativo !== false ? '#dcfce7' : '#fee2e2',
                                                color: student.ativo !== false ? '#166534' : '#991b1b'
                                            }}
                                        >
                                            {student.ativo !== false ? (
                                                <>
                                                    <ShieldCheck size={12} />
                                                    ATIVO
                                                </>
                                            ) : (
                                                <>
                                                    <ShieldAlert size={12} />
                                                    INATIVO
                                                </>
                                            )}
                                        </div>
                                    </td>
                                    <td className="p-6 text-right">
                                        <button 
                                            onClick={() => handleToggleStatus(student.uid, student.ativo ?? true)}
                                            disabled={loadingId === student.uid}
                                            className="w-10 h-10 rounded-none flex items-center justify-center transition-all active:scale-95"
                                            style={{ 
                                                backgroundColor: student.ativo !== false ? '#f1f5f9' : '#dcfce7',
                                                border: '1px solid #e2e8f0'
                                            }}
                                        >
                                            {loadingId === student.uid ? (
                                                <Loader2 size={16} className="animate-spin" style={{ color: '#64748b' }} />
                                            ) : (
                                                <ChevronRight size={16} style={{ color: '#64748b' }} />
                                            )}
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <StudentDetailsDrawer 
                uid={selectedStudentUid} 
                onClose={() => setSelectedStudentUid(null)} 
            />

            <AlertDialog open={alertOpen} onOpenChange={setAlertOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Confirmar Ação</AlertDialogTitle>
                        <AlertDialogDescription>
                            {pendingToggle?.currentStatus
                                ? "Deseja realmente desativar este aluno? Ele perderá o acesso imediato à plataforma."
                                : "Deseja realmente ativar este aluno? Ele recuperará o acesso à plataforma."}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleConfirmToggle}
                            style={{ backgroundColor: '#1D5F31' }}
                            className="text-white hover:brightness-110"
                        >
                            {pendingToggle?.currentStatus ? 'Desativar' : 'Ativar'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
