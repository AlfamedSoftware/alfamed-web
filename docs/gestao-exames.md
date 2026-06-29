# Módulo de Gestão de Exames

## Visão Geral

O módulo de Gestão de Exames gerencia todo o ciclo de vida dos pedidos de exame originados em atendimentos: da confirmação de pagamento pela recepção até a liberação do laudo no prontuário. O fluxo é dividido em dois subfluxos com telas próprias.

---

## Estrutura de Arquivos

```
src/pages/GestaoExames/
├── listar-pendentes-gestao-exames.tsx    # Recepção — pedidos no status Prescrito (1)
├── detalhes-pendentes-gestao-exames.tsx  # Recepção — confirmar pagamento e liberar
├── listar-gestao-exames.tsx              # Execução/Laudo — pedidos nos status 2 a 6
└── detalhes-gestao-exames.tsx            # Execução/Laudo — ações contextuais por status
```

---

## Status dos Pedidos

| Código | Descrição              | Quem age           |
|--------|------------------------|--------------------|
| `1`    | Prescrito              | Médico (cria)      |
| `2`    | Aguardando realização  | Recepção (libera)  |
| `3`    | Paciente em exame      | Executor (inicia)  |
| `4`    | Aguardando análise     | Executor (finaliza)|
| `5`    | Laudo em análise       | Profissional       |
| `6`    | Laudo liberado         | Profissional       |
| `7`    | Exame não realizado    | Executor (encerra) |
| `8`    | Paciente não compareceu| Executor (encerra) |

---

## Fluxo Geral

```
Médico prescreve → status 1
        │
        │  listar-pendentes → detalhes-pendentes → /liberar
        ▼
     status 2  ─────────────────────────────────────────────────────────────────────┐
        │                                                                            │
        │  listar (seção 2) → detalhes → /iniciar                                   │
        ▼                                                                            │
     status 3  ────── /encerrar (statusCode=7) ──► status 7                         │
        │                                                                            │
        │  /finalizar (complementaryInfo?)                                           │
        ▼                                                                            │
     status 4  ── /encerrar (statusCode=8) ──► status 8  (disponível no status 2) ──┘
        │
        │  listar (seção 4) → detalhes → /iniciar-laudo
        ▼
     status 5
        │
        │  /finalizar-laudo (attachmentUrl, complementaryInfo?)
        ▼
     status 6  →  PDF acessível no prontuário
```

---

## Subfluxo 1 — Recepção

### `listar-pendentes-gestao-exames.tsx`

#### Funcionalidade

Exibe todos os pedidos com `statusId=1` (Prescrito) para a data selecionada, aguardando confirmação de pagamento pela recepção.

#### Filtros

| Filtro | Tipo  | Regra                                                                   |
|--------|-------|-------------------------------------------------------------------------|
| Data   | Input | DD/MM/YYYY; padrão: hoje; navegação por dia com botões anterior/próximo |

- `statusId=1` é fixo na query.
- A máscara DD/MM/YYYY é aplicada automaticamente ao digitar.
- Botões de navegação ficam desabilitados com data inválida.
- Data sincronizada com `?date=DD/MM/YYYY` via `setSearchParams`.

#### Card de Pedido

Dividido por `h-px bg-border` em duas partes:

1. **Header** — avatar inicial (círculo azul) + nome do paciente + CPF formatado
2. **Corpo** — ícones em caixinha `size-6 bg-muted rounded-md`:
   - `User` — profissional `—` especialidade
   - `ClipboardList` — procedimento
   - `FlaskConical` — contagem de exames

Grid responsivo: 1 col → 2 em `sm` → 4 a partir de `lg`.

#### API

| Endpoint                                            | Quando é chamado               |
|-----------------------------------------------------|--------------------------------|
| `GET /exam-management/?date=YYYY-MM-DD&statusId=1`  | Ao montar ou alterar a data    |

#### Navegação

Clique no card → `/gestao-exames/detalhes-pendentes/:appointmentId`

---

### `detalhes-pendentes-gestao-exames.tsx`

#### Funcionalidade

Exibe os dados completos do pedido (paciente, atendimento, lista de exames com total) e permite confirmar o pagamento, liberando todos os pedidos ativos do agendamento para execução.

#### Layout

```
PageHeader ("Detalhes do Exame")
├── [grid 2 colunas]
│   ├── Card Paciente  (Nome, CPF, Nascimento·Idade, Sexo, Telefone, E-mail)
│   └── Card Atendimento  (Profissional, Especialidade, Procedimento, Data·DiaSemana, Horário·Duração)
├── Card Exames Solicitados  (lista + total BRL)
└── Footer
    ├── Voltar
    └── Confirmar  →  PATCH /liberar  →  navigate(-1)
```

