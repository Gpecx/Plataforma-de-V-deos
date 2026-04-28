# QA_CHECKLISTS.md — PowerPlay Plataforma de Cursos

**Responsavel pelo Arquivo:** Fred (Lider de Projeto)
**Criado em:** 2026-04-02
**Ultimo Ciclo:** 2026-04-28 (Completo — Analista: IA/Antigravity)
**Versao:** 3.0.0
**Status:** Ativo

---

> Itens marcados com [x] foram CONFIRMADOS via code review estatico.
> Itens marcados [ ] dependem de validacao em ambiente ou estao pendentes.

---

## TABELA DE CONTROLE

| Data       | Funcionalidade                          | Status    | Versao | Responsavel    |
| ---------- | --------------------------------------- | --------- | ------ | -------------- |
| 2026-04-02 | Comentarios - Persistencia              | Passou    | 1.1.0  | Daniel / IA    |
| 2026-04-02 | Comentarios - Autoria Dinamica          | Passou    | 1.1.0  | Daniel / IA    |
| 2026-04-02 | Progresso de Aula - Persistencia        | Passou*   | 1.1.0  | Daniel / IA    |
| 2026-04-02 | Progresso de Aula - Seguranca           | Passou    | 2.0.0  | IA/Antigravity |
| 2026-04-23 | Settings Teacher - Notificacoes         | Passou*   | 2.0.0  | IA/Antigravity |
| 2026-04-23 | Settings Teacher - CEP/Endereco         | Passou    | 2.0.0  | IA/Antigravity |
| 2026-04-23 | Settings Teacher - Senha Segura         | Passou    | 2.0.0  | IA/Antigravity |
| 2026-04-23 | Settings Teacher - 2FA/TOTP             | Passou    | 2.0.0  | IA/Antigravity |
| 2026-04-23 | Cursos Teacher - Criacao                | Passou    | 2.0.0  | IA/Antigravity |
| 2026-04-23 | Cursos Teacher - Exclusao Segura        | Passou    | 2.0.0  | IA/Antigravity |
| 2026-04-23 | Checkout PIX - Fluxo Completo           | Passou*   | 2.0.0  | IA/Antigravity |
| 2026-04-23 | Checkout - Validacao de Preco Zero      | Passou    | 2.0.0  | IA/Antigravity |
| 2026-04-23 | Checkout - Consentimento LGPD           | Passou    | 2.0.0  | IA/Antigravity |
| 2026-04-23 | Firestore Rules - Colecoes Criticas     | Passou    | 2.0.0  | IA/Antigravity |
| 2026-04-23 | Upload de Video - Mux Integration       | Passou*   | 2.0.0  | IA/Antigravity |
| 2026-04-23 | Autenticacao - Session Cookie           | Passou    | 2.0.0  | IA/Antigravity |
| 2026-04-28 | Certificados - Emissao Dinamica         | Passou*   | 3.0.0  | IA/Antigravity |
| 2026-04-28 | Certificados - Download PDF (html2canvas) | Passou* | 3.0.0  | IA/Antigravity |
| 2026-04-28 | Certificados - Render Headless Playwright | Falha*  | 3.0.0  | IA/Antigravity |
| 2026-04-28 | Conclusao de Curso - Engine + teacherName | Passou  | 3.0.0  | IA/Antigravity |
| 2026-04-28 | Legal Docs - Admin Management           | Passou    | 3.0.0  | IA/Antigravity |
| 2026-04-28 | Legal Docs - getLegalDocsSettings merge | Passou    | 3.0.0  | IA/Antigravity |
| 2026-04-28 | Ban Hook - useAuthGuard (INC-009)       | CORRIGIDO | 3.0.0  | IA/Antigravity |
| 2026-04-28 | Payments Page - Cartao Salvo            | Mock/TODO | 3.0.0  | IA/Antigravity |
| 2026-04-28 | Subscriptions - Link Refund Policy      | CORRIGIDO | 3.0.0  | IA/Antigravity |
| 2026-04-28 | Classroom Access - Debug Logs           | CORRIGIDO | 3.0.0  | IA/Antigravity |
| 2026-04-28 | TypeScript - Erros de Compilacao        | 0 erros   | 3.0.0  | IA/Antigravity |
| 2026-04-28 | Login - Mensagem de conta suspensa      | Passou    | 3.0.0  | IA/Antigravity |

