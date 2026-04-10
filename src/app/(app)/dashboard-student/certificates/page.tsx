"use client"

import { useState } from 'react'
import { Award, Lock, BookOpen, Download, ExternalLink, Calendar, CheckCircle } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { ICertificate } from '@/lib/types/certificate'

const mockCertificates: ICertificate[] = [
    {
        id: 'cert-001',
        userId: 'user-123',
        courseId: 'course-abc',
        courseTitle: 'Gestão Estratégica de Vendas',
        studentName: 'João Silva',
        instructorName: 'Fred',
        issueDate: '2026-03-15T10:30:00Z',
        verificationCode: 'PP-2026-A3F2B1',
        percentage: 100,
        status: 'issued'
    },
    {
        id: 'cert-002',
        userId: 'user-123',
        courseId: 'course-def',
        courseTitle: 'Marketing Digital Avançado',
        studentName: 'João Silva',
        instructorName: 'Fred',
        issueDate: '2026-02-20T14:45:00Z',
        verificationCode: 'PP-2026-C4D9E2',
        percentage: 100,
        status: 'issued'
    },
    {
        id: 'cert-003',
        userId: 'user-123',
        courseId: 'course-ghi',
        courseTitle: 'Liderança e Gestão de Equipes',
        studentName: 'João Silva',
        instructorName: 'Fred',
        issueDate: '2026-01-10T09:00:00Z',
        verificationCode: 'PP-2026-7F1A3C',
        percentage: 100,
        status: 'issued'
    }
]

async function downloadCertificate(courseId: string) {
    try {
        const response = await fetch(`/api/certificates/${courseId}/download`, {
            method: 'GET',
        })

        if (!response.ok) {
            const errorText = await response.text()
            throw new Error(errorText || 'Erro ao baixar certificado')
        }

        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `certificado-powerplay-${courseId}.pdf`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)

        toast.success('Certificado baixado com sucesso!')
    } catch (error: any) {
        console.error('Error downloading certificate:', error)
        toast.error(error.message || 'Erro ao baixar certificado')
    }
}

function openPreview(courseId: string) {
    window.open(`/api/certificates/${courseId}/preview`, '_blank')
}

export default function CertificatesPage() {
    const [downloadingId, setDownloadingId] = useState<string | null>(null)
    const hasCertificates = mockCertificates.length > 0

    const handleDownload = async (courseId: string) => {
        setDownloadingId(courseId)
        await downloadCertificate(courseId)
        setDownloadingId(null)
    }

    return (
        <div className="p-8 md:p-12 min-h-screen font-montserrat text-black bg-transparent animate-in fade-in duration-500">
            <header className="mb-12">
                <div className="flex items-center gap-3 mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-[5px] text-[#1D5F31]">CONQUISTAS</span>
                </div>
                <h1 className="text-4xl font-bold tracking-tighter text-[#061629] uppercase">
                    MEUS <span className="text-[#1D5F31]">CERTIFICADOS</span>
                </h1>
                <p className="text-slate-400 font-bold text-xs tracking-widest uppercase mt-2">Sua trajetória de sucesso documentada.</p>
            </header>

            <div className="w-full">
                {hasCertificates ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {mockCertificates.map((cert) => (
                            <div 
                                key={cert.id}
                                className="bg-white border border-slate-200 rounded-lg overflow-hidden hover:shadow-lg transition-all duration-300 group"
                            >
                                <div className="p-6 border-b border-slate-100">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="w-12 h-12 bg-[#1D5F31]/10 rounded-lg flex items-center justify-center">
                                            <Award size={24} className="text-[#1D5F31]" />
                                        </div>
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-[#1D5F31] bg-[#1D5F31]/10 px-3 py-1 rounded-full">
                                            Emitido
                                        </span>
                                    </div>
                                    <h3 className="text-base font-bold tracking-tight text-[#061629] line-clamp-2">
                                        {cert.courseTitle}
                                    </h3>
                                </div>
                                
                                <div className="p-6 space-y-4">
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2 text-xs text-slate-500">
                                            <Calendar size={14} />
                                            <span className="font-medium">Emitido em {new Date(cert.issueDate).toLocaleDateString('pt-BR')}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-slate-500">
                                            <CheckCircle size={14} />
                                            <span className="font-medium">100% Concluído</span>
                                        </div>
                                    </div>
                                    
                                    <div className="pt-4 border-t border-slate-100">
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Código de Verificação</p>
                                        <code className="block text-xs font-mono bg-slate-50 px-3 py-2 rounded-md text-slate-700 border border-slate-200">
                                            {cert.verificationCode}
                                        </code>
                                    </div>
                                    
                                    <div className="flex gap-3 pt-2">
                                        <button 
                                            onClick={() => handleDownload(cert.courseId)}
                                            disabled={downloadingId === cert.courseId}
                                            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-[#1D5F31] text-white text-[10px] font-bold uppercase tracking-widest rounded-lg hover:bg-[#1D5F31]/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {downloadingId === cert.courseId ? (
                                                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            ) : (
                                                <Download size={14} />
                                            )}
                                            Baixar
                                        </button>
                                        <button 
                                            onClick={() => openPreview(cert.courseId)}
                                            className="flex items-center justify-center gap-2 px-4 py-3 border border-slate-200 text-slate-600 text-[10px] font-bold uppercase tracking-widest rounded-lg hover:bg-slate-50 transition-all"
                                        >
                                            <ExternalLink size={14} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="bg-white border border-black py-24 md:py-32 flex flex-col items-center text-center relative overflow-hidden rounded-3xl">
                        <Award size={300} className="absolute -bottom-10 -right-10 text-[#1D5F31]/10 rotate-12 pointer-events-none" />

                        <div className="relative z-10">
                            <div className="w-24 h-24 bg-white border border-black flex items-center justify-center text-[#1D5F31] mb-8 mx-auto shadow-sm rounded-2xl">
                                <Award size={48} />
                            </div>

                            <h2 className="text-2xl font-bold uppercase tracking-tighter text-[#061629] mb-4">
                                Nenhum Certificado <span className="text-[#1D5F31]">Emitido</span>
                            </h2>

                            <p className="text-[10px] font-bold uppercase tracking-[3px] text-slate-500 mt-2 max-w-md mx-auto leading-relaxed">
                                Sua galeria de conquistas está aguardando. <br />
                                Conclua seus treinamentos 100% para liberar seus documentos oficiais PowerPlay.
                            </p>

                            <div className="mt-12 flex flex-col md:flex-row items-center justify-center gap-4">
                                <div className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-[3px] text-slate-900 bg-white px-6 py-4 border border-black rounded-xl shadow-sm">
                                    <Lock size={12} className="text-[#1D5F31]" /> ÁREA PROTEGIDA
                                </div>

                                <Link href="/course" className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-[3px] text-white bg-[#1D5F31] px-8 py-4 hover:brightness-110 transition-all shadow-md rounded-xl">
                                    <BookOpen size={14} /> EXPLORAR TREINAMENTOS
                                </Link>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
