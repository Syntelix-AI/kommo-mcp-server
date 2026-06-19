import { KOMMO_API_CONTRACT, createKommoClientFromEnv } from "@syntelix/kommo-mcp-core";
import { z } from "zod";

import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import type {
  CreateLeadInput,
  KommoClient,
  KommoLead,
  KommoPipeline,
  ListLeadsOptions,
  UpdateLeadInput
} from "@syntelix/kommo-mcp-core";
import type { McpToolDefinition } from "./mcp-server.js";

export type LeadClient = Pick<
  KommoClient,
  "listLeads" | "getLead" | "createLead" | "updateLead" | "moveLead" | "listPipelines"
>;

export type LeadClientProvider = () => LeadClient;

export interface LeadSummary {
  id: number;
  name?: string;
  price?: number;
  pipeline_id?: number;
  status_id?: number;
  responsible_user_id?: number;
}

export function createLeadTools(
  clientProvider: LeadClientProvider = () => createKommoClientFromEnv()
): McpToolDefinition[] {
  return [
    {
      name: "list_leads",
      title: "List Kommo leads",
      description: "Lista leads com filtros de busca, pipeline, etapa e paginação.",
      inputSchema: {
        query: z.string().optional(),
        pipeline_id: positiveInteger().optional(),
        status_id: positiveInteger().optional(),
        responsible_user_id: positiveInteger().optional(),
        limit: positiveInteger().max(KOMMO_API_CONTRACT.limits.maxPageLimit).optional()
      },
      annotations: annotationsFromOperation("listLeads", "List Kommo leads"),
      handler: async (args) => {
        const leads = await clientProvider().listLeads(parseListLeadsInput(args));
        return jsonToolResult({ leads: leads.map(summarizeLead) });
      }
    },
    {
      name: "get_lead",
      title: "Get Kommo lead",
      description: "Retorna um lead Kommo por ID.",
      inputSchema: {
        id: positiveInteger()
      },
      annotations: annotationsFromOperation("getLead", "Get Kommo lead"),
      handler: async (args) => {
        const lead = await clientProvider().getLead(requiredNumber(args, "id"));
        return jsonToolResult({ lead: summarizeLead(lead) });
      }
    },
    {
      name: "create_lead",
      title: "Create Kommo lead",
      description: "Cria um lead Kommo com campos básicos.",
      inputSchema: leadMutationSchema(),
      annotations: annotationsFromOperation("createLeads", "Create Kommo lead"),
      handler: async (args) => {
        const lead = await clientProvider().createLead(parseCreateLeadInput(args));
        return jsonToolResult({ lead: summarizeLead(lead) });
      }
    },
    {
      name: "update_lead",
      title: "Update Kommo lead",
      description: "Atualiza campos básicos de um lead Kommo.",
      inputSchema: {
        id: positiveInteger(),
        ...leadMutationSchema()
      },
      annotations: annotationsFromOperation("updateLead", "Update Kommo lead"),
      handler: async (args) => {
        const record = inputRecord(args);
        const id = requiredNumber(record, "id");
        const lead = await clientProvider().updateLead(
          id,
          parseUpdateLeadInput(record)
        );
        return jsonToolResult({ lead: summarizeLead(lead) });
      }
    },
    {
      name: "move_lead",
      title: "Move Kommo lead",
      description: "Move um lead para outro pipeline/etapa com validação local.",
      inputSchema: {
        id: positiveInteger(),
        pipeline_id: positiveInteger(),
        status_id: positiveInteger()
      },
      annotations: annotationsFromOperation("updateLead", "Move Kommo lead"),
      handler: async (args) => {
        const record = inputRecord(args);
        const id = requiredNumber(record, "id");
        const pipelineId = requiredNumber(record, "pipeline_id");
        const statusId = requiredNumber(record, "status_id");
        const client = clientProvider();

        assertStatusBelongsToPipeline(
          await client.listPipelines(),
          pipelineId,
          statusId
        );

        const lead = await client.moveLead(id, { pipelineId, statusId });
        return jsonToolResult({ lead: summarizeLead(lead) });
      }
    }
  ];
}

