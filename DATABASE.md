# Documentação do Banco de Dados (Firebase)

Este documento descreve a estrutura do banco de Dados NoSQL (Firestore) e do Cloud Storage utilizados na plataforma.

## Firestore (Coleções)

### 1. `profiles`
Armazena os perfis de usuários (Alunos, Professores e Administradores).

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | `string` | ID único do usuário (mesmo do Firebase Auth UID). |
| `email` | `string` | E-mail do usuário. |
| `full_name` | `string` | Nome completo. |
| `cpf_cnpj` | `string` | Documento de identificação. |
| `person_type` | `string` | 'CPF' ou 'CNPJ'. |
| `birth_date` | `string` | Data de nascimento. |
| `role` | `string` | Papel no sistema ('student', 'teacher', 'admin'). |
| `ativo` | `boolean` | Status da conta (Ativo/Inativo). |
| `created_at` | `timestamp` | Data de criação do perfil. |
| `updated_at` | `timestamp` | Data da última atualização. |

---

### 2. `courses`
Armazena as informações dos cursos oferecidos na plataforma.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `teacher_id` | `string` | Referência ao `id` do professor em `profiles`. |
| `title` | `string` | Título do curso. |
| `subtitle` | `string` | Subtítulo ou resumo curto. |
| `description` | `string` | Descrição detalhada (HTML/Markdown). |
| `category` | `string` | Categoria do curso. |
| `price` | `number` | Preço de venda. |
| `duration` | `number` | Duração total estimada em horas. |
| `status` | `string` | Status do curso ('PENDENTE', 'published', 'REJEITADO'). |
| `image_url` | `string` | URL da imagem de capa (Storage). |
| `intro_video_url` | `string` | URL do vídeo de introdução (Storage/Vimeo/Youtube). |
| `motivoRejeicao` | `string` | Motivo caso o curso seja rejeitado pela moderação. |
| `created_at` | `timestamp` | Data de criação. |
| `updated_at` | `timestamp` | Data da última atualização. |

---

### 3. `lessons`
Armazena as aulas vinculadas aos cursos.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `course_id` | `string` | Referência ao `id` do curso em `courses`. |
| `title` | `string` | Título da aula. |
| `video_url` | `string` | URL do vídeo da aula (Storage/Vimeo/Youtube). |
| `position` | `number` | Ordem da aula no curso. |
| `status` | `string` | Status da aula ('PENDENTE', 'published', 'REJEITADO'). |
| `motivoRejeicao` | `string` | Motivo caso a aula seja rejeitada pela moderação. |
| `created_at` | `timestamp` | Data de criação. |
| `updated_at` | `timestamp` | Data da última atualização. |
| `approved_at` | `timestamp` | Data de aprovação pela moderação. |

---

### 4. `enrollments`
Registra a matrícula de alunos em cursos.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `user_id` | `string` | Referência ao `id` do aluno em `profiles`. |
| `course_id` | `string` | Referência ao `id` do curso em `courses`. |
| `created_at` | `timestamp` | Data da matrícula/compra. |

---

### 5. `vendas_logs`
Histórico de transações financeiras para auditoria e dashboards.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `idTransacao` | `string` | Código único da transação (ex: TR-...). |
| `alunoId` | `string` | Referência ao `id` do aluno. |
| `cursoId` | `string` | Referência ao `id` do curso. |
| `professorId` | `string` | Referência ao `id` do professor. |
| `valorBruto` | `number` | Valor total pago pelo aluno. |
| `taxaPlataforma` | `number` | Valor retido pela plataforma. |
| `repasseProfessor` | `number` | Valor a ser pago ao professor. |
| `statusPagamento` | `string` | Ex: 'pago'. |
| `dataCriacao` | `timestamp` | Data da transação. |

---

### 6. `config` (Documento: `platform_settings`)
Configurações globais de taxas e negócios.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `platform_tax` | `number` | Porcentagem de taxa cobrada pela plataforma (ex: 20). |
| `updated_at` | `timestamp` | Última alteração nas configurações. |

---

### 7. `settings` (Documento: `global`)
Configurações visuais (Branding) e banners.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `branding.logoUrl` | `string` | URL do logo da plataforma. |
| `branding.siteName` | `string` | Nome da marca. |
| `branding.primaryColor`| `string` | Cor principal (Hex). |
| `banners.hero_home` | `array` | Lista de banners da Home (`{url, order}`). |
| `banners.hero_dashboard`| `array` | Lista de banners do Dashboard (`{url, order}`). |
| `banners.hero_course` | `array` | Lista de banners da página de curso (`{url, order}`). |

---

### 8. `notifications`
Alertas para professores sobre vendas ou mensagens.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `teacherId` | `string` | Referência ao `id` do professor. |
| `type` | `string` | Tipo da notificação ('sale', 'message'). |
| `message` | `string` | Conteúdo da notificação. |
| `read` | `boolean` | Status de leitura. |
| `createdAt` | `timestamp` | Data do alerta. |

---

### 9. `messages`
Mensagens de chat entre alunos e professores.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `user_id` | `string` | Referência ao aluno. |
| `teacher_id` | `string` | Referência ao professor. |
| `role` | `string` | Quem enviou ('student' ou 'teacher'). |
| `content` | `string` | Conteúdo da mensagem. |
| `created_at` | `timestamp` | Data/hora do envio. |

---

## Firebase Storage (Pastas)

| Pasta | Descrição |
|-------|-----------|
| `images/` | Imagens genéricas, logos e arquivos temporários. |
| `videos/` | Vídeos de aulas e introdução (carregados via helper padrão). |
| `courses/images/` | Capas de cursos organizadas. |
| `courses/videos/` | Vídeos de aulas organizados. |

## Relacionamentos Principais

- **Perfil ↔ Curso**: `courses.teacher_id` -> `profiles.id`
- **Curso ↔ Aula**: `lessons.course_id` -> `courses.id`
- **Aluno ↔ Curso**: `enrollments.user_id` -> `profiles.id` e `enrollments.course_id` -> `courses.id`
- **Vendas ↔ Todos**: Agrega IDs de aluno, professor e curso para relatórios.
- **Chat ↔ Perfil**: `messages.user_id` e `messages.teacher_id` conectam as partes.
