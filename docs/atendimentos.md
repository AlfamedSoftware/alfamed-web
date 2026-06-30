# Módulo de Atendimentos

## Visão Geral

O módulo de Atendimentos gerencia o fluxo clínico de uma consulta médica, desde a listagem dos agendamentos do dia até o registro de informações clínicas durante o atendimento. É composto por duas telas: a listagem por especialidade e a tela de condução do atendimento em si. Todos os dados são escopados pelo `professionalUnitId` da unidade selecionada na sessão (`useSessionUnit`).

---

## Estrutura de Arquivos

```
src/pages/Atendimentos/
├── listar-atendimentos.tsx        # Listagem de agendamentos do dia por especialidade
├── atendimento.tsx                # Tela de condução do atendimento (prontuário, status, ações)
└── Componentes/
    └── ExamRequestTab.tsx         # Aba de solicitação de exames (renderização pura; estado no pai)
```

---

## Fluxo Geral

```
listar-atendimentos.tsx
  └── clica em card de agendamento → atendimento.tsx (appointmentId via URL)
```

---

## Listar Atendimentos (`listar-atendimentos.tsx`)

### Funcionalidade

Exibe os agendamentos do dia agrupados por especialidade, com filtros de data, especialidade e status. Cada card de agendamento exibe horário, status e nome do paciente.

### Filtros

| Filtro        | Tipo   | Regra                                                                           |
|---------------|--------|---------------------------------------------------------------------------------|
| Data          | Input  | DD/MM/YYYY; padrão: hoje; navegação por dia                                     |
| Especialidade | Select | Filtra client-side os grupos exibidos; opção "Todas as especialidades"          |
| Status        | Select | Envia `statusId` como query param; opções carregadas da API; opção "Todos"     |

- Filtro de especialidade usa scroll suave até a seção correspondente (`scrollIntoView`).
- Ao alterar o filtro de status, o filtro de especialidade é resetado.
- Os agendamentos retornados são escopados pelo `professionalUnitId` da unidade ativa na sessão, enviado como query param obrigatório.
- Os três estados de fetch (loading / success / error) são gerenciados por `useReducer` para evitar renders cascateados.

### Seção de Especialidade

O cabeçalho de cada grupo exibe o nome da especialidade com a contagem de agendamentos inline:

```
Cardiologia (3)
```

Os cards são exibidos em grid responsivo: 2 colunas em telas `sm`, **4 colunas** a partir de `lg`.

### Card de Agendamento

Cada card exibe em duas seções separadas por divisor:

1. **Header** — avatar com inicial do paciente (círculo azul `bg-blue-100`) + nome completo + CPF com máscara `XXX.XXX.XXX-XX`
2. **Corpo** — badge de status, procedimento (ícone `ClipboardList`, opcional) e horário com duração

| Campo          | Detalhe                                                                   |
|----------------|---------------------------------------------------------------------------|
| Avatar         | Inicial do nome, círculo `bg-blue-100 text-blue-600`                      |
| CPF            | `patientCpf` formatado como `XXX.XXX.XXX-XX` (exibido se presente)        |
| Badge status   | Acima do procedimento no corpo do card                                    |
| Procedimento   | `scheduleProcedureName`, ícone `ClipboardList` em caixinha `bg-muted`     |
| Horário        | `startTime – endTime · N min` (duração calculada por `calcDuration`)      |

| `statusCode` | Cor      | Descrição esperada |
|--------------|----------|--------------------|
| 1            | Azul     | Agendado           |
| 2            | Âmbar    | Em andamento       |
| 3            | Verde    | Finalizado         |
| 4            | Vermelho | Cancelado / Falta  |

#### Interface `Appointment`

Campos relevantes adicionados à interface:

```ts
patientCpf?: string               // CPF do paciente (máscara aplicada no card)
scheduleProcedureName?: string    // Nome do procedimento do agendamento
```

### API

| Endpoint                                                                                                        | Quando é chamado                          |
|-----------------------------------------------------------------------------------------------------------------|-------------------------------------------|
| `GET /attendiments/list-appointments-by-specialty?date=YYYY-MM-DD&professionalUnitId=X[&statusId=Y]`           | Ao alterar data, status ou ao montar      |
| `GET /appointment-status?isActive=true`                                                                         | Uma vez ao montar (popula select de status) |