export function summarizeLead(lead: KommoLead): LeadSummary {
  const summary: LeadSummary = {
    id: lead.id
  };
  if (lead.name !== undefined) {
    summary.name = lead.name;
  }
  if (lead.price !== undefined) {
    summary.price = lead.price;
  }
  if (lead.pipeline_id !== undefined) {
    summary.pipeline_id = lead.pipeline_id;
  }
  if (lead.status_id !== undefined) {
    summary.status_id = lead.status_id;
  }
  if (lead.responsible_user_id !== undefined) {
    summary.responsible_user_id = lead.responsible_user_id;
  }
  return summary;
}

function parseListLeadsInput(
  args: Record<string, unknown> | undefined
): ListLeadsOptions {
  const record = inputRecord(args);
  const input: {
    query?: string;
    pipelineId?: number;
    statusId?: number;
    responsibleUserId?: number;
    limit?: number;
  } = {};
  const query = optionalString(record, "query");
  if (query !== undefined) {
    input.query = query;
  }
  const pipelineId = optionalNumber(record, "pipeline_id");
  if (pipelineId !== undefined) {
    input.pipelineId = pipelineId;
  }
  const statusId = optionalNumber(record, "status_id");
  if (statusId !== undefined) {
    input.statusId = statusId;
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

function parseCreateLeadInput(
  args: Record<string, unknown> | undefined
): CreateLeadInput {
  return parseLeadMutationInput(inputRecord(args));
}

function parseUpdateLeadInput(record: Record<string, unknown>): UpdateLeadInput {
  return parseLeadMutationInput(record);
}

function parseLeadMutationInput(
  record: Record<string, unknown>
): CreateLeadInput | UpdateLeadInput {
  const input: {
    name?: string;
    price?: number;
    pipelineId?: number;
    statusId?: number;
    responsibleUserId?: number;
  } = {};
  const name = optionalString(record, "name");
  if (name !== undefined) {
    input.name = name;
  }
  const price = optionalNumber(record, "price");
  if (price !== undefined) {
    input.price = price;
  }
  const pipelineId = optionalNumber(record, "pipeline_id");
  if (pipelineId !== undefined) {
    input.pipelineId = pipelineId;
  }
  const statusId = optionalNumber(record, "status_id");
  if (statusId !== undefined) {
    input.statusId = statusId;
  }
  const responsibleUserId = optionalNumber(record, "responsible_user_id");
  if (responsibleUserId !== undefined) {
    input.responsibleUserId = responsibleUserId;
  }
  return input;
}

function assertStatusBelongsToPipeline(
  pipelines: readonly KommoPipeline[],
  pipelineId: number,
  statusId: number
): void {
  const pipeline = pipelines.find((item) => item.id === pipelineId);
  const status = pipeline?._embedded?.statuses?.find((item) => item.id === statusId);
  if (status === undefined) {
    throw new Error(`A etapa ${statusId} não pertence ao pipeline ${pipelineId}.`);
  }
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

function leadMutationSchema(): Record<string, z.ZodType> {
  return {
    name: z.string().optional(),
    price: z.number().nonnegative().optional(),
    pipeline_id: positiveInteger().optional(),
    status_id: positiveInteger().optional(),
    responsible_user_id: positiveInteger().optional()
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

function inputRecord(
  args: Record<string, unknown> | undefined
): Record<string, unknown> {
  return args ?? {};
}

function optionalString(
  record: Record<string, unknown>,
  key: string
): string | undefined {
  const value = record[key];
  if (value === undefined) {
    return undefined;
  }
  if (typeof value !== "string") {
    throw new Error(`Campo ${key} deve ser string.`);
  }
  return value;
}

function optionalNumber(
  record: Record<string, unknown>,
  key: string
): number | undefined {
  const value = record[key];
  if (value === undefined) {
    return undefined;
  }
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`Campo ${key} deve ser número.`);
  }
  return value;
}

function requiredNumber(
  argsOrRecord: Record<string, unknown> | undefined,
  key: string
): number {
  const value = inputRecord(argsOrRecord)[key];
  if (value === undefined) {
    throw new Error(`Campo ${key} é obrigatório.`);
  }
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`Campo ${key} deve ser número.`);
  }
  return value;
}
