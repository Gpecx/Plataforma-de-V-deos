# PRD PowerPlay - Health Check & Update
**Data:** 15 de Maio de 2026
**Status:** Auditoria Técnica Concluída
**Responsável:** Lead Engineer / Product Manager

---

## 1. Dashboard de Progresso do Projeto

| Sprint / Fase | Funcionalidade | Status | Validação Técnica |
| :--- | :--- | :--- | :--- |
| **Fase 1: Core** | Autenticação & Session Lock | ✅ CONCLUÍDO | UUID de sessão persistido no Firestore e validado no SSR. |
| **Fase 1: Core** | Motor Financeiro (Asaas Split) | ✅ CONCLUÍDO | Split dinâmico implementado na Action `processAsaasCheckout`. |
| **Fase 1: Core** | Bouncer de Conteúdo | ✅ CONCLUÍDO | Redirect imperativo em `/dashboard-student/course/[id]`. |
| **Fase 2: Teacher** | Onboarding (Subcontas Asaas) | ✅ CONCLUÍDO | Action `createTeacherWallet` operacional para admins. |
| **Fase 2: Teacher** | Mux Direct Upload | ✅ CONCLUÍDO | URLs assinadas geradas via SDK Mux para instrutores. |
| **Fase 2: Teacher** | Gestão de Módulos (Dnd) | ✅ CONCLUÍDO | Interface `CourseBuilder` com reordenamento dnd-kit. |
| **Fase 2: Teacher** | Sincronia de Progresso | ✅ CONCLUÍDO | Tracking via `saveLessonProgress` no `ClassroomPage`. |
| **Fase 3: IA** | RAG com Vertex AI | ⏳ PENDENTE | Arquitetura definida, aguardando implementação de embeddings. |

---

## 2. Análise de Débito Técnico (Mocks Detectados)

Identificamos os seguintes componentes que ainda operam com dados estáticos ou lógicas de estimativa:

1.  **Classroom Q&A (`ClassroomTabs.tsx`)**:
    *   `MOCK_COMMENTS` ainda presente no código.
    *   Flag `SHOW_QA` definida como `false` por padrão.
2.  **Materiais de Aula**:
    *   Links de download de PDFs e código fonte marcados como "Em Breve".
3.  **Estatísticas do Instrutor (`instructor.ts`)**:
    *   `totalReviews`: Calculado como estimativa (`totalStudents * 0.4`).
    *   `averageRating`: Valor estático `4.8` (Base PowerPlay).
4.  **Certificados**:
    *   Lógica de emissão funcional, mas o layout do PDF/Imagem final precisa de refinamento estético premium.

---

## 3. Especificação Sprint 3 - Inteligência Artificial (Vertex AI)

A arquitetura RAG (Retrieval-Augmented Generation) será implementada para permitir que os alunos tirem dúvidas baseadas especificamente no conteúdo do curso.

### Arquitetura Proposta:
1.  **Ingestão**:
    *   Extração de transcrições do Mux (Webhooks).
    *   Processamento de PDFs de apoio via Document AI.
2.  **Vetorização**:
    *   Geração de Embeddings usando o modelo `text-multilingual-embedding-002` do Vertex AI.
    *   Armazenamento em **Firestore Vector Search** (Preview) ou **Pinecone**.
3.  **Interface de Chat**:
    *   Componente `AIInstructorChat` integrado à `ClassroomTabs`.
    *   Prompt System: "Você é o [Nome do Professor]. Responda apenas com base nas transcrições e materiais fornecidos. Mantenha o tom de voz: [Tom Definido no Perfil]."

---

## 4. Checklist de Segurança & Hardening

*   [x] **B-01 (Session Guard)**: Cookies configurados com `HttpOnly`, `SameSite=Lax` e `Secure` (em prod).
*   [x] **Pirataria (Mux Signed URLs)**: Implementado. Vídeos de aula não são acessíveis sem token JWT de curta duração (1h).
*   [x] **Session Concurrency**: Implementado. O login em um novo dispositivo invalida o `active_session_id` do dispositivo anterior.
*   [x] **Rate Limiting**: Implementado no `middleware.ts` para rotas de auth e vídeo (Max 10 req/min).
*   [ ] **IDOR Check**: Pendente auditoria profunda nas rotas de API que recebem `userId` no body em vez de usar a sessão.

---

> [!IMPORTANT]
> O projeto está em **estado saudável** para transição para a Fase 3. O foco imediato deve ser a substituição dos Mocks de Q&A e o início da pipeline de dados para o Vertex AI.
