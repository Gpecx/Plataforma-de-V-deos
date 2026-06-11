'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import Logo from '@/components/Logo'
import { useBranding } from '@/context/BrandingContext'
import { Mail, Phone, MapPin, Instagram, Youtube, Linkedin } from 'lucide-react'

export default function Footer({ variant = 'light' }: { variant?: 'light' | 'dark' }) {
    const { siteName } = useBranding()
    const pathname = usePathname()
    const year = new Date().getFullYear()

    const isClassroomRoute = pathname?.startsWith('/classroom/')
    const isCourseDetailRoute = pathname?.startsWith('/course/') && pathname !== '/course'
    const isHomePage = pathname === '/'
    const isDark = variant === 'dark' || isClassroomRoute || isCourseDetailRoute || isHomePage

    return (
        <footer className={`relative pt-20 pb-12 font-montserrat z-[10] ${
            isClassroomRoute 
                ? 'bg-[#061629] border-t border-white/5' 
                : isCourseDetailRoute
                    ? 'bg-transparent border-none'
                : isHomePage
                    ? 'bg-transparent border-none' 
                    : isDark ? 'bg-[#061629] border-t border-white/5' : 'bg-white border-t border-slate-100'
        }`}>
            <div className="max-w-[1600px] mx-auto px-6 md:px-12">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
                    {/* Brand Section */}
                    <div className="flex flex-col space-y-6">
                        <Logo 
                            className="h-16 w-auto" 
                            href={null}
                            light={!isDark} 
                        />
                        <p className={`text-sm leading-relaxed max-w-sm font-medium ${isDark ? '!text-white/80' : '!text-slate-800'}`}>
                            Plataforma de ensino profissional para o mercado industrial. Transformando o futuro através da educação técnica de alta performance.
                        </p>
                    </div>

                    {/* Fale Conosco */}
                    <div className="flex flex-col space-y-6">
                        <h4 className={`text-[11px] font-bold uppercase tracking-[0.2em] ${isDark ? 'text-white' : 'text-slate-900'}`}>Fale Conosco</h4>
                        <div className="flex flex-col space-y-4">
                                <div className="flex items-start gap-3 group">
                                    <div className={`mt-1 p-1.5 rounded-lg transition-colors ${isDark ? 'bg-white/5 text-white/40 group-hover:bg-[#1D5F31]/20 group-hover:text-[#1D5F31]' : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200 group-hover:text-[#1D5F31]'}`}>
                                        <Mail size={16} />
                                    </div>
                                    <a href="mailto:comercial@voltsmind.com.br" className={`text-sm transition-colors ${isDark ? 'text-white/70 hover:text-white' : 'text-slate-700 hover:text-[#1D5F31] font-medium'}`}>
                                        comercial@voltsmind.com.br
                                    </a>
                                </div>
                                <div className="flex items-start gap-3 group">
                                    <div className={`mt-1 p-1.5 rounded-lg transition-colors ${isDark ? 'bg-white/5 text-white/40 group-hover:bg-[#1D5F31]/20 group-hover:text-[#1D5F31]' : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200 group-hover:text-[#1D5F31]'}`}>
                                        <Phone size={16} />
                                    </div>
                                    <a href="tel:19971290901" className={`text-sm transition-colors ${isDark ? 'text-white/70 hover:text-white' : 'text-slate-700 hover:text-[#1D5F31] font-medium'}`}>
                                        19 97129-0901
                                    </a>
                                </div>
                                <div className="flex items-start gap-3 group">
                                    <div className={`mt-1 p-1.5 rounded-lg transition-colors ${isDark ? 'bg-white/5 text-white/40 group-hover:bg-[#1D5F31]/20 group-hover:text-[#1D5F31]' : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200 group-hover:text-[#1D5F31]'}`}>
                                        <MapPin size={16} />
                                    </div>
                                    <span className={`text-sm leading-relaxed ${isDark ? 'text-white/70' : 'text-slate-700'}`}>
                                        R. Antônio Gonzáles Vasques, 126 - Bosque da Saude, Americana - SP
                                    </span>
                                </div>
                        </div>
                    </div>

                    {/* Siga-nos */}
                    <div className="flex flex-col space-y-6">
                        <h4 className={`text-[11px] font-bold uppercase tracking-[0.2em] ${isDark ? 'text-white' : 'text-slate-900'}`}>Siga-nos</h4>
                        <div className="flex items-center gap-3">
                            <a href="https://www.instagram.com/gpecx/" target="_blank" rel="noopener noreferrer" className={`p-3 rounded-xl transition-all duration-300 ${isDark ? 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-[#1D5F31] border border-white/10' : 'bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-[#1D5F31] border border-slate-200'}`}>
                                <Instagram size={20} />
                            </a>
                            <a href="https://www.youtube.com/@fabiogpecx" target="_blank" rel="noopener noreferrer" className={`p-3 rounded-xl transition-all duration-300 ${isDark ? 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-[#1D5F31] border border-white/10' : 'bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-[#1D5F31] border border-slate-200'}`}>
                                <Youtube size={20} />
                            </a>
                            <a href="https://br.linkedin.com/company/gpecx" target="_blank" rel="noopener noreferrer" className={`p-3 rounded-xl transition-all duration-300 ${isDark ? 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-[#1D5F31] border border-white/10' : 'bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-[#1D5F31] border border-slate-200'}`}>
                                <Linkedin size={20} />
                            </a>
                        </div>
                    </div>

                    {/* Transparência */}
                    <div className="flex flex-col space-y-6">
                        <h4 className={`text-[11px] font-bold uppercase tracking-[0.2em] ${isDark ? 'text-white' : 'text-slate-900'}`}>Transparência</h4>
                        <div className="flex flex-col space-y-3">
                            <Link href="/termos" className={`text-sm transition-colors font-medium ${isDark ? 'text-white/70 hover:text-[#1D5F31]' : 'text-slate-700 hover:text-[#1D5F31]'}`}>
                                Termos de Uso
                            </Link>
                            <Link href="/privacidade" className={`text-sm transition-colors font-medium ${isDark ? 'text-white/70 hover:text-[#1D5F31]' : 'text-slate-700 hover:text-[#1D5F31]'}`}>
                                Política de Privacidade
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className={`pt-8 flex flex-col items-center gap-4 ${
                    isHomePage 
                        ? 'text-white' 
                        : isDark ? 'text-white/50' : 'text-slate-700'
                } ${isHomePage ? 'text-center' : 'md:flex-row md:justify-between'}`}>
                    <div className="text-[10px] font-bold uppercase tracking-[0.2em]">
                        © {year} {siteName} - GPECx Tecnologia. Todos os direitos reservados.
                    </div>
                </div>
            </div>
        </footer>
    )
}
