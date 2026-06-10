"use server"

import { adminDb } from "@/lib/firebase-admin"
import { revalidatePath } from "next/cache"
import { getSessionUser } from "@/app/actions/auth"

export interface LegalDocument {
    id: string
    title: string
    slug: string
    content: string
    lastUpdated: any
    description: string
}

const COLLECTION = 'legal_content'
const SETTINGS_COLLECTION = 'settings'
const LEGAL_DOCS_ID = 'legal_docs'

export interface LegalDocsSettings {
    terms: string
    privacy: string
    refund: string
    lgpd: string
}

export async function getLegalDocuments() {
    try {
        const user = await getSessionUser() // SEC
        if (!user || user.role !== 'admin') { // SEC
            return [] // SEC
        } // SEC
        const snapshot = await adminDb.collection(COLLECTION).orderBy('title', 'asc').get()
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            lastUpdated: doc.data().lastUpdated?.toDate().toISOString() || new Date().toISOString()
        })) as LegalDocument[]
    } catch (error) {
        console.error("Erro ao buscar documentos legais:", error)
        return []
    }
}

export async function getLegalDocumentBySlug(slug: string) {
    try {
        const user = await getSessionUser() // SEC
        if (!user || user.role !== 'admin') { // SEC
            return null // SEC
        } // SEC
        const snapshot = await adminDb.collection(COLLECTION).where('slug', '==', slug).limit(1).get()
        if (snapshot.empty) return null
        
        const doc = snapshot.docs[0]
        return {
            id: doc.id,
            ...doc.data(),
            lastUpdated: doc.data().lastUpdated?.toDate().toISOString() || new Date().toISOString()
        } as LegalDocument
    } catch (error) {
        console.error(`Erro ao buscar documento ${slug}:`, error)
        return null
    }
}

export async function saveLegalDocument(data: Partial<LegalDocument>) {
    try {
        const user = await getSessionUser()
        if (!user || user.role !== 'admin') {
            return { success: false, error: "Não autorizado" }
        }

        if (!data.slug) throw new Error("Slug é obrigatório")

        const docRef = adminDb.collection(COLLECTION).doc(data.slug)
        await docRef.set({
            ...data,
            lastUpdated: new Date()
        }, { merge: true })

        revalidatePath('/admin/legal')
        revalidatePath(`/legal/${data.slug}`)
        return { success: true }
    } catch (error) {
        console.error("Erro ao salvar documento legal:", error)
        return { success: false, error: "Falha ao salvar o documento" }
    }
}
export async function getLegalDocsSettings(): Promise<LegalDocsSettings> {
    try {
        const user = await getSessionUser() // SEC
        if (!user || user.role !== 'admin') { // SEC
            return getLegalDocsDefaults() // SEC
        } // SEC
        const doc = await adminDb.collection(SETTINGS_COLLECTION).doc(LEGAL_DOCS_ID).get()
        const defaults = await getLegalDocsDefaults()
        if (!doc.exists) {
            return defaults
        }
        // Merge with defaults to ensure no field is undefined if document is partial
        return { ...defaults, ...(doc.data() as Partial<LegalDocsSettings>) }
    } catch (error) {
        console.error("Erro ao buscar configurações legais:", error)
        return getLegalDocsDefaults()
    }
}

export async function getPublicLegalDocsSettings(): Promise<LegalDocsSettings> {
    try {
        const doc = await adminDb.collection(SETTINGS_COLLECTION).doc(LEGAL_DOCS_ID).get()
        const defaults = await getLegalDocsDefaults()
        if (!doc.exists) {
            return defaults
        }
        return { ...defaults, ...(doc.data() as Partial<LegalDocsSettings>) }
    } catch (error) {
        console.error("Erro ao buscar configurações legais:", error)
        return getLegalDocsDefaults()
    }
}

export async function saveLegalDocsSettings(data: Partial<LegalDocsSettings>, revalidate = true) {
    try {
        const user = await getSessionUser()
        if (!user || user.role !== 'admin') {
            return { success: false, error: "Não autorizado" }
        }

        await adminDb.collection(SETTINGS_COLLECTION).doc(LEGAL_DOCS_ID).set(data, { merge: true })
        if (revalidate) {
            revalidatePath('/admin/legal')
            revalidatePath('/termos')
            revalidatePath('/privacidade')
            revalidatePath('/dashboard-student/refund-policy')
        }
        return { success: true }
    } catch (error) {
        console.error("Erro ao salvar configurações legais:", error)
        return { success: false, error: "Falha ao salvar o documento" }
    }
}

