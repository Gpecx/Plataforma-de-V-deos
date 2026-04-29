# QA_CHECKLISTS.md — PowerPlay Plataforma de Cursos

**Responsavel pelo Arquivo:** Fred (Lider de Projeto)
**Criado em:** 2026-04-02
**Ultimo Ciclo:** 2026-04-29 (Completo — Analista: IA/Antigravity)
**Versao:** 3.1.0
**Status:** Ativo

---

> Itens marcados com [x] foram CONFIRMADOS via code review estatico.
> Itens marcados [ ] dependem de validacao em ambiente ou estao pendentes.

---

## TABELA DE CONTROLE

| Data       | Funcionalidade                            | Status    | Versao | Responsavel    |
| ---------- | ----------------------------------------- | --------- | ------ | -------------- |
| 2026-04-02 | Comentarios - Persistencia                | Passou    | 1.1.0  | Daniel / IA    |
| 2026-04-02 | Comentarios - Autoria Dinamica            | Passou    | 1.1.0  | Daniel / IA    |
| 2026-04-02 | Progresso de Aula - Persistencia          | Passou*   | 1.1.0  | Daniel / IA    |
| 2026-04-02 | Progresso de Aula - Seguranca             | Passou    | 2.0.0  | IA/Antigravity |
| 2026-04-23 | Settings Teacher - Notificacoes           | Passou*   | 2.0.0  | IA/Antigravity |
| 2026-04-23 | Settings Teacher - CEP/Endereco           | Passou    | 2.0.0  | IA/Antigravity |
| 2026-04-23 | Settings Teacher - Senha Segura           | Passou    | 2.0.0  | IA/Antigravity |
| 2026-04-23 | Settings Teacher - 2FA/TOTP               | Passou    | 2.0.0  | IA/Antigravity |
| 2026-04-23 | Cursos Teacher - Criacao                  | Passou    | 2.0.0  | IA/Antigravity |
| 2026-04-23 | Cursos Teacher - Exclusao Segura          | Passou    | 2.0.0  | IA/Antigravity |
| 2026-04-23 | Checkout PIX - Fluxo Completo             | Passou*   | 2.0.0  | IA/Antigravity |
| 2026-04-23 | Checkout - Validacao de Preco Zero        | Passou    | 2.0.0  | IA/Antigravity |
| 2026-04-23 | Checkout - Consentimento LGPD             | Passou    | 2.0.0  | IA/Antigravity |
| 2026-04-23 | Firestore Rules - Colecoes Criticas       | Passou    | 2.0.0  | IA/Antigravity |
| 2026-04-23 | Upload de Video - Mux Integration         | Passou*   | 2.0.0  | IA/Antigravity |
| 2026-04-23 | Autenticacao - Session Cookie             | Passou    | 2.0.0  | IA/Antigravity |
| 2026-04-28 | Certificados - Emissao Dinamica           | Passou*   | 3.0.0  | IA/Antigravity |
| 2026-04-28 | Certificados - Download PDF (html2canvas) | Passou*   | 3.0.0  | IA/Antigravity |
| 2026-04-28 | Certificados - Render Headless Playwright | Falha*    | 3.0.0  | IA/Antigravity |
| 2026-04-28 | Conclusao de Curso - Engine + teacherName | Passou    | 3.0.0  | IA/Antigravity |
| 2026-04-28 | Legal Docs - Admin Management             | Passou    | 3.0.0  | IA/Antigravity |
| 2026-04-28 | Legal Docs - getLegalDocsSettings merge   | Passou    | 3.0.0  | IA/Antigravity |
| 2026-04-28 | Ban Hook - useAuthGuard (INC-009)         | CORRIGIDO | 3.0.0  | IA/Antigravity |
| 2026-04-28 | Payments Page - Cartao Salvo              | Mock/TODO | 3.0.0  | IA/Antigravity |
| 2026-04-28 | Subscriptions - Link Refund Policy        | CORRIGIDO | 3.0.0  | IA/Antigravity |
| 2026-04-28 | Classroom Access - Debug Logs             | CORRIGIDO | 3.0.0  | IA/Antigravity |
| 2026-04-28 | TypeScript - Erros de Compilacao          | 0 erros   | 3.0.0  | IA/Antigravity |
| 2026-04-28 | Login - Mensagem de conta suspensa        | Passou    | 3.0.0  | IA/Antigravity |
| 2026-04-29 | Webhook Asaas - Logica de Matricula       | CORRIGIDO | 3.1.0  | IA/Antigravity |
| 2026-04-29 | Checkout - Ordem batch/Asaas (INC-004)    | CORRIGIDO | 3.1.0  | IA/Antigravity |
| 2026-04-29 | Debug Logs - Limpeza Geral                | CORRIGIDO | 3.1.0  | IA/Antigravity |
| 2026-04-29 | handleTeacherApproval - Stub sem impl     | CORRIGIDO | 3.1.0  | IA/Antigravity |
| 2026-04-29 | Admin Routes - Role Guard                 | Passou    | 3.1.0  | IA/Antigravity |
| 2026-04-29 | Teacher Routes - Role Guard               | Passou    | 3.1.0  | IA/Antigravity |
| 2026-04-29 | TypeScript - 0 erros pos-correcoes        | 0 erros   | 3.1.0  | IA/Antigravity |

