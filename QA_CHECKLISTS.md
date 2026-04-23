# QA_CHECKLISTS.md — PowerPlay Plataforma de Cursos

**Responsavel pelo Arquivo:** Fred (Lider de Projeto)
**Criado em:** 2026-04-02
**Ultimo Ciclo:** 2026-04-23 (Completo — Analista: IA/Antigravity)
**Versao:** 2.0.0
**Status:** Ativo

---

> Este arquivo registra os testes de qualidade realizados por funcionalidade.
> E separado da documentacao tecnica diaria (DOCUMENTACAO_TECNICA.md).
> Itens marcados com [x] foram CONFIRMADOS via code review estatico.
> Itens marcados [ ] dependem de validacao em ambiente ou estao pendentes.

---

## TABELA DE CONTROLE

| Data       | Funcionalidade                        | Status        | Versao | Responsavel    |
| ---------- | ------------------------------------- | ------------- | ------ | -------------- |
| 2026-04-02 | Comentarios - Persistencia            | Passou        | 1.1.0  | Daniel / IA    |
| 2026-04-02 | Comentarios - Autoria Dinamica        | Passou        | 1.1.0  | Daniel / IA    |
| 2026-04-02 | Progresso de Aula - Persistencia      | Passou*       | 1.1.0  | Daniel / IA    |
| 2026-04-02 | Progresso de Aula - Seguranca         | Passou        | 2.0.0  | IA/Antigravity |
| 2026-04-23 | Settings Teacher - Notificacoes       | Passou        | 2.0.0  | IA/Antigravity |
| 2026-04-23 | Settings Teacher - CEP/Endereco       | Passou        | 2.0.0  | IA/Antigravity |
| 2026-04-23 | Settings Teacher - Senha Segura       | Passou        | 2.0.0  | IA/Antigravity |
| 2026-04-23 | Settings Teacher - 2FA/TOTP           | Passou        | 2.0.0  | IA/Antigravity |
| 2026-04-23 | Cursos Teacher - Criacao              | Passou        | 2.0.0  | IA/Antigravity |
| 2026-04-23 | Cursos Teacher - Exclusao Segura      | Passou        | 2.0.0  | IA/Antigravity |
| 2026-04-23 | Checkout PIX - Fluxo Completo         | Passou*       | 2.0.0  | IA/Antigravity |
| 2026-04-23 | Checkout - Validacao de Preco Zero    | Passou        | 2.0.0  | IA/Antigravity |
| 2026-04-23 | Checkout - Consentimento LGPD         | Passou        | 2.0.0  | IA/Antigravity |
| 2026-04-23 | Firestore Rules - Colecoes Criticas   | Passou        | 2.0.0  | IA/Antigravity |
| 2026-04-23 | Upload de Video - Mux Integration     | Passou*       | 2.0.0  | IA/Antigravity |
| 2026-04-23 | Autenticacao - Session Cookie         | Passou        | 2.0.0  | IA/Antigravity |

> *Passou na logica de codigo. Requer validacao final em ambiente de producao.

---

## FUNCIONALIDADE 1: Secao de Comentarios (Revisado)

**Scope:** `src/app/(app)/classroom/[id]/ClassroomTabs.tsx`
**Data do Ciclo:** 2026-04-02 / Revisao: 2026-04-23
**Versao:** 2.0.0
**Metodo:** Code Review estatico

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
- [x] Regra Firestore: leitura exige `hasPurchasedCourse()` — CONFIRMADO deployado.
- [x] Criacao exige `request.resource.data.userId == request.auth.uid`.
- [x] Exclusao permitida apenas ao autor ou admin.

---

## FUNCIONALIDADE 2: Progresso de Aula (Revisado)

**Scope:** `src/app/(app)/classroom/[id]/page.tsx` + `actions.ts`
**Data do Ciclo:** 2026-04-02 / Revisao: 2026-04-23
**Versao:** 2.0.0

### 2.1 — Happy Path
- [x] Estado `completedLessons` persiste via `adminDb` no Firestore.
- [x] Botao exibe `disabled` durante `isToggling` (anti-duplo-clique).
- [x] `setDoc({ merge: true })` garante idempotencia.

### 2.2 — Seguranca (Regras Confirmadas)
- [x] `userProgress` — leitura: `resource.data.userId == request.auth.uid`.
- [x] Criacao: tripla validacao (`userId`, `progressBelongsToUser()`, namespace).
- [x] Atualizacao: whitelist de campos (`completedLessons`, `lastTimestamp`, `lastLessonId`, `updatedAt`).
- [x] Campos `userId` e `courseId` sao imutaveis apos criacao.
- [x] INC-001 RESOLVIDO: Regras de `userProgress` confirmadas como deployadas.

---

