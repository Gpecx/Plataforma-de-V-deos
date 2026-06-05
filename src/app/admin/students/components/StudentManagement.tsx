'use client'

import { useState, useEffect, useMemo } from 'react'
import { Search, User as UserIcon, Loader2, ShieldCheck, ShieldAlert, ChevronRight, BookOpen, Clock, Medal } from 'lucide-react'
import { toggleUserStatus, getStudentsPaginated } from '@/app/actions/admin'
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
import { normalizeString } from '@/lib/utils'

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
    person_type?: string | null
    cpf_cnpj?: string | null
    razao_social?: string | null
}

type TabType = 'cpf' | 'cnpj'

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

function maskDoc(value: string | null | undefined, isCnpj: boolean): string {
    if (!value) return ''
    const digits = value.replace(/\D/g, '')
    if (isCnpj && digits.length === 14) {
        return digits.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.***.***/****-$5')
    }
    if (!isCnpj && digits.length === 11) {
        return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.***.***-$4')
    }
    return value
}

export default function StudentManagement() {
    const [activeTab, setActiveTab] = useState<TabType>('cpf')
    const [studentsByTab, setStudentsByTab] = useState<Record<TabType, Student[]>>({ cpf: [], cnpj: [] })
    const [pagesByTab, setPagesByTab] = useState<Record<TabType, number>>({ cpf: 0, cnpj: 0 })
    const [hasMoreByTab, setHasMoreByTab] = useState<Record<TabType, boolean>>({ cpf: true, cnpj: true })
    const [loadingTab, setLoadingTab] = useState<TabType | null>(null)
    const [initialLoading, setInitialLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [loadingId, setLoadingId] = useState<string | null>(null)
    const [selectedStudentUid, setSelectedStudentUid] = useState<string | null>(null)
    const [alertOpen, setAlertOpen] = useState(false)
    const [pendingToggle, setPendingToggle] = useState<{ uid: string; currentStatus: boolean } | null>(null)

    const fetchTab = async (tab: TabType, page: number, append: boolean) => {
        setLoadingTab(tab)
        try {
            const personType = tab === 'cpf' ? 'CPF' : 'CNPJ'
            const res = await getStudentsPaginated({ personType, page, pageSize: 15 })
            setStudentsByTab(prev => ({
                ...prev,
                [tab]: append ? [...prev[tab], ...res.students] : res.students
            }))
            setHasMoreByTab(prev => ({ ...prev, [tab]: res.hasMore }))
            setPagesByTab(prev => ({ ...prev, [tab]: page }))
        } catch (error) {
            console.error('Error fetching tab:', error)
        } finally {
            setLoadingTab(null)
            setInitialLoading(false)
        }
    }

    useEffect(() => {
        fetchTab('cpf', 0, false)
    }, [])

    const handleTabChange = (tab: TabType) => {
        setActiveTab(tab)
        setSearchTerm('')
        if (studentsByTab[tab].length === 0 && hasMoreByTab[tab]) {
            fetchTab(tab, 0, false)
        }
    }

    const handleLoadMore = () => {
        const nextPage = pagesByTab[activeTab] + 1
        fetchTab(activeTab, nextPage, true)
    }

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
                setStudentsByTab(prev => {
                    const updated = { ...prev }
                    ;(['cpf', 'cnpj'] as TabType[]).forEach(tab => {
                        updated[tab] = updated[tab].map(s => s.uid === uid ? { ...s, ativo: !currentStatus } : s)
                    })
                    return updated
                })
            } else {
                alert(res.error)
            }
        } catch (error) {
            alert('Erro ao atualizar status')
        } finally {
            setLoadingId(null)
        }
    }

    const currentStudents = studentsByTab[activeTab]
    const filteredStudents = currentStudents.filter(s =>
        s.full_name && normalizeString(s.full_name).includes(normalizeString(searchTerm)) ||
        s.email && normalizeString(s.email).includes(normalizeString(searchTerm)) ||
        activeTab === 'cnpj' && s.razao_social && normalizeString(s.razao_social).includes(normalizeString(searchTerm))
    )

    return (
        <div className="space-y-6 font-montserrat">
            {/* Tabs */}
            <div className="flex gap-0 border-b-2" style={{ borderColor: '#e2e8f0' }}>
                <button
                    onClick={() => handleTabChange('cpf')}
                    className="px-6 py-3 text-[10px] font-bold uppercase tracking-wider transition-all border-b-2 -mb-[2px]"
                    style={{
                        color: activeTab === 'cpf' ? '#1D5F31' : '#64748b',
                        borderColor: activeTab === 'cpf' ? '#1D5F31' : 'transparent',
                    }}
                >
                    Pessoa Física (CPF)
                </button>
                <button
                    onClick={() => handleTabChange('cnpj')}
                    className="px-6 py-3 text-[10px] font-bold uppercase tracking-wider transition-all border-b-2 -mb-[2px]"
                    style={{
                        color: activeTab === 'cnpj' ? '#1D5F31' : '#64748b',
                        borderColor: activeTab === 'cnpj' ? '#1D5F31' : 'transparent',
                    }}
                >
                    Empresas / PJ (CNPJ)
                </button>
            </div>

            {/* Search Card */}
            <div className="p-6 rounded-none border-2" style={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0' }}>
                <div className="relative max-w-xl">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2" size={18} style={{ color: '#64748b' }} />
                    <input
                        placeholder={activeTab === 'cpf' ? 'BUSCAR ALUNO POR NOME OU E-MAIL...' : 'BUSCAR EMPRESA POR RAZÃO SOCIAL, NOME OU E-MAIL...'}
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
                            <th className="p-6 text-[10px] font-bold uppercase tracking-wider text-left" style={{ color: '#fff' }}>
                                {activeTab === 'cnpj' ? 'INSTITUCIONAL (CNPJ)' : 'INSTITUCIONAL'}
                            </th>
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
                        {initialLoading ? (
                            Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
                        ) : filteredStudents.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="p-16 text-center">
                                    <div className="flex flex-col items-center gap-4">
                                        <Search size={48} style={{ color: '#cbd5e1' }} />
                                        <p className="font-bold uppercase tracking-wider text-[10px]" style={{ color: '#64748b' }}>
                                            {currentStudents.length === 0 && loadingTab === activeTab
                                                ? 'Carregando...'
                                                : 'Nenhum registro localizado'}
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
                                                    {activeTab === 'cnpj' && student.razao_social ? student.razao_social : student.full_name || 'N/A'}
                                                </span>
                                                <span className="text-[10px] font-bold uppercase tracking-wider mt-1" style={{ color: '#64748b' }}>
                                                    {activeTab === 'cnpj' && student.cpf_cnpj
                                                        ? maskDoc(student.cpf_cnpj, true)
                                                        : activeTab === 'cpf' && student.cpf_cnpj
                                                            ? maskDoc(student.cpf_cnpj, false)
                                                            : student.email
                                                    }
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

            {/* Load More */}
            {hasMoreByTab[activeTab] && !initialLoading && filteredStudents.length > 0 && (
                <div className="flex justify-center pt-2 pb-4">
                    <button
                        onClick={handleLoadMore}
                        disabled={loadingTab === activeTab}
                        className="px-8 py-3 text-[10px] font-bold uppercase tracking-wider border-2 transition-all active:scale-95 disabled:opacity-50"
                        style={{
                            backgroundColor: '#ffffff',
                            borderColor: '#e2e8f0',
                            color: '#0f172a',
                        }}
                    >
                        {loadingTab === activeTab ? (
                            <span className="flex items-center gap-2">
                                <Loader2 size={14} className="animate-spin" />
                                CARREGANDO...
                            </span>
                        ) : (
                            'CARREGAR MAIS ALUNOS'
                        )}
                    </button>
                </div>
            )}

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