> *Passou na logica de codigo. Requer validacao final em ambiente de producao.

---

## FUNCIONALIDADE 1: Secao de Comentarios (Revisado)

**Scope:** `src/app/(app)/classroom/[id]/ClassroomTabs.tsx`
**Data do Ciclo:** 2026-04-02 / Revisao: 2026-04-28
**Versao:** 3.0.0

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
**Data do Ciclo:** 2026-04-02 / Revisao: 2026-04-28
**Versao:** 3.0.0

### 2.1 — Happy Path
- [x] Progresso salvo em `enrollments` via `adminDb` com `set({ merge: true })`.
- [x] `toggleLessonCompletion` e `saveLessonProgress` separados corretamente.
- [x] Conclusao de 100% dispara `processCourseCompletion` automaticamente.
- [x] Guard `alreadyConcluded` impede duplicar certificado.

### 2.2 — Seguranca
- [x] Todas as actions usam `adminDb` (Admin SDK) — bypass de rules correto.
- [x] `userId` e `courseId` sao parametros de server action, nao do cliente diretamente.

### 2.3 — Bugs Conhecidos
- [ ] **INC-005**: `console.log` de debug deixado em `getClassroomData` (linhas 195 e 205 de `actions.ts`). Expoe dados de acesso em producao. Ver secao de Incidentes.
- [ ] `processCourseCompletion` nao salva `teacherName` no objeto `newConcluded`, resultando em `teacherName` ausente na pagina de certificados (usa fallback `"Professor(a) Responsavel"`).

---

## FUNCIONALIDADE 3: Teacher Settings

**Scope:** `src/app/(app)/dashboard-teacher/settings/page.tsx`
**Data do Ciclo:** 2026-04-23 / Revisao: 2026-04-28
**Versao:** 3.0.0

### 3.1 — Happy Path
- [x] Dados de PIX, CEP e notificacoes salvos em submit unico.
- [x] CEP dispara ViaCEP no `onBlur`, preenche campos automaticamente.
- [x] Reautenticacao antes de `updatePassword` — sem logout punitivo.
- [x] Sincronizacao do token apos troca de senha via `/api/auth/session`.

### 3.2 — Bugs Conhecidos
- [ ] **INC-003 (ABERTO)**: Toggles de notificacao nao recarregam do Firestore apos salvar (falta `setEmailEnabled`/`setBrowserEnabled` no bloco `if (result.success && result.data)`).
- [ ] Timeout de expiracao do segredo TOTP nao exibido na UI.

---

## FUNCIONALIDADE 4: Gerenciamento de Cursos (Teacher)

**Scope:** `src/app/(app)/dashboard-teacher/courses/actions.ts`
**Data do Ciclo:** 2026-04-23 / Revisao: 2026-04-28
**Versao:** 3.0.0

### 4.1 — Happy Path
- [x] `teacher_id` fixado como `user.uid` no server.
- [x] Status inicial sempre `PENDENTE`.
- [x] Cursos `APROVADO` marcados `SOLICITADO_EXCLUSAO` ao inves de deletados.
- [x] Guard anti-downgrade: cursos `free` nao podem ser alterados para pagos.
- [x] Assets do Mux deletados antes da remocao do Firestore.

### 4.2 — Edge Cases
- [ ] Nao ha validacao de tamanho maximo de curriculo no servidor.
- [ ] Falha no Mux nao impede exclusao do Firestore (erro logado, nao bloqueia).

---

## FUNCIONALIDADE 5: Checkout e Pagamento PIX

**Scope:** `src/app/(app)/dashboard-student/actions.ts`
**Data do Ciclo:** 2026-04-23 / Revisao: 2026-04-28
**Versao:** 3.0.0

### 5.1 — Happy Path
- [x] Precos buscados do Firestore no servidor (nao confiam no cliente).
- [x] `totalAmount` calculado server-side.
- [x] Guard Anti-Zero ativo: bloqueia checkout se cursos existem mas total=0.
- [x] Consentimento LGPD obrigatorio antes do checkout.
- [x] `consent_logs` gravado com IP, versao e dados do pedido.

