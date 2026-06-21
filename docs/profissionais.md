# Módulo de Profissionais

## Visão Geral

O módulo de Profissionais gerencia o cadastro, edição, vínculo a unidades e gerenciamento de especialidades de profissionais de saúde. Suporta dois caminhos de criação: cadastro completo de novo usuário ou vínculo de profissional já existente no sistema. Todos os dados são escopados pela unidade selecionada na sessão (`useSessionUnit`).

---

## Estrutura de Arquivos

```
src/pages/Profissionais/
├── listar-profissionais.tsx                  # Listagem com filtros e busca
├── novo-profissional.tsx                     # Ponto de entrada: busca por CPF antes de cadastrar
├── cadastro-profissionais.tsx                # Wrapper para cadastro completo
├── edicao-profissionais.tsx                  # Formulário principal (cadastro + edição)
├── perfil.tsx                                # Perfil do profissional logado
├── professional-profile.tsx                  # Editor alternativo com gestão de agenda
├── profissionais-especialidades.tsx          # Vínculo profissional → especialidades
└── Componentes/
    ├── listar-profissionais-card.tsx
    ├── ProfessionalEmptyState.tsx
    ├── ProfessionalFilters.tsx
    ├── ProfessionalSearch.tsx
    ├── Toast.tsx
    └── Skeleton/
        ├── listar-profissionais-skeleton.tsx
        ├── edicao-profissional-skeleton.tsx
        ├── profissionais-especialidades-skeleton.tsx
        └── agenda-profissional-skeleton.tsx
```

---

## Fluxo Geral

```
listar-profissionais.tsx
  ├── clica em card           → edicao-profissionais.tsx (/{id})
  └── clica em "Novo"         → novo-profissional.tsx
        ├── CPF não encontrado → cadastro-profissionais.tsx (/cadastro?cpf=XXX)
        └── CPF encontrado     → seleciona papel e vincula à unidade

perfil.tsx
  └── renderiza edicao-profissionais em modo isProfileView

profissionais-especialidades.tsx
  └── acessado via /profissionais/vinculo-especialidades?professionalUnitId=X
```

---

## Listar Profissionais (`listar-profissionais.tsx`)

### Funcionalidade

Exibe todos os profissionais da unidade em grade responsiva, com filtros por status e busca por nome ou CPF.

### Filtros e Busca

| Recurso | Regra                                                              |
|---------|--------------------------------------------------------------------|
| Filtro  | `Todos` / `Ativos` / `Inativos` — cada opção exibe sua contagem   |
| Busca   | Correspondência parcial case-insensitive em `nome` e `CPF`         |

- Quando usado com a prop `isSpecialtyLink={true}` (vindo do módulo de Especialidades), exibe apenas profissionais **ativos** com papel `medic`.
- Filtros são aplicados no cliente após o fetch.

### API

| Endpoint                                                          | Quando é chamado              |
|-------------------------------------------------------------------|-------------------------------|
| `GET /professionals/list-by-unit?unitId=X&isActive=true&roleKey=medic` | Ao montar (modo vínculo) |
| `GET /professionals/list-by-unit?unitId=X`                        | Ao montar (modo padrão)       |

---

## Novo Profissional (`novo-profissional.tsx`)

### Funcionalidade

Ponto de entrada para adicionar um profissional. Verifica se o usuário já existe no sistema pelo CPF antes de decidir o caminho:

| Resultado da busca            | Ação                                                       |
|-------------------------------|------------------------------------------------------------|
| CPF não encontrado            | Redireciona para `/profissionais/cadastro?cpf={cpf}`       |
| CPF encontrado, não vinculado | Exibe seletor de papel e vincula o usuário à unidade atual |
| CPF encontrado, já vinculado  | Exibe mensagem informando o vínculo existente              |

### Regras

- CPF deve ter exatamente 11 dígitos.
- O vínculo é feito via `professionalsService.linkUserToUnit()` com o `roleId` selecionado.

### API

| Endpoint                                      | Quando é chamado        |
|-----------------------------------------------|-------------------------|
| `GET /professionals/check-by-cpf/{cpf}`       | Ao buscar o CPF         |
| `POST /professional-units/link`               | Ao confirmar o vínculo  |

---

## Cadastro e Edição (`edicao-profissionais.tsx`)

Componente central de formulário, usado em três modos:

| Modo             | Prop                    | Comportamento                                      |
|------------------|-------------------------|----------------------------------------------------|
| Cadastro         | `isRegisterMode={true}` | Cria usuário + profissional via `full-create`      |
| Edição completa  | padrão                  | Atualiza todos os campos via `full-update`         |
| Perfil           | `isProfileView={true}`  | Edição limitada do próprio perfil via `profile-update` |

### Campos do Formulário

#### Dados do Usuário

| Campo          | Obrigatório | Regras                                      |
|----------------|-------------|---------------------------------------------|
| Nome           | Sim         | String                                      |
| Nome social    | Não         | String                                      |
| CPF            | Sim         | 11 dígitos; formatado como `000.000.000-00` |
| E-mail         | Sim         | Formato de e-mail válido                    |
| Telefone       | Sim         | Formatado como `(11) 98765-4321`            |
| Data nascimento| Sim         | ISO date `YYYY-MM-DD`                       |
| Sexo           | Sim         | `M` / `F` / `O`                             |
| Senha          | Condicional | Obrigatória no cadastro (mínimo 8 caracteres); opcional na edição |
| Confirmar senha| Condicional | Deve ser igual à senha quando informada     |