---

## Atendimento (`atendimento.tsx`)

### Funcionalidade

Tela de condução do atendimento. Exibe dados do paciente, informações do agendamento, controle de status e abas do prontuário clínico. Permite iniciar, finalizar e registrar falta de paciente.

### Rota

```
/atendimentos/:appointmentId
```

O `appointmentId` é passado via URL ao clicar em um card na listagem.

---

### Layout

```
PageHeader ("Atendimento")
├── Card Paciente (bg-primary header)    Card Agendamento (bg-primary header)
│   ├── [header] "Paciente"              ├── [header] "Agendamento" + badge status
│   ├── Nome                             ├── Especialidade
│   ├── Telefone                         ├── Procedimento
│   ├── Nascimento · Idade               ├── Data · Dia da semana
│   └── Sexo                             └── Horário · Duração
│
├── Abas do Prontuário (flex-1, preenche até o footer)
│
└── Footer
    ├── Voltar
    ├── Registrar Falta  (só quando status = 1)
    └── Iniciar Atendimento | Finalizar  (conforme status)
```

Ambos os cards seguem o padrão: `overflow-hidden` + header `bg-primary` + corpo `p-4` em grid 2×2.

---

### Cards de Informação

#### Card Paciente

Header `bg-primary` com título "Paciente" em `text-white`. Corpo em grid 2 colunas com InfoRows padrão (`size-7 bg-muted rounded-lg`):

| Campo      | Ícone            | Fonte                              | Formato                                           |
|------------|------------------|------------------------------------|---------------------------------------------------|
| Nome       | `User`           | `users.socialName` ou `users.name` | Capitalizado                                      |
| Telefone   | `Phone`          | `users.phone`                      | `(DDD) XXXXX-XXXX`                                |
| Nascimento | `Calendar`       | `users.birthdate`                  | `DD/MM/AAAA · N anos`                             |
| Sexo       | `PersonStanding` | `users.sex`                        | `M` → Masculino · `F` → Feminino · outros → Outro |

#### Card Agendamento

Header `bg-primary` com título "Agendamento" em `text-white` e badge de status em `bg-white/20 text-white`. Corpo em grid 2 colunas:

| Campo        | Ícone          | Fonte                                                           | Formato                                         |
|--------------|----------------|-----------------------------------------------------------------|-------------------------------------------------|
| Especialidade| `Stethoscope`  | `specialties.name`                                              | Exibição direta                                 |
| Procedimento | `ClipboardList`| `procedures.description`                                        | Exibição direta                                 |
| Data         | `CalendarDays` | `schedules.date`                                                | `DD/MM/AAAA · Dia da semana` (capitalizado)     |
| Horário      | `Clock`        | `schedules_slots.startTime/endTime`                             | `HH:MM – HH:MM · N min`                         |

O badge de status no header usa sempre `bg-white/20 text-white` (sem variação por código de status).

| Campo                 | Fonte                                                           |
|-----------------------|-----------------------------------------------------------------|
| Status                | `appointment_status.description`                                |
| Especialidade / Proc. | `specialties.name · procedures.description`                     |
| Horário               | `schedules_slots.startTime – endTime (N min) · schedules.date`  |

---

### Ciclo de Status

| `appointment_status.code` | Descrição    | Ações disponíveis no footer           |
|---------------------------|--------------|---------------------------------------|
| 1                         | Agendado     | Registrar Falta · Iniciar Atendimento |
| 2                         | Em andamento | Finalizar                             |
| 3                         | Finalizado   | —                                     |
| 4                         | Falta        | —                                     |

---

### Controle de Loading no Footer

Ao clicar em qualquer botão de ação, **todos os botões do footer são desabilitados** até a conclusão da operação. O loading é exibido exclusivamente no botão acionado:

| Botão               | Texto durante loading |
|---------------------|-----------------------|
| Registrar Falta     | "Registrando..."      |
| Iniciar Atendimento | "Iniciando..."        |
| Finalizar           | "Finalizando..."      |

