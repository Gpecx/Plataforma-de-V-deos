# Documentação de Incidentes e Solicitação de Permissões (Firestore)

> **Destinatário:** Fred (Líder Técnico) · **Desenvolvedor:** Daniel Siqueira

---

## 📋 Registro de Incidentes

| # | Data | Funcionalidade | Prioridade | Status |
|---|------|---------------|------------|--------|
| **INC-001** | 02/04/2026 | Persistência de Progresso (`userProgress`) | 🔴 Alta | ⏳ Aguardando aprovação |
| **INC-002** | 06/04/2026 | Perfis de Professores + Progresso do Aluno | 🔴 Alta | ⏳ Aguardando aprovação |

---

## 1. Descrição do Erro

Ao tentar persistir o estado de conclusão de uma aula — disparado tanto pelo clique no **botão manual "Marcar como Concluída"** quanto pelo **término automático do vídeo** — a Server Action retorna o seguinte erro de permissão no terminal do servidor:

```
POST /classroom/[courseId] 200

Erro ao salvar progresso: [Error [FirebaseError]: Missing or insufficient permissions.]
  code: 'permission-denied'
```

**O que isso significa para o usuário final:** o progresso do aluno **não é salvo**. Ao recarregar a página (`F5`), todas as aulas marcadas como concluídas voltam ao estado inicial, gerando uma experiência degradada e comprometendo as métricas de engajamento da plataforma.

---

## 2. Causa Técnica (Causa Raiz)

O erro ocorre por uma combinação de dois fatores:

### 2.1 — Coleção Nova Sem Cobertura nas Regras

Foi implementada uma nova coleção chamada **`userProgress`** para armazenar os documentos de conclusão de aulas, com o seguinte formato de ID de documento:

```
userProgress/{userId}_{courseId}
```

**As Security Rules do Firestore atualmente não possuem nenhum bloco `match` para essa coleção.** Por padrão de segurança do Firebase, qualquer coleção sem regra explícita tem **toda leitura e escrita bloqueada automaticamente**, inclusive para usuários autenticados.

### 2.2 — Comportamento Padrão do Firebase Security Rules

O Firebase opera no modelo **"negar por padrão"** (*deny by default*). Isso significa que:

> Ausência de regra = Bloqueio total. Uma regra `allow read, write: if false;` está implicitamente ativa para qualquer coleção não mapeada.

Portanto, mesmo que o usuário esteja autenticado e seja o legítimo dono do dado, a tentativa de escrita na coleção `userProgress` é rejeitada antes de chegar ao banco.

---

## 3. Alteração Necessária nas Regras (Para Aplicar no Console Firebase)

