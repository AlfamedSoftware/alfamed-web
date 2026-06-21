# Módulo de Agendas

## Visão Geral

O módulo de Agendas gerencia a criação de grades de horários por profissional e o agendamento de pacientes em vagas disponíveis. É composto por três fluxos principais: listagem de agendas, cadastro de nova agenda e registro de agendamento. Todos os dados são escopados pela unidade selecionada na sessão (`useSessionUnit`).

---

## Estrutura de Arquivos

```
src/pages/Agendas/
├── listar-agendas.tsx       # Listagem de agendas com filtros e visualização de vagas
├── cadastrar-agendas.tsx    # Cadastro de nova grade de horários
└── agendamentos.tsx         # Agendamento de paciente em uma vaga específica
```

---

## Fluxo Geral

```
listar-agendas.tsx
  ├── clica em vaga disponível → agendamentos.tsx (slot ID via URL)
  └── clica em "Nova Agenda"  → cadastrar-agendas.tsx (filtros ativos via URL)
```

---

## Listar Agendas (`listar-agendas.tsx`)

### Funcionalidade

Exibe todas as agendas de um dia com suas vagas, permitindo filtrar por data, profissional e especialidade. Vagas disponíveis são clicáveis e abrem o fluxo de agendamento.

### Filtros

| Filtro         | Tipo   | Regra                                              |
|----------------|--------|----------------------------------------------------|
| Data           | Input  | DD/MM/YYYY; não pode ser anterior a hoje           |
| Profissional   | Select | Apenas profissionais ativos com papel `medic`      |
| Especialidade  | Select | Apenas especialidades ativas                       |

- Navegação por dia com botões anterior/próximo. O botão anterior é desabilitado quando a data atual é hoje.
- Filtros e data são persistidos em parâmetros de URL (`date`, `professionalUnitId`, `specialtyId`).
- O botão **Nova Agenda** só é habilitado quando a data informada é válida.

### Comportamento por Papel (`selectedRoles.key`)

| Papel   | Filtro de Profissional                                                                 |
|---------|----------------------------------------------------------------------------------------|
| `medic` | Exibe apenas o próprio profissional (via `getFullDataByProfessionalUnitId`), pré-selecionado e desabilitado. A opção "Todos os profissionais" é ocultada. |
| Outros  | Lista todos os profissionais ativos com papel `medic` da unidade; seleção livre.       |

- Quando `isMedic`, o `selectedProfessionalUnitId` é inicializado com `sessionUnit.selectedProfessionalUnitId` assim que a sessão carrega (via `useEffect`), sobrescrevendo qualquer valor de URL.

### Card de Agenda

Cada agenda exibe:
- Nome do profissional e especialidade
- Contagem de vagas disponíveis vs. total
- Barra de ocupação com código de cores:

| Ocupação | Cor    |
|----------|--------|
| < 60%    | Azul   |
| 60–89%   | Âmbar  |
| ≥ 90%    | Vermelho |

- Grade de vagas:
  - **Disponível** (verde, clicável) → navega para `agendamentos.tsx`
  - **Ocupada** (vermelha, desabilitada)

### API

| Endpoint                                               | Quando é chamado            |
|--------------------------------------------------------|-----------------------------|
| `GET /professional-units/list-professional-unit-full-data-by-unit/{unitId}?isActive=true&roleKey=medic` | Ao montar (papel ≠ `medic`) |
| `GET /professional-units/professional-unit-full-data/{professionalUnitId}` | Ao montar (papel = `medic`) |
| `GET /specialties/list-by-unit?unitId=X&isActive=true` | Ao montar o componente      |
| `GET /schedules/list-full-schedule-slots?date=YYYY-MM-DD[&professionalUnitId=X][&specialtyId=Y]` | Ao alterar qualquer filtro |

---

## Cadastrar Agenda (`cadastrar-agendas.tsx`)

### Funcionalidade

Cria uma nova grade de horários para um profissional em uma data específica, definindo horário de início, quantidade de vagas e duração por consulta.

### Campos do Formulário

| Campo               | Obrigatório | Regras                                                      |
|---------------------|-------------|-------------------------------------------------------------|
| Profissional        | Sim         | Apenas ativos com papel `medic`                             |
| Especialidade       | Sim         | Apenas ativas                                               |
| Procedimento        | Sim         | Filtrado pela especialidade selecionada                     |
| Data                | Sim         | DD/MM/YYYY; não pode ser anterior a hoje                    |
| Horário de início   | Sim         | HH:MM (00:00–23:59)                                         |
| Quantidade de vagas | Sim         | Inteiro, mínimo 1                                           |
| Tempo por consulta  | Sim         | Inteiro em minutos, mínimo 1                                |

### Comportamento por Papel (`selectedRoles.key`)

| Papel   | Campo Profissional                                                                                   |
|---------|------------------------------------------------------------------------------------------------------|
| `medic` | Busca apenas o próprio professional unit, pré-seleciona e desabilita o select. Opção "Selecione um profissional" é ocultada. |
| Outros  | Lista todos os profissionais ativos com papel `medic` da unidade; seleção livre.                    |

### Regras de Negócio