> *Passou na logica de codigo. Requer validacao final em ambiente de producao.

---

## FUNCIONALIDADE 1: Secao de Comentarios (Revisado)

**Scope:** `src/app/(app)/classroom/[id]/ClassroomTabs.tsx`
**Data do Ciclo:** 2026-04-02 / Revisao: 2026-04-29
**Versao:** 3.1.0

### 1.1 — Happy Path
- [x] Comentarios carregam em tempo real via `onSnapshot`.
- [x] Enviar comentario com nome e avatar corretos do usuario logado.
- [x] Comentario aparece no topo sem reload (ordem `desc` por `createdAt`).
- [x] F5 preserva todos os comentarios (Firestore como fonte da verdade).

### 1.2 — Edge Cases
- [x] Botao desabilitado enquanto `isSending = true` (anti-duplo-clique).
- [x] Campo vazio nao dispara `addDoc` (guard `!commentText.trim()`).
- [x] Trocar de aula faz cleanup do `onSnapshot` via `useEffect` return.

### 1.3 — Seguranca
- [x] Regra Firestore: leitura exige `hasPurchasedCourse()`.
- [x] Criacao exige `request.resource.data.userId == request.auth.uid`.
- [x] Exclusao permitida apenas ao autor ou admin.

---

## FUNCIONALIDADE 2: Progresso de Aula (Revisado)

**Scope:** `src/app/(app)/classroom/[id]/actions.ts`
**Data do Ciclo:** 2026-04-02 / Revisao: 2026-04-29
**Versao:** 3.1.0

### 2.1 — Happy Path
- [x] Progresso salvo em `enrollments` via `adminDb` com `set({ merge: true })`.
- [x] `toggleLessonCompletion` e `saveLessonProgress` separados corretamente.
- [x] Conclusao de 100% dispara `processCourseCompletion` automaticamente.
- [x] Guard `alreadyConcluded` impede duplicar certificado.
- [x] `teacherName` salvo corretamente em `concluded_courses` (INC-007 resolvido).

### 2.2 — Intervalo de Salvamento (Novo v3.1)
- [x] Intervalo de 120 segundos configurado para reducao de writes no Firestore.
- [x] Salvamento forcado em `onPause`, `onEnded` e `unmount` (beforeunload).
- [x] Progresso persiste corretamente apos fechar aba.

### 2.3 — Seguranca
- [x] Todas as actions usam `adminDb` (Admin SDK) — bypass de rules correto.
- [x] `userId` validado via session cookie no servidor, nunca confiado no cliente.
- [x] `getClassroomData` verifica enrollment OU `cursos_comprados` OU role=admin.

---

