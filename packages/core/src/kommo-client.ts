import type { KommoConfig } from "./config.js";
import { KOMMO_API_CONTRACT, renderKommoApiPath } from "./api-contract.js";
import { loadKommoConfig } from "./config.js";
import { createKommoHttpClient, type KommoHttpClient } from "./http-client.js";
import type { HalCollection, HalLinks, PaginateOptions } from "./hal.js";
import { paginateHal } from "./hal.js";
import type { KommoHttpClientRuntimeOptions } from "./http-client.js";

/** Representação mínima tipada do endpoint `GET /account` da API v4 do Kommo. */
export interface KommoAccount {
  readonly id: number;
  readonly name: string;
  readonly subdomain?: string;
  readonly country?: string;
  readonly currency?: string;
  readonly timezone?: string;
  readonly created_at?: number;
  readonly created_by?: number;
  readonly updated_at?: number;
  readonly updated_by?: number;
  readonly _links?: HalLinks;
}

export interface KommoPipelineStatus {
  readonly id: number;
  readonly name: string;
  readonly sort?: number;
  readonly type?: number;
  readonly color?: string;
  readonly _links?: HalLinks;
}

export interface KommoPipeline {
  readonly id: number;
  readonly name: string;
  readonly sort?: number;
  readonly is_main?: boolean;
  readonly is_unsorted_on?: boolean;
  readonly _embedded?: {
    readonly statuses?: KommoPipelineStatus[];
  };
  readonly _links?: HalLinks;
}

export interface KommoLead {
  readonly id: number;
  readonly name?: string;
  readonly price?: number;
  readonly responsible_user_id?: number;
  readonly pipeline_id?: number;
  readonly status_id?: number;
  readonly created_at?: number;
  readonly updated_at?: number;
  readonly closed_at?: number;
  readonly loss_reason_id?: number;
  readonly _links?: HalLinks;
}

export interface ListLeadsOptions extends PaginateOptions {
  readonly query?: string;
  readonly pipelineId?: number;
  readonly statusId?: number;
  readonly responsibleUserId?: number;
  readonly with?: string;
}

export interface CreateLeadInput {
  readonly name?: string;
  readonly price?: number;
  readonly pipelineId?: number;
  readonly statusId?: number;
  readonly responsibleUserId?: number;
}

export interface UpdateLeadInput {
  readonly name?: string;
  readonly price?: number;
  readonly pipelineId?: number;
  readonly statusId?: number;
  readonly responsibleUserId?: number;
}

export interface MoveLeadInput {
  readonly pipelineId: number;
  readonly statusId: number;
}

export interface KommoCustomFieldValue {
  readonly field_id?: number;
  readonly field_code?: string;
  readonly values: readonly {
    readonly value: string;
    readonly enum_id?: number;
    readonly enum_code?: string;
  }[];
}

export interface KommoContact {
  readonly id: number;
  readonly name?: string;
  readonly first_name?: string;
  readonly last_name?: string;
  readonly responsible_user_id?: number;
  readonly created_by?: number;
  readonly updated_by?: number;
  readonly created_at?: number;
  readonly updated_at?: number;
  readonly custom_fields_values?: readonly KommoCustomFieldValue[];
  readonly _links?: HalLinks;
}

export interface ListContactsOptions extends PaginateOptions {
  readonly query?: string;
  readonly responsibleUserId?: number;
  readonly with?: string;
}

export interface CreateContactInput {
  readonly name?: string;
  readonly firstName?: string;
  readonly lastName?: string;
  readonly responsibleUserId?: number;
  readonly phone?: string;
  readonly email?: string;
}

export interface UpdateContactInput {
  readonly name?: string;
  readonly firstName?: string;
  readonly lastName?: string;
  readonly responsibleUserId?: number;
  readonly phone?: string;
  readonly email?: string;
}

interface KommoLeadPayload {
  name?: string;
  price?: number;
  pipeline_id?: number;
  status_id?: number;
  responsible_user_id?: number;
}

/** Cliente de domínio fino sobre o HTTP client, sem dependência do transporte MCP. */
export class KommoClient {
  constructor(private readonly httpClient: KommoHttpClient) {}

  /** Busca os dados da conta autenticada. Critério de aceite explícito da spec 002. */
  async getAccount(): Promise<KommoAccount> {
    return this.httpClient.get<KommoAccount>(
      KOMMO_API_CONTRACT.operations.getAccount.path
    );
  }