export async function getLegalDocsDefaults(): Promise<LegalDocsSettings> {
    return {
        terms: `<div>
<p class="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">PowerPlay Cursos</p>
<h1 class="text-3xl md:text-5xl font-bold uppercase text-[#1a1a1a] tracking-tighter mb-4">Termos de Uso</h1>
<p class="text-sm font-bold text-slate-500 uppercase tracking-widest">ÚLTIMA ATUALIZAÇÃO: 20 DE ABRIL DE 2026</p>

<div class="bg-slate-50 p-6 border border-slate-100 rounded-none mb-12">
<h2 class="text-sm font-bold uppercase tracking-widest text-[#1a1a1a] mb-4">Índice</h2>
<ul class="space-y-3">
<li><a href="#acesso-conta" class="text-sm font-bold text-[#1D5F31] hover:underline">1. Acesso à Conta</a></li>
<li><a href="#matricula-acesso" class="text-sm font-bold text-[#1D5F31] hover:underline">2. Matrícula e Período de Acesso</a></li>
<li><a href="#pagamentos-reembolsos" class="text-sm font-bold text-[#1D5F31] hover:underline">3. Pagamentos e Reembolsos</a></li>
<li><a href="#regras-conduta" class="text-sm font-bold text-[#1D5F31] hover:underline">4. Regras de Conduta</a></li>
<li><a href="#propriedade-intelectual" class="text-sm font-bold text-[#1D5F31] hover:underline">5. Propriedade Intelectual</a></li>
<li><a href="#limitacao-responsabilidade" class="text-sm font-bold text-[#1D5F31] hover:underline">6. Limitação de Responsabilidade</a></li>
</ul>
</div>

<div class="space-y-12 text-base leading-relaxed text-slate-800">
<section id="acesso-conta" class="scroll-mt-12">
<h2 class="text-xl font-bold uppercase border-b border-slate-200 pb-3 mb-6 text-[#1a1a1a]">1. Acesso à Conta</h2>
<p class="mb-4">Ao criar uma conta na plataforma PowerPlay, o aluno entende que é o único responsável pela segurança de suas credenciais de acesso (e-mail e senha).</p>
<p class="mb-4">A plataforma se exime de responsabilidades mediante acessos não autorizados motivados por negligência no compartilhamento ou armazenamento de senhas pelo usuário.</p>
<p class="mb-4">Para garantir a integridade da plataforma, a PowerPlay utiliza Autenticação de Dois Fatores (MFA). É de responsabilidade do usuário manter o acesso ao seu dispositivo de autenticação secundário configurado.</p>
</section>

<section id="matricula-acesso" class="scroll-mt-12">
<h2 class="text-xl font-bold uppercase border-b border-slate-200 pb-3 mb-6 text-[#1a1a1a]">2. MATRÍCULA E PERÍODO DE ACESSO</h2>
<p class="mb-4">Uma vez realizada a aquisição de um curso, o aluno obtém o direito não exclusivo de visualização do conteúdo (videoaulas e materiais de apoio) pelo período determinado de 12 (doze) meses, contados a partir da data de confirmação do pagamento.</p>
<p class="mb-4">Findo este período de 12 meses, o acesso ao conteúdo será automaticamente encerrado, salvo se houver renovação da matrícula conforme as condições vigentes na época. A PowerPlay reserva-se o direito de atualizar, remover ou modificar conteúdos dentro deste período para garantir a qualidade técnica e pedagógica do material.</p>
<p class="mb-4">O acesso ao conteúdo depende da estabilidade de serviços de rede e provedores de infraestrutura terceirizados (ex: servidores de vídeo e hospedagem). A PowerPlay não se responsabiliza por interrupções temporárias causadas por falhas técnicas globais nesses provedores, mas compromete-se a envidar esforços para o restabelecimento imediato.</p>
</section>

<section id="pagamentos-reembolsos" class="scroll-mt-12">
<h2 class="text-xl font-bold uppercase border-b border-slate-200 pb-3 mb-6 text-[#1a1a1a]">3. Pagamentos e Reembolsos</h2>
<p class="mb-4">Todo o trânsito financeiro é rigorosamente intermediado e auditado pela provedora Asaas, que fará a validação, cobrança e aprovação dos pagamentos.</p>
<p class="mb-4"><span class="font-bold">Política de Estorno (Garantia incondicional):</span> Conforme preconiza o Código de Defesa do Consumidor (Art. 49), os alunos possuem pleno direito ao arrependimento no prazo de 7 (sete) dias estritos a contar do dia exato e liberação da compra, com a devolução integral das quantias pagas sem multas ou questionamentos.</p>
</section>

<section id="regras-conduta" class="scroll-mt-12">
<h2 class="text-xl font-bold uppercase border-b border-slate-200 pb-3 mb-6 text-[#1a1a1a]">4. Regras de Conduta</h2>
<p class="mb-4">Na plataforma PowerPlay, impõe-se a seguinte limitação de conduta ao aluno ou professor:</p>
<ul class="list-disc pl-6 space-y-2 mb-4">
<li>Fica expressamente proibido o compartilhamento de sua conta de acesso e liberação com terceiros. A conta é pessoal e intransferível.</li>
<li>Práticas relativas à pirataria, incluindo gravação via softwares externos, cópia do conteúdo protegido, download de reproduções protegidas, redistribuição ou facilitação destas, implicam o bloqueio, encerramento da conta na plataforma sem direito de reembolso e responsabilização legal por violação do patrimônio autoral do instrutor envolvido.</li>
</ul>
</section>

<section id="propriedade-intelectual" class="scroll-mt-12">
<h2 class="text-xl font-bold uppercase border-b border-slate-200 pb-3 mb-6 text-[#1a1a1a]">5. Propriedade Intelectual</h2>
<p class="mb-4">O software, código-fonte, interfaces, marca, logo, iconografia, formato de páginas e organização técnica formam a exclusão de uso e a propriedade intelectual estritamente e resguardados da PowerPlay.</p>
<p class="mb-4">Os instrutores assumem total autoria e preservam irrestritos os direitos autorais relativos aos vídeos, textos explicativos, descrições e materiais de download disponibilizados por eles ativamente vinculados a seus cursos publicados na Plataforma. É concedido ao aluno e licença restrita para uso técnico pessoal e prático unicamente. O aluno compreende que toda exploração comercial que parta deste mesmo conteúdo e autoria consumidos nesta rede está perante um crime punível pela justiça.</p>
</section>

<section id="limitacao-responsabilidade" class="scroll-mt-12">
<h2 class="text-xl font-bold uppercase border-b border-slate-200 pb-3 mb-6 text-[#1a1a1a]">6. LIMITAÇÃO DE RESPONSABILIDADE</h2>
<p class="mb-4">A PowerPlay provê a tecnologia para hospedagem e transmissão do conhecimento. O sucesso no aprendizado e a aplicação prática do conteúdo dependem exclusivamente do empenho do aluno. A plataforma e os instrutores não garantem resultados financeiros, profissionais ou aprovações em exames decorrentes do consumo do material.</p>
</section>
</div>
</div>`,
        privacy: `<div>
<p class="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">PowerPlay Cursos</p>
<h1 class="text-3xl md:text-5xl font-bold uppercase text-[#1a1a1a] tracking-tighter mb-4">Política de Privacidade</h1>
<p class="text-sm font-bold text-slate-500 uppercase tracking-widest">ÚLTIMA ATUALIZAÇÃO: 20 DE ABRIL DE 2026</p>

<div class="bg-slate-50 p-6 border border-slate-100 rounded-none mb-12">
<h2 class="text-sm font-bold uppercase tracking-widest text-[#1a1a1a] mb-4">Índice</h2>
<ul class="space-y-3">
<li><a href="#coleta-dados" class="text-sm font-bold text-[#1D5F31] hover:underline">1. Coleta de Dados</a></li>
<li><a href="#finalidade" class="text-sm font-bold text-[#1D5F31] hover:underline">2. Finalidade do Tratamento</a></li>
<li><a href="#compartilhamento" class="text-sm font-bold text-[#1D5F31] hover:underline">3. Compartilhamento com Terceiros</a></li>
<li><a href="#direitos-titular" class="text-sm font-bold text-[#1D5F31] hover:underline">4. Direitos do Titular (LGPD)</a></li>
</ul>
</div>

<div class="space-y-12 text-base leading-relaxed text-slate-800">
<section id="coleta-dados" class="scroll-mt-12">
<h2 class="text-xl font-bold uppercase border-b border-slate-200 pb-3 mb-6 text-[#1a1a1a]">1. Coleta de Dados</h2>
<p class="mb-4">Para o funcionamento adequado da PowerPlay, coletamos, observando o princípio da minimização (dados estritamente necessários para a prestação e transparência do serviço final), as seguintes informações:</p>
<ul class="list-disc pl-6 space-y-2 mb-4">
<li><span class="font-bold">Dados Cadastrais Identificáveis:</span> Nome completo (para emissão de certificados), E-mail de vínculo da conta, CPF ou CNPJ de processamento de compras (Asaas) e Endereço Físico Completo (CEP, Rua, Número, Cidade, Estado) por exigência de segurança fiscal bancária.</li>
<li><span class="font-bold">Dados Transacionais e Digitais:</span> Endereço IP do protocolo no formato local de rede ou externo gravado no ato da transação bancária e na marcação manual como "Eu Concordo" nas guias dos termos aplicáveis a sua conta final. Utilizamos identificadores locais (Cookies e LocalStorage) estritamente necessários para manter sua sessão ativa, garantir sua segurança no login (MFA) e lembrar suas preferências de volume no player de vídeo. Não utilizamos cookies de rastreamento para publicidade de terceiros.</li>
<li><span class="font-bold">Dados de Comportamento de Consumo:</span> Logs essenciais anonimizados e diretos de consumo de vídeo, progresso de curso e engajamento técnico com o vídeo capturados e fornecidos pelo player Mux.</li>
</ul>
</section>

<section id="finalidade" class="scroll-mt-12">
<h2 class="text-xl font-bold uppercase border-b border-slate-200 pb-3 mb-6 text-[#1a1a1a]">2. Finalidade do Tratamento</h2>
<p class="mb-4">Os dados que coletamos não são e jamais serão utilizados para compilação ou venda em bancos de perfil para corretores de terceiros. A finalidade baseia-se unicamente em:</p>
<ul class="list-disc pl-6 space-y-2 mb-4">
<li><span class="font-bold">Execução Básica de Contrato:</span> Permitir o processamento instantâneo via Pix ou cartão das compras de cursos vinculadas e liberadas da conta principal; emissão de Nota Fiscal automatizada para alunos em regra estrita via prestador Asaas; criação de uma governança contra fraudes.</li>
<li><span class="font-bold">Melhoria Direta da Experiência:</span> Analisar as métricas conjuntas das aulas e reproduções (onde um vídeo apresenta maiores pontos de re-visão) para prover aos seus instrutores dados didáticos, além de melhorar a recomendação da qualidade técnica do stream Mux.</li>
</ul>
</section>

<section id="compartilhamento" class="scroll-mt-12">
<h2 class="text-xl font-bold uppercase border-b border-slate-200 pb-3 mb-6 text-[#1a1a1a]">3. Compartilhamento com Terceiros</h2>
<p class="mb-4">O compartilhamento virtual de dados ocorre estritamente dentro da governança entre o painel corporativo e seus sub-processadores encriptados conforme segue:</p>
<ul class="list-disc pl-6 space-y-2 mb-4">
<li><span class="font-bold">Google Firebase Cloud:</span> Nossa estrutura segura primária. Armazena as informações das contas em banco de dados isolado hospedado no Google Firestore (para controle de alunos, matriculas) e infraestrutura Authentication de autorização segura criptografada e verificada de senha.</li>
<li><span class="font-bold">Asaas Pagamentos SA:</span> Os dados cadastrais de base financeira, CPF emitido e Endereço Físico Completo, além de email para contato de falhas de pix ou links de boleto são encaminhados obrigatoriamente para a plataforma via APIs restritas para viabilizar e assinar a transação fiscalmente conforme normatiza o Banco Central e Ministério da Fazenda do Brasil.</li>
<li><span class="font-bold">Mux Video Data Ecosystem:</span> Estatísticas de interatividade e métricas de desempenho de dados, bits reproduzidos nos clientes sob a ótica analítica para o streaming restrito.</li>
</ul>
<p class="mb-4">O usuário compreende que a utilização de sub-processadores como Google Firebase e Mux Video pode implicar na transferência internacional de dados para servidores localizados nos Estados Unidos, país que oferece grau de proteção de dados adequado e conformidade com frameworks internacionais de segurança.</p>
</section>

<section id="direitos-titular" class="scroll-mt-12">
<h2 class="text-xl font-bold uppercase border-b border-slate-200 pb-3 mb-6 text-[#1a1a1a]">4. Direitos do Titular (LGPD)</h2>
<p class="mb-4">Em aderência irrestrita a todas as exigências nacionais por força da <span class="font-bold">Lei Geral de Proteção de Dados (Lei nº 13.709/2018)</span>, salvaguardamos e promovemos ativamente seu direito claro à transparência e à sua identidade.</p>
<p class="mb-4">A exclusão e revogação do termo e consentimento e consequente e permanente ação irreversível de obliteração de sua conta da base virtual do Firebase Auth Platform, dados vinculados e faturamento não efetivado, bem como o pedido total ou consulta de portabilidade e registro eletrônico unificado com finalidades, podem e devem ser exercidas ou iniciadas sempre, e unicamente, pelo próprio titular das informações livre de barreiras de atendente contanto logado na aplicação. Esse percurso digital autônomo está permanentemente oferecido nas margens de Configuração de seu painel do aluno.</p>
<p class="mb-4">Os dados serão conservados pelo período necessário para a prestação dos serviços. Dados vinculados a transações financeiras (Notas Fiscais e registros de pagamento no Asaas) serão mantidos pelo prazo mínimo de 5 (cinco) anos, conforme exigência da legislação tributária e civil brasileira, mesmo após a exclusão da conta pelo usuário.</p>
</section>
</div>
</div>`,
        refund: `<h2>Política de Reembolso</h2>
<p>Conforme preconiza o Código de Defesa do Consumidor (Art. 49), os alunos possuem pleno direito ao arrependimento no prazo de 7 (sete) dias estritos a contar do dia exato e liberação da compra, com a devolução integral das quantias pagas sem multas ou questionamentos.</p>
<h3>Garantia Incondicional</h3>
<p>Caso o aluno não fique satisfeito com o conteúdo, bastará solicitar o reembolso dentro de 7 dias através do painel do aluno ou entrando em contato com nosso suporte.</p>`,
        lgpd: `<h2>Lei Geral de Proteção de Dados - LGPD</h2>
<p>A PowerPlay está em conformidade com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018).</p>
<h3>Seus Direitos</h3>
<ul>
<li>Direito de acesso aos seus dados pessoais</li>
<li>Direito de correção de dados incompletos, inexatos ou desatualizados</li>
<li>Direito de anonimização, bloqueio ou eliminação de dados desnecessários</li>
<li>Direito de portabilidade a outro fornecedor de serviço</li>
<li>Direito de eliminação dos dados pessoais tratados com base no consentimento</li>
<li>Direito de informação sobre compartilhamento de dados</li>
<li>Direito de revogação do consentimento</li>
</ul>
<p>Para exercer seus direitos como titular, envie solicitação para <strong>dpo@powerplaycursos.com.br</strong> — Encarregado de Dados (DPO) da PowerPlay Cursos. Você também pode acessar o painel de configurações do aluno.</p>`
    }
}

