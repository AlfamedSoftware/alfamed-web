# Autenticação e Navegação

## Visão Geral

Este documento cobre o fluxo completo de autenticação, seleção de unidade, proteção de rotas e navegação via sidebar. A autenticação é baseada em cookies via **Better Auth**; o acesso às funcionalidades depende da unidade e do papel selecionados na sessão.

---

## Estrutura de Arquivos

```
src/
├── pages/
│   ├── SignIn/
│   │   ├── sign-in.tsx                          # Login de usuário
│   │   └── admin-sign-in.tsx                    # Login da área interna (ServiceDesk)
│   ├── ResetPassword/
│   │   └── reset-password.tsx                   # Redefinição de senha via token
│   ├── SelecaoUnidade/
│   │   └── selecao-unidade.tsx                  # Seleção de unidade pós-login
│   └── Default/
│       └── default.tsx                          # Wrapper do layout com sidebar
├── layouts/
│   ├── default-layout.tsx                       # Container raiz do layout
│   └── sidebar-layout.tsx                       # Layout com AppSidebar + SidebarBootstrap
├── components/
│   ├── app-sidebar.tsx                          # Sidebar de navegação principal
│   └── ProtectRoute/
│       ├── protected-route.tsx                  # Guard: sessão existente
│       ├── unit-protected-route.tsx             # Guard: unidade selecionada
│       └── internal-protected-route.tsx         # Guard: domínio @alfamed.com
├── contexts/
│   ├── session-unit-context.tsx                 # Estado global de unidade e papel
│   └── sidebar-menu-context.tsx                 # Estado dos papéis do menu
├── hooks/
│   ├── use-session.tsx                          # Hook de leitura da sessão
│   └── use-unit-parameters.ts                  # Hook de parâmetros de módulos da unidade
└── lib/
    ├── auth.ts                                  # Configuração do cliente Better Auth
    └── api-client.ts                            # Wrapper de fetch autenticado
```

---

## Fluxo Geral de Autenticação

```
/login (sign-in.tsx)
  └── POST /auth/signIn.email
        └── sucesso → /session (selecao-unidade.tsx)
              ├── 1 unidade disponível → auto-seleciona → /home
              └── N unidades → usuário escolhe → POST /session/select-unit → /home

/reset-password?token=X (reset-password.tsx)
  └── GET /auth/validate-reset-token/:token
        ├── token inválido → exibe erro
        └── token válido → exibe formulário → POST /auth/reset-password → /sign-in

/admin/login (admin-sign-in.tsx)
  └── POST /auth/signIn.email → sucesso → /admin/unidades
```

---

## Páginas de Autenticação

### Login de Usuário (`sign-in.tsx`)

**Campos:**

| Campo  | Validação        |
|--------|------------------|
| Email  | String (sem validação de formato) |
| Senha  | String           |

**Erros mapeados:**

| Código HTTP | Mensagem exibida                  |
|-------------|-----------------------------------|
| 401 (conta inativa) | "Sua conta foi desativada" |
| 401 / 400 (credenciais) | "Email ou senha inválidos" |

- Após login com sucesso, redireciona para `/session`.
- Possui link "Esqueci minha senha" que abre o diálogo `ForgotPasswordDialog`.
- Quando redirecionado por sessão expirada (`?motivo=sessao-expirada`), exibe banner vermelho no topo da tela: "Sua sessão expirou por inatividade. Faça login novamente para continuar."

---

### Login da Área Interna (`admin-sign-in.tsx`)

Mesma estrutura do login de usuário, com diferenças:
- Validação de e-mail mais estrita (formato obrigatório).
- Redireciona para `/admin/unidades` após sucesso.
- Exibe badge "Área Interna" e branding ServiceDesk.
- Erro único: "Credenciais inválidas para a área interna".

---

### Redefinição de Senha (`reset-password.tsx`)

**Fluxo:**
1. Token é lido da URL e validado via `GET /auth/validate-reset-token/{token}` ao montar.
2. Se inválido: exibe erro com opção de solicitar novo link.
3. Se válido: exibe formulário com dois campos de senha.
4. Após salvar com sucesso: exibe confirmação e redireciona para `/sign-in` após **3 segundos**.

**Validação (Zod):**

```ts
{
  password: z.string()
    .min(8)
    .regex(/[A-Z]/)   // ao menos 1 maiúscula
    .regex(/[a-z]/)   // ao menos 1 minúscula
    .regex(/[0-9]/),  // ao menos 1 número
  confirmPassword: z.string()
  // refinamento: password === confirmPassword
}
```

- Requisitos exibidos em tempo real com checklist visual.
- Campos com toggle show/hide.

---

## Seleção de Unidade (`selecao-unidade.tsx`)

Executada imediatamente após o login, antes do acesso às funcionalidades.

**Fluxo:**

