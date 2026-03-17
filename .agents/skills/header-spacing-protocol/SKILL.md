---
name: header-spacing-protocol
description: Padroniza o espaçamento superior de páginas (pt-8 no header) para evitar que o conteúdo fique colado ao menu de navegação global.
---

# Protocolo de Espaçamento no Topo

Esta skill define o padrão de espaçamento inicial (`padding-top`) para os headers das páginas internas (painéis de professor, aluno, etc.), garantindo que o conteúdo da página não fique "grudado" ou muito próximo à barra de navegação superior (Navbar).

## Quando usar

- Quando criar novas páginas de dashboards, painéis ou visualizações que fiquem logo abaixo da Navbar global.
- Quando o usuário solicitar que o conteúdo está "muito perto do menu" ou "muito colado".
- Ao padronizar layouts existentes que estejam usando `pt-0` ou espaçamentos muito pequenos no topo.

## Como usar

1. **Localizar o Header**: Encontre a tag `<header>` que engloba o título principal da página.
2. **Aplicar a Classe**: Modifique as classes de utilitário Tailwind no header, substituindo `pt-0` (ou similar) por **`pt-8`**.
3. **Manter as outras margens**: Mantenha os paddings laterais e margens inferiores padrão do projeto (ex: `px-4 md:px-8 mb-12`).

### Exemplo de Aplicação (React/Tailwind)

**Antes (Errado):**
```tsx
<header className="flex flex-col md:flex-row justify-between items-start md:items-center pt-0 px-4 md:px-8 mb-12 gap-8">
    <h1 className="text-3xl font-black">Meu Título</h1>
</header>
```

**Depois (Correto):**
```tsx
<header className="flex flex-col md:flex-row justify-between items-start md:items-center pt-8 px-4 md:px-8 mb-12 gap-8">
    <h1 className="text-3xl font-black">Meu Título</h1>
</header>
```
