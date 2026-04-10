# Mapa Técnico e Documentação: Plataforma de Cursos SPCS

Este documento detalha o estado atual da arquitetura e das funcionalidades da plataforma, servindo como guia técnico para a equipe de desenvolvimento.

---

## 1. Visão Geral
A plataforma é uma aplicação **SaaS de educação (LMS)** construída com **Next.js 15+** utilizando o **App Router**. O sistema é dividido em três domínios principais: Marketing (venda de cursos), Dashboard do Aluno (consumo de conteúdo) e Dashboard do Professor/Admin (gestão e analytics).

## 2. Tecnologias Principais
| Camada | Tecnologia | Propósito |
| :--- | :--- | :--- |
| **Framework** | Next.js (App Router) | Fullstack framework, SSR/SSG e Server Actions. |
| **Linguagem** | TypeScript | Tipagem estática e segurança de código. |
| **Estilização** | Tailwind CSS v4 | Design system utilitário e moderno. |
| **Autenticação** | Firebase Auth | Gestão de identidade e sessões. |
| **Banco de Dados** | Firestore | NoSQL em tempo real para dados da aplicação. |
| **Storage** | Firebase Storage | Armazenamento de ativos (imagens, vídeos). |
| **Estado Global** | Zustand | Gestão de estado leve e resiliente no lado do cliente. |
| **Validação** | Zod | Esquemas de validação de dados e formulários. |
| **Componentes** | Shadcn UI (Radix) | Primitivos acessíveis e componentes de layout premium. |

---

## 3. Funcionalidades Core

### A. Autenticação e Autorização
*   **O que é:** Sistema de controle de acesso e identidade.
*   **Como funciona:** 
    1.  O usuário se autentica via Firebase no cliente.
    2.  O `ID Token` gerado é enviado para uma Server Action (`setSessionCookie`), que o armazena em um cookie `httpOnly` (`firebase-token`).
    3.  O `middleware.ts` protege rotas verificando a existência deste cookie.
    4.  No servidor, `getServerSession` (`lib/auth-utils.ts`) usa o **Firebase Admin SDK** para verificar a validade do token e buscar o `role` (student, teacher, admin) na coleção `profiles`.
*   **Tecnologias:** Firebase Auth, Cookies (Next.js), Firebase Admin SDK.
*   **Dependências:** `src/middleware.ts`, `src/lib/auth-utils.ts`, `src/context/AuthProvider.tsx`.

### B. Banco de Dados e Persistência
*   **O que é:** Camada de dados NoSQL organizada em coleções reativas.
*   **Como funciona:**
    *   **Escrita:** Realizada majoritariamente via **Server Actions** (`app/actions` ou pastas de rota) utilizando o `adminDb` (Admin SDK) para garantir segurança e bypass de regras granulares quando necessário.
    *   **Leitura:** Feita diretamente em **Server Components** para reduzir o bundle size do cliente e melhorar o SEO.
    *   **Estrutura principal:**
        *   `profiles`: Metadados do usuário (nome, cargo, bio).
        *   `courses`: Informações de venda e configuração de cursos.
        *   `lessons`: Conteúdo programático vinculado aos cursos.
        *   `enrollments`: Matrículas que vinculam alunos aos cursos adquiridos.
*   **Tecnologias:** Firestore, Firebase Admin.
*   **Dependências:** `src/lib/firebase-admin.ts`, `src/app/actions/*.ts`.

### C. Componentes UI e Design System
*   **O que é:** Interface premium focada em experiência de usuário (UX).
*   **Como funciona:** Utiliza uma paleta baseada em **Slate** (cinzas sóbrios) com acentos em **Green-500** (`#00C402`). Os componentes seguem o padrão Shadcn, utilizando `class-variance-authority` (CVA) para variantes de estilo.
*   **Destaques Técnicos:**
    *   Uso de **Framer Motion** para micro-interações.
    *   Layouts responsivos com `grid` e `flex`.
    *   **Glassmorphism:** Uso de `backdrop-blur` em Navbars e modais.
*   **Tecnologias:** Tailwind 4, Lucide Icons, Radix UI.
*   **Dependências:** `src/components/ui/`, `src/app/globals.css`.

### D. Gestão de Estado (Zustand)
*   **O que é:** Sincronização de dados transversais à aplicação.
*   **Stores principais:**
    *   `useAuthStore`: Mantém dados básicos do usuário logado para reatividade da UI.
    *   `useCartStore`: Gerencia o carrinho de compras com persistência automática no `localStorage`.
    *   `useCourseFormStore`: Gerencia o estado complexo de criação/edição de cursos e lições.
*   **Sincronização:** O componente `StoreInitializer` é usado em Client Components para hidratar o estado do Zustand com dados vindos do servidor (ex: `purchasedCourseIds`).
*   **Tecnologias:** Zustand, Zustand/middleware (persist).

---

## 4. Fluxos de Dados e Ações
A aplicação prioriza **Server Actions** para todas as mutações:
*   **Checkout:** Valida o carrinho, cria o registro de `enrollment` e limpa o estado do cliente.
*   **Gestão de Cursos:** O fluxo de edição usa `adminDb.batch()` para garantir que alterações no curso e em suas múltiplas aulas sejam atômicas.
*   **Revalidação:** Uso intenso de `revalidatePath` para limpar o cache do Next.js após mutações, garantindo que o usuário veja os dados atualizados instantaneamente.

---

## 5. Estrutura Técnica de Pastas
```text
src/
├── app/                  # Rotas e Server Actions (Next.js App Router)
│   ├── (auth)/           # Fluxo de login, registro e recuperação
│   ├── (marketing)/      # Home, cursos e checkout
│   ├── classroom/        # Player de vídeos e conteúdo de aula
│   ├── dashboard-student/# Painel do aluno
│   └── dashboard-teacher/# Painel do instrutor e gestão
├── components/           # Componentes React
│   ├── ui/               # Componentes atômicos (Button, Input, etc)
│   └── dashboard/        # Componentes complexos de painel
├── context/              # Context Providers (Auth, Branding)
├── lib/                  # Configurações core (Firebase, Utils, Zod)
├── store/                # Stores do Zustand (Cart, Auth, Form)
└── hooks/                # Hooks customizados (Notifications, Auth)
```

---

## 6. Próximos Passos Recomendados
1.  **Segurança:** Refinar as `firestore.rules` caso haja chamadas diretas do cliente no futuro.
2.  **Performance:** Implementar `Mux` hooks para melhor controle de analytics de vídeo.
3.  **Testes:** Implementar testes de integração nas Server Actions críticas (Pagamento/Enrollment).

---
**Documentação gerada em:** 12/03/2026
**Responsável:** Antigravity AI (Senior Technical Documentation)
