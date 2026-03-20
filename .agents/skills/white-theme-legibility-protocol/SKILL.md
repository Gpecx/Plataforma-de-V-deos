---
name: white-theme-legibility-protocol
description: Garante legibilidade de alto contraste no tema "White Clean", forçando textos contra conflitos do CSS global e adicionando contornos pretos sólidos em formulários.
---

# Protocolo de Legibilidade do Tema "White Clean"

## Quando usar
- Ao criar, migrar ou debugar páginas de "dashboard" ou outras telas claras (fundo branco) pertencentes ao tema "White Clean".
- Quando textos (especialmente tags como `h1`, `h2`, `h3` até `h6` e parágrafos `p`) aparecerem esbranquiçados, invisíveis ou muito claros ("apagados").
- Quando um layout transparente ou de baixo contraste exigir um "contorno de formulário" com linhas pretas ou mais sólidas.

## Qual é o Problema
O arquivo `src/app/globals.css` possui regras globais na raiz (`h1,h2,p { color: white/lightgray }`) que foram criadas para o layout escuro original (Premium Dark). Em páginas brancas, essas regras conflitam com classes utilitárias base (como `text-slate-900`) e "engolem" a cor, deixando o texto invisível ou apagado.

## Como resolver e aplicar o Protocolo (Passo a passo)

1. **Textos e Títulos (Sobrescrita do Global)**:
   - Em títulos (`h1`, `h2`, etc.), troque a classe `text-slate-900` por `!text-black` ou `!text-slate-900`. 
   - Em parágrafos (`p`) ou legendas, substitua `text-slate-600` ou similar por `!text-black` (se o contraste máximo for exigido) ou `!text-slate-800`.
   - *Por que não alterar o `globals.css` diretamente?* Pois alterar as regras globais pode quebrar o layout da *Landing Page* ou telas que ainda usam o tema "Dark Premium" (geralmente sob a pasta `/(marketing)`).

2. **Formulários e Inputs (Contornos Sólidos)**:
   - Identifique as linhas dos formulários (normalmente as bordas das tags `<Input>` e `<Textarea>`).
   - Mude os contornos de cinza ou tema (ex: `border-slate-200` ou `border-[#1D5F31]`) diretamente para `border-black` ou `!border-black`.

3. **Foco Visível (Inputs)**:
   - Certifique-se de que ao clicar no input, ele não mude para algo ilegível.
   - Ajuste `focus-visible:border-[COR]` para algo de alto contraste, como `focus-visible:border-black`.

4. **Botões e Ações (`<Button />`, `<Link />`)**:
   - Os botões também devem herdar o visual de legibilidade "Duro" e "Sólido" deste perfil.
   - Se o botão tiver `border-slate-200` ou nenhuma borda, insira e force um contorno através de `border border-black`.
   - Se os botões forem vazados (fundo branco / texto colorido), modifique para contorno preto (`bg-white border !border-black`).

5. **Containers ou "Caixas" de Seção**:
   - Elementos em volta de todo o formulário (ex: `<section className="bg-white border ...">`) também devem ter seus estilos harmonizados. Substitua o `border-slate-200` da seção inteirinha por `border-black` se a consistência do traço for requisitada.
