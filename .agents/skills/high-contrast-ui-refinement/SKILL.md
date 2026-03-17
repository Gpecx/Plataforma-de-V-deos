---
name: high-contrast-ui-refinement
description: Aplica refinamentos de alto contraste e legibilidade em campos monetários e botões, garantindo separação visual clara.
---

# High-Contrast UI Refinement Skill

Esta habilidade formaliza o processo de melhorar a legibilidade e o contraste visual em componentes de interface, focando em separação de símbolos e destaque de ações principais.

## Quando usar
- Quando símbolos de moeda (R$, $, etc.) estiverem colados ao valor numérico.
- Quando botões de ação (Salvar, Cancelar, Adicionar) estiverem "apagados" ou com baixo contraste em relação ao fundo.
- Quando for necessário reforçar a estética "Premium Industrial" com branco puro e alto contraste.

## Como usar

### 1. Refinamento de Campos Monetários
Para garantir que o prefixo da moeda não atrapalhe a leitura do valor:
- Use `relative` container para o input.
- Posicione o símbolo com `absolute` e dê um padding horizontal generoso ao input (ex: `pl-24` se o símbolo estiver à esquerda).
- Garanta que o símbolo tenha contraste total (ex: `text-white` ou cor de destaque da marca).

### 2. Botões de Alto Contraste
Para botões que precisam de visibilidade máxima:
- **Botões Primários (Salvar, Confirmar)**: Use `bg-white text-black border-white`. No hover, use uma leve redução de opacidade ou brilho (ex: `hover:bg-white/90`).
- **Botões Secundários (Cancelar, Voltar)**: Use `bg-transparent border-white text-white`. No hover, adicione um fundo sutil (ex: `hover:bg-white/10`).
- **Botões de Ação de Bloco (+ Novo, Adicionar)**: Siga o padrão dos primários ou secundários dependendo da hierarquia na página.

## Checklist de Verificação
- [ ] O símbolo da moeda tem um espaço de respiro claro antes do primeiro dígito?
- [ ] O texto do botão é legível sem esforço contra o fundo?
- [ ] O estado de hover mantém o alto contraste?
- [ ] A consistência visual é mantida entre botões da mesma hierarquia na página?
