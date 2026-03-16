---
name: interactive-menu-persistence
description: Implementa e padroniza comportamentos de fechamento ao clicar fora (click-outside) e persistência de estado para dropdowns, menus e modais.
---

# Interactive Menu Persistence

Esta skill formaliza o padrão técnico para garantir que menus interativos (como o NotificationBell ou Perfis) fechem corretamente ao clicar fora de sua área e mantenham um comportamento de UI consistente.

## Quando usar
- Sempre que criar um componente que possua um estado "aberto/fechado" (dropdowns, popovers, select customizados).
- Quando o fechamento via overlay fixo falhar devido a `z-index` ou contextos de empilhamento.
- Para unificar a experiência de navegação em componentes flutuantes.

## Como usar (Passo a Passo)

### 1. Preparação do Container
Adicione um `useRef` ao componente pai que envolve tanto o gatilho (botão) quanto o conteúdo (menu).

```tsx
const menuRef = useRef<HTMLDivElement>(null);
// ...
return (
  <div className="relative" ref={menuRef}>
    {/* Trigger and Menu */}
  </div>
);
```

### 2. Implementação do Listener
Adicione um `useEffect` que monitore cliques no `document`.

```tsx
useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        // Se o clique foi fora do container (ref), fecha o menu
        if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
            setOpen(false);
        }
    };

    if (open) {
        document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
        document.removeEventListener('mousedown', handleClickOutside);
    };
}, [open]);
```

### 3. Remoção de Gambiarras (Overlays)
- O padrão **NÃO** deve utilizar `divs` com `fixed inset-0` para fechar o menu.
- A detecção deve ser puramente baseada em DOM via `ref.contains()`.

## Benefícios
- **Performance**: O listener só é ativado quando o menu está aberto.
- **Robustez**: Funciona independente de `z-index` complexos.
- **Acessibilidade**: Permite cliques em outros elementos interativos da página (fechando o menu e executando a ação do outro elemento simultaneamente).