1. `GET /session/list-units-acessable-by-professional` — lista unidades acessíveis ao profissional.
2. Se **1 unidade**: auto-seleciona e navega para `/home` (disparado apenas uma vez via `useRef`).
3. Se **N unidades**: exibe dropdown para seleção manual.
4. Ao confirmar: `POST /session/select-unit { unitId }` → atualiza sessão → navega para `/home`.

**Estados de erro:**

| Situação                      | Mensagem                                      |
|-------------------------------|-----------------------------------------------|
| Nenhuma unidade encontrada    | "Nenhuma unidade vinculada ao usuário"        |
| Falha ao carregar unidades    | "Erro ao carregar unidades da sessão"         |
| Falha ao selecionar unidade   | "Erro de conexão ao selecionar unidade"       |

- O botão **Sair** chama `auth.signOut()` e redireciona para `/login`.

---

## Guards de Rota

### `ProtectedRoute`

- Verifica se existe sessão ativa.
- Sem sessão → redireciona para `/login`.
- Exibe loading em tela cheia durante verificação.

### `UnitProtectedRoute`

- Verifica se `selectedUnitId` **e** `selectedProfessionalUnitId` estão presentes no contexto.
- Se ausentes → redireciona para `/session` (seleção de unidade).
- Usado em todas as rotas funcionais da aplicação.

### `InternalProtectedRoute`

- Verifica sessão + se o e-mail termina em `@alfamed.com`.
- Fora do domínio → redireciona para `/admin/login`.
- Usado exclusivamente nas rotas `/admin/*`.

### Mapa de Rotas

```
/login                         → SignIn
/admin/login                   → AdminSignIn
/reset-password                → ResetPassword

/session                       → ProtectedRoute
                                     └── SelecaoUnidade

/                              → ProtectedRoute
                                     └── UnitProtectedRoute
                                           └── Default (sidebar layout)
                                                 ├── /home
                                                 ├── /perfil
                                                 ├── /unidade
                                                 ├── /profissionais (+ CRUD)
                                                 ├── /procedimentos (+ CRUD)
                                                 ├── /especialidades (+ CRUD)
                                                 ├── /agendas (+ agendamentos)
                                                 ├── /atendimentos (+ detalhes)
                                                 ├── /prontuario
                                                 └── /gestao-exames/listar-pendentes (+ detalhes)

/admin                         → ProtectedRoute
                                     └── InternalProtectedRoute
                                           └── Default (sidebar layout)
                                                 ├── /admin/unidades
                                                 ├── /admin/unidades/:id
                                                 ├── /admin/upm
                                                 └── /admin/upm/usuarios/:id
```

---

## Sidebar (`app-sidebar.tsx`)

### Comportamento de Loading

Enquanto qualquer um destes estados estiver carregando — sessão do usuário (`isLoading`), unidade da sessão (`isSessionUnitLoading`) ou papéis do menu (`isMenuRolesLoading`) — o sidebar exibe skeletons: **3 itens** no menu e um footer customizado (círculo pulsante + 2 linhas de texto + ícone de chevron). O conteúdo real substitui os skeletons assim que todos os dados estão prontos.

### Arquitetura dos Menus

Cada contexto tem seu próprio componente, todos com a mesma interface `{ isMenuItemActive }`. Os itens do menu ficam definidos dentro de cada componente:

| Componente                    | Quando é renderizado                                    |
|-------------------------------|---------------------------------------------------------|
| `AdminSidebarMenu`            | URL começa com `/admin/` (detecção por rota)            |
| `AdministrativeSidebarMenu`   | `menuRoles` contém `"administrative"` ou `"internal_alfamed"` |
| `MedicSidebarMenu`            | `menuRoles` contém `"medic"`                            |
| `AssistantSidebarMenu`        | `menuRoles` contém `"administrative_assistant"`         |
| `TechnicalExecutorSidebarMenu`| `menuRoles` contém `"technical_executor"`               |
| Mensagem "Nenhum cargo"       | Nenhum role reconhecido                                 |

> A área `/admin/*` é protegida por `InternalProtectedRoute` e o `SidebarBootstrap` define `menuRoles = []` nela — por isso a seleção do menu admin é feita via URL, não via role.

### Itens por Papel

| Papel / Contexto           | Itens                                                                        |
|----------------------------|------------------------------------------------------------------------------|
| Admin (`/admin/*`)         | Central de Unidades, UPM                                                     |
| `administrative`           | Início, Unidade, Profissionais, Especialidades, Procedimentos, Agendas       |
| `medic`                    | Início, Agendas, Atendimentos, Prontuário                                    |
| `administrative_assistant` | Início, Agendas + **Exames** _(condicional, rota `/gestao-exames/listar-pendentes`)_ |
| `technical_executor`       | **Todos os itens condicionais** — dependem de `modulo1GestaoExames`. Quando ativo: Início, Atendimentos _(em desenvolvimento, rota `/atendimentosgestao`)_ |

### Menus Condicionais por Parâmetro de Unidade

