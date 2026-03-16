---
name: seal-color-leaks
description: Sela vazamentos de cor clara (branco/cinza) e garante a aplicação de um tema dark global profundo em todo o site.
---

# Seal Color Leaks & Global Dark Theme

Use esta skill para garantir que a aplicação não tenha brechas de luz e mantenha uma identidade visual escura premium.

## Quando usar
- Quando houver linhas brancas ou cinzas aparecendo atrás do cabeçalho durante o scroll.
- Ao criar novas páginas que devem herdar o tema escuro da plataforma.
- Quando o fundo do site parecer "piscar" em branco durante carregamentos.

## Procedimento Detalhado

### 1. Reset Global (Obrigatório)
Verifique o `layout.tsx` principal. A tag `<body>` DEVE ter a cor de fundo definida explicitamente para evitar vazamentos de renderização do motor do browser.
- Elemento: `<body>`
- Classe: `bg-[#0d2b17]` (ou a cor base do projeto)
- Estilo: `text-white` para legibilidade global.

### 2. Blindagem da Navbar
A Navbar deve atuar como um selo no topo da página.
- **Posicionamento**: `sticky top-0`.
- **Z-Index**: `z-[100]` ou superior.
- **Background**: Fundo sólido ou com glassmorphism (`backdrop-filter: blur(12px)`).
- **Shadow**: `shadow-[0_4px_20px_rgba(0,0,0,0.5)]` (Sombra escura).
- **Sem Bordas Claras**: Substitua `border-white` ou `border-slate-100` por `border-white/10`.

### 3. Substituição de Cores em Dashboards
Procure por classes de fundo claro em subpáginas:
- `bg-white` -> `bg-[#0f1f14]` (Surface)
- `bg-slate-50` -> `bg-[#0d2b17]` (Background)
- `text-slate-900` -> `text-white`
- `border-slate-200` -> `border-[#1e4d2b]`

### 4. Checklist de Verificação
- [ ] O header cobre todo o conteúdo sem deixar passar luz por trás?
- [ ] O scroll reveals algum fundo branco entre seções?
- [ ] Os cards e containers secundários usam tons escuros harmoniosos?
- [ ] Os inputs e botões de formulário estão legíveis sobre o fundo escuro?

## How to use
"Aplique a skill seal-color-leaks para garantir que não haja vazamentos de cor branca na página de checkout."
