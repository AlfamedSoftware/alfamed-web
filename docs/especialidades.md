# Módulo de Especialidades

## Visão Geral

O módulo de Especialidades gerencia o cadastro, edição e listagem de especialidades médicas vinculadas a uma unidade. Também expõe um fluxo de vínculo entre especialidade e profissionais. Todos os dados são escopados pela unidade selecionada na sessão (`useSessionUnit`).

---

## Estrutura de Arquivos

```
src/pages/Especialidades/
├── cadastro-especialidades.tsx                        # Entrada para cadastro
├── edicao-especialidades.tsx                          # Entrada para edição
├── listar-especialidades.tsx                          # Listagem com filtros e busca
├── vinculo-especialidades-listagem-profissionais.tsx  # Vínculo especialidade → profissionais
└── Componentes/
    ├── specialty-form.tsx               # Formulário principal (cadastro + edição)
    ├── specialty-card.tsx               # Card de exibição de uma especialidade
    ├── specialty-filters.tsx            # Botões de filtro por status
    ├── specialty-search.tsx             # Campo de busca
    ├── specialty-empty-state.tsx        # Estado vazio (sem resultados)
    └── Skeleton/
        ├── edicao-especialidade-skeleton.tsx
        └── listar-especialidades-skeleton.tsx
```

---

## Fluxo Geral

```
listar-especialidades.tsx
  ├── clica em card         → edicao-especialidades.tsx (/{id})
  └── clica em "Nova"       → cadastro-especialidades.tsx

vinculo-especialidades-listagem-profissionais.tsx
  └── renderiza Profissionais com isSpecialtyLink={true}
```

---

## Listar Especialidades (`listar-especialidades.tsx`)

### Funcionalidade

Exibe todas as especialidades da unidade em grade responsiva, com filtros por status e busca textual.

### Filtros e Busca

| Recurso    | Regra                                                                 |
|------------|-----------------------------------------------------------------------|
| Filtro     | `Todos` / `Ativos` / `Inativos` — cada opção exibe sua contagem      |
| Busca      | Correspondência parcial case-insensitive no campo `name`              |

- A busca e o filtro são aplicados em sequência (filtro → busca).
- O estado vazio diferencia "sem cadastros" de "sem resultados para o filtro/busca atual".
- A listagem só é carregada se houver unidade selecionada na sessão.

### API

| Endpoint                                        | Quando é chamado                          |
|-------------------------------------------------|-------------------------------------------|
| `GET /specialties/list-by-unit?unitId=X`        | Ao montar o componente ou trocar de unidade |

---

## Cadastro e Edição (`specialty-form.tsx`)

Ambas as entradas (`cadastro-especialidades.tsx` e `edicao-especialidades.tsx`) delegam para o componente `SpecialtyProfile`, que alterna entre modo criação (`isRegisterMode={true}`) e modo edição.

### Campos do Formulário

| Campo     | Obrigatório | Regras                                       |
|-----------|-------------|----------------------------------------------|
| Descrição | Sim         | Mínimo 1 caractere; mapeado para `name` na API |
| Ativo     | —           | Toggle booleano; padrão `true`               |

> Desativar uma especialidade a remove das listas padrão de seleção em outros módulos (ex.: Procedimentos, Agendas).

### Validação (Zod)

```ts
{
  description: z.string().min(1),
  isActive: z.boolean(),
}
```

### Fluxo de Cadastro

1. Usuário preenche a descrição e define o status.
2. Ao salvar, exibe **tela de confirmação** com o nome da especialidade criada.
3. Da tela de confirmação, o usuário pode:
   - **Voltar para especialidades** — navega para `/especialidades`.
   - **Cadastrar nova especialidade** — reseta o formulário para novo cadastro.

### Fluxo de Edição

1. Formulário carrega os dados via `specialtiesService.getById(id)`.
2. Ao salvar, redireciona para `/especialidades?salvo=true` — a listagem exibe um banner verde no topo com auto-dismiss em **5 segundos**.
3. O botão **Cancelar** segue a prioridade: callback `onCancel` → `afterSavePath` → `/especialidades`.

### API

| Endpoint                                           | Quando é chamado              |
|----------------------------------------------------|-------------------------------|
| `GET /specialties/{id}`                            | Ao abrir edição               |
| `POST /specialties/` com `{ name, isActive }`      | Ao salvar no modo cadastro    |
| `PUT /specialties/` com `{ specialtyId, name, isActive }` | Ao salvar no modo edição |

---

## Vínculo com Profissionais (`vinculo-especialidades-listagem-profissionais.tsx`)

Wrapper simples que renderiza o componente `Profissionais` com a prop `isSpecialtyLink={true}`, ativando o contexto de vínculo especialidade → profissional. Não possui lógica própria.

---

## Regras de Negócio

1. **Escopo por unidade** — todas as especialidades pertencem a uma unidade; sem unidade selecionada, a listagem não carrega.
2. **Status ativo/inativo** — especialidades inativas não aparecem em listas de seleção de outros módulos.
3. **Sem exclusão** — não há fluxo de remoção de especialidades na interface.
4. **Cadastro consecutivo** — a tela de confirmação pós-cadastro permite iniciar um novo cadastro sem voltar à listagem.

---

## Dependências de API

| Serviço                                               | Uso                                |
|-------------------------------------------------------|------------------------------------|
| `specialtiesService.listByUnit(unitId)`               | Listagem                           |
| `specialtiesService.getById(specialtyId)`             | Carregar dados na edição           |
| `specialtiesService.create({ name, isActive })`       | Cadastro                           |
| `specialtiesService.update({ specialtyId, name, isActive })` | Edição                      |
