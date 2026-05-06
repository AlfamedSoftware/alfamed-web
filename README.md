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

### Variáveis suportadas:

```env
VITE_API_URL=https://seu-backend-aqui.com
VITE_API_PROXY_TARGET=http://localhost:3000
```

**Significado:**

- `VITE_API_URL`: URL base da API usada pelo client de autenticação (`src/lib/auth.ts`). Se deixar vazio, usa padrão:
  - Em **localhost/127.0.0.1**: `http://localhost:3000`
  - Em **produção**: `https://alfamed-api-dev.vercel.app`
- `VITE_API_PROXY_TARGET`: **Somente em desenvolvimento**. Alvo do proxy local do Vite para evitar CORS. Não é usado em produção.

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

O client de autenticação está em `src/lib/auth.ts` e usa `VITE_API_URL` como base (ou fallback padrão se vazio).

### Health Check na inicialização

Na inicialização (`src/main.tsx`), a aplicação chama `GET {VITE_API_URL}/health` e registra no console:

- `API online` quando retornar status 200 com `{ "status": "ok" }`
- `API offline` em falha de rede, status HTTP inválido ou resposta diferente

Este check é **informativo** e não bloqueia o carregamento do app.

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
- Busca unidades em `GET {VITE_API_URL}/session/clinics` com:
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

### 4. Persistência e sincronização da unidade ativa

**Mecanismo:**
- O backend mantém qual unidade está selecionada para cada usuário.
- Na seleção em `/session`, o frontend envia `POST {VITE_API_URL}/session/select-clinic` com o ID da unidade.
- O backend salva essa preferência e a retorna em futuras chamadas de `GET /session/clinics` (campo `selectedClinicId`).

**No Frontend:**
- Arquivo: `src/contexts/sidebar-menu-context.tsx`
- Estado global `selectedUnitName` (apenas o **nome** da unidade para exibição).
- Sincronizado em layouts/páginas que buscam clinics:
  - `src/layouts/sidebar-layout.tsx` (após carregar clinics)
  - `src/pages/Default/default.tsx` (após carregar clinics)
  - `src/pages/SelecaoUnidade/selecao-unidade.tsx` (seleção manual)

**Sem localStorage:**
A seleção agora é persistida no **backend**, eliminando problemas de sincronização com múltiplos abas ou dispositivos.

### 5. Acesso à Home e rotas filhas

- Arquivo: `src/components/ProtectRoute/unit-protected-route.tsx`
- Além de sessão válida, valida que existe `selectedClinicId` no servidor (`GET /session/clinics`).
- Se não houver unidade selecionada no backend, redireciona para `/session`.

### 6. Resumo de exceções de redirecionamento

- **Sem sessão**: qualquer rota protegida → `/login`
- **Com sessão, sem unidade ativa no backend**: rotas internas (`/home` e filhas) → `/session`
- **Com sessão e unidade ativa no backend**: acesso normal às páginas internas

### 7. Papéis (Roles) e montagem dinâmica do menu

**Fluxo de carregamento dos roles:**

1. **Bootstrap na sidebar** (`src/layouts/sidebar-layout.tsx`):
   - Após usuário logar e selecionar uma unidade, o componente `SidebarBootstrap` é inicializado.
   - Busca em `GET {VITE_API_URL}/session/clinics` para obter `selectedClinicId` e `selectedProfessionalUnitId`.
   - Chama `listProfessionalUnitRoles()` (do serviço em `src/services/professional-unit-roles.service.ts`).

2. **Requisição de roles ao backend**:
   - Envia: `GET {VITE_API_URL}/professionals/professional-unit/roles`
   - Parâmetros: `unitId` (clínica), `professionalUnitId`, `requestUserId` (identificação do profissional)
   - Resposta: array de role keys como `["internal_alfamed", "administrative", "medic"]`

3. **Armazenamento no Context** (`src/contexts/sidebar-menu-context.tsx`):
   - Os roles são salvos em estado global via `SidebarMenuContext`.
   - Disponível para leitura em qualquer componente via hook `useSidebarMenu()`.

**Mapeamento de roles para menu:**

Arquivo: `src/components/app-sidebar.tsx`

Roles suportados:
- `internal_alfamed` → Cargo "Alfamed" (acesso a Profissionais, Procedimentos, Especialidades)
- `administrative` → Cargo "Administrativo" (mesmo acesso que Alfamed)
- `medic` → Cargo "Médico" (acesso a Agendamentos e Agendas)
- `administrative_assistant` → Cargo "Assistente administrativo" (acesso a Agendas)

Qualquer outro role desconhecido é **ignorado** (filtro `allowedRoleKeys`).

**Montagem do menu:**

1. Para cada role no `menuRoles`, obtém seus itens em `menuItemsByRole[role]`.
2. Combina itens de múltiplos roles (deduplica por URL).
3. Resultado: array final de itens únicos a exibir na sidebar.
4. O rótulo do cargo atual é exibido no footer (primeiro role reconhecido).

**Nota sobre múltiplos roles:**
Embora o sistema suporte múltiplos roles por profissional em uma unidade, **o ideal é que haja apenas um role por profissional por unidade profissional**. Isso será garantido no cadastro de profissionais, simplificando a experiência do usuário e evitando confusão com permissões sobrepostas.

**Exemplo (caso padrão):**
- Usuário com um único role: `["medic"]`
- Menu renderizado: Início, Agendamentos, Agendas

**Extensão:**

Para adicionar novo role:
1. Adicionar chave em `MENU_ROLE_KEYS`
2. Adicionar rótulo em `roleLabels`
3. Mapear itens em `menuItemsByRole`
4. Backend retornará a nova role key ao usuário

## Deploy (Vercel)

O frontend é implantado separadamente do backend, resultando em domínios diferentes.

### Configuração de CORS

O backend **deve** estar configurado para aceitar requisições cross-origin do(s) frontend(ns).

**Origens recomendadas para liberar no backend:**

- `http://localhost:5173` (dev local)
- `https://dev-alfamed.vercel.app` (dev preview)
- `https://web-alfamed.vercel.app` (produção)

**Regras importantes:**

- Manter protocolo (`http://` / `https://`)
- Não usar barra final (`/`)
- Responder com `Access-Control-Allow-Origin` em **todas** as respostas (incluindo erros 4xx/5xx)
- Permitir método `OPTIONS` para preflight requests
- Manter `Access-Control-Allow-Credentials: true` para requisições com cookies/sessão

## Observações

- `.env` está no `.gitignore`.
- Sempre que alterar variáveis no Vercel, faça novo deploy para refletir no build.