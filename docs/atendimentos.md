# Módulo de Atendimentos

## Visão Geral

O módulo de Atendimentos gerencia o fluxo clínico de uma consulta médica, desde a listagem dos agendamentos do dia até o registro de informações clínicas durante o atendimento. É composto por duas telas: a listagem por especialidade e a tela de condução do atendimento em si. Todos os dados são escopados pelo `professionalUnitId` da unidade selecionada na sessão (`useSessionUnit`).

---

## Estrutura de Arquivos

```
src/pages/Atendimentos/
├── listar-atendimentos.tsx   # Listagem de agendamentos do dia por especialidade
└── atendimento.tsx           # Tela de condução do atendimento (prontuário, status, ações)
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

Cada card exibe:
- Horário do slot (`scheduleSlotStartTime – scheduleSlotEndTime`)
- Badge de status com cor por `statusCode`
- Inicial e nome do paciente

| `statusCode` | Cor      | Descrição esperada |
|--------------|----------|--------------------|
| 1            | Azul     | Agendado           |
| 2            | Âmbar    | Em andamento       |
| 3            | Verde    | Finalizado         |
| 4            | Vermelho | Cancelado / Falta  |

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
├── Card Paciente                   Card Agendamento
│   ├── Nascimento · Idade          ├── Status badge
│   ├── Sexo                        ├── Especialidade / Procedimento
│   ├── Telefone                    └── Horário (hh:mm – hh:mm · data)
│   └── E-mail
│
├── Abas do Prontuário (flex-1, preenche até o footer)
│
└── Footer
    ├── Voltar
    ├── Registrar Falta  (só quando status = 1)
    └── Iniciar Atendimento | Finalizar  (conforme status)
```

---

### Cards de Informação

#### Card Paciente

| Campo              | Fonte                              | Formato                                              |
|--------------------|------------------------------------|------------------------------------------------------|
| Nome               | `users.socialName` ou `users.name` | Capitalizado                                         |
| Data de nascimento | `users.birthdate`                  | DD/MM/AAAA · N anos                                  |
| Sexo               | `users.sex`                        | `M` → Masculino · `F` → Feminino · outros → Outro    |
| Telefone           | `users.phone`                      | `(DDD) XXXXX-XXXX`                                   |
| E-mail             | `users.email`                      | Exibição direta                                      |

#### Card Agendamento

| Campo                 | Fonte                                                           |
|-----------------------|-----------------------------------------------------------------|
| Status                | `appointment_status.description` com cor por `code`             |
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

Os dados de **Anamnese** e **Prontuário** são buscados uma única vez assim que as condições de acesso são atendidas e armazenados no state de `ProntuarioTabs` — trocar de aba não gera nova chamada à API.

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
| 1 (Agendado)     | Bloqueado — "Inicie o atendimento para solicitar exames." |
| 2 (Em andamento) | Grid de cards clicáveis dos exames ativos da unidade; clicar marca/desmarca (fica azul `primary`). Header mostra o contador de selecionados. |
| 3 (Finalizado)   | Lista somente leitura dos exames solicitados, cada um com tag **Interno** (status do pedido) ou **Externo**. Sem exames: "Nenhum exame foi adicionado neste atendimento." |

- A lista de exames disponíveis é carregada por `GET /procedures/list-procedures-by-unit/:unitId?type=3&isActive=true`, usando o `unitId` da sessão (`useSessionUnit`).
- A seleção fica em estado local e é propagada para o componente pai (`ProntuarioTabs` → `pendingValuesRef.examProcedureIds`), junto com `clinicNotes`/`diagnostics`.
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
| `/requests/by-appointment/:appointmentId`                                       | GET    | Aba Solicitação de Exames, quando status = 3       |
| `/procedures/list-procedures-by-unit/:unitId?type=3&isActive=true`              | GET    | Aba Solicitação de Exames, quando status = 2       |

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
