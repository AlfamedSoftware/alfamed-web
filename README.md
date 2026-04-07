# Alfamed Web

Frontend da aplicação Alfamed construído com React + TypeScript + Vite.

## Requisitos

- Node.js 20+
- npm 10+

## Instalação

```bash
npm install
```

## Configuração de ambiente

1. Crie o arquivo `.env` na raiz do projeto.
2. Configure a URL base da API:

```env
VITE_API_URL=http://localhost:3333
```

Você pode usar a referência em `.env.example` e ajustar para seu ambiente (dev/homolog/prod).

## Executando em desenvolvimento

```bash
npm run dev
```

O Vite irá exibir a URL local (normalmente `http://localhost:5173`).

## Build de produção

```bash
npm run build
```

## Preview da build

```bash
npm run preview
```

## Scripts disponíveis

- `npm run dev`: sobe o frontend em modo desenvolvimento
- `npm run build`: executa type-check e gera build de produção
- `npm run preview`: serve localmente a build gerada
- `npm run lint`: roda o ESLint

## Conexão com API

A conexão de autenticação é configurada em `src/lib/auth.ts` via `createAuthClient`, usando a variável `VITE_API_URL`.

Se `VITE_API_URL` não estiver definida, o fallback é `http://localhost:3333`.

## Observações

- O backend deve estar ativo e aceitar CORS da origem do frontend em desenvolvimento.
- O arquivo `.env` está ignorado no Git por segurança.
