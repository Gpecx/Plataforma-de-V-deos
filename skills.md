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

## 2. Synchronized Dashboard Profile Management (Gestão de Perfil Sincronizado)

**Objetivo:** Criar um formulário de dashboard que atualiza uma coleção central de perfis, garantindo a sincronização de dados (bio, especialidade, links sociais, avatar) com a página pública e tratando a serialização de dados não primitivos (como Timestamps).

**Tecnologias:** Next.js (Server & Client Components), Firestore (Firebase Admin), Cloud Storage, Tailwind CSS.

**Variáveis Dinâmicas:**
- `{{DASHBOARD_ROUTE}}`: Rota do dashboard (ex: `/dashboard-teacher/profile`).
- `{{ACTION_UPDATE}}`: Nome da Server Action de atualização (ex: `updateTeacherProfile`).
- `{{PROFILE_COLLECTION}}`: Nome da coleção de perfis (ex: `profiles`).
- `{{STORAGE_PATH}}`: Caminho para upload de fotos (ex: `profile-images/`).

### Procedimento Passo a Passo:

**Passo 1: Server Action com Guard de Role**
Crie uma Server Action que verifique a sessão do usuário e restrinja a edição apenas ao próprio `uid`. Valide o `role` (ex: `teacher` ou `admin`) para evitar edições não autorizadas.
```tsx
export async function {{ACTION_UPDATE}}(data: any) {
    const session = await getServerSession();
    if (!session || (session.role !== 'teacher' && session.role !== 'admin')) {
        throw new Error('Não autorizado');
    }
    await adminDb.collection('{{PROFILE_COLLECTION}}').doc(session.uid).update({ ...data, updated_at: new Date().toISOString() });
}
```

**Passo 2: Resolução de Serialização (Server Component)**
No Server Component da página (`page.tsx`), busque os dados do Firestore e **converta-os em um objeto plano**. Timestamps do Firestore causam erro em Client Components se passados diretamente.
```tsx
const raw = profileDoc.exists ? profileDoc.data() : null;
const initialData = raw ? {
    full_name: raw.full_name || '',
    specialty: raw.specialty || '',
    bio: raw.bio || '',
    avatar_url: raw.avatar_url || '',
    // Links sociais extraídos individualmente
} : null;
```

**Passo 3: Client Form com Estado e Upload**
Crie um Client Component (`ClientProfileForm.tsx`) que receba os dados hidratados. Implemente o upload de imagem usando helpers de storage, atualizando o estado local do `avatarUrl` antes de salvar o perfil completo. Use `router.refresh()` após o sucesso para invalidar o cache do Server Component.

**Passo 4: Mapeamento de Links Sociais**
Inclua campos para URLs de redes sociais agrupados em uma seção dedicada. Use ícones (`Lucide`) condizentes com cada rede (LinkedIn, Twitter, YouTube) para facilitar a identificação visual.

**Passo 5: Feedback de Carregamento**
Sempre utilize estados de `isSaving` ou `isUploading` com spinners (`Loader2`) nos botões de ação para evitar cliques duplos e informar o progresso ao usuário.
