import React from 'react';
import { CheckCircle2, ShieldCheck } from 'lucide-react';
import Logo from '@/components/Logo';

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
            className="relative w-full overflow-hidden bg-white select-none"
            style={{ 
                aspectRatio: '1.414 / 1', // A4 Landscape aspect ratio
                boxSizing: 'border-box',
                color: '#1A1A1A',
                backgroundColor: '#FFFFFF',
                fontFamily: "'Inter', 'Montserrat', sans-serif",
                boxShadow: '0 20px 50px rgba(0,0,0,0.15)'
            }}
        >
            {/* Minimalist Industrial Frame */}
            {/* Left Accent Border */}
            <div className="absolute top-0 left-0 bottom-0 w-3 md:w-4 z-20" style={{ backgroundColor: '#1D5F31' }} />
            
            {/* Inner Thin Frame */}
            <div className="absolute inset-5 md:inset-8 left-7 md:left-12 pointer-events-none z-10" style={{ border: '1px solid #E5E7EB' }} />
            
            {/* Seal Watermark (Right side, slightly visible) */}
            <div className="absolute -right-20 -bottom-20 opacity-[0.02] pointer-events-none z-0 transform rotate-[-15deg]">
                <ShieldCheck className="w-[500px] h-[500px]" style={{ color: '#1A1A1A' }} />
            </div>

            {/* Main Content Area */}
            <div className="relative z-20 w-full h-full flex flex-col justify-between pt-12 md:pt-16 pb-10 md:pb-14 px-14 md:px-20 pl-16 md:pl-24">
                
                {/* 1. Header */}
                <div className="flex justify-between items-center bg-white px-2">
                    {/* Logo PowerPlay */}
                    <div className="flex items-center">
                        <Logo light href={null} className="!h-10 md:!h-12 w-auto" />
                    </div>

                    {/* Official Badge */}
                    <div className="flex items-center gap-2">
                        <div className="flex flex-col items-end text-right">
                            <span className="text-[8px] md:text-[10px] font-bold tracking-[0.2em] uppercase text-[#1D5F31]">Certificação Oficial</span>
                            <span className="text-[6px] md:text-[7px] font-medium tracking-widest mt-0.5 uppercase text-[#6B7280]">
                                Validado Autenticamente
                            </span>
                        </div>
                        <CheckCircle2 className="w-5 h-5 md:w-6 md:h-6" style={{ color: '#1D5F31' }} />
                    </div>
                </div>

                {/* 2. Body */}
                <div className="flex flex-col items-center text-center flex-grow justify-center mt-2">
                    <p className="text-[9px] md:text-[11px] font-semibold tracking-[0.3em] uppercase mb-4 md:mb-6 text-[#6B7280]">
                        Este certificado é orgulhosamente conferido a
                    </p>
                    
                    <h2 
                        className="text-4xl md:text-5xl lg:text-[4rem] font-extrabold tracking-tight mb-6 md:mb-8 text-[#1A1A1A] leading-none px-4 capitalize"
                        style={{ fontFamily: "'Inter', sans-serif", fontWeight: 800 }}
                    >
                        {studentName}
                    </h2>
                    
                    <p className="text-[9px] md:text-[11px] font-medium uppercase tracking-[0.1em] text-[#6B7280] max-w-2xl mx-auto leading-relaxed mb-3 md:mb-4">
                        Por ter concluído com aproveitamento o programa de treinamento especializado em:
                    </p>
                    
                    <h3 
                        className="text-lg md:text-2xl lg:text-3xl font-bold uppercase tracking-wide text-[#1D5F31] max-w-4xl px-4"
                        style={{ fontFamily: "'Inter', sans-serif", fontWeight: 700 }}
                    >
                        {courseName}
                    </h3>
                </div>

                {/* 3. Infobox (Grid) */}
                <div className="w-full max-w-3xl mx-auto my-6 md:my-8 bg-white z-10 px-4">
                    <div className="grid grid-cols-3 gap-2 md:gap-4 bg-[#F9FAFB] border border-[#E5E7EB] rounded-sm py-3 md:py-5 px-4 md:px-8">
                        <div className="flex flex-col items-center border-r border-[#E5E7EB]">
                            <span className="text-[6px] md:text-[8px] font-bold tracking-[0.2em] uppercase text-[#6B7280] mb-1">Carga Horária</span>
                            <span className="text-[10px] md:text-sm font-extrabold text-[#1A1A1A]">{duration} Horas</span>
                        </div>
                        <div className="flex flex-col items-center border-r border-[#E5E7EB]">
                            <span className="text-[6px] md:text-[8px] font-bold tracking-[0.2em] uppercase text-[#6B7280] mb-1">Data de Conclusão</span>
                            <span className="text-[10px] md:text-sm font-extrabold text-[#1A1A1A]">{date}</span>
                        </div>
                        <div className="flex flex-col items-center">
                            <span className="text-[6px] md:text-[8px] font-bold tracking-[0.2em] uppercase text-[#6B7280] mb-1">Nível</span>
                            <span className="text-[10px] md:text-sm font-extrabold text-[#1A1A1A]">Especialização Técnica</span>
                        </div>
                    </div>
                </div>

                {/* 4. Footer */}
                <div className="flex justify-between items-end w-full mt-auto bg-white px-2 pb-2">
                    
                    {/* Left: QR Code and Hash */}
                    <div className="flex items-center gap-3 md:gap-4 h-full">
                        <div className="w-14 h-14 md:w-16 md:h-16 bg-white p-1 rounded-sm flex items-center justify-center border border-[#E5E7EB]">
                            <img 
                                src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=https://powerplay.com/verify/${credentialId}`} 
                                alt="QR Code de Validação" 
                                crossOrigin="anonymous"
                                className="w-full h-full object-contain"
                            />
                        </div>
                        <div className="flex flex-col justify-center h-full space-y-1">
                            <span className="text-[7px] md:text-[9px] font-bold tracking-[0.1em] uppercase text-[#1A1A1A]">
                                Validação Digital
                            </span>
                            <span className="text-[6px] md:text-[7px] font-mono tracking-wide text-[#6B7280] uppercase">
                                HASH: {credentialId}
                            </span>
                        </div>
                    </div>

                    {/* Right: Signatures */}
                    <div className="flex gap-8 md:gap-14 h-full items-end">
                        {/* Signature 1 */}
                        <div className="flex flex-col items-center text-center space-y-1.5 md:space-y-2">
                            <div className="relative h-12 md:h-16 w-32 md:w-44 flex items-end justify-center border-b border-[#D1D5DB]">
                                <span 
                                    className="absolute -bottom-1.5 text-3xl md:text-4xl text-[#0F172A] whitespace-nowrap pointer-events-none" 
                                    style={{ fontFamily: "'Dancing Script', 'Great Vibes', 'Brush Script MT', cursive" }}
                                >
                                    {teacherName || "Daniel Araujo"}
                                </span>
                            </div>
                            <div className="flex flex-col items-center space-y-0.5 pt-1">
                                <span className="text-[10px] md:text-xs font-semibold text-[#1A1A1A]">
                                    {teacherName || "Daniel Araujo"}
                                </span>
                                <span className="text-[7px] md:text-[8px] font-medium text-slate-500 uppercase tracking-wide">
                                    Instrutor(a) do Curso
                                </span>
                                <span className="text-[5px] md:text-[6px] font-normal text-slate-400 uppercase tracking-wider">
                                    PowerPlay Academy
                                </span>
                            </div>
                        </div>

                        {/* Signature 2 */}
                        <div className="flex flex-col items-center text-center space-y-1.5 md:space-y-2">
                            <div className="relative h-12 md:h-16 w-32 md:w-44 flex items-end justify-center border-b border-[#D1D5DB]">
                                <span 
                                    className="absolute -bottom-1.5 text-3xl md:text-4xl text-[#0F172A] whitespace-nowrap pointer-events-none" 
                                    style={{ fontFamily: "'Dancing Script', 'Great Vibes', 'Brush Script MT', cursive" }}
                                >
                                    Francisco Fabio
                                </span>
                            </div>
                            <div className="flex flex-col items-center space-y-0.5 pt-1">
                                <span className="text-[10px] md:text-xs font-semibold text-[#1A1A1A]">
                                    Francisco Fabio
                                </span>
                                <span className="text-[7px] md:text-[8px] font-medium text-slate-500 uppercase tracking-wide">
                                    Diretor Geral
                                </span>
                                <span className="text-[5px] md:text-[6px] font-normal text-slate-400 uppercase tracking-wider">
                                    PowerPlay Academy
                                </span>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