export async function initializeLegalDocuments() {
    const initialDocs = [
        {
            title: "Política de Reembolso",
            slug: "refund-policy",
            description: "Diretrizes para solicitações de estorno e cancelamento.",
            content: `<h2>Política de Reembolso</h2>
<p>Conforme preconiza o Código de Defesa do Consumidor (Art. 49), os alunos possuem pleno direito ao arrependimento no prazo de 7 (sete) dias estritos a contar do dia exato e liberação da compra, com a devolução integral das quantias pagas sem multas ou questionamentos.</p>
<h3>Garantia Incondicional</h3>
<p>Caso o aluno não fique satisfeito com o conteúdo, bastará solicitar o reembolso dentro de 7 dias através do painel do aluno ou entrando em contato com nosso suporte.</p>`
        },
        {
            title: "Termos de Uso",
            slug: "terms-of-use",
            description: "Regras gerais de utilização da plataforma PowerPlay.",
            content: `<div>
<p class="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">PowerPlay Cursos</p>
<h1 class="text-3xl md:text-5xl font-bold uppercase text-[#1a1a1a] tracking-tighter mb-4">Termos de Uso</h1>
<p class="text-sm font-bold text-slate-500 uppercase tracking-widest">ÚLTIMA ATUALIZAÇÃO: 20 DE ABRIL DE 2026</p>

<div class="bg-slate-50 p-6 border border-slate-100 rounded-none mb-12">
<h2 class="text-sm font-bold uppercase tracking-widest text-[#1a1a1a] mb-4">Índice</h2>
<ul class="space-y-3">
<li><a href="#acesso-conta" class="text-sm font-bold text-[#1D5F31] hover:underline">1. Acesso à Conta</a></li>
<li><a href="#matricula-acesso" class="text-sm font-bold text-[#1D5F31] hover:underline">2. Matrícula e Período de Acesso</a></li>
<li><a href="#pagamentos-reembolsos" class="text-sm font-bold text-[#1D5F31] hover:underline">3. Pagamentos e Reembolsos</a></li>
<li><a href="#regras-conduta" class="text-sm font-bold text-[#1D5F31] hover:underline">4. Regras de Conduta</a></li>
<li><a href="#propriedade-intelectual" class="text-sm font-bold text-[#1D5F31] hover:underline">5. Propriedade Intelectual</a></li>
<li><a href="#limitacao-responsabilidade" class="text-sm font-bold text-[#1D5F31] hover:underline">6. Limitação de Responsabilidade</a></li>
</ul>
</div>

<div class="space-y-12 text-base leading-relaxed text-slate-800">
<section id="acesso-conta" class="scroll-mt-12">
<h2 class="text-xl font-bold uppercase border-b border-slate-200 pb-3 mb-6 text-[#1a1a1a]">1. Acesso à Conta</h2>
<p class="mb-4">Ao criar uma conta na plataforma PowerPlay, o aluno entende que é o único responsável pela segurança de suas credenciais de acesso (e-mail e senha).</p>
<p class="mb-4">A plataforma se exime de responsabilidades mediante acessos não autorizados motivados por negligência no compartilhamento ou armazenamento de senhas pelo usuário.</p>
<p class="mb-4">Para garantir a integridade da plataforma, a PowerPlay utiliza Autenticação de Dois Fatores (MFA). É de responsabilidade do usuário manter o acesso ao seu dispositivo de autenticação secundário configurado.</p>
</section>

<section id="matricula-acesso" class="scroll-mt-12">
<h2 class="text-xl font-bold uppercase border-b border-slate-200 pb-3 mb-6 text-[#1a1a1a]">2. MATRÍCULA E PERÍODO DE ACESSO</h2>
<p class="mb-4">Uma vez realizada a aquisição de um curso, o aluno obtém o direito não exclusivo de visualização do conteúdo (videoaulas e materiais de apoio) pelo período determinado de 12 (doze) meses, contados a partir da data de confirmação do pagamento.</p>
<p class="mb-4">Findo este período de 12 meses, o acesso ao conteúdo será automaticamente encerrado, salvo se houver renovação da matrícula conforme as condições vigentes na época. A PowerPlay reserva-se o direito de atualizar, remover ou modificar conteúdos dentro deste período para garantir a qualidade técnica e pedagógica do material.</p>
<p class="mb-4">O acesso ao conteúdo depende da estabilidade de serviços de rede e provedores de infraestrutura terceirizados (ex: servidores de vídeo e hospedagem). A PowerPlay não se responsabiliza por interrupções temporárias causadas por falhas técnicas globais nesses provedores, mas compromete-se a envidar esforços para o restabelecimento imediato.</p>
</section>

<section id="pagamentos-reembolsos" class="scroll-mt-12">
<h2 class="text-xl font-bold uppercase border-b border-slate-200 pb-3 mb-6 text-[#1a1a1a]">3. Pagamentos e Reembolsos</h2>
<p class="mb-4">Todo o trânsito financeiro é rigorosamente intermediado e auditado pela provedora Asaas, que fará a validação, cobrança e aprovação dos pagamentos.</p>
<p class="mb-4"><span class="font-bold">Política de Estorno (Garantia incondicional):</span> Conforme preconiza o Código de Defesa do Consumidor (Art. 49), os alunos possuem pleno direito ao arrependimento no prazo de 7 (sete) dias estritos a contar do dia exato e liberação da compra, com a devolução integral das quantias pagas sem multas ou questionamentos.</p>
</section>

<section id="regras-conduta" class="scroll-mt-12">
<h2 class="text-xl font-bold uppercase border-b border-slate-200 pb-3 mb-6 text-[#1a1a1a]">4. Regras de Conduta</h2>
<p class="mb-4">Na plataforma PowerPlay, impõe-se a seguinte limitação de conduta ao aluno ou professor:</p>
<ul class="list-disc pl-6 space-y-2 mb-4">
<li>Fica expressamente proibido o compartilhamento de sua conta de acesso e liberação com terceiros. A conta é pessoal e intransferível.</li>
<li>Práticas relativas à pirataria, incluindo gravação via softwares externos, cópia do conteúdo protegido, download de reproduções protegidas, redistribuição ou facilitação destas, implicam o bloqueio, encerramento da conta na plataforma sem direito de reembolso e responsabilização legal por violação do patrimônio autoral do instrutor envolvido.</li>
</ul>
</section>

<section id="propriedade-intelectual" class="scroll-mt-12">
<h2 class="text-xl font-bold uppercase border-b border-slate-200 pb-3 mb-6 text-[#1a1a1a]">5. Propriedade Intelectual</h2>
<p class="mb-4">O software, código-fonte, interfaces, marca, logo, iconografia, formato de páginas e organização técnica formam a exclusão de uso e a propriedade intelectual estritamente e resguardados da PowerPlay.</p>
<p class="mb-4">Os instrutores assumem total autoria e preservam irrestritos os direitos autorais relativos aos vídeos, textos explicativos, descrições e materiais de download disponibilizados por eles ativamente vinculados a seus cursos publicados na Plataforma. É concedido ao aluno e licença restrita para uso técnico pessoal e prático unicamente. O aluno compreende que toda exploração comercial que parta deste mesmo conteúdo e autoria consumidos nesta rede está perante um crime punível pela justiça.</p>
</section>

<section id="limitacao-responsabilidade" class="scroll-mt-12">
<h2 class="text-xl font-bold uppercase border-b border-slate-200 pb-3 mb-6 text-[#1a1a1a]">6. LIMITAÇÃO DE RESPONSABILIDADE</h2>
<p class="mb-4">A PowerPlay provê a tecnologia para hospedagem e transmissão do conhecimento. O sucesso no aprendizado e a aplicação prática do conteúdo dependem exclusivamente do empenho do aluno. A plataforma e os instrutores não garantem resultados financeiros, profissionais ou aprovações em exames decorrentes do consumo do material.</p>
</section>
</div>
</div>`
        },
        {
            title: "Política de Privacidade",
            slug: "privacy-policy",
            description: "Como tratamos os dados pessoais dos usuários.",
            content: `<div>
<p class="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">PowerPlay Cursos</p>
<h1 class="text-3xl md:text-5xl font-bold uppercase text-[#1a1a1a] tracking-tighter mb-4">Política de Privacidade</h1>
<p class="text-sm font-bold text-slate-500 uppercase tracking-widest">ÚLTIMA ATUALIZAÇÃO: 20 DE ABRIL DE 2026</p>

<div class="bg-slate-50 p-6 border border-slate-100 rounded-none mb-12">
<h2 class="text-sm font-bold uppercase tracking-widest text-[#1a1a1a] mb-4">Índice</h2>
<ul class="space-y-3">
<li><a href="#coleta-dados" class="text-sm font-bold text-[#1D5F31] hover:underline">1. Coleta de Dados</a></li>
<li><a href="#finalidade" class="text-sm font-bold text-[#1D5F31] hover:underline">2. Finalidade do Tratamento</a></li>
<li><a href="#compartilhamento" class="text-sm font-bold text-[#1D5F31] hover:underline">3. Compartilhamento com Terceiros</a></li>
<li><a href="#direitos-titular" class="text-sm font-bold text-[#1D5F31] hover:underline">4. Direitos do Titular (LGPD)</a></li>
</ul>
</div>

<div class="space-y-12 text-base leading-relaxed text-slate-800">
<section id="coleta-dados" class="scroll-mt-12">
<h2 class="text-xl font-bold uppercase border-b border-slate-200 pb-3 mb-6 text-[#1a1a1a]">1. Coleta de Dados</h2>
<p class="mb-4">Para o funcionamento adequado da PowerPlay, coletamos, observando o princípio da minimização (dados estritamente necessários para a prestação e transparência do serviço final), as seguintes informações:</p>
<ul class="list-disc pl-6 space-y-2 mb-4">
<li><span class="font-bold">Dados Cadastrais Identificáveis:</span> Nome completo (para emissão de certificados), E-mail de vínculo da conta, CPF ou CNPJ de processamento de compras (Asaas) e Endereço Físico Completo (CEP, Rua, Número, Cidade, Estado) por exigência de segurança fiscal bancária.</li>
<li><span class="font-bold">Dados Transacionais e Digitais:</span> Endereço IP do protocolo no formato local de rede ou externo gravado no ato da transação bancária e na marcação manual como "Eu Concordo" nas guias dos termos aplicáveis a sua conta final. Utilizamos identificadores locais (Cookies e LocalStorage) estritamente necessários para manter sua sessão ativa, garantir sua segurança no login (MFA) e lembrar suas preferências de volume no player de vídeo. Não utilizamos cookies de rastreamento para publicidade de terceiros.</li>
<li><span class="font-bold">Dados de Comportamento de Consumo:</span> Logs essenciais anonimizados e diretos de consumo de vídeo, progresso de curso e engajamento técnico com o vídeo capturados e fornecidos pelo player Mux.</li>
</ul>
</section>

<section id="finalidade" class="scroll-mt-12">
<h2 class="text-xl font-bold uppercase border-b border-slate-200 pb-3 mb-6 text-[#1a1a1a]">2. Finalidade do Tratamento</h2>
<p class="mb-4">Os dados que coletamos não são e jamais serão utilizados para compilação ou venda em bancos de perfil para corretores de terceiros. A finalidade baseia-se unicamente em:</p>
<ul class="list-disc pl-6 space-y-2 mb-4">
<li><span class="font-bold">Execução Básica de Contrato:</span> Permitir o processamento instantâneo via Pix ou cartão das compras de cursos vinculadas e liberadas da conta principal; emissão de Nota Fiscal automatizada para alunos em regra estrita via prestador Asaas; criação de uma governança contra fraudes.</li>
<li><span class="font-bold">Melhoria Direta da Experiência:</span> Analisar as métricas conjuntas das aulas e reproduções (onde um vídeo apresenta maiores pontos de re-visão) para prover aos seus instrutores dados didáticos, além de melhorar a recomendação da qualidade técnica do stream Mux.</li>
</ul>
</section>

<section id="compartilhamento" class="scroll-mt-12">
<h2 class="text-xl font-bold uppercase border-b border-slate-200 pb-3 mb-6 text-[#1a1a1a]">3. Compartilhamento com Terceiros</h2>
<p class="mb-4">O compartilhamento virtual de dados ocorre estritamente dentro da governança entre o painel corporativo e seus sub-processadores encriptados conforme segue:</p>
<ul class="list-disc pl-6 space-y-2 mb-4">
<li><span class="font-bold">Google Firebase Cloud:</span> Nossa estrutura segura primária. Armazena as informações das contas em banco de dados isolado hospedado no Google Firestore (para controle de alunos, matriculas) e infraestrutura Authentication de autorização segura criptografada e verificada de senha.</li>
<li><span class="font-bold">Asaas Pagamentos SA:</span> Os dados cadastrais de base financeira, CPF emitido e Endereço Físico Completo, além de email para contato de falhas de pix ou links de boleto são encaminhados obrigatoriamente para a plataforma via APIs restritas para viabilizar e assinar a transação fiscalmente conforme normatiza o Banco Central e Ministério da Fazenda do Brasil.</li>
<li><span class="font-bold">Mux Video Data Ecosystem:</span> Estatísticas de interatividade e métricas de desempenho de dados, bits reproduzidos nos clientes sob a ótica analítica para o streaming restrito.</li>
</ul>
<p class="mb-4">O usuário compreende que a utilização de sub-processadores como Google Firebase e Mux Video pode implicar na transferência internacional de dados para servidores localizados nos Estados Unidos, país que oferece grau de proteção de dados adequado e conformidade com frameworks internacionais de segurança.</p>
</section>

<section id="direitos-titular" class="scroll-mt-12">
<h2 class="text-xl font-bold uppercase border-b border-slate-200 pb-3 mb-6 text-[#1a1a1a]">4. Direitos do Titular (LGPD)</h2>
<p class="mb-4">Em aderência irrestrita a todas as exigências nacionais por força da <span class="font-bold">Lei Geral de Proteção de Dados (Lei nº 13.709/2018)</span>, salvaguardamos e promovemos ativamente seu direito claro à transparência e à sua identidade.</p>
<p class="mb-4">A exclusão e revogação do termo e consentimento e consequente e permanente ação irreversível de obliteração de sua conta da base virtual do Firebase Auth Platform, dados vinculados e faturamento não efetivado, bem como o pedido total ou consulta de portabilidade e registro eletrônico unificado com finalidades, podem e devem ser exercidas ou iniciadas sempre, e unicamente, pelo próprio titular das informações livre de barreiras de atendente contanto logado na aplicação. Esse percurso digital autônomo está permanentemente oferecido nas margens de Configuração de seu painel do aluno.</p>
<p class="mb-4">Os dados serão conservados pelo período necessário para a prestação dos serviços. Dados vinculados a transações financeiras (Notas Fiscais e registros de pagamento no Asaas) serão mantidos pelo prazo mínimo de 5 (cinco) anos, conforme exigência da legislação tributária e civil brasileira, mesmo após a exclusão da conta pelo usuário.</p>
</section>
</div>
</div>`
        },
        {
            title: "LGPD",
            slug: "lgpd",
            description: "Conformidade com a Lei Geral de Proteção de Dados.",
            content: `<h2>Lei Geral de Proteção de Dados - LGPD</h2>
<p>A PowerPlay está em conformidade com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018).</p>
<h3>Seus Direitos</h3>
<ul>
<li>Direito de acesso aos seus dados pessoais</li>
<li>Direito de correção de dados incompletos, inexatos ou desatualizados</li>
<li>Direito de anonimização, bloqueio ou eliminação de dados desnecessários</li>
<li>Direito de portabilidade a outro fornecedor de serviço</li>
<li>Direito de eliminação dos dados pessoais tratados com base no consentimento</li>
<li>Direito de informação sobre compartilhamento de dados</li>
<li>Direito de revogação do consentimento</li>
</ul>
<p>Para exercer seus direitos como titular, envie solicitação para <strong>dpo@powerplaycursos.com.br</strong> — Encarregado de Dados (DPO) da PowerPlay Cursos. Você também pode acessar o painel de configurações do aluno.</p>`
        }
    ]

    try {
        const user = await getSessionUser()
        if (!user || user.role !== 'admin') {
            return { success: false }
        }

        const batch = adminDb.batch()
        for (const doc of initialDocs) {
            const ref = adminDb.collection(COLLECTION).doc(doc.slug)
            batch.set(ref, {
                title: doc.title,
                slug: doc.slug,
                description: doc.description,
                content: doc.content,
                lastUpdated: new Date()
            }, { merge: true })
        }
        await batch.commit()
        return { success: true }
    } catch (error) {
        console.error("Erro ao inicializar documentos:", error)
        return { success: false }
    }
}
