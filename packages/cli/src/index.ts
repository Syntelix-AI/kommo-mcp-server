#!/usr/bin/env node
import { pathToFileURL } from "node:url";

import { createPackageIdentity } from "@syntelix/kommo-mcp-core";

import { runStdioServer } from "./mcp-server.js";

export {
  createAccountPipelineTools,
  summarizeAccount,
  summarizePipeline
} from "./business-tools.js";
export type {
  AccountPipelineClient,
  AccountSummary,
  KommoClientProvider,
  PipelineStatusSummary,
  PipelineSummary
} from "./business-tools.js";
export { createLeadTools, summarizeLead } from "./lead-tools.js";
export type { LeadClient, LeadClientProvider, LeadSummary } from "./lead-tools.js";
export { createContactTools, summarizeContact } from "./contact-tools.js";
export type { ContactClient, ContactClientProvider, ContactSummary } from "./contact-tools.js";
export {
  createDefaultToolRegistry,
  createKommoMcpServer,
  createToolErrorResult,
  healthTool,
  runStdioServer
} from "./mcp-server.js";
export type {
  CreateDefaultToolRegistryOptions,
  CreateKommoMcpServerOptions,
  DefaultKommoClientProvider,
  McpToolDefinition,
  RunStdioServerOptions
} from "./mcp-server.js";

export function describeCli(): string {
  const identity = createPackageIdentity("cli");
  return `${identity.name}:${identity.role}`;
}

const entryPoint = process.argv[1];
const isDirectRun =
  entryPoint !== undefined && import.meta.url === pathToFileURL(entryPoint).href;

if (isDirectRun) {
  await runStdioServer();
}
