# Alfamed Web

Frontend da aplicação Alfamed, construído com React + TypeScript + Vite.

## Requisitos

- Node.js 20+
- npm 10+

## Instalação

```bash
npm install
```

## Variáveis de ambiente

Use o arquivo `.env.example` como referência.

Configuração atual suportada:

```env
VITE_API_URL=
VITE_API_PROXY_TARGET=http://localhost:3000
```

Significado:

- `VITE_API_URL`: URL base usada pelo client de auth (`src/lib/auth.ts`).
- `VITE_API_PROXY_TARGET`: alvo do proxy local do Vite em desenvolvimento.

### Usar backend local ou backend dev web

Você pode alternar no `.env` conforme o cenário.

Backend local:

```env
VITE_API_URL=
VITE_API_PROXY_TARGET=http://localhost:3000
```

Backend dev hospedado:

```env
VITE_API_URL=
VITE_API_PROXY_TARGET=https://alfamed-api-dev.vercel.app
```

## Execução local (desenvolvimento)

```bash
npm run dev
```

Em desenvolvimento, o projeto usa proxy no Vite (`vite.config.ts`) para encaminhar:

- `/api` para `VITE_API_PROXY_TARGET`
- `/health` para `VITE_API_PROXY_TARGET`

Isso ajuda a evitar erro de CORS no ambiente local.

## Build de produção

```bash
npm run build
```

## Preview da build

```bash
npm run preview
```

## Scripts

- `npm run dev`: sobe a aplicação em modo desenvolvimento
- `npm run build`: type-check + build de produção
- `npm run preview`: serve a build localmente
- `npm run lint`: executa o lint

## Conexão com API

O client de autenticação está em `src/lib/auth.ts` e usa `VITE_API_URL` como base.

Além disso, na inicialização (`src/main.tsx`), a aplicação chama `GET /health` e registra no console:

- `API online` quando retornar `{ "status": "ok" }`
- `API offline` em falha de rede, status HTTP inválido ou resposta diferente

## How It Works (Login -> Home)

Este é o fluxo atual de autenticação e seleção de unidade até chegar na Home.

### 1. Login (`/login`)

- Arquivo: `src/pages/SignIn/sign-in.tsx`
- Ao enviar e-mail/senha, o frontend chama `auth.signIn.email(...)`.
- Em sucesso, redireciona para `/session`.
- Em falha `400/401`, exibe `Email ou senha inválidos`.

### 2. Validação de sessão (guard global)

- Arquivo: `src/components/ProtectRoute/protected-route.tsx`
- Rotas protegidas só renderizam com sessão válida (`useSession`).
- Se não houver sessão, redireciona para `/login`.

### 3. Seleção de unidade (`/session`)

- Arquivo: `src/pages/SelecaoUnidade/selecao-unidade.tsx`
- Busca unidades em `GET {VITE_API_URL}/units/by-user` com:
	- `Authorization: Bearer <token da sessão>`
	- `credentials: include`

Tratamento de retorno:

- `200`: renderiza lista de unidades no select.
- `401`: mostra mensagem de não autenticado.
- `500`: mostra mensagem de erro interno.
- sem unidades: mostra mensagem de que o usuário não tem vínculo.

Regras de navegação nesta etapa:

- Se vier **apenas 1 unidade**, ela é selecionada automaticamente, salva e o usuário é redirecionado para `/home`.
- Se vier **mais de 1 unidade**, o usuário escolhe no select e clica em `Ir para Home`.
- Há botão `Sair` para encerrar sessão e voltar para `/login`.

### 4. Persistência da unidade ativa

- Arquivo: `src/lib/selected-unit.ts`
- A unidade escolhida é salva no `localStorage` por usuário:
	- chave: `alfamed:selected-unit:<userId>`
	- valor: `{ id, name }`

### 5. Acesso à Home e rotas filhas

- Arquivo: `src/components/ProtectRoute/unit-protected-route.tsx`
- Além de sessão válida, exige unidade ativa salva para acessar `/home` e demais rotas internas.
- Se não houver unidade selecionada, redireciona para `/session`.

### 6. Resumo de exceções de redirecionamento

- Sem sessão: qualquer rota protegida -> `/login`
- Com sessão, sem unidade ativa: rotas internas (`/home` e filhas) -> `/session`
- Com sessão e unidade ativa: acesso normal às páginas internas

## Deploy (Vercel)

Para frontend e backend em domínios diferentes, configure CORS no backend.

Origens recomendadas para liberar no backend:

- `http://localhost:5173`
- `https://dev-alfamed.vercel.app`
- `https://web-alfamed.vercel.app`

Regras:

- manter protocolo (`http://` / `https://`)
- não usar barra final
- aplicar no formato de configuração que seu backend utiliza atualmente

## Observações

- `.env` está no `.gitignore`.
- Sempre que alterar variáveis no Vercel, faça novo deploy para refletir no build.
