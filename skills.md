# Minhas Skills Customizadas

## 1. Responsive Sticky Profile Layout (Perfil com Sidebar Fixa)

**Objetivo:** Criar uma página de perfil (ex: Instrutor, Usuário) com duas colunas, onde o conteúdo principal rola normalmente e a sidebar direita (com foto e contatos) fica fixa na tela usando CSS nativo (`position: sticky`), compatível com filtros globais.

**Tecnologias:** Next.js (App Router), Tailwind CSS, Shadcn UI, {{DATABASE_PROVIDER}} (ex: Firebase Admin).

**Variáveis Dinâmicas:**
- `{{PROFILE_ROUTE}}`: Rota da página (ex: `/professor/[id]`).
- `{{PRIMARY_COLOR}}`: Cor principal de destaque (ex: `#00C402`).
- `{{COLLECTION_NAME}}`: Nome da coleção no banco de dados (ex: `users` ou `instructors`).
- `{{PROFILE_TAG}}`: Etiqueta ou título superior (ex: `INSTRUTOR ORIGINAL`).
- `{{SIDEBAR_WIDTH}}`: Largura fixa da sidebar (ex: `280px`).
- `{{TOP_OFFSET}}`: Distância do topo para a sidebar grudar (ex: `top-24`).

### Procedimento Passo a Passo:

**Passo 1: Estrutura de Busca de Dados (Backend)**
Crie uma Server Action (ex: em `src/app/actions/{{COLLECTION_NAME}}.ts`) usando {{DATABASE_PROVIDER}} para buscar os dados de perfil e estatísticas (agregadas).
Se houver listas de itens (ex: cursos), implemente paginação limitando o retorno inicial (ex: 10 itens) e retornando um `lastId` para "Carregar mais".

**Passo 2: Configuração do Layout Container (Page e Profile Component)**
Renderize o componente principal garantindo que nenhum ancestral possua `overflow: hidden` ou propriedades como `filter` diretamente no wrapper que quebrem o empilhamento do CSS. A página deve renderizar no contexto da raiz.

**Passo 3: Construção do Grid de 2 Colunas**
No container da página, utilize CSS Grid puro para as duas colunas:
```tsx
<div className="grid grid-cols-1 lg:grid-cols-[1fr_{{SIDEBAR_WIDTH}}] gap-12 items-start">
    {/* Conteúdo à esquerda rola junto com a página */}
    <main className="min-w-0 space-y-12">
        ...
    </main>

    {/* Sidebar à direita - Deve estar visível e ser flex/block com self-start */}
    <aside className="hidden lg:flex flex-col sticky {{TOP_OFFSET}} self-start">
        ...
    </aside>
</div>
```
*Crucial:* O uso de `.items-start` no grid ou `.self-start` no `aside` impede que a sidebar estique para ter a mesma altura da coluna principal, permitindo que o `position: sticky` encontre espaço para rolar.

**Passo 4: Estrutura Interna da Sidebar**
Na sidebar, a foto deve ter dimensões estáticas absolutas usando utilitários do Tailwind (ex: `w-[200px] h-[200px] shrink-0`). Mantenha os ícones sociais ou botões organizados em linhas abaixo usando `flex flex-wrap`. Adicione botões com as variações do componente do Shadcn UI ou um wrapper consistente.

**Passo 5: Detalhes Visuais (Clean Design)**
- Mantenha sombras sutis em cards `.shadow-sm` mudando para `.shadow-lg` no hover.
- Elementos realçados e botões devem utilizar a cor primária `text-[{{PRIMARY_COLOR}}]` ou backgrounds configurados.
- Sempre utilize o padrão de fontes e tipografia do projeto globalmente.

## 2. Synchronized Dashboard Profile Management (Gestão de Perfil Sincronizado)

**Objetivo:** Criar um formulário de dashboard que atualiza uma coleção central de perfis, garantindo a sincronização de dados (bio, especialidade, links sociais, avatar) com a página pública e tratando a serialização de dados não primitivos (como Timestamps).

