"use client"
import { ArrowLeft, CheckCircle2, AlertCircle, Info, ShieldCheck, CreditCard, Banknote } from 'lucide-react'
import Link from 'next/link'

export default function RefundPolicy() {
    return (
        <div className="min-h-screen bg-white text-black font-montserrat animate-in fade-in duration-500 pb-20">
            {/* Header / Hero Section */}
            <header className="bg-white border-b border-slate-100 py-16">
                <div className="max-w-4xl mx-auto px-6">
                    <Link 
                        href="/dashboard-student/subscriptions" 
                        className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[3px] text-black hover:text-[#1D5F31] transition-colors mb-8"
                    >
                        <ArrowLeft size={14} /> Voltar
                    </Link>
                    
                    <h1 className="text-4xl md:text-5xl font-bold uppercase tracking-tighter mb-4 text-black leading-none">
                        Política de <span className="text-[#1D5F31]">Reembolso</span>
                    </h1>
                    <p className="text-black font-bold text-xs uppercase tracking-[4px] max-w-xl">
                        Diretrizes técnicas e operacionais para solicitações de estorno e cancelamento na plataforma PowerPlay.
                    </p>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-6 py-12">
                <div className="space-y-12">
                    
                    {/* Destaque Principal: 30 Dias */}
                    <section className="border-l-4 border-[#1D5F31] bg-slate-50 p-8 rounded-none">
                        <div className="flex items-start gap-4">
                            <div className="bg-[#1D5F31] p-3 text-white">
                                <ShieldCheck size={24} />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold uppercase tracking-tight mb-2 text-black">Garantia Incondicional de 30 Dias</h2>
                                <p className="text-black leading-relaxed text-sm">
                                    Queremos garantir sua total satisfação técnica. Se o conteúdo não atender às suas expectativas profissionais, você tem até <strong>30 dias corridos</strong> a partir da data da compra para solicitar o reembolso integral do valor investido.
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* Grid de Critérios */}
                    <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="border border-black p-8 rounded-none flex flex-col h-full transition-colors hover:border-[#1D5F31]">
                            <div className="flex items-center gap-3 mb-6">
                                <Info size={20} className="text-[#1D5F31]" />
                                <h3 className="font-bold uppercase tracking-widest text-xs text-black underline decoration-[#1D5F31] underline-offset-8">Critério de Consumo</h3>
                            </div>
                            <ul className="space-y-4 flex-1">
                                <li className="flex items-start gap-3">
                                    <CheckCircle2 size={16} className="text-[#1D5F31] shrink-0 mt-0.5" />
                                    <span className="text-xs font-bold uppercase tracking-wide text-black">Progresso inferior a 50% do curso.</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <CheckCircle2 size={16} className="text-[#1D5F31] shrink-0 mt-0.5" />
                                    <span className="text-xs font-bold uppercase tracking-wide text-black">Nenhum certificado emitido para o curso em questão.</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <CheckCircle2 size={16} className="text-[#1D5F31] shrink-0 mt-0.5" />
                                    <span className="text-xs font-bold uppercase tracking-wide text-black">Downloads massivos de materiais podem invalidar o pedido.</span>
                                </li>
                            </ul>
                        </div>

                        <div className="border border-black p-8 rounded-none flex flex-col h-full transition-colors hover:border-[#1D5F31]">
                            <div className="flex items-center gap-3 mb-6">
                                <CreditCard size={20} className="text-[#1D5F31]" />
                                <h3 className="font-bold uppercase tracking-widest text-xs text-black underline decoration-[#1D5F31] underline-offset-8">Métodos de Reembolso</h3>
                            </div>
                            <div className="space-y-6">
                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-black mb-2">Cartão de Crédito</p>
                                    <p className="text-xs text-black leading-relaxed">
                                        O estorno aparecerá em sua fatura em até duas faturas subsequentes, dependendo da operadora do cartão.
                                    </p>
                                </div>
                                <div className="h-px bg-slate-200" />
                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-black mb-2">PIX e Boleto (Asaas)</p>
                                    <p className="text-xs text-black leading-relaxed">
                                        Reembolsados via transferência bancária ou crédito em conta conforme processamento do gateway de pagamento.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Seção de Assinaturas (Premium Elite) - SEM FAIXA ESCURA */}
                    <section className="border border-black p-10 rounded-none relative overflow-hidden bg-white">
                        <div className="relative z-10">
                            <div className="flex items-center gap-3 mb-6">
                                <AlertCircle size={20} className="text-[#1D5F31]" />
                                <h3 className="font-bold uppercase tracking-[4px] text-xs text-black">Planos de Assinatura (Recorrência)</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                <div>
                                    <p className="text-sm text-black leading-relaxed">
                                        Diferente de cursos avulsos, planos como o <strong className="text-[#1D5F31]">"Premium Elite"</strong> permitem o cancelamento a qualquer momento para evitar cobranças futuras.
                                    </p>
                                </div>
                                <ul className="space-y-4">
                                    <li className="flex items-center gap-3">
                                        <div className="w-1.5 h-1.5 bg-[#1D5F31]" />
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-black">Reembolso em até 7 dias (CDC Brasil).</span>
                                    </li>
                                    <li className="flex items-center gap-3">
                                        <div className="w-1.5 h-1.5 bg-[#1D5F31]" />
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-black">Acesso mantido até o fim do ciclo pago.</span>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </section>

                    {/* FAQ Estilo Accordion Industrial */}
                    <section>
                        <h2 className="text-2xl font-bold uppercase tracking-tighter mb-8 text-black">Dúvidas Frequentes</h2>
                        <div className="space-y-4">
                            {[
                                { q: "Como solicito o meu reembolso?", a: "Entre em contato com nosso suporte técnico através do chat na plataforma ou envie um e-mail para suporte@powerplay.com com o ID da transação." },
                                { q: "Posso me arrepender após 30 dias?", a: "Após o prazo de 30 dias, a solicitação de reembolso será analisada individualmente apenas em casos de falhas técnicas comprovadas no acesso ao conteúdo." },
                                { q: "O reembolso é total?", a: "Sim, o PowerPlay devolve 100% do valor pago, sem taxas administrativas ocultas dentro do prazo de garantia." }
                            ].map((faq, idx) => (
                                <div key={idx} className="border border-black p-6 rounded-none group hover:border-[#1D5F31] transition-all">
                                    <h4 className="font-bold text-sm uppercase tracking-tight text-black mb-3 group-hover:text-[#1D5F31] transition-colors">{faq.q}</h4>
                                    <p className="text-xs text-black leading-relaxed font-bold uppercase tracking-wide">{faq.a}</p>
                                </div>
                            ))}
                        </div>
                    </section>

                    <footer className="pt-12 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-black">Última atualização: Abril de 2026</p>
                        <button 
                            onClick={() => typeof window !== 'undefined' && window.print()}
                            className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[#1D5F31] hover:underline"
                        >
                            <Banknote size={14} /> Versão para Impressão
                        </button>
                    </footer>
                </div>
            </main>
        </div>
    )
}