> **⚠️ Ação requerida:** O bloco abaixo deve ser adicionado pelo responsável técnico (Fred) diretamente no [Console Firebase → Firestore → Rules](https://console.firebase.google.com/).
> O desenvolvedor **não possui permissão para alterar as Security Rules** neste ambiente.

### 3.1 — Localização no Arquivo de Regras

O novo bloco deve ser inserido dentro do escopo principal, após o bloco de `comments` e antes do fechamento do `match /databases/{database}/documents`:

```javascript
// =========================================================================
// USER PROGRESS (Progresso do Aluno 🎓)
// Cada aluno gerencia exclusivamente o seu próprio progresso.
// Nenhum usuário pode ler ou escrever o progresso de outro.
// =========================================================================
match /userProgress/{progressId} {

  // Leitura: apenas o próprio dono do documento pode ler seu progresso
  allow read: if request.auth != null
    && request.auth.uid == resource.data.userId;

  // Criação: permitida somente se o campo userId bater com o UID do solicitante
  // Isso impede que um aluno crie progresso em nome de outro
  allow create: if request.auth != null
    && request.auth.uid == request.resource.data.userId;

  // Atualização: mesma validação, mas agora contra o documento existente
  // Garante que o dono não pode alterar o campo userId para "roubar" o documento
  allow update: if request.auth != null
    && request.auth.uid == resource.data.userId
    && request.auth.uid == request.resource.data.userId;

  // Exclusão: apenas o próprio dono pode remover seu progresso
  allow delete: if request.auth != null
    && request.auth.uid == resource.data.userId;
}
```

### 3.2 — Por Que `request.resource.data` e não `resource.data`?

Esta é a distinção técnica mais importante da regra:

| Variável | Representa | Disponível em |
|---|---|---|
| `resource.data` | O documento **antes** da operação (estado atual) | `read`, `update`, `delete` |
| `request.resource.data` | O documento **depois** da operação (estado futuro) | `create`, `update` |

Em operações de **criação (`create`)**, o documento ainda não existe no banco. Usar `resource.data` retornaria `null` e a regra falharia. Por isso, para validar os dados de um novo documento, **obrigatoriamente** deve-se usar `request.resource.data`.

---

## 4. Justificativa de Segurança

A regra proposta foi projetada para garantir o **Princípio do Menor Privilégio**, impedindo os seguintes vetores de ataque:

| Vetor de Ataque | Como a Regra Mitiga |
|---|---|
| **Aluno A marca aulas do Aluno B como concluídas** | A validação `request.auth.uid == request.resource.data.userId` impede que o `userId` no payload seja diferente do UID autenticado |
| **Aluno lê o progresso de outro usuário** | A validação `request.auth.uid == resource.data.userId` na regra `read` garante isolamento total de dados |
| **Usuário não autenticado tenta escrever** | A condição `request.auth != null` bloqueia qualquer requisição sem sessão válida |
| **Troca fraudulenta de userId em uma atualização** | A regra `update` valida o UID em ambos os estados (antes e depois), prevenindo "document hijacking" |

---

## 5. Estrutura do Documento Persistido

Para referência do líder técnico, cada documento na coleção `userProgress` possui a seguinte estrutura:

```typescript
// Coleção: userProgress
// ID do Documento: {userId}_{courseId}

interface UserProgress {
  userId: string;       // UID do Firebase Auth — campo validado pelas Rules
  courseId: string;     // ID do curso correspondente
  completedLessons: string[]; // Array de IDs das aulas concluídas
  updatedAt: Timestamp; // Data/hora da última atualização
}
```

**Exemplo de ID de documento:** `abc123uid_curso456id`

---

## 6. Impacto da Não Aplicação

| Impacto | Severidade |
|---|---|
| Progresso do aluno não é salvo entre sessões | 🔴 Crítico |
| Recursos de "Tempo Assistido" e "Cursos Concluídos" indisponíveis | 🟡 Alto |
| Relatórios de engajamento da gestão ficam sem dados | 🟡 Alto |
| Experiência do aluno degradada (progresso zerado ao recarregar) | 🔴 Crítico |

---

## 7. Próximos Passos e Auditoria Recomendada

Após a aplicação da regra acima, recomenda-se uma **auditoria de cobertura** nas demais coleções sensíveis do projeto para garantir que o mesmo tipo de lacuna não exista em outros pontos:

### 7.1 — Auditoria Prioritária (Coleções Sensíveis)

| Coleção | Risco Identificado | Ação Recomendada |
|---|---|---|
| `comments` | A regra `read` usa `hasPurchasedCourse(resource.data.courseId)`, o que pode impedir a leitura para admins inadvertidamente | Revisar se o caminho `courseId` está 100% consistente com o payload enviado pelo frontend |
| `messages` | A regra de criação permite que `teacher_id` escreva — validar se um aluno mal-intencionado poderia enviar uma mensagem falsificando `teacher_id` | Adicionar validação de role server-side ou restringir o campo `teacher_id` por regra |
| `enrollments` | `allow create` depende apenas de `user_id == auth.uid`, mas não valida se o `course_id` referenciado é válido | Considerar adicionar `exists()` para checar se o curso existe antes de criar a matrícula |

### 7.2 — Ação Proposta (Próximo Sprint)

- [ ] Agendar sessão de **Security Rules Review** com Fred para cobrir todas as coleções acima
- [ ] Implementar testes automatizados usando o **Firebase Rules Unit Testing Framework** (`@firebase/rules-unit-testing`) para garantir regressão zero nas regras
- [ ] Documentar o mapa completo de permissões de todas as coleções no `ARCHITECTURE.md`

---

## 8. Referências

- [Firebase Security Rules — Documentação Oficial](https://firebase.google.com/docs/firestore/security/get-started)
- [Diferença entre `resource` e `request.resource`](https://firebase.google.com/docs/firestore/security/rules-conditions#data_validation)
- [Firebase Rules Unit Testing](https://firebase.google.com/docs/firestore/security/test-rules-emulator)
- Conversa técnica de implementação da funcionalidade: `Conversation 87d23147` (PowerPlay LMS — 02/04/2026)

---

---

# INC-002 — Erro de Permissão e Rota 404 (Perfis e Progresso)

---

| Campo                | Detalhe                                                          |
| -------------------- | ---------------------------------------------------------------- |
| **Data do Ocorrido** | 06/04/2026                                                       |
| **Prioridade**       | 🔴 Alta — Navegação e persistência bloqueadas                    |
| **Status**           | ⏳ Aguardando aprovação das Security Rules (Fred)                |
| **Funcionalidades**  | Perfil Público de Professor · Progresso do Aluno                 |

---

## INC-002.1 — Descrição do Problema

Foram identificados **dois bloqueios** simultâneos causados pelas Security Rules atuais do Firestore:

### Problema A — Perfis de Professores (Rota 404 / Permission Denied)

A rota `/professor/[id]` — que exibe o perfil público de um professor para alunos — está retornando **404 / Permission Denied**.

**Causa:** A regra atual da coleção `profiles` exige que o visitante seja o **dono** do perfil (`request.auth.uid == userId`) **ou** um Admin. Isso bloqueia qualquer leitura de terceiros, inclusive alunos autenticados navegando pelo catálogo.

### Problema B — Progresso do Aluno (Permission Denied ao Gravar)

A persistência de conclusão de aulas falha com:

```
FirebaseError: Missing or insufficient permissions
  code: 'permission-denied'
```

O progresso do aluno **não é salvo**. Ao recarregar a página, todas as aulas marcadas como concluídas voltam ao estado inicial.

---

## INC-002.2 — Causa Raiz (Technical Root Cause)

As Security Rules atuais do Firestore estão **restringindo excessivamente** o acesso:

| Coleção | Regra Atual (Problema) | Efeito |
|---------|----------------------|--------|
| `profiles` | `allow read: if request.auth.uid == userId \|\| isAdmin()` | Bloqueia leitura pública de perfis de professores |
| `userProgress` | Sem cobertura (`deny by default`) | Bloqueia toda escrita autenticada |

> O Firebase opera no modelo **"negar por padrão"** (*deny by default*): ausência de regra = bloqueio total, mesmo para usuários autenticados.

---

## INC-002.3 — Solução Proposta (Ação Necessária do Admin)

> [!IMPORTANT]
> As regras abaixo devem ser aplicadas pelo **Fred** diretamente no [Console Firebase → Firestore → Rules](https://console.firebase.google.com/).
> O desenvolvedor **não possui permissão** para alterar as Security Rules neste ambiente.

### Regra 1 — Coleção `profiles` (Leitura Pública)

Alterar para permitir **leitura pública**, mantendo a **escrita privada**:

```javascript
// =========================================================================
// PROFILES (Perfis de Usuários)
// Leitura pública: qualquer visitante pode ver o perfil de um professor.
// Escrita privada: apenas o próprio dono ou um Admin pode editar.
// =========================================================================
match /profiles/{userId} {
  allow read: if true;
  allow write: if request.auth != null
    && (request.auth.uid == userId || isAdmin());
}
```

**Por que `read: if true`?**
Páginas de perfil de professor são conteúdo público de apresentação. Bloquear a leitura impede índices de cursos, páginas de catálogo e a navegação de alunos para o perfil do instrutor.

### Regra 2 — Coleção `userProgress` (Progresso do Aluno)

Criar/Atualizar regra para permitir que o aluno autenticado gerencie **exclusivamente o seu próprio progresso**:

```javascript
// =========================================================================
// USER PROGRESS (Progresso do Aluno 🎓)
// Cada aluno gerencia exclusivamente o seu próprio progresso.
// Nenhum usuário pode ler ou escrever o progresso de outro.
// =========================================================================
match /userProgress/{userId} {
  allow read, write: if request.auth != null
    && request.auth.uid == userId;
}
```

---

## INC-002.4 — Justificativa de Segurança

| Vetor de Ataque | Como a Regra Mitiga |
|---|---|
| **Aluno lê dados de progresso de outro** | `request.auth.uid == userId` garante isolamento total |
| **Usuário não autenticado acessa progresso** | `request.auth != null` bloqueia requisições sem sessão |
| **Edição maliciosa de perfil de outro professor** | `write` só é permitido para o dono ou Admin |
| **Exposição de dados sensíveis em perfis** | A coleção `profiles` só armazena dados públicos de apresentação — não há risco em `read: if true` |

---

## INC-002.5 — Impacto da Não Aplicação

| Impacto | Severidade |
|---|---|
| Alunos não conseguem acessar perfil do professor (erro 404) | 🔴 Crítico |
| Progresso do aluno não é persistido entre sessões | 🔴 Crítico |
| Navegação quebrada no catálogo de cursos (link de professor) | 🔴 Crítico |
| Métricas de engajamento sem dados confiáveis | 🟡 Alto |

---

## INC-002.6 — Status de Implementação (Código)

> [!NOTE]
> As alterações de código no frontend/backend estão **prontas e implementadas**. O único bloqueio é a aplicação das regras acima no Console Firebase.

- ✅ Rota `/professor/[id]` — componente criado e funcional
- ✅ Lógica de `userProgress` — Server Action implementada
- ⏳ Security Rules — **aguardando aprovação de Fred**

---

*INC-001 documentado em 02/04/2026 · INC-002 documentado em 06/04/2026 · Desenvolvedor: Daniel Siqueira · Aguardando revisão de: Fred (Líder Técnico)*