**Tecnologias:** Next.js (Server & Client Components), Firestore (Firebase Admin), Cloud Storage, Tailwind CSS.

**Variáveis Dinâmicas:**
- `{{DASHBOARD_ROUTE}}`: Rota do dashboard (ex: `/dashboard-teacher/profile`).
- `{{ACTION_UPDATE}}`: Nome da Server Action de atualização (ex: `updateTeacherProfile`).
- `{{PROFILE_COLLECTION}}`: Nome da coleção de perfis (ex: `profiles`).
- `{{STORAGE_PATH}}`: Caminho para upload de fotos (ex: `profile-images/`).

### Procedimento Passo a Passo:

**Passo 1: Server Action com Guard de Role**
Crie uma Server Action que verifique a sessão do usuário e restrinja a edição apenas ao próprio `uid`. Valide o `role` (ex: `teacher` ou `admin`) para evitar edições não autorizadas.
```tsx
export async function {{ACTION_UPDATE}}(data: any) {
    const session = await getServerSession();
    if (!session || (session.role !== 'teacher' && session.role !== 'admin')) {
        throw new Error('Não autorizado');
    }
    await adminDb.collection('{{PROFILE_COLLECTION}}').doc(session.uid).update({ ...data, updated_at: new Date().toISOString() });
}
```

**Passo 2: Resolução de Serialização (Server Component)**
No Server Component da página (`page.tsx`), busque os dados do Firestore e **converta-os em um objeto plano**. Timestamps do Firestore causam erro em Client Components se passados diretamente.
```tsx
const raw = profileDoc.exists ? profileDoc.data() : null;
const initialData = raw ? {
    full_name: raw.full_name || '',
    specialty: raw.specialty || '',
    bio: raw.bio || '',
    avatar_url: raw.avatar_url || '',
    // Links sociais extraídos individualmente
} : null;
```

**Passo 3: Client Form com Estado e Upload**
Crie um Client Component (`ClientProfileForm.tsx`) que receba os dados hidratados. Implemente o upload de imagem usando helpers de storage, atualizando o estado local do `avatarUrl` antes de salvar o perfil completo. Use `router.refresh()` após o sucesso para invalidar o cache do Server Component.

**Passo 4: Mapeamento de Links Sociais**
Inclua campos para URLs de redes sociais agrupados em uma seção dedicada. Use ícones (`Lucide`) condizentes com cada rede (LinkedIn, Twitter, YouTube) para facilitar a identificação visual.

**Passo 5: Feedback de Carregamento**
Sempre utilize estados de `isSaving` ou `isUploading` com spinners (`Loader2`) nos botões de ação para evitar cliques duplos e informar o progresso ao usuário.

## 3. Netflix-Style Landing Page Redesign (Visual Escuro e Foco em Conversão)

**Objetivo:** Transformar landing pages tradicionais em experiências visuais imersivas inspiradas em plataformas de streaming (Netflix), utilizando temas escuros, overlays dramáticos, imagens de fundo em tela cheia e CTAs de alto contraste.

**Tecnologias:** Next.js, Tailwind CSS (Customizado), Lucide Icons.

**Variáveis Dinâmicas:**
- `{{BACKGROUND_COLOR}}`: Cor de fundo principal (ex: `#0d2b17` ou `#0f0f0f`).
- `{{ACCENT_COLOR}}`: Cor de destaque para CTAs e ícones (ex: `#32cd32` ou `#e50914`).
- `{{HERO_IMAGE}}`: Caminho da imagem de fundo da Hero (ex: `/images/hero-bg.png`).

### Procedimento Passo a Passo:

**Passo 1: Variáveis Globais (CSS do Tailwind)**
Defina o tema escuro no `globals.css`, incluindo background e cores de foreground claras (`#f1f5f9`). Remova quaisquer classes genéricas (como `.bg-white` com bordas fixas) que interfiram no design de componentes reutilizados na nova temática dark.

