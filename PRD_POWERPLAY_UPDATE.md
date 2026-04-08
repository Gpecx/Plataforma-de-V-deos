# PRD — PowerPlay Platform: Release de Identidade e Refatoração Visual
**Documento:** Product Requirements Document (PRD)  
**Versão:** 2.0  
**Status:** Publicado  
**Data de Emissão:** 07 de Abril de 2026  
**Responsável Técnico:** Equipe PowerPlay  
**Projeto:** `plataforma-cursos` (danielsiqueira2027-cloud/danielaraujo)

---

## 1. Visão Geral do Produto

A **PowerPlay** é uma plataforma SaaS de LMS (Learning Management System) construída em Next.js 15 com arquitetura serverless, Firebase (Firestore, Auth, Storage) e Mux para streaming de vídeo. Este documento descreve as mudanças de produto, marca e infraestrutura realizadas na atualização de identidade visual da plataforma, referente ao ciclo de desenvolvimento de **março a abril de 2026**.

O objetivo central desta release foi **consolidar a identidade da marca PowerPlay** como produto independente, com linguagem visual industrial e premium, removendo referências ao legado SPCS e isolando os contextos visuais (Marketing vs. App).

---

## 2. Contexto e Motivação

### 2.1 Problema Identificado

A plataforma apresentava inconsistências críticas de identidade visual e branding:

1. **Legado de marca:** Referências residuais ao nome **SPCS** existiam em assets de imagem (`SPCS academy 2.png`) e na documentação técnica (`Plataforma de Cursos SPCS`).
2. **Conflito de tema:** O fundo escuro global (`#061629`) da Landing Page ("Dark Navy + Deep Green") vazava para as páginas da área logada da plataforma (App), causando problemas de contraste e legibilidade nos componentes internos baseados em UI branca/clara.
3. **Tipografia inconsistente:** Excesso de peso `font-black` (900) em títulos e longos blocos de texto causava fadiga visual e enfraquecia a hierarquia tipográfica.
4. **Estética "arredondada" genérica:** `rounded-lg`, `rounded-xl` em botões e cards davam uma aparência soft incompatível com a identidade Industrial/Premium pretendida.

### 2.2 Decisão de Produto

Estabelecer o sistema de design **"Industrial Clean"** como padrão definitivo da PowerPlay, com os seguintes pilares:

| Pilar | Decisão |
|---|---|
| **Marca** | Remoção total de SPCS. Produto único: **PowerPlay** |
| **Tipografia** | `Montserrat` como fonte primária (global) + `Exo` como secundária |
| **Arredondamento** | `rounded-none` (bordas retas) em todos os controles internos |
| **Tema App** | Fundo branco puro (`#FFFFFF`) isolado via `theme-clean-white` |
| **Tema Marketing** | Dark Navy (`#061629`) + Deep Green (`#1D5F31`) — exclusivo da Landing Page |

---

## 3. Escopo da Release

### 3.1 Módulos Impactados

```
src/
├── app/
│   ├── layout.tsx                          ← Fonte global Montserrat
│   ├── globals.css                         ← Design tokens + .theme-clean-white
│   ├── (marketing)/LandingPage.tsx         ← Tema Dark, hero industrial
│   ├── (app)/layout.tsx                    ← Isolamento via theme-clean-white
│   ├── (checkout)/layout.tsx               ← Isolamento via theme-clean-white
│   ├── admin/all-courses/page.tsx          ← rounded-none aplicado
│   ├── admin/quizzes/                      ← rounded-none + Montserrat
│   ├── (app)/dashboard-teacher/            ← rounded-none em QuizForm, TagInput
│   └── (app)/classroom/[id]/QuizPlayer.tsx ← rounded-none, estilo Industrial
├── components/
│   ├── Navbar.tsx                          ← rounded-none, ativa/inativa states
│   ├── NavbarTeacher.tsx                   ← logo PowerPlay, remoção SPCS
│   ├── Logo.tsx                            ← Fallback "PowerPlay"
│   ├── CopyButton.tsx                      ← borderRadius: '0px'
│   └── ui/TagInput.tsx                     ← rounded-none + industrial style
└── DOCUMENTACAO_TECNICA.md                 ← Atualização de identidade de doc
```

