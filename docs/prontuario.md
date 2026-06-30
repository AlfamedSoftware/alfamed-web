# Módulo de Prontuário

## Visão Geral

O módulo de Prontuário permite consultar o histórico clínico de um paciente. O usuário busca o paciente por CPF ou nome e, a partir do `userId` encontrado, carrega todos os atendimentos registrados em um único card estruturado no estilo de livro de prontuário.

A lógica de exibição de atendimentos também é reutilizada na aba **Prontuário** da tela de Atendimento (`src/pages/Atendimentos/atendimento.tsx`).

---

## Estrutura de Arquivos

```
src/pages/Prontuario/
└── prontuario.tsx    # Hook, componente reutilizável e página de busca
```

Rota registrada em `src/app.tsx`:

```
prontuario    →    Prontuario
```

---

## Exports

| Export | Tipo | Descrição |
|--------|------|-----------|
| `useMedicalRecords(userId, enabled?)` | Hook | Busca e cacheia os dados do prontuário. `enabled` padrão `true`. |
| `PatientMedicalRecords` | Componente | Exibe a lista de atendimentos. Recebe `{ patientData, isLoading, error }` como props. |
| `Prontuario` | Componente | Página completa com busca + card do paciente + `PatientMedicalRecords`. |

---

## Fluxo Geral

```
1. Usuário busca paciente (CPF ou nome)
2. Busca retorna → extrai users.id
3. useMedicalRecords chama /medical-records/list-patient-medical-records?userId={userId}
4. Exibe card "Prontuário do Paciente":
     ├── Dados do paciente (nome, CPF, nascimento, sexo, telefone, e-mail)
     └── <PatientMedicalRecords> — lista de atendimentos do mais recente ao mais antigo
```

---

## Hook `useMedicalRecords`

```ts
useMedicalRecords(userId: string | null, enabled?: boolean)
// retorna: { patientData, isLoading, error }
```

- Não busca se `userId` for `null` ou `enabled` for `false`.
- Limpa `patientData` ao mudar de `userId`.
- Usado tanto na página `Prontuario` quanto na aba Prontuário do `Atendimento`.

---

## Busca de Paciente (somente na página `Prontuario`)

| Modo | Comportamento |
|------|---------------|
| CPF  | Input com máscara `XXX.XXX.XXX-XX`; botão Buscar habilitado com 11 dígitos; chama `GET /patients/patient-full-data-by-user-cpf/{cpf}?isActive=true` |
| Nome | Input com debounce de 300ms; busca automática a partir de 3 caracteres; exibe dropdown de resultados; chama `GET /patients/patient-full-data-by-user-name?name={name}&isActive=true` |

- Trocar de modo limpa todos os estados (paciente, inputs, erros).
- Ao selecionar via dropdown de nome, um `ref` (`skipNameSearchRef`) previne nova busca disparada pela atualização do input.
- Somente o `users.id` (userId) é armazenado após a seleção — os dados do paciente vêm do endpoint de prontuário.

---

## Componente `PatientMedicalRecords`

Props:

```ts
{
  patientData: PatientWithAppointments | null
  isLoading: boolean
  error: string | null
}
```

Responsável por toda a renderização da lista de atendimentos, incluindo skeleton, estado de erro, estado vazio, cards de atendimento, registros clínicos colapsáveis e modal de PDF.

### Ordenação

Os atendimentos são exibidos na ordem retornada pela API:

**`schedules.date DESC + schedule_slots.startTime DESC`** — mais recente primeiro.

Numerados de forma **invertida**: o atendimento mais recente (index 0) recebe o número **N** (total), o mais antigo recebe **1** — leitura cronológica ascendente na numeração.

### Card de Atendimento

- **Borda esquerda primária** (`border-l-4 border-l-primary`) — separação visual estilo timeline
- **Sem cabeçalho separado**: título "Atendimento N" + badge de status compõem a primeira linha do grid (span `col-span-3`)
- **Grid 3 colunas** com InfoRows padrão (`size-7 bg-muted rounded-lg`):

| InfoRow       | Ícone          |
|---------------|----------------|
| Unidade       | `Building2`    |
| Data          | `CalendarDays` |
| Horário       | `Clock`        |
| Profissional  | `User`         |
| Especialidade | `Stethoscope`  |
| Procedimento  | `ClipboardList`|

- **Registros clínicos colapsáveis**: botão `▾ Ver registros clínicos` visível quando há ao menos um campo; expande diagnóstico, evolução, notas clínicas, procedimentos internos e externos

#### Cores de status (`appointment_status.code`)

| Code | Cor |
|------|-----|
| 1 | Azul |
| 2 | Âmbar |
| 3 | Verde |
| 4 | Vermelho |
| outros | Muted |

#### Registros clínicos expandidos

