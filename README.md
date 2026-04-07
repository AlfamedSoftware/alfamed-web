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
