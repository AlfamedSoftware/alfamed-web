# Módulo de Procedimentos

## Visão Geral

O módulo de Procedimentos permite cadastrar, editar e listar procedimentos médicos vinculados a uma unidade. Todos os dados são escopados pela unidade selecionada na sessão (`useSessionUnit`).

---

## Estrutura de Arquivos

```
src/pages/Procedimentos/
├── cadastro-procedimentos.tsx       # Entrada para cadastro
├── edicao-procedimentos.tsx         # Entrada para edição
├── listar-procedimentos.tsx         # Listagem com filtros e busca
└── Componentes/
    ├── procedure-form.tsx            # Formulário principal (cadastro + edição)
    ├── listar-procedimentos-card.tsx # Card de exibição de um procedimento
    ├── ProcedureFilters.tsx          # Botões de filtro por status
    ├── ProcedureSearch.tsx           # Campo de busca
    ├── ProcedureEmptyState.tsx       # Estado vazio (sem resultados)
    └── Skeleton/
        ├── listar-procedimentos-skeleton.tsx
        └── edicao-procedimento-skeleton.tsx
```

---

## Regras de Negócio

### Tipos de Procedimento

| Código | Descrição  | Especialidade Obrigatória |
|--------|------------|--------------------------|
| `1`    | Consulta   | Sim                      |
| `2`    | Retorno    | Sim                      |
| `3`    | Exame      | Não                      |

Quando o tipo selecionado for **Consulta** ou **Retorno**, o campo de especialidade torna-se obrigatório e é exibido no formulário. Para **Exame**, o campo de especialidade é ocultado e ignorado.

### Código do Procedimento

- Exatamente **10 caracteres** alfanuméricos.
- Automaticamente convertido para **maiúsculas** ao digitar.
- Validado por regex: apenas letras e números.

### Preço

- Formato brasileiro: `1.234,56` (separador de milhar com ponto, decimal com vírgula).
- Aceita entrada em múltiplos formatos (`120`, `120.00`, `120,00`, `1.234,56`) e normaliza ao sair do campo.
- A validação exige o formato final `X,XX` ou `X.XXX,XX`.

### Status (Ativo / Inativo)

- Controla se o procedimento aparece em listagens de seleção em outros contextos.
- Padrão: **ativo** ao cadastrar.
- Na listagem, é possível filtrar por `Todos`, `Ativos` ou `Inativos`.

### Escopo por Unidade

- Todos os procedimentos pertencem a uma unidade (`selectedUnitId`).
- Se nenhuma unidade estiver selecionada na sessão, a listagem não exibe procedimentos.

---

## Fluxos de Tela

### Cadastro

1. Usuário preenche o formulário em `cadastro-procedimentos.tsx` (que delega ao `ProcedureForm` com `isRegisterMode={true}`).
2. Ao salvar com sucesso, exibe uma **tela de confirmação** com o nome do procedimento registrado.
3. Da tela de confirmação, o usuário pode:
   - **Cadastrar outro** — reseta o formulário para novo cadastro.
   - **Voltar à lista** — navega para `/procedimentos`.

### Edição

1. Usuário acessa via card na listagem (`edicao/{id}`).
2. Formulário carrega os dados do procedimento via `proceduresService.getById()`.
3. Ao salvar, redireciona para `/procedimentos?salvo=true` — a listagem exibe um banner verde no topo com auto-dismiss em **5 segundos**.
4. O botão **Cancelar** segue a prioridade: callback `onCancel` → `afterSavePath` → `/procedimentos`.

### Listagem

1. Carrega todos os procedimentos da unidade via `proceduresService.listByUnit()`.
2. Filtros de status (`Todos` / `Ativos` / `Inativos`) mostram contagem de cada grupo.
3. Busca textual em tempo real nos campos: **descrição**, **código** e **observação**.
4. Estado vazio diferencia "sem cadastros" de "sem resultados para o filtro aplicado".

---

## Campos do Formulário

| Campo        | Obrigatório | Regras                                                          |
|--------------|-------------|-----------------------------------------------------------------|
| Descrição    | Sim         | Mínimo 1 caractere                                              |
| Código       | Sim         | 10 caracteres alfanuméricos, maiúsculas                         |
| Tipo         | Sim         | `1` Consulta / `2` Retorno / `3` Exame                         |
| Especialidade| Condicional | Obrigatório se tipo = Consulta ou Retorno; oculto para Exame   |
| Preço        | Sim         | Formato `0,00` ou `1.234,56`                                    |
| Observação   | Não         | Texto livre (textarea)                                          |
| Ativo        | —           | Toggle booleano; padrão `true`                                  |

---

## Dependências de API

| Serviço                                   | Quando é chamado                          |
|-------------------------------------------|-------------------------------------------|
| `proceduresService.listByUnit(unitId)`    | Ao abrir a listagem                       |
| `proceduresService.getById(id)`           | Ao abrir a edição de um procedimento      |
| `proceduresService.create({...})`         | Ao salvar no modo cadastro                |
| `proceduresService.update({id, ...})`     | Ao salvar no modo edição                  |
| `specialtiesService.listByUnit(unitId)`   | Ao carregar o formulário (apenas ativas)  |

---

## Validação (Zod)

```ts
{
  description: z.string().min(1),
  code: z.string().regex(/^[A-Z0-9]{10}$/),
  type: z.enum(["1", "2", "3"]),
  specialtyId: z.string().nullable(),   // obrigatório se type === "1" || "2"
  price: z.string().regex(/^(0|[1-9]\d*|[1-9]\d{0,2}(\.\d{3})+),\d{2}$/),
  observation: z.string().optional(),
  isActive: z.boolean().default(true),
}
```

Refinamento customizado: se `type` é `"1"` ou `"2"` e `specialtyId` é nulo/vazio, o formulário emite erro no campo `specialtyId`.
