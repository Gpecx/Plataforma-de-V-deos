---
name: create-skill
description: Cria novas habilidades (skills) para o agente, seguindo o padrão .agents/skills/. Use sempre que precisar formalizar uma nova regra ou tarefa reutilizável.
---

# Skill de Criação de Skills

Use esta skill para criar novos diretórios de habilidades no projeto.

## Quando usar
- Quando uma tarefa for repetitiva e você quiser automatizá-la.
- Quando definir um novo padrão de código ou processo que o agente deve seguir.

## Passo a passo para criar uma skill

1. **Definir nome**: Escolha um nome curto em minúsculas (com hifens).
2. **Criar estrutura**: 
   - Crie a pasta em `.agents/skills/<nome-da-skill>/`.
   - Crie o arquivo `SKILL.md` dentro desta pasta.
3. **YAML Frontmatter**: Sempre comece o arquivo com:
   ---
   name: <nome>
   description: <descrição curta para o agente>
   ---
4. **Conteúdo**: Siga a estrutura de:
   - Título da Skill.
   - Checklist ou passos detalhados.
   - Seção "When to use" (Quando usar).
   - Seção "How to use" (Como usar).

## Exemplo de estrutura que você deve seguir:
.agents/skills/my-skill/
└── SKILL.md