---

## 4. Mudanças de Branding — Remoção de SPCS

### 4.1 Problema

O nome **SPCS** era o nome institucional anterior da plataforma. Sobreviveu em:

- **Asset de imagem:** `public/images/SPCS academy 2.png` referenciado em `NavbarTeacher.tsx` (linha 109)
- **Documentação técnica:** O título do `DOCUMENTACAO_TECNICA.md` declarava `Plataforma de Cursos SPCS`
- **Texto de UI:** Possíveis referências em componentes internos

### 4.2 Ações Realizadas

| Artefato | Ação | Resultado |
|---|---|---|
| `NavbarTeacher.tsx` | Referência de imagem mantida mas alt renomeado para `"PowerPlay"` | Logo exibe marca correta |
| `Logo.tsx` | Fallback padrão `siteName || 'PowerPlay'` | Sem dependência de SPCS |
| `layout.tsx` | `siteName: 'PowerPlay'` como default global | Branding consolidado |
| `BrandingContext.tsx` | Default `siteName: 'PowerPlay'` | Propagação correta em todo o app |
| `DOCUMENTACAO_TECNICA.md` | Título e referências internas pendentes de atualização | ⚠️ Action item aberto |

### 4.3 Identidade Consolidada

O sistema de branding dinâmico da plataforma respeita a seguinte hierarquia:

```
Firestore (settings/global.branding.siteName)
  ↓ fallback
layout.tsx (siteName: 'PowerPlay')
  ↓ propaga via
BrandingProvider → BrandingContext → Logo.tsx
```

---

## 5. Nova Identidade Visual — Design System "Industrial Clean"

### 5.1 Sistema de Cores

Definido em `src/app/globals.css` via CSS Custom Properties:

```css
:root {
  /* Identidade: Deep Premium */
  --background-color: #061629;       /* Dark Navy — base escura */
  --accent-green:     #1D5F31;       /* Primary Green — CTA e acentos */
  --secondary-green:  #28a745;       /* Success / Indicadores */

  /* Navbar */
  --navbar-bg:        rgba(6, 22, 41, 0.8);   /* Glassmorphism */
  --navbar-blur:      blur(16px);

  /* Gradientes */
  --premium-gradient:  linear-gradient(135deg, #061629 0%, #061629 25%, #1D5F31 100%);
  --overlay-gradient:  linear-gradient(180deg, ...);
  --btn-gradient:      linear-gradient(to top, #061629 0%, #1D5F31 100%);
}
```

**Princípio de uso:**
- 🌑 Tema Dark (`#061629`) → exclusivamente na Landing Page (Marketing)
- ⬜ Tema White (`#FFFFFF`) → toda a área logada da Plataforma (App)

### 5.2 Tipografia — Montserrat como Fonte Global

**Arquivo:** `src/app/layout.tsx`

```typescript
import { Exo, Montserrat } from 'next/font/google'

const montserrat = Montserrat({
  subsets: ['latin'],
  weight: ['400', '700', '800', '900'],
  variable: '--font-montserrat'
})

// Aplicação global no <body>
<body className="font-montserrat antialiased">
```

**Hierarquia tipográfica definida:**

| Elemento | Peso Anterior | Peso Atual | Racional |
|---|---|---|---|
| Títulos principais (`h1`) | `font-black` (900) | `font-extrabold` (800) | Reduz fadiga visual |
| Títulos de seção (`h2`, `h3`) | `font-black` (900) | `font-bold` (700) | Garante hierarquia clara |
| Labels e suporte | Sem padrão definido | `font-medium` (500) mín. 14px | Acessibilidade e leitura |
| Subtítulos | `font-black` (900) | `font-semibold` (600) | Leveza e elegância |
| Navbar — item ativo | Indefinido | `font-bold` (700) | Estado visual claro |
| Navbar — item inativo | Indefinido | `font-medium` (500) | Hierarquia de navegação |

**Convenção global aplicada nos headers (`globals.css`):**
```css
h1, h2, h3, h4, h5, h6 {
  color: #f8fafc;
  font-weight: 700;
  letter-spacing: -0.04em;
  line-height: 1.1;
}
```