#### Dados Profissionais

| Campo      | Obrigatório     | Regras                                                  |
|------------|-----------------|---------------------------------------------------------|
| Papel      | Sim (cadastro)  | Selecionado via dropdown de papéis ativos               |
| CRM Estado | Condicional     | Obrigatório se papel = `medic` (2 letras, ex.: `SP`)    |
| CRM Número | Condicional     | Obrigatório se papel = `medic` (4–6 dígitos)            |

#### Configurações de Acesso

| Campo                    | Tipo   | Descrição                                           |
|--------------------------|--------|-----------------------------------------------------|
| Status na unidade        | Toggle | Controla acesso ao sistema e visibilidade nas listas |
| Status como paciente     | Toggle | Controla acesso ao app mobile como paciente         |

### Regras de Negócio

- Quando o papel tem `roleKey === "medic"`, os campos CRM estado e CRM número tornam-se obrigatórios.
- O papel do profissional logado não pode ser alterado (campo desabilitado).
- Senhas nunca são pré-preenchidas no modo edição.
- CRM é armazenado e parseado no formato `SC12345` (2 letras + 4–6 dígitos).
- CPF e telefone são formatados automaticamente durante a digitação.
- O avatar exibe as iniciais do nome, com cor gerada a partir de hash do nome/CPF/ID.

### Validação (Zod — por modo)

| Schema                       | Usado em           | Diferencial                              |
|------------------------------|--------------------|------------------------------------------|
| `professionalRegisterSchema` | Cadastro           | Senha e confirmação obrigatórias         |
| `professionalFullSchema`     | Edição completa    | `roleId` obrigatório                     |
| `professionalProfileSchema`  | Perfil             | Requisitos relaxados, sem papel/CRM      |

### API

| Endpoint                                      | Quando é chamado         |
|-----------------------------------------------|--------------------------|
| `GET /roles?isActive=true&internal=false`     | Ao montar o formulário   |
| `POST /professional-units/full-create`        | Salvar no modo cadastro  |
| `PATCH /professional-units/full-update`       | Salvar no modo edição    |
| `PATCH /professional-units/profile-update`    | Salvar no modo perfil    |

---

## Perfil do Profissional Logado (`perfil.tsx`)

Wrapper que obtém o `professionalUnitId` da sessão (`useSessionUnit`) e renderiza `edicao-profissionais` em modo `isProfileView={true}`. Não possui lógica própria.

---

## Vínculo de Especialidades (`profissionais-especialidades.tsx`)

### Funcionalidade

Permite adicionar e remover vínculos entre um profissional e especialidades da unidade. Acessado via `/profissionais/vinculo-especialidades?professionalUnitId=X`.

### Fluxo

1. Carrega especialidades já vinculadas ao profissional.
2. Carrega todas as especialidades disponíveis na unidade.
3. Usuário seleciona uma especialidade no dropdown e clica em **Adicionar**.
4. Para remover, clica no botão de remoção de um vínculo existente (define `isActive: false`).

### Regras

- Não é possível adicionar uma especialidade já vinculada.
- A remoção não exclui o registro — apenas desativa (`isActive: false`).

### API

| Endpoint                                                    | Quando é chamado              |
|-------------------------------------------------------------|-------------------------------|
| `GET /professional-unit-specialties?professionalUnitId=X`   | Ao montar o componente        |
| `GET /specialties/list-by-unit?unitId=X&isActive=true`      | Ao montar o componente        |
| `POST /professional-unit-specialties/`                      | Ao adicionar vínculo          |
| `PATCH /professional-unit-specialties/{id}`                 | Ao remover vínculo (`isActive: false`) |

---

## Toast (`Componentes/Toast.tsx`)

Sistema de notificação interno do módulo. Utilizado para feedback de ações assíncronas.

```ts
const { toasts, dismiss, toast } = useToast()

toast.success("Profissional salvo com sucesso!")
toast.error("Erro ao salvar profissional.")
```

- Auto-dismiss após **4000ms**.
- Exporta hook `useToast()` e componente `ToastContainer`.

---

## Dependências de API

| Serviço                                         | Uso                                           |
|-------------------------------------------------|-----------------------------------------------|
| `professionalsService.listByUnit()`             | Listagem                                      |
| `professionalsService.checkUserByCpf()`         | Verificação de CPF existente                  |
| `professionalsService.linkUserToUnit()`         | Vínculo de usuário existente à unidade        |
| `professionalUnitsService.fullCreate()`         | Cadastro completo                             |
| `professionalUnitsService.fullUpdate()`         | Edição completa                               |
| `professionalUnitsService.profileUpdate()`      | Edição de perfil próprio                      |
| `professionalUnitSpecialtiesService.listByProfessionalUnit()` | Especialidades do profissional  |
| `professionalUnitSpecialtiesService.create()`   | Adicionar vínculo de especialidade            |
| `professionalUnitSpecialtiesService.update()`   | Remover vínculo de especialidade              |
| `specialtiesService.listByUnit()`               | Listar especialidades disponíveis             |
| `rolesService.list()`                           | Listar papéis disponíveis no formulário       |
