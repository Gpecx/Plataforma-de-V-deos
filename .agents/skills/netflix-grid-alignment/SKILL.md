---
name: netflix-grid-alignment
description: Garante o alinhamento rigoroso de elementos em um grid de 12 colunas para layouts full-screen (estilo Netflix), unificando paddings e larguras de coluna.
---

# Skill: Netflix-Style Grid Alignment

Use esta skill para garantir que todos os elementos de uma página (títulos, vídeos, descrições) estejam perfeitamente alinhados verticalmente em um layout de tela cheia, seguindo um grid de 12 colunas rigoroso.

## Quando usar
- Quando adicionar novas seções a uma página que já segue o estilo "Netflix".
- Quando o texto ou componentes parecerem "desalinhados" ou "perdidos" em telas ultra-wide.
- Para manter a consistência visual entre heros full-width e seções de conteúdo.

## Regras de Ouro (Ação)

### 1. Containers Full-Screen
- Mantenha `max-w-none` no container principal. O objetivo é preencher a largura total, permitindo que o grid respire.

### 2. Unificação de Padding Horizontal
- Utilize obrigatoriamente o padding padrão do projeto para todas as seções: `px-6 md:px-12 lg:px-16`.
- Isso cria uma linha vertical invisível onde todos os elementos (logos, títulos de seção, vídeos) devem começar.

### 3. Grid de 12 Colunas Rigoroso
- Use `grid lg:grid-cols-12 gap-0` para containers que precisam de alinhamento entre seções.
- **Player de Vídeo / Hero Principal**: Geralmente ocupa `lg:col-span-8`.
- **Conteúdo / Descrição**: Deve ocupar exatamente as mesmas colunas que o elemento superior (ex: `lg:col-span-8`).
- **Cards Laterais / Checkout**: Ocupam as colunas restantes (ex: `lg:col-span-4`).

### 4. Alinhamento de Texto e Títulos
- Se o elemento superior (ex: vídeo) não tem padding interno extra, o texto abaixo dele também não deve ter, ou deve seguir o mesmo `pl-6` (padding-left) se houver uma borda decorativa.
- Evite `max-w-3xl` ou limites similares dentro de colunas do grid; deixe que o `col-span` dite a largura máxima.

## Como Aplicar (Passo a Passo)
1. Identifique o `grid-cols` e o `col-span` da seção de referência (normalmente o topo/vídeo).
2. Aplique a mesma estrutura de grid à nova seção.
3. Verifique se os paddings laterais são idênticos em todos os breakpoints (`sm`, `md`, `lg`).
4. Remova quaisquer containers de largura fixa (`max-w-7xl`, etc.) que centralizem o conteúdo de forma diferente do grid global.