**Passo 2: Hero Section Imersiva e Full-Viewport**
Crie uma section com `min-height: 100vh`. Defina o fundo absoluto ou background image (`background-size: cover; background-position: center`) com a imagem `{{HERO_IMAGE}}`. **Crucial**: Aplique um *Overlay* através de um `div` absoluto sobre a imagem com um gradiente escuro (ex: `rgba(0,0,0,0.5)` no topo indo para a solidez da `{{BACKGROUND_COLOR}}` na base) para garantir legibilidade textual inabalável.

**Passo 3: Tipografia e Call to Action (CTA)**
Na Hero Section, exiba a proposta de valor principal. Utilize fontes em maiúsculas (`text-transform: uppercase`), font-weight alto (`900` ou `black`), e um leve tracking negativo (`letter-spacing: -0.02em`). O título deve ser massivo (`text-5xl` ou proporções `clamp()`). O CTA (botão principal) deve utilizar obrigatoriamente a `{{ACCENT_COLOR}}`, texto legível e espaçoso para facilitar conversão e captura de leads (ex: capturar o e-mail logo abaixo do título).

**Passo 4: Organização de Grades e Cards Dark**
Abaixo do Hero, adicione seções (Diferenciais, Cursos) mantendo a cor base do fundo. Crie cards flutuantes utilizando variações pouca coisa mais claras que o fundo principal (ex: `#0f1f14` ou `rgba(255,255,255,0.05)`), com bordas finas com a cor de destaque translúcida (`border-color: rgba(50,205,50,0.2)`) e introduza um drop-shadow expressivo acompanhado do leve ganho de escala no hover.

**Passo 5: Polimento e Componentes Universais**
Adapte Navbar e Footer ou seções de Banners isolados para atuarem em harmonia com partes sombreadas. Elementos de transição (`transition-all duration-300`) nos botões encerram o "feel" de app nativo. Evite backgrounds vibrantes no layout e foque o brilho somente nos botões e elementos táticos a serem clicados pelo usuário.

## 4. Sealing Color Leaks & Global Dark Theme (Selação de Vazamentos e Tema Dark Global)

**Objetivo:** Garantir que o site tenha uma aparência de "Dark Mode" premium e contínua, eliminando vazamentos de luz (branco/cinza) vindos de trás ou de baixo do Header e garantindo que todas as subpáginas adiram ao tema verde escuro profundo.

**Tecnologias:** Next.js (App Router), Tailwind CSS, Vanilla CSS.

**Variáveis Dinâmicas:**
- `{{GLOBAL_BG_COLOR}}`: Cor de fundo global (ex: `#0d2b17`).
- `{{SURFACE_COLOR}}`: Cor de superfícies e cards (ex: `#0f1f14`).
- `{{BORDER_COLOR}}`: Cor de bordas sutis (ex: `#1e4d2b`).
- `{{ACCENT_COLOR}}`: Cor de destaque verde (ex: `#32cd32`).

### Procedimento Passo a Passo:

**Passo 1: Reset de Fundo no Layout Global**
No arquivo `src/app/layout.tsx`, force a cor de fundo diretamente na tag `<body>`. Isso cria uma "base" sólida que impede que qualquer conteúdo de carregamento ou lacunas entre seções revelem o fundo padrão do navegador.
```tsx
<body className="font-exo bg-[{{GLOBAL_BG_COLOR}}] text-white">
```

**Passo 2: Blindagem do Navbar (Header)**
No componente `Navbar.tsx`, certifique-se de que o elemento `<header>` esteja fixado e com um z-index alto para sobrepor qualquer conteúdo. Remova sombras claras e use sombras pretas profundas e sutis.
- Use `sticky top-0` e `z-[100]`.
- Aplique `backdrop-filter: blur(12px)` para um efeito premium.
- Use `box-shadow: 0 4px 20px rgba(0,0,0,0.5)`.
- Remova bordas ou outlines brancas.