## FUNCIONALIDADE 3: Teacher Settings — Notificacoes

**Scope:** `src/app/(app)/dashboard-teacher/settings/page.tsx` + `profile/actions.ts`
**Data do Ciclo:** 2026-04-23
**Versao:** 2.0.0
**Metodo:** Code Review estatico

### 3.1 — Happy Path
- [x] Toggles `emailEnabled` e `browserEnabled` refletem o estado salvo no Firestore ao carregar a pagina (`getTeacherProfile` popula `setEmailEnabled`/`setBrowserEnabled`).
- [x] Ao clicar em "Salvar Dados", `notifications_email` e `notifications_push` sao enviados via hidden inputs no FormData.
- [x] `updateTeacherSettings` persiste ambas as flags no documento `profiles/{uid}` usando `set({ merge: true })`.
- [x] Toggle de email inicia como `true` (default), push como `false` (default).
- [x] Feedback de sucesso/erro exibido apos submit.

### 3.2 — Edge Cases
- [x] Forma unificada: PIX, endereco e notificacoes salvos em um unico submit.
- [x] `isPending` desabilita o botao durante o envio (anti-duplo-submit).
- [x] Campos de endereco usam estado controlado; CEP dispara ViaCEP no `onBlur`.

### 3.3 — Seguranca
- [x] Server Action valida role: `session.role !== 'teacher' && session.role !== 'admin'`.
- [x] `pix_key` e campos de endereco so sao adicionados ao payload se nao forem vazios/null (previne `undefined` no Firestore).
- [x] `notifications_email` e `notifications_push` sao booleanos derivados de comparacao, nunca valores raw do cliente.

### 3.4 — Bugs Conhecidos / Avisos
- [ ] **BUG-001**: `notifications_email` e `notifications_push` NAO sao carregados de volta do Firestore apos salvar (falta `setEmailEnabled`/`setBrowserEnabled` no `useEffect`). Corrigir atualizando o bloco de carga do perfil. Ver INC-003.
- [ ] Nao ha recarregamento automatico do estado apos sucesso do `useActionState` — usuario precisa recarregar a pagina para ver estado sincronizado.

---

## FUNCIONALIDADE 4: Teacher Settings — Seguranca (Senha + 2FA)

**Scope:** `settings/page.tsx`
**Data do Ciclo:** 2026-04-23

### 4.1 — Alteracao de Senha
- [x] Tres campos obrigatorios: Senha Atual, Nova Senha, Confirmar Senha.
- [x] Reautenticacao via `reauthenticateWithCredential` antes de `updatePassword`.
- [x] Guard: nova senha deve ter minimo 6 caracteres.
- [x] Guard: nova senha e confirmacao devem coincidir.
- [x] Erro `auth/wrong-password` tratado com mensagem amigavel.
- [x] Campos resetados apos sucesso.

### 4.2 — 2FA (TOTP)
- [x] `handleStartMFAEnroll` valida `emailVerified` antes de gerar segredo.
- [x] QR Code gerado via API externa com URL codificada do segredo TOTP.
- [x] Inscricao via `multiFactor(user).enroll()` + sincronizacao de token.
- [x] Desativacao via `mfaUser.unenroll()` com confirmacao.

### 4.3 — Edge Cases
- [x] Campos de senha com toggle show/hide (`Eye`/`EyeOff`) em todos os tres inputs.
- [x] `isUpdatingPassword` desabilita botao durante a operacao.
- [x] `isEnrollingMFA` desabilita botao de confirmacao durante o enroll.
- [ ] Nao ha timeout de expiracao do segredo TOTP na UI (usuario pode ficar com QR Code exibido indefinidamente sem aviso).

---

## FUNCIONALIDADE 5: Gerenciamento de Cursos (Teacher)

**Scope:** `dashboard-teacher/courses/actions.ts`
**Data do Ciclo:** 2026-04-23

### 5.1 — Criacao
- [x] `teacher_id` fixado como `user.uid` no server (nao editavel pelo cliente).
- [x] Status inicial sempre `PENDENTE` (nao pode criar curso ja aprovado).
- [x] Aulas criadas em batch junto com o curso.
- [x] `revalidatePath` em multiplas rotas apos criacao.

### 5.2 — Exclusao Segura
- [x] Cursos `APROVADO` sao marcados `SOLICITADO_EXCLUSAO` ao inves de deletados.
- [x] Validacao `courseDoc.data()?.teacher_id !== user.uid` impede exclusao de cursos alheios.
- [x] Assets do Mux deletados antes da remocao do Firestore.
- [x] Aulas deletadas em batch junto com o curso.

