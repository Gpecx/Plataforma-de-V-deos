import React from 'react';
import { CheckCircle2 } from 'lucide-react';

export interface CertificateTemplateProps {
    studentName: string;
    courseName: string;
    duration: number;
    credentialId: string;
    date: string;
    teacherName?: string;
}

export const CertificateTemplate: React.FC<CertificateTemplateProps> = ({
    studentName,
    courseName,
    duration,
    credentialId,
    date,
    teacherName
}) => {
    return (
        <div 
            id="certificate-container"
            className="relative w-full overflow-hidden bg-white font-serif select-none border-[12px]"
            style={{ 
                aspectRatio: '1.414 / 1', // A4 Landscape aspect ratio
                boxSizing: 'border-box',
                color: '#0f172a',
                borderColor: '#f8fafc',
                boxShadow: '0 20px 50px rgba(0,0,0,0.3)'
            }}
        >
            {/* Inner Border Frame (Academic look) */}
            <div className="absolute inset-4 pointer-events-none z-10" style={{ border: '1px solid rgba(29, 95, 49, 0.2)' }} />
            <div className="absolute inset-5 pointer-events-none z-10" style={{ border: '1px solid rgba(29, 95, 49, 0.1)' }} />

            {/* Top Wave Background - Tech Twist */}
            <svg viewBox="0 0 1440 320" preserveAspectRatio="none" className="absolute top-0 left-0 w-full h-32 md:h-48 z-0 drop-shadow-md">
                <defs>
                    <linearGradient id="waveGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#061629" />
                        <stop offset="100%" stopColor="#1D5F31" />
                    </linearGradient>
                </defs>
                <path fill="url(#waveGradient)" fillOpacity="0.9" d="M0,96L48,106.7C96,117,192,139,288,133.3C384,128,480,96,576,101.3C672,107,768,149,864,160C960,171,1056,149,1152,128C1248,107,1344,85,1392,74.7L1440,64L1440,0L1392,0C1344,0,1248,0,1152,0C1056,0,960,0,864,0C768,0,672,0,576,0C480,0,384,0,288,0C192,0,96,0,48,0L0,0Z"></path>
            </svg>

            {/* Faint Center Watermark */}
            <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none z-0">
                <svg viewBox="0 0 300 300" className="w-[50%] h-[50%]" xmlns="http://www.w3.org/2000/svg">
                    <path d="M2 2L300 150L2 298Z" fill="none" stroke="#1D5F31" strokeWidth="8" strokeLinejoin="round" />
                </svg>
            </div>

            {/* Main Content Container */}
            <div className="relative z-20 w-full h-full flex flex-col justify-between pt-12 md:pt-16 pb-6 md:pb-8 px-10 md:px-12">
                
                {/* Header Row: Logo over wave */}
                <div className="flex justify-between items-start">
                    {/* Logo */}
                    <div className="flex items-center gap-3">
                        <div className="h-8 md:h-12 w-auto drop-shadow-sm">
                            <svg viewBox="0 0 300 60" className="h-full w-auto" xmlns="http://www.w3.org/2000/svg">
                                <path d="M2 2L60 30L2 58Z" fill="none" stroke="#1D5F31" strokeWidth="4" strokeLinejoin="round" />
                                <path d="M2 2L60 30L2 58Z" fill="#1D5F31" fillOpacity="0.1" />
                                <path d="M25 14L13 33H21L18 46L30 27H23L25 14Z" fill="#1D5F31" />
                                <text x="75" y="42" fontFamily="Exo, sans-serif" fontSize="32" fontWeight="900" fill="#1D5F31" style={{ letterSpacing: '0.05em' }}>POWER</text>
                                <text x="195" y="42" fontFamily="Exo, sans-serif" fontSize="32" fontWeight="900" fill="#1D5F31" style={{ letterSpacing: '0.05em' }}>PLAY</text>
                            </svg>
                        </div>
                    </div>

                    {/* Official Badge */}
                    <div className="flex flex-col items-end text-right mt-2">
                        <div className="flex items-center gap-2" style={{ color: '#1D5F31' }}>
                            <CheckCircle2 className="w-4 h-4 md:w-5 md:h-5" style={{ color: '#1D5F31' }} />
                            <span className="text-[10px] md:text-xs font-bold tracking-[0.2em] uppercase font-montserrat">Certificação Oficial</span>
                        </div>
                        <p className="text-[6px] md:text-[8px] font-bold tracking-widest mt-1 uppercase font-montserrat" style={{ color: '#64748b' }}>
                            Divisão de Sistemas de Energia Industrial
                        </p>
                    </div>
                </div>

                {/* Center Content: Academic Typography */}
                <div className="flex flex-col items-center text-center mt-6 md:mt-8 flex-grow">
                    <p className="text-[8px] md:text-[10px] font-bold tracking-[0.4em] text-[#1D5F31] uppercase mb-3 md:mb-5 font-montserrat">
                        Este certificado é orgulhosamente concedido a
                    </p>
                    
                    {/* Harvard style large italic serif for the name */}
                    <h2 
                        className="text-4xl md:text-5xl lg:text-7xl font-bold italic tracking-tight mb-4 md:mb-8 inline-block"
                        style={{ 
                            fontFamily: "Georgia, 'Times New Roman', Times, serif",
                            color: '#0f172a',
                            borderBottom: '2px solid rgba(29, 95, 49, 0.2)',
                            paddingBottom: '16px',
                            paddingLeft: '64px',
                            paddingRight: '64px'
                        }}
                    >
                        {studentName}
                    </h2>
                    
                    <div className="w-full max-w-[85%] mb-4 md:mb-6">
                        <p className="text-[10px] md:text-xs font-medium leading-relaxed max-w-2xl mx-auto font-montserrat uppercase tracking-widest" style={{ color: '#64748b' }}>
                            Pela conclusão bem-sucedida e domínio do currículo técnico avançado associado ao programa:
                        </p>
                        <h3 className="text-xl md:text-2xl lg:text-3xl font-black uppercase tracking-tight mt-2 md:mt-4 font-montserrat" style={{ color: '#061629' }}>
                            {courseName}
                        </h3>
                    </div>

                    {/* Tech Data Grid (Minimalist) */}
                    <div className="grid grid-cols-3 gap-8 md:gap-24 w-full max-w-[60%] font-montserrat py-2 md:py-3" style={{ borderTop: '1px solid #f1f5f9', borderBottom: '1px solid #f1f5f9' }}>
                        <div className="flex flex-col items-center">
                            <span className="text-[6px] md:text-[8px] font-bold tracking-[0.2em] uppercase mb-1" style={{ color: '#94a3b8' }}>Carga Horária</span>
                            <span className="text-[10px] md:text-xs font-black uppercase" style={{ color: '#1D5F31' }}>{duration} Horas</span>
                        </div>
                        <div className="flex flex-col items-center">
                            <span className="text-[6px] md:text-[8px] font-bold tracking-[0.2em] uppercase mb-1" style={{ color: '#94a3b8' }}>Metodologia</span>
                            <span className="text-[10px] md:text-xs font-black uppercase" style={{ color: '#1D5F31' }}>Hub Técnico</span>
                        </div>
                        <div className="flex flex-col items-center">
                            <span className="text-[6px] md:text-[8px] font-bold tracking-[0.2em] uppercase mb-1" style={{ color: '#94a3b8' }}>Desempenho</span>
                            <span className="text-[10px] md:text-xs font-black uppercase" style={{ color: '#1D5F31' }}>Excelência</span>
                        </div>
                    </div>
                </div>

                {/* Footer Row */}
                <div className="grid grid-cols-3 items-end w-full mt-auto pt-4 relative z-20">
                    {/* Left Signature */}
                    <div className="flex flex-col items-center text-center">
                        <div className="h-12 md:h-16 flex items-end justify-center mb-2">
                            <span className="font-serif italic text-2xl md:text-3xl" style={{ fontFamily: "'Dancing Script', 'Brush Script MT', cursive, Georgia, serif", color: '#1e293b' }}>
                                {teacherName || "Equipe PowerPlay"}
                            </span>
                        </div>
                        <div className="w-32 md:w-48 h-[1px] mb-2" style={{ backgroundColor: '#94a3b8' }} />
                        <div className="h-8 flex flex-col justify-start">
                            <span className="text-[6px] md:text-[8px] font-bold tracking-[0.2em] uppercase font-montserrat" style={{ color: '#64748b' }}>Instrutor(a) do Curso</span>
                            <span className="text-[5px] md:text-[7px] font-bold tracking-[0.2em] uppercase mt-1 font-montserrat" style={{ color: '#1D5F31' }}>PowerPlay Technical Corp</span>
                        </div>
                    </div>

                    {/* QR Code Center */}
                    <div className="flex flex-col items-center text-center">
                        <div className="h-20 md:h-24 flex flex-col items-center justify-end mb-2">
                            <div className="w-16 h-16 md:w-20 md:h-20 bg-white p-1.5 rounded shadow-sm flex items-center justify-center" style={{ border: '1px solid #e2e8f0' }}>
                                <img 
                                    src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=https://powerplay.com/verify/${credentialId}`} 
                                    alt="QR Code" 
                                    crossOrigin="anonymous"
                                    className="w-full h-full object-contain"
                                />
                            </div>
                        </div>
                        <div className="h-8 flex flex-col justify-start gap-1">
                            <p className="text-[5px] md:text-[7px] font-mono tracking-[0.2em] uppercase font-bold" style={{ color: '#94a3b8' }}>
                                ID: {credentialId}
                            </p>
                            <span className="text-[5px] md:text-[7px] font-bold tracking-widest uppercase font-montserrat" style={{ color: '#1D5F31' }}>
                                Emitido em {date}
                            </span>
                        </div>
                    </div>

                    {/* Right Signature */}
                    <div className="flex flex-col items-center text-center">
                        <div className="h-12 md:h-16 flex items-end justify-center mb-2">
                            <span className="font-serif italic text-2xl md:text-3xl" style={{ fontFamily: "'Dancing Script', 'Brush Script MT', cursive, Georgia, serif", color: '#1e293b' }}>
                                Francisco Fabio
                            </span>
                        </div>
                        <div className="w-32 md:w-48 h-[1px] mb-2" style={{ backgroundColor: '#94a3b8' }} />
                        <div className="h-8 flex flex-col justify-start">
                            <span className="text-[6px] md:text-[8px] font-bold tracking-[0.2em] uppercase font-montserrat" style={{ color: '#64748b' }}>Diretor Geral</span>
                            <span className="text-[5px] md:text-[7px] font-bold tracking-[0.2em] uppercase mt-1 font-montserrat" style={{ color: '#1D5F31' }}>PowerPlay Academy</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
