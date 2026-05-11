'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, User, Mail, Phone, MapPin, BookOpen, ShieldCheck, ShieldAlert, Calendar, ExternalLink, Loader2, Medal, CheckCircle2 } from 'lucide-react'
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

    const EmptyField = () => <span className="text-[10px] font-bold text-amber-700 italic">Não informado</span>

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
                        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
                    />

                    {/* Modal Wrapper for Centering */}
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6 pointer-events-none">
                        {/* Modal */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                            className="relative w-full max-w-4xl max-h-[90vh] bg-white shadow-2xl border-t-8 border-black overflow-y-auto font-montserrat pointer-events-auto rounded-none"
                        >
                            {/* Header */}
                            <div className="sticky top-0 z-10 bg-white border-b-2 border-gray-200 p-6 flex items-center justify-between">
                                <div>
                                    <h2 className="text-2xl font-black uppercase tracking-tighter !text-black">
                                        Detalhes do Aluno
                                    </h2>
                                    <p className="text-[10px] font-bold !text-gray-900 uppercase tracking-widest mt-1">
                                        ID: {details?.username || uid}
                                    </p>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="p-2 hover:bg-gray-100 transition-colors rounded-none border border-transparent hover:border-gray-300"
                                >
                                    <X size={24} className="!text-black" />
                                </button>
                            </div>

                            <div className="p-8 space-y-10">
                                {loading ? (
                                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                                        <Loader2 size={40} className="animate-spin !text-black" />
                                        <p className="text-[10px] font-bold uppercase tracking-widest !text-black">Carregando informações...</p>
                                    </div>
                                ) : error ? (
                                    <div className="p-6 bg-red-50 border-2 border-red-200 text-red-900">
                                        <p className="font-bold uppercase text-xs">{error}</p>
                                    </div>
                                ) : details ? (
                                    <>
                                        {/* Perfil e Segurança */}
                                        <section className="space-y-6">
                                            <div className="flex items-center gap-2 border-b-2 border-black pb-2">
                                                <User size={18} className="!text-black" />
                                                <h3 className="font-black uppercase tracking-tight text-sm !text-black">Dados Cadastrais</h3>
                                            </div>
                                            
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div className="space-y-1">
                                                    <label className="text-[9px] font-black !text-black uppercase">Nome Completo</label>
                                                    <p className="font-bold text-sm !text-black">{details.fullName || <EmptyField />}</p>
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-[9px] font-black !text-black uppercase">E-mail</label>
                                                    <div className="flex items-center gap-2">
                                                        <p className="font-bold text-sm !text-black">{details.email || <EmptyField />}</p>
                                                        {details.security.emailVerified ? 
                                                            <span title="E-mail Verificado"><CheckCircle2 size={14} className="text-green-700" /></span> : 
                                                            <span title="E-mail não verificado"><ShieldAlert size={14} className="text-amber-600" /></span>
                                                        }
                                                    </div>
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-[9px] font-black !text-black uppercase">Telefone</label>
                                                    <p className="font-bold text-sm !text-black">{details.phone === 'N/A' ? <EmptyField /> : details.phone}</p>
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-[9px] font-black !text-black uppercase">Status MFA (2FA)</label>
                                                    <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-[9px] font-black rounded-none border ${details.security.mfaEnabled ? 'bg-green-50 border-green-200 text-green-900' : 'bg-red-50 border-red-200 text-red-900'}`}>
                                                        {details.security.mfaEnabled ? <ShieldCheck size={10} /> : <ShieldAlert size={10} />}
                                                        {details.security.mfaEnabled ? 'PROTEGIDO' : 'VULNERÁVEL'}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="p-4 bg-gray-50 border border-gray-300 space-y-3">
                                                <div className="flex items-center gap-2 !text-black">
                                                    <MapPin size={14} />
                                                    <span className="text-[10px] font-black uppercase !text-black">Endereço de Faturamento</span>
                                                </div>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <p className="text-[11px] font-bold !text-black">
                                                            {details.address.logradouro ? (
                                                                `${details.address.logradouro}, ${details.address.numero || 'S/N'}`
                                                            ) : <EmptyField />}
                                                        </p>
                                                        <p className="text-[10px] font-bold !text-gray-800">{details.address.complemento || details.address.bairro}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-[11px] font-bold !text-black">
                                                            {details.address.cidade ? `${details.address.cidade} - ${details.address.uf || ''}` : <EmptyField />}
                                                        </p>
                                                        <p className="text-[10px] font-bold !text-gray-800">{details.address.cep ? `CEP: ${details.address.cep}` : ''}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </section>

                                        {/* Acadêmico */}
                                        <section className="space-y-6">
                                            <div className="flex items-center gap-2 border-b-2 border-black pb-2">
                                                <BookOpen size={18} className="!text-black" />
                                                <h3 className="font-black uppercase tracking-tight text-sm !text-black">Jornada Acadêmica</h3>
                                            </div>

                                            <div className="space-y-4">
                                                {details.academic.length === 0 ? (
                                                    <div className="p-8 text-center border-2 border-dashed border-gray-300">
                                                        <p className="text-[10px] font-bold !text-black uppercase">Nenhuma matrícula ativa</p>
                                                    </div>
                                                ) : (
                                                    details.academic.map((item) => (
                                                        <div key={item.courseId} className="p-5 border-2 border-gray-200 hover:border-black transition-all group">
                                                            <div className="flex justify-between items-start mb-4">
                                                                <div className="space-y-1">
                                                                    <h4 className="font-black text-sm uppercase tracking-tight !text-black group-hover:!text-green-800 transition-colors">
                                                                        {item.courseTitle}
                                                                    </h4>
                                                                    <p className="text-[9px] font-bold !text-gray-800 uppercase">
                                                                        {item.completedCount} de {item.totalCount} aulas concluídas
                                                                    </p>
                                                                </div>
                                                                {item.isConcluded && (
                                                                    <div className="flex flex-col items-end gap-2">
                                                                        <div className="bg-green-100 text-green-900 border border-green-300 text-[9px] font-black px-2 py-1 flex items-center gap-1">
                                                                            <CheckCircle2 size={10} />
                                                                            CONCLUÍDO
                                                                        </div>
                                                                        {item.certificateCode && (
                                                                            <a 
                                                                                href={`/certificate/${item.certificateCode}`}
                                                                                target="_blank"
                                                                                className="flex items-center gap-1 text-[9px] font-black text-green-800 hover:underline"
                                                                            >
                                                                                <Medal size={10} />
                                                                                VER CERTIFICADO
                                                                                <ExternalLink size={10} />
                                                                            </a>
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </div>
                                                            
                                                            {/* Progress Bar */}
                                                            <div className="relative h-4 bg-gray-200 overflow-hidden border border-gray-300">
                                                                <motion.div 
                                                                    initial={{ width: 0 }}
                                                                    animate={{ width: `${item.progress}%` }}
                                                                    className="absolute inset-y-0 left-0 bg-black"
                                                                />
                                                                <span className="absolute inset-0 flex items-center justify-center text-[9px] font-black mix-blend-difference text-white">
                                                                    {item.progress}%
                                                                </span>
                                                            </div>
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                        </section>

                                        {/* Footer Info */}
                                        <div className="pt-10 border-t border-gray-200 flex flex-col gap-2">
                                            <div className="flex items-center gap-2 !text-black">
                                                <Calendar size={14} />
                                                <span className="text-[10px] font-bold uppercase !text-black">Último Acesso: {details.security.lastLogin ? new Date(details.security.lastLogin).toLocaleString('pt-BR') : 'N/A'}</span>
                                            </div>
                                            <div className="flex items-center gap-2 !text-black">
                                                <Calendar size={14} />
                                                <span className="text-[10px] font-bold uppercase !text-black">Cadastro em: {details.createdAt ? new Date(details.createdAt).toLocaleDateString('pt-BR') : 'N/A'}</span>
                                            </div>
                                        </div>
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
