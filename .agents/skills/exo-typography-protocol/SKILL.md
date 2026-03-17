---
name: exo-typography-protocol
description: Mantém a padronização visual do modelo EXO (Headlines, Subtitles e Body) em todo o projeto, garantindo consistência com a identidade visual PowerPlay.
---

# Protocolo de Tipografia EXO

Este protocolo formaliza o uso da fonte **Exo** como o padrão único da plataforma, definindo pesos e estilos específicos para diferentes hierarquias de texto.

## Checklist de Padronização

- [ ] **Remoção de Fontes Estrangeiras**: Eliminar qualquer referência a `Inter`, `Geist`, `Roboto` ou fontes genéricas em estilos inline ou classes CSS.
- [ ] **Headlines (H1, H2)**: 
    - Fonte: `Exo` (var(--font-exo)).
    - Peso: `900` (Black).
    - Estilo: `Italic`.
    - Transformação: `uppercase`.
    - Espaçamento: `letter-spacing: -0.02em`.
- [ ] **Subtítulos e Texto de Apoio**:
    - Garantir herança da fonte `Exo` definida no `body`.
    - Usar pesos `700` (Bold) para ênfase e `400` para corpo de texto.
- [ ] **Tailwind CSS**: Sempre que possível, utilizar a classe utility `font-exo`.

## Quando usar

- Ao criar uma nova página ou componente de interface.
- Ao realizar manutenções em layouts existentes que pareçam "fora do padrão" visual.
- Durante processos de rebranding ou refinamento estético.

## Como usar

1. **Varredura**: Execute um `grep_search` por "fontFamily" ou fontes comuns (Inter, Geist) para identificar vazamentos.
2. **Correção de Títulos**: Aplique os estilos itálico e black (900) em títulos de destaque (Ex: "TREINAMENTOS EM DESTAQUE").
3. **Verificação de Layout**: Certifique-se de que o arquivo `src/app/layout.tsx` continua injetando a fonte EXO via Next.js Font Optimization.

## Referência Visual (EXO Model)

```css
/* Exemplo de aplicação em Headline */
h1 {
  font-family: var(--font-exo);
  font-weight: 900;
  font-style: italic;
  text-transform: uppercase;
}
```
