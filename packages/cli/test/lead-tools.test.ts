import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { describe, expect, it, vi } from "vitest";

import { KommoValidationError } from "@syntelix/kommo-mcp-core";

import { createKommoMcpServer, createLeadTools } from "../src/index.js";

import type { KommoClient } from "@syntelix/kommo-mcp-core";

type LeadClient = Pick<
  KommoClient,
  "listLeads" | "getLead" | "createLead" | "updateLead" | "moveLead" | "listPipelines"
>;

async function connectWithClient(clientMock: LeadClient) {
  const server = createKommoMcpServer({
    tools: createLeadTools(() => clientMock)
  });
  const client = new Client(
    { name: "kommo-mcp-leads-test-client", version: "0.0.0" },
    { capabilities: {} }
  );
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();

  await Promise.all([server.connect(serverTransport), client.connect(clientTransport)]);

  return { client, server };
}

function createLeadClient(overrides: Partial<LeadClient> = {}): LeadClient {
  return {
    async listLeads() {
      return [];
    },
    async getLead(id: number) {
      return { id, name: "Lead" };
    },
    async createLead(input) {
      return { id: 100, ...input };
    },
    async updateLead(id: number, input) {
      return { id, ...input };
    },
    async moveLead(id: number, input) {
      return { id, pipeline_id: input.pipelineId, status_id: input.statusId };
    },
    async listPipelines() {
      return [];
    },
    ...overrides
  };
}

describe("lead tools", () => {
  it("declares lead tools with expected annotations", async () => {
    const { client, server } = await connectWithClient(createLeadClient());

    const result = await client.listTools();
    const byName = new Map(result.tools.map((tool) => [tool.name, tool]));

    expect([...byName.keys()]).toEqual([
      "list_leads",
      "get_lead",
      "create_lead",
      "update_lead",
      "move_lead"
    ]);
    expect(byName.get("list_leads")?.annotations).toMatchObject({
      readOnlyHint: true,
      openWorldHint: true
    });
    expect(byName.get("get_lead")?.annotations).toMatchObject({
      readOnlyHint: true,
      openWorldHint: true
    });
    expect(byName.get("create_lead")?.annotations).toMatchObject({
      readOnlyHint: false,
      idempotentHint: false,
      destructiveHint: false,
      openWorldHint: true
    });
    expect(byName.get("move_lead")?.annotations).toMatchObject({
      readOnlyHint: false,
      idempotentHint: true,
      destructiveHint: false,
      openWorldHint: true
    });

    await client.close();
    await server.close();
  });

  it("list_leads returns summarized leads and passes filters", async () => {
    const listLeads = vi.fn(async () => [
      {
        id: 1,
        name: "Lead A",
        price: 1000,
        pipeline_id: 10,
        status_id: 101,
        responsible_user_id: 500
      }
    ]);
    const { client, server } = await connectWithClient(createLeadClient({ listLeads }));

    const result = await client.callTool({
      name: "list_leads",
      arguments: {
        query: "Lead",
        pipeline_id: 10,
        status_id: 101,
        limit: 20
      }
    });

    expect(listLeads).toHaveBeenCalledWith({
      query: "Lead",
      pipelineId: 10,
      statusId: 101,
      limit: 20
    });
    expect(result.structuredContent).toEqual({
      leads: [
        {
          id: 1,
          name: "Lead A",
          price: 1000,
          pipeline_id: 10,
          status_id: 101,
          responsible_user_id: 500
        }
      ]
    });

    await client.close();
    await server.close();
  });

  it("create_lead creates and returns the new lead id", async () => {
    const createLead = vi.fn(async () => ({ id: 321, name: "Novo" }));
    const { client, server } = await connectWithClient(
      createLeadClient({ createLead })
    );

    const result = await client.callTool({
      name: "create_lead",
      arguments: { name: "Novo", price: 5000 }
    });

    expect(createLead).toHaveBeenCalledWith({ name: "Novo", price: 5000 });
    expect(result.structuredContent).toEqual({
      lead: { id: 321, name: "Novo" }
    });

    await client.close();
    await server.close();
  });

  it("update_lead updates basic fields", async () => {
    const updateLead = vi.fn(async () => ({
      id: 321,
      name: "Atualizado",
      price: 6000
    }));
    const { client, server } = await connectWithClient(
      createLeadClient({ updateLead })
    );

    const result = await client.callTool({
      name: "update_lead",
      arguments: { id: 321, name: "Atualizado", price: 6000 }
    });

    expect(updateLead).toHaveBeenCalledWith(321, {
      name: "Atualizado",
      price: 6000
    });
    expect(result.structuredContent).toEqual({
      lead: { id: 321, name: "Atualizado", price: 6000 }
    });

    await client.close();
    await server.close();
  });

  it("move_lead validates that the status belongs to the target pipeline", async () => {
    const moveLead = vi.fn(async () => ({
      id: 321,
      pipeline_id: 20,
      status_id: 201
    }));
    const { client, server } = await connectWithClient(
      createLeadClient({
        moveLead,
        async listPipelines() {
          return [
            {
              id: 10,
              name: "Vendas",
              _embedded: { statuses: [{ id: 101, name: "Novo" }] }
            }
          ];
        }
      })
    );

    const result = await client.callTool({
      name: "move_lead",
      arguments: { id: 321, pipeline_id: 20, status_id: 201 }
    });

    expect(result.isError).toBe(true);
    expect(result.content[0]).toMatchObject({
      type: "text",
      text: "A etapa 201 não pertence ao pipeline 20."
    });
    expect(moveLead).not.toHaveBeenCalled();

    await client.close();
    await server.close();
  });

  it("validation errors from Kommo become tool error results", async () => {
    const { client, server } = await connectWithClient(
      createLeadClient({
        async createLead() {
          throw new KommoValidationError(422, "Erro de validação do Kommo.");
        }
      })
    );

    const result = await client.callTool({
      name: "create_lead",
      arguments: { name: "Novo" }
    });

    expect(result.isError).toBe(true);
    expect(result.content).toEqual([
      { type: "text", text: "Erro de validação do Kommo." }
    ]);

    await client.close();
    await server.close();
  });
});
