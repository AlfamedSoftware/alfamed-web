# Módulo de Profissionais

## Visão Geral

O módulo de Profissionais gerencia o cadastro, edição, vínculo a unidades e gerenciamento de especialidades de profissionais de saúde. Suporta dois caminhos de criação: cadastro completo de novo usuário ou vínculo de profissional já existente no sistema. Todos os dados são escopados pela unidade selecionada na sessão (`useSessionUnit`).

---

## Estrutura de Arquivos

```
src/pages/Profissionais/
├── listar-profissionais.tsx                  # Listagem com filtros e busca
├── importar-profissional.tsx                 # Importação: busca por CPF ou nome antes de cadastrar
├── cadastro-profissionais.tsx                # Wrapper para cadastro completo
├── edicao-profissionais.tsx                  # Formulário principal (cadastro + edição)
├── perfil.tsx                                # Perfil do profissional logado
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
        └── profissionais-especialidades-skeleton.tsx
```

---

## Fluxo Geral

```
listar-profissionais.tsx  (/profissionais)
  ├── clica em card           → edicao-profissionais.tsx (/profissionais/edicao/:id)
  └── clica em "Novo"         → importar-profissional.tsx (/profissionais/importacao)
        ├── CPF/nome não encontrado → cadastro-profissionais.tsx (/profissionais/cadastro?cpf=XXX)
        │     └── sucesso → tela de confirmação → Voltar para profissionais | Cadastrar novo profissional
        └── CPF/nome encontrado, não vinculado → seleciona cargo → vincula → banner verde na mesma tela

perfil.tsx
  └── renderiza edicao-profissionais em modo isProfileView

profissionais-especialidades.tsx
  └── acessado via /profissionais/vinculo-especialidades?professionalUnitId=X
```

---

## Listar Profissionais (`listar-profissionais.tsx`)

### Funcionalidade

Exibe todos os profissionais da unidade em grade responsiva, com filtros por status e busca por nome ou CPF. Exibe um banner verde no topo após redirecionamento de edição bem-sucedida (`?salvo=true`), com auto-dismiss em **5 segundos**.

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

## Importar Profissional (`importar-profissional.tsx`)

### Funcionalidade

Ponto de entrada para adicionar um profissional à unidade. Suporta dois modos de busca (alternáveis por toggle): **CPF** e **Nome**. Verifica se o usuário já existe no sistema antes de decidir o caminho:

| Resultado da busca            | Ação                                                                    |
|-------------------------------|-------------------------------------------------------------------------|
| Não encontrado                | Redireciona para `/profissionais/cadastro?cpf={cpf}`                    |
| Encontrado, não vinculado     | Exibe card verde + seletor de cargo → vincula → banner verde na tela    |
| Encontrado, já vinculado      | Exibe card âmbar informando o vínculo existente                         |

### Busca por Nome

- Debounce de 300ms após digitar ao menos 3 caracteres.
- Dropdown posicionado abaixo do campo de busca com os resultados.
- Ao selecionar um resultado, o formulário é preenchido com os dados já retornados — sem segunda chamada à API.
- `skipNameSearchRef` evita re-busca ao selecionar um item do dropdown.

### Regras

- CPF deve ter exatamente 11 dígitos.
- O vínculo exige seleção de cargo (`roleId`) antes de confirmar.
- Após vínculo bem-sucedido: banner verde no topo da tela some após **5 segundos**, busca é limpa.

### API

| Endpoint                                                          | Quando é chamado              |
|-------------------------------------------------------------------|-------------------------------|
| `GET /professionals/professional-by-user-cpf?cpf={cpf}`          | Ao buscar por CPF             |
| `GET /professionals/professional-by-user-name?name={nome}`       | Ao buscar por nome (debounce) |
| `GET /roles?isActive=true&internal=false`                         | Ao montar (lista de cargos)   |
| `POST /professional-units/create-by-user-cpf`                    | Ao confirmar o vínculo        |

---

## Cadastro e Edição (`edicao-profissionais.tsx`)

Componente central de formulário, usado em três modos:

| Modo             | Prop                    | Comportamento                                                         |
|------------------|-------------------------|-----------------------------------------------------------------------|
| Cadastro         | `isRegisterMode={true}` | Cria usuário + profissional via `full-create` → tela de confirmação   |
| Edição completa  | padrão                  | Atualiza todos os campos via `full-update` → banner verde na lista    |
| Perfil           | `isProfileView={true}`  | Edição limitada do próprio perfil via `profile-update`                |

#### Tela de Confirmação (modo Cadastro)

Após salvar com sucesso no modo cadastro, o formulário é substituído por uma tela de confirmação com:
- Ícone verde `CheckCircle2` + nome do profissional cadastrado.
- **Voltar para profissionais** → `/profissionais`
- **Cadastrar novo profissional** → `/profissionais/importacao`

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
| Senha          | Varia       | **Cadastro:** obrigatória, label "Senha" (mínimo 8 caracteres). **Edição:** opcional, label "Nova senha (opcional)"; apenas validada se preenchida. Sempre visível em todos os modos. |
| Confirmar senha| Varia       | Obrigatória quando senha é preenchida; deve ser igual à senha. Label "Confirme a senha" em todos os modos. |

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
- Os campos de senha aparecem em **todos os modos** (cadastro e edição). No modo edição o campo é exibido como "Nova senha (opcional)" e só é enviado à API se preenchido. Os campos nunca são pré-preenchidos.
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

Sistema de notificação interno do módulo. Utilizado para feedback de **erros** em ações assíncronas (ex.: falha ao vincular profissional, CPF inválido).

```ts
const { toasts, dismiss, toast } = useToast()

toast.error("Erro ao vincular profissional.")
```

- Auto-dismiss após **4000ms**.
- Exporta hook `useToast()` e componente `ToastContainer`.
- Feedback de **sucesso** é exibido via banner verde no topo da tela ou via tela de confirmação, não via Toast.

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
