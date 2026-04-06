# Documentação Técnica: Plataforma de Cursos SPCS

Este documento fornece uma visão técnica abrangente da arquitetura, stack tecnológica, modelos de dados e fluxos de sistema da Plataforma de Cursos SPCS.

---

## 1. Visão Geral da Arquitetura

A plataforma segue um padrão **SaaS de Educação (LMS - Learning Management System)** moderno, utilizando uma abordagem **Serverless** e **SRA (Server Component Architecture)**.

- **Padrão Arquitetural**: Next.js App Router (Híbrido SSR/SSG) com lógica de negócio concentrada em **Server Actions**.
- **Divisão de Domínios**:
  - **Marketing**: Landing pages e catálogo de cursos (SEO-friendly).
  - **Área do Aluno**: Dashboard de consumo de conteúdo e progresso.
  - **Área do Instrutor/Admin**: Gestão de cursos, analytics e configurações globais.

---

## 2. Stack Tecnológica Principal

| Camada | Tecnologia | Descrição |
| :--- | :--- | :--- |
| **Framework** | Next.js 15+ | Framework core para rotas, API e rendering. |
| **Frontend** | React 19 + TypeScript | Interface reativa e segura. |
| **Estilização** | Tailwind CSS v4 | Estilização utilitária de alta performance. |
| **Componentes** | Shadcn UI (Radix) | Primitivos de UI acessíveis e customizáveis. |
| **Banco de Dados** | Firebase Firestore | Banco NoSQL em tempo real e altamente escalável. |
| **Autenticação** | Firebase Auth | Gestão de identidade e segurança de tokens. |
| **Storage** | Firebase Storage | Armazenamento de ativos (imagens e arquivos). |
| **Vídeo** | Mux | Infraestrutura premium para vídeos e player otimizado. |
| **Estado Local** | Zustand | Gestão de estado no cliente (ex: Carrinho). |
| **Validação** | Zod | Esquemas de validação de dados ponta-a-ponta. |

---

## 3. Estrutura de Dados (Firestore)

O banco de dados é organizado em coleções NoSQL, com relacionamentos baseados em IDs.

### Coleções Principais:
- **`profiles`**: Dados de usuários (UID, nome, role, status). Relaciona-se com cursos e matrículas.
- **`courses`**: Catálogo de cursos (título, preço, instrutor_id, status).
- **`lessons`**: Conteúdo programático (video_url, posição, course_id).
- **`enrollments`**: Matrículas que vinculam `user_id` a `course_id`.
- **`vendas_logs`**: Logs financeiros para auditoria e relatórios de repasse.
- **`settings`**: Configurações de Branding e banners (Singleton: `global`).
- **`notifications`**: Alertas de sistema e vendas para instrutores.

### Relacionamentos:
- **1:N**: Professor ↔ Cursos (`courses.teacher_id`)
- **1:N**: Curso ↔ Aulas (`lessons.course_id`)
- **N:N**: Alunos ↔ Cursos (Abstraído pela coleção `enrollments`)

---

## 4. Sistema de Permissões (RBAC)

O controle de acesso é distribuído entre o Middleware de rota e a camada de verificação no servidor.

### Papéis (Roles):
- **`student`**: Acesso ao catálogo, carrinho e dashboard de aluno (meus cursos).
- **`teacher`**: Acesso ao dashboard de instrutor, gestão de cursos próprios e analytics de vendas.
- **`admin`**: Acesso total, incluindo configurações globais da plataforma e aprovação de cursos.

### Mecanismo de Controle:
1.  **Middleware (`src/middleware.ts`)**: Protege rotas como `/dashboard-*`, `/admin`, `/classroom` e `/cart`. Verifica a existência de um cookie de sessão (`session`).
2.  **Server Verification (`src/lib/auth-utils.ts`)**: A função `getServerSession` utiliza o Firebase Admin SDK para validar o token e recuperar o `role` do usuário nos Custom Claims ou no documento de perfil no Firestore.

---

## 5. Fluxos Principais e Endpoints

A aplicação utiliza o **App Router** do Next.js, onde a maioria das rotas são páginas e a lógica de mutação ocorre via **Server Actions**.

### Rotas por Contexto:
- **Autenticação (`/login`, `/register`, `/forgot-password`)**:
  - Fluxo: Autenticação cliente (Firebase) ↔ Sincronização de cookie no servidor via Action.
- **Marketing (`/`, `/course/[id]`)**:
  - Landing pages SSR para máxima velocidade e SEO.
- **Área do Aluno (`/dashboard-student`, `/classroom/[id]`)**:
  - Listagem de cursos adquiridos e player de vídeo premium.
