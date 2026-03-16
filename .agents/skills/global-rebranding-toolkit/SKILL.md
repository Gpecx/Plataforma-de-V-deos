---
name: global-rebranding-toolkit
description: Ferramenta para realizar rebranding global ou substituição massiva de termos de marca na interface, garantindo consistência e limpeza de textos estáticos.
---

# Global Rebranding Toolkit

Esta skill sistematiza o processo de alteração de marca (branding) em todo o projeto, garantindo que textos visíveis sejam atualizados sem comprometer a integridade técnica (banco de dados/IDs).

## Quando usar

- Quando o nome da plataforma ou empresa mudar.
- Para atualizações anuais de copyright em múltiplos arquivos.
- Para tradução massiva de labels de UI (ex: mudar "SPCS Academy" para "PowerPlay").
- Para auditoria de strings estáticas perdidas no código.

## Como usar

### 1. Pesquisa Exaustiva
Utilize o `grep_search` (case-insensitive) para localizar todas as ocorrências do termo antigo.
- **Filtro**: Concentre-se no diretório `src/`.
- **Exemplo**: `grep -ri "termo-antigo" src/`

### 2. Triagem de Alterações
Divida as ocorrências em duas categorias:
- **Visíveis**: Labels, placeholders, alt text, meta titles, success messages. (MODIFICAR)
- **Técnicas**: IDs de banco de dados, chaves de LocalStorage, nomes de arquivos físicos no servidor. (MANTER, a menos que explicitado o contrário)

### 3. Execução por Blocos
Atualize os arquivos em grupos lógicos (ex: primeiro rodapés, depois dashboards, depois checkout).
- Priorize `Footer.tsx` e `Logo.tsx` como pontos críticos de branding.
- Atualize placeholders de formulários (ex: `exemplo@empresa.com`).

### 4. Auditoria de Imagens
Verifique se há referências a logos antigas em `alt` text ou se o `src` aponta para imagens com o nome antigo. Reporte se novas imagens forem necessárias.

### 5. Verificação Final
Rode a pesquisa novamente para garantir que zero strings visíveis foram esquecidas.

## Checklist de Rebranding

- [ ] Footer copyright atualizado (incluindo ano corrente).
- [ ] Placeholders de login/cadastro atualizados.
- [ ] Tags de cursos e labels de dashboard.
- [ ] Mensagens de sucesso/erro e modais.
- [ ] Metadados de SEO (page titles, descriptions).
- [ ] Alt text de imagens e logos.
- [ ] Mensagens de sistema/chat automáticas.
