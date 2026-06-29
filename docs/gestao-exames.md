# Módulo de Gestão de Exames

## Visão Geral

O módulo de Gestão de Exames reúne os pedidos de exame criados durante os atendimentos e permite que a equipe administrativa visualize e gerencie esses pedidos. O fluxo é composto por duas telas: a listagem de pedidos pendentes filtrada por data e a tela de detalhes de um pedido específico com confirmação de pagamento.

---

## Estrutura de Arquivos

```
src/pages/GestaoExames/
├── listar-pendentes-gestao-exames.tsx    # Listagem de pedidos com status pendente
└── detalhes-pendentes-gestao-exames.tsx  # Detalhes do pedido com confirmação
```

---

## Fluxo Geral

```
listar-pendentes-gestao-exames.tsx
  └── clica em card → detalhes-pendentes-gestao-exames.tsx (appointmentId via URL)
```

---

## Listar Pedidos Pendentes (`listar-pendentes-gestao-exames.tsx`)

### Funcionalidade

Exibe todos os pedidos de exame com `statusId: 1` (pendente) para a data selecionada. O filtro de data é persistido em parâmetros de URL, permitindo recarregar a página sem perder o estado.

### Filtros

| Filtro | Tipo  | Regra                                                                   |
|--------|-------|-------------------------------------------------------------------------|
| Data   | Input | DD/MM/YYYY; padrão: hoje; navegação por dia com botões anterior/próximo |

- Apenas pedidos com `statusId=1` são buscados (valor fixo na query, sem controle do usuário).
- A máscara `DD/MM/YYYY` é aplicada automaticamente enquanto o usuário digita.
- Os botões de navegação por dia ficam desabilitados enquanto a data for inválida.
- A data é sincronizada com URL (`?date=DD/MM/YYYY`) via `setSearchParams`.

### Card de Pedido

Cada card é dividido em duas seções separadas por divisor `h-px bg-border`:

1. **Header** — avatar com inicial do nome (círculo azul `bg-blue-100 text-blue-600`) + nome do paciente + CPF com máscara `XXX.XXX.XXX-XX`
2. **Corpo** — campos com ícone em caixinha `size-6 bg-muted rounded-md`:
   - Profissional — `User` + nome + especialidade separada por `—` na mesma linha (ex: `Dr. João — Cardiologia`)
   - Procedimento — `ClipboardList` + descrição do procedimento
   - Contagem — `FlaskConical` + `N exame(s) solicitado(s)`

O grid é responsivo: 1 coluna mobile → 2 em `sm` → 4 a partir de `lg`.

### API

| Endpoint                                               | Quando é chamado               |
|--------------------------------------------------------|--------------------------------|
| `GET /exam-management/?date=YYYY-MM-DD&statusId=1`     | Ao alterar a data ou ao montar |

---

## Detalhes do Pedido (`detalhes-pendentes-gestao-exames.tsx`)

### Funcionalidade

Exibe todas as informações do pedido de exame selecionado: dados do paciente, dados do atendimento que originou o pedido e a lista de exames com valores individuais e total. Permite confirmar o pagamento (endpoint pendente de implementação).

### Layout

```
PageHeader ("Detalhes do Exame")
├── [grid 2 colunas]
│   ├── Card Paciente
│   │   ├── Nome
│   │   ├── CPF
│   │   ├── Nascimento · Idade
│   │   ├── Sexo
│   │   ├── Telefone
│   │   └── E-mail
│   └── Card Atendimento
│       ├── Profissional
│       ├── Especialidade
│       ├── Procedimento
│       ├── Data · Dia da semana
│       └── Horário (HH:MM – HH:MM · N min)
│
├── Card Exames Solicitados
│   ├── Lista: ícone · descrição · código · preço unitário
│   └── Linha de total
│
└── Footer
    ├── Voltar
    └── Confirmar
```

### Card Paciente

| Campo      | Fonte                                    | Formato                                           |
|------------|------------------------------------------|---------------------------------------------------|
| Nome       | `patients.socialName` ou `patients.name` | Exibição direta                                   |
| CPF        | `patients.cpf`                           | `XXX.XXX.XXX-XX`                                 |
| Nascimento | `patients.birthdate` (`YYYY-MM-DD`)      | `DD/MM/AAAA · N anos`                            |
| Sexo       | `patients.sex`                           | `M` → Masculino · `F` → Feminino · `O` → Outro   |
| Telefone   | `patients.phone`                         | `(DDD) XXXXX-XXXX` ou `(DDD) XXXX-XXXX`         |
| E-mail     | `patients.email`                         | Exibição direta                                   |

### Card Atendimento

| Campo        | Fonte                                        | Formato                                         |
|--------------|----------------------------------------------|-------------------------------------------------|
| Profissional | `professional_units.professional.user.name`  | Exibição direta                                 |
| Especialidade| `schedules.specialties.name`                 | Exibição direta                                 |
| Procedimento | `schedules.procedures.description`           | Exibição direta                                 |
| Data         | `schedules.date` (`YYYY-MM-DD`)              | `DD/MM/AAAA · Dia da semana` (capitalizado)     |
| Horário      | `schedules_slots.startTime/endTime`          | `HH:MM – HH:MM · N min` (duração calculada)    |

### Card Exames Solicitados

- Header com badge mostrando a contagem: `N exame(s)`.
- Cada item: ícone de frasco + nome do procedimento + código (`Cód. XXXX`) + preço formatado em BRL.
- Linha de **Total** abaixo da lista com a soma de todos os preços.
- Se não houver exames, exibe mensagem `"Nenhum exame solicitado."`.

### Botão Confirmar

Chama `handleConfirmar()`. O endpoint de confirmação de pagamento ainda não está implementado (stub marcado com `// TODO`). O botão fica desabilitado enquanto os dados estão carregando ou ausentes.

### API

| Endpoint                              | Quando é chamado        |
|---------------------------------------|-------------------------|
| `GET /exam-management/:appointmentId` | Ao montar o componente  |

### Tipo `ExamDetail`

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

---

## Parâmetros de URL

### `listar-pendentes-gestao-exames.tsx`

| Param  | Descrição                                                              |
|--------|------------------------------------------------------------------------|
| `date` | Data no formato DD/MM/YYYY; padrão: hoje; persistido via `setSearchParams` |

### `detalhes-pendentes-gestao-exames.tsx`

| Param           | Descrição                               |
|-----------------|-----------------------------------------|
| `appointmentId` | ID do pedido (obrigatório, via URL path) |

---

## Comportamento por Papel

Este módulo é acessível **exclusivamente pelo papel `administrative_assistant`** e somente quando o parâmetro `modulo1GestaoExames` da unidade estiver ativo (`true`).

- Se o parâmetro estiver desativado, o item **Exames não aparece no sidebar** — o assistente vê apenas Início e Agendas.
- Os demais papéis (`administrative`, `medic`, `technical_executor`) não têm o item no sidebar e não acessam este módulo.

> O parâmetro é consultado via `GET /unit-parameters/get-parameters/:unitId` pelo hook `useUnitParameters`, dentro do `AssistantSidebarMenu`.

---

## Pendências

| Item                           | Status                                               |
|--------------------------------|------------------------------------------------------|
| Confirmar pagamento            | Endpoint não implementado — `handleConfirmar` é stub |
| Filtros adicionais na listagem | Apenas filtro de data disponível no MVP              |
