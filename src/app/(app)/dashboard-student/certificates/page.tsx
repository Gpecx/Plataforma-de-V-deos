"use client"

import { useState, useRef, useEffect } from 'react'
import { Award, Lock, BookOpen, Download, ExternalLink, Calendar, CheckCircle, X, Printer } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { ICertificate } from '@/lib/types/certificate'
import { CertificateTemplate } from '@/components/certificates/CertificateTemplate'
import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'
import { getProfile } from '../actions'

export default function CertificatesPage() {
    const [downloadingId, setDownloadingId] = useState<string | null>(null)
    const [selectedCert, setSelectedCert] = useState<ICertificate | null>(null)
    const certificateRef = useRef<HTMLDivElement>(null)
    const [certificates, setCertificates] = useState<ICertificate[]>([])
    const [studentName, setStudentName] = useState<string>('')
    const [isCheckingAccess, setIsCheckingAccess] = useState(true)

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await getProfile()
                if (res.success && res.data) {
                    setStudentName(res.data.full_name || res.data.displayName || 'Aluno')
                    if (res.data.concluded_courses && Array.isArray(res.data.concluded_courses)) {
                        setCertificates(res.data.concluded_courses)
                    }
                }
            } catch (err) {
                console.error('Erro ao buscar certificados', err)
            } finally {
                setIsCheckingAccess(false)
            }
        }
        fetchProfile()
    }, [])

    useEffect(() => {
        const handleEsc = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setSelectedCert(null)
            }
        }
        if (selectedCert) {
            window.addEventListener('keydown', handleEsc)
        }
        return () => window.removeEventListener('keydown', handleEsc)
    }, [selectedCert])

    const hasCertificates = certificates.length > 0

    const handleDownload = async (cert: ICertificate) => {
        setDownloadingId(cert.credentialId)
        toast.info('Gerando PDF de alta resolução...')
        try {
            // Need to render the certificate temporarily to capture it
            // For simplicity, we can do it if it's already in the DOM (in the modal)
            // But if we want direct download from the card: we open the modal and trigger download.
            openPreview(cert)
            // Wait a bit for images to load, then trigger download
            setTimeout(async () => {
                await downloadPDF(cert)
                setDownloadingId(null)
            }, 1000)
        } catch (error: any) {
            console.error('Error downloading certificate:', error)
            toast.error('Erro ao gerar certificado PDF')
            setDownloadingId(null)
        }
    }

    const downloadPDF = async (cert: ICertificate) => {
        if (!certificateRef.current) {
            console.error("ERRO NO DOWNLOAD: Referência do certificado não encontrada.");
            toast.error("Ocorreu um erro técnico ao capturar o certificado.");
            return;
        }

        setDownloadingId(cert.credentialId);
        
        toast.promise(async () => {
            try {
                // Pequeno delay para garantir que imagens remotas (QR Code) e fontes carreguem
                await new Promise(resolve => setTimeout(resolve, 800));

                console.log("Iniciando captura do canvas...");
                
                const canvas = await html2canvas(certificateRef.current!, {
                    scale: 2,
                    useCORS: true,
                    allowTaint: false,
                    logging: true,
                    backgroundColor: '#ffffff',
                    windowWidth: 1440,
                    onclone: (clonedDoc) => {
                        const el = clonedDoc.getElementById('print-section');
                        if (el) {
                            el.style.display = 'block';
                            el.style.padding = '0';
                            el.style.margin = '0';
                            
                            // Limpeza profunda de cores modernas que quebram o html2canvas (v4/modern CSS)
                            const allElements = el.getElementsByTagName('*');
                            for (let i = 0; i < allElements.length; i++) {
                                const element = allElements[i] as HTMLElement;
                                // Força o uso de cores herdadas ou explícitas em Hex para evitar lab() / oklch()
                                const style = window.getComputedStyle(element);
                                if (style.color.includes('lab') || style.color.includes('oklch')) {
                                    element.style.color = '#000000';
                                }
                                if (style.backgroundColor.includes('lab') || style.backgroundColor.includes('oklch')) {
                                    element.style.backgroundColor = 'transparent';
                                }
                                if (style.borderColor.includes('lab') || style.borderColor.includes('oklch')) {
                                    element.style.borderColor = 'transparent';
                                }
                            }
                        }
                    }
                });

                console.log("Canvas capturado com sucesso. Gerando PDF...");

                const imgData = canvas.toDataURL('image/png', 1.0);
                const pdf = new jsPDF({
                    orientation: 'landscape',
                    unit: 'mm',
                    format: 'a4'
                });
                
                const pdfWidth = pdf.internal.pageSize.getWidth();
                const pdfHeight = pdf.internal.pageSize.getHeight();
                
                // Preenche a página A4 exatamente
                pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
                
                const filename = `Certificado - ${studentName} - PowerPlay.pdf`;
                pdf.save(filename);
                
                console.log(`PDF ${filename} gerado com sucesso.`);
                setDownloadingId(null);
            } catch (error) {
                console.error("ERRO CRÍTICO NO DOWNLOAD DO PDF:", error);
                setDownloadingId(null);
                throw error; // Repassa para o toast.promise tratar
            }
        }, {
            loading: 'Processando certificado de alta fidelidade...',
            success: 'Certificado baixado com sucesso!',
            error: 'Falha na geração do PDF. Verifique o console.'
        });
    }

    const handlePrint = () => {
        if (!certificateRef.current) return;
        
        // Direct print via browser with improved CSS
        window.print();
    }

    const openPreview = (cert: ICertificate) => {
        setSelectedCert(cert)
    }

    if (isCheckingAccess) {
        return (
            <div className="p-4 sm:p-8 md:p-12 min-h-screen flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-8 h-8 border-4 border-[#1D5F31]/30 border-t-[#1D5F31] rounded-full animate-spin" />
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Verificando Acesso...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="p-4 sm:p-8 md:p-12 min-h-screen font-montserrat text-black bg-white animate-in fade-in duration-500">
            <style jsx global>{`
                @media print {
                    body {
                        margin: 0;
                        padding: 0;
                        background: white !important;
                    }
                    body * {
                        visibility: hidden;
                    }
                    #print-section, #print-section * {
                        visibility: visible;
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                    #print-section {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                        height: 100vh;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                    }
                    @page { 
                        size: A4 landscape; 
                        margin: 0; 
                    }
                    /* Ensure background images and gradients print */
                    * {
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                }
            `}</style>
            
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
                        {certificates.map((cert) => (
                            <div 
                                key={cert.credentialId || cert.courseId}
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
                                            <span className="font-medium">Emitido em {new Date(cert.date_conclusao).toLocaleDateString('pt-BR')}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-slate-500">
                                            <CheckCircle size={14} />
                                            <span className="font-medium">100% Concluído</span>
                                        </div>
                                    </div>
                                    
                                    <div className="pt-4 border-t border-slate-100">
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Código de Verificação</p>
                                        <code className="block text-xs font-mono bg-slate-50 px-3 py-2 rounded-md text-slate-700 border border-slate-200">
                                            {cert.credentialId}
                                        </code>
                                    </div>
                                    
                                    <div className="flex gap-3 pt-2">
                                        <button 
                                            onClick={() => handleDownload(cert)}
                                            disabled={downloadingId === cert.credentialId}
                                            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-[#1D5F31] text-white text-[10px] font-bold uppercase tracking-widest rounded-lg hover:bg-[#1D5F31]/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {downloadingId === cert.credentialId ? (
                                                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            ) : (
                                                <Download size={14} />
                                            )}
                                            Baixar
                                        </button>
                                        <button 
                                            onClick={() => openPreview(cert)}
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
                                Você ainda não possui certificados emitidos. Continue estudando para conquistar sua certificação oficial.
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

            {/* Certificate Modal */}
            {selectedCert && (
                <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#061629]/95 backdrop-blur-xl p-4 overflow-y-auto">
                    {/* Botão de Fechar Superior Direito */}
                    <button 
                        onClick={() => setSelectedCert(null)}
                        className="fixed top-6 right-6 md:top-10 md:right-10 z-[110] p-4 bg-white hover:bg-[#CCFF00] text-black rounded-full transition-all duration-300 shadow-2xl group border-2 border-transparent hover:scale-110 active:scale-95 print:hidden"
                        title="Fechar (Esc)"
                    >
                        <X size={28} className="group-hover:rotate-90 transition-transform duration-300" />
                    </button>
                    
                    <div className="w-full max-w-5xl flex flex-col items-center">
                        <div id="print-section" ref={certificateRef} className="w-full">
                            <CertificateTemplate 
                                studentName={studentName}
                                courseName={selectedCert.courseTitle}
                                duration={12} // Example, you can pass real duration
                                credentialId={selectedCert.credentialId}
                                date={new Date(selectedCert.date_conclusao).toLocaleDateString('pt-BR')}
                                teacherName={selectedCert.teacherName || "Professor(a) Responsável"}
                            />
                        </div>
                        
                        <div className="flex gap-4 mt-8 print:hidden">
                            <button 
                                onClick={handlePrint}
                                className="flex items-center gap-2 px-6 py-3 bg-[#1D5F31] text-white font-bold uppercase tracking-widest rounded-sm hover:brightness-110 transition-all shadow-lg"
                            >
                                <Printer size={18} /> IMPRIMIR CERTIFICADO
                            </button>
                            
                            <button 
                                onClick={() => downloadPDF(selectedCert)}
                                className="flex items-center gap-2 px-6 py-3 bg-white text-[#1D5F31] font-bold uppercase tracking-widest rounded-sm hover:bg-slate-100 transition-all shadow-lg"
                            >
                                <Download size={18} /> BAIXAR COMO PDF
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
