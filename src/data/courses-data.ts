export interface Lesson {
    title: string
}

export interface Module {
    title: string
    lessons: Lesson[]
}

export interface Course {
    id: string
    slug: string
    title: string
    shortTitle: string
    category: string
    tag: string
    price: number
    hours: number
    rating: number
    students: number
    description: string
    longDescription: string
    image: string
    inspirationImages: string[]
    highlights: string[]
    curriculum: Module[]
}

export const allCourses: Course[] = [
    {
        id: "1",
        slug: "ui-ux-design-profissional",
        title: "UI/UX Design Profissional",
        shortTitle: "UI/UX Design",
        category: "Design",
        tag: "MAIS VENDIDO",
        price: 97,
        hours: 32,
        rating: 4.9,
        students: 1847,
        description: "Domine o Figma e as técnicas de design que encantam clientes e triplicam o valor dos seus projetos.",
        longDescription: "Aprenda a criar interfaces digitais de alto impacto com o Figma. Do wireframe ao protótipo interativo, você vai dominar os princípios de UX Research, Design Systems e Handoff para desenvolvimento. Metodologia 100% prática com projetos reais.",
        image: "https://images.unsplash.com/photo-1561070791-2526d30994b5?auto=format&fit=crop&q=80&w=1600",
        inspirationImages: [
            "https://media.istockphoto.com/id/2228204306/pt/foto/web-design-application-design-coding-develop-ux-ui-design-web-and-user-design-development.jpg?s=1024x1024&w=is&k=20&c=_ZyAeBzxFRK-Q0aXkKgr36dGEBP5_RjR-jLC1wfPUgY=",
            "https://images.unsplash.com/photo-1545235617-9465d2a55698?auto=format&fit=crop&q=80&w=800",
            "https://images.unsplash.com/photo-1558655146-d09347e92766?auto=format&fit=crop&q=80&w=800"
        ],
        highlights: [
            "Fundamentos de UX Research e personas",
            "Design Systems escaláveis no Figma",
            "Prototipagem interativa avançada",
            "Técnicas de Micro-animações de UI",
            "Handoff profissional para desenvolvedores",
            "Portfólio completo ao final do curso",
        ],
        curriculum: [
            {
                title: "Módulo 1: Fundamentos de UX",
                lessons: [
                    { title: "Introdução ao Design de Experiência" },
                    { title: "Pesquisa com Usuários e Personas" },
                    { title: "Jornada do Usuário e Wireframes" },
                ],
            },
            {
                title: "Módulo 2: UI com Figma",
                lessons: [
                    { title: "Interface do Figma do Zero" },
                    { title: "Componentes e Auto Layout" },
                    { title: "Criando um Design System completo" },
                ],
            },
            {
                title: "Módulo 3: Prototipagem e Entrega",
                lessons: [
                    { title: "Protótipos interativos avançados" },
                    { title: "Animações e micro-interações" },
                    { title: "Handoff para o dev com Inspect" },
                ],
            },
            {
                title: "Módulo 4: Projeto Final",
                lessons: [
                    { title: "Brief do projeto real" },
                    { title: "Execução guiada do projeto" },
                    { title: "Apresentação e feedback" },
                ],
            },
        ],
    },
    {
        id: "2",
        slug: "fullstack-react-nextjs",
        title: "Fullstack React & Next.js",
        shortTitle: "Fullstack Next.js",
        category: "Programação",
        tag: "ORIGINAL POWERPLAY",
        price: 197,
        hours: 56,
        rating: 4.8,
        students: 3210,
        description: "A jornada definitiva para criar aplicações modernas, rápidas e escaláveis com as melhores tecnologias.",
        longDescription: "Do zero ao deploy em produção. Aprenda React 18, Next.js 14 com App Router, Firebase, Prisma, autenticação completa, pagamentos com Stripe e deploy profissional. O curso mais completo de Fullstack JS do mercado.",
        image: "https://images.unsplash.com/photo-1587620962725-abab7fe55159?auto=format&fit=crop&q=80&w=1600",
        inspirationImages: [
            "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&q=80&w=800",
            "https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&q=80&w=800",
            "https://images.unsplash.com/photo-1550439062-609e1531270e?auto=format&fit=crop&q=80&w=800"
        ],
        highlights: [
            "React 18 com hooks e estado avançado",
            "Next.js 14 App Router e Server Components",
            "Banco de dados com Firebase e Prisma",
            "Autenticação completa com JWT e OAuth",
            "Pagamentos com Stripe",
            "Deploy profissional",
        ],
        curriculum: [
            {
                title: "Módulo 1: React do Zero ao Avançado",
                lessons: [
                    { title: "JSX, Componentes e Props" },
                    { title: "useState e useEffect na prática" },
                    { title: "Context API e gerenciamento de estado" },
                ],
            },
            {
                title: "Módulo 2: Next.js e App Router",
                lessons: [
                    { title: "Estrutura do App Router" },
                    { title: "Server Components vs Client Components" },
                    { title: "Rotas dinâmicas e layouts" },
                ],
            },
            {
                title: "Módulo 3: Backend e Banco de Dados",
                lessons: [
                    { title: "API Routes e Server Actions" },
                    { title: "Firebase: Auth e banco de dados" },
                    { title: "Prisma ORM: modelagem e queries" },
                ],
            },
            {
                title: "Módulo 4: Pagamentos e Deploy",
                lessons: [
                    { title: "Integrando Stripe Checkout" },
                    { title: "Webhooks e eventos de pagamento" },
                    { title: "CI/CD e deploy profissional" },
                ],
            },
        ],
    },
    {
        id: "3",
        slug: "backend-nodejs-avancado",
        title: "Backend com Node.js Avançado",
        shortTitle: "Node.js Avançado",
        category: "Programação",
        tag: "CONTEÚDO ELITE",
        price: 157,
        hours: 44,
        rating: 4.7,
        students: 2104,
        description: "Construa APIs robustas, aprenda microsserviços, segurança e arquitetura de software profissional.",
        longDescription: "Domine o ecossistema Node.js em profundidade. Aprenda a construir APIs RESTful e GraphQL, implementar autenticação JWT, criar microsserviços com Docker, trabalhar com filas (Redis/Bull) e garantir a segurança da sua aplicação.",
        image: "https://images.unsplash.com/photo-1627398242454-45a1465c2479?auto=format&fit=crop&q=80&w=1600",
        inspirationImages: [
            "https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?q=80&w=1470&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
            "https://images.unsplash.com/photo-1650234083177-e76e49fa3d73?q=80&w=870&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
            "https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&q=80&w=800"
        ],
        highlights: [
            "APIs RESTful e GraphQL do zero",
            "Autenticação JWT e refresh tokens",
            "Arquitetura de microsserviços",
            "Docker e containerização",
            "Filas com Redis e Bull",
            "Testes com Jest e supertest",
        ],
        curriculum: [
            {
                title: "Módulo 1: Fundamentos Avançados",
                lessons: [
                    { title: "Event Loop e Assincronismo" },
                    { title: "Express.js na prática" },
                    { title: "Middlewares e error handling" },
                ],
            },
            {
                title: "Módulo 2: Segurança e Auth",
                lessons: [
                    { title: "JWT Access e Refresh Tokens" },
                    { title: "Rate limiting e proteção contra ataques" },
                    { title: "RBAC: controle de acesso por papéis" },
                ],
            },
            {
                title: "Módulo 3: Microsserviços",
                lessons: [
                    { title: "Arquitetura e princípios" },
                    { title: "Comunicação com RabbitMQ" },
                    { title: "Docker Compose para orquestração" },
                ],
            },
        ],
    },
    {
        id: "4",
        slug: "marketing-estrategico",
        title: "Marketing Estratégico",
        shortTitle: "Marketing Estratégico",
        category: "Marketing",
        tag: "LANÇAMENTO",
        price: 87,
        hours: 28,
        rating: 4.8,
        students: 1560,
        description: "Transforme cliques em vendas reais com funis automatizados, tráfego pago e estratégias validadas.",
        longDescription: "Aprenda a criar estratégias de marketing digital que geram resultados reais. Do planejamento ao ROI mensurável: tráfego pago, copywriting, e-mail marketing, funis de venda e análise de dados para tomar decisões inteligentes.",
        image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=1600",
        inspirationImages: [
            "https://images.unsplash.com/photo-1533750349088-cd871a92f312?auto=format&fit=crop&q=80&w=800",
            "https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&q=80&w=800",
            "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=800"
        ],
        highlights: [
            "Estratégia e planejamento de marketing",
            "Google Ads e Meta Ads do zero ao avançado",
            "Copywriting que converte",
            "Funis de vendas automatizados",
            "E-mail marketing e automação",
            "Análise de métricas e ROI",
        ],
        curriculum: [
            {
                title: "Módulo 1: Estratégia Digital",
                lessons: [
                    { title: "Posicionamento e público-alvo" },
                    { title: "Jornada de compra e funil" },
                    { title: "KPIs e métricas que importam" },
                ],
            },
            {
                title: "Módulo 2: Tráfego Pago",
                lessons: [
                    { title: "Google Ads: estrutura e campanhas" },
                    { title: "Meta Ads: criativos e segmentação" },
                    { title: "Otimização e redução de CPL" },
                ],
            },
            {
                title: "Módulo 3: Conversão e Retenção",
                lessons: [
                    { title: "Landing pages que convertem" },
                    { title: "E-mail marketing e automação" },
                    { title: "Upsell, cross-sell e LTV" },
                ],
            },
        ],
    },
    {
        id: "5",
        slug: "gestao-agil-scrum",
        title: "Gestão Ágil e Scrum",
        shortTitle: "Gestão Ágil",
        category: "Gestão",
        tag: "CONTEÚDO ELITE",
        price: 117,
        hours: 24,
        rating: 4.9,
        students: 923,
        description: "Lidere equipes de alta performance e entregue projetos com eficiência máxima.",
        longDescription: "Domine os frameworks ágeis mais utilizados no mercado: Scrum, Kanban e OKRs. Aprenda a planejar sprints, conduzir cerimônias, remover impedimentos e criar times de alta performance que entregam resultado consistente.",
        image: "https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&q=80&w=1600",
        inspirationImages: [
            "https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&q=80&w=800",
            "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=800",
            "https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&q=80&w=800"
        ],
        highlights: [
            "Scrum do zero ao avançado",
            "Kanban e fluxo de trabalho otimizado",
            "OKRs para alinhamento estratégico",
            "Cerimônias ágeis na prática",
            "Gestão de stakeholders",
            "Métricas de performance do time",
        ],
        curriculum: [
            {
                title: "Módulo 1: Mentalidade Ágil",
                lessons: [
                    { title: "Manifesto Ágil e princípios" },
                    { title: "Scrum framework completo" },
                    { title: "Papéis: PO, SM e Dev Team" },
                ],
            },
            {
                title: "Módulo 2: Cerimônias e Artefatos",
                lessons: [
                    { title: "Sprint Planning e Backlog Refinement" },
                    { title: "Daily, Review e Retrospectiva" },
                    { title: "Kanban e WIP limits" },
                ],
            },
            {
                title: "Módulo 3: Escala e Liderança",
                lessons: [
                    { title: "OKRs e planejamento trimestral" },
                    { title: "Gestão de conflitos e feedback" },
                    { title: "Times remotos de alta performance" },
                ],
            },
        ],
    },
    {
        id: "6",
        slug: "ia-na-pratica",
        title: "IA na Prática",
        shortTitle: "IA na Prática",
        category: "Tecnologia",
        tag: "TENDÊNCIA",
        price: 247,
        hours: 38,
        rating: 5.0,
        students: 4210,
        description: "Aposente as tarefas manuais e escale sua produtividade usando o poder da inteligência artificial.",
        longDescription: "Aprenda a usar IA como uma alavanca de produtividade real. Desde prompts avançados no ChatGPT e Claude, até automações com n8n, criação de agentes de IA, RAG com LangChain e integração de modelos na sua stack de desenvolvimento.",
        image: "https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&q=80&w=1600",
        inspirationImages: [
            "https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&q=80&w=800",
            "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&q=80&w=800",
            "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&q=80&w=800"
        ],
        highlights: [
            "Engenharia de Prompts avançada",
            "Automações com n8n e Make",
            "Criação de Agentes de IA",
            "RAG e bases de conhecimento",
            "IA no desenvolvimento de software",
            "LangChain e LlamaIndex",
        ],
        curriculum: [
            {
                title: "Módulo 1: Fundamentos de IA",
                lessons: [
                    { title: "Como os LLMs funcionam" },
                    { title: "Prompt Engineering avançado" },
                    { title: "GPT-4, Claude e Gemini na prática" },
                ],
            },
            {
                title: "Módulo 2: Automações",
                lessons: [
                    { title: "N8N: fluxos de trabalho com IA" },
                    { title: "Make: automações visuais avançadas" },
                    { title: "Zapier e integrações" },
                ],
            },
            {
                title: "Módulo 3: Agentes e RAG",
                lessons: [
                    { title: "Criando agentes com LangChain" },
                    { title: "Bases de conhecimento com RAG" },
                    { title: "Deploy de agentes em produção" },
                ],
            },
            {
                title: "Módulo 4: IA no Desenvolvimento",
                lessons: [
                    { title: "GitHub Copilot e Cursor AI" },
                    { title: "Geração de código com IA" },
                    { title: "Testes automatizados com IA" },
                ],
            },
        ],
    },
    // --- Cursos Extras para o Catálogo ---
    {
        id: "7",
        slug: "python-para-dados",
        title: "Python para Dados",
        shortTitle: "Python Dados",
        category: "Programação",
        tag: "BESTSELLER",
        price: 147,
        hours: 40,
        rating: 4.8,
        students: 2890,
        description: "Da análise exploratória ao Machine Learning. Domine Python, Pandas, NumPy e Scikit-learn.",
        longDescription: "Aprenda Python voltado para ciência de dados. Cobrimos análise exploratória com Pandas, visualização com Matplotlib e Seaborn, e Machine Learning com Scikit-learn. Projetos reais com datasets do mundo real.",
        image: "https://images.unsplash.com/photo-1518186285589-2f7649de83e0?auto=format&fit=crop&q=80&w=1600",
        inspirationImages: [
            "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=800",
            "https://images.unsplash.com/photo-1526628953301-3e589a6a8b74?auto=format&fit=crop&q=80&w=800",
            "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=800"
        ],
        highlights: [
            "Python do zero ao avançado",
            "Pandas e NumPy na prática",
            "Visualização de dados com Seaborn",
            "Machine Learning with Scikit-learn",
            "Projetos com datasets reais",
            "Jupyter Notebook e Google Colab",
        ],
        curriculum: [
            {
                title: "Módulo 1: Python Essencial",
                lessons: [
                    { title: "Sintaxe e estruturas de dados" },
                    { title: "Funções e OOP" },
                    { title: "Bibliotecas essenciais" },
                ],
            },
            {
                title: "Módulo 2: Análise de Dados",
                lessons: [
                    { title: "Pandas: DataFrames e Series" },
                    { title: "Limpeza e transformação de dados" },
                    { title: "Visualização com Matplotlib e Seaborn" },
                ],
            },
            {
                title: "Módulo 3: Machine Learning",
                lessons: [
                    { title: "Algoritmos supervisionados" },
                    { title: "Validação e métricas de modelos" },
                    { title: "Projeto final: previsão de churn" },
                ],
            },
        ],
    },
    {
        id: "8",
        slug: "trafego-pago-master",
        title: "Tráfego Pago Master",
        shortTitle: "Tráfego Pago",
        category: "Marketing",
        tag: "NOVO",
        price: 127,
        hours: 30,
        rating: 4.7,
        students: 1760,
        description: "Google Ads e Meta Ads do zero ao avançado. Escale campanhas com ROI positivo e previsível.",
        longDescription: "Aprenda a criar, otimizar e escalar campanhas de tráfego pago que geram resultados reais. Google Ads (Search, Display, YouTube), Meta Ads (Feed, Stories, Reels) e análise avançada de dados para tomada de decisão.",
        image: "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&q=80&w=1600",
        inspirationImages: [
            "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=800",
            "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=800",
            "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&q=80&w=800"
        ],
        highlights: [
            "Google Ads Search e Display",
            "YouTube Ads para captação",
            "Meta Ads: Feed, Stories e Reels",
            "Pixel e eventos de conversão",
            "Escala de campanhas lucrativas",
            "Relatórios e dashboards de desempenho",
        ],
        curriculum: [
            {
                title: "Módulo 1: Google Ads",
                lessons: [
                    { title: "Estrutura de conta e campanhas" },
                    { title: "Pesquisa de palavras-chave" },
                    { title: "Lances inteligentes e otimização" },
                ],
            },
            {
                title: "Módulo 2: Meta Ads",
                lessons: [
                    { title: "Gerenciador de Anúncios completo" },
                    { title: "Públicos personalizados e lookalike" },
                    { title: "Criativos de alta conversão" },
                ],
            },
        ],
    },
    {
        id: "9",
        slug: "figma-para-devs",
        title: "Figma para Desenvolvedores",
        shortTitle: "Figma Dev",
        category: "Design",
        tag: "CONTEÚDO ELITE",
        price: 97,
        hours: 18,
        rating: 4.9,
        students: 1230,
        description: "Aprenda a ler e implementar designs com perfeição. Elimine o gap entre design e código.",
        longDescription: "Curso voltado para desenvolvedores que precisam entender e implementar designs com qualidade. Aprenda a extrair estilos, entender grids, responsividade, Design Tokens e fazer handoff de maneira eficiente.",
        image: "https://images.unsplash.com/photo-1558655146-d09347e92766?auto=format&fit=crop&q=80&w=1600",
        inspirationImages: [
            "https://images.unsplash.com/photo-1558655146-d09347e92766?auto=format&fit=crop&q=80&w=800",
            "https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&q=80&w=800",
            "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&q=80&w=800"
        ],
        highlights: [
            "Leitura e interpretação de designs",
            "Extração de estilos e tokens",
            "Responsividade e breakpoints",
            "Componentes no código CSS",
            "Design Tokens e variáveis CSS",
            "Handoff sem fricção",
        ],
        curriculum: [
            {
                title: "Módulo 1: Figma para Devs",
                lessons: [
                    { title: "Navegando no Figma como dev" },
                    { title: "Inspect e extração de código" },
                    { title: "Auto Layout e flex no CSS" },
                ],
            },
            {
                title: "Módulo 2: Implementação",
                lessons: [
                    { title: "Pixel perfect no CSS" },
                    { title: "Design Tokens com CSS Variables" },
                    { title: "Responsividade e media queries" },
                ],
            },
        ],
    },
    {
        id: "10",
        slug: "seo-estrategico",
        title: "SEO Estratégico",
        shortTitle: "SEO",
        category: "Marketing",
        tag: "CONTEÚDO ELITE",
        price: 87,
        hours: 22,
        rating: 4.6,
        students: 980,
        description: "Domine o Google organicamente. Técnicas de SEO on-page, off-page e técnico para ranquear no topo.",
        longDescription: "Aprenda a rankear sites no topo do Google usando SEO técnico, on-page e off-page. Da pesquisa de palavras-chave à construção de autoridade com link building. Estratégias validadas com resultados comprovados.",
        image: "https://plus.unsplash.com/premium_photo-1685210129009-501c75e96183?q=80&w=870&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
        inspirationImages: [
            "https://plus.unsplash.com/premium_photo-1685210129009-501c75e96183?q=80&w=870&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
            "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=800",
            "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=800"
        ],
        highlights: [
            "Pesquisa de palavras-chave avançada",
            "SEO técnico: Core Web Vitals e velocidade",
            "On-page: estrutura e conteúdo",
            "Link building e autoridade de domínio",
            "SEO local para negócios físicos",
            "Ferramentas: Ahrefs, SEMrush e Search Console",
        ],
        curriculum: [
            {
                title: "Módulo 1: Fundamentos de SEO",
                lessons: [
                    { title: "Como o Google funciona" },
                    { title: "Pesquisa de palavras-chave" },
                    { title: "Intenção de busca e clusters" },
                ],
            },
            {
                title: "Módulo 2: SEO Técnico e On-page",
                lessons: [
                    { title: "Core Web Vitals e velocidade" },
                    { title: "Estrutura de URL e navegação" },
                    { title: "Otimização de conteúdo" },
                ],
            },
        ],
    },
    {
        id: "11",
        slug: "branding-identidade-visual",
        title: "Branding e Identidade Visual",
        shortTitle: "Branding",
        category: "Design",
        tag: "NOVO",
        price: 127,
        hours: 26,
        rating: 4.8,
        students: 750,
        description: "Crie marcas memoráveis que conectam emocionalmente e geram valor real para o negócio.",
        longDescription: "Aprenda a construir marcas do zero: posicionamento estratégico, logotipo, tipografia, paleta de cores, brand voice e o Manual de Identidade Visual completo. Do briefing à entrega final para o cliente.",
        image: "https://images.unsplash.com/photo-1626785774573-4b799315345d?auto=format&fit=crop&q=80&w=1600",
        inspirationImages: [
            "https://images.unsplash.com/photo-1626785774573-4b799315345d?auto=format&fit=crop&q=80&w=800",
            "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&q=80&w=800",
            "https://images.unsplash.com/photo-1600132806370-bf17e65e942f?auto=format&fit=crop&q=80&w=800"
        ],
        highlights: [
            "Estratégia e posicionamento de marca",
            "Criação de logotipos profissionais",
            "Tipografia e paleta de cores",
            "Brand voice e tom de comunicação",
            "Manual de Identidade Visual completo",
            "Como precificar e apresentar ao cliente",
        ],
        curriculum: [
            {
                title: "Módulo 1: Estratégia de Marca",
                lessons: [
                    { title: "Briefing e pesquisa de mercado" },
                    { title: "Arquétipos e posicionamento" },
                    { title: "Naming e brand voice" },
                ],
            },
            {
                title: "Módulo 2: Identidade Visual",
                lessons: [
                    { title: "Criação de logotipo no Illustrator" },
                    { title: "Tipografia e cores como estratégia" },
                    { title: "Manual de marca profissional" },
                ],
            },
        ],
    },
    {
        id: "12",
        slug: "lideranca-e-gestao",
        title: "Liderança e Gestão de Pessoas",
        shortTitle: "Liderança",
        category: "Gestão",
        tag: "CONTEÚDO ELITE",
        price: 107,
        hours: 20,
        rating: 4.9,
        students: 640,
        description: "Desenvolva habilidades de liderança que inspiram, engajam e retêm talentos de alta performance.",
        longDescription: "Aprenda a liderar com inteligência emocional, dar feedback de qualidade, conduzir 1:1s que transformam, gerenciar conflitos e criar uma cultura de alto desempenho. Para líderes de primeira gestão e gestores experientes.",
        image: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&q=80&w=1600",
        inspirationImages: [
            "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&q=80&w=800",
            "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=800",
            "https://plus.unsplash.com/premium_photo-1661605653366-b1a6a6831cd4?q=80&w=869&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
        ],
        highlights: [
            "Inteligência emocional na liderança",
            "Feedback estruturado e eficaz",
            "1:1s que transformam engajamento",
            "Gestão de conflitos e comunicação",
            "Cultura de alta performance",
            "Retenção de talentos",
        ],
        curriculum: [
            {
                title: "Módulo 1: Liderança Moderna",
                lessons: [
                    { title: "Diferença entre chefe e líder" },
                    { title: "Inteligência emocional aplicada" },
                    { title: "Estilos de liderança situacional" },
                ],
            },
            {
                title: "Módulo 2: Pessoas e Performance",
                lessons: [
                    { title: "Feedback: SBI e feedforward" },
                    { title: "1:1s e desenvolvimento de pessoas" },
                    { title: "Gestão de conflitos e mediação" },
                ],
            },
        ],
    },
]


// Utilitários
export function getCourseBySlug(slug: string): Course | undefined {
    return allCourses.find((c) => c.slug === slug)
}

export function getCoursesByCategory(category: string): Course[] {
    return allCourses.filter((c) => c.category === category)
}

export const welcomeCourses = allCourses.slice(0, 6)

export const categories = ["Programação", "Marketing", "Design", "Gestão", "Tecnologia"]