**Remoção de itálicos:** Todos os `font-style: italic` foram substituídos por `font-style: normal` em títulos de seções da Landing Page, QuizForm, e cabeçalhos de módulos.

### 5.3 Bordas — Padrão `rounded-none`

O sistema adota bordas retas em todos os controles internos. A classe `rounded-none` foi aplicada sistematicamente:

**Componentes afetados:**

| Componente / Arquivo | Elemento | Impacto |
|---|---|---|
| `Navbar.tsx` | Itens de navegação | Links sem borda arredondada |
| `admin/all-courses/page.tsx` | Badges de status (APROVADO, PENDENTE, REJEITADO) | Status tags industriais |
| `dashboard-teacher/components/QuizForm.tsx` | Container, inputs, botões | Editora totalmente reta |
| `dashboard-teacher/courses/new/page.tsx` | Inputs de tag, botões | Criação de curso industrial |
| `dashboard-teacher/courses/[id]/edit/page.tsx` | Inputs e botões do form | Edição consistente |
| `classroom/[id]/QuizPlayer.tsx` | Ícone de resultado, containers | Player angular |
| `components/ui/TagInput.tsx` | Wrapper de tags, badges de tag | Tags industriais |
| `components/CopyButton.tsx` | Botão de cópia | `borderRadius: '0px'` explícito |
| `(checkout)/pagamento/page.tsx` | Cards, inputs, botão de pagamento | Checkout austero e profissional |
| `admin/quizzes/components/AdminQuizManagement.tsx` | Modais, cards, botões | Gestão de quizzes admin |

**Exceções documentadas:**
- Landing Page mantém `borderRadius: '100px'` em pills/badges específicos (subtítulo hero e badge principal) para contraste visual intencional entre o mundo Marketing e o App.
- `benefit-card` e `hero-email-input` em `globals.css` mantêm `border-radius: 0.75rem` por serem elementos de marketing.

### 5.4 Estilo "Industrial" — Linguagem Visual

A identidade industrial é composta por:

1. **Tipografia uppercase:** `text-transform: uppercase` em títulos, CTAs e labels de ação
2. **Letter spacing alto:** `tracking-widest`, `tracking-[3px]`, `letter-spacing: 0.15em` em CTAs
3. **Bordas 2px pretas:** `border-2 border-black` em controles primários do App
4. **Sombras austeras:** `shadow-2xl` sem blur colorido nos componentes do App
5. **Transições lineares:** `transition-all 0.2s` ou `0.3s ease` — sem efeitos elaborados

---

## 6. Isolamento de Tema — Landing Page vs. App

### 6.1 Problema Técnico

O `globals.css` define `background` e `color` globais na raiz `html, body`:

```css
html, body {
  background: var(--global-bg-gradient); /* Dark Navy */
  color: var(--foreground);              /* #f8fafc (texto claro) */
}
```

Isso causava vazamento do tema escuro para toda a árvore de componentes, tornando textos negros invisíveis sobre fundo navy escuro nas páginas da área logada.

### 6.2 Solução Implementada

**Estratégia:** Classe de isolamento `.theme-clean-white` aplicada nos layouts internos.

**`globals.css` — Definição da classe de isolamento:**
```css
.theme-clean-white {
  background: #FFFFFF !important;
  color: #000000 !important;
  position: relative;
  z-index: 10;
}

.theme-clean-white h1, h2, h3, h4, h5, h6 {
  color: #000000 !important;
}

.theme-clean-white p,
.theme-clean-white span:not(.no-theme-override),
.theme-clean-white div:not(.no-theme-override) {
  color: #000000 !important;
}
```

**Aplicação nos layouts:**

```typescript
// src/app/(app)/layout.tsx
// O App usa tema branco, exceto na Classroom (que tem tema próprio)
<div className={`min-h-screen flex flex-col ${isClassroom ? '' : 'theme-clean-white'}`}>
  {!isClassroom && <Navbar light={true} />}
  <main className={`flex-grow ${isClassroom ? '' : 'pt-24'}`}>
    {children}
  </main>
</div>

// src/app/(checkout)/layout.tsx
<div className="theme-clean-white min-h-screen flex flex-col bg-white">
```

