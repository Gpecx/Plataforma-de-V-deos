export default function TermosPage() {
    return (
        <div className="space-y-12">
            <div>
                <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">PowerPlay Cursos</p>
                <h1 className="text-3xl md:text-5xl font-bold uppercase text-[#1a1a1a] tracking-tighter mb-4">Termos de Uso</h1>
                <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">ÚLTIMA ATUALIZAÇÃO: 20 DE ABRIL DE 2026</p>
            </div>

            {/* Índice */}
            <div className="bg-slate-50 p-6 border border-slate-100 rounded-none mb-12">
                <h2 className="text-sm font-bold uppercase tracking-widest text-[#1a1a1a] mb-4">Índice</h2>
                <ul className="space-y-3">
                    <li><a href="#acesso-conta" className="text-sm font-bold text-[#1D5F31] hover:underline">1. Acesso à Conta</a></li>
                    <li><a href="#matricula-acesso" className="text-sm font-bold text-[#1D5F31] hover:underline">2. Matrícula e Período de Acesso</a></li>
                    <li><a href="#pagamentos-reembolsos" className="text-sm font-bold text-[#1D5F31] hover:underline">3. Pagamentos e Reembolsos</a></li>
                    <li><a href="#regras-conduta" className="text-sm font-bold text-[#1D5F31] hover:underline">4. Regras de Conduta</a></li>
                    <li><a href="#propriedade-intelectual" className="text-sm font-bold text-[#1D5F31] hover:underline">5. Propriedade Intelectual</a></li>
                    <li><a href="#limitacao-responsabilidade" className="text-sm font-bold text-[#1D5F31] hover:underline">6. Limitação de Responsabilidade</a></li>
                </ul>
            </div>

            <div className="space-y-12 text-base leading-relaxed text-slate-800">
                <section id="acesso-conta" className="scroll-mt-12">
                    <h2 className="text-xl font-bold uppercase border-b border-slate-200 pb-3 mb-6 text-[#1a1a1a]">1. Acesso à Conta</h2>
                    <p className="mb-4">
                        Ao criar uma conta na plataforma PowerPlay, o aluno entende que é o único responsável pela segurança de suas credenciais de acesso (e-mail e senha). 
                    </p>
                    <p className="mb-4">
                        A plataforma se exime de responsabilidades mediante acessos não autorizados motivados por negligência no compartilhamento ou armazenamento de senhas pelo usuário.
                    </p>
                    <p className="mb-4">
                        Para garantir a integridade da plataforma, a PowerPlay utiliza Autenticação de Dois Fatores (MFA). É de responsabilidade do usuário manter o acesso ao seu dispositivo de autenticação secundário configurado.
                    </p>
                </section>

                <section id="matricula-acesso" className="scroll-mt-12">
                    <h2 className="text-xl font-bold uppercase border-b border-slate-200 pb-3 mb-6 text-[#1a1a1a]">2. MATRÍCULA E PERÍODO DE ACESSO</h2>
                    <p className="mb-4">
                        Uma vez realizada a aquisição de um curso, o aluno obtém o direito não exclusivo de visualização do conteúdo (videoaulas e materiais de apoio) pelo período determinado de 12 (doze) meses, contados a partir da data de confirmação do pagamento.
                    </p>
                    <p className="mb-4">
                        Findo este período de 12 meses, o acesso ao conteúdo será automaticamente encerrado, salvo se houver renovação da matrícula conforme as condições vigentes na época. A PowerPlay reserva-se o direito de atualizar, remover ou modificar conteúdos dentro deste período para garantir a qualidade técnica e pedagógica do material.
                    </p>
                    <p className="mb-4">
                        O acesso ao conteúdo depende da estabilidade de serviços de rede e provedores de infraestrutura terceirizados (ex: servidores de vídeo e hospedagem). A PowerPlay não se responsabiliza por interrupções temporárias causadas por falhas técnicas globais nesses provedores, mas compromete-se a envidar esforços para o restabelecimento imediato.
                    </p>
                </section>

                <section id="pagamentos-reembolsos" className="scroll-mt-12">
                    <h2 className="text-xl font-bold uppercase border-b border-slate-200 pb-3 mb-6 text-[#1a1a1a]">3. Pagamentos e Reembolsos</h2>
                    <p className="mb-4">
                        Todo o trânsito financeiro é rigorosamente intermediado e auditado pela provedora Asaas, que fará a validação, cobrança e aprovação dos pagamentos. 
                    </p>
                    <p className="mb-4">
                        <span className="font-bold">Política de Estorno (Garantia incondicional):</span> Conforme preconiza o Código de Defesa do Consumidor (Art. 49), os alunos possuem pleno direito ao arrependimento no prazo de 7 (sete) dias estritos a contar do dia exato e liberação da compra, com a devolução integral das quantias pagas sem multas ou questionamentos.
                    </p>
                </section>

                <section id="regras-conduta" className="scroll-mt-12">
                    <h2 className="text-xl font-bold uppercase border-b border-slate-200 pb-3 mb-6 text-[#1a1a1a]">4. Regras de Conduta</h2>
                    <p className="mb-4">
                        Na plataforma PowerPlay, impõe-se a seguinte limitação de conduta ao aluno ou professor:
                    </p>
                    <ul className="list-disc pl-6 space-y-2 mb-4">
                        <li>Fica expressamente proibido o compartilhamento de sua conta de acesso e liberação com terceiros. A conta é pessoal e intransferível.</li>
                        <li>Práticas relativas à pirataria, incluindo gravação via softwares externos, cópia do conteúdo protegido, download de reproduções protegidas, redistribuição ou facilitação destas, implicam o bloqueio, encerramento da conta na plataforma sem direito de reembolso e responsabilização legal por violação do patrimônio autoral do instrutor envolvido.</li>
                    </ul>
                </section>

                <section id="propriedade-intelectual" className="scroll-mt-12">
                    <h2 className="text-xl font-bold uppercase border-b border-slate-200 pb-3 mb-6 text-[#1a1a1a]">5. Propriedade Intelectual</h2>
                    <p className="mb-4">
                        O software, código-fonte, interfaces, marca, logo, iconografia, formato de páginas e organização técnica formam a exclusão de uso e a propriedade intelectual estritamente e resguardados da PowerPlay. 
                    </p>
                    <p className="mb-4">
                        Os instrutores assumem total autoria e preservam irrestritos os direitos autorais relativos aos vídeos, textos explicativos, descrições e materiais de download disponibilizados por eles ativamente vinculados a seus cursos publicados na Plataforma. É concedido ao aluno e licença restrita para uso técnico pessoal e prático unicamente. O aluno compreende que toda exploração comercial que parta deste mesmo conteúdo e autoria consumidos nesta rede está perante um crime punível pela justiça.
                    </p>
                </section>

                <section id="limitacao-responsabilidade" className="scroll-mt-12">
                    <h2 className="text-xl font-bold uppercase border-b border-slate-200 pb-3 mb-6 text-[#1a1a1a]">6. LIMITAÇÃO DE RESPONSABILIDADE</h2>
                    <p className="mb-4">
                        A PowerPlay provê a tecnologia para hospedagem e transmissão do conhecimento. O sucesso no aprendizado e a aplicação prática do conteúdo dependem exclusivamente do empenho do aluno. A plataforma e os instrutores não garantem resultados financeiros, profissionais ou aprovações em exames decorrentes do consumo do material.
                    </p>
                </section>
            </div>
        </div>
    )
}