### 5.2 — Bugs Conhecidos
- [ ] **INC-004 (ABERTO - Media)**: `batch.commit()` executado ANTES do Asaas. Aluno pode ficar matriculado sem pagar se Asaas falhar.
- [x] `DEBUG_PAYMENT_VALUE` console.log em `processCheckoutAction` (linha 123) ainda presente — **remover antes do deploy definitivo**.

---

## FUNCIONALIDADE 6: Certificados

**Scope:** `src/app/(app)/dashboard-student/certificates/page.tsx` + `src/app/(app)/classroom/[id]/actions.ts` + `src/lib/pdf-generator.ts`
**Data do Ciclo:** 2026-04-28
**Versao:** 3.0.0

### 6.1 — Happy Path
- [x] Certificados carregados de `concluded_courses` no perfil do aluno via `getProfile`.
- [x] Guard `alreadyConcluded` impede emissao duplicada.
- [x] `credentialId` gerado com formato `PP-2026-XXXXXX`.
- [x] Download PDF via `html2canvas` + `jsPDF` funcional no modal.
- [x] Correcao de cores `lab()`/`oklch()` no `onclone` do html2canvas implementada.

### 6.2 — Edge Cases
- [x] Download direto do card abre modal primeiro, depois trigga download (workaround funcional).
- [x] Tecla `Escape` fecha modal de preview.
- [ ] **INC-006 (ABERTO)**: Rota headless `/api/certificates/[id]/download` usa Playwright. Em ambiente serverless (Vercel), `chromium.launch()` pode falhar pois Playwright nao esta incluido no bundle de producao. Requer `@playwright/test` ou alternativa como `@sparticuz/chromium` para producao.
- [ ] `teacherName` no certificado usa fallback `"Professor(a) Responsavel"` — campo nao salvo em `processCourseCompletion`. Ver INC-007.
- [ ] `style jsx global` usado na pagina (linha 180) — necessita configuracao do styled-jsx ou substituir por `<style>` padrao.
- [ ] Rota `/api/certificates/[id]/preview` nao auditada neste ciclo.

### 6.3 — Seguranca
- [x] Rota `/certificate-render/[id]` validada com `CERTIFICATE_RENDER_SECRET` do env.
- [x] Download via API valida sessao com `verifySessionCookie`.
- [x] `validateAndGetCertificate` garante que apenas o dono acessa seu certificado.

---

## FUNCIONALIDADE 7: Documentos Legais

**Scope:** `src/app/admin/legal/` + `src/app/(public)/privacidade/` + `src/app/(public)/termos/`
**Data do Ciclo:** 2026-04-28
**Versao:** 3.0.0

### 7.1 — Happy Path
- [x] `getLegalDocsSettings` busca de `settings/legal_docs` no Firestore.
- [x] Fallback com conteudo completo em `getLegalDocsDefaults` — paginas nunca ficam vazias.
- [x] `saveLegalDocsSettings` revalida todas as rotas afetadas (`/termos`, `/privacidade`, `/dashboard-student/refund-policy`).
- [x] Paginas publicas renderizam HTML via `dangerouslySetInnerHTML` com `prose-em:not-italic` para remover italicos.

### 7.2 — Bugs Conhecidos
- [ ] **INC-008 (ABERTO)**: `getLegalDocsSettings` retorna `doc.data() as LegalDocsSettings` sem validacao de tipos — se o Firestore retornar campos parciais, pode causar `undefined` nas paginas. Adicionar validacao de campos obrigatorios.

---

## FUNCIONALIDADE 8: Autenticacao e Sessao

**Scope:** `src/middleware.ts`, `src/context/AuthProvider.tsx`
**Data do Ciclo:** 2026-04-23 / Revisao: 2026-04-28
**Versao:** 3.0.0

### 8.1 — Middleware
- [x] Rotas protegidas: `/dashboard-student`, `/dashboard-teacher`, `/classroom`, `/cart`, `/admin`.
- [x] Cookie `mfa_pending=true` redireciona para login mesmo com sessao ativa.
- [x] Edge Runtime — apenas verifica existencia do cookie (nao verifica assinatura).

