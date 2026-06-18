import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { describe, expect, it } from "vitest";

import { KommoAuthError } from "@syntelix/kommo-mcp-core";

import { createAccountPipelineTools, createKommoMcpServer } from "../src/index.js";

import type { KommoClient } from "@syntelix/kommo-mcp-core";

type AccountPipelineClient = Pick<KommoClient, "getAccount" | "listPipelines">;

async function connectWithClient(clientMock: AccountPipelineClient) {
  const server = createKommoMcpServer({
    tools: createAccountPipelineTools(() => clientMock)
  });
  const client = new Client(
    { name: "kommo-mcp-business-test-client", version: "0.0.0" },
    { capabilities: {} }
  );
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();

  await Promise.all([server.connect(serverTransport), client.connect(clientTransport)]);

  return { client, server };
}

describe("account and pipeline tools", () => {
  it("declares read-only account and pipeline tools", async () => {
    const { client, server } = await connectWithClient({
      async getAccount() {
        throw new Error("not called");
      },
      async listPipelines() {
        throw new Error("not called");
      }
    });

    const result = await client.listTools();

    expect(result.tools.map((tool) => tool.name)).toEqual([
      "get_account",
      "list_pipelines"
    ]);
    for (const tool of result.tools) {
      expect(tool.inputSchema).toMatchObject({ type: "object", properties: {} });
      expect(tool.annotations).toMatchObject({
        readOnlyHint: true,
        destructiveHint: false,
        openWorldHint: true
      });
    }

    await client.close();
    await server.close();
  });

  it("get_account returns essential account fields", async () => {
    const { client, server } = await connectWithClient({
      async getAccount() {
        return {
          id: 123,
          name: "Acme",
          subdomain: "acme",
          currency: "BRL",
          timezone: "America/Sao_Paulo",
          country: "BR"
        };
      },
      async listPipelines() {
        return [];
      }
    });

    const result = await client.callTool({
      name: "get_account",
      arguments: {}
    });

    expect(result.isError).toBe(false);
    expect(result.structuredContent).toEqual({
      account: {
        id: 123,
        name: "Acme",
        subdomain: "acme",
        currency: "BRL",
        timezone: "America/Sao_Paulo",
        country: "BR"
      }
    });
    expect(result.content[0]).toMatchObject({ type: "text" });

    await client.close();
    await server.close();
  });

  it("list_pipelines returns pipelines and statuses with usable ids", async () => {
    const { client, server } = await connectWithClient({
      async getAccount() {
        throw new Error("not called");
      },
      async listPipelines() {
        return [
          {
            id: 10,
            name: "Vendas",
            sort: 1,
            _embedded: {
              statuses: [
                { id: 101, name: "Novo", sort: 10, type: 1 },
                { id: 142, name: "Ganho", sort: 100, type: 0 }
              ]
            }
          }
        ];
      }
    });

    const result = await client.callTool({
      name: "list_pipelines",
      arguments: {}
    });

    expect(result.isError).toBe(false);
    expect(result.structuredContent).toEqual({
      pipelines: [
        {
          id: 10,
          name: "Vendas",
          sort: 1,
          statuses: [
            { id: 101, name: "Novo", sort: 10, type: 1 },
            { id: 142, name: "Ganho", sort: 100, type: 0 }
          ]
        }
      ]
    });

    await client.close();
    await server.close();
  });

  it("invalid Kommo token becomes a tool error result", async () => {
    const { client, server } = await connectWithClient({
      async getAccount() {
        throw new KommoAuthError(401, "Falha de autenticação (HTTP 401).");
      },
      async listPipelines() {
        return [];
      }
    });

    const result = await client.callTool({
      name: "get_account",
      arguments: {}
    });

    expect(result.isError).toBe(true);
    expect(result.content).toEqual([
      { type: "text", text: "Falha de autenticação (HTTP 401)." }
    ]);

    await client.close();
    await server.close();
  });
});