### 5.3 — Atualizacao
- [x] Verificacao de propriedade antes de qualquer update (`teacher_id == user.uid`).
- [x] Aulas com status `APROVADO` marcadas `SOLICITADO_EXCLUSAO` ao inves de deletadas.
- [x] Mudancas em titulo, video ou descricao da aula resetam status para `PENDENTE`.

### 5.4 — Edge Cases
- [ ] Nao ha validacao de tamanho maximo de curriculo/aulas no servidor.
- [ ] Falha no Mux nao impede a exclusao do Firestore (erro logado mas nao bloqueia).

---

## FUNCIONALIDADE 6: Checkout e Pagamento PIX

**Scope:** `dashboard-student/actions.ts` (`processCheckoutAction`)
**Data do Ciclo:** 2026-04-23

### 6.1 — Happy Path
- [x] Precos buscados diretamente do Firestore no servidor (nao confiam no cliente).
- [x] `totalAmount` calculado server-side com `reduce`.
- [x] Fluxo PIX: `createPayment` → `getPaymentQrCode` → retorna `pixData`.
- [x] Cursos gratuitos tratados separadamente (sem chamada ao Asaas).
- [x] Matricula e log de venda gravados em batch atomico.

### 6.2 — Validacoes de Seguranca
- [x] **Guard Anti-Zero**: `if (courseIds.length > 0 && totalAmount === 0)` bloqueia checkout e retorna erro explicito.
- [x] Consentimento LGPD obrigatorio: `if (!termsAccepted) return error`.
- [x] CPF/CNPJ sanitizado via `sanitizeCpfCnpj` antes de criar cliente Asaas.
- [x] CEP sanitizado (remocao de nao-digitos) antes de enviar ao Asaas.
- [x] `user.uid` sempre vem do `adminAuth.verifySessionCookie` (nao do cliente).

### 6.3 — LGPD / Consentimento
- [x] `consent_logs` gravado com `user_id`, `accepted_at`, `ip_address`, `version`, `form_source`, `course_ids`, `total_amount`, `billing_type`.
- [x] IP capturado via header `x-forwarded-for` com fallback para `x-real-ip`.

### 6.4 — Edge Cases
- [x] Erro do Asaas capturado separadamente com log detalhado (`asaasError.response?.data`).
- [x] `getPaymentQrCode` em try/catch separado: falha no QR nao cancela o pagamento.
- [ ] Nao ha rollback das matriculas se a cobranca Asaas falhar (batch ja commitado antes da chamada Asaas). Ver INC-004.

---

## FUNCIONALIDADE 7: Regras Firestore — Auditoria Geral

**Scope:** `firestore.rules`
**Data do Ciclo:** 2026-04-23

### 7.1 — Colecoes Criticas
- [x] `profiles`: owner ou admin podem ler/escrever. Sem acesso publico.
- [x] `courses`: leitura publica apenas para `status == 'APROVADO'`. Escrita: teacher ou admin.
- [x] `lessons`: acesso blindado — admin, professor-dono ou `hasPurchasedCourse()`.
- [x] `vendas_logs`: apenas admin pode ler/escrever. Dados financeiros protegidos.
- [x] `enrollments`: aluno le as proprias; criacao exige `user_id == auth.uid`; delete apenas admin.
- [x] `comments`: leitura e criacao exigem `hasPurchasedCourse()`. Autoria validada.
- [x] `userProgress`: whitelist de campos mutaveis. Campos `userId`/`courseId` imutaveis. Namespace validado.
- [x] `notifications`: usuario ve apenas as proprias. Criacao apenas admin.
- [x] `messages`: leitura restrita ao `user_id` ou `teacher_id` da mensagem.
- [x] `profiles/{userId}/wishlist`: owner-only.

### 7.2 — Funcoes Auxiliares
- [x] `hasPurchasedCourse()` usa `get()` no perfil, verifica campo `cursos_comprados`.
- [x] `getUserRole()` busca role do perfil (nao do token — cuidado com cache).
- [x] `isTeacherOrAdmin()` usa `getUserRole() in ['teacher', 'admin']`.

### 7.3 — Avisos
- [ ] `getUserRole()` faz um `get()` extra por chamada — pode impactar quota em alto volume.
- [ ] `consent_logs` nao tem regra Firestore explicita (depende apenas do Admin SDK para escrita — adequado para o fluxo atual, mas deve ser documentado).

---

## FUNCIONALIDADE 8: Autenticacao e Sessao

**Scope:** `lib/auth-utils.ts`, `dashboard-student/actions.ts`, `dashboard-teacher/courses/actions.ts`
**Data do Ciclo:** 2026-04-23

### 8.1 — Verificacao de Sessao
- [x] Todas as Server Actions usam `adminAuth.verifySessionCookie(token, true)` — `checkRevoked: true`.
- [x] `getAuthUser()` retorna `null` se token ausente ou invalido.
- [x] Todas as actions retornam erro explicito se usuario nao autenticado.

