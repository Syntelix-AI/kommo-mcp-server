import { Readable, Writable } from "node:stream";

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createPackageIdentity } from "@syntelix/kommo-mcp-core";

import { createAccountPipelineTools } from "./business-tools.js";
import { createLeadTools } from "./lead-tools.js";

import type {
  CallToolResult,
  ToolAnnotations
} from "@modelcontextprotocol/sdk/types.js";
import type { ZodRawShapeCompat } from "@modelcontextprotocol/sdk/server/zod-compat.js";
import type { KommoClient } from "@syntelix/kommo-mcp-core";

export type DefaultKommoClientProvider = () => KommoClient;

export interface McpToolDefinition {
  readonly name: string;
  readonly title: string;
  readonly description?: string;
  readonly inputSchema?: ZodRawShapeCompat;
  readonly annotations: ToolAnnotations;
  readonly handler: (
    args: Record<string, unknown> | undefined
  ) => CallToolResult | Promise<CallToolResult>;
}

export interface CreateKommoMcpServerOptions {
  readonly tools?: readonly McpToolDefinition[];
  readonly kommoClientProvider?: DefaultKommoClientProvider;
}

export interface RunStdioServerOptions extends CreateKommoMcpServerOptions {
  readonly stdin?: Readable;
  readonly stdout?: Writable;
}

export const healthTool: McpToolDefinition = {
  name: "kommo_ping",
  title: "Kommo MCP health check",
  description: "Verifica se o servidor MCP do Kommo está respondendo.",
  inputSchema: {},
  annotations: {
    title: "Kommo MCP health check",
    readOnlyHint: true,
    idempotentHint: true,
    destructiveHint: false,
    openWorldHint: false
  },
  handler: () => ({
    isError: false,
    content: [{ type: "text", text: "pong" }]
  })
};

export function createToolErrorResult(error: unknown): CallToolResult {
  return {
    isError: true,
    content: [{ type: "text", text: describeToolError(error) }]
  };
}

export function createKommoMcpServer(
  options: CreateKommoMcpServerOptions = {}
): McpServer {
  const identity = createPackageIdentity("cli");
  const server = new McpServer({
    name: identity.name,
    version: identity.version
  });
  const tools =
    options.tools ??
    createDefaultToolRegistry(
      options.kommoClientProvider === undefined
        ? {}
        : { kommoClientProvider: options.kommoClientProvider }
    );

  for (const tool of tools) {
    const baseToolConfig = {
      title: tool.title,
      inputSchema: tool.inputSchema ?? {},
      annotations: tool.annotations
    };
    const toolConfig =
      tool.description === undefined
        ? baseToolConfig
        : { ...baseToolConfig, description: tool.description };

    server.registerTool(
      tool.name,
      toolConfig,
      async (args: Record<string, unknown> | undefined) => {
        try {
          return await tool.handler(args as Record<string, unknown> | undefined);
        } catch (error) {
          return createToolErrorResult(error);
        }
      }
    );
  }

  return server;
}

export interface CreateDefaultToolRegistryOptions {
  readonly kommoClientProvider?: DefaultKommoClientProvider;
}

export function createDefaultToolRegistry(
  options: CreateDefaultToolRegistryOptions = {}
): McpToolDefinition[] {
  return [
    healthTool,
    ...createAccountPipelineTools(options.kommoClientProvider),
    ...createLeadTools(options.kommoClientProvider)
  ];
}

export async function runStdioServer(
  options: RunStdioServerOptions = {}
): Promise<McpServer> {
  const server = createKommoMcpServer(options);
  const transport = new StdioServerTransport(options.stdin, options.stdout);
  await server.connect(transport);
  return server;
}

function describeToolError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}
