import { createKommoClientFromEnv } from "@syntelix/kommo-mcp-core";

import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import type {
  KommoAccount,
  KommoClient,
  KommoPipeline,
  KommoPipelineStatus
} from "@syntelix/kommo-mcp-core";
import type { McpToolDefinition } from "./mcp-server.js";

export type AccountPipelineClient = Pick<KommoClient, "getAccount" | "listPipelines">;

export type KommoClientProvider = () => AccountPipelineClient;

export interface AccountSummary {
  id: number;
  name: string;
  subdomain?: string;
  currency?: string;
  timezone?: string;
  country?: string;
}

export interface PipelineStatusSummary {
  id: number;
  name: string;
  sort?: number;
  type?: number;
}

export interface PipelineSummary {
  id: number;
  name: string;
  sort?: number;
  statuses: PipelineStatusSummary[];
}

export function createAccountPipelineTools(
  clientProvider: KommoClientProvider = () => createKommoClientFromEnv()
): McpToolDefinition[] {
  return [
    {
      name: "get_account",
      title: "Get Kommo account",
      description: "Retorna os dados essenciais da conta Kommo autenticada.",
      inputSchema: {},
      annotations: readOnlyOpenWorldAnnotations("Get Kommo account"),
      handler: async () => {
        const account = await clientProvider().getAccount();
        return jsonToolResult({ account: summarizeAccount(account) });
      }
    },
    {
      name: "list_pipelines",
      title: "List Kommo pipelines",
      description: "Lista pipelines de leads e suas etapas com ids utilizáveis.",
      inputSchema: {},
      annotations: readOnlyOpenWorldAnnotations("List Kommo pipelines"),
      handler: async () => {
        const pipelines = await clientProvider().listPipelines();
        return jsonToolResult({
          pipelines: pipelines.map(summarizePipeline)
        });
      }
    }
  ];
}

export function summarizeAccount(account: KommoAccount): AccountSummary {
  const summary: AccountSummary = {
    id: account.id,
    name: account.name
  };
  if (account.subdomain !== undefined) {
    summary.subdomain = account.subdomain;
  }
  if (account.currency !== undefined) {
    summary.currency = account.currency;
  }
  if (account.timezone !== undefined) {
    summary.timezone = account.timezone;
  }
  if (account.country !== undefined) {
    summary.country = account.country;
  }
  return summary;
}

export function summarizePipeline(pipeline: KommoPipeline): PipelineSummary {
  const summary: PipelineSummary = {
    id: pipeline.id,
    name: pipeline.name,
    statuses: (pipeline._embedded?.statuses ?? []).map(summarizeStatus)
  };
  if (pipeline.sort !== undefined) {
    summary.sort = pipeline.sort;
  }
  return summary;
}

function summarizeStatus(status: KommoPipelineStatus): PipelineStatusSummary {
  const summary: PipelineStatusSummary = {
    id: status.id,
    name: status.name
  };
  if (status.sort !== undefined) {
    summary.sort = status.sort;
  }
  if (status.type !== undefined) {
    summary.type = status.type;
  }
  return summary;
}

function readOnlyOpenWorldAnnotations(title: string): McpToolDefinition["annotations"] {
  return {
    title,
    readOnlyHint: true,
    idempotentHint: true,
    destructiveHint: false,
    openWorldHint: true
  };
}

function jsonToolResult(structuredContent: Record<string, unknown>): CallToolResult {
  return {
    isError: false,
    structuredContent,
    content: [
      {
        type: "text",
        text: JSON.stringify(structuredContent)
      }
    ]
  };
}