- Os dropdowns de especialidade e procedimento são em cascata: selecionar uma especialidade recarrega os procedimentos disponíveis.
- **Verificação de meia-noite**: ao preencher vagas e duração, o sistema calcula se o horário final ultrapassa 00:00. Se ultrapassar, exibe aviso e bloqueia o envio.
- Parâmetros de URL pré-populam profissional, especialidade e data (vindo da listagem); para `medic`, o profissional é sempre sobrescrito pelo da sessão.
- Após salvar com sucesso, exibe tela de confirmação com detalhes da agenda criada, com opções de **Voltar** ou **Criar outra**.

### Payload Enviado à API

```ts
{
  professionalUnitId: string,
  specialtyId: string,
  procedureId: string,
  date: string,          // formato YYYY-MM-DD
  startTime: string,     // formato HH:MM
  slots: number,
  durationMinutes: number,
  isActive: true,
}
```

### API

| Endpoint                                                              | Quando é chamado                    |
|-----------------------------------------------------------------------|-------------------------------------|
| `GET /professional-units/list-professional-unit-full-data-by-unit/{unitId}?isActive=true&roleKey=medic` | Ao montar (papel ≠ `medic`) |
| `GET /professional-units/professional-unit-full-data/{professionalUnitId}` | Ao montar (papel = `medic`) |
| `GET /specialties/list-by-unit?unitId=X&isActive=true`                | Ao montar o componente              |
| `GET /procedures/list-by-unit?unitId=X&specialtyId=Y&isActive=true`   | Ao selecionar especialidade         |
| `POST /schedules/`                                                    | Ao salvar                           |

---

## Agendamentos (`agendamentos.tsx`)

### Funcionalidade

Agenda um paciente em uma vaga de horário específica. Recebe o `scheduleSlotId` via URL e exibe os detalhes da consulta. O usuário busca o paciente por CPF ou nome e confirma o agendamento.

### Busca de Paciente

| Modo  | Regra                                                     |
|-------|-----------------------------------------------------------|
| CPF   | Exatamente 11 dígitos; formatado como `XXX.XXX.XXX-XX`   |
| Nome  | Mínimo 3 caracteres; busca automática com debounce de 300ms; exibe dropdown |

### Informações Exibidas

**Dados do paciente (somente leitura após seleção):**
- Nome, CPF, data de nascimento, sexo, telefone, e-mail

**Dados da vaga (somente leitura, carregados via URL):**
- Profissional, especialidade, procedimento, unidade, endereço, data, horário, duração, preço

### Regras de Negócio

- A disponibilidade da vaga é verificada **antes de exibir** o formulário.
- A disponibilidade é verificada **novamente antes de salvar**, para evitar conflito de agendamento simultâneo.
- Se a vaga estiver ocupada, o botão **Gravar** é bloqueado e a vaga é destacada em vermelho.
- Após salvar com sucesso, exibe tela de confirmação com opção de retornar à listagem.

### Comportamento por Papel (`selectedRoles.key`)

| Papel   | Comportamento                                                                                     |
|---------|---------------------------------------------------------------------------------------------------|
| `medic` | Valida que o `professionalUnitId` do slot corresponde ao `selectedProfessionalUnitId` da sessão. Se não corresponder, exibe aviso de permissão e desabilita o botão **Gravar**. |
| Outros  | Nenhuma restrição adicional.                                                                      |

- Essa validação protege o acesso direto via URL por médicos que não pertencem à agenda do slot.

### Payload Enviado à API

```ts
{
  patientId: string,
  professionalUnitId: string,
  scheduleSlotId: string,
  startAt: string,    // ISO datetime
  endAt: string,      // ISO datetime
  diagnostics: "",
  evolution: "",
  statusId: string,
}
```

### API

| Endpoint                                                      | Quando é chamado                   |
|---------------------------------------------------------------|------------------------------------|
| `GET /schedules/full-slot/{scheduleSlotId}`                   | Ao montar o componente             |
| `GET /patients/patient-full-data-by-user-cpf/{cpf}?isActive=true` | Busca por CPF                 |
| `GET /patients/search?name={name}&isActive=true`              | Busca por nome (debounced)         |
| `POST /appointments/`                                         | Ao confirmar agendamento           |

---

## Parâmetros de URL

### `listar-agendas.tsx`
| Param               | Descrição                     |
|---------------------|-------------------------------|
| `date`              | Data no formato DD/MM/YYYY    |
| `professionalUnitId`| Filtro de profissional        |
| `specialtyId`       | Filtro de especialidade       |

### `cadastrar-agendas.tsx`
| Param               | Descrição                              |
|---------------------|----------------------------------------|
| `professionalUnitId`| Pré-popula o campo de profissional     |
| `specialtyId`       | Pré-popula o campo de especialidade    |
| `date`              | Pré-popula o campo de data             |

### `agendamentos.tsx`
| Param              | Descrição                               |
|--------------------|-----------------------------------------|
| `scheduleSlotId`   | ID da vaga selecionada (obrigatório)    |
| `date`             | Data da consulta (exibição)             |
| `professionalName` | Nome do profissional (exibição)         |
| `specialtyName`    | Nome da especialidade (exibição)        |

---

## Dependências Compartilhadas

Todos os três componentes utilizam:
- `useSessionUnit()` — unidade ativa da sessão
- `professionalsService.listByUnit()` — listagem de profissionais médicos ativos
- `specialtiesService.listByUnit()` — listagem de especialidades ativas