### 8.2 — AuthProvider
- [x] `onSnapshot` no perfil detecta mudancas em tempo real (role, status).
- [x] `isMfaPending` sincronizado entre `localStorage` e cookie.
- [ ] **INC-009 (ABERTO — Alta)**: `AuthProvider` nao implementa `useAuthGuard`. Conforme planejado, deveria monitorar campo `status === 'banido'` e triggerar `signOut`. Atualmente, um usuario banido so e bloqueado na proxima requisicao ao servidor, nao em tempo real. Implementacao planejada nao foi encontrada em `src/hooks/`.

### 8.3 — Sign Out / Delete Account
- [x] `signOut` deleta cookies `session` e `active_session_id`.
- [x] `deleteAccount` deleta usuario no Auth + perfil no Firestore + limpa cookies.

---

## FUNCIONALIDADE 9: Pagamentos e Financeiro (Student Dashboard)

**Scope:** `src/app/(app)/dashboard-student/payments/page.tsx`
**Data do Ciclo:** 2026-04-28
**Versao:** 3.0.0

### 9.1 — Happy Path
- [x] Historico de transacoes carregado via `getStudentTransactions`.
- [x] Exportacao PDF funcional com `jsPDF` dinamico (import lazy).
- [x] Tabela renderiza PIX, Cartao e Boleto com icones corretos.
- [x] Status `pendente` exibido em amber, `pago` em verde.

### 9.2 — Bugs / TODOs
- [ ] **TODO**: `hasSavedCard = false` hardcoded (linha 15). Funcionalidade de salvar cartao e um mock — form nao conectado a nenhuma API real.
- [ ] Botao "Acao" (ArrowUpRight) na tabela nao tem funcao implementada.

---

## FUNCIONALIDADE 10: Subscriptions (Student)

**Scope:** `src/app/(app)/dashboard-student/subscriptions/page.tsx`
**Data do Ciclo:** 2026-04-28
**Versao:** 3.0.0

### 10.1 — Bugs
- [ ] **BUG-TS-001 (CRITICO)**: Erro TypeScript em `subscriptions/page.tsx` linha 104. `Link href="/dashboard-student/refund-policy"` falha na verificacao de tipos do Next.js (`RouteImpl`). A rota `/dashboard-student/refund-policy` existe fisicamente, mas o type-checker rejeita. Causa: tipagem estrita do Next.js Link. Solucao: adicionar `as any` ou garantir que a rota esta no `tsconfig` paths.

---

## FUNCIONALIDADE 11: Regras Firestore — Auditoria

**Scope:** `firestore.rules`
**Data do Ciclo:** 2026-04-23 / Revisao: 2026-04-28
**Versao:** 3.0.0

- [x] `profiles`: owner ou admin podem ler/escrever.
- [x] `courses`: leitura publica apenas `status == 'APROVADO'`.
- [x] `lessons`: acesso blindado — admin, professor-dono ou `hasPurchasedCourse()`.
- [x] `vendas_logs`: apenas admin pode ler/escrever.
- [x] `enrollments`: aluno le as proprias; criacao exige `user_id == auth.uid`.
- [x] `comments`: leitura e criacao exigem `hasPurchasedCourse()`.
- [x] `userProgress`: whitelist de campos mutaveis.
- [ ] `getUserRole()` faz `get()` extra por chamada — pode impactar quota em alto volume.
- [ ] `consent_logs` sem regra Firestore explicita (adequado pelo Admin SDK, mas deve ser documentado).

---

## AUDITORIA DE QUALIDADE DE CODIGO

**Data:** 2026-04-28
**Metodo:** Analise estatica + grep

### Erros TypeScript
- [ ] **1 erro de compilacao**: `subscriptions/page.tsx:104` — `Link href` com tipo incompativel. Ver BUG-TS-001.