## FUNCIONALIDADE 3: Teacher Settings

**Scope:** `src/app/(app)/dashboard-teacher/settings/page.tsx`
**Data do Ciclo:** 2026-04-23 / Revisao: 2026-04-29
**Versao:** 3.1.0

### 3.1 — Happy Path
- [x] Dados de PIX, CEP e notificacoes salvos em submit unico.
- [x] CEP dispara ViaCEP no `onBlur`, preenche campos automaticamente.
- [x] Reautenticacao antes de `updatePassword` — sem logout punitivo.
- [x] Sincronizacao do token apos troca de senha via `/api/auth/session`.

### 3.2 — Bugs Conhecidos
- [ ] **INC-003 (ABERTO)**: Toggles de notificacao nao recarregam do Firestore apos salvar.
- [ ] Timeout de expiracao do segredo TOTP nao exibido na UI.

---

## FUNCIONALIDADE 4: Gerenciamento de Cursos (Teacher)

**Scope:** `src/app/(app)/dashboard-teacher/courses/actions.ts`
**Data do Ciclo:** 2026-04-23 / Revisao: 2026-04-29
**Versao:** 3.1.0

### 4.1 — Happy Path
- [x] `teacher_id` fixado como `user.uid` no servidor.
- [x] Status inicial sempre `PENDENTE`.
- [x] Cursos `APROVADO` marcados `SOLICITADO_EXCLUSAO` ao inves de deletados.
- [x] Guard anti-downgrade: cursos `free` nao podem ser alterados para pagos.
- [x] Assets do Mux deletados antes da remocao do Firestore.

### 4.2 — Edge Cases
- [ ] Nao ha validacao de tamanho maximo de curriculo no servidor.
- [ ] Falha no Mux nao impede exclusao do Firestore (erro logado, nao bloqueia).

---

## FUNCIONALIDADE 5: Checkout e Pagamento PIX (Revisado v3.1)

**Scope:** `src/app/(app)/dashboard-student/actions.ts`
**Data do Ciclo:** 2026-04-23 / Revisao: 2026-04-29
**Versao:** 3.1.0

### 5.1 — Happy Path
- [x] Precos buscados do Firestore no servidor (nao confiam no cliente).
- [x] `totalAmount` calculado server-side.
- [x] Consentimento LGPD obrigatorio antes do checkout.
- [x] `consent_logs` gravado com IP, versao e dados do pedido.
- [x] **[NOVO]** `DEBUG_PAYMENT_VALUE` removido do fluxo de checkout.

### 5.2 — Correcoes v3.1
- [x] **INC-004 CORRIGIDO**: `batch.commit()` movido para APOS retorno bem-sucedido do Asaas em cursos pagos. Cursos gratuitos fazem commit imediato (sem Asaas).
- [x] **[NOVO]** `paymentId` do Asaas agora salvo em `vendas_logs` para que o webhook possa confirmar a matricula.
- [x] **[NOVO]** Campo `userId` adicionado em `vendas_logs` para consistencia com webhook.

---

## FUNCIONALIDADE 6: Certificados

**Scope:** `src/app/(app)/dashboard-student/certificates/page.tsx` + `src/app/(app)/classroom/[id]/actions.ts`
**Data do Ciclo:** 2026-04-28 / Revisao: 2026-04-29
**Versao:** 3.1.0

### 6.1 — Happy Path
- [x] Certificados carregados de `concluded_courses` no perfil do aluno.
- [x] Guard `alreadyConcluded` impede emissao duplicada.
- [x] `credentialId` gerado com formato `PP-2026-XXXXXX`.
- [x] Download PDF via `html2canvas` + `jsPDF` funcional no modal.
- [x] Correcao de cores `lab()`/`oklch()` no `onclone` do html2canvas implementada.

### 6.2 — Seguranca (Auditado v3.1)
- [x] `processCertificateIssuance` valida 100% de conclusao antes de emitir.
- [x] Rota `/certificate-render/[id]` validada com `CERTIFICATE_RENDER_SECRET`.
- [x] `validateAndGetCertificate` garante que apenas o dono acessa seu certificado.
- [x] **[CONFIRMADO]** Nao e possivel emitir certificado sem concluir todas as aulas — validacao dupla no servidor.

