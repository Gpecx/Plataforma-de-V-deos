---
name: create-instructor-profile
description: Cria uma página de perfil de instrutor baseada no modelo da Udemy, conectando dados de cursos e métricas do Firebase.
---

# Skill de Perfil de Instrutor

Use esta skill para implementar a página pública do professor.

## Quando usar
- Para criar a rota `/professor/[id]` na plataforma.
- Para exibir estatísticas de autoridade (total de alunos, avaliações) e bio.

## Estrutura de dados necessária
- **Professores**: Coleção `profiles` (campo `role: 'teacher'`).
- **Métricas**: Agregar dados da coleção `enrollments` e `reviews` filtrando pelo `teacherId`.

## Passo a passo de implementação
1. **Página Dinâmica**: Criar `app/professor/[id]/page.tsx` usando Server Components.
2. **Dados**: Fetch dos dados do professor no Firestore + agregação de métricas de cursos.
3. **UI**: Seguir o design "Clean & Trust" (Foto à esquerda, bio abaixo, lista de cursos do professor ao final).
4. **Linkagem**: Adicionar o `<Link href={`/professor/${course.teacherId}`}>` em todos os cards de curso.