| Campo | Condição de exibição |
|-------|----------------------|
| Diagnóstico | `appt.diagnostics` preenchido |
| Evolução | `appt.evolution` preenchido |
| Notas clínicas | `appt.clinicNotes` preenchido |
| Procedimentos internos | `appt.requests.length > 0` |
| Procedimentos externos | `appt.external_requests.length > 0` |

**Procedimentos internos** (`requests`) — cada item exibe:
- Código + descrição + badge de status (`request_status.code` usa a mesma paleta de `appointment_status`)
- Valor (`R$ X,XX`), data de realização (`performedAt`), info. complementar e justificativa (opcionais)
- Indicador verde "Resultado disponível" quando `request_results.releasedAt` está preenchido

**Procedimentos externos** (`external_requests`) — cada item exibe `code - description` e um botão **"Ver requisição"** que abre o modal de PDF.

### Modal de PDF (Requisição Externa)

Ativado pelo botão "Ver requisição" dentro dos procedimentos externos.

- Faz `fetch` em `GET /external-requests/requisition/{appointmentId}` com `credentials: "include"`.
- Cria um Blob URL e exibe o PDF em `<iframe>`.
- Botões: **Imprimir** (`iframe.contentWindow.print()`) e **Download** (âncora com `download`).
- Ao fechar, revoga o Blob URL via `URL.revokeObjectURL`.

---

## Uso na Aba Prontuário do Atendimento

Em `src/pages/Atendimentos/atendimento.tsx`, o componente `PatientMedicalRecords` é usado na aba "Prontuário" do prontuário de atendimento. O hook é chamado em `ProntuarioTabs` com `enabled = isStarted` para que o fetch aconteça uma única vez ao iniciar o atendimento, sem refazer a chamada ao trocar de aba.

```ts
const { patientData, isLoading, error } = useMedicalRecords(data.users.id, isStarted)
// ...
<PatientMedicalRecords patientData={patientData} isLoading={isLoading} error={error} />
```

A aba fica bloqueada (`LockedState`) enquanto o atendimento não for iniciado.

---

## Formatação de Datas

A função `formatDate` trata dois formatos:

| Formato | Tratamento |
|---------|-----------|
| Date-only (`"2026-06-27"`) | Parseado via `new Date(year, month-1, day)` para evitar conversão UTC→local que causaria exibição do dia anterior |
| Datetime (`"2026-06-27T..."`) | `toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" })` |

---

## API

| Endpoint | Quando é chamado |
|----------|-----------------|
| `GET /patients/patient-full-data-by-user-cpf/{cpf}?isActive=true` | Ao buscar por CPF |
| `GET /patients/patient-full-data-by-user-name?name={name}&isActive=true` | Ao digitar nome (debounce 300ms) |
| `GET /medical-records/list-patient-medical-records?userId={userId}` | Ao selecionar paciente |
| `GET /external-requests/requisition/{appointmentId}` | Ao abrir modal de PDF |

### Estrutura do response de prontuário

```ts
{
  id: string
  name: string
  socialName?: string
  email: string
  phone?: string
  cpf: string
  birthdate: string
  sex?: string           // "M" | "F" | "O"
  isActive: boolean
  appointments: {        // ordenado por schedules.date DESC + schedule_slots.startTime DESC
    id: string
    diagnostics: string
    evolution: string
    clinicNotes: string
    startAt: string | null
    endAt: string | null
    schedules:           { date, startTime, endTime, durationMinutes, ... }
    schedule_slots:      { startTime, endTime, ... }
    appointment_status:  { code: number, description: string, ... }
    specialties:         { name: string, ... }
    procedures:          { description: string, code: string, price: string, ... }
    units:               { name: string, address, city, state, ... }
    professionals:       { crm: string, ... }
    professional_user:   { name: string, socialName?: string, ... }
    requests: {
      id: string
      complementaryInfo: string | null
      performedAt: string | null
      justification: string | null
      internalProcedures: { code: string, description: string, price: string, isPerformedInUnit: boolean, ... }
      request_status:     { code: number, description: string, ... }
      request_results:    { releasedAt: string, complementaryInfo: string, ... } | null
    }[]
    external_requests: {
      id: string
      externalProcedures: { code: string, description: string, ... }
    }[]
  }[]
}
```

---

## Estado de Carregamento (Skeleton)

O skeleton replica fielmente a estrutura do card real:

- **Seção paciente** (na página `Prontuario`): 3 colunas — (1) avatar circle + nome + CPF, (2) nascimento + sexo, (3) telefone + e-mail; cada campo com caixinha de ícone `size-7 rounded-lg`
- **Seção atendimentos** (`PatientMedicalRecords`): 3 cards com título + badge na primeira linha do grid (sem cabeçalho separado) e 6 InfoRow skeletons em grid 3 colunas; borda esquerda em `border-l-primary/30`
