---
name: industrial-powerplay-refinement
description: Aplica o design system 'Industrial PowerPlay' em páginas e componentes, focando em bordas quadradas, alto contraste e layouts técnicos.
---

# Industrial PowerPlay Refinement

Esta habilidade formaliza o design system **Industrial PowerPlay**, focado em uma estética técnica, precisa e imersiva para a plataforma.

## Quando usar
- Ao criar ou refinar painéis (Dashboards).
- Ao redesenhar páginas de conteúdo ou cursos.
- Sempre que for solicitado um visual "técnico", "industrial" ou "premium dark".

## Princípios de Design

1. **Zero Arredondamento (Precision Edges)**:
   - Aplique `rounded-none` globalmente.
   - Remova qualquer `rounded-xl`, `rounded-2xl` ou `rounded-full` de botões, cards e containers.

2. **Contraste Técnico (Technical Borders over Shadows)**:
   - Elimine as sombras (`shadow-sm`, `shadow-lg`, etc.).
   - Use bordas finas (`1px solid`) com cores escuras (`border-[#1e4d2b]` ou `border-white/10`).
   - No estado de `:hover`, altere apenas a cor da borda para o verde da marca (`#00C402`).

3. **Imersão em Tela Cheia (Full-Bleed Banners)**:
   - Expanda banners para a largura total do container (`max-w-none` no container pai).
   - Adicione um overlay escuro profundo (`bg-black/60`) sobre imagens de fundo.
   - Utilize tipografia extrabold/black e uppercase para títulos de banner.

4. **Grade Rigorosa (Grid Alignment)**:
   - Mantenha margens horizontais idênticas em todos os componentes da página.
   - Padrão recomendado: `px-6 md:px-12 lg:px-16`.

5. **Paleta de Cores**:
   - Fundo: `#0d2b17` (Verde Escuro Industrial).
   - Destaque: `#00C402` (Verde Neon SPCS).
   - Texto Secundário: `text-white/60` ou `text-slate-400`.

## Checklist de Implementação

- [ ] Substituir `rounded-*` por `rounded-none`.
- [ ] Remover classes `shadow-*.`
- [ ] Garantir `w-full` e `max-w-none` em seções de destaque (Hero).
- [ ] Aplicar `bg-black/60` em overlays de imagem.
- [ ] Alinhar paddings laterais com a régua `px-6 md:px-12 lg:px-16`.
- [ ] Configurar hover states para `border-[#00C402]`.
