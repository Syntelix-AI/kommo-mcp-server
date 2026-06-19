# Spec 006 — Tools de Contatos (CRUD) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Entregar as tools MCP de Contatos (`list_contacts`, `get_contact`, `create_contact`, `update_contact`) — CRUD completo — completando, junto às specs 004/005, o DoD mínimo do M1.

**Architecture:** Espelha o padrão já estabelecido em `lead-tools.ts`: (1) adicionar tipos + 4 métodos ao `KommoClient` em `packages/core/src/kommo-client.ts`; (2) expor os tipos no `index.ts` do core; (3) criar `packages/cli/src/contact-tools.ts` com 4 tool definitions; (4) registrar no `createDefaultToolRegistry`. Telefone/email vivem em *custom fields* no Kommo — abstraídos via `field_code: "PHONE"`/`"EMAIL"` (não exige conhecer o `field_id`), escondendo a complexidade do payload conforme nota de risco da spec.

**Tech Stack:** TypeScript, pnpm monorepo (`@syntelix/kommo-mcp-core` + `@syntelix/kommo-mcp-cli`), vitest, `zod` para `inputSchema`, `@modelcontextprotocol/sdk`.

**Refs de código (não modificar nestes passos — só consultar):**
- Padrão de método do client: `packages/core/src/kommo-client.ts:126-176` (leads).
- Contrato de operações já definido: `packages/core/src/api-contract.ts:316-396` (`listContacts`, `getContact`, `createContacts`, `updateContact` — com `embeddedKey: "contacts"`, paths e flags readOnly/idempotent/openWorld prontos).
- Helper `paginateHal`: `packages/core/src/hal.ts:49-79`.
- Padrão de tool + helpers (`annotationsFromOperation`, `jsonToolResult`, `positiveInteger`, etc.): `packages/cli/src/lead-tools.ts`.
- Padrão de teste (mock `FetchLike`): `packages/core/test/leads.test.ts:1-110`; (conexão MCP in-memory): `packages/cli/test/lead-tools.test.ts:1-90`.

**Convenções obrigatórias:**
- Rodar testes com `pnpm --filter <pkg> test` ou `pnpm test` na raiz. Cada commit deve deixar a suíte verde.
- Commits no padrão existente: `feat(core): ...`, `feat(cli): ...`, `docs(specs): ...`.
- Trabalhar em branch `feat/spec-006-tools-contatos` criada a partir de `main` atualizada.

---

## File Structure

| Arquivo | Responsabilidade | Ação |
|---|---|---|
| `packages/core/src/kommo-client.ts` | Tipos `KommoContact`/`KommoCustomFieldValue` + opções/inputs + 4 métodos no `KommoClient` | **Modificar** (inserir após tipos de leads, ~linha 86) |
| `packages/core/src/index.ts` | Re-exportar tipos novos | **Modificar** (bloco `kommo-client.js`, ~linha 42-56) |
| `packages/core/test/contacts.test.ts` | Testes do `KommoClient` para contatos | **Criar** |
| `packages/cli/src/contact-tools.ts` | 4 tool definitions + `summarizeContact` + helpers de parsing | **Criar** |
| `packages/cli/src/index.ts` | Exportar `createContactTools`/tipos | **Modificar** (~linha 20-21) |
| `packages/cli/src/mcp-server.ts` | Registrar `createContactTools` no `createDefaultToolRegistry` | **Modificar** (linha 112-120) |
| `packages/cli/test/contact-tools.test.ts` | Testes das tools via InMemoryTransport | **Criar** |
| `specs/006-tools-contatos.md` | Marcar tarefas concluídas + Status | **Modificar** (final) |

---

## Task 1: Tipos de Contato + `listContacts` no core (TDD)

**Files:**
- Modify: `packages/core/src/kommo-client.ts` (após `MoveLeadInput`, ~linha 86)
- Test: `packages/core/test/contacts.test.ts`

- [ ] **Step 1: Criar o arquivo de teste com o caso de `listContacts` falhando**

Criar `packages/core/test/contacts.test.ts`:

```typescript
import { describe, expect, it, vi } from "vitest";

import { createKommoClient } from "../src/index.js";

import type { FetchLike } from "../src/index.js";

function mockFetch(responses: Response[]): FetchLike & {
  calls: { url: string; init?: RequestInit }[];
} {
  const queue = [...responses];
  const calls: { url: string; init?: RequestInit }[] = [];
  const fn = vi.fn(async (url: string | URL | Request, init?: RequestInit) => {
    calls.push({ url: String(url), init });
    const next = queue.shift();
    if (next === undefined) {
      throw new Error("mockFetch: fila de respostas esgotada");
    }
    return next;
  }) as unknown as FetchLike & { calls: typeof calls };
  Object.defineProperty(fn, "calls", { value: calls });
  return fn;
}

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" }
  });
}

describe("KommoClient contacts", () => {
  it("lists contacts with query filter and pagination", async () => {
    const fetchMock = mockFetch([
      jsonResponse(200, {
        _embedded: {
          contacts: [{ id: 1, name: "Ana" }]
        },
        _links: { next: { href: "https://example/next" } }
      }),
      jsonResponse(200, {
        _embedded: {
          contacts: [{ id: 2, name: "Bruno" }]
        }
      })
    ]);
    const client = createKommoClient(
      { subdomain: "acme", accessToken: "token" },
      { fetch: fetchMock }
    );

    const contacts = await client.listContacts({
      query: "a",
      limit: 1,
      maxPages: 2
    });

    expect(contacts.map((c) => c.id)).toEqual([1, 2]);
    const firstUrl = new URL(fetchMock.calls[0]?.url ?? "");
    expect(firstUrl.pathname).toBe("/api/v4/contacts");
    expect(firstUrl.searchParams.get("query")).toBe("a");
  });
});
```