### Debug Logs em Producao (remover antes do deploy)
| Arquivo | Linha | Log |
|---------|-------|-----|
| `asaasService.ts` | 171 | `DEBUG_PAYMENT_VALUE` |
| `dashboard-student/actions.ts` | 123 | `DEBUG_PAYMENT_VALUE` |
| `classroom/[id]/actions.ts` | 195, 205 | `Classroom Access DEBUG` |
| `checkout/pagamento/page.tsx` | 85, 118, 128 | `DEBUG_HANDLE_PAYMENT`, `DEBUG_CHECKOUT_RESULT`, `DEBUG_REDIRECT` |
| `checkout/pagamento/sucesso/page.tsx` | 46, 56, 70 | `DEBUG_SUCCESS_*` |

### Uso Excessivo de `any` (242 ocorrencias)
- Refatoracao progressiva recomendada — especialmente em `actions.ts` e paginas de dashboard.

### JSX Global Style (nao suportado nativamente em Next.js App Router)
- `certificates/page.tsx:180` e `admin/classroom/[id]/page.tsx:169` usam `<style jsx global>` que requer `styled-jsx`. Substituir por `<style>{...}</style>` ou mover para CSS global.

---

## LOGS DE INCIDENTES

### INC-001 — permission-denied no Firestore (userProgress) — RESOLVIDO
| Campo | Detalhe |
|-------|---------|
| Data | 2026-04-02 |
| Status | **Resolvido em 2026-04-23** |

---

### INC-002 — Comentarios com autoria hardcoded — RESOLVIDO
| Campo | Detalhe |
|-------|---------|
| Data | 2026-04-02 |
| Status | **Resolvido** |

---

### INC-003 — Notificacoes Teacher nao recarregam apos salvar — ABERTO
| Campo | Detalhe |
|-------|---------|
| Data | 2026-04-23 |
| Severidade | Baixa |
| Componente | `dashboard-teacher/settings/page.tsx` |
| Causa Raiz | `useEffect` de carga nao inclui `setEmailEnabled`/`setBrowserEnabled`. |
| Mitigacao | Adicionar as duas chamadas dentro do bloco `if (result.success && result.data)`. |
| Status | **Aberto** |

---

### INC-004 — Matricula gravada antes da confirmacao do Asaas — ABERTO
| Campo | Detalhe |
|-------|---------|
| Data | 2026-04-23 |
| Severidade | Media |
| Componente | `dashboard-student/actions.ts` — `processCheckoutAction` |
| Causa Raiz | `batch.commit()` antes de `createPayment()`. Sem rollback. |
| Mitigacao | Mover `batch.commit()` para apos retorno bem-sucedido do Asaas, ou usar `statusPagamento: 'pendente'` + webhook. |
| Status | **Aberto** |

---

### INC-005 — Debug logs em getClassroomData — RESOLVIDO
| Campo | Detalhe |
|-------|---------|
| Data | 2026-04-28 |
| Severidade | Media |
| Componente | `classroom/[id]/actions.ts` |
| Resolucao | Removidos os dois `console.log` que exibiam `userId`, `courseId` e `purchasedFromProfile`. |
| Status | **Resolvido em 2026-04-28** |

---

### INC-006 — Playwright nao compativel com Vercel Serverless — ABERTO
| Campo | Detalhe |
|-------|---------|
| Data | 2026-04-28 |
| Severidade | Alta |
| Componente | `src/lib/pdf-generator.ts` + `api/certificates/[id]/download/route.tsx` |
| Causa Raiz | `chromium.launch()` do Playwright requer binarios que nao sao incluidos no bundle serverless da Vercel. A funcionalidade funciona apenas em ambiente local/self-hosted. |
| Mitigacao | Substituir por `@sparticuz/chromium` + `puppeteer-core` para Vercel, OU manter Playwright apenas para geracao local e usar `html2canvas`/`jsPDF` como metodo primario de producao. |
| Status | **Aberto — Alta prioridade antes do deploy** |

---

### INC-007 — teacherName ausente nos certificados — RESOLVIDO
| Campo | Detalhe |
|-------|---------|
| Data | 2026-04-28 |
| Severidade | Baixa |
| Componente | `classroom/[id]/actions.ts` — `processCourseCompletion` |
| Resolucao | Implementada busca ao perfil do professor via `teacher_id` do curso. `teacherName` agora salvo em `concluded_courses`. |
| Status | **Resolvido em 2026-04-28** |

