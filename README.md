# Alfamed Web

Frontend da aplicação Alfamed, construído com **React 18 + TypeScript + Vite**.

## Sumário

- [Requisitos](#requisitos)
- [Instalação e Setup](#instalação-e-setup)
- [Execução](#execução)
- [Estrutura do Projeto](#estrutura-do-projeto)
- [Autenticação e Fluxo de Login](#autenticação-e-fluxo-de-login)
- [Variáveis de Ambiente](#variáveis-de-ambiente)
- [Deploy](#deploy)
- [Scripts e Desenvolvimento](#scripts-e-desenvolvimento)
- [Troubleshooting](#troubleshooting)

## Requisitos

- **Node.js 20+** (recomendado 20.x LTS)
- **npm 10+**

## Instalação e Setup

### 1. Clonar o repositório e instalar dependências

```bash
git clone <repo>
cd alfamed-web
npm install
```

### 2. Configurar variáveis de ambiente

Crie um arquivo `.env` na raiz (use `.env.example` como referência):

```env
VITE_API_URL=http://localhost:3000
VITE_API_PROXY_TARGET=http://localhost:3000
```

Detalhes em [Variáveis de Ambiente](#variáveis-de-ambiente).

## Execução

### Desenvolvimento

```bash
npm run dev
```

Acesse em `http://localhost:5173`.

Em dev, o Vite proxy (`vite.config.ts`) encaminha requisições para `/api` e `/health` ao backend local, evitando CORS.

### Build de Produção

```bash
npm run build
```

Gera a build otimizada em `dist/`.

### Preview da Build

```bash
npm run preview
```

Serve a build localmente em `http://localhost:4173`.

## Estrutura do Projeto

```
src/
├── assets/                  # Ícones, imagens, PDFs
├── components/
│   ├── app-sidebar.tsx      # Menu lateral principal (dinâmico por roles)
│   ├── page-header.tsx      # Cabeçalho de página
│   ├── theme-provider.tsx   # Provider de tema (light/dark)
│   ├── auth/                # Componentes de autenticação
│   ├── ProtectRoute/        # Guards de rota (sessão, unidade, etc)
│   ├── Loading/             # Estados de carregamento
│   └── ui/                  # Componentes primitivos (Button, Card, Input, etc)
├── contexts/
│   └── sidebar-menu-context.tsx  # Context global de menu e roles
├── hooks/
│   ├── use-session.tsx      # Hook para autenticação (sessão do usuário)
│   ├── use-professionals.ts # Hook para lista de profissionais
│   └── use-mobile.ts        # Hook para detecção de mobile
├── layouts/
│   ├── default-layout.tsx   # Layout base (sem sidebar)
│   └── sidebar-layout.tsx   # Layout com sidebar (para rotas internas)
├── lib/
│   ├── api-client.ts        # Cliente HTTP com interceptadores
│   ├── auth.ts              # Cliente de autenticação
│   ├── global-fetch-interceptor.ts  # Middleware de fetch
│   └── utils.ts             # Funções utilitárias
├── pages/
│   ├── Home/
│   ├── Profissionais/       # Gerenciamento de profissionais
│   ├── Procedimentos/
│   ├── Especialidades/
│   ├── Agendamentos/
│   ├── Agendas/
│   ├── SignIn/              # Páginas de login
│   ├── SelecaoUnidade/      # Seleção de unidade (clínica)
│   ├── ServiceDesk/         # Admin/UPM (área restrita)
│   └── ...
├── services/
│   ├── professionals.service.ts
│   ├── professional-unit-roles.service.ts
│   └── admin/               # Serviços administrativos
├── app.tsx                  # Definição de rotas
├── main.tsx                 # Entry point (com React.StrictMode)
└── index.css                # Estilos globais
```

## Autenticação e Fluxo de Login

### Visão Geral do Fluxo

```
Login (/login)
    ↓
Seleção de Unidade (/session)
    ↓
Home e Rotas Internas (/)
```

### 1. Login (`/login`)

- **Arquivo:** `src/pages/SignIn/sign-in.tsx`
- **Fluxo:**
  1. Usuário insere e-mail e senha
  2. Frontend chama `auth.signIn.email(...)`
  3. Backend retorna token de sessão (armazenado em cookie `HttpOnly`)
  4. Em sucesso → redireciona para `/session`
  5. Em erro 400/401 → exibe "Email ou senha inválidos"

### 2. Seleção de Unidade (`/session`)

- **Arquivo:** `src/pages/SelecaoUnidade/selecao-unidade.tsx`
- **Proteção:** `<ProtectedRoute>` valida sessão ativa
- **Comportamento:**
  - Busca unidades em `GET /session/units`
  - **1 unidade:** seleção automática e redirecionamento para `/home`
  - **N unidades:** usuário escolhe no select e clica "Ir para Home"
  - Envia `POST /session/select-unit` com ID selecionado
  - Backend persiste a preferência

### 3. Home e Rotas Internas (`/`)

- **Proteção dupla:**
  1. `<ProtectedRoute>` valida sessão
  2. `<UnitProtectedRoute>` valida unidade selecionada no backend
- Se faltar unidade selecionada → volta para `/session`

### 4. Gerenciamento de Sessão Expirada

- **Arquivo:** `src/lib/api-client.ts`
- **Comportamento:**
  - Toda requisição com status **401** (Unauthorized) dispara:
    1. Alerta ao usuário: "Sua sessão atingiu o tempo limite de inatividade"
    2. Redirecionamento para `/login`
  - O callback de navegação é configurado em `src/main.tsx`

## Variáveis de Ambiente

Use `.env.example` como referência. Variáveis suportadas:

| Variável | Descrição | Fallback Padrão |
|----------|-----------|-----------------|
| `VITE_API_URL` | URL base da API | localhost → `http://localhost:3000`; produção → `https://alfamed-api-dev.vercel.app` |
| `VITE_API_PROXY_TARGET` | Proxy do Vite (dev only) | `http://localhost:3000` |

### Exemplos de Configuração

**Backend Local:**
```env
VITE_API_URL=
VITE_API_PROXY_TARGET=http://localhost:3000
```

**Backend Hospedado (Dev):**
```env
VITE_API_URL=https://alfamed-api-dev.vercel.app
VITE_API_PROXY_TARGET=https://alfamed-api-dev.vercel.app
```

**Produção:**
```env
VITE_API_URL=https://alfamed-api.vercel.app
```

---

Na inicialização (`src/main.tsx`), a aplicação tenta conectar à API e registra no console:

- `✓ API online` → status 200 com `{ "status": "ok" }`
- `✗ API offline` → falha de rede, status inválido ou resposta diferente

Arquivo: `src/pages/SignIn/sign-in.tsx`

## Papéis (Roles) e Menu Dinâmico

### Fluxo de Carregamento de Roles

1. **Bootstrap:** Após login e seleção de unidade, `SidebarBootstrap` (`src/layouts/sidebar-layout.tsx`) é renderizado
2. **Requisição:** Chama `GET /professionals/professional-unit/roles`
3. **Armazenamento:** Roles salvas em `SidebarMenuContext` (estado global)
4. **Renderização:** Menu montado dinamicamente em `src/components/app-sidebar.tsx` baseado nos roles

### Roles Suportados

| Role | Rótulo | Itens do Menu |
|------|--------|---------------|
| `internal_alfamed` | Alfamed | Profissionais, Procedimentos, Especialidades |
| `administrative` | Administrativo | Profissionais, Procedimentos, Especialidades |
| `medic` | Médico | Agendamentos, Agendas |
| `administrative_assistant` | Assistente Administrativo | Agendas |

**Nota:** Roles desconhecidos são ignorados. O ideal é que cada profissional tenha **um único role por unidade profissional**.

### Adicionando Novo Role

1. Adicionar chave em `MENU_ROLE_KEYS` (`src/components/app-sidebar.tsx`)
2. Adicionar rótulo em `roleLabels`
3. Mapear itens em `menuItemsByRole`
4. Backend retornará a nova chave ao usuário

## Persistência de Unidade Ativa

- **Antes:** localStorage (problemas com múltiplas abas)
- **Agora:** Backend persiste a seleção por usuário
- **Sincronização:** Frontend busca `selectedUnitId` em `GET /session/units` e sincroniza com context global

Resultado: selecionar uma unidade em qualquer aba afeta todas as abas do mesmo navegador automaticamente.

## Deploy

### Estrutura de Deploy

```
Frontend (Vercel)        Backend (Vercel/Custom)
domain: web-alfamed.com  domain: api.alfamed.com
```

### Configuração de CORS no Backend

O backend **deve** aceitar requisições cross-origin do(s) frontend(ns). 

**Origens a liberar:**

```
http://localhost:5173         (dev local)
https://dev-alfamed.vercel.app   (dev preview)
https://web-alfamed.vercel.app   (produção)
```

**Requisitos:**

- ✓ Protocolo correto (`http://` / `https://`)
- ✓ Sem barra final (`/`)
- ✓ Responder `Access-Control-Allow-Origin` em **todas** respostas (incluindo 4xx/5xx)
- ✓ Aceitar método `OPTIONS` (preflight)
- ✓ Manter `Access-Control-Allow-Credentials: true` (para cookies)

### Deploy no Vercel

1. **Conectar repositório** ao Vercel
2. **Definir variáveis de ambiente** no dashboard:
   ```
   VITE_API_URL=https://seu-backend.com
   VITE_API_PROXY_TARGET=https://seu-backend.com
   ```
3. **Deploy automático** via git push ou manual no dashboard

**Obs:** Sempre faça novo deploy após alterar variáveis no Vercel.

## Scripts e Desenvolvimento

```bash
# Desenvolvimento
npm run dev          # Sobe dev server (http://localhost:5173)

# Build
npm run build        # Type-check + build otimizada
npm run preview      # Serve a build localmente

# Linting
npm run lint         # Executa ESLint

# CI/CD
npm run type-check   # TypeScript strict check
```

## Componentes Principais

### ProtectedRoute (`src/components/ProtectRoute/`)

- `<ProtectedRoute>` → valida sessão ativa
- `<UnitProtectedRoute>` → valida unidade selecionada no backend
- `<InternalProtectedRoute>` → valida sessão + acesso admin (área ServiceDesk)

Composição típica:
```tsx
<Route path="/" element={
  <ProtectedRoute>
    <UnitProtectedRoute>
      <Default /> {/* Rotas internas */}
    </UnitProtectedRoute>
  </ProtectedRoute>
} />
```

### useSession Hook

```tsx
const { user, isLoading, error, logout } = useSession()
```

Busca dados do usuário atual em `GET /session`. Redireciona para `/login` se 401.

### useProfessionals Hook

```tsx
const { professionals, isLoading, error, refetch } = useProfessionals()
```

Busca lista de profissionais em `GET /professionals`. Em React 18 dev com StrictMode, pode disparar dupla chamada (esperado, desaparece em produção).

### API Client (`src/lib/api-client.ts`)

```tsx
export function setNavigationCallback(callback: (path: string) => void)
export async function fetchWithAuth<T>(url: string, options?: RequestInit): Promise<T>
```

- Adiciona `Content-Type: application/json` e cookies automaticamente
- Intercepta 401 → alerta + redirecionamento para `/login`
- Retorna `undefined as T` para respostas 204 (No Content)

## Troubleshooting

### "API offline" no console

- ✓ Verificar se backend está rodando: `http://localhost:3000/health`
- ✓ Verificar `.env`: `VITE_API_PROXY_TARGET` aponta para backend?
- ✓ Checar CORS: backend aceita `http://localhost:5173`?

### Sessão expirada / redirecionamento duplo para login

- ✓ Esperado em dev (StrictMode monta componentes 2x)
- ✓ Em produção, aparece apenas uma vez
- ✓ Se aparecer constantemente, checar token de sessão no cookie/storage

### Menu não carrega ou lista vazia

- ✓ Verificar se `GET /session/units` retorna `selectedUnitId`
- ✓ Verificar se `GET /professionals/professional-unit/roles` retorna array de roles válidos
- ✓ Checar console para erros 401 ou 500

### Build falha com erros TypeScript

```bash
npm run type-check
```

Se passar no type-check, confirmar que `.env` tem `VITE_API_URL` configurado.

### Requisições duplicadas em dev

Causa: React 18 StrictMode monta componentes 2x em desenvolvimento para detectar side effects.

- Esperado e normal
- Desaparece em produção (`npm run build` + preview)
- Para remover em dev, comentar `<StrictMode>` em `src/main.tsx` (não recomendado)

## Notas Importantes

- `.env` está no `.gitignore` (não commitar valores sensíveis)
- Cookies são `HttpOnly` (não acessíveis via JS, seguro contra XSS)
- Tema escuro/claro é armazenado em `localStorage` (`theme-provider.tsx`)
- Mobile detection via hook `useIsMobile` (breakpoint: 768px)
- Sidebar responsivo (mobile → drawer; desktop → sidebar)

## Contactar Suporte

Em caso de dúvidas ou bugs:
- Criar issue no repositório
- Descrever passos para reproduzir
- Anexar output do console (F12)
