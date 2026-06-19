import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { describe, expect, it } from "vitest";

import { KommoConfigError } from "@syntelix/kommo-mcp-core";

import {
  createKommoMcpServer,
  createToolErrorResult,
  healthTool
} from "../src/mcp-server.js";

import type { McpToolDefinition } from "../src/mcp-server.js";

async function connectHarness(tools: McpToolDefinition[] = [healthTool]) {
  const server = createKommoMcpServer({ tools });
  const client = new Client(
    { name: "kommo-mcp-test-client", version: "0.0.0" },
    { capabilities: {} }
  );
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();

  await Promise.all([server.connect(serverTransport), client.connect(clientTransport)]);

  return { client, server };
}

describe("Kommo MCP server", () => {
  it("initializes with tools nested under capabilities", async () => {
    const { client, server } = await connectHarness();

    expect(client.getServerCapabilities()).toEqual({
      tools: { listChanged: true }
    });
    expect(client.getServerVersion()).toMatchObject({
      name: "kommo-mcp-server",
      version: "0.0.0"
    });

    await client.close();
    await server.close();
  });

  it("lists the health tool with title, input schema and annotations", async () => {
    const { client, server } = await connectHarness();

    const result = await client.listTools();

    expect(result.tools).toHaveLength(1);
    expect(result.tools[0]).toMatchObject({
      name: "kommo_ping",
      title: "Kommo MCP health check",
      inputSchema: { type: "object", properties: {} },
      annotations: {
        title: "Kommo MCP health check",
        readOnlyHint: true,
        idempotentHint: true,
        destructiveHint: false,
        openWorldHint: false
      }
    });

    await client.close();
    await server.close();
  });

  it("calls the health tool successfully", async () => {
    const { client, server } = await connectHarness();

    const result = await client.callTool({
      name: "kommo_ping",
      arguments: {}
    });

    expect(result).toMatchObject({
      isError: false,
      content: [{ type: "text", text: "pong" }]
    });

    await client.close();
    await server.close();
  });

  it("converts business handler errors into tool error results", async () => {
    const failingTool: McpToolDefinition = {
      ...healthTool,
      name: "kommo_failing_tool",
      handler: () => {
        throw new KommoConfigError("Configuração do Kommo incompleta.");
      }
    };
    const { client, server } = await connectHarness([failingTool]);

    const result = await client.callTool({
      name: "kommo_failing_tool",
      arguments: {}
    });

    expect(result.isError).toBe(true);
    expect(result.content).toEqual([
      { type: "text", text: "Configuração do Kommo incompleta." }
    ]);

    await client.close();
    await server.close();
  });
});

describe("createToolErrorResult", () => {
  it("returns a MCP tool error instead of throwing a protocol error", () => {
    expect(createToolErrorResult(new Error("falha de negócio"))).toEqual({
      isError: true,
      content: [{ type: "text", text: "falha de negócio" }]
    });
  });
});
