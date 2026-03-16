---
name: netflix-landing-redesign
description: Transforma uma landing page tradicional em uma experiência imersiva inspirada na Netflix, com tema escuro (dark mode), hero section em tela cheia com overlay, cards dark e CTAs de alto contraste.
---

# Skill: Netflix-Style Landing Page Redesign

Use esta skill para converter landing pages padrão (claras) em interfaces imersivas focadas em conversão, inspiradas no design de plataformas de streaming (como a Netflix).

## Quando usar
- Quando o usuário solicitar um tema escuro ou "dark mode" para uma landing page.
- Quando o objetivo for criar uma página de estilo "Netflix", "Spotify" ou plataforma de cursos premium.
- Para aumentar o impacto visual e direcionamento de conversão em páginas de captura (leads).

## Variáveis a Identificar
- `{{BACKGROUND_COLOR}}`: Cor de fundo principal (ex: `#0d2b17`, `#0f0f0f`).
- `{{ACCENT_COLOR}}`: Cor de destaque para botões e detalhes (ex: `#32cd32`, `#e50914`).
- `{{HERO_IMAGE}}`: A imagem principal da Hero Section.

## Como usar (Passo a Passo)

### 1. Preparação Global (Contexto Dark)
1. Modifique ou crie variáveis de tema no CSS principal (ex. `globals.css`).
2. Defina o fundo do `body` para a `{{BACKGROUND_COLOR}}` e o texto para cores claras (ex. `#f1f5f9` para títulos, `#cbd5e1` para textos).
3. **Cuidado:** Remova regras globais de design claro (como forçar `.bg-white` em todos os cards) para evitar conflitos.

### 2. A Hero Section (O Coração do Design)
1. Crie uma seção com `min-height: 100vh`.
2. O fundo deve ser a imagem `{{HERO_IMAGE}}` com `background-size: cover` e `background-position: center`.
3. **Obrigatório:** Adicione um overlay (camada escura sobre a imagem). Use um `linear-gradient` indo de uma transparência (ex: `rgba(0,0,0,0.5)`) no topo até a cor sólida `{{BACKGROUND_COLOR}}` no rodapé da seção. Isso garante que o texto fique legível e a transição para a próxima seção seja invisível.

### 3. Tipografia e Call to Action (CTA)
1. Centralize a proposta de valor.
2. Títulos devem ser enormes, com peso máximo (`font-black` ou `900`), `uppercase` e levemente comprimidos (`letter-spacing` negativo).
3. O botão de CTA deve saltar aos olhos usando a `{{ACCENT_COLOR}}`. Aplique um hover effect (zoom sutil ou brilho/shadow) para convite ao clique.

### 4. Cards e Blocos Secundários
1. Crie seções subsequentes (ex: Benefícios, Cursos) mantendo a `{{BACKGROUND_COLOR}}`.
2. Estruture "Cards" flutuantes usando uma cor levemente mais clara que o fundo (ex: um fundo preto translúcido ou um tom bem escuro como `#1a3823`).
3. Bordas devem ser finíssimas (1px) e usar a `{{ACCENT_COLOR}}` com baixíssima opacidade (ex. 15%).
4. Adicione efeitos interativos (Hover): elevação (`translateY`), e glow sombra.

### 5. Consistência e Revisão
1. Garanta que todas as fontes fiquem legíveis (cuidado com cinzas muito escuros sobre fundos escuros).
2. Onde houver ícones, pinte-os com a `{{ACCENT_COLOR}}`.
3. Certifique-se de que a responsividade (mobile) mantém as proporções hero-size e os modais/dropdowns respeitem a temática dark.
---

name: safe-code-modifier

description: Use esta skill SEMPRE que for modificar, refatorar ou adicionar código a um arquivo que já existe e possui funcionalidades rodando.

---
 
### Diretrizes de Modificação Segura e Preservação de Código
 
1. **Leia Antes de Tocar:** Antes de sugerir qualquer alteração, analise o contexto do arquivo atual. Compreenda o fluxo de dados, as regras de negócios existentes e as dependências importadas.

2. **Edição Cirúrgica (Não reescreva tudo):** NUNCA reescreva o arquivo inteiro apenas para mudar poucas linhas. Mostre apenas o bloco modificado e indique claramente onde ele deve ser inserido, substituído ou importado.

3. **Preservação Absoluta:** Não remova lógicas, validações ou integrações a menos que seja explicitamente solicitado. Assuma que estruturas complexas estão lá por um motivo e mantenha-as intactas.

4. **Consistência de Design e Temas:** Mantenha os padrões visuais e a arquitetura do projeto. Se o projeto utiliza temas visuais específicos com paletas customizadas ou componentes padronizados, siga estritamente o modelo já presente, sem introduzir estilos ou cores genéricas.

5. **Verificação de Impacto:** Avalie se a alteração solicitada causará quebras em outros componentes que dependam dessas funções. Caso exista esse risco de quebra de contrato, emita um alerta antes de fornecer o código.
 
---

name: firebase-backend-architect

description: Use esta skill sempre que for criar, estruturar ou modificar bancos de dados no Firebase (Firestore), Cloud Functions, Authentication ou regras de segurança.

---
 
### Diretrizes para Arquitetura Firebase
 
1. **Modelagem Orientada a Leitura:** Estruture os dados do Firestore pensando nas consultas (reads). Evite aninhamentos profundos e limite o uso de subcoleções a casos estritamente necessários. Use referências de IDs para relacionar documentos, visando alta performance e escalabilidade.

2. **Sistemas Complexos:** Projete a estrutura de dados prevendo alta complexidade, permitindo que a arquitetura suporte facilmente plataformas robustas — como Sistemas Operacionais de Negócios com múltiplos espaços, hierarquias de permissão e visualizações salvas, ou sistemas educacionais modulares baseados em gamificação.

3. **Segurança Default:** SEMPRE que criar uma nova coleção ou sugerir um novo modelo de dados, forneça junto as **Security Rules** (Regras de Segurança) do Firestore correspondentes. O banco nunca deve ser desenhado com acesso global aberto.

4. **Cloud Functions de Responsabilidade Única:** Para lógicas pesadas, crie funções serverless modulares e independentes. Isole o processamento de regras complexas no backend para manter a interface do usuário rápida e leve.

5. **Tratamento de Erros e Logs:** Todo código de backend gerado deve incluir blocos `try/catch` padronizados, garantindo que exceções sejam tratadas de forma segura e retornem mensagens claras para consumo no frontend.
 
---

name: logic-flow-engineer

description: Use esta skill para planejar e implementar fluxos de dados, otimização de requisições e comunicação entre o front-end e o back-end.

---
 
### Diretrizes para Integração
 
1. **Planejamento Lógico:** Antes de codificar a integração em si, defina mentalmente um passo a passo de como a informação sairá da ação do usuário e chegará ao banco de dados de forma segura.

2. **Otimização de Custos (Reads/Writes):** Desenvolva lógicas que evitem leituras excessivas no banco de dados. Implemente paginação para listas extensas, recomende estratégias de cache local ou utilize listeners em tempo real (`onSnapshot`) apenas onde a sincronia imediata justificar o custo operacional.

3. **Desacoplamento:** Separe estritamente as regras de acesso a dados da camada de interface. Estruture chamadas de backend dentro de serviços isolados ou hooks customizados, mantendo os componentes de tela limpos e focados apenas em renderização.
 