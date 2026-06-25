# Módulo de Prontuário

## Visão Geral

O módulo de Prontuário permite consultar o histórico clínico de um paciente. O usuário busca o paciente por CPF ou nome e, a partir do `userId` encontrado, carrega todos os atendimentos registrados em um único card estruturado no estilo de livro de prontuário.

---

## Estrutura de Arquivos

```
src/pages/Prontuario/
└── prontuario.tsx    # Busca de paciente e exibição do histórico de atendimentos
```

Rota registrada em `src/app.tsx`:

```
prontuario    →    Prontuario
```

---

## Fluxo Geral

```
1. Usuário busca paciente (CPF ou nome)
2. Busca retorna → extrai users.id
3. Chama /medical-records/list-patient-medical-records?userId={userId}
4. Exibe card "Prontuário do Paciente":
     ├── Dados do paciente (nome, CPF, nascimento, sexo, telefone, e-mail)
     └── Lista de atendimentos (do mais recente ao mais antigo)
```

---

## Busca de Paciente

| Modo | Comportamento |
|------|---------------|
| CPF  | Input com máscara `XXX.XXX.XXX-XX`; botão Buscar habilitado com 11 dígitos; chama `GET /patients/patient-full-data-by-user-cpf/{cpf}?isActive=true` |
| Nome | Input com debounce de 300ms; busca automática a partir de 3 caracteres; exibe dropdown de resultados; chama `GET /patients/patient-full-data-by-user-name?name={name}&isActive=true` |

- Trocar de modo limpa todos os estados (paciente, inputs, erros).
- Ao selecionar via dropdown de nome, um `ref` (`skipNameSearchRef`) previne nova busca disparada pela atualização do input.
- Somente o `users.id` (userId) é armazenado após a seleção — os dados do paciente vêm do endpoint de prontuário.

---

## Card "Prontuário do Paciente"

Exibido assim que `userId` é definido. Enquanto carrega, exibe skeleton fiel à estrutura real.

### Seção de Dados do Paciente

Campos exibidos (vindos da raiz do response):

| Campo | Exibição |
|-------|----------|
| Nome | `socialName` ou `name` |
| CPF | Formatado como `XXX.XXX.XXX-XX` |
| Data de nascimento | Localizada para `pt-BR` |
| Sexo | Mapeado: `M` → Masculino, `F` → Feminino, `O` → Outros, `null/undefined` → Não informado |
| Telefone | Formatado com DDD: `(XX) XXXXX-XXXX` |
| E-mail | Exibido truncado |

### Seção de Atendimentos

Lista os registros em ordem inversa de índice — o último item do array é numerado como **Atendimento 1** (o mais recente).

Cada registro é um card com:

- **Borda esquerda primária** (`border-l-4 border-l-primary`) para separação visual estilo timeline
- **Cabeçalho** (`bg-muted/40`): título "Atendimento N" em cor primária + badge de status
- **Grid 3×2** com ícones: Unidade · Data · Horário / Profissional · Especialidade · Procedimento
- **Registros clínicos colapsáveis**: botão `▾ Ver registros clínicos` (oculto se nenhum campo preenchido); expande diagnóstico, evolução e notas clínicas individualmente

#### Cores de status (`appointment_status.code`)

| Code | Cor |
|------|-----|
| 1 | Azul |
| 2 | Âmbar |
| 3 | Verde |
| 4 | Vermelho |
| outros | Muted |

Estado vazio (sem atendimentos): ícone de documento + mensagem "Nenhum registro encontrado para este paciente."

---

## API

| Endpoint | Quando é chamado |
|----------|-----------------|
| `GET /patients/patient-full-data-by-user-cpf/{cpf}?isActive=true` | Ao buscar por CPF |
| `GET /patients/patient-full-data-by-user-name?name={name}&isActive=true` | Ao digitar nome (debounce 300ms) |
| `GET /medical-records/list-patient-medical-records?userId={userId}` | Ao selecionar paciente |

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
  appointments: {
    id: string
    diagnostics: string
    evolution: string
    clinicNotes: string
    startAt: string
    endAt: string
    schedules:           { date, startTime, endTime, durationMinutes, ... }
    schedule_slots:      { startTime, endTime, ... }
    appointment_status:  { code: number, description: string, ... }
    specialties:         { name: string, ... }
    procedures:          { description: string, code: string, price: string, ... }
    units:               { name: string, address, city, state, ... }
    professionals:       { crm: string, ... }
    professional_user:   { name: string, socialName?: string, ... }
  }[]
}
```

---

## Estado de Carregamento (Skeleton)

O skeleton replica fielmente a estrutura do card real:

- **Seção paciente**: círculo de avatar + duas linhas (nome/CPF) + grid 4 colunas com label e valor
- **Seção atendimentos**: 3 cards com cabeçalho (título + badge) e grid 3×2 com label e valor; borda esquerda em `border-l-primary/30`
