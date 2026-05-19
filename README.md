# Alfamed Web

Frontend da aplicação Alfamed, construído com **React 19 + TypeScript + Vite**.

## Resumo

Aplicação SPA para fluxo clínico e área interna do Service Desk. O frontend consome a API do Alfamed via REST e usa Better Auth com sessão em cookie.

## Requisitos

- Node.js 20+.
- npm 10+.

## Instalação

```bash
git clone <repo>
cd alfamed-web
npm install
```

Crie um arquivo `.env` na raiz, tomando `.env.example` como base.

## Variáveis de Ambiente

| Variável | Uso | Valor padrão |
|----------|-----|--------------|
| `VITE_API_URL` | URL base usada pelo cliente de autenticação e pelos serviços | `http://localhost:3333` em localhost; `https://alfamed-api-dev.vercel.app` fora dele |
| `VITE_API_PROXY_TARGET` | Alvo do proxy do Vite em desenvolvimento | `https://alfamed-api-dev.vercel.app` |

Exemplo local:

```env
VITE_API_URL=http://localhost:3333
VITE_API_PROXY_TARGET=http://localhost:3333
```

## Scripts

```bash
npm run dev
npm run build
npm run lint
npm run preview
```

## Execução

```bash
npm run dev
```

O app sobe em `http://localhost:5173`.

No modo de desenvolvimento, o Vite faz proxy de `/api` e `/health` para o backend configurado em `VITE_API_PROXY_TARGET`.

```bash
npm run build
```

Gera a build de produção em `dist/`.

```bash
npm run preview
```

Serve localmente a build gerada.

## Fluxo da Aplicação

### Login clínico

1. A rota `/login` usa `src/pages/SignIn/sign-in.tsx`.
2. O login chama `auth.signIn.email(...)` com `callbackURL` para `/session`.
3. A sessão é mantida por cookie, não por Bearer token.
4. Em sucesso, o usuário segue para a seleção de unidade.

### Seleção de unidade

1. A rota `/session` usa `src/pages/SelecaoUnidade/selecao-unidade.tsx`.
2. O frontend busca `GET /session/units` com `credentials: "include"`.
3. Se houver uma única unidade, a seleção é automática.
4. Se houver mais de uma, o usuário escolhe a unidade e envia `POST /session/select-unit` com `{ unitId }`.
5. Depois disso o backend grava `selectedUnitId` e `selectedProfessionalUnitId` em cookies.

### Rotas internas

As rotas internas ficam sob `/` e são protegidas por `ProtectedRoute` e `UnitProtectedRoute`.

Rotas atuais em `src/app.tsx`:

- `/home`
- `/profissionais`
- `/profissionais/vinculo-especialidades`
- `/profissionais/:id`
- `/cadastro-profissionais`
- `/procedimentos`
- `/especialidades`
- `/agendas`
- `/agendamentos`
- `/perfil`

### Área administrativa

As rotas de Service Desk ficam em `/admin/*`.

Rotas atuais:

- `/admin/login`
- `/admin/unidades`
- `/admin/unidades/:id`
- `/admin/upm`
- `/admin/upm/usuarios/:id`

## Autenticação e API

- O cliente de autenticação está em `src/lib/auth.ts`.
- Requisições autenticadas usam `credentials: "include"`.
- Não há uso de `Authorization: Bearer` para a sessão do Better Auth.
- Não existe header `x-unit-id` no frontend.
- Serviços HTTP ficam em `src/Servicos/*.service.ts`.

## Estrutura Principal

```
src/
├── components/     # UI, guards de rota, sidebar, auth e loading
├── contexts/       # Contexto do menu lateral
├── hooks/          # Hooks de sessão e utilitários
├── layouts/        # Layout padrão e layout com sidebar
├── lib/            # Cliente de auth, fetch e utilitários
├── pages/          # Telas da aplicação
├── Servicos/       # Chamadas HTTP para API
├── app.tsx         # Definição das rotas
└── main.tsx        # Bootstrap da aplicação
```

## Validação

Na verificação executada neste workspace:

- `npm run build` passou.
- `npm run lint` falhou por problemas já existentes no código, principalmente `react-hooks/set-state-in-effect` em `src/components/app-sidebar.tsx` e alguns `no-unused-vars`.

## Observações

- O backend local padrão usa a porta `3333`, não `3000`.
- O fluxo de unidade e menu depende de cookies da sessão.
- O app usa React 19, não React 18.