- [ ] **Step 2: Rodar o teste e verificar que falha**

Run: `pnpm --filter @syntelix/kommo-mcp-core test`
Expected: FAIL — `client.listContacts is not a function` (método ainda não existe).

- [ ] **Step 3: Adicionar tipos de contato + método `listContacts`**

Em `packages/core/src/kommo-client.ts`, inserir **após o fechamento de `UpdateLeadInput`/`MoveLeadInput`** (depois da linha 86, antes de `interface KommoLeadPayload`):

```typescript
export interface KommoCustomFieldValue {
  readonly field_id?: number;
  readonly field_code?: string;
  readonly values: ReadonlyArray<{ readonly value: string; readonly enum_id?: number; readonly enum_code?: string }>;
}

export interface KommoContact {
  readonly id: number;
  readonly name?: string;
  readonly first_name?: string;
  readonly last_name?: string;
  readonly responsible_user_id?: number;
  readonly created_by?: number;
  readonly updated_by?: number;
  readonly created_at?: number;
  readonly updated_at?: number;
  readonly custom_fields_values?: readonly KommoCustomFieldValue[];
  readonly _links?: HalLinks;
}

export interface ListContactsOptions extends PaginateOptions {
  readonly query?: string;
  readonly responsibleUserId?: number;
  readonly with?: string;
}

export interface CreateContactInput {
  readonly name?: string;
  readonly firstName?: string;
  readonly lastName?: string;
  readonly responsibleUserId?: number;
  readonly phone?: string;
  readonly email?: string;
}

export interface UpdateContactInput {
  readonly name?: string;
  readonly firstName?: string;
  readonly lastName?: string;
  readonly responsibleUserId?: number;
  readonly phone?: string;
  readonly email?: string;
}
```

Depois, dentro da `class KommoClient`, adicionar **após `moveLead`** (antes do fechamento da classe, linha ~177):

```typescript
  async listContacts(options: ListContactsOptions = {}): Promise<KommoContact[]> {
    const operation = KOMMO_API_CONTRACT.operations.listContacts;
    const paginateOptions = {
      limit: options.limit ?? KOMMO_API_CONTRACT.limits.maxPageLimit,
      maxPages: options.maxPages ?? 10,
      ...(options.startPage !== undefined ? { startPage: options.startPage } : {})
    };
    const baseQuery = buildContactListQuery(options);

    return paginateHal(
      (page, limit) =>
        this.httpClient.get<HalCollection<KommoContact>>(operation.path, {
          query: { ...baseQuery, page, limit }
        }),
      operation.embeddedKey,
      paginateOptions
    );
  }
```

E adicionar a função helper `buildContactListQuery` ao final do arquivo (junto a `buildLeadListQuery`, ~linha 222):

```typescript
function buildContactListQuery(
  options: ListContactsOptions
): Record<string, string | number | boolean | undefined> {
  const query: Record<string, string | number | boolean | undefined> = {};
  if (options.query !== undefined) {
    query["query"] = options.query;
  }
  if (options.with !== undefined) {
    query["with"] = options.with;
  }
  if (options.responsibleUserId !== undefined) {
    query["filter[responsible_user_id][]"] = options.responsibleUserId;
  }
  return query;
}
```

- [ ] **Step 4: Rodar o teste e verificar que passa**

Run: `pnpm --filter @syntelix/kommo-mcp-core test`
Expected: PASS — o teste de `listContacts`.

- [ ] **Step 5: Commit**

```bash
git add packages/core/src/kommo-client.ts packages/core/test/contacts.test.ts
git commit -m "feat(core): listar contatos (spec 006)"
```

---

## Task 2: `getContact` no core (TDD)

**Files:**
- Modify: `packages/core/src/kommo-client.ts` (dentro da classe, após `listContacts`)
- Test: `packages/core/test/contacts.test.ts` (acrescentar caso)

- [ ] **Step 1: Acrescentar o teste de `getContact`**

No `describe("KommoClient contacts", ...)` existente em `packages/core/test/contacts.test.ts`, adicionar:

```typescript
  it("gets a contact by id", async () => {
    const fetchMock = mockFetch([
      jsonResponse(200, { id: 42, name: "Carlos" })
    ]);
    const client = createKommoClient(
      { subdomain: "acme", accessToken: "token" },
      { fetch: fetchMock }
    );

    await expect(client.getContact(42)).resolves.toMatchObject({ id: 42, name: "Carlos" });
    expect(fetchMock.calls[0]?.url).toContain("/api/v4/contacts/42");
  });
```

- [ ] **Step 2: Rodar o teste e verificar que falha**

Run: `pnpm --filter @syntelix/kommo-mcp-core test`
Expected: FAIL — `client.getContact is not a function`.

- [ ] **Step 3: Adicionar `getContact`**

Em `packages/core/src/kommo-client.ts`, dentro da classe `KommoClient`, logo após `listContacts`:

```typescript
  async getContact(id: number, withParam?: string): Promise<KommoContact> {
    const operation = KOMMO_API_CONTRACT.operations.getContact;
    const query = withParam === undefined ? undefined : { with: withParam };
    return this.httpClient.get<KommoContact>(
      renderKommoApiPath(operation.path, { id }),
      query === undefined ? {} : { query }
    );
  }
```

- [ ] **Step 4: Rodar o teste e verificar que passa**

Run: `pnpm --filter @syntelix/kommo-mcp-core test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/core/src/kommo-client.ts packages/core/test/contacts.test.ts
git commit -m "feat(core): obter contato por id (spec 006)"
```

---

## Task 3: `createContact` com phone/email em custom fields (TDD)

**Files:**
- Modify: `packages/core/src/kommo-client.ts` (dentro da classe, após `getContact`; helper de payload)
- Test: `packages/core/test/contacts.test.ts`

> **Nota de domínio:** telefone e email no Kommo são *custom fields* com códigos `PHONE` e `EMAIL`. Enviando `custom_fields_values` com `field_code` (em vez de `field_id`), o Kommo resolve o campo pelo código — dispensa lookup prévio. É a simplificação estável que a spec pede.

- [ ] **Step 1: Acrescentar o teste de `createContact`**

Adicionar ao `describe("KommoClient contacts", ...)`:

```typescript
  it("creates a contact with name, phone and email and returns it", async () => {
    const fetchMock = mockFetch([
      jsonResponse(200, {
        _embedded: {
          contacts: [
            {
              id: 77,
              name: "Diana",
              custom_fields_values: [
                { field_code: "PHONE", values: [{ value: "+5511999990000" }] },
                { field_code: "EMAIL", values: [{ value: "diana@exemplo.com" }] }
              ]
            }
          ]
        }
      })
    ]);
    const client = createKommoClient(
      { subdomain: "acme", accessToken: "token" },
      { fetch: fetchMock }
    );

    const contact = await client.createContact({
      name: "Diana",
      phone: "+5511999990000",
      email: "diana@exemplo.com"
    });

    expect(contact).toMatchObject({ id: 77, name: "Diana" });
    expect(fetchMock.calls[0]?.init?.method).toBe("POST");
    const body = JSON.parse(String(fetchMock.calls[0]?.init?.body));
    expect(body).toEqual([
      {
        name: "Diana",
        custom_fields_values: [
          { field_code: "PHONE", values: [{ value: "+5511999990000" }] },
          { field_code: "EMAIL", values: [{ value: "diana@exemplo.com" }] }
        ]
      }
    ]);
  });
```

- [ ] **Step 2: Rodar o teste e verificar que falha**

Run: `pnpm --filter @syntelix/kommo-mcp-core test`
Expected: FAIL — `client.createContact is not a function`.

- [ ] **Step 3: Adicionar `createContact` + helper de payload**

Em `packages/core/src/kommo-client.ts`, dentro da classe, após `getContact`:

```typescript
  async createContact(input: CreateContactInput): Promise<KommoContact> {
    const operation = KOMMO_API_CONTRACT.operations.createContacts;
    const response = await this.httpClient.post<HalCollection<KommoContact>>(
      operation.path,
      [toKommoContactPayload(input)]
    );
    return firstEmbeddedItem(response, operation.embeddedKey, "contato criado");
  }
```

E adicionar o helper `toKommoContactPayload` ao final do arquivo (junto a `toKommoLeadPayload`):

```typescript
interface KommoContactPayload {
  name?: string;
  first_name?: string;
  last_name?: string;
  responsible_user_id?: number;
  custom_fields_values?: Array<{
    field_code: string;
    values: Array<{ value: string }>;
  }>;
}

function toKommoContactPayload(
  input: CreateContactInput | UpdateContactInput
): KommoContactPayload {
  const payload: KommoContactPayload = {};
  if (input.name !== undefined) {
    payload.name = input.name;
  }
  if (input.firstName !== undefined) {
    payload.first_name = input.firstName;
  }
  if (input.lastName !== undefined) {
    payload.last_name = input.lastName;
  }
  if (input.responsibleUserId !== undefined) {
    payload.responsible_user_id = input.responsibleUserId;
  }

  const customFields: KommoContactPayload["custom_fields_values"] = [];
  if (input.phone !== undefined) {
    customFields.push({ field_code: "PHONE", values: [{ value: input.phone }] });
  }
  if (input.email !== undefined) {
    customFields.push({ field_code: "EMAIL", values: [{ value: input.email }] });
  }
  if (customFields.length > 0) {
    payload.custom_fields_values = customFields;
  }
  return payload;
}
```