  /** Lista pipelines de leads com etapas embutidas (`_embedded.statuses`). */
  async listPipelines(options: PaginateOptions = {}): Promise<KommoPipeline[]> {
    const paginateOptions = {
      limit: options.limit ?? KOMMO_API_CONTRACT.limits.maxPageLimit,
      maxPages: options.maxPages ?? 10,
      ...(options.startPage !== undefined ? { startPage: options.startPage } : {})
    };
    const operation = KOMMO_API_CONTRACT.operations.listPipelines;

    return paginateHal(
      (page, limit) =>
        this.httpClient.get<HalCollection<KommoPipeline>>(operation.path, {
          query: { page, limit }
        }),
      operation.embeddedKey,
      paginateOptions
    );
  }

  async listLeads(options: ListLeadsOptions = {}): Promise<KommoLead[]> {
    const operation = KOMMO_API_CONTRACT.operations.listLeads;
    const paginateOptions = {
      limit: options.limit ?? KOMMO_API_CONTRACT.limits.maxPageLimit,
      maxPages: options.maxPages ?? 10,
      ...(options.startPage !== undefined ? { startPage: options.startPage } : {})
    };
    const baseQuery = buildLeadListQuery(options);

    return paginateHal(
      (page, limit) =>
        this.httpClient.get<HalCollection<KommoLead>>(operation.path, {
          query: { ...baseQuery, page, limit }
        }),
      operation.embeddedKey,
      paginateOptions
    );
  }

  async getLead(id: number, withParam?: string): Promise<KommoLead> {
    const operation = KOMMO_API_CONTRACT.operations.getLead;
    const query = withParam === undefined ? undefined : { with: withParam };
    return this.httpClient.get<KommoLead>(
      renderKommoApiPath(operation.path, { id }),
      query === undefined ? {} : { query }
    );
  }

  async createLead(input: CreateLeadInput): Promise<KommoLead> {
    const operation = KOMMO_API_CONTRACT.operations.createLeads;
    const response = await this.httpClient.post<HalCollection<KommoLead>>(
      operation.path,
      [toKommoLeadPayload(input)]
    );
    return firstEmbeddedItem(response, operation.embeddedKey, "lead criado");
  }

  async updateLead(id: number, input: UpdateLeadInput): Promise<KommoLead> {
    const operation = KOMMO_API_CONTRACT.operations.updateLead;
    return this.httpClient.patch<KommoLead>(
      renderKommoApiPath(operation.path, { id }),
      toKommoLeadPayload(input)
    );
  }

  async moveLead(id: number, input: MoveLeadInput): Promise<KommoLead> {
    return this.updateLead(id, {
      pipelineId: input.pipelineId,
      statusId: input.statusId
    });
  }

  async listContacts(options: ListContactsOptions = {}): Promise<KommoContact[]> {
    const operation = KOMMO_API_CONTRACT.operations.listContacts;
    const paginateOptions = {
      limit: options.limit ?? KOMMO_API_CONTRACT.limits.maxPageLimit,
      maxPages: options.maxPages ?? 10,
      ...(options.startPage !== undefined ? { startPage: options.startPage } : {})
    };
    const baseQuery = buildContactListQuery(options);

    return paginateHal(
      (page, limit) =>
        this.httpClient.get<HalCollection<KommoContact>>(operation.path, {
          query: { ...baseQuery, page, limit }
        }),
      operation.embeddedKey,
      paginateOptions
    );
  }

  async getContact(id: number, withParam?: string): Promise<KommoContact> {
    const operation = KOMMO_API_CONTRACT.operations.getContact;
    const query = withParam === undefined ? undefined : { with: withParam };
    return this.httpClient.get<KommoContact>(
      renderKommoApiPath(operation.path, { id }),
      query === undefined ? {} : { query }
    );
  }

  async createContact(input: CreateContactInput): Promise<KommoContact> {
    const operation = KOMMO_API_CONTRACT.operations.createContacts;
    const response = await this.httpClient.post<HalCollection<KommoContact>>(
      operation.path,
      [toKommoContactPayload(input)]
    );
    return firstEmbeddedItem(response, operation.embeddedKey, "contato criado");
  }

