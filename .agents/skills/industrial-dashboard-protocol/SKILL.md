---
name: industrial-dashboard-protocol
description: Formaliza o padrão visual 'Industrial PowerPlay' para Dashboards e Painéis Admin, focando em temas escuros profundos, geometria de precisão e tipografia técnica.
---

# Industrial Dashboard Protocol (PowerPlay)

Este protocolo define os padrões visuais e estruturais para as áreas administrativas e de gestão da plataforma, garantindo uma estética premium, técnica e imersiva.

## Quando usar
- Ao criar ou refinar páginas no `dashboard-teacher`.
- Ao atualizar a interface do `admin/settings`.
- Sempre que for necessário transformar uma página clara/tradicional em uma experiência "PowerPlay Industrial".

## Identidade Visual (Design Tokens)

### 1. Paleta de Cores Industrial
| Elemento | Hexadecimal | Descrição |
| :--- | :--- | :--- |
| **Main Background** | `#0d2b17` | Fundo principal da página. |
| **Card/Container BG** | `#0f1f14` | Fundo de cartões e formulários. |
| **Border Color** | `#1e4d2b` | Bordas técnicas sutis. |
| **Brand Accent** | `#00C402` | Cor de destaque (Verde Neon). |
| **Surface Accent** | `white/5` | Divisores e detalhes leves. |

### 2. Geometria de Precisão
- **Regra de Ouro**: `rounded-none` em TUDO.
- Remova arredondamentos de:
  - Cards e Containers.
  - Inputs e Textareas.
  - Botões e CTAs.
  - Avatares (use containers quadrados).
  - Badges e Status indicators.

### 3. Tipografia Técnica
- **Font-Family**: `font-exo`.
- **Cabeçalhos**: `uppercase`, `font-black`, `tracking-tighter`.
- **Sub-labels/Meta**: `uppercase`, `tracking-widest`, `text-[10px]`.
- **Contrast**: Use `text-white` para títulos e `text-slate-400` para descrições.

## Padrões de Componentes

### Cards de Gestão
```html
<Card className="bg-[#0f1f14] border-[#1e4d2b] rounded-none shadow-none">
  <CardHeader className="bg-[#0d2b17] border-b border-[#1e4d2b] p-4">
     <CardTitle className="uppercase font-black text-white">Título Industrial</CardTitle>
  </CardHeader>
  ...
</Card>
```

### Tabelas e Listas
- Header em uppercase com `tracking-[0.2em]`.
- Hover states utilizando `hover:bg-white/5`.
- Divisores finos com `border-white/5`.

### Formulários Técnicos
- Inputs com fundo `#0d2b17` e borda `#1e4d2b`.
- Focus state com borda `#00C402` e anel de brilho sutil (glow).
- Ícones em tons de `slate-500` que mudam para a cor de destaque no foco.

## Checklist de Aplicação
- [ ] Aplicar fundo `#0d2b17` no container principal.
- [ ] Substituir todas as classes `rounded-*` por `rounded-none`.
- [ ] Trocar sombras (`shadow-*`) por bordas `#1e4d2b`.
- [ ] Converter textos de cabeçalho para uppercase/black/tighter.
- [ ] Garantir que CTAs principais usem o fundo `#00C402` com texto em contraste.
- [ ] Utilizar `px-8 md:px-12` para margens laterais consistentes.