- [ ] **Step 4: Rodar o teste e verificar que passa**

Run: `pnpm --filter @syntelix/kommo-mcp-core test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/core/src/kommo-client.ts packages/core/test/contacts.test.ts
git commit -m "feat(core): criar contato com phone/email (spec 006)"
```

---

## Task 4: `updateContact` no core (TDD)

**Files:**
- Modify: `packages/core/src/kommo-client.ts` (dentro da classe, após `createContact`)
- Test: `packages/core/test/contacts.test.ts`

- [ ] **Step 1: Acrescentar o teste de `updateContact`**

Adicionar ao `describe("KommoClient contacts", ...)`:

```typescript
  it("updates a contact name via PATCH", async () => {
    const fetchMock = mockFetch([
      jsonResponse(200, { id: 88, name: "Novo Nome" })
    ]);
    const client = createKommoClient(
      { subdomain: "acme", accessToken: "token" },
      { fetch: fetchMock }
    );

    const contact = await client.updateContact(88, { name: "Novo Nome" });

    expect(contact).toMatchObject({ id: 88, name: "Novo Nome" });
    expect(fetchMock.calls[0]?.init?.method).toBe("PATCH");
    expect(fetchMock.calls[0]?.url).toContain("/api/v4/contacts/88");
    const body = JSON.parse(String(fetchMock.calls[0]?.init?.body));
    expect(body).toEqual({ name: "Novo Nome" });
  });
```

- [ ] **Step 2: Rodar o teste e verificar que falha**

Run: `pnpm --filter @syntelix/kommo-mcp-core test`
Expected: FAIL — `client.updateContact is not a function`.

- [ ] **Step 3: Adicionar `updateContact`**

Em `packages/core/src/kommo-client.ts`, dentro da classe, após `createContact`:

```typescript
  async updateContact(id: number, input: UpdateContactInput): Promise<KommoContact> {
    const operation = KOMMO_API_CONTRACT.operations.updateContact;
    return this.httpClient.patch<KommoContact>(
      renderKommoApiPath(operation.path, { id }),
      toKommoContactPayload(input)
    );
  }
```

- [ ] **Step 4: Rodar o teste e verificar que passa**

Run: `pnpm --filter @syntelix/kommo-mcp-core test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/core/src/kommo-client.ts packages/core/test/contacts.test.ts
git commit -m "feat(core): atualizar contato (spec 006)"
```

---

## Task 5: Exportar tipos de contato do `core/index.ts`

**Files:**
- Modify: `packages/core/src/index.ts` (bloco `kommo-client.js`, linhas 42-56)

- [ ] **Step 1: Atualizar os exports**

Em `packages/core/src/index.ts`, no bloco `export type { ... } from "./kommo-client.js";` (linhas 42-51), adicionar os novos tipos. Substituir:

```typescript
export type {
  KommoAccount,
  KommoLead,
  KommoPipeline,
  KommoPipelineStatus,
  CreateLeadInput,
  ListLeadsOptions,
  MoveLeadInput,
  UpdateLeadInput
} from "./kommo-client.js";
```

por:

```typescript
export type {
  KommoAccount,
  KommoLead,
  KommoPipeline,
  KommoPipelineStatus,
  CreateLeadInput,
  ListLeadsOptions,
  MoveLeadInput,
  UpdateLeadInput,
  KommoContact,
  KommoCustomFieldValue,
  ListContactsOptions,
  CreateContactInput,
  UpdateContactInput
} from "./kommo-client.js";
```

- [ ] **Step 2: Verificar typecheck do core**

Run: `pnpm --filter @syntelix/kommo-mcp-core typecheck`
Expected: sem erros.

- [ ] **Step 3: Commit**

```bash
git add packages/core/src/index.ts
git commit -m "feat(core): exportar tipos de contato (spec 006)"
```

---

## Task 6: `contact-tools.ts` no cli (4 tools) — TDD

**Files:**
- Create: `packages/cli/src/contact-tools.ts`
- Create: `packages/cli/test/contact-tools.test.ts`

- [ ] **Step 1: Criar o arquivo de teste com as asserções de anotações + 4 calls**

Criar `packages/cli/test/contact-tools.test.ts`:

```typescript
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { describe, expect, it } from "vitest";

import { KommoValidationError } from "@syntelix/kommo-mcp-core";

import { createKommoMcpServer, createContactTools } from "../src/index.js";

import type { KommoContact } from "@syntelix/kommo-mcp-core";

type ContactClient = Pick<
  KommoContact,
  never
> extends never
  ? Pick<
      import("@syntelix/kommo-mcp-core").KommoClient,
      "listContacts" | "getContact" | "createContact" | "updateContact"
    >
  : never;

async function connectWithClient(clientMock: ContactClient) {
  const server = createKommoMcpServer({
    tools: createContactTools(() => clientMock)
  });
  const client = new Client(
    { name: "kommo-mcp-contacts-test-client", version: "0.0.0" },
    { capabilities: {} }
  );
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  await Promise.all([server.connect(serverTransport), client.connect(clientTransport)]);
  return { client, server };
}

function createContactClient(overrides: Partial<ContactClient> = {}): ContactClient {
  return {
    async listContacts() {
      return [{ id: 1, name: "Ana" }];
    },
    async getContact(id: number) {
      return { id, name: "Ana" };
    },
    async createContact(input) {
      return { id: 100, ...input };
    },
    async updateContact(id: number, input) {
      return { id, ...input };
    },
    ...overrides
  };
}

describe("contact tools", () => {
  it("declares contact tools with expected annotations", async () => {
    const { client } = await connectWithClient(createContactClient());

    const result = await client.listTools();
    const byName = new Map(result.tools.map((t) => [t.name, t]));

    expect([...byName.keys()]).toEqual([
      "list_contacts",
      "get_contact",
      "create_contact",
      "update_contact"
    ]);
    expect(byName.get("list_contacts")?.annotations).toMatchObject({
      readOnlyHint: true,
      idempotentHint: true,
      openWorldHint: true
    });
    expect(byName.get("get_contact")?.annotations).toMatchObject({
      readOnlyHint: true,
      openWorldHint: true
    });
    expect(byName.get("create_contact")?.annotations).toMatchObject({
      readOnlyHint: false,
      idempotentHint: false,
      openWorldHint: true
    });
    expect(byName.get("update_contact")?.annotations).toMatchObject({
      readOnlyHint: false,
      idempotentHint: true,
      openWorldHint: true
    });

    await client.close();
  });

  it("list_contacts returns summarized contacts", async () => {
    const { client } = await connectWithClient(createContactClient());
    const res = await client.callTool({ name: "list_contacts", arguments: {} });
    expect(res.isError).toBeFalsy();
    expect(res.structuredContent).toMatchObject({ contacts: [{ id: 1, name: "Ana" }] });
    await client.close();
  });

  it("create_contact creates and returns summarized contact", async () => {
    const { client } = await connectWithClient(createContactClient());
    const res = await client.callTool({
      name: "create_contact",
      arguments: { name: "Diana", phone: "+5511", email: "d@x.com" }
    });
    expect(res.isError).toBeFalsy();
    expect(res.structuredContent).toMatchObject({ contact: { id: 100, name: "Diana" } });
    await client.close();
  });

  it("maps KommoValidationError (422-like) to isError", async () => {
    const { client } = await connectWithClient(
      createContactClient({
        async createContact() {
          throw new KommoValidationError("campo inválido", [{ detail: "x" }]);
        }
      })
    );
    const res = await client.callTool({
      name: "create_contact",
      arguments: { name: "x" }
    });
    expect(res.isError).toBe(true);
    await client.close();
  });
});
```

- [ ] **Step 2: Rodar o teste e verificar que falha**

Run: `pnpm --filter @syntelix/kommo-mcp-cli test`
Expected: FAIL — `createContactTools` não exportado / arquivo inexistente.

- [ ] **Step 3: Criar `packages/cli/src/contact-tools.ts`**