`AssistantSidebarMenu` e `TechnicalExecutorSidebarMenu` consultam `GET /unit-parameters/get-parameters/:unitId` via `useUnitParameters` ao montar, verificando `modulo1GestaoExames`.

| Papel                      | Carregando   | `modulo1GestaoExames = true`                             | `modulo1GestaoExames = false`                                                                                |
|----------------------------|--------------|----------------------------------------------------------|--------------------------------------------------------------------------------------------------------------|
| `administrative_assistant` | 3 skeletons  | Itens base + **Exames** (`/gestao-exames/listar-pendentes`) | Apenas itens base (Início, Agendas)                                                                       |
| `technical_executor`       | 3 skeletons  | **Início**, **Atendimentos** _(em desenvolvimento)_      | Mensagem: _"O módulo de Gestão de Exames está desativado. Para contratar, entre em contato com a Alfamed."_ |

> Para `technical_executor`, **todos** os itens do menu dependem do parâmetro — nada é exibido enquanto carrega, e nenhum item aparece se o módulo estiver desativado.

- Os demais componentes (`AdminSidebarMenu`, `AdministrativeSidebarMenu`, `MedicSidebarMenu`) não consultam esse endpoint.

### Lógica de Item Ativo

- Correspondência exata ou por prefixo (`startsWith`) usando `location.pathname`.
- Rota de vínculo de especialidade com profissional (`?isSpecialtyLink=true`) → ativo em `/profissionais`.

### Rodapé do Sidebar

Exibe um botão que abre um `DropdownMenu`:
- Avatar com inicial do nome do usuário (círculo com cor `sidebar-primary`).
- Nome completo do usuário (fallback: "Usuário").
- Nome da unidade selecionada (fallback: "Unidade selecionada") — ou "ServiceDesk" na área admin.

O dropdown exibe nome + unidade + cargo (`Cargo: <label>`) e as ações abaixo.

**Durante o loading inicial**, o footer exibe um skeleton customizado: círculo pulsante + duas linhas de texto + ícone de chevron.

Dropdown com ações:
- **Perfil** → `/perfil` (apenas área não-admin).
- **Trocar unidade** → `/session` (apenas área não-admin).
- **Sair** → `auth.signOut()`.

---

## Layout com Sidebar (`sidebar-layout.tsx`)

Contém o componente `SidebarBootstrap`, responsável por:

1. Detectar se está na área admin → define `menuRoles` como `[]`.
2. Buscar papéis via `GET /session/list-units-acessable-by-professional`.
3. Detectar variante `internal_alfamed` → concede visibilidade total do menu.
4. Atualizar o contexto `SidebarMenuContext` com os papéis do profissional.

---

## Contextos de Estado

### `SessionUnitContext`

Disponível globalmente (exceto em rotas públicas como `/login`, `/reset-password`).

```ts
{
  selectedUnitId?: string
  selectedUnitName?: string
  selectedProfessionalUnitId?: string
  selectedRoles?: {
    id: string
    description: string
    key: string
  }
  refreshSessionUnit: () => Promise<void>
}
```

- `refreshSessionUnit()` é chamado após a seleção de unidade para sincronizar o contexto.
- Rotas públicas ignoradas: `/login`, `/admin/login`, `/reset-password`, `/sign-in`, `/session`, `/admin`.

### `SidebarMenuContext`

```ts
{
  menuRoles: string[]           // roleKeys visíveis no menu
  isMenuRolesLoading: boolean
}
```

---

## Infraestrutura de Requisições (`api-client.ts`)

Wrapper sobre `fetch` que:
- Inclui `credentials: "include"` (cookies de sessão).
- Adiciona `Content-Type: application/json` automaticamente em `POST`/`PUT`/`PATCH`.
- **401** → redireciona para `/login?motivo=sessao-expirada` (uma única vez por ciclo de vida, via flag de módulo `isRedirectingToLogin`). Na tela de login, um banner vermelho no topo informa que a sessão expirou por inatividade.
- **Resposta não-ok** → parseia JSON de erro e lança exceção.
- **204 / corpo vazio** → retorna `undefined`.

---

## API Calls do Fluxo

| Endpoint                                                     | Usado em                        |
|--------------------------------------------------------------|---------------------------------|
| `POST /auth/signIn.email`                                    | Login (usuário e admin)         |
| `POST /auth/signOut`                                         | Logout                          |
| `GET /auth/validate-reset-token/{token}`                     | Validação de token de reset     |
| `POST /auth/reset-password`                                  | Redefinição de senha            |
| `GET /session/list-units-acessable-by-professional`          | Seleção de unidade + bootstrap do menu |
| `POST /session/select-unit`                                  | Confirmar unidade selecionada   |
| `GET /session/get-session-unit`                              | Carregar contexto de unidade    |
| `GET /unit-parameters/get-parameters/:unitId`               | Parâmetros de módulos da unidade (sidebar `assistant` e `technical_executor`) |