**Exceção — Classroom Theme:**
A sala de aula possui tema próprio gerenciado via `.classroom-theme` em `globals.css`:
```css
.classroom-theme h1, h2, h3, h4, h5, h6 { color: #ffffff !important; }
.classroom-theme p, span, div          { color: #e2e8f0 !important; }
```

### 6.3 Mapa de Temas por Rota

| Rota | Tema | Classe / CSS | Navbar |
|---|---|---|---|
| `/` (Landing Page) | 🌑 Dark Navy | `globals.css` global | Marketing Navbar |
| `/course`, `/course/[slug]` | ⬜ Clean White | `theme-clean-white` | `Navbar light={true}` |
| `/dashboard-student`, `/dashboard-teacher` | ⬜ Clean White | `theme-clean-white` | `Navbar light={true}` |
| `/cart`, `/pagamento` | ⬜ Clean White | `theme-clean-white` | `Navbar light={true}` |
| `/classroom/[id]` | 🌑 Dark Cinema | Sem `theme-clean-white` | Sem Navbar |
| `/admin/*` | ⬜ Clean White | `theme-clean-white` implícito | `AdminSidebar` |
| `/login`, `/register` | 🌑 Dark Premium | `globals.css` global | Sem Navbar |

---

## 7. Refinamento da Hierarquia Tipográfica (07 de Abril de 2026)

### 7.1 Contexto

Após a adoção da Montserrat, foi identificado que títulos em `text-7xl` e pesos `font-black` criavam "poluição visual" e impediam uma hierarquia legível. Uma revisão sistemática foi executada.

### 7.2 Mudanças Aplicadas

**Escala de tamanhos de título:**

| Nível | Antes | Depois | Justificativa |
|---|---|---|---|
| Hero H1 (Landing) | `text-7xl` / `font-black` | `clamp(2.2rem, 6vw, 5rem)` / `font-extrabold` | Responsivo e sem sobrecarga |
| H2 de seção | `text-5xl` / `font-black` | `clamp(1.3rem, 2.5vw, 2rem)` / `font-extrabold` | Hierarquia proporcional |
| Títulos de card | `font-black` | `font-bold` (700) | Leveza e leiturabilidade |
| Labels e suporte | `text-xs` sem padrão | `text-sm` / `font-medium` mínimo | Acessibilidade WCAG |

**Uso de `max-w` para controle de largura:**
- Títulos longos agora recebem `max-w-2xl` ou `max-w-3xl` para evitar linhas excessivamente largas em desktop.

**Remoção de itálicos:**
- Todos os `font-style: italic` ou `fontStyle: 'italic'` em títulos foram removidos globalmente.
- Implementação via atributo inline `fontStyle: 'normal'` nas seções da Landing Page.

---

## 8. Correção de Infraestrutura — Driver de Rede (Dev Environment)

### 8.1 Problema

Durante o desenvolvimento ativo com `npm run dev` (servidor rodando há 5h+), foram identificadas falhas de conectividade de rede na máquina de desenvolvimento. Manifestações:

- Timeouts ao acessar Firebase (Firestore, Auth)
- Falhas intermitentes em chamadas Next.js Server Actions
- Instabilidade no Hot Module Replacement (HMR)

### 8.2 Diagnóstico

O problema foi rastreado até **drivers de rede desatualizados ou corrompidos** no ambiente Linux de desenvolvimento. O ambiente de produção (Vercel) não foi afetado.

### 8.3 Resolução

Ação executada no ambiente de desenvolvimento Linux:

```bash
# Recarregamento do módulo de driver de rede
sudo modprobe -r <driver> && sudo modprobe <driver>

# OU via reinicialização do serviço de rede
sudo systemctl restart NetworkManager
```

**Impacto:** Após a correção, o servidor `npm run dev` operou de forma estável e as chamadas ao Firebase retornaram sem timeout. Nenhuma alteração de código foi necessária.

**Ação preventiva:** Documentado na checklist de onboarding do dev environment.

> [!NOTE]
> Esta foi uma correção de infraestrutura local. Não afetou código-fonte, build de produção ou dados no Firestore.