**Passo 3: Auditoria de Subpáginas (Dashboards)**
Inspecione diretórios como `(marketing)` ou `(dashboard-student)` em busca de classes utilitárias de cores claras:
- Substitua `bg-white`, `bg-slate-50`, `bg-gray-50` por `bg-[{{GLOBAL_BG_COLOR}}]` ou `bg-[{{SURFACE_COLOR}}]`.
- Atualize textos `text-slate-900` ou `text-slate-800` para `text-white` ou `text-[#e2e8f0]`.
- Mantenha bordas consistentes com a `{{BORDER_COLOR}}`.

**Passo 4: Sincronização de Bordas e Divisores**
Troque divisores sutis de cores claras (`border-slate-200`) por divisores escuros (`border-[{{BORDER_COLOR}}]` ou `border-white/10`) para manter a profundidade visual sem quebras óbvias.

**Passo 5: Polimento de Feedbacks de Carregamento**
Garanta que esqueletos (skeletons) ou spinners de carregamento também usem a paleta escura para evitar "piscadas" brancas durante o carregamento de dados.

## 5. Netflix-Style Grid Alignment (Alinhamento Rigoroso em 12 Colunas)

**Objetivo:** Garantir que todos os componentes de uma página full-screen (estilo Netflix) estejam perfeitamente alinhados verticalmente, eliminando a sensação de texto "perdido" e unificando a estrutura de colunas e paddings.

**Tecnologias:** Next.js, Tailwind CSS (Grid & Layout Utilities).

**Variáveis Dinâmicas:**
- `{{STANDARD_PADDING}}`: Padding horizontal unificado (ex: `px-6 md:px-12 lg:px-16`).
- `{{MAIN_COL_SPAN}}`: Número de colunas para o conteúdo principal (ex: `lg:col-span-8`).
- `{{SIDE_COL_SPAN}}`: Número de colunas para conteúdo lateral (ex: `lg:col-span-4`).

### Procedimento Passo a Passo:

**Passo 1: Unificação do Container Base**
Certifique-se de que todas as seções da página utilizem `max-w-none`. O controle de largura deve ser feito via padding horizontal e definição de colunas, nunca limitando o container central de forma arbitrária (como `max-w-7xl`).

**Passo 2: Aplicação do Padding Padronizado**
Aplique a variável `{{STANDARD_PADDING}}` em todas as seções (`<section>`) ou containers imediatos. Isso cria a "linha de partida" vertical idêntica para o Logo, Títulos e Blocos de Conteúdo.

**Passo 3: Estruturação do Grid de 12 Colunas**
Para todas as seções que contenham conteúdo dividido (ex: Vídeo vs. Compra, Descrição vs. Ementa), utilize a mesma estrutura de grid:
```tsx
<div className="grid lg:grid-cols-12 gap-0 items-start {{STANDARD_PADDING}}">
    {/* Conteúdo Principal (Alinhado com o elemento de cima) */}
    <div className="{{MAIN_COL_SPAN}} space-y-6">
        ...
    </div>
    {/* Conteúdo Lateral */}
    <div className="{{SIDE_COL_SPAN}} hidden lg:block">
        ...
    </div>
</div>
```

**Passo 4: Sincronização de Recuos e Bordas**
Se utilizar bordas decorativas (ex: `border-l-4`), certifique-se de que o padding interno (`pl-6`) seja compensado ou mantido idêntico em todas as seções para que o texto comece sempre na mesma coordenada X.

**Passo 5: Verificação de Grid Overlay**
Verifique visualmente se a borda esquerda do player de vídeo e a borda esquerda do primeiro parágrafo de texto estão perfeitamente alinhadas. Remova `max-w-3xl` ou similares de dentro das colunas para permitir que o grid controle a fluidez.