```typescript
import { KOMMO_API_CONTRACT, createKommoClientFromEnv } from "@syntelix/kommo-mcp-core";
import { z } from "zod";

import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import type {
  CreateContactInput,
  KommoClient,
  KommoContact,
  ListContactsOptions,
  UpdateContactInput
} from "@syntelix/kommo-mcp-core";
import type { McpToolDefinition } from "./mcp-server.js";

export type ContactClient = Pick<
  KommoClient,
  "listContacts" | "getContact" | "createContact" | "updateContact"
>;

export type ContactClientProvider = () => ContactClient;

export interface ContactSummary {
  id: number;
  name?: string;
  phone?: string;
  email?: string;
  responsible_user_id?: number;
}

export function createContactTools(
  clientProvider: ContactClientProvider = () => createKommoClientFromEnv()
): McpToolDefinition[] {
  return [
    {
      name: "list_contacts",
      title: "List Kommo contacts",
      description: "Lista contatos com filtro de busca e paginação.",
      inputSchema: {
        query: z.string().optional(),
        responsible_user_id: positiveInteger().optional(),
        limit: positiveInteger().max(KOMMO_API_CONTRACT.limits.maxPageLimit).optional()
      },
      annotations: annotationsFromOperation("listContacts", "List Kommo contacts"),
      handler: async (args) => {
        const contacts = await clientProvider().listContacts(parseListContactsInput(args));
        return jsonToolResult({ contacts: contacts.map(summarizeContact) });
      }
    },
    {
      name: "get_contact",
      title: "Get Kommo contact",
      description: "Retorna um contato Kommo por ID.",
      inputSchema: { id: positiveInteger() },
      annotations: annotationsFromOperation("getContact", "Get Kommo contact"),
      handler: async (args) => {
        const contact = await clientProvider().getContact(requiredNumber(args, "id"));
        return jsonToolResult({ contact: summarizeContact(contact) });
      }
    },
    {
      name: "create_contact",
      title: "Create Kommo contact",
      description: "Cria um contato Kommo com nome, telefone e/ou email (campos básicos).",
      inputSchema: contactMutationSchema(),
      annotations: annotationsFromOperation("createContacts", "Create Kommo contact"),
      handler: async (args) => {
        const contact = await clientProvider().createContact(parseCreateContactInput(args));
        return jsonToolResult({ contact: summarizeContact(contact) });
      }
    },
    {
      name: "update_contact",
      title: "Update Kommo contact",
      description: "Atualiza campos básicos de um contato Kommo por ID.",
      inputSchema: { id: positiveInteger(), ...contactMutationSchema() },
      annotations: annotationsFromOperation("updateContact", "Update Kommo contact"),
      handler: async (args) => {
        const record = inputRecord(args);
        const id = requiredNumber(record, "id");
        const contact = await clientProvider().updateContact(id, parseUpdateContactInput(record));
        return jsonToolResult({ contact: summarizeContact(contact) });
      }
    }
  ];
}

export function summarizeContact(contact: KommoContact): ContactSummary {
  const summary: ContactSummary = { id: contact.id };
  if (contact.name !== undefined) {
    summary.name = contact.name;
  }
  const phone = readCustomField(contact, "PHONE");
  if (phone !== undefined) {
    summary.phone = phone;
  }
  const email = readCustomField(contact, "EMAIL");
  if (email !== undefined) {
    summary.email = email;
  }
  if (contact.responsible_user_id !== undefined) {
    summary.responsible_user_id = contact.responsible_user_id;
  }
  return summary;
}

function readCustomField(contact: KommoContact, fieldCode: string): string | undefined {
  const field = contact.custom_fields_values?.find((f) => f.field_code === fieldCode);
  return field?.values[0]?.value;
}

function parseListContactsInput(
  args: Record<string, unknown> | undefined
): ListContactsOptions {
  const record = inputRecord(args);
  const input: { query?: string; responsibleUserId?: number; limit?: number } = {};
  const query = optionalString(record, "query");
  if (query !== undefined) {
    input.query = query;
  }
  const responsibleUserId = optionalNumber(record, "responsible_user_id");
  if (responsibleUserId !== undefined) {
    input.responsibleUserId = responsibleUserId;
  }
  const limit = optionalNumber(record, "limit");
  if (limit !== undefined) {
    input.limit = limit;
  }
  return input;
}

function parseCreateContactInput(
  args: Record<string, unknown> | undefined
): CreateContactInput {
  return parseContactMutationInput(inputRecord(args));
}

function parseUpdateContactInput(record: Record<string, unknown>): UpdateContactInput {
  return parseContactMutationInput(record);
}

function parseContactMutationInput(
  record: Record<string, unknown>
): CreateContactInput | UpdateContactInput {
  const input: {
    name?: string;
    firstName?: string;
    lastName?: string;
    responsibleUserId?: number;
    phone?: string;
    email?: string;
  } = {};
  const name = optionalString(record, "name");
  if (name !== undefined) input.name = name;
  const firstName = optionalString(record, "first_name");
  if (firstName !== undefined) input.firstName = firstName;
  const lastName = optionalString(record, "last_name");
  if (lastName !== undefined) input.lastName = lastName;
  const responsibleUserId = optionalNumber(record, "responsible_user_id");
  if (responsibleUserId !== undefined) input.responsibleUserId = responsibleUserId;
  const phone = optionalString(record, "phone");
  if (phone !== undefined) input.phone = phone;
  const email = optionalString(record, "email");
  if (email !== undefined) input.email = email;
  return input;
}

function annotationsFromOperation(
  operationKey: keyof typeof KOMMO_API_CONTRACT.operations,
  title: string
): McpToolDefinition["annotations"] {
  const operation = KOMMO_API_CONTRACT.operations[operationKey];
  return {
    title,
    readOnlyHint: operation.readOnly,
    idempotentHint: operation.idempotent,
    destructiveHint: operation.destructive,
    openWorldHint: operation.openWorld
  };
}

function positiveInteger(): z.ZodNumber {
  return z.number().int().positive();
}

function contactMutationSchema(): Record<string, z.ZodType> {
  return {
    name: z.string().optional(),
    first_name: z.string().optional(),
    last_name: z.string().optional(),
    responsible_user_id: positiveInteger().optional(),
    phone: z.string().optional(),
    email: z.string().email().optional()
  };
}

function jsonToolResult(structuredContent: Record<string, unknown>): CallToolResult {
  return {
    isError: false,
    structuredContent,
    content: [{ type: "text", text: JSON.stringify(structuredContent) }]
  };
}

function inputRecord(args: Record<string, unknown> | undefined): Record<string, unknown> {
  return args ?? {};
}

function optionalString(record: Record<string, unknown>, key: string): string | undefined {
  const value = record[key];
  if (value === undefined) return undefined;
  if (typeof value !== "string") throw new Error(`Campo ${key} deve ser string.`);
  return value;
}

function optionalNumber(record: Record<string, unknown>, key: string): number | undefined {
  const value = record[key];
  if (value === undefined) return undefined;
  if (typeof value !== "number" || !Number.isFinite(value))
    throw new Error(`Campo ${key} deve ser número.`);
  return value;
}

function requiredNumber(
  argsOrRecord: Record<string, unknown> | undefined,
  key: string
): number {
  const value = inputRecord(argsOrRecord)[key];
  if (value === undefined) throw new Error(`Campo ${key} é obrigatório.`);
  if (typeof value !== "number" || !Number.isFinite(value))
    throw new Error(`Campo ${key} deve ser número.`);
  return value;
}
```