O botão **Voltar** também fica desabilitado durante qualquer ação em andamento.

---

### Abas do Prontuário

A aba padrão ao abrir a tela é sempre **Anamnese**.

O estado dos campos **Notas Clínicas** e **Diagnóstico** é mantido em `ProntuarioTabs` — trocar de aba não descarta o conteúdo digitado.

Os dados de **Anamnese**, **Prontuário** e **Solicitação de Exames** (tanto a lista de exames disponíveis quanto os exames salvos) são buscados uma única vez assim que as condições de acesso são atendidas e armazenados no state de `ProntuarioTabs` — trocar de aba não gera nova chamada à API.

| Aba                   | Status 1 (Agendado) | Status 2 (Em andamento) | Status 3 (Finalizado) |
|-----------------------|---------------------|-------------------------|-----------------------|
| Anamnese              | Bloqueado           | Dados da anamnese       | Dados da anamnese     |
| Notas Clínicas        | Bloqueado           | Textarea editável       | Somente leitura       |
| Prontuário            | Bloqueado           | Histórico do paciente   | Bloqueado             |
| Diagnóstico           | Bloqueado           | Textarea editável       | Somente leitura       |
| Receitas              | Bloqueado           | Disponível em breve     | Bloqueado             |
| Atestados             | Bloqueado           | Disponível em breve     | Bloqueado             |
| Solicitação de Exames | Bloqueado           | Cards selecionáveis     | Lista somente leitura |

> **Bloqueado** exibe o `LockedState`: ícone de cadeado + mensagem _"Este campo só pode ser visualizado durante o atendimento."_

**Não há botão Salvar individual** nas abas. Os campos `clinicNotes` e `diagnostics` são enviados apenas ao clicar em **Finalizar**, usando os valores atuais do textarea no momento da ação.

No modo somente leitura (status 3), o conteúdo gravado é exibido em um `div` estilizado ocupando todo o espaço da aba. Se o campo estiver vazio, exibe um empty state.

---

#### Aba Anamnese

- Busca via `GET /anamnesis/{appointmentId}` (retorna array; usa o primeiro item).
- Acessível nos status **2 (Em andamento)** e **3 (Finalizado)**.
- Exibe os campos:

| Campo | Label |
|-------|-------|
| `mainComplaint` | Queixa Principal |
| `painLevel` | Nível de Dor (0–10) |
| `takingMedication` | Medicamentos em Uso |
| `knownAllergy` | Alergias Conhecidas |
| `hadSurgery` + `surgeryDetails` | Passou por Cirurgia? + detalhes |
| `familyHistory` + `familyHistoryDetails` | Histórico Familiar? + detalhes |

- Se não houver anamnese registrada, exibe empty state: _"Nenhuma anamnese foi registrada pelo aplicativo móvel."_

---

#### Aba Prontuário

- Usa o componente `PatientMedicalRecords` (importado de `src/pages/Prontuario/prontuario.tsx`).
- Busca via `useMedicalRecords(users.id, isStarted)` — somente quando status = 2.
- Exibe o histórico completo de atendimentos do paciente, idêntico à tela de Prontuário.
- Acessível **somente no status 2 (Em andamento)**.
### Aba Solicitação de Exames (`Componentes/ExamRequestTab.tsx`)

Permite ao médico solicitar exames (procedimentos do tipo `3` — Exames) durante o atendimento. O comportamento muda conforme o status:

| Status | Comportamento |
|--------|---------------|
| 1 (Agendado)     | Bloqueado — `LockedState` padrão (cadeado + _"Este campo só pode ser visualizado durante o atendimento."_) |
| 2 (Em andamento) | Grid de cards clicáveis dos exames ativos da unidade; clicar marca/desmarca (fica azul `primary`). Header mostra o contador de selecionados. |
| 3 (Finalizado)   | Lista somente leitura dos exames solicitados, cada um com tag **Interno** (status do pedido) ou **Externo**. Sem exames: "Nenhum exame foi adicionado neste atendimento." |

