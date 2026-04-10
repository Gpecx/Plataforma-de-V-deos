# QA_CHECKLISTS.md — PowerPlay Plataforma de Cursos

**Responsavel pelo Arquivo:** Fred (Lider de Projeto)
**Criado em:** 2026-04-02
**Ciclo de Validacao:** 2026-04-02 (Completo — Analista: IA/Daniel)
**Versao:** 1.1.0
**Status:** Ativo

---

> Este arquivo registra os testes de qualidade realizados por funcionalidade.
> E separado da documentacao tecnica diaria (DOCUMENTACAO_TECNICA.md).
> Atualize a tabela de controle sempre que um ciclo de testes for executado.
> Itens marcados com [x] foram CONFIRMADOS via revisao de codigo (code review estatico).
> Itens marcados [ ] dependem de validacao em ambiente externo ou acoes pendentes.

---

## TABELA DE CONTROLE

| Data       | Funcionalidade                   | Status        | Versao | Responsavel |
| ---------- | -------------------------------- | ------------- | ------ | ----------- |
| 2026-04-02 | Comentarios - Persistencia        | Passou        | 1.1.0  | Daniel / IA |
| 2026-04-02 | Comentarios - Autoria Dinamica    | Passou        | 1.1.0  | Daniel / IA |
| 2026-04-02 | Progresso de Aula - Persistencia  | Passou*       | 1.1.0  | Daniel / IA |
| 2026-04-02 | Progresso de Aula - Seguranca     | Pendente      | 1.1.0  | Fred        |

> *Passou na logica de aplicacao. Regra de seguranca no Firestore aguarda deploy pelo Fred. Ver INC-001.

---

## FUNCIONALIDADE 1: Secao de Comentarios

**Scope:** `src/app/(app)/classroom/[id]/ClassroomTabs.tsx`
**Data do Ciclo:** 2026-04-02
**Versao:** 1.1.0
**Metodo de Validacao:** Code Review estatico (leitura direta do componente)

---

### 1.1 — Teste de Sucesso (Happy Path)

- [x] Abrir a sala de aula em uma aula com comentarios existentes.
  - Confirmado: `onSnapshot` ativo no `useEffect` (linha 88). Query filtra por `lessonId` e ordena por `createdAt` descendente.
- [x] Verificar se os comentarios carregam em tempo real via `onSnapshot`.
  - Confirmado: `setComments(loadedComments)` executado a cada evento do snapshot (linha 103).
- [x] Digitar um comentario no campo de texto e clicar em "Enviar".
  - Confirmado: `handleSendComment` chama `addDoc` com todos os campos obrigatorios (linha 131-139).
- [x] Verificar se o comentario aparece no topo da lista sem recarregar.
  - Confirmado: `orderBy('createdAt', 'desc')` garante ordem decrescente em tempo real.
- [x] Verificar se o nome e avatar do usuario logado aparecem corretamente.
  - Confirmado: `getUserName()` usa `user.displayName` com fallback para prefixo do email (linhas 111-115). `getUserAvatar()` usa `user.photoURL` (linha 117-119).
- [x] Dar F5 e verificar se comentarios persistem.
  - Confirmado: Dados vem do Firestore via `onSnapshot` a cada montagem do componente.

---

### 1.2 — Teste de Estresse (Edge Cases)

- [x] Clicar no botao "Enviar" multiplas vezes rapidamente.
  - Confirmado: Estado `isSending = true` (linha 129) activa `disabled={isSending || !user}` (linha 271). Boto desabilita ate o `finally` (linha 145) liberar.
- [x] Enviar comentario com texto extremamente longo (500+ caracteres).
  - Confirmado: Nao ha truncamento forcado no payload. Textarea com `resize-none` e `overflow` controlado pelo CSS. Sem crash esperado.
- [x] Enviar comentario com campo vazio.
  - Confirmado: Guard na linha 127: `if (!commentText.trim() || !user || !courseId || !lessonId) return`. Nenhuma chamada ao Firestore.
- [x] Testar sem conexao com a internet.
  - Confirmado: `onSnapshot` possui callback de erro (linhas 104-106) com `console.error`. Nenhum crash. Erro silencioso na UI.
- [x] Trocar de aula sem desmontar o componente.
  - Confirmado: `return () => unsubscribe()` (linha 108) chamado no cleanup do `useEffect`. Dependencia `[lessonId, user?.uid]` força re-subscribe ao trocar de aula.

---

### 1.3 — Teste de Seguranca

- [x] Deslogar e tentar acessar a rota da sala de aula diretamente.
  - Confirmado: `page.tsx` usa `onAuthStateChanged` (linha 46). Se `!user`, seta loading como false e bloqueia o carregamento dos dados sem redirecionar (fluxo de acesso negado retorna para `/course/${courseId}` via `router.push`).
- [x] Inspencionar payload do `addDoc` via DevTools.
  - Confirmado: `userId: user.uid` (linha 134) vem diretamente do objeto `user` do Firebase Auth. Nao e campo editavel pelo usuario via formulario.
- [ ] Verificar Regras do Firestore para a colecao `comments`. - Aguardando Rules
  - Pendente: Regra `allow write: if request.auth.uid == request.resource.data.userId` nao foi confirmada como deployada. Ver INC-001.

---

## FUNCIONALIDADE 2: Persistencia de Progresso de Aula

**Scope:** `src/app/(app)/classroom/[id]/page.tsx` + `actions.ts`
**Data do Ciclo:** 2026-04-02
**Versao:** 1.1.0
**Metodo de Validacao:** Code Review estatico

---

