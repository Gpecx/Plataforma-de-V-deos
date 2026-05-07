import Link from 'next/link'
import Logo from '@/components/Logo'
import { Mail, Phone, MapPin, Instagram, Youtube, Linkedin } from 'lucide-react'

export default function TeacherFooter() {
    const year = new Date().getFullYear()

    return (
        <footer className="relative pt-20 pb-12 overflow-hidden font-montserrat z-[10] border-t bg-white border-slate-100">
            <div className="max-w-[1600px] mx-auto px-6 md:px-12">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
                    {/* Brand Section */}
                    <div className="flex flex-col space-y-6">
                        <Logo 
                            className="h-16 w-auto" 
                            href={null}
                            light={false} 
                        />
                        <p className="text-sm leading-relaxed max-w-xs text-slate-600">
                            Plataforma de ensino profissional para o mercado industrial. Transformando o futuro através da educação técnica de alta performance.
                        </p>
                    </div>

                    {/* Fale Conosco */}
                    <div className="flex flex-col space-y-6">
                        <h4 className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-900">Fale Conosco</h4>
                        <div className="flex flex-col space-y-4">
                            <div className="flex items-start gap-3 group">
                                <div className="mt-1 p-1.5 rounded-lg transition-colors bg-slate-50 text-slate-400 group-hover:bg-slate-100 group-hover:text-[#1D5F31]">
                                    <Mail size={16} />
                                </div>
                                <a href="mailto:comercial@voltsmind.com.br" className="text-sm transition-colors text-slate-600 hover:text-[#1D5F31]">
                                    comercial@voltsmind.com.br
                                </a>
                            </div>
                            <div className="flex items-start gap-3 group">
                                <div className="mt-1 p-1.5 rounded-lg transition-colors bg-slate-50 text-slate-400 group-hover:bg-slate-100 group-hover:text-[#1D5F31]">
                                    <Phone size={16} />
                                </div>
                                <a href="tel:19971290901" className="text-sm transition-colors text-slate-600 hover:text-[#1D5F31]">
                                    19 97129-0901
                                </a>
                            </div>
                            <div className="flex items-start gap-3 group">
                                <div className="mt-1 p-1.5 rounded-lg transition-colors bg-slate-50 text-slate-400 group-hover:bg-slate-100 group-hover:text-[#1D5F31]">
                                    <MapPin size={16} />
                                </div>
                                <span className="text-sm leading-relaxed text-slate-600">
                                    R. Antônio Gonzáles Vasques, 126 - Bosque da Saude, Americana - SP
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Siga-nos */}
                    <div className="flex flex-col space-y-6">
                        <h4 className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-900">Siga-nos</h4>
                        <div className="flex items-center gap-3">
                            <a href="https://www.instagram.com/gpecx/" target="_blank" rel="noopener noreferrer" className="p-3 rounded-xl transition-all duration-300 bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-[#1D5F31] border border-slate-100">
                                <Instagram size={20} />
                            </a>
                            <a href="https://www.youtube.com/@fabiogpecx" target="_blank" rel="noopener noreferrer" className="p-3 rounded-xl transition-all duration-300 bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-[#1D5F31] border border-slate-100">
                                <Youtube size={20} />
                            </a>
                            <a href="https://br.linkedin.com/company/gpecx" target="_blank" rel="noopener noreferrer" className="p-3 rounded-xl transition-all duration-300 bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-[#1D5F31] border border-slate-100">
                                <Linkedin size={20} />
                            </a>
                        </div>
                    </div>

                    {/* Transparência */}
                    <div className="flex flex-col space-y-6">
                        <h4 className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-900">Transparência</h4>
                        <div className="flex flex-col space-y-3">
                            <Link href="/termos" className="text-sm transition-colors text-slate-600 hover:text-[#1D5F31]">
                                Termos de Uso
                            </Link>
                            <Link href="/privacidade" className="text-sm transition-colors text-slate-600 hover:text-[#1D5F31]">
                                Política de Privacidade
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="pt-8 border-t flex flex-col md:flex-row justify-between items-center gap-4 border-slate-100 text-slate-400">
                    <div className="text-[10px] font-bold uppercase tracking-[0.2em]">
                        © {year} PowerPlay - GPECx Tecnologia. Todos os direitos reservados.
                    </div>
                </div>
            </div>
        </footer>
    )
}