#### API

| Endpoint                                          | Quando é chamado           |
|---------------------------------------------------|----------------------------|
| `GET /exam-management/:appointmentId`             | Ao montar o componente     |
| `PATCH /exam-management/:appointmentId/liberar`   | Ao clicar em **Confirmar** |

---

## Subfluxo 2 — Execução e Laudo

### `listar-gestao-exames.tsx`

#### Funcionalidade

Exibe 5 seções independentes, cada uma buscando um status diferente. As seções 3 e 5 filtram pelos pedidos vinculados ao `professionalUnitId` da sessão atual.

#### Filtros

| Filtro | Tipo   | Regra                                                                   |
|--------|--------|-------------------------------------------------------------------------|
| Data   | Input  | DD/MM/YYYY; padrão: hoje; navegação por dia com botões anterior/próximo |
| Status | Select | Todos (exibe as 5 seções) ou um status específico (exibe só aquela seção) |

Ambos persistidos em `?date=...&status=...` via `setSearchParams`.

#### Seções

| Seção | Status | Cor    | Filtro de profissional |
|-------|--------|--------|------------------------|
| Aguardando realização | 2 | Amarelo (`bg-yellow-500`) | Não — geral             |
| Paciente em exame     | 3 | Azul   (`bg-blue-500`)   | Sim — `professionalUnitId` da sessão |
| Aguardando análise    | 4 | Laranja (`bg-orange-500`)| Não — geral             |
| Laudo em análise      | 5 | Roxo   (`bg-purple-500`) | Sim — `professionalUnitId` da sessão |
| Laudo liberado        | 6 | Verde  (`bg-green-500`)  | Não — geral             |

- Cada seção usa o hook `useSectionFetch` com `useReducer` próprio.
- As seções 3 e 5 aguardam o `professionalUnitId` carregar antes de realizar o fetch (`waitForProfessional=true`).
- Cada seção exibe loading, erro e vazio de forma independente.

#### API (por seção)

| Endpoint                                                                          | Seção |
|-----------------------------------------------------------------------------------|-------|
| `GET /exam-management/?date=YYYY-MM-DD&statusId=2`                                | 2     |
| `GET /exam-management/?date=YYYY-MM-DD&statusId=3&professionalUnitId=:id`         | 3     |
| `GET /exam-management/?date=YYYY-MM-DD&statusId=4`                                | 4     |
| `GET /exam-management/?date=YYYY-MM-DD&statusId=5&professionalUnitId=:id`         | 5     |
| `GET /exam-management/?date=YYYY-MM-DD&statusId=6`                                | 6     |

#### Navegação

Clique no card → `/gestao-exames/detalhes/:appointmentId`

---

### `detalhes-gestao-exames.tsx`

#### Funcionalidade

Exibe os mesmos dados de paciente, atendimento e exames que a tela de pendentes, acrescentando um **badge de status** e um **footer contextual** com as ações disponíveis para o status atual do pedido.

O status atual é lido de `requests[0].statusCode` (todos os pedidos de um agendamento transitam juntos).

#### Badge de status

| Status | Cor                  |
|--------|----------------------|
| 2      | Amarelo              |
| 3      | Azul                 |
| 4      | Laranja              |
| 5      | Roxo                 |
| 6      | Verde                |

#### Footer por status

| Status | Botões disponíveis                                      |
|--------|---------------------------------------------------------|
| `2`    | **Iniciar Exame** (direto) + **Encerrar** (sheet)       |
| `3`    | **Finalizar Exame** (sheet) + **Encerrar** (sheet)      |
| `4`    | **Iniciar Laudo** (direto)                              |
| `5`    | **Finalizar Laudo** (sheet)                             |
| `6`    | Badge "Laudo liberado" — somente leitura                |

#### Sheets de ação

**Finalizar Exame** (status 3 → 4)
- Campo: `complementaryInfo` — textarea, opcional
- Chama: `PATCH /exam-management/:appointmentId/finalizar`
- Body: `{ complementaryInfo }` apenas se preenchido

**Encerrar** (status 2 → 8 | status 3 → 7)
- Campo: `justification` — textarea, obrigatório
- O `statusCode` é determinado automaticamente: status atual `2` → código `8` (Paciente não compareceu); status `3` → código `7` (Exame não realizado)
- Chama: `PATCH /exam-management/:appointmentId/encerrar`
- Body: `{ statusCode, justification }`
- Botão de confirmar fica desabilitado sem justificativa