### 6.3 — Bugs Abertos
- [ ] **INC-006 (ABERTO)**: Rota headless `/api/certificates/[id]/download` usa Playwright — incompativel com Vercel Serverless. Requer `@sparticuz/chromium`.
- [ ] Rota `/api/certificates/[id]/preview` nao auditada.

---

## FUNCIONALIDADE 7: Documentos Legais

**Scope:** `src/app/admin/legal/`
**Data do Ciclo:** 2026-04-28 / Revisao: 2026-04-29
**Versao:** 3.1.0

### 7.1 — Happy Path
- [x] `getLegalDocsSettings` busca de `settings/legal_docs` com merge de defaults.
- [x] Fallback com conteudo completo — paginas nunca ficam vazias.
- [x] `saveLegalDocsSettings` revalida todas as rotas afetadas.
- [x] **[NOVO]** Console.logs de debug removidos do `LegalAdminPage` (4 logs).

---

## FUNCIONALIDADE 8: Autenticacao e Sessao

**Scope:** `src/middleware.ts`, `src/context/AuthProvider.tsx`
**Data do Ciclo:** 2026-04-23 / Revisao: 2026-04-29
**Versao:** 3.1.0

### 8.1 — Middleware (Auditado v3.1)
- [x] Rotas protegidas: `/dashboard-student`, `/dashboard-teacher`, `/classroom`, `/cart`, `/admin`.
- [x] Cookie `mfa_pending=true` redireciona para login mesmo com sessao ativa.
- [x] Edge Runtime — verifica existencia do cookie (sem verificar assinatura).
- [x] **[CONFIRMADO]** Admin layout (`/admin/layout.tsx`) faz verificacao server-side de `role === 'admin'` com `redirect` se falhar.
- [x] **[CONFIRMADO]** Teacher layout verifica `role === 'teacher' || 'admin'` server-side.
- [x] **[CONFIRMADO]** Classroom acesso validado em `getClassroomData` via Admin SDK.

### 8.2 — Segredos Expostos (Auditado v3.1)
- [x] Nenhuma chave de API hardcoded encontrada no frontend.
- [x] Firebase, Mux e Asaas usam exclusivamente `process.env.*`.
- [x] `NEXT_PUBLIC_*` apenas para config publica do Firebase Client SDK (correto).

### 8.3 — AuthProvider
- [x] `onSnapshot` no perfil detecta ban em tempo real (INC-009 resolvido).
- [x] `signOut` deleta cookies `session` e `active_session_id`.

---

## FUNCIONALIDADE 9: Webhook Asaas (Revisado CRITICO v3.1)

**Scope:** `src/app/api/webhooks/asaas/route.ts`
**Data do Ciclo:** 2026-04-29
**Versao:** 3.1.0

### 9.1 — Correcoes Aplicadas
- [x] **[CRITICO CORRIGIDO]** Webhook agora busca `vendas_logs` por `paymentId` (campo que antes nunca era salvo — bug silencioso total).
- [x] **[CORRIGIDO]** Suporte a compras multi-curso: processa todas as linhas do mesmo `paymentId`.
- [x] **[CORRIGIDO]** Idempotencia: usa `statusPagamento === 'pago'` (consistente com o resto do app, antes usava `status === 'PAID'`).
- [x] **[CORRIGIDO]** Confirma enrollment existente em vez de duplicar no `profiles.cursos_comprados` (legacy).
- [x] **[CORRIGIDO]** Fallback: cria enrollment se nao existir (edge case de race condition).
- [x] Token de seguranca `ASAAS_WEBHOOK_TOKEN` validado via header.

---

## FUNCIONALIDADE 10: Admin Actions (Revisado v3.1)

**Scope:** `src/app/actions/admin.ts`
**Data do Ciclo:** 2026-04-29
**Versao:** 3.1.0