---

### INC-008 — getLegalDocsSettings sem validacao de campos — RESOLVIDO
| Campo | Detalhe |
|-------|---------|
| Data | 2026-04-28 |
| Severidade | Baixa |
| Componente | `admin/legal/actions.ts` — `getLegalDocsSettings` |
| Resolucao | Implementado merge `{ ...defaults, ...doc.data() }`. Retorno agora tipado como `Promise<LegalDocsSettings>`. Campos nunca seram `undefined`. |
| Status | **Resolvido em 2026-04-28** |

---

### INC-009 — useAuthGuard nao implementado — RESOLVIDO
| Campo | Detalhe |
|-------|---------|
| Data | 2026-04-28 |
| Severidade | Alta |
| Componente | `src/context/AuthProvider.tsx` |
| Resolucao | Implementada deteccao de ban em tempo real no callback `onSnapshot`. Quando `data.status === 'banido'`: executa `signOut(auth)`, limpa cookies via `/api/auth/signout`, redireciona para `/login?error=account_suspended`. Pagina de login exibe toast de 8s explicando a suspensao. |
| Status | **Resolvido em 2026-04-28** |

---

### INC-010 — BUG-TS-001: Link TypeScript Error em subscriptions — ABERTO
| Campo | Detalhe |
|-------|---------|
| Data | 2026-04-28 |
| Severidade | Media (falha silenciosa em dev, pode causar erro em build) |
| Componente | `dashboard-student/subscriptions/page.tsx:104` |
| Erro | `Type '"/dashboard-student/refund-policy"' is not assignable to type 'UrlObject | RouteImpl<...>'` |
| Causa Raiz | Next.js tipagem estrita do `<Link>` nao reconhece a rota. |
| Mitigacao | Verificar se a rota esta exportando um `default` correto; usar `href={"/dashboard-student/refund-policy" as any}` como fix temporario, ou garantir que o arquivo `page.tsx` na rota existe e e valido. |
| Status | **Aberto** |

---

## INSTRUCOES DE USO

1. Ao iniciar um ciclo de testes, copie o template da funcionalidade correspondente.
2. Marque cada item com `[x]` ao concluir e anotar o resultado.
3. Se um teste falhar, abra um novo incidente na secao "Logs de Incidentes".
4. Atualize a Tabela de Controle no topo com o resultado final do ciclo.
5. Commite com a mensagem: `test: qa cycle [FUNCIONALIDADE] [DATA]`.

---

## PRIORIDADES DE ACAO — STATUS ATUALIZADO (2026-04-28)

### Critico (Bloqueia Deploy)
1. **INC-006** — Playwright incompativel com Vercel Serverless ⚠️ **ABERTO**

### Alta — RESOLVIDOS neste ciclo
2. ~~**INC-009** — useAuthGuard ausente~~ ✅ **RESOLVIDO**
3. ~~**INC-005** — Debug logs em producao~~ ✅ **RESOLVIDO**
4. ~~**BUG-TS-001** — TypeScript 0 erros~~ ✅ **RESOLVIDO**

### Media
5. **INC-004** — Ordem do batch no checkout (risco financeiro) ⚠️ **ABERTO**
6. ~~**INC-007** — teacherName ausente nos certificados~~ ✅ **RESOLVIDO**
7. ~~**INC-008** — getLegalDocsSettings sem merge~~ ✅ **RESOLVIDO**
8. Remover `DEBUG_*` logs restantes (checkout/asaasService) antes do deploy

### Baixa
9. **INC-003** — Notificacoes nao recarregam apos salvar ⚠️ **ABERTO**
10. **Payments** — Funcionalidade de salvar cartao e mock (TODO)
11. Refatorar 242 ocorrencias de `any` progressivamente
12. Substituir `<style jsx global>` por alternativa compativel com App Router

---

*Arquivo mantido separado da documentacao tecnica diaria (DOCUMENTACAO_TECNICA.md).*
*Versao 3.0.0 — Ciclo completo de auditoria em 2026-04-28 por IA/Antigravity.*
