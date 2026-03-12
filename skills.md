# Minhas Skills Customizadas

## 1. Responsive Sticky Profile Layout (Perfil com Sidebar Fixa)

**Objetivo:** Criar uma página de perfil (ex: Instrutor, Usuário) com duas colunas, onde o conteúdo principal rola normalmente e a sidebar direita (com foto e contatos) fica fixa na tela usando CSS nativo (`position: sticky`), compatível com filtros globais.

**Tecnologias:** Next.js (App Router), Tailwind CSS, Shadcn UI, {{DATABASE_PROVIDER}} (ex: Firebase Admin).

**Variáveis Dinâmicas:**
- `{{PROFILE_ROUTE}}`: Rota da página (ex: `/professor/[id]`).
- `{{PRIMARY_COLOR}}`: Cor principal de destaque (ex: `#00C402`).
- `{{COLLECTION_NAME}}`: Nome da coleção no banco de dados (ex: `users` ou `instructors`).
- `{{PROFILE_TAG}}`: Etiqueta ou título superior (ex: `INSTRUTOR ORIGINAL`).
- `{{SIDEBAR_WIDTH}}`: Largura fixa da sidebar (ex: `280px`).
- `{{TOP_OFFSET}}`: Distância do topo para a sidebar grudar (ex: `top-24`).

### Procedimento Passo a Passo:

**Passo 1: Estrutura de Busca de Dados (Backend)**
Crie uma Server Action (ex: em `src/app/actions/{{COLLECTION_NAME}}.ts`) usando {{DATABASE_PROVIDER}} para buscar os dados de perfil e estatísticas (agregadas).
Se houver listas de itens (ex: cursos), implemente paginação limitando o retorno inicial (ex: 10 itens) e retornando um `lastId` para "Carregar mais".

**Passo 2: Configuração do Layout Container (Page e Profile Component)**
Renderize o componente principal garantindo que nenhum ancestral possua `overflow: hidden` ou propriedades como `filter` diretamente no wrapper que quebrem o empilhamento do CSS. A página deve renderizar no contexto da raiz.

**Passo 3: Construção do Grid de 2 Colunas**
No container da página, utilize CSS Grid puro para as duas colunas:
```tsx
<div className="grid grid-cols-1 lg:grid-cols-[1fr_{{SIDEBAR_WIDTH}}] gap-12 items-start">
    {/* Conteúdo à esquerda rola junto com a página */}
    <main className="min-w-0 space-y-12">
        ...
    </main>

    {/* Sidebar à direita - Deve estar visível e ser flex/block com self-start */}
    <aside className="hidden lg:flex flex-col sticky {{TOP_OFFSET}} self-start">
        ...
    </aside>
</div>
```
*Crucial:* O uso de `.items-start` no grid ou `.self-start` no `aside` impede que a sidebar estique para ter a mesma altura da coluna principal, permitindo que o `position: sticky` encontre espaço para rolar.

**Passo 4: Estrutura Interna da Sidebar**
Na sidebar, a foto deve ter dimensões estáticas absolutas usando utilitários do Tailwind (ex: `w-[200px] h-[200px] shrink-0`). Mantenha os ícones sociais ou botões organizados em linhas abaixo usando `flex flex-wrap`. Adicione botões com as variações do componente do Shadcn UI ou um wrapper consistente.

**Passo 5: Detalhes Visuais (Clean Design)**
- Mantenha sombras sutis em cards `.shadow-sm` mudando para `.shadow-lg` no hover.
- Elementos realçados e botões devem utilizar a cor primária `text-[{{PRIMARY_COLOR}}]` ou backgrounds configurados.
- Sempre utilize o padrão de fontes e tipografia do projeto globalmente.
