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
        const contacts = await clientProvider().listContacts(
          parseListContactsInput(args)
        );
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
      description:
        "Cria um contato Kommo com nome, telefone e/ou email (campos básicos).",
      inputSchema: contactMutationSchema(),
      annotations: annotationsFromOperation("createContacts", "Create Kommo contact"),
      handler: async (args) => {
        const contact = await clientProvider().createContact(
          parseCreateContactInput(args)
        );
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
        const contact = await clientProvider().updateContact(
          id,
          parseUpdateContactInput(record)
        );
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
  if (value === undefined) return undefined;
  if (typeof value !== "string") throw new Error(`Campo ${key} deve ser string.`);
  return value;
}

function optionalNumber(
  record: Record<string, unknown>,
  key: string
): number | undefined {
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