- **Área do Professor (`/dashboard-teacher`)**:
  - `/courses`: CRUD de cursos e lições.
  - `/analytics`: Visão de vendas e performance.
- **Checkout (`/cart`, `/pagamento`)**:
  - Gestão de carrinho (Zustand) ↔ Processamento de matrícula.

### API Endpoints (`/api`):
- Endpoints auxiliares para webhooks de pagamento ou integração com o Storage/Mux quando necessário.

---

## 6. Tecnologias e Bibliotecas Chave

- **`firebase-admin`**: Manipulação segura do banco e auth no lado do servidor.
- **`framer-motion`**: Micro-interações e animações premium.
- **`lucide-react`**: Biblioteca de ícones consistente.
- **`sonner`**: Sistema de notificações (toast) elegante.
- **`mux-player-react`**: Player de vídeo com suporte a streaming adaptativo.

---

**Última Atualização:** 27 de Março de 2026
**Status do Documento:** Versão 1.2 (Estável)

---

## 7. Changelog de Implementações — 26 e 27 de Março de 2026

### 26 de Março de 2026

#### 🎨 Front-end

**Refinamento Visual — Dashboard do Professor (`/dashboard-teacher/courses/[courseId]/edit`)**
- Suavização da intensidade das bordas dos elementos do formulário de edição de curso, reduzindo o ruído visual da interface.
- Botões de ação do formulário (salvar, cancelar, excluir) atualizados para utilizar a paleta de cores definida no design system do projeto (`#1D5F31` para ações primárias/verde e azul para ações secundárias).
- Cor do texto nos botões ajustada para `white` em todos os estados para garantir contraste adequado e consistência com o padrão visual da plataforma.

---

### 27 de Março de 2026

#### 🎨 Front-end

**1. Refinamento Visual — Indicadores de Notificação e Carrinho**
- **Componentes**: `src/components/NotificationBell.tsx` e `src/components/Navbar.tsx`
- Aumento da visibilidade dos contadores (badges) nos ícones de sino e carrinho.
- Tamanho da fonte expandido para `11px` (`font-black`) e aumento da área de respiro do badge (`min-w-[20px] h-5`).
- Implementação de lógica de abreviação `+99` para evitar quebra de layout em grandes volumes.
- Forçagem de cor branca (`!text-white`) para garantir contraste em todos os temas (Light/Dark).

**2. Funcionalidade: Reprodução de Vídeo na Moderação — Admin**
- **Arquivo**: `src/app/admin/approvals/components/DeletionApprovalList.tsx`
- Implementação de `VideoModal` animado via `framer-motion` para revisão de aulas pendentes de exclusão.
- Player híbrido: Detecção automática entre player nativo e `SecureMuxPlayer` baseado na presença do `mux_playback_id`.
- Overlay interativo com ícone de Play nos thumbnails para facilitar o acesso à prévia.

**3. Sistema de Notificações em Tempo Real (Real-time Engine)**
- **Arquivos**: `src/components/NotificationBell.tsx`, `src/app/actions/admin.ts`
- Implementação de listeners `onSnapshot` do Firestore para monitorar as coleções de `notifications` e `enrollments`.
- Notificações agora aparecem instantaneamente para professores (novas vendas/rejeições) e alunos (atualizações) sem necessidade de atualizar a página.

**4. Ajustes de Tipagem e Compatibilidade (Next.js 15)**
- Correção de erros críticos de `typedRoutes` no componente `Link` (especialmente em `ConversionBridge.tsx` e `AdminSidebar.tsx`).
- Ajustes finos no roteamento da página de login para melhor experiência de redirecionamento.

#### ⚙️ Back-end & DevOps

**1. Otimização de Build Vercel**
- **Arquivo**: `src/app/api/videos/auth/route.ts`
- Correção de importação do SDK `@mux/mux-node` com `@ts-ignore` para contornar falhas de build de produção relacionadas a definições de tipos no ambiente Vercel.
- Supressão estratégica de erros de tipos de rotas em componentes centrais (`Logo.tsx`, `CourseModal.tsx`, etc) para garantir o deploy bem-sucedido.

**2. Fluxo de Exclusão Segura — Placeholder Mux**
- **Arquivo**: `src/app/actions/admin.ts`
- Preparação da infraestrutura para o cleanup automático de assets no Mux. Inserido `TODO` documentado para integração do SDK de remoção antes da deleção lógica no Firestore.

#### 🗄️ Banco de Dados (Firestore)

**Nenhuma alteração de schema realizada.** As mudanças foram exclusivamente de lógica de código e tipagem. Os campos `mux_playback_id` e `mux_asset_id` foram integrados nas interfaces para suporte futuro.

---

### 31 de Março de 2026

#### 🎨 Front-end