> **Observação de DRY:** Os helpers `annotationsFromOperation`, `positiveInteger`, `jsonToolResult`, `inputRecord`, `optionalString`, `optionalNumber`, `requiredNumber` já existem idênticos em `lead-tools.ts` e `business-tools.ts`. Nesta fase espelhamos o padrão existente (cada `*-tools.ts` é autossuficiente) para manter consistência com o codebase. **Não** refatorar agora — está fora do escopo da spec 006 (YAGNI).

- [ ] **Step 4: Exportar `createContactTools`/tipos no `cli/src/index.ts`**

Em `packages/cli/src/index.ts`, após o bloco de `lead-tools` (linhas 20-21), adicionar:

```typescript
export { createContactTools, summarizeContact } from "./contact-tools.js";
export type { ContactClient, ContactClientProvider, ContactSummary } from "./contact-tools.js";
```

- [ ] **Step 5: Rodar o teste e verificar que passa**

Run: `pnpm --filter @syntelix/kommo-mcp-cli test`
Expected: PASS — 4 tools declaradas, anotações corretas, `list_contacts`/`create_contact` funcionam, `KommoValidationError` → `isError: true`.

- [ ] **Step 6: Commit**

```bash
git add packages/cli/src/contact-tools.ts packages/cli/src/index.ts packages/cli/test/contact-tools.test.ts
git commit -m "feat(cli): tools de contatos (spec 006)"
```

---

## Task 7: Registrar `contactTools` no `createDefaultToolRegistry`

**Files:**
- Modify: `packages/cli/src/mcp-server.ts` (função `createDefaultToolRegistry`, linhas 112-120)
- Modify: `packages/cli/src/index.ts` (já inclui `createDefaultToolRegistry` no export)

- [ ] **Step 1: Escrever o teste de registry**

Adicionar um teste em `packages/cli/test/contact-tools.test.ts`, dentro do `describe`, que valida que o registry padrão inclui contatos:

```typescript
  it("default registry includes contact tools", async () => {
    const { createDefaultToolRegistry, createKommoMcpServer } = await import("../src/index.js");
    const server = createKommoMcpServer({
      tools: createDefaultToolRegistry({ kommoClientProvider: () => createContactClient() })
    });
    const client = new Client(
      { name: "registry-test", version: "0.0.0" },
      { capabilities: {} }
    );
    const [c, s] = InMemoryTransport.createLinkedPair();
    await Promise.all([server.connect(s), client.connect(c)]);
    const tools = await client.listTools();
    expect(tools.tools.map((t) => t.name)).toEqual(
      expect.arrayContaining(["list_contacts", "get_contact", "create_contact", "update_contact"])
    );
    await client.close();
  });
```

> ⚠️ `createContactClient` retorna um `ContactClient` (Pick de 4 métodos). O registry chama `kommoClientProvider` em `createAccountPipelineTools` e `createLeadTools` também, que esperam métodos de Account/Lead. Para este teste isolado de registry, registre apenas as contact tools injetando via `tools:` direto ou use um mock que combine todos os métodos. **Alternativa mais simples (recomendada):** substituir o `createDefaultToolRegistry` no teste por um cast que satisfaz apenas contact tools, e focar a asserção no `createDefaultToolRegistry` via leitura direta:

```typescript
  it("default registry includes contact tools", async () => {
    const { createDefaultToolRegistry } = await import("../src/index.js");
    const tools = createDefaultToolRegistry();
    const names = tools.map((t) => t.name);
    expect(names).toEqual(
      expect.arrayContaining(["list_contacts", "get_contact", "create_contact", "update_contact"])
    );
  });
```

(Use esta versão — não instancia servidor, evita o problema do mock incompleto.)

- [ ] **Step 2: Rodar e verificar que falha**