- A lista de exames disponíveis (`GET /procedures/list-procedures-by-unit/:unitId?type=3&isActive=true`) e os exames salvos (`GET /requests/by-appointment/:appointmentId`) são **buscados uma única vez em `ProntuarioTabs`** ao atender as condições de acesso — trocar de aba não gera nova requisição nem perde o estado.
- A seleção dos exames fica em `examIds` no `ProntuarioTabs` e é propagada via `onChange` para `ExamRequestTab` — trocar de aba preserva as seleções feitas.
- **Gravação separada da finalização:** ao clicar em **Finalizar**, o front primeiro chama `POST /requests/save-from-appointment` com os exames selecionados. **Se essa chamada falhar, a finalização é abortada** (o atendimento continua em andamento e pode ser repetido), exibindo um banner de erro. Só após o save com sucesso é que o `PATCH /finalizar` é enviado.
- A separação por **interno/externo** é decidida no backend (parâmetro `modulo1GestaoExames` da unidade + `isPerformedInUnit` do procedimento) — ver doc do backend.

---

### API

| Endpoint                                                                        | Método | Quando é chamado                                   |
|---------------------------------------------------------------------------------|--------|----------------------------------------------------|
| `/attendiments/attendiment-full-data/:appointmentId`                            | GET    | Ao montar e após qualquer ação                     |
| `/attendiments/:appointmentId/iniciar`                                          | PATCH  | Botão "Iniciar Atendimento"                        |
| `/attendiments/:appointmentId/falta`                                            | PATCH  | Botão "Registrar Falta"                            |
| `/attendiments/:appointmentId/finalizar`                                        | PATCH  | Botão "Finalizar"                                  |
| `/anamnesis/:appointmentId`                                                     | GET    | Aba Anamnese (status 2 ou 3); busca apenas uma vez |
| `/medical-records/list-patient-medical-records?userId={userId}`                 | GET    | Aba Prontuário (status 2); busca apenas uma vez    |
| `/external-requests/requisition/:appointmentId`                                 | GET    | Modal de PDF na aba Prontuário                     |
| `/requests/save-from-appointment`                                               | POST   | Ao Finalizar, **antes** do `finalizar`, se houver exames selecionados |
| `/requests/by-appointment/:appointmentId`                                       | GET    | Status = 3: uma vez ao montar `ProntuarioTabs`     |
| `/procedures/list-procedures-by-unit/:unitId?type=3&isActive=true`              | GET    | Status = 2: uma vez ao montar `ProntuarioTabs`     |

#### Payload — `finalizar`

```ts
{
  diagnostics: string,   // valor atual digitado na aba Diagnóstico
  clinicNotes: string,   // valor atual digitado na aba Notas Clínicas
}
```

> Os exames **não** vão no payload de `finalizar` — são gravados antes, via `POST /requests/save-from-appointment` (`{ appointmentId, procedureIds }`).

---

### Tipo `AttendimentFullData`

```ts
interface AttendimentFullData {
  id: string
  patientId: string
  professionalUnitId: string
  scheduleSlotId: string
  startAt: string
  endAt: string
  diagnostics: string
  evolution: string       // campo reservado, não exibido no MVP
  clinicNotes: string
  statusId: string
  statusCode: number
  statusDescription: string
  isActive: boolean
  appointment_status: {
    id: string
    code: number
    description: string
    isActive: boolean
  }
  users: {
    id: string; name: string; socialName: string; cpf: string
    birthdate: string; phone: string; email: string; sex: string
    image: string; isActive: boolean
  }
  schedules:       { id: string; date: string; isActive: boolean }
  schedules_slots: { id: string; startTime: string; endTime: string; isActive: boolean }
  specialties:     { id: string; name: string; isActive: boolean }
  procedures: {
    id: string; type: number; description: string; observation: string
    code: string; price: string; isActive: boolean
  }
}
```

---

## Pendências

| Item                              | Status                                              |
|-----------------------------------|-----------------------------------------------------|
| Campo `evolution`                 | Presente no payload, não exibido no MVP             |
| Receitas, Atestados, Solicitações | Abas bloqueadas, implementação futura               |