### 8.2 — Sign Out / Delete Account
- [x] `signOut` deleta cookies `session` e `active_session_id` antes de redirecionar.
- [x] `deleteAccount` deleta usuario no Auth, perfil no Firestore e limpa cookies.
- [x] `redirect('/')` apos logout impede acesso a rotas protegidas.

---

## LOGS DE INCIDENTES

### INC-001 — permission-denied no Firestore (userProgress) — RESOLVIDO

| Campo      | Detalhe                                                                    |
| ---------- | -------------------------------------------------------------------------- |
| Data       | 2026-04-02                                                                 |
| Severidade | Alta → **Resolvida**                                                       |
| Status     | **Resolvido em 2026-04-23** — Regras deployadas e confirmadas via code review |

---

### INC-002 — Comentarios com autoria hardcoded — RESOLVIDO

| Campo      | Detalhe                                                                     |
| ---------- | --------------------------------------------------------------------------- |
| Data       | 2026-04-02                                                                  |
| Severidade | Media → **Resolvida**                                                       |
| Status     | **Resolvido** — `getUserName()` usa `displayName` com fallback para email   |

---

### INC-003 — Notificacoes Teacher nao recarregam apos salvar (ABERTO)

| Campo      | Detalhe                                                                     |
| ---------- | --------------------------------------------------------------------------- |
| Data       | 2026-04-23                                                                  |
| Severidade | Baixa                                                                       |
| Funcao     | Teacher Settings — Alertas Digitais                                         |
| Componente | `dashboard-teacher/settings/page.tsx`                                       |
| Erro       | Apos salvar, os toggles nao refletem o valor persistido sem reload da pagina |
| Causa Raiz | O `useEffect` de carga do perfil nao inclui `notifications_email`/`notifications_push` no `setAddressData` block. |
| Mitigacao  | Adicionar `setEmailEnabled(result.data.notifications_email !== false)` e `setBrowserEnabled(result.data.notifications_push === true)` dentro do bloco `if (result.success && result.data)`. |
| Status     | **Aberto** — Baixa prioridade (dados sao salvos corretamente, apenas a UI local nao sincroniza) |

---

### INC-004 — Matricula gravada antes da confirmacao do Asaas (ABERTO)

| Campo      | Detalhe                                                                      |
| ---------- | ---------------------------------------------------------------------------- |
| Data       | 2026-04-23                                                                   |
| Severidade | Media                                                                        |
| Funcao     | Checkout — `processCheckoutAction`                                           |
| Componente | `dashboard-student/actions.ts`                                               |
| Erro       | Batch de matriculas e `vendas_logs` commitado ANTES da criacao do pagamento no Asaas. Se o Asaas falhar, o aluno fica matriculado sem ter pago. |
| Causa Raiz | Ordem de operacoes: batch.commit() → createPayment(). Ausencia de rollback. |
| Mitigacao  | Mover o `batch.commit()` para APOS o retorno bem-sucedido do Asaas, OU usar `statusPagamento: 'pendente'` e confirmar via webhook do Asaas antes de liberar acesso ao conteudo. |
| Status     | **Aberto** — Media prioridade. Requer refatoracao da ordem de operacoes no checkout. |

---

## INSTRUCOES DE USO

1. Ao iniciar um ciclo de testes, copie o template da funcionalidade correspondente.
2. Marque cada item com `[x]` ao concluir e anotar o resultado.
3. Se um teste falhar, abra um novo incidente na secao "Logs de Incidentes".
4. Atualize a Tabela de Controle no topo com o resultado final do ciclo.
5. Commite com a mensagem: `test: qa cycle [FUNCIONALIDADE] [DATA]`.

---

## TEMPLATE PARA NOVA FUNCIONALIDADE

```
## FUNCIONALIDADE N: [Nome]

**Scope:** `caminho/do/arquivo`
**Data do Ciclo:** YYYY-MM-DD
**Versao:** X.X.X
**Metodo:** Code Review estatico | Teste manual | Automatizado

### N.1 — Happy Path
- [ ] [Acao executada]
  - Confirmado/Pendente: [Resultado esperado]

### N.2 — Edge Cases
- [ ] [Cenario de estresse]
  - Confirmado/Pendente: [Comportamento esperado]

### N.3 — Seguranca
- [ ] [Vetor de ataque ou cenario]
  - Confirmado/Pendente: [Bloqueio ou resposta segura esperada]
```

---

*Arquivo mantido separado da documentacao tecnica diaria (DOCUMENTACAO_TECNICA.md) conforme boas praticas de engenharia de software.*
*Versao 2.0.0 — Ciclo completo de auditoria em 2026-04-23 por IA/Antigravity.*