### 2.1 — Teste de Sucesso (Happy Path)

- [x] Abrir uma aula ainda nao concluida.
  - Confirmado: `completedLessons` carregado via `getClassroomData` (linha 74 de page.tsx). Se vazio, botao exibe "Marcar Concluida" no estado padrao (linha 348).
- [x] Clicar em "Marcar como Concluida".
  - Confirmado: `setIsToggling(true)` (linha 131 de page.tsx) ativa `disabled={isToggling}` no botao (linha 332). Exibe "Carregando..." (linha 340). `toggleLessonCompletion` chamada na `actions.ts`.
- [x] Dar F5 e verificar se o estado persiste.
  - Confirmado: `getClassroomData` (actions.ts linha 153) chama `getUserCourseProgress` via `adminDb`. Retorna `completedLessons` persistido no Firestore. `setCompletedLessons` populado na montagem (page.tsx linha 74).
- [x] Navegar para outra aula e voltar.
  - Confirmado: Estado `completedLessons` e um array global do componente pai. Cada `lesson.id` e verificado individualmente com `.includes(lesson.id)`. Isolamento garantido por ID.

---

### 2.2 — Teste de Estresse (Edge Cases)

- [x] Clicar no botao "Marcar como Concluida" multiplas vezes rapidamente.
  - Confirmado: `disabled={isToggling}` (linha 332) bloqueia cliques multiplos. `setDoc` com `{ merge: true }` (actions.ts linha 71-76) garante idempotencia mesmo se chamado duas vezes.
- [x] Testar sem internet ao clicar no botao.
  - Confirmado: `try/catch` no `toggleLessonStatus` (page.tsx linha 146). Erro capturado com `console.error`. `setIsToggling(false)` no `finally` (linha 149) restaura o botao.
- [x] Testar com `lessonId` invalido na URL.
  - Confirmado: Guard em ClassroomTabs linha 79: `if (!lessonId) return`. Guard em `handleSendComment` linha 127: `if (!lessonId) return`. Nenhum documento criado.
- [x] Texto longo em comentario aberto simultaneamente.
  - Confirmado: Estados `isToggling` e `isSending` sao independentes (variaveis diferentes em componentes diferentes). Nenhuma interferencia.

---

### 2.3 — Teste de Seguranca

- [x] Tentar disparar acao de progresso como usuario deslogado.
  - Confirmado: `toggleLessonStatus` tem guard `if (!currentUser) return` (page.tsx linha 127). `currentUser` e populado apenas via `onAuthStateChanged` autenticado.
- [x] Tentar salvar progresso com `userId` de outro usuario via manipulacao no cliente.
  - Confirmado: `currentUser.uid` passado diretamente da sessao Firebase Auth (linha 134). Nao existe campo editavel pelo cliente para substituir o `userId`.
- [ ] Verificar Regras do Firestore para `userProgress`. - Aguardando Rules
  - Pendente: Regra `allow write: if request.auth.uid == resource.data.userId` nao confirmada como deployada em producao. Ver INC-001.
- [ ] Verificar Regras de leitura para `userProgress`. - Aguardando Rules
  - Pendente: Regra `allow read: if request.auth.uid == resource.data.userId` nao confirmada como deployada. Ver INC-001.

---

## LOGS DE INCIDENTES

### INC-001 — permission-denied no Firestore (userProgress)

| Campo       | Detalhe                                                          |
| ----------- | ---------------------------------------------------------------- |
| Data        | 2026-04-02                                                       |
| Severidade  | Alta                                                             |
| Funcao      | Persistencia de Progresso de Aula                                |
| Colecao     | `userProgress`                                                   |
| Erro        | `FirebaseError: Missing or insufficient permissions.`            |
| Causa Raiz  | Regras de Seguranca do Firestore nao cobriam `userProgress`. Regras padrao bloquearam todas as escritas apos periodo de desenvolvimento. |
| Mitigacao   | Regra especifica documentada em `DOC_FIREBASE_RULES.md`. Aguarda deploy pelo responsavel (Fred). |
| Documentado | `DOC_FIREBASE_RULES.md`                                          |
| Status      | Aguardando Deploy (Fred)                                         |

---

### INC-002 — Comentarios com autoria hardcoded

| Campo       | Detalhe                                                          |
| ----------- | ---------------------------------------------------------------- |
| Data        | 2026-04-02                                                       |
| Severidade  | Media                                                            |
| Funcao      | Secao de Comentarios                                             |
| Componente  | `ClassroomTabs.tsx`                                              |
| Erro        | Nome do autor exibido como "DANIEL SIQUEIRA" para todos os usuarios. |
| Causa Raiz  | Mock data fixo durante desenvolvimento inicial da UI.            |
| Mitigacao   | Integrado `useAuth()` hook. `getUserName()` usa `displayName` com fallback para prefixo de email. Validado no codigo corrente (linha 111-115). |
| Status      | Resolvido — Validado via code review                             |

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
### [N.N] — Teste de Sucesso (Happy Path)
- [ ] [Acao executada]
  - Confirmado/Pendente: [Resultado esperado]

### [N.N] — Teste de Estresse (Edge Cases)
- [ ] [Cenario de estresse]
  - Confirmado/Pendente: [Comportamento esperado]

### [N.N] — Teste de Seguranca
- [ ] [Vetor de ataque ou cenario]
  - Confirmado/Pendente: [Bloqueio ou resposta segura esperada]
```

---

*Arquivo mantido separado da documentacao tecnica diaria (DOCUMENTACAO_TECNICA.md) conforme boas praticas de engenharia de software.*