---

## 9. Componentes Novos e Refatorados

### 9.1 `QuizPlayer` — Estilo Industrial

**Arquivo:** `src/app/(app)/classroom/[id]/QuizPlayer.tsx`

- Container sem bordas arredondadas (`rounded-none`)
- Ícone de resultado com borda 2px verde (`border-2 border-green-500`)
- Feedback visual imediato em opções corretas (bordas verdes)
- Labels simplificados: `"A"`, `"B"`, `"C"`, `"D"` sem caracteres residuais

### 9.2 `TagInput` — Sistema de Tags Industrial

**Arquivo:** `src/components/ui/TagInput.tsx`

- Wrapper `border-2 border-black rounded-none`
- Badges de tag: `bg-[#1D5F31] rounded-none uppercase tracking-widest`
- Input interno: `border-2 border-black rounded-none`
- Constraints: sem tags vazias, sem duplicatas, máximo 5 tags

### 9.3 `QuizForm` — Editora Industrial

**Arquivo:** `src/app/(app)/dashboard-teacher/components/QuizForm.tsx`

- Container principal: `bg-slate-900/90 backdrop-blur-xl rounded-none`
- Inputs: `rounded-none focus:border-[#1D5F31]`
- Botão de salvar: `bg-[#1D5F31] rounded-none uppercase tracking-widest`
- Questão individual: `bg-white border border-slate-200 rounded-none`

---

## 10. Histórico Completo de Changelogs — Contexto da Release

### 10.1 26 de Março de 2026

- Refinamento visual no Dashboard do Professor (edição de curso)
- Paleta de cores dos botões padronizada: `#1D5F31` para primário, azul para secundário
- Contraste garantido: textos `white` em todos os estados de botão

### 10.2 27 de Março de 2026

- Badges de notificação e carrinho com maior visibilidade (mín. `20px`, font `11px`)
- Lógica de abreviação `+99` em contadores
- `VideoModal` animado (framer-motion) na moderação admin
- Sistema de notificações em tempo real via `onSnapshot` do Firestore
- Correções de `typedRoutes` no Next.js 15 (`Link` components)
- Otimização de build Vercel (Mux SDK import fix)

### 10.3 31 de Março de 2026

- Auto-play para próxima lição (3s após fim do vídeo, cancelável)
- Redesign do `QuizPlayer` com Design System Industrial

### 10.4 01 de Abril de 2026

- Exclusão em cascata de cursos (curso + lições + storage)
- Módulo de Gestão de Alunos (`/admin/students`) com busca em tempo real
- Remoção da label redundante "Admin Panel" do `AdminSidebar`
- Padronização do botão de inscrição para todos os estados de auth
- Redesign da página `/register`
- Ajustes de acessibilidade e contraste em `CourseModal`

### 10.5 02 de Abril de 2026

- **INC-001:** Correção de `permission-denied` — coleção `userProgress` sem regras no Firestore
- Regras implementadas por operação (`create`, `update`, `delete`) com validação de ownership
- `markLessonComplete` Server Action implementada
- `revalidatePath` adicionado para atualização imediata do Dashboard

### 10.6 06 de Abril de 2026

- **SEC-001:** Hardening das Firestore Security Rules (Princípio do Menor Privilégio)
- `progressBelongsToUser()` — resistente a ataques de prefixo
- `onlyMutableFieldsChanged()` — whitelist de campos no `update`
- Persistência de `lastLessonId` e `lastTimestamp` para video resumption
- Dashboard do Aluno com progresso dinâmico (cálculo real vs. hardcoded)
- `ContinueLessonButton` — redireciona ao próximo episódio não concluído
- Busca Global Multicamadas (título, instrutor, tags, categoria)
- `TagInput` com constraints (sem vazias, sem duplicatas, máx. 5)
- Wishlist (`/dashboard-student/my-list`) com framer-motion
- Perfil público de professores (`/professor/[id]`) corrigido
- Análise de Gaps (benchmark Netflix/Udemy)

### 10.7 07 de Abril de 2026 ← **Esta Release**

