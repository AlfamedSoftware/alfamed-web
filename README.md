# Alfamed Web

Frontend da aplicação Alfamed, construído com React 19 + TypeScript + Vite.

## Resumo

SPA para fluxo clínico e área interna (Service Desk). O frontend consome a API do Alfamed via REST e usa Better Auth para autenticação com sessão por cookie.

## Requisitos

- Node.js 20+
- npm 10+

## Instalação

```bash
git clone <repo>
cd alfamed-web
npm install
```

Crie um arquivo `.env` na raiz (use `.env.example` como referência, se existir).

## Variáveis de ambiente

| Variável | Uso | Valor padrão |
|----------|-----|--------------|
| VITE_API_URL | URL base usada pelo cliente de autenticação e pelos serviços | `http://localhost:3333` (desenvolvimento) |
| VITE_API_PROXY_TARGET | Alvo do proxy do Vite em desenvolvimento | `http://localhost:3333` |

Exemplo local:

```env
VITE_API_URL=http://localhost:3333
VITE_API_PROXY_TARGET=http://localhost:3333
```

## Scripts úteis

```bash
npm run dev     # roda em modo desenvolvimento (Vite)
npm run build   # compila TypeScript e gera build do Vite
npm run lint    # executa ESLint
npm run preview # serve a build gerada localmente
```

## Como rodar (desenvolvimento)

```bash
npm run dev
```

O app sobe normalmente em `http://localhost:5173`.

No modo de desenvolvimento o Vite faz proxy de rotas para o backend conforme `VITE_API_PROXY_TARGET`.

## Fluxos principais

- Login: rota `/login` (`src/pages/SignIn/sign-in.tsx`). Usa `auth.signIn.email(...)` com `callbackURL` para `/session`. A sessão é mantida por cookie.
- Seleção de unidade: rota `/session` (`src/pages/SelecaoUnidade/selecao-unidade.tsx`). O frontend faz chamadas com `credentials: "include"` e o backend grava cookies `selectedUnitId` / `selectedProfessionalUnitId`.

## Rotas importantes

- Internas (protegidas): `/home`, `/profissionais`, `/cadastro-profissionais`, `/procedimentos`, `/especialidades`, `/agendas`, `/agendamentos`, `/perfil`.
- Área administrativa (`/admin/*`): `/admin/login`, `/admin/unidades`, `/admin/upm`, etc.

As rotas e guards estão definidas em `src/app.tsx` e em `src/components/ProtectRoute/`.

## Autenticação e chamadas HTTP

- Cliente de auth: `src/lib/auth.ts`.
- Requisições autenticadas devem usar `credentials: "include"` (cookies).
- Não usar `Authorization: Bearer` para a sessão Better Auth.
- O contexto de unidade é mantido via cookie no backend.
- Centralize chamadas HTTP em `src/Servicos/*.service.ts`.

## Estrutura do projeto

```
src/
├── components/
├── contexts/
├── hooks/
├── layouts/
├── lib/
├── pages/
├── Servicos/
├── app.tsx
└── main.tsx
```

## Validação e status local

- `npm run build` passou nesta verificação local.
- `npm run lint` apresenta avisos/erros existentes (por exemplo `react-hooks/set-state-in-effect` em `src/components/app-sidebar.tsx` e alguns `no-unused-vars`). Recomenda-se rodar o lint antes de PRs.