/**
 * `@syntelix/kommo-mcp-core` — domínio/cliente Kommo + contratos de tools.
 *
 * Sem dependência de transporte MCP (ADR-0004): este pacote é consumido tanto pelo
 * `cli` (stdio) quanto pelo `server` (HTTP, Fase 2).
 */

export type { KommoConfig } from "./config.js";
export { KOMMO_ENV, loadKommoConfig } from "./config.js";

export type {
  KommoApiContract,
  KommoApiEntityType,
  KommoApiOperationContract,
  KommoApiOperationKey,
  KommoApiPhase,
  KommoHttpMethod
} from "./api-contract.js";
export {
  KOMMO_API_CONTRACT,
  buildKommoApiBaseUrl,
  getKommoApiOperation,
  renderKommoApiPath
} from "./api-contract.js";

export {
  KommoConfigError,
  KommoNetworkError,
  KommoAuthError,
  KommoNotFoundError,
  KommoValidationError,
  KommoRateLimitError,
  KommoUnexpectedHttpError,
  mapHttpStatusToError
} from "./errors.js";
export type { KommoHttpError } from "./errors.js";

export type { FetchLike, KommoRequestOptions } from "./http-client.js";
export type { KommoHttpClientRuntimeOptions } from "./http-client.js";
export { createKommoHttpClient, KommoHttpClient } from "./http-client.js";

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
export {
  KommoClient,
  createKommoClient,
  createKommoClientFromEnv
} from "./kommo-client.js";

export type { HalResource, HalLinks, HalCollection, PaginateOptions } from "./hal.js";
export { paginateHal } from "./hal.js";

// Mantém a identidade de pacote usada pelo bootstrap (spec 001) — sem quebrar cli/server.
export type { PackageRole, PackageIdentity } from "./identity.js";
export { createPackageIdentity } from "./identity.js";