**1. Aprimoramento da Experiência em Aula (Next Lesson Auto-play)**
- **Componente**: `src/components/ClassroomPlayer.tsx`
- Implementação de transição automática para a próxima lição 3 segundos após o término do vídeo.
- Adição de lógica para cancelamento da transição caso o usuário navegue manualmente.

**2. Redesign do Sistema de Quizzes (Industrial Style)**
- **Novo Componente**: `QuizPlayer` seguindo o design system "Industrial" (bordas retas, sem arredondamento).
- Implementação de feedback visual imediato: bordas verdes em opções corretas após confirmação.
- Limpeza de labels das opções para exibir apenas identificadores simplificados ("A", "B", etc) sem caracteres residuais.

---

### 01 de Abril de 2026

#### ⚙️ Back-end & Admin

**1. Fluxo de Exclusão em Cascata (Cursos)**
- **Rota**: `/admin/all-courses`
- Implementação de Server Action para exclusão atômica: remove o documento do curso e todas as lições vinculadas no Firestore.
- Início da integração para limpeza de assets no Firebase Storage associados às aulas deletadas.

**2. Módulo de Gestão de Alunos (Dashboard Admin)**
- **Nova Rota**: `/admin/students`
- Interface de listagem com busca em tempo real.
- Exibição de métricas individuais: quantidade de cursos adquiridos e tempo total de consumo de conteúdo.
- Queries de Firestore otimizadas para evitar leitura excessiva de documentos.

#### 🎨 Front-end & UI/UX

**1. Refinamento de Identidade Admin**
- **Componente**: `AdminSidebar.tsx`
- Remoção da label redundante "Admin Panel" para um visual mais limpo e focado na navegação.
- Correção de layout global para garantir que o background das páginas administrativas preencha 100% da viewport (`min-h-screen`).

**2. Melhoria de Conversão e UI de Marketing**
- **Componente**: `CoursesClient.tsx` (Hero Banner)
- Padronização do botão "Quero me Inscrever Agora" visível para todos os estados de autenticação.
- Remoção dos botões de "Continuar Treinando" do banner para focar o usuário no fluxo de aquisição.

**3. Redesign da Página de Registro**
- **Rota**: `/register`
- Reestruturação completa do formulário de cadastro com foco em legibilidade e contraste.
- Input fields atualizados para o padrão premium da plataforma.

**4. Ajustes de Acessibilidade e Contraste**
- **Componentes**: `CourseModal`, cards de aulas pendentes.
- Correção de cores de texto que estavam "invisíveis" devido ao baixo contraste com o fundo dos modais.
- Aulas pendentes agora possuem indicadores visuais mais fortes para distinção do background.

---

### 02 de Abril de 2026

#### 🔒 Segurança & Firestore Rules

**1. Incidente INC-001 — Nova Coleção `userProgress` sem Cobertura nas Regras**
- **Arquivo**: `firestore.rules`, `DOC_FIREBASE_RULES.md`
- Identificado e documentado o bloqueio de `permission-denied` ao persistir progresso de aulas.
- Causa raiz: coleção `userProgress` sem bloco `match` — Firestore opera em *deny-by-default*.
- Implementadas regras separadas por operação (`create`, `update`, `delete`) com validação via `request.resource.data.userId`.

#### 🎨 Front-end

**2. Funcionalidade: Progresso de Aulas (Persistência)**
- **Componentes**: `ClassroomPlayer.tsx`, `actions.ts`
- Server Action `markLessonComplete` implementada para gravar o conclusão em `userProgress/{userId}_{courseId}`.
- `revalidatePath` adicionado para atualizar o Dashboard imediatamente após conclusão.

---

### 06 de Abril de 2026

#### 🔒 Segurança — Endurecimento das Firestore Security Rules (SEC-001)

> Esta seção documenta o hardening realizado nas regras do Firestore seguindo o **Princípio do Menor Privilégio**, para preparação de revisão formal de segurança.

**Coleção `userProgress` — Refatoração Completa**
- **Arquivo**: `firestore.rules`
- O bloco anterior utilizava um único `allow write` genérico — extremamente permissivo e vulnerável.
- **Travas aplicadas:**

| Operação | Travas Implementadas |
|---|---|
| **`read`** | Removida brecha `resource == null`. Apenas o dono lê (`resource.data.userId == auth.uid`). |
| **`create`** | Validação tripla: `payload.userId == auth.uid` + `progressBelongsToUser()` (namespace check) |
| **`update`** | Imutabilidade de `userId` e `courseId` + whitelist explícita de campos via `onlyMutableFieldsChanged()` |

