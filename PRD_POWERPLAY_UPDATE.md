# PRD — PowerPlay Platform: Release de Estabilidade e Segurança Avançada
**Documento:** Product Requirements Document (PRD)  
**Versão:** 3.0  
**Status:** Revisado  
**Data de Emissão:** 29 de Abril de 2026  
**Responsável Técnico:** Equipe PowerPlay  
**Projeto:** `plataforma-cursos`

---

## 1. Visão Geral do Produto

A **PowerPlay** é uma plataforma SaaS de LMS (Learning Management System) de alta performance. Esta versão 3.0 marca a transição de uma fase de refatoração visual para uma fase de **Hardening e Estabilidade Crítica**, consolidando mecanismos de segurança em tempo real e garantindo a integridade financeira das transações.

O objetivo desta release é assegurar que a plataforma seja resiliente a fraudes, rápida na emissão de documentos oficiais e visualmente impecável sob o pilar **Industrial Clean**.

---

## 2. Hardening e Segurança em Tempo Real (Novo)

### 2.1 Detecção de Banimento Instantâneo
Implementação do hook `useAuthGuard` integrado ao `AuthProvider`. 
- **Mecanismo:** Utiliza `onSnapshot` apontando para `/profiles/{uid}`.
- **Ação Punitiva:** Ao detectar o status `banido`, o sistema dispara imediatamente `firebase.auth().signOut()`, limpa cookies/sessionStorage e redireciona para `/login?error=account_suspended`.
- **Objetivo:** Impedir que usuários banidos continuem navegando em abas já abertas.

### 2.2 Refinamento de Privilégios (Firestore Rules)
Aplicação rigorosa do princípio de menor privilégio para mitigar o incidente **INC-009**:
- Bloqueio de escritas em campos sensíveis (ex: `role`, `balance`) via Client SDK.
- Validação de ownership em todas as coleções de progresso e certificados.

---

## 3. Checkout e Fluxo Financeiro

### 3.1 Integração Asaas e Matrícula Segura
Correção do fluxo de aquisição para evitar o risco de "matrícula fantasma" antes da confirmação do pagamento:
- **Fluxo Atualizado:** O `batch.commit()` que cria o documento de matrícula (`enrollments`) agora é disparado **apenas após** a validação de sucesso do webhook do Asaas ou confirmação imediata de saldo.
- **Sincronização:** Implementação de polling/webhook para garantir que o aluno só visualize o curso no dashboard após o status de pagamento ser `RECEIVED` ou `CONFIRMED`.

---

## 4. Sistema de Certificados

### 4.1 Tecnologia de Emissão
Transição da tecnologia de geração de PDF para garantir compatibilidade com ambientes serverless (Vercel):
- **Método Primário:** Client-side rendering via `html2canvas` + `jsPDF`.
- **Racional:** Evita dependências pesadas de fontes no servidor e problemas de timeout em funções lambda.

### 4.2 Segurança e Integridade
- **CERTIFICATE_RENDER_SECRET:** Implementação de token de segurança para proteger a rota de renderização, impedindo que usuários acessem templates brutos de certificados.
- **Persistência de Dados:** O campo `teacherName` agora é capturado e persistido no momento da conclusão do curso no objeto `concluded_courses`, garantindo que certificados antigos mantenham o nome do instrutor da época, mesmo que o instrutor altere seu perfil posteriormente.

---

## 5. Design System: Industrial Clean

Mantemos a diretriz visual austera e profissional:
- **Bordas:** `rounded-none` em todos os botões, inputs e cards de aplicação.
- **Tipografia:** `Montserrat` como fonte base. Títulos com `font-black` (900) proibidos; limite máximo de `font-extrabold` (800).
- **Cores:** Fundo branco puro (`#FFFFFF`) na área logada e Dark Navy (`#061629`) na Landing Page.
- **Branding:** Removidas 100% das referências ao legado "SPCS". O asset `SPCS academy 2.png` foi oficialmente substituído.

---

## 6. Log de Incidentes e Estabilidade

### 6.1 Histórico de Estabilidade (Resolvidos)
| ID | Incidente | Resolução |
|---|---|---|
| **INC-005** | Vazamento de Tema | Isolamento via `.theme-clean-white` concluído. |
| **INC-007** | Falha de Upload Mux | Refatoração do processamento de chunks concluída. |
| **INC-008** | Inconsistência de Preço | Lock de UI em cursos gratuitos implementado. |
| **INC-009** | Bypass de Matrícula | Migração do commit para pós-pagamento. |

### 6.2 Riscos e Backlog (Abertos)
| ID | Risco | Status | Plano de Ação |
|---|---|---|---|
| **INC-006** | Playwright Timeouts | Aberto | Otimizar headless browser para PDF. |
| **INC-010** | Latência de Busca | Backlog | Implementar Algolia ou Firestore Indexing. |

---

## 7. Aprovação e Versionamento

| Versão | Data | Status | Mudanças |
|---|---|---|---|
| 1.0 | 06/04/26 | Depreciado | Versão inicial. |
| 2.0 | 07/04/26 | Depreciado | Refatoração visual Montserrat. |
| **3.0** | **29/04/26** | **Ativo** | Hardening, Asaas, Certificados Vercel. |

---
*Fim do Documento*
