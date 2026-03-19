---
name: content-moderation-maintenance-protocol
description: Protocolo para manutenção e correção de erros comuns no módulo de Moderação de Conteúdo (Admin), cobrindo importações, reprodução de vídeo e tipagem.
---

# Content Moderation Maintenance Protocol

Este protocolo define os padrões técnicos para a manutenção das páginas de aprovação e dashboards administrativos do PowerPlay.

## Quando usar
- Quando encontrar erros de "Module not found" em rotas administrativas.
- Quando os vídeos de cursos ou aulas não carregarem/reproduzirem no painel Admin.
- Quando o build falhar devido a erros de tipagem implícita (`any`) em `maps` de dados financeiros.

## Padrões Adotados

### 1. Resolução de Importações (Absolute Aliases)
Para evitar conflitos de resolução em componentes aninhados dentro da pasta `app/admin`, use sempre o alias `@/` em vez de caminhos relativos.
- **Errado**: `import { MyComponent } from './components/MyComponent'`
- **Correto**: `import { MyComponent } from '@/app/admin/path/to/components/MyComponent'`

### 2. Standardized Video Player (Classroom Alignment)
Para garantir que os vídeos carreguem corretamente em todos os navegadores e ignorem restrições de tipo ou CORS desnecessárias:
- Use a tag `<video>` simples com o atributo `src` direto (sem `<source>` se possível).
- Atributos recomendados: `controls`, `autoPlay`, `muted`, `playsInline`.
- **NÃO** use `crossOrigin="anonymous"` ou `type="video/mp4"` a menos que seja estritamente necessário para processamento de imagem (canvas).
- Para vídeos externos (YouTube/Vimeo), use o padrão de `iframe` com os parâmetros de `autoplay=1&mute=1`.

### 3. Tipagem de Dados Dinâmicos (Dashboard Fix)
Sempre tipifique explicitamente os parâmetros em funções de callback (`map`, `filter`, `reduce`) que lidam com dados vindos de Server Actions.
- **Checklist**: Verifique se `data.payments.map((p) => ...)` possui a tipagem `(p: any)` ou, preferencialmente, uma interface estruturada.

## Como utilizar esta Skill
1. Ao identificar um erro em `/admin/approvals` ou `/admin/dashboard`, verifique se ele se enquadra em um dos três padrões acima.
2. Aplique a correção seguindo o modelo do componente `src/app/classroom/[id]/page.tsx` para vídeos.
3. Verifique o build localmente com `npx tsc --noEmit` antes de realizar o push.
