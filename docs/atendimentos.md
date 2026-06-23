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

Exibe os agendamentos do dia agrupados por especialidade, com filtro de data e especialidade. Cada card de agendamento exibe horário, status e nome do paciente.

### Filtros

| Filtro        | Tipo   | Regra                                           |
|---------------|--------|-------------------------------------------------|
| Data          | Input  | DD/MM/YYYY; padrão: hoje; navegação por dia     |
| Especialidade | Select | Filtra os grupos exibidos; opção "Todas"        |

- Filtro de especialidade usa scroll suave até a seção correspondente (`scrollIntoView`).
- Os agendamentos retornados são escopados pelo `professionalUnitId` da unidade ativa na sessão, enviado como query param obrigatório.

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

| Endpoint                                                                                       | Quando é chamado          |
|-----------------------------------------------------------------------------------------------|---------------------------|
| `GET /attendiments/list-appointments-by-specialty?date=YYYY-MM-DD&professionalUnitId=X`      | Ao alterar data ou montar |

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

| Aba                   | Status 1 (Agendado) | Status 2 (Em andamento) | Status 3 (Finalizado) |
|-----------------------|---------------------|-------------------------|-----------------------|
| Anamnese              | Empty state (mobile)| Empty state (mobile)    | Empty state (mobile)  |
| Notas Clínicas        | Bloqueado           | Textarea editável       | Somente leitura       |
| Prontuário            | Disponível em breve | Disponível em breve     | Disponível em breve   |
| Diagnóstico           | Bloqueado           | Textarea editável       | Somente leitura       |
| Receitas              | Disponível em breve | Disponível em breve     | Disponível em breve   |
| Atestados             | Disponível em breve | Disponível em breve     | Disponível em breve   |
| Solicitação de Exames | Disponível em breve | Disponível em breve     | Disponível em breve   |

**Não há botão Salvar individual** nas abas. Os campos `clinicNotes` e `diagnostics` são enviados apenas ao clicar em **Finalizar**, usando os valores atuais do textarea no momento da ação.

No modo somente leitura (status 3), o conteúdo gravado é exibido em um `div` estilizado ocupando todo o espaço da aba. Se o campo estiver vazio, exibe um empty state.

---

### API

| Endpoint                                                              | Método  | Quando é chamado                       |
|-----------------------------------------------------------------------|---------|----------------------------------------|
| `/attendiments/attendiment-full-data/:appointmentId`                  | GET     | Ao montar e após qualquer ação         |
| `/attendiments/:appointmentId/iniciar`                                | PATCH   | Botão "Iniciar Atendimento"            |
| `/attendiments/:appointmentId/falta`                                  | PATCH   | Botão "Registrar Falta"                |
| `/attendiments/:appointmentId/finalizar`                              | PATCH   | Botão "Finalizar"                      |
| `/attendiments/:appointmentId/anamnese`                               | GET     | Aba Anamnese *(endpoint não criado)*   |

#### Payload — `finalizar`

```ts
{
  diagnostics: string,   // valor atual digitado na aba Diagnóstico
  clinicNotes: string,   // valor atual digitado na aba Notas Clínicas
}
```

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
| Aba Anamnese                      | Aguarda criação da tabela e endpoint no backend     |
| Campo `evolution`                 | Presente no payload, não utilizado no MVP           |
| Prontuário, Receitas, Atestados   | Telas com empty state, implementação futura         |
