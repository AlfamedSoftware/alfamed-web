# Alfamed Web

Frontend da aplicação Alfamed (React + TypeScript + Vite).

> **Agentes de IA:** leia também [`AGENTS.md`](./AGENTS.md) — fluxos de auth, guards, cookies e Service Desk.

## Requisitos

- Node.js 20+
- npm 10+
- API rodando (repositório `alfamed-api`, porta **3333** em dev)

## Instalação

```bash
npm install
```

## Variáveis de ambiente

Use `.env.example` como referência.

```env
VITE_API_URL=http://localhost:3333
VITE_API_PROXY_TARGET=http://localhost:3333
```

| Variável | Descrição |
|----------|-----------|
| `VITE_API_URL` | Base da API e do client Better Auth (`src/lib/auth.ts`). Se vazio: localhost → `http://localhost:3333`; produção → `https://alfamed-api-dev.vercel.app` |
| `VITE_API_PROXY_TARGET` | Apenas dev — alvo do proxy Vite (`/api`, `/health`) |

**Não use porta 3000** para a API local — o backend sobe em **3333** (`bun run dev`).

## Execução

```bash
npm run dev      # http://localhost:5173
npm run build
npm run preview
npm run lint
```

## Conexão com a API

- Cliente de auth: `src/lib/auth.ts` (`createAuthClient`, plugin 2FA).
- Todas as chamadas autenticadas: **`credentials: "include"`** (cookies de sessão Better Auth).
- **Não** usar header `x-unit-id` (removido na API).
- **Não** usar `Authorization: Bearer` para sessão — a sessão vai em cookie.

### Health check

`src/main.tsx` chama `GET {authBaseUrl}/health` no boot (só log, não bloqueia o app).

---

## Fluxo clínico (Login → Home)

### 1. Login — `/login` ou `/sign-in`

Arquivo: `src/pages/SignIn/sign-in.tsx`

```typescript
await auth.signIn.email({
  email,
  password,
  callbackURL: `${window.location.origin}/session`,
})
```

Sucesso → `/session`. Erro 401/inativo → mensagem na tela.

### 2. Sessão obrigatória — `ProtectedRoute`

Arquivo: `src/components/ProtectRoute/protected-route.tsx`

Sem sessão (`useSession` / `auth.getSession()`) → redireciona `/login`.

### 3. Seleção de unidade — `/session`

Arquivo: `src/pages/SelecaoUnidade/selecao-unidade.tsx`

- `GET /session/clinics` com `credentials: "include"` (sem Bearer).
- Usuário escolhe clínica → `POST /session/select-clinic` com `{ "clinicId": "uuid" }`.
- O backend define cookies **`selectedClinicId`** e **`selectedProfessionalUnitId`**.
- 1 unidade apenas → seleção automática e redirect `/home`.
- Botão **Sair** → `auth.signOut()` → `/login`.

### 4. Área logada — `UnitProtectedRoute`

Arquivo: `src/components/ProtectRoute/unit-protected-route.tsx`

- Confere `selectedClinicId` via `GET /session/clinics`.
- Sem unidade selecionada → `/session`.
- Com unidade → `/home` e rotas filhas (`app.tsx`).

### 5. Nome da unidade no menu

`src/contexts/sidebar-menu-context.tsx` guarda `selectedUnitName` só para **exibição**. O escopo real da API está nos **cookies**, não em `localStorage`.

### 6. Roles e sidebar

Bootstrap: `src/pages/Default/default.tsx` (`DefaultBootstrap`)

1. `GET /session/clinics`
2. `GET /professionals/professional-unit/roles` com `credentials: "include"` (a API lê unidade/vínculo dos **cookies**)
3. Roles no context → menu em `src/components/app-sidebar.tsx`

| `roles.key` | Itens de menu (resumo) |
|-------------|-------------------------|
| `internal_alfamed` | Início, Profissionais, Procedimentos, Especialidades |
| `administrative` | Idem |
| `medic` | Início, Agendamentos, Agendas |
| `administrative_assistant` | Início, Agendas |

---

## Fluxo Service Desk (admin interno)

**Não** passa por `/session` nem exige cookie de clínica.

### 1. Login — `/admin/login`

Arquivo: `src/pages/SignIn/admin-sign-in.tsx`

```typescript
await auth.signIn.email({
  email,
  password,
  callbackURL: `${window.location.origin}/admin/unidades`,
})
```

A API valida role **`internal_alfamed`** quando `callbackURL` contém `/admin/`.

### 2. Guard interno — `InternalProtectedRoute`

Arquivo: `src/components/ProtectRoute/internal-protected-route.tsx`

- Exige sessão.
- E-mail deve terminar com **`@alfamed.com`**.
- Falha → `/admin/login`.

### 3. Rotas admin — `src/app.tsx`

- `/admin/unidades`, `/admin/upm`, etc.
- Layout `Default` sem carregar roles clínicos na área `/admin`.

Serviços: `src/services/admin/admin-units.service.ts`, `admin-upm.service.ts`.

---

## Reset de senha

- Modal: `src/components/auth/forgot-password-dialog.tsx` → `POST /auth/forgot-password`
- Página: `/reset-password?token=...` → `src/pages/ResetPassword/reset-password.tsx`

---

## Redirecionamentos (resumo)

| Situação | Destino |
|----------|---------|
| Sem sessão (área clínica) | `/login` |
| Com sessão, sem clínica selecionada | `/session` |
| Service Desk sem sessão / e-mail inválido | `/admin/login` |

---

## CORS e deploy

O backend deve liberar origens com `credentials: true` (ver `trustedOrigins` na API):

- `http://localhost:5173`
- `https://dev-alfamed.vercel.app`
- `https://web-alfamed.vercel.app`

Deploy: `vercel.json` (SPA rewrite para `index.html`).

## Estrutura resumida

```text
src/
  app.tsx              # rotas
  lib/auth.ts          # Better Auth client
  components/ProtectRoute/
  pages/SignIn/        # login clínico + admin
  pages/SelecaoUnidade/
  pages/ServiceDesk/
  services/            # fetch → API
  contexts/            # sidebar menu
```

## Licença

Projeto interno — Alfamed.