  async updateContact(id: number, input: UpdateContactInput): Promise<KommoContact> {
    const operation = KOMMO_API_CONTRACT.operations.updateContact;
    return this.httpClient.patch<KommoContact>(
      renderKommoApiPath(operation.path, { id }),
      toKommoContactPayload(input)
    );
  }
}

/** Cria o cliente Kommo a partir de uma config já validada. */
export function createKommoClient(
  config: KommoConfig,
  options: KommoHttpClientRuntimeOptions = {}
): KommoClient {
  const httpClient = createKommoHttpClient(
    config.subdomain,
    config.accessToken,
    options
  );
  return new KommoClient(httpClient);
}

/** Lê `KOMMO_SUBDOMAIN`/`KOMMO_ACCESS_TOKEN`, valida e cria o cliente Kommo. */
export function createKommoClientFromEnv(
  env: Record<string, string | undefined> = process.env,
  options: KommoHttpClientRuntimeOptions = {}
): KommoClient {
  return createKommoClient(loadKommoConfig(env), options);
}

function buildLeadListQuery(
  options: ListLeadsOptions
): Record<string, string | number | boolean | undefined> {
  const query: Record<string, string | number | boolean | undefined> = {};
  if (options.query !== undefined) {
    query["query"] = options.query;
  }
  if (options.with !== undefined) {
    query["with"] = options.with;
  }
  if (options.responsibleUserId !== undefined) {
    query["filter[responsible_user_id][]"] = options.responsibleUserId;
  }
  if (options.pipelineId !== undefined && options.statusId !== undefined) {
    query["filter[statuses][0][pipeline_id]"] = options.pipelineId;
    query["filter[statuses][0][status_id]"] = options.statusId;
    return query;
  }
  if (options.pipelineId !== undefined) {
    query["filter[pipeline_id][]"] = options.pipelineId;
  }
  return query;
}

function buildContactListQuery(
  options: ListContactsOptions
): Record<string, string | number | boolean | undefined> {
  const query: Record<string, string | number | boolean | undefined> = {};
  if (options.query !== undefined) {
    query["query"] = options.query;
  }
  if (options.with !== undefined) {
    query["with"] = options.with;
  }
  if (options.responsibleUserId !== undefined) {
    query["filter[responsible_user_id][]"] = options.responsibleUserId;
  }
  return query;
}

function toKommoLeadPayload(
  input: CreateLeadInput | UpdateLeadInput
): KommoLeadPayload {
  const payload: KommoLeadPayload = {};
  if (input.name !== undefined) {
    payload.name = input.name;
  }
  if (input.price !== undefined) {
    payload.price = input.price;
  }
  if (input.pipelineId !== undefined) {
    payload.pipeline_id = input.pipelineId;
  }
  if (input.statusId !== undefined) {
    payload.status_id = input.statusId;
  }
  if (input.responsibleUserId !== undefined) {
    payload.responsible_user_id = input.responsibleUserId;
  }
  return payload;
}

interface KommoContactPayload {
  name?: string;
  first_name?: string;
  last_name?: string;
  responsible_user_id?: number;
  custom_fields_values?: {
    field_code: string;
    values: { value: string }[];
  }[];
}

function toKommoContactPayload(
  input: CreateContactInput | UpdateContactInput
): KommoContactPayload {
  const payload: KommoContactPayload = {};
  if (input.name !== undefined) {
    payload.name = input.name;
  }
  if (input.firstName !== undefined) {
    payload.first_name = input.firstName;
  }
  if (input.lastName !== undefined) {
    payload.last_name = input.lastName;
  }
  if (input.responsibleUserId !== undefined) {
    payload.responsible_user_id = input.responsibleUserId;
  }

  const customFields: KommoContactPayload["custom_fields_values"] = [];
  if (input.phone !== undefined) {
    customFields.push({ field_code: "PHONE", values: [{ value: input.phone }] });
  }
  if (input.email !== undefined) {
    customFields.push({ field_code: "EMAIL", values: [{ value: input.email }] });
  }
  if (customFields.length > 0) {
    payload.custom_fields_values = customFields;
  }
  return payload;
}

function firstEmbeddedItem<TItem>(
  collection: HalCollection<TItem>,
  embeddedKey: string,
  label: string
): TItem {
  const item = collection._embedded?.[embeddedKey]?.[0];
  if (item === undefined) {
    throw new Error(`Resposta do Kommo sem ${label}.`);
  }
  return item;
}
