import React from 'react';
import { CheckCircle2 } from 'lucide-react';

export interface CertificateTemplateProps {
    studentName: string;
    courseName: string;
    duration: number;
    credentialId: string;
    date: string;
}

export const CertificateTemplate: React.FC<CertificateTemplateProps> = ({
    studentName,
    courseName,
    duration,
    credentialId,
    date
}) => {
    return (
        <div 
            id="certificate-container"
            className="relative w-full overflow-hidden bg-[#061b0f] text-white font-montserrat shadow-[0_20px_50px_rgba(0,0,0,0.5)] select-none"
            style={{ 
                aspectRatio: '1.414 / 1', // A4 Landscape aspect ratio
                backgroundImage: 'linear-gradient(to bottom right, #041209, #0d381c)'
            }}
        >
            {/* Background Image Overlay */}
            <div 
                className="absolute inset-0 z-0 opacity-20 mix-blend-overlay pointer-events-none"
                style={{
                    backgroundImage: 'url("https://images.unsplash.com/photo-1473625247510-8ceb1760943f?auto=format&fit=crop&w=2000&q=80")',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                }}
            />

            {/* Geometric Overlays for Industrial Look */}
            <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-[#1D5F31]/30 to-transparent z-0 transform -skew-x-12 translate-x-20 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-1/3 h-1/2 bg-gradient-to-t from-black/60 to-transparent z-0 pointer-events-none" />
            
            {/* Main Content Container */}
            <div className="relative z-10 w-full h-full p-8 md:p-12 lg:p-16 flex flex-col justify-between">
                
                {/* Header Row */}
                <div className="flex justify-between items-start">
                    {/* Logo & ID */}
                    <div className="flex flex-col gap-1 md:gap-2">
                        <div className="flex items-center gap-2 md:gap-3">
                            <div className="w-8 h-8 md:w-10 md:h-10 border-2 border-[#4ade80] flex items-center justify-center relative">
                                <div className="w-0 h-0 border-l-[8px] md:border-l-[12px] border-l-transparent border-t-[12px] md:border-t-[16px] border-t-[#4ade80] border-r-[8px] md:border-r-[12px] border-r-transparent transform -rotate-90 ml-1" />
                            </div>
                            <h1 className="text-2xl md:text-3xl font-black tracking-tighter uppercase">PowerPlay</h1>
                        </div>
                        <p className="text-[8px] md:text-[10px] text-[#4ade80] font-mono tracking-widest mt-1 md:mt-2 uppercase opacity-80">
                            Credential ID: {credentialId}
                        </p>
                    </div>

                    {/* Official Badge */}
                    <div className="flex flex-col items-end text-right">
                        <div className="flex items-center gap-2 text-[#4ade80]">
                            <CheckCircle2 className="w-4 h-4 md:w-5 md:h-5 fill-[#4ade80]/20" />
                            <span className="text-xs md:text-sm font-bold tracking-[0.2em] uppercase">Certificação Oficial</span>
                        </div>
                        <p className="text-[7px] md:text-[9px] text-slate-400 font-bold tracking-widest mt-1 uppercase">
                            Divisão de Sistemas de Energia Industrial
                        </p>
                    </div>
                </div>

                {/* Center Content */}
                <div className="flex flex-col items-center text-center mt-4 md:mt-8 flex-grow justify-center">
                    <p className="text-[10px] md:text-xs font-bold tracking-[0.3em] text-[#4ade80] uppercase mb-4 md:mb-8 opacity-90">
                        Este certificado é orgulhosamente concedido a
                    </p>
                    
                    <h2 className="text-3xl md:text-5xl lg:text-6xl font-black uppercase tracking-tighter mb-6 md:mb-10 text-white drop-shadow-lg">
                        {studentName}
                    </h2>
                    
                    <div className="w-full max-w-[80%] border-t border-b border-white/20 py-4 md:py-8 mb-6 md:mb-8">
                        <p className="text-xs md:text-sm text-slate-300 font-medium leading-relaxed max-w-2xl mx-auto">
                            Pela conclusão bem-sucedida e domínio do currículo técnico avançado e protocolos de segurança associados ao treinamento:
                        </p>
                        <h3 className="text-xl md:text-2xl lg:text-3xl font-bold uppercase tracking-tight text-[#4ade80] mt-4 md:mt-6">
                            {courseName}
                        </h3>
                    </div>

                    {/* Metrics Grid */}
                    <div className="grid grid-cols-3 gap-4 md:gap-16 w-full max-w-[80%]">
                        <div className="flex flex-col items-center">
                            <span className="text-[7px] md:text-[9px] font-bold tracking-widest uppercase text-slate-400 mb-1 md:mb-2">Duração</span>
                            <span className="text-sm md:text-lg lg:text-xl font-bold uppercase">{duration} Horas</span>
                        </div>
                        <div className="flex flex-col items-center">
                            <span className="text-[7px] md:text-[9px] font-bold tracking-widest uppercase text-slate-400 mb-1 md:mb-2">Metodologia</span>
                            <span className="text-sm md:text-lg lg:text-xl font-bold uppercase">Hub Técnico</span>
                        </div>
                        <div className="flex flex-col items-center">
                            <span className="text-[7px] md:text-[9px] font-bold tracking-widest uppercase text-slate-400 mb-1 md:mb-2">Desempenho</span>
                            <span className="text-sm md:text-lg lg:text-xl font-bold uppercase">Excelência</span>
                        </div>
                    </div>
                </div>

                {/* Footer Row */}
                <div className="flex justify-between items-end mt-4 md:mt-12 px-4 md:px-8">
                    {/* Left Signature */}
                    <div className="flex flex-col items-center w-32 md:w-48">
                        <span className="font-serif italic text-lg md:text-2xl mb-1 md:mb-2 opacity-90">H. Montgomery</span>
                        <div className="w-full h-px bg-white/40 mb-1 md:mb-2" />
                        <span className="text-[6px] md:text-[8px] lg:text-[9px] font-bold tracking-widest uppercase text-slate-300">Diretor de Ensino</span>
                        <span className="text-[5px] md:text-[7px] font-bold tracking-widest uppercase text-[#4ade80]/60 mt-1">PowerPlay Tech. Corp</span>
                    </div>

                    {/* Validation / QR Code */}
                    <div className="flex flex-col items-center translate-y-2 md:translate-y-4">
                        {/* Aumentado o tamanho do container do QR Code */}
                        <div className="w-20 h-20 md:w-32 md:h-32 bg-white p-1 md:p-2 rounded-sm shadow-2xl flex items-center justify-center mb-2 md:mb-4">
                            <img 
                                src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=https://powerplay.com/verify/${credentialId}`} 
                                alt="QR Code de Validação" 
                                className="w-full h-full object-contain"
                            />
                        </div>
                        <div className="bg-[#1D5F31] px-2 md:px-4 py-1 md:py-1.5 rounded-sm shadow-lg">
                            <span className="text-[6px] md:text-[9px] font-bold tracking-[0.2em] uppercase text-white">Documento Validado</span>
                        </div>
                        <span className="text-[6px] md:text-[9px] font-bold tracking-widest uppercase text-slate-400 mt-1 md:mt-2">Data: {date}</span>
                    </div>

                    {/* Right Signature */}
                    <div className="flex flex-col items-center w-32 md:w-48">
                        <span className="font-serif italic text-lg md:text-2xl mb-1 md:mb-2 opacity-90">Arthur Vance</span>
                        <div className="w-full h-px bg-white/40 mb-1 md:mb-2" />
                        <span className="text-[6px] md:text-[8px] lg:text-[9px] font-bold tracking-widest uppercase text-slate-300">Engenheiro Chefe</span>
                        <span className="text-[5px] md:text-[7px] font-bold tracking-widest uppercase text-[#4ade80]/60 mt-1">Operações Industriais</span>
                    </div>
                </div>

                {/* Bottom Accent Bar */}
                <div className="absolute bottom-0 left-0 w-1/3 h-1 md:h-2 bg-[#4ade80]" />
            </div>
        </div>
    );
};
