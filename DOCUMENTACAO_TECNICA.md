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

**Funcionalidade: Reprodução de Vídeo na Fila de Exclusões — Admin (`/admin/approvals`)**

Arquivo modificado: `src/app/admin/approvals/components/DeletionApprovalList.tsx`

- Exportada a interface `LessonData` com tipagem completa e campos opcionais para suporte futuro ao Mux:
  - `video_url?: string | null` — URL legada de vídeo (Firebase Storage / upload direto).
  - `mux_playback_id?: string | null` — ID de playback do Mux para migração futura.
  - `mux_asset_id?: string | null` — ID de asset do Mux para futura gestão via SDK.
- Adicionado estado `selectedLesson: LessonData | null` no componente para gerenciar qual aula está sendo exibida no modal.
- Implementado **VideoModal** animado via `framer-motion` (`AnimatePresence` + `motion.div`):
  - **Lógica de player híbrida**: renderiza `SecureMuxPlayer` se `mux_playback_id` estiver presente; caso contrário, faz fallback para a tag `<video>` nativa com `autoPlay` e `controls`.
  - Exibe nome da aula e curso associado no rodapé do modal.
  - Modal fecha ao clicar no backdrop ou no botão `X`.
- Overlay interativo de Play adicionado nos thumbnails das aulas pendentes de exclusão:
  - Fundo com `bg-black/20` que escurece para `bg-black/40` no hover.
  - Ícone `Play` (lucide-react, preenchido) centralizado, revelado com transição de opacidade e escala suave no hover.
  - Cursor `pointer` ativado em toda a área do thumbnail.
- Importações adicionadas: `motion`, `AnimatePresence` de `framer-motion`; ícone `Play` de `lucide-react`; componente `SecureMuxPlayer`.

#### ⚙️ Back-end

**Placeholder de Cleanup para Mux — `src/app/actions/admin.ts`**

- Inserido bloco `// TODO` documentado na Server Action `approveLessonDeletion`, indicando o ponto exato onde a chamada ao **Mux SDK** deverá ocorrer para exclusão do asset de vídeo (`mux_asset_id`) antes da remoção definitiva do documento no Firestore.
  - Comentário de código incluso como guia para a implementação futura:
    ```ts
    // TODO: Implementar Mux SDK para deletar o asset via mux_asset_id antes de remover do DB
    // if (lessonData?.mux_asset_id) {
    //     await mux.video.assets.delete(lessonData.mux_asset_id);
    // }
    ```

#### 🗄️ Banco de Dados (Firestore)

**Nenhuma alteração de schema realizada.** As mudanças de 27/03 foram exclusivamente de front-end e back-end (nível de código). Os campos `mux_playback_id` e `mux_asset_id` foram adicionados como **opcionais** na interface TypeScript `LessonData`, antecipando a migração futura da coleção `lessons` no Firestore para armazenar esses campos. Quando a migração for concluída, os documentos de `lessons` deverão incluir esses campos para que o player Mux seja automaticamente ativado no painel de moderação do Admin.


