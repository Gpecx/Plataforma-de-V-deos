---
name: premium-aesthetic-restoration
description: Restaura a estética "Premium" original do site, focando em cantos arredondados, tipografia de alto contraste e sistemas de gradientes profundos. Use para reverter o estilo industrial ou unificar a marca.
---

# Premium Aesthetic Restoration

Esta skill formaliza o padrão visual "Premium" da plataforma, garantindo uma experiência de usuário imersiva, elegante e de alta legibilidade.

## Quando usar
- Para reverter alterações que tornaram a interface muito rígida ou "industrial" (ex: cantos quadrados, pouco contraste).
- Ao criar novas páginas que devem seguir o padrão de fundo gradiente fixo.
- Para garantir que textos sobre fundos escuros tenham legibilidade máxima.

## Princípios de Design

### 1. Fundo e Gradientes
- **Gradiente Global**: O fundo de todas as telas deve usar `var(--global-bg-gradient)` fixo.
- **Variáveis**:
  - `--global-bg-gradient`: `linear-gradient(135deg, #061629 0%, #061629 25%, #1D5F31 100%) fixed`
  - `--premium-gradient`: `linear-gradient(135deg, #061629 0%, #061629 25%, #1D5F31 100%)`

### 2. Geometria e Formas (Rounded Corners)
- **NÃO use** `rounded-none` ou `border-radius: 0 !important`.
- **Use**:
  - `rounded-xl` ou `rounded-2xl` para containers principais.
  - `rounded-lg` para inputs e botões secundários.
  - `rounded-full` para badges e elementos circulares.

### 3. Tipografia e Contraste
- Em fundos escuros/gradientes, use **branco puro (#ffffff)** para máxima legibilidade.
- **Cabeçalhos (H1, H2)**: `fontWeight: 900`, `textTransform: "uppercase"`, `color: "#ffffff"`.
- **Textos de Apoio**: Evite opacidades abaixo de `0.7` para textos informativos.
- **Ícones**: Devem ser brancos ou usar o gradiente de destaque, evitando verdes escuros que se percam no fundo.

### 4. Navegação e Estrutura
- **Navbar & Footer**: Devem manter um fundo sólido `#061629` com `backdropFilter: 'blur(12px)'` para separação visual clara do conteúdo dinâmico do fundo.

## Como usar

### Aplicando tipografia de alto contraste
```tsx
<h1 style={{ color: "#ffffff", fontWeight: 900, textTransform: "uppercase" }}>
  TITULO DE IMPACTO
</h1>
<p style={{ color: "rgba(255,255,255,0.9)" }}>
  Subtítulo com alta legibilidade.
</p>
```

### Restaurando Cards Premium
```tsx
<div className="dark-card rounded-2xl p-6 bg-[#061629]/60 backdrop-blur-xl border border-white/10">
  {/* Conteúdo */}
</div>
```

### Limpando fundos sólidos para mostrar o gradiente global
Remova classes como `bg-[#061629]` ou `bg-white` de wrappers `min-h-screen` e substitua por `bg-transparent`.