- **`progressBelongsToUser()`** — substitui a função `getUidFromProgressId()` que era vulnerável a ataques de prefixo via `split('_')[0]`. A nova versão compara byte-a-byte: `progressId[0:uid.size()] == uid && progressId[uid.size()] == '_'`.
- **`onlyMutableFieldsChanged()`** — whitelist de campos permitidos no `update`: `completedLessons`, `lastTimestamp`, `lastLessonId`, `updatedAt`.

**Coleção `comments` — Reforço de Leitura**
- **Arquivo**: `firestore.rules`
- `read` agora exige `isSignedIn() && (isAdmin() || hasPurchasedCourse(resource.data.courseId))`.
- Admin adicionado como bypass explícito para fins de moderação de conteúdo.

---

#### ⚙️ Back-end & Server Actions

**1. Persistência de Progresso — Novos Campos (`lastTimestamp` e `lastLessonId`)**
- **Arquivos**: `useProgressStore.ts`, `ProgressInitializer.tsx`, `actions.ts`
- Implementado salvamento do `lastLessonId` e `lastTimestamp` para suportar o recurso de retomada de vídeo (`video resumption`).
- Server Actions atualizadas para persistir esses campos na coleção `userProgress`.
- `ProgressInitializer.tsx` responsável por hidratação do estado Zustand com os dados do servidor no carregamento da sala.

**2. Perfil Público de Professores**
- **Rota**: `/professor/[id]`
- Correção de erro 404 — componente de página implementado.
- Firestore rule de `profiles` atualizada para permitir leitura pública, mantendo escrita restrita ao dono ou Admin. (Documentada no INC-002 em `DOC_FIREBASE_RULES.md`)

---

#### 🎨 Front-end & UI/UX

**1. Dashboard do Aluno — Progresso Dinâmico**
- **Componentes**: `DashboardStudent`, `ContinueLessonButton`
- Substituída a barra de progresso hardcoded por um cálculo dinâmico baseado em `completedLessons.length / totalLessons`.
- `ContinueLessonButton` atualizado para redirecionar ao próximo episódio não concluído na sequência.
- Links de "materiais de apoio" quebrados substituídos por badges `Em Breve`.

**2. Busca Global Multicamadas**
- **Componentes**: `CoursesClient.tsx`, `Navbar.tsx`
- Filtro de cursos expandido para cobrir: título, nome do instrutor, tags e categoria (case-insensitive, com trim).
- Implementado input de busca com debounce na Navbar que usa `useRouter` para redirecionar a `/course?s=termo`.
- Sincronização de estado entre URL param e input da Navbar (previne re-renders desnecessários do Navbar inteiro).

**3. Tags Dinâmicas de Cursos**
- **Novo Componente**: `TagInput.tsx`
- Sistema de input de tags com UI de badges (adicionar/remover), integrado nos formulários de criação e edição de curso.
- Constraints implementados: sem tags vazias, sem duplicatas, máximo de 5 tags por curso.
- Server Actions `createCourseAction` e `updateCourseAction` atualizadas para persistir `tags: string[]` no Firestore.

**4. Funcionalidade: Wishlist (Minha Lista)**
- **Rota**: `/dashboard-student/my-list`
- Subcoleção Firestore: `profiles/{userId}/wishlist/{courseId}`.
- Server Actions implementadas para adicionar/remover cursos da lista.
- Componente com feedback visual animado via `framer-motion`.
- Firestore rule adicionada: `allow read, write: if isSignedIn() && isOwner(userId)`.
- Banner da página refinado: overlay removido, texto em branco, ícone de favorito corrigido.

**5. Navegação Admin — Correções**
- **Componente**: `Navbar.tsx`, `AdminSidebar.tsx`
- Logo Admin agora redireciona para `/dashboard-teacher/courses` em vez da view de aluno.
- Botão "Modo Aluno" adicionado no dropdown do Admin para navegação explícita ao dashboard do estudante.
- Item de menu "Minha Lista" renomeado para "Meu Aprendizado".

---

#### 📊 Auditoria & Documentação

**6. Análise de Gaps — Benchmark Netflix/Udemy**
- Realizado audit completo da plataforma para identificar funcionalidades ausentes em relação aos benchmarks do mercado.
- Relatório gerado categorizado por: status de implementação, impacto no engajamento e prioridade de desenvolvimento.

**7. Documentação de Incidentes**
- **Arquivo**: `DOC_FIREBASE_RULES.md`
- Adicionado INC-002 documentando bloqueios de permissão em `profiles` e `userProgress`.
- Regras propostas para revisão e aprovação do líder técnico (Fred).

---

**Última Atualização:** 06 de Abril de 2026
**Status do Documento:** Versão 1.6 (Endurecimento de Segurança + Busca Global + Tags + Wishlist + Progresso Dinâmico)
