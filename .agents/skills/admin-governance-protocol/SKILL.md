---
name: admin-governance-protocol
description: Protocolo para gestão de acessos administrativos, sincronização de roles e configuração de parâmetros financeiros e de branding.
---

# Admin Governance Protocol

Este protocolo define os procedimentos para garantir a segurança e a integridade administrativa da plataforma PowerPlay, cobrindo autenticação, autorização e gestão de configurações críticas.

## Quando usar
- Ao conceder privilégios de administrador a um novo usuário.
- Ao diagnosticar problemas de visibilidade de menus administrativos.
- Ao atualizar taxas de repasse (commission) ou valores de planos de assinatura.
- Ao reestruturar a navegação do painel Admin.

## Procedimentos de Acesso

### 1. Conceder Acesso Admin
Para transformar um usuário em administrador, você deve:
1.  **Setar Custom Claims**: Usar o script de administração para definir `{ role: 'admin' }` no Firebase Auth.
2.  **Sincronizar Firestore**: Garantir que o documento do usuário na coleção `profiles` tenha o campo `role: "admin"`.
3.  **Verificar Lógica de Sessão**: O sistema deve priorizar as Claims (Token) em relação ao banco de dados para garantir acesso imediato.

### 2. Sincronização de Roles
Sempre que houver inconsistência entre as claims e o Firestore:
- Use o script `scripts/sync-admin-roles.js` para varrer os administradores e atualizar seus perfis.
- Verifique `src/lib/auth-utils.ts` para garantir que o `getServerSession` está extraindo o papel do token decodificado.

## Gestão de Configurações

### 1. Parâmetros Financeiros
As configurações financeiras estão localizadas em `/admin/financial` e utilizam as coleções `config/platform_settings` (taxas) e `config/plans` (preços).
- **Taxa da Plataforma**: Porcentagem retida pela plataforma em cada venda.
- **Planos de Assinatura**: Devem ser persistidos no Firestore para que o `SubscriptionsPage` reflita os valores dinamicamente.

### 2. Branding & Navegação
As configurações de identidade visual (logos, banners) estão em `/admin/settings`.
- **Diferenciação**: Não misture configurações de layout (banners) com configurações de negócio (taxas).
- **Sidebar**: Mantenha as categorias "Gestão de Repasses" e "Branding & Marketing" separadas no `AdminSidebar.tsx`.

## Verificação de Segurança
- Sempre verifique o `AdminLayout.tsx` para garantir que as rotas `/admin/*` estão protegidas por uma verificação de lado do servidor (`getSessionUser`).
- Garanta que ícones de alerta (como `ShieldAlert`) sejam usados para ações sensíveis.
