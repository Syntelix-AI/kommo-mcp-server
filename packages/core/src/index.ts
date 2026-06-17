/**
 * `@syntelix/kommo-mcp-core` — domínio/cliente Kommo + contratos de tools.
 *
 * Sem dependência de transporte MCP (ADR-0004): este pacote é consumido tanto pelo
 * `cli` (stdio) quanto pelo `server` (HTTP, Fase 2).
 */

export type { KommoConfig } from "./config.js";
export { KOMMO_ENV, loadKommoConfig } from "./config.js";

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
export { createKommoHttpClient, KommoHttpClient } from "./http-client.js";

export type { HalResource, HalLinks, HalCollection, PaginateOptions } from "./hal.js";
export { paginateHal } from "./hal.js";

// Mantém a identidade de pacote usada pelo bootstrap (spec 001) — sem quebrar cli/server.
export type { PackageRole, PackageIdentity } from "./identity.js";
export { createPackageIdentity } from "./identity.js";
