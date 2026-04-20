import Link from 'next/link'

export default function PrivacidadePage() {
    return (
        <div className="space-y-12">
            <div>
                <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">PowerPlay Cursos</p>
                <h1 className="text-3xl md:text-5xl font-bold uppercase text-[#1a1a1a] tracking-tighter mb-4">Política de Privacidade</h1>
                <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">ÚLTIMA ATUALIZAÇÃO: 20 DE ABRIL DE 2026</p>
            </div>

            {/* Índice */}
            <div className="bg-slate-50 p-6 border border-slate-100 rounded-none mb-12">
                <h2 className="text-sm font-bold uppercase tracking-widest text-[#1a1a1a] mb-4">Índice</h2>
                <ul className="space-y-3">
                    <li><a href="#coleta-dados" className="text-sm font-bold text-[#1D5F31] hover:underline">1. Coleta de Dados</a></li>
                    <li><a href="#finalidade" className="text-sm font-bold text-[#1D5F31] hover:underline">2. Finalidade do Tratamento</a></li>
                    <li><a href="#compartilhamento" className="text-sm font-bold text-[#1D5F31] hover:underline">3. Compartilhamento com Terceiros</a></li>
                    <li><a href="#direitos-titular" className="text-sm font-bold text-[#1D5F31] hover:underline">4. Direitos do Titular (LGPD)</a></li>
                </ul>
            </div>

            <div className="space-y-12 text-base leading-relaxed text-slate-800">
                <section id="coleta-dados" className="scroll-mt-12">
                    <h2 className="text-xl font-bold uppercase border-b border-slate-200 pb-3 mb-6 text-[#1a1a1a]">1. Coleta de Dados</h2>
                    <p className="mb-4">
                        Para o funcionamento adequado da PowerPlay, coletamos, observando o princípio da minimização (dados estritamente necessários para a prestação e transparência do serviço final), as seguintes informações:
                    </p>
                    <ul className="list-disc pl-6 space-y-2 mb-4">
                        <li><span className="font-bold">Dados Cadastrais Identificáveis:</span> Nome completo (para emissão de certificados), E-mail de vínculo da conta, CPF ou CNPJ de processamento de compras (Asaas) e Endereço Físico Completo (CEP, Rua, Número, Cidade, Estado) por exigência de segurança fiscal bancária.</li>
                        <li><span className="font-bold">Dados Transacionais e Digitais:</span> Endereço IP do protocolo no formato local de rede ou externo gravado no ato da transação bancária e na marcação manual como "Eu Concordo" nas guias dos termos aplicáveis a sua conta final. Utilizamos identificadores locais (Cookies e LocalStorage) estritamente necessários para manter sua sessão ativa, garantir sua segurança no login (MFA) e lembrar suas preferências de volume no player de vídeo. Não utilizamos cookies de rastreamento para publicidade de terceiros.</li>
                        <li><span className="font-bold">Dados de Comportamento de Consumo:</span> Logs essenciais anonimizados e diretos de consumo de vídeo, progresso de curso e engajamento técnico com o vídeo capturados e fornecidos pelo player Mux.</li>
                    </ul>
                </section>

                <section id="finalidade" className="scroll-mt-12">
                    <h2 className="text-xl font-bold uppercase border-b border-slate-200 pb-3 mb-6 text-[#1a1a1a]">2. Finalidade do Tratamento</h2>
                    <p className="mb-4">
                        Os dados que coletamos não são e jamais serão utilizados para compilação ou venda em bancos de perfil para corretores de terceiros. A finalidade baseia-se unicamente em:
                    </p>
                    <ul className="list-disc pl-6 space-y-2 mb-4">
                        <li><span className="font-bold">Execução Básica de Contrato:</span> Permitir o processamento instantâneo via Pix ou cartão das compras de cursos vinculadas e liberadas da conta principal; emissão de Nota Fiscal automatizada para alunos em regra estrita via prestador Asaas; criação de uma governança contra fraudes.</li>
                        <li><span className="font-bold">Melhoria Direta da Experiência:</span> Analisar as métricas conjuntas das aulas e reproduções (onde um vídeo apresenta maiores pontos de re-visão) para prover aos seus instrutores dados didáticos, além de melhorar a recomendação da qualidade técnica do stream Mux.</li>
                    </ul>
                </section>

                <section id="compartilhamento" className="scroll-mt-12">
                    <h2 className="text-xl font-bold uppercase border-b border-slate-200 pb-3 mb-6 text-[#1a1a1a]">3. Compartilhamento com Terceiros</h2>
                    <p className="mb-4">
                        O compartilhamento virtual de dados ocorre estritamente dentro da governança entre o painel corporativo e seus sub-processadores encriptados conforme segue:
                    </p>
                    <ul className="list-disc pl-6 space-y-2 mb-4">
                        <li><span className="font-bold">Google Firebase Cloud:</span> Nossa estrutura segura primária. Armazena as informações das contas em banco de dados isolado hospedado no Google Firestore (para controle de alunos, matriculas) e infraestrutura Authentication de autorização segura criptografada e verificada de senha.</li>
                        <li><span className="font-bold">Asaas Pagamentos SA:</span> Os dados cadastrais de base financeira, CPF emitido e Endereço Físico Completo, além de email para contato de falhas de pix ou links de boleto são encaminhados obrigatoriamente para a plataforma via APIs restritas para viabilizar e assinar a transação fiscalmente conforme normatiza o Banco Central e Ministério da Fazenda do Brasil.</li>
                        <li><span className="font-bold">Mux Video Data Ecosystem:</span> Estatísticas de interatividade e métricas de desempenho de dados, bits reproduzidos nos clientes sob a ótica analítica para o streaming restrito.</li>
                    </ul>
                    <p className="mb-4">
                        O usuário compreende que a utilização de sub-processadores como Google Firebase e Mux Video pode implicar na transferência internacional de dados para servidores localizados nos Estados Unidos, país que oferece grau de proteção de dados adequado e conformidade com frameworks internacionais de segurança.
                    </p>
                </section>

                <section id="direitos-titular" className="scroll-mt-12">
                    <h2 className="text-xl font-bold uppercase border-b border-slate-200 pb-3 mb-6 text-[#1a1a1a]">4. Direitos do Titular (LGPD)</h2>
                    <p className="mb-4">
                        Em aderência irrestrita a todas as exigências nacionais por força da <span className="font-bold">Lei Geral de Proteção de Dados (Lei nº 13.709/2018)</span>, resguardamos e promovemos ativamente seu direito claro à transparência e à sua identidade.
                    </p>
                    <p className="mb-4">
                        A exclusão e revogação do termo e consentimento e consequente e permanente ação irreversível de obliteração de sua conta da base virtual do Firebase Auth Platform, dados vinculados e faturamento não efetivado, bem como o pedido total ou consulta de portabilidade e registro eletrônico unificado com finalidades, podem e devem ser exercidas ou iniciadas sempre, e unicamente, pelo próprio titular das informações livre de barreiras de atendente contanto logado na aplicação. Esse percurso digital autônomo está permanentemente oferecido nas margens de Configuração de seu painel do aluno.
                    </p>
                    <p className="mb-4">
                        Os dados serão conservados pelo período necessário para a prestação dos serviços. Dados vinculados a transações financeiras (Notas Fiscais e registros de pagamento no Asaas) serão mantidos pelo prazo mínimo de 5 (cinco) anos, conforme exigência da legislação tributária e civil brasileira, mesmo após a exclusão da conta pelo usuário.
                    </p>
                    <div className="mt-8 mb-4">
                        <Link href="/dashboard-student/settings" className="inline-flex items-center justify-center bg-transparent border border-slate-300 px-6 py-4 text-[10px] font-bold uppercase tracking-[3px] hover:border-slate-800 transition-colors rounded-none">
                            Acessar Configurações da Conta Segura
                        </Link>
                    </div>
                </section>
            </div>
        </div>
    )
}