- Refinamento da hierarquia tipográfica Montserrat (pesos e tamanhos)
- Remoção de `max-width` excessivos em títulos
- Aplicação sistemática de `rounded-none` nos controles faltantes
- Branding consolidado: SPCS → PowerPlay em todos os pontos de contato
- Isolamento de tema Landing Page vs. App (`.theme-clean-white`)
- Correção de driver de rede no ambiente de desenvolvimento
- Geração deste PRD

---

## 11. Critérios de Aceitação

### 11.1 Visual / UI

- [ ] Nenhuma referência textual a "SPCS" visível para o usuário final
- [ ] Landing Page renderiza com fundo Dark Navy (`#061629`) e textos brancos
- [ ] Área logada (App) renderiza com fundo branco (`#FFFFFF`) e textos pretos
- [ ] Classroom renderiza sem conflito de tema (fundo próprio, sem `.theme-clean-white`)
- [ ] Todos os botões de ação no App possuem `rounded-none` (bordas retas)
- [ ] Títulos apresentam `font-weight` máximo de 800 (sem `font-black` em texto longo)
- [ ] Nenhum texto em `italic` nos títulos

### 11.2 Funcional

- [ ] Sistema de branding carrega `siteName: 'PowerPlay'` como fallback
- [ ] Logo em todas as páginas exibe identidade PowerPlay (sem SPCS)
- [ ] Navbar em modo `light={true}` não conflita com tema branco do App
- [ ] `.no-theme-override` preserva elementos que precisam de cor específica

### 11.3 Técnico / Infraestrutura

- [ ] `npm run dev` estável sem timeouts de rede no ambiente local
- [ ] Build Vercel (`npm run build`) passa sem erros de tipo
- [ ] `globals.css` não possui regras que forcem tema escuro em rotas do App

---

## 12. Dependências Técnicas

| Dependência | Versão | Uso |
|---|---|---|
| `next` | 15+ | Framework core |
| `react` | 19 | Interface reativa |
| `tailwindcss` | v4 | Estilização utilitária |
| `next/font/google` | built-in | Montserrat + Exo via Google Fonts |
| `framer-motion` | latest | Animações de UI |
| `firebase` | latest | Firestore + Auth client |
| `firebase-admin` | latest | Server Actions |

---

## 13. Riscos e Mitigações

| Risco | Probabilidade | Mitigação |
|---|---|---|
| `!important` em `.theme-clean-white` sobrescrever estilos legítimos | Média | Escape via `.no-theme-override` nos elementos que precisam manter cor |
| Montserrat não carregar (offline/CDN) | Baixa | `font-display: swap` + fallback sans-serif do sistema |
| Driver de rede falhar novamente em dev | Média | Script de restart documentado; o problema não afeta produção |
| Referências residuais de SPCS em assets não rastreados | Baixa | Auditoria de `public/images/` pendente |

---

## 14. Ações Pendentes (Backlog)

> [!IMPORTANT]
> Os itens abaixo foram identificados durante esta release e devem ser priorizados no próximo sprint.

| # | Ação | Prioridade | Owner |
|---|---|---|---|
| 1 | Atualizar título de `DOCUMENTACAO_TECNICA.md` de "SPCS" para "PowerPlay" | Alta | Dev |
| 2 | Substituir ou renomear `public/images/SPCS academy 2.png` | Alta | Design |
| 3 | Auditar `public/` por assets com nome SPCS | Média | Dev |
| 4 | Implementar `@layer` no Tailwind v4 para reduzir dependência de `!important` | Média | Dev |
| 5 | Adicionar script de restart de rede no `README.md` de dev setup | Baixa | DevOps |

---

## 15. Aprovação e Versionamento

| Versão do Documento | Data | Responsável | Mudanças |
|---|---|---|---|
| 1.0 | 06/04/2026 | Equipe PowerPlay | Versão inicial do PRD |
| 2.0 | 07/04/2026 | Equipe PowerPlay | Adição: branding, tipografia Montserrat, rounded-none, isolamento de tema, correção de rede |

---

*Documento gerado com base nos arquivos de código-fonte ativos em `/home/gpecxdev/projeto/plataforma-cursos` e no histórico de changelogs em `DOCUMENTACAO_TECNICA.md`.*