### 10.1 — Correcoes Aplicadas
- [x] **[CORRIGIDO]** `handleTeacherApproval` era stub sem implementacao real (apenas console.logs). Agora atualiza `teacher_status` no Firestore e envia notificacao.
- [x] **[CORRIGIDO]** Removidos 8 `console.log` de notificacoes (approveCourse, approveLesson, rejectLesson, rejectCourse).
- [x] `promoteTeacherToAdmin` — unica funcao com guard de `role === 'admin'` no admin.ts (correto, outras sao protegidas pelo layout).

### 10.2 — Metricas de Alunos (getAllStudents)
- [x] `coursesCount` calculado via enrollments (fonte de verdade).
- [x] `certificatesCount` via `concluded_courses` no perfil.
- [x] `watchedTime` usa `totalStudyTime` do perfil com fallback para soma de `last_timestamp`.
- [ ] **TODO**: `watchedTime` via `last_timestamp` e uma aproximacao grosseira — implementar campo `total_study_seconds` acumulado nos enrollments para precisao real.

---

## FUNCIONALIDADE 11: Regras Firestore — Auditoria

**Scope:** `firestore.rules`
**Data do Ciclo:** 2026-04-23 / Revisao: 2026-04-29
**Versao:** 3.1.0

- [x] `profiles`: owner ou admin podem ler/escrever.
- [x] `courses`: leitura publica apenas `status == 'APROVADO'`.
- [x] `lessons`: acesso blindado — admin, professor-dono ou `hasPurchasedCourse()`.
- [x] `vendas_logs`: apenas admin pode ler/escrever.
- [x] `enrollments`: aluno le as proprias; criacao exige `user_id == auth.uid`.
- [x] `comments`: leitura e criacao exigem `hasPurchasedCourse()`.
- [ ] `getUserRole()` faz `get()` extra por chamada — pode impactar quota em alto volume.
- [ ] `consent_logs` sem regra Firestore explicita (adequado pelo Admin SDK).

---

## AUDITORIA DE QUALIDADE DE CODIGO — v3.1

**Data:** 2026-04-29
**Metodo:** Analise estatica + grep + revisao manual

### Erros TypeScript
- [x] **0 erros de compilacao** — confirmado via `tsc --noEmit`.

### Console.logs Removidos neste Ciclo
| Arquivo | Quantidade Removida | Descricao |
|---------|-------------------|-----------|
| `dashboard-student/actions.ts` | 1 | `DEBUG_PAYMENT_VALUE` |
| `admin.ts` | 8 | Logs de criacao de notificacoes |
| `admin.ts` | 4 | Stub `handleTeacherApproval` |
| `marketing/actions.ts` | 2 | `Fetching featured courses` |
| `admin/legal/page.tsx` | 4 | Debug de settings |
| `quizzes/new/page.tsx` | 1 | `Salvando quiz` |
| **Total** | **20 logs** | **Todos removidos** |

### Console.logs Aceitaveis Remanescentes
- `console.error` em blocos catch — **correto, manter**.
- `console.warn` em casos de `teacher_id` ausente — **aceitavel**.
- Logs em webhooks do Mux — **aceitavel para rastreabilidade de infra**.

### UI/UX — rounded
- Paginas de marketing/professor usam `rounded-xl`, `rounded-2xl` etc.
- Paginas do app (classroom, admin, dashboard) usam `rounded-none` corretamente.
- **Status**: Marketing/publica usa bordas arredondadas por design intencional — nao e violacao do padrao Industrial PowerPlay que se aplica apenas ao app.

---

## LOGS DE INCIDENTES

### INC-001 — permission-denied no Firestore — RESOLVIDO
| Campo | Detalhe |
|-------|---------|
| Status | **Resolvido em 2026-04-23** |

### INC-003 — Notificacoes Teacher nao recarregam — ABERTO
| Campo | Detalhe |
|-------|---------|
| Data | 2026-04-23 |
| Severidade | Baixa |
| Status | **Aberto** |