**Finalizar Laudo** (status 5 → 6)
- Campo: `attachmentUrl` — input URL, obrigatório
- Campo: `complementaryInfo` — textarea, opcional
- Chama: `PATCH /exam-management/:appointmentId/finalizar-laudo`
- Body: `{ attachmentUrl, complementaryInfo? }`
- Botão de confirmar fica desabilitado sem URL

#### Ações diretas (sem sheet)

| Ação          | Rota                                          | Transição |
|---------------|-----------------------------------------------|-----------|
| Iniciar Exame | `PATCH /exam-management/:appointmentId/iniciar`       | 2 → 3     |
| Iniciar Laudo | `PATCH /exam-management/:appointmentId/iniciar-laudo` | 4 → 5     |

Ambas sem body. Em caso de sucesso, `navigate(-1)`.

#### API

| Endpoint                                                   | Quando é chamado              |
|------------------------------------------------------------|-------------------------------|
| `GET /exam-management/:appointmentId`                      | Ao montar o componente        |
| `PATCH /exam-management/:appointmentId/iniciar`            | Botão **Iniciar Exame**       |
| `PATCH /exam-management/:appointmentId/finalizar`          | Sheet **Finalizar Exame**     |
| `PATCH /exam-management/:appointmentId/encerrar`           | Sheet **Encerrar**            |
| `PATCH /exam-management/:appointmentId/iniciar-laudo`      | Botão **Iniciar Laudo**       |
| `PATCH /exam-management/:appointmentId/finalizar-laudo`    | Sheet **Finalizar Laudo**     |

---

## Parâmetros de URL

| Tela                              | Param           | Descrição                                          |
|-----------------------------------|-----------------|----------------------------------------------------|
| `listar-pendentes`                | `date`          | DD/MM/YYYY; padrão: hoje                           |
| `detalhes-pendentes`              | `appointmentId` | ID do agendamento (path param)                     |
| `listar`                          | `date`          | DD/MM/YYYY; padrão: hoje                           |
| `listar`                          | `status`        | Código 2–6 para filtrar seção; vazio = todas       |
| `detalhes`                        | `appointmentId` | ID do agendamento (path param)                     |

---

## Rotas Registradas (`app.tsx`)

| Path                                              | Componente                        |
|---------------------------------------------------|-----------------------------------|
| `gestao-exames/listar-pendentes`                  | `ListarPendentesGestaoExames`     |
| `gestao-exames/detalhes-pendentes/:appointmentId` | `DetalhesPendentesGestaoExames`   |
| `gestao-exames/listar`                            | `ListarGestaoExames`              |
| `gestao-exames/detalhes/:appointmentId`           | `DetalhesGestaoExames`            |

---

## Comportamento por Papel

| Papel                   | Acesso                                                                 |
|-------------------------|------------------------------------------------------------------------|
| `administrative_assistant` | Sidebar "Exames" → `listar-pendentes` (fluxo de recepção)         |
| `technical_executor`    | Sidebar "Exames" → `listar` (fluxo de execução e laudo)               |
| `administrative`        | Sem acesso ao módulo                                                   |
| `medic`                 | Sem acesso ao módulo                                                   |

- O sidebar é renderizado condicionalmente via `modulo1GestaoExames` do hook `useUnitParameters`.
- O parâmetro é consultado em `GET /unit-parameters/get-parameters/:unitId`.
- Se desativado, o `TechnicalExecutorSidebarMenu` exibe mensagem orientando a contatar a Alfamed.

---

## Tipo `ExamDetail` (compartilhado pelos detalhes)

```ts
interface ExamDetail {
  id: string
  statusId: string
  isActive: boolean
  createdAt: string
  updatedAt: string
  schedules: {
    id: string; date: string; startTime: string; endTime: string
    procedures: { id: string; description: string; code: string }
    specialties: { id: string; name: string }
  }
  schedules_slots: { id: string; startTime: string; endTime: string }
  patients: {
    id: string; name: string; socialName: string; cpf: string
    phone: string; email: string; sex: string; birthdate: string
  }
  professional_units: {
    id: string
    professional: { id: string; crm: string; user: { id: string; name: string } }
  }
  requests: {
    id: string; statusId: string; statusCode: number; statusDescription: string
    performedAt: string; complementaryInfo: string; justification: string
    procedures: { id: string; description: string; code: string; price: string }
    createdAt: string; updatedAt: string
  }[]
}
```
