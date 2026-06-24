# Módulo de Unidades

## Visão Geral

O módulo de Unidades permite visualizar e editar os dados da unidade atualmente selecionada na sessão. Não há listagem nem criação de unidades neste contexto — a unidade editada é sempre a da sessão ativa (`useSessionUnit`).

---

## Estrutura de Arquivos

```
src/pages/Unidades/
├── Unidade.tsx               # Formulário de visualização e edição da unidade
└── Skeleton/
    └── unidade-skeleton.tsx  # Skeleton de carregamento
```

---

## Funcionalidade

Ao acessar `/unidade`, o componente carrega os dados da unidade via API e preenche o formulário. O usuário pode editar os campos e salvar via `PATCH`.

### Fluxo

1. Obtém `selectedUnitId` do contexto de sessão.
2. `GET /units/{unitId}` — carrega os dados atuais da unidade.
3. Formulário é preenchido com os dados recebidos (valores `null` normalizados para `""`).
4. Usuário edita os campos e clica em **Salvar**.
5. Todos os valores são trimados antes do envio.
6. `PATCH /units/{unitId}` — atualiza a unidade.
7. Exibe banner verde no topo da tela com auto-dismiss em **5 segundos**, ou mensagem de erro inline.

---

## Campos do Formulário

| Campo    | Obrigatório | Validação                                | Mensagem de erro                  |
|----------|-------------|------------------------------------------|-----------------------------------|
| Nome     | Sim         | Mínimo 1 caractere                       | "Informe o nome da unidade"       |
| CNPJ     | Não         | —                                        | —                                 |
| Telefone | Não         | —                                        | —                                 |
| Endereço | Não         | —                                        | —                                 |
| Estado   | Não         | Seleção entre os 27 estados brasileiros  | —                                 |
| Cidade   | Não         | —                                        | —                                 |
| E-mail   | Não         | Formato de e-mail válido                 | "Informe um e-mail válido"        |

> Apesar do schema Zod definir mensagens de erro para CNPJ, endereço, cidade, estado e telefone com `min(1)`, esses campos não são marcados como obrigatórios na UI — apenas **Nome** e **E-mail** bloqueiam o envio na prática.

### Estados disponíveis no select

AC, AL, AP, AM, BA, CE, DF, ES, GO, MA, MT, MS, MG, PA, PB, PR, PE, PI, RJ, RN, RS, RO, RR, SC, SP, SE, TO.

---

## Validação (Zod)

```ts
{
  name: z.string().min(1),
  cnpj: z.string(),
  phone: z.string(),
  address: z.string(),
  state: z.string(),
  city: z.string(),
  email: z.string().email(),
}
```

---

## API

| Endpoint              | Método  | Quando é chamado           |
|-----------------------|---------|----------------------------|
| `/units/{unitId}`     | `GET`   | Ao montar o componente     |
| `/units/{unitId}`     | `PATCH` | Ao salvar o formulário     |

- Utiliza `fetchWithAuth()` com `AbortController` para cancelar o fetch ao desmontar.

---

## Dependências

- `useSessionUnit()` — fornece o `selectedUnitId` da sessão ativa.
- `fetchWithAuth()` — wrapper autenticado de fetch (`src/lib/api-client`).