### INC-004 — Matricula gravada antes do Asaas — RESOLVIDO
| Campo | Detalhe |
|-------|---------|
| Data | 2026-04-23 |
| Severidade | Media |
| Resolucao | `batch.commit()` movido para apos confirmacao do Asaas. Cursos gratuitos fazem commit direto. `paymentId` agora salvo em `vendas_logs`. |
| Status | **Resolvido em 2026-04-29** |

### INC-006 — Playwright incompativel com Vercel Serverless — ABERTO
| Campo | Detalhe |
|-------|---------|
| Data | 2026-04-28 |
| Severidade | Alta |
| Mitigacao | Substituir por `@sparticuz/chromium` + `puppeteer-core` para Vercel. |
| Status | **Aberto — Alta prioridade antes do deploy** |

### INC-009 — useAuthGuard nao implementado — RESOLVIDO
| Campo | Detalhe |
|-------|---------|
| Status | **Resolvido em 2026-04-28** |

### INC-011 — Webhook Asaas nunca confirmava matriculas pagas — RESOLVIDO
| Campo | Detalhe |
|-------|---------|
| Data | 2026-04-29 |
| Severidade | **CRITICA** |
| Componente | `api/webhooks/asaas/route.ts` + `dashboard-student/actions.ts` |
| Causa Raiz | O webhook buscava `paymentId` em `vendas_logs`, mas o campo nunca era salvo no checkout. Resultado: nenhum pagamento via PIX/Boleto confirmava a matricula automaticamente. |
| Resolucao | 1. Checkout agora salva `paymentId` (retorno do Asaas) em cada linha de `vendas_logs`. 2. Webhook reescrito para processar multi-curso, usar idempotencia correta e confirmar `enrollment`. 3. Fallback cria enrollment se nao existir. |
| Status | **Resolvido em 2026-04-29** |

### INC-012 — handleTeacherApproval era stub sem implementacao — RESOLVIDO
| Campo | Detalhe |
|-------|---------|
| Data | 2026-04-29 |
| Severidade | Alta |
| Componente | `src/app/actions/admin.ts` — `handleTeacherApproval` |
| Causa Raiz | Funcao continha apenas `console.log` de placeholder, sem nenhuma escrita no Firestore. Aprovacao/rejeicao de professores nao funcionava. |
| Resolucao | Implementado: atualiza `teacher_status` no Firestore + envia notificacao ao professor. |
| Status | **Resolvido em 2026-04-29** |

---

## PRIORIDADES DE ACAO — STATUS ATUALIZADO (2026-04-29)

### Critico (Bloqueia Deploy)
1. **INC-006** — Playwright incompativel com Vercel Serverless ⚠️ **ABERTO**

### Alta — RESOLVIDOS neste ciclo (v3.1)
2. ~~**INC-011** — Webhook Asaas nunca confirmava matriculas~~ ✅ **RESOLVIDO**
3. ~~**INC-012** — handleTeacherApproval era stub~~ ✅ **RESOLVIDO**
4. ~~**INC-004** — Ordem do batch no checkout~~ ✅ **RESOLVIDO**

### Media
5. **INC-003** — Notificacoes nao recarregam apos salvar ⚠️ **ABERTO**
6. **Quiz** — `handleSave` usa localStorage mock, sem Firestore ⚠️ **TODO**
7. **Payments** — Funcionalidade de salvar cartao e mock (TODO)

### Baixa
8. `watchedTime` usa `last_timestamp` como aproximacao — implementar acumulador real.
9. `getUserRole()` nas Firestore Rules faz get() extra por chamada.
10. Refatorar ocorrencias de `any` progressivamente.
11. Substituir `<style jsx global>` por alternativa compativel com App Router.

---

*Arquivo mantido separado da documentacao tecnica diaria (DOCUMENTACAO_TECNICA.md).*
*Versao 3.1.0 — Ciclo completo de auditoria em 2026-04-29 por IA/Antigravity.*
