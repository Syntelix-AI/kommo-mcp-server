import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { describe, expect, it } from "vitest";

import { KommoValidationError } from "@syntelix/kommo-mcp-core";

import { createKommoMcpServer, createContactTools } from "../src/index.js";

import type { KommoClient } from "@syntelix/kommo-mcp-core";

type ContactClient = Pick<
  KommoClient,
  "listContacts" | "getContact" | "createContact" | "updateContact"
>;

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