Run: `pnpm --filter @syntelix/kommo-mcp-cli test`
Expected: FAIL — `list_contacts` etc. ausentes do registry.

- [ ] **Step 3: Atualizar `createDefaultToolRegistry`**

Em `packages/cli/src/mcp-server.ts`, garantir o import de `createContactTools` (verificar se já há imports de `./contact-tools.js`; se não, adicionar junto aos imports de `./lead-tools.js`/`./business-tools.js` no topo).

Substituir a função `createDefaultToolRegistry` (linhas 112-120):

```typescript
export function createDefaultToolRegistry(
  options: CreateDefaultToolRegistryOptions = {}
): McpToolDefinition[] {
  return [
    healthTool,
    ...createAccountPipelineTools(options.kommoClientProvider),
    ...createLeadTools(options.kommoClientProvider),
    ...createContactTools(options.kommoClientProvider)
  ];
}
```

E adicionar o import no topo do arquivo (junto aos demais `from "./..."`):

```typescript
import { createContactTools } from "./contact-tools.js";
```

- [ ] **Step 4: Rodar a suíte completa e verificar que passa**

Run: `pnpm test`
Expected: PASS — todos os testes (core + cli), incluindo o novo de registry.

- [ ] **Step 5: Rodar typecheck + lint da raiz**

Run: `pnpm typecheck && pnpm lint`
Expected: sem erros.

- [ ] **Step 6: Commit**

```bash
git add packages/cli/src/mcp-server.ts packages/cli/test/contact-tools.test.ts
git commit -m "feat(cli): registrar tools de contatos no registry padrão (spec 006)"
```

---

## Task 8: Atualizar a spec 006 (status + checklist) e abrir PR

**Files:**
- Modify: `specs/006-tools-contatos.md`

- [ ] **Step 1: Marcar tarefas e critérios concluídos**

Em `specs/006-tools-contatos.md`:
- Trocar `- **Status:** Draft` por `- **Status:** Implemented`.
- Na seção **Tarefas**, marcar `[x]` em: `list_contacts`, `get_contact`, `create_contact`, `update_contact`, `Anotações e inputSchema corretos`, `Testes com Kommo mockado: cada operação + erro 422 → isError`.
- Na seção **Critérios de aceite**, marcar `[x]` em todos **exceto** "Validado em cliente MCP real" (esse critério é da spec 007, que fará o smoke end-to-end).

- [ ] **Step 2: Commit da doc**

```bash
git add specs/006-tools-contatos.md
git commit -m "docs(specs): marcar spec 006 como implementada"
```

- [ ] **Step 3: Push e PR**

```bash
git push -u origin feat/spec-006-tools-contatos
gh pr create --title "feat(spec-006): Tools de Contatos (CRUD)" --body "$(cat <<'EOF'
## Summary
- Adiciona tipos `KommoContact`/`KommoCustomFieldValue` + opções/inputs no `core`.
- Implementa 4 métodos no `KommoClient`: `listContacts`, `getContact`, `createContact`, `updateContact` (phone/email via `field_code`, sem lookup de `field_id`).
- Cria `contact-tools.ts` no `cli` com 4 tools MCP + `summarizeContact`.
- Registra as tools no `createDefaultToolRegistry`.
- Suíte de testes cobre cada operação + `KommoValidationError` → `isError`.

Closes spec 006 (DoD de M1 — núcleo CRM).

## Test Plan
- [x] `pnpm test` verde (core + cli)
- [x] `pnpm typecheck && pnpm lint` limpos
- [ ] Validação em cliente MCP real (Claude Desktop) — critério da spec 007
EOF
)"
```

---

## Self-Review (preenchido pelo autor do plano)

**1. Cobertura da spec:**
- ✅ `list_contacts` (filtros/paginação, forma enxuta) → Task 1 + 6.
- ✅ `get_contact` → Task 2 + 6.
- ✅ `create_contact` (campos básicos, retorna id) → Task 3 + 6.
- ✅ `update_contact` → Task 4 + 6.
- ✅ Anotações + `inputSchema` corretos → Task 6 (testa anotações derivadas do contrato).
- ✅ Testes com Kommo mockado + 422 → `isError` → Task 6 (cenário `KommoValidationError`).
- ⏭️ "Validado em cliente MCP real" → explicitamente fora (Task 8 marca como pendente; pertence à spec 007).

**2. Placeholders:** nenhum "TODO/TBD". Única ressalva é o risco de duplicação de helpers, tratado com nota explícita (DRY/YAGNI) justificando não refatorar agora.

**3. Consistência de tipos:** `KommoContact`/`CreateContactInput`/`UpdateContactInput`/`ListContactsOptions` definidos em Task 1/3 e consumidos em Task 6 com os mesmos nomes. `summarizeContact` exporta `ContactSummary` com `phone`/`email` extraídos via `readCustomField` — bate com o payload enviado em `toKommoContactPayload`.

**4. Dependência cruzada:** Task 6 depende dos exports de Task 5 (tipos do core). Ordem preservada.
