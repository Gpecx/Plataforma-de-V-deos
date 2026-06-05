'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, User, BookOpen, ShieldCheck, ShieldAlert, Calendar, ExternalLink, Loader2, Medal, CheckCircle2, Shield, Map, Eye, EyeOff } from 'lucide-react'
import { getStudentDetails } from '@/app/actions/admin'

interface AcademicProgress {
    courseId: string
    courseTitle: string
    progress: number
    completedCount: number
    totalCount: number
    isConcluded: boolean
    certificateCode: string | null
    concludedAt: string | null
}

interface StudentDetails {
    uid: string
    username: string
    fullName: string
    email: string
    phone: string
    cpfCnpj: string | null
    rg: string | null
    role: string
    ativo: boolean
    createdAt: string | null | undefined
    address: {
        cep: string | null
        logradouro: string | null
        numero: string | null
        complemento: string | null
        bairro: string | null
        cidade: string | null
        uf: string | null
    }
    security: {
        mfaEnabled: boolean
        lastLogin: string | null
        emailVerified: boolean
    }
    academic: AcademicProgress[]
}

interface StudentDetailsDrawerProps {
    uid: string | null
    onClose: () => void
}

export default function StudentDetailsDrawer({ uid, onClose }: StudentDetailsDrawerProps) {
    const [loading, setLoading] = useState(false)
    const [details, setDetails] = useState<StudentDetails | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [revealCpf, setRevealCpf] = useState(false)
    const [revealRg, setRevealRg] = useState(false)

    useEffect(() => {
        if (uid) {
            fetchDetails(uid)
        }
    }, [uid])

    const fetchDetails = async (studentUid: string) => {
        setLoading(true)
        setError(null)
        try {
            const res = await getStudentDetails(studentUid)
            if (res.success && res.student) {
                setDetails(res.student)
            } else {
                setError(res.error || 'Erro ao carregar detalhes')
            }
        } catch (err) {
            setError('Falha na comunicação com o servidor')
        } finally {
            setLoading(false)
        }
    }

    const maskDocument = (value: string | null, type: 'cpf' | 'rg'): string => {
        if (!value) return ''
        const digits = value.replace(/\D/g, '')
        if (type === 'cpf' && digits.length === 11) {
            return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.***.***-$4')
        }
        if (type === 'rg' && digits.length >= 7) {
            return digits.replace(/(\d{2})(\d+)(\d{1})/, '$1.***.**-$3')
        }
        return value
    }

    const formatDocument = (value: string | null): string => {
        if (!value) return ''
        const digits = value.replace(/\D/g, '')
        if (digits.length === 11) {
            return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
        }
        return value
    }

    const EmptyField = () => <span className="text-sm font-semibold !text-slate-400 italic">Não informado</span>

    return (
        <AnimatePresence>
            {uid && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm"
                    />

                    {/* Modal Wrapper for Centering */}
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6 md:p-8 pointer-events-none">
                        {/* Modal */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                            className="relative w-full max-w-5xl max-h-[90vh] bg-white shadow-2xl overflow-y-auto font-sans pointer-events-auto rounded-2xl flex flex-col"
                        >
                            {/* Header */}
                            <div className="sticky top-0 z-10 bg-white/90 backdrop-blur-md border-b border-slate-200 p-6 md:p-8 flex items-center justify-between">
                                <div>
                                    <h2 className="text-2xl md:text-3xl font-bold !text-slate-900 tracking-tight">
                                        Detalhes do Aluno
                                    </h2>
                                    <p className="text-xs md:text-sm font-bold !text-slate-500 tracking-widest mt-1 uppercase">
                                        ID: {details?.username || uid}
                                    </p>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="p-2.5 bg-slate-100 hover:bg-slate-200 !text-slate-600 rounded-full transition-colors"
                                >
                                    <X size={24} />
                                </button>
                            </div>

                            <div className="p-6 md:p-10 space-y-12">
                                {loading ? (
                                    <div className="flex flex-col items-center justify-center py-32 gap-4">
                                        <Loader2 size={48} className="animate-spin !text-emerald-600" />
                                        <p className="text-sm font-bold uppercase tracking-widest !text-slate-500">Carregando informações premium...</p>
                                    </div>
                                ) : error ? (
                                    <div className="p-8 bg-red-50 border border-red-200 rounded-xl !text-red-900 text-center">
                                        <p className="font-bold uppercase text-sm tracking-wider">{error}</p>
                                    </div>
                                ) : details ? (
                                    <>
                                        {/* Perfil Principal */}
                                        <section className="space-y-4">
                                            <div className="flex items-center gap-3 pb-3 border-b border-slate-200">
                                                <div className="p-2.5 bg-slate-100 rounded-xl flex items-center justify-center">
                                                    <User size={22} className="!text-slate-700" />
                                                </div>
                                                <h3 className="text-xl font-bold !text-slate-900 tracking-tight">Perfil Principal</h3>
                                            </div>
                                            
                                            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 md:p-8 flex flex-col md:flex-row gap-8 shadow-sm">
                                                <div className="space-y-2 flex-1">
                                                    <label className="text-xs font-bold uppercase tracking-wider !text-slate-500">Nome Completo</label>
                                                    <p className="text-xl md:text-2xl font-bold !text-slate-900 leading-tight">{details.fullName || <EmptyField />}</p>
                                                </div>
                                                <div className="space-y-2 flex-1">
                                                    <label className="text-xs font-bold uppercase tracking-wider !text-slate-500">E-mail</label>
                                                    <div className="flex items-center gap-2">
                                                        <p className="text-lg md:text-xl font-bold !text-slate-900 leading-tight break-all">{details.email || <EmptyField />}</p>
                                                        {details.security.emailVerified ? 
                                                            <span title="E-mail Verificado" className="bg-emerald-100 !text-emerald-700 p-1 rounded-full shrink-0"><CheckCircle2 size={16} /></span> : 
                                                            <span title="E-mail não verificado" className="bg-amber-100 !text-amber-600 p-1 rounded-full shrink-0"><ShieldAlert size={16} /></span>
                                                        }
                                                    </div>
                                                </div>
                                                <div className="space-y-2 flex-1">
                                                    <label className="text-xs font-bold uppercase tracking-wider !text-slate-500">Telefone</label>
                                                    <p className="text-lg md:text-xl font-bold !text-slate-900 leading-tight whitespace-nowrap">{details.phone === 'N/A' ? <EmptyField /> : details.phone}</p>
                                                </div>
                                            </div>
                                        </section>

                                        {/* Faturamento e Localização */}
                                        <section className="space-y-4">
                                            <div className="flex items-center gap-3 pb-3 border-b border-slate-200">
                                                <div className="p-2.5 bg-slate-100 rounded-xl flex items-center justify-center">
                                                    <Map size={22} className="!text-slate-700" />
                                                </div>
                                                <h3 className="text-xl font-bold !text-slate-900 tracking-tight">Faturamento e Localização</h3>
                                            </div>
                                            
                                            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-8 shadow-sm">
                                                <div className="space-y-2">
                                                    <label className="text-xs font-bold uppercase tracking-wider !text-slate-500">Endereço Principal</label>
                                                    <p className="text-lg md:text-xl font-bold !text-slate-900 leading-tight">
                                                        {details.address.logradouro ? (
                                                            `${details.address.logradouro}, ${details.address.numero || 'S/N'}`
                                                        ) : <EmptyField />}
                                                    </p>
                                                    <p className="text-sm md:text-base !text-slate-600 font-medium">{details.address.complemento || details.address.bairro}</p>
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-xs font-bold uppercase tracking-wider !text-slate-500">Cidade / UF / CEP</label>
                                                    <p className="text-lg md:text-xl font-bold !text-slate-900 leading-tight">
                                                        {details.address.cidade ? `${details.address.cidade} - ${details.address.uf || ''}` : <EmptyField />}
                                                    </p>
                                                    <p className="text-sm md:text-base !text-slate-600 font-medium">{details.address.cep ? `CEP: ${details.address.cep}` : ''}</p>
                                                </div>
                                            </div>
                                        </section>

                                        {/* Documentos (LGPD) */}
                                        <section className="space-y-4">
                                            <div className="flex items-center gap-3 pb-3 border-b border-slate-200">
                                                <div className="p-2.5 bg-slate-100 rounded-xl flex items-center justify-center">
                                                    <Shield size={22} className="!text-slate-700" />
                                                </div>
                                                <h3 className="text-xl font-bold !text-slate-900 tracking-tight">Documentos</h3>
                                            </div>
                                            
                                            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-8 shadow-sm">
                                                <div className="space-y-2">
                                                    <label className="text-xs font-bold uppercase tracking-wider !text-slate-500">CPF</label>
                                                    <div className="flex items-center gap-2">
                                                        <p className="text-lg md:text-xl font-bold !text-slate-900 leading-tight font-mono">
                                                            {details.cpfCnpj ? (revealCpf ? formatDocument(details.cpfCnpj) : maskDocument(details.cpfCnpj, 'cpf')) : <EmptyField />}
                                                        </p>
                                                        {details.cpfCnpj && (
                                                            <button onClick={() => setRevealCpf(!revealCpf)} className="p-1.5 !text-slate-400 hover:!text-slate-700 transition-colors">
                                                                {revealCpf ? <EyeOff size={16} /> : <Eye size={16} />}
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-xs font-bold uppercase tracking-wider !text-slate-500">RG</label>
                                                    <div className="flex items-center gap-2">
                                                        <p className="text-lg md:text-xl font-bold !text-slate-900 leading-tight font-mono">
                                                            {details.rg ? (revealRg ? details.rg : maskDocument(details.rg, 'rg')) : <EmptyField />}
                                                        </p>
                                                        {details.rg && (
                                                            <button onClick={() => setRevealRg(!revealRg)} className="p-1.5 !text-slate-400 hover:!text-slate-700 transition-colors">
                                                                {revealRg ? <EyeOff size={16} /> : <Eye size={16} />}
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </section>

                                        {/* Status e Segurança */}
                                        <section className="space-y-4">
                                            <div className="flex items-center gap-3 pb-3 border-b border-slate-200">
                                                <div className="p-2.5 bg-slate-100 rounded-xl flex items-center justify-center">
                                                    <Shield size={22} className="!text-slate-700" />
                                                </div>
                                                <h3 className="text-xl font-bold !text-slate-900 tracking-tight">Status e Segurança</h3>
                                            </div>
                                            
                                            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 md:p-8 grid grid-cols-1 md:grid-cols-3 gap-8 shadow-sm">
                                                <div className="space-y-2">
                                                    <label className="text-xs font-bold uppercase tracking-wider !text-slate-500">MFA (2FA)</label>
                                                    <div>
                                                        <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold border shadow-sm ${details.security.mfaEnabled ? 'bg-emerald-50 border-emerald-200 !text-emerald-700' : 'bg-red-50 border-red-200 !text-red-700'}`}>
                                                            {details.security.mfaEnabled ? <ShieldCheck size={18} /> : <ShieldAlert size={18} />}
                                                            {details.security.mfaEnabled ? 'PROTEGIDO' : 'VULNERÁVEL'}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-xs font-bold uppercase tracking-wider !text-slate-500">Último Acesso</label>
                                                    <div className="flex items-center gap-2 text-lg md:text-xl font-bold !text-slate-900">
                                                        <Calendar size={22} className="!text-slate-400" />
                                                        {details.security.lastLogin ? new Date(details.security.lastLogin).toLocaleString('pt-BR') : 'N/A'}
                                                    </div>
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-xs font-bold uppercase tracking-wider !text-slate-500">Data de Cadastro</label>
                                                    <div className="flex items-center gap-2 text-lg md:text-xl font-bold !text-slate-900">
                                                        <Calendar size={22} className="!text-slate-400" />
                                                        {details.createdAt ? new Date(details.createdAt).toLocaleDateString('pt-BR') : 'N/A'}
                                                    </div>
                                                </div>
                                            </div>
                                        </section>

                                        {/* Jornada Acadêmica */}
                                        <section className="space-y-4 pb-8">
                                            <div className="flex items-center gap-3 pb-3 border-b border-slate-200">
                                                <div className="p-2.5 bg-slate-100 rounded-xl flex items-center justify-center">
                                                    <BookOpen size={22} className="!text-slate-700" />
                                                </div>
                                                <h3 className="text-xl font-bold !text-slate-900 tracking-tight">Jornada Acadêmica</h3>
                                            </div>

                                            <div className="space-y-6">
                                                {details.academic.length === 0 ? (
                                                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-12 text-center flex flex-col items-center gap-4">
                                                        <div className="p-4 bg-slate-100 rounded-full flex items-center justify-center">
                                                            <BookOpen size={40} className="!text-slate-400" />
                                                        </div>
                                                        <p className="text-sm font-bold !text-slate-500 uppercase tracking-widest">Nenhuma matrícula ativa</p>
                                                    </div>
                                                ) : (
                                                    details.academic.map((item) => (
                                                        <div key={item.courseId} className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 hover:shadow-lg hover:border-slate-300 transition-all duration-300 group">
                                                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                                                                <div className="space-y-2">
                                                                    <h4 className="text-xl md:text-2xl font-bold !text-slate-900 tracking-tight group-hover:!text-emerald-700 transition-colors">
                                                                        {item.courseTitle}
                                                                    </h4>
                                                                    <p className="text-sm font-bold !text-slate-500 uppercase tracking-widest">
                                                                        {item.completedCount} de {item.totalCount} aulas concluídas
                                                                    </p>
                                                                </div>
                                                                {item.isConcluded && (
                                                                    <div className="flex flex-col items-end gap-2">
                                                                        <div className="bg-emerald-50 !text-emerald-700 border border-emerald-200 text-xs font-bold px-4 py-2 rounded-full flex items-center gap-2 shadow-sm">
                                                                            <CheckCircle2 size={16} />
                                                                            CONCLUÍDO
                                                                        </div>
                                                                        {item.certificateCode && (
                                                                            <a 
                                                                                href={`/certificate/${item.certificateCode}`}
                                                                                target="_blank"
                                                                                className="flex items-center gap-1.5 text-xs font-bold !text-emerald-700 hover:!text-emerald-800 hover:underline transition-colors mt-2"
                                                                            >
                                                                                <Medal size={16} />
                                                                                VER CERTIFICADO
                                                                                <ExternalLink size={14} />
                                                                            </a>
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </div>
                                                            
                                                            {/* Progress Bar */}
                                                            <div className="relative h-8 bg-slate-100 rounded-full overflow-hidden border border-slate-200 shadow-inner">
                                                                <motion.div 
                                                                    initial={{ width: 0 }}
                                                                    animate={{ width: `${item.progress}%` }}
                                                                    transition={{ duration: 1, ease: 'easeOut' }}
                                                                    className="absolute inset-y-0 left-0 bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full"
                                                                />
                                                                <span className={`absolute inset-0 flex items-center justify-center text-sm font-bold ${item.progress > 50 ? '!text-white' : '!text-slate-700'}`}>
                                                                    {item.progress}%
                                                                </span>
                                                            </div>
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                        </section>
                                    </>
                                ) : null}
                            </div>
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>
    )
}
