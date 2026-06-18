export type KommoHttpMethod = "GET" | "POST" | "PATCH" | "PUT" | "DELETE";

export type KommoApiPhase = "m1" | "m1-next" | "phase-2" | "future" | "out-of-scope";

export type KommoApiEntityType = "leads" | "contacts" | "companies";

export interface KommoApiOperationContract {
  readonly method: KommoHttpMethod;
  readonly path: string;
  readonly documentationUrl: string;
  readonly openapiOperationId: string;
  readonly phase: KommoApiPhase;
  readonly entity: string;
  readonly summary: string;
  readonly readOnly: boolean;
  readonly idempotent: boolean;
  readonly destructive: boolean;
  readonly openWorld: boolean;
  readonly requestBody:
    | "none"
    | "single-object"
    | "array-of-objects"
    | "entity-patch-object";
  readonly embeddedKey?: string;
  readonly queryParameters?: readonly string[];
  readonly pathParameters?: readonly string[];
  readonly withParameters?: readonly string[];
  readonly responseStatuses: readonly number[];
  readonly mcpTools?: readonly string[];
}

export interface KommoApiContract {
  readonly checkedAt: string;
  readonly documentation: {
    readonly indexUrl: string;
    readonly docsBaseUrl: string;
    readonly referenceBaseUrl: string;
  };
  readonly transport: {
    readonly hostTemplate: string;
    readonly apiBasePath: string;
    readonly authScheme: "Bearer";
    readonly requiredProtocol: "https";
    readonly defaultAccept: "application/json";
    readonly jsonContentType: "application/json";
    readonly userAgent: string;
  };
  readonly limits: {
    readonly requestsPerSecond: number;
    readonly maxPageLimit: number;
    readonly maxBatchEntities: number;
    readonly recommendedBatchEntities: number;
    readonly maxPipelines: number;
    readonly maxPipelineStagesIncludingSystem: number;
  };
  readonly pagination: {
    readonly style: "hal";
    readonly pageQuery: "page";
    readonly limitQuery: "limit";
    readonly noContentStatus: 204;
  };
  readonly errors: {
    readonly validationStatus: 400 | 422;
    readonly unauthorizedStatus: 401;
    readonly forbiddenStatus: 403;
    readonly notFoundStatus: 404;
    readonly rateLimitStatus: 429;
    readonly serverErrorStatus: 500;
  };
  readonly entityTypes: readonly KommoApiEntityType[];
  readonly operations: Record<string, KommoApiOperationContract>;
  readonly deferredSurfaces: Record<
    string,
    {
      readonly phase: KommoApiPhase;
      readonly documentationUrl: string;
      readonly reason: string;
    }
  >;
}

const docs = {
  account: "https://developers.kommo.com/reference/account-parameters",
  pipelines: "https://developers.kommo.com/reference/pipelines-list",
  pipelineStatuses: "https://developers.kommo.com/reference/stages-list",
  leadsList: "https://developers.kommo.com/reference/leads-list",
  leadById: "https://developers.kommo.com/reference/getting-a-lead-by-its-id",
  addLeads: "https://developers.kommo.com/reference/adding-leads",
  updateLead: "https://developers.kommo.com/reference/updating-single-lead",
  contactsList: "https://developers.kommo.com/reference/contacts-list",
  contactById: "https://developers.kommo.com/reference/get-contact",
  addContacts: "https://developers.kommo.com/reference/add-contacts",
  updateContact: "https://developers.kommo.com/reference/update-contact",
  companiesList: "https://developers.kommo.com/reference/companies-list",
  addCompanies: "https://developers.kommo.com/reference/add-companies",
  companyById: "https://developers.kommo.com/reference/get-company",
  updateCompany: "https://developers.kommo.com/reference/updating-company",
  updateCompanies: "https://developers.kommo.com/reference/update-companies",
  tasksList: "https://developers.kommo.com/reference/tasks-list",
  addTasks: "https://developers.kommo.com/reference/add-tasks",
  taskById: "https://developers.kommo.com/reference/task-id",
  updateTask: "https://developers.kommo.com/reference/edit-task",
  updateTasks: "https://developers.kommo.com/reference/edit-tasks",
  eventsList: "https://developers.kommo.com/reference/events-list",
  eventById: "https://developers.kommo.com/reference/get-event",
  eventTypes: "https://developers.kommo.com/reference/get-events-types",
  notesList: "https://developers.kommo.com/reference/notes-list-entity",
  addNotes: "https://developers.kommo.com/reference/add-notes",
  noteById: "https://developers.kommo.com/reference/note-by-id",
  updateNote: "https://developers.kommo.com/reference/edit-note",
  pinNote: "https://developers.kommo.com/reference/pin-note",
  unpinNote: "https://developers.kommo.com/reference/unpin-note",
  tagsList: "https://developers.kommo.com/reference/list-of-entity-tags",
  addTags: "https://developers.kommo.com/reference/add-tags",
  updateTagsSingleEntity:
    "https://developers.kommo.com/reference/update-tags-single-entity",
  updateTags: "https://developers.kommo.com/reference/update-tags",
  lossReasons: "https://developers.kommo.com/reference/loss-reasons",
  lossReasonById: "https://developers.kommo.com/reference/loss-reason-by-id",
  limitations: "https://developers.kommo.com/docs/limitations",
  httpCodes: "https://developers.kommo.com/docs/http-codes",
  privateIntegration: "https://developers.kommo.com/docs/private-integration",
  longLivedToken: "https://developers.kommo.com/docs/long-lived-token",
  permissions: "https://developers.kommo.com/docs/permissions"
} as const;

export const KOMMO_API_CONTRACT = {
  checkedAt: "2026-06-18",
  documentation: {
    indexUrl: "https://developers.kommo.com/llms.txt",
    docsBaseUrl: "https://developers.kommo.com/docs",
    referenceBaseUrl: "https://developers.kommo.com/reference"
  },
  transport: {
    hostTemplate: "https://{subdomain}.kommo.com",
    apiBasePath: "/api/v4",
    authScheme: "Bearer",
    requiredProtocol: "https",
    defaultAccept: "application/json",
    jsonContentType: "application/json",
    userAgent: "kommo-mcp-server/0.0.0"
  },
  limits: {
    requestsPerSecond: 7,
    maxPageLimit: 250,
    maxBatchEntities: 250,
    recommendedBatchEntities: 50,
    maxPipelines: 50,
    maxPipelineStagesIncludingSystem: 100
  },
  pagination: {
    style: "hal",
    pageQuery: "page",
    limitQuery: "limit",
    noContentStatus: 204
  },
  errors: {
    validationStatus: 400,
    unauthorizedStatus: 401,
    forbiddenStatus: 403,
    notFoundStatus: 404,
    rateLimitStatus: 429,
    serverErrorStatus: 500
  },
  entityTypes: ["leads", "contacts", "companies"],
  operations: {
    getAccount: {
      method: "GET",
      path: "/account",
      documentationUrl: docs.account,
      openapiOperationId: "account-parameters",
      phase: "m1",
      entity: "account",
      summary: "Get authenticated Kommo account parameters.",
      readOnly: true,
      idempotent: true,
      destructive: false,
      openWorld: true,
      requestBody: "none",
      queryParameters: ["with"],
      responseStatuses: [200, 400, 429, 500],
      mcpTools: ["get_account"]
    },
    listPipelines: {
      method: "GET",
      path: "/leads/pipelines",
      documentationUrl: docs.pipelines,
      openapiOperationId: "pipelines-list",
      phase: "m1",
      entity: "pipelines",
      summary: "List lead pipelines.",
      readOnly: true,
      idempotent: true,
      destructive: false,
      openWorld: true,
      requestBody: "none",
      embeddedKey: "pipelines",
      responseStatuses: [200, 401, 403, 429, 500],
      mcpTools: ["list_pipelines"]
    },
    listPipelineStatuses: {
      method: "GET",
      path: "/leads/pipelines/{pipeline_id}/statuses",
      documentationUrl: docs.pipelineStatuses,
      openapiOperationId: "stages-list",
      phase: "m1",
      entity: "pipeline_statuses",
      summary: "List stages/statuses for a lead pipeline.",
      readOnly: true,
      idempotent: true,
      destructive: false,
      openWorld: true,
      requestBody: "none",
      embeddedKey: "statuses",
      pathParameters: ["pipeline_id"],
      queryParameters: ["with"],
      withParameters: ["descriptions"],
      responseStatuses: [200, 401, 403, 429, 500]
    },
    listLeads: {
      method: "GET",
      path: "/leads",
      documentationUrl: docs.leadsList,
      openapiOperationId: "leads-list",
      phase: "m1",
      entity: "leads",
      summary: "List leads with search, order, status and date filters.",
      readOnly: true,
      idempotent: true,
      destructive: false,
      openWorld: true,
      requestBody: "none",
      embeddedKey: "leads",
      queryParameters: [
        "with",
        "page",
        "limit",
        "query",
        "order[created_at]",
        "order[updated_at]",
        "order[id]",
        "filter[id][]",
        "filter[name][]",
        "filter[price]",
        "filter[created_by][]",
        "filter[updated_by][]",
        "filter[responsible_user_id][]",
        "filter[pipeline_id][]",
        "filter[statuses][0][pipeline_id]",
        "filter[statuses][0][status_id]"
      ],
      withParameters: [
        "contacts",
        "only_deleted",
        "loss_reason",
        "is_price_modified_by_robot",
        "catalog_elements",
        "source_id",
        "source"
      ],
      responseStatuses: [200, 204, 400, 401, 403, 429, 500],
      mcpTools: ["list_leads"]
    },
    getLead: {
      method: "GET",
      path: "/leads/{id}",
      documentationUrl: docs.leadById,
      openapiOperationId: "getting-a-lead-by-its-id",
      phase: "m1",
      entity: "leads",
      summary: "Get one lead by ID.",
      readOnly: true,
      idempotent: true,
      destructive: false,
      openWorld: true,
      requestBody: "none",
      pathParameters: ["id"],
      queryParameters: ["with"],
      responseStatuses: [200, 204, 401, 429, 500],
      mcpTools: ["get_lead"]
    },
    createLeads: {
      method: "POST",
      path: "/leads",
      documentationUrl: docs.addLeads,
      openapiOperationId: "adding-leads",
      phase: "m1",
      entity: "leads",
      summary: "Create one or more leads.",
      readOnly: false,
      idempotent: false,
      destructive: false,
      openWorld: true,
      requestBody: "array-of-objects",
      embeddedKey: "leads",
      responseStatuses: [200, 400, 401, 429, 500],
      mcpTools: ["create_lead"]
    },
    updateLead: {
      method: "PATCH",
      path: "/leads/{id}",
      documentationUrl: docs.updateLead,
      openapiOperationId: "updating-single-lead",
      phase: "m1",
      entity: "leads",
      summary: "Update one lead; moving is status_id plus pipeline_id.",
      readOnly: false,
      idempotent: true,
      destructive: false,
      openWorld: true,
      requestBody: "single-object",
      pathParameters: ["id"],
      responseStatuses: [200, 400, 401, 429, 500],
      mcpTools: ["update_lead", "move_lead"]
    },
    listContacts: {
      method: "GET",
      path: "/contacts",
      documentationUrl: docs.contactsList,
      openapiOperationId: "contacts-list",
      phase: "m1",
      entity: "contacts",
      summary: "List contacts with search, order and date filters.",
      readOnly: true,
      idempotent: true,
      destructive: false,
      openWorld: true,
      requestBody: "none",
      embeddedKey: "contacts",
      queryParameters: [
        "with",
        "page",
        "limit",
        "query",
        "order[updated_at]",
        "order[id]",
        "filter[id][]",
        "filter[name][]",
        "filter[responsible_user_id][]"
      ],
      withParameters: ["leads", "catalog_elements"],
      responseStatuses: [200, 401],
      mcpTools: ["list_contacts"]
    },
    getContact: {
      method: "GET",
      path: "/contacts/{id}",
      documentationUrl: docs.contactById,
      openapiOperationId: "get-contact",
      phase: "m1",
      entity: "contacts",
      summary: "Get one contact by ID.",
      readOnly: true,
      idempotent: true,
      destructive: false,
      openWorld: true,
      requestBody: "none",
      pathParameters: ["id"],
      queryParameters: ["with"],
      responseStatuses: [200, 204, 401],
      mcpTools: ["get_contact"]
    },
    createContacts: {
      method: "POST",
      path: "/contacts",
      documentationUrl: docs.addContacts,
      openapiOperationId: "add-contacts",
      phase: "m1",
      entity: "contacts",
      summary: "Create one or more contacts.",
      readOnly: false,
      idempotent: false,
      destructive: false,
      openWorld: true,
      requestBody: "array-of-objects",
      embeddedKey: "contacts",
      responseStatuses: [200, 400, 401],
      mcpTools: ["create_contact"]
    },
    updateContact: {
      method: "PATCH",
      path: "/contacts/{id}",
      documentationUrl: docs.updateContact,
      openapiOperationId: "update-contact",
      phase: "m1",
      entity: "contacts",
      summary: "Update one contact.",
      readOnly: false,
      idempotent: true,
      destructive: false,
      openWorld: true,
      requestBody: "entity-patch-object",
      pathParameters: ["id"],
      responseStatuses: [200, 400, 401],
      mcpTools: ["update_contact"]
    },
    listCompanies: {
      method: "GET",
      path: "/companies",
      documentationUrl: docs.companiesList,
      openapiOperationId: "companies-list",
      phase: "m1-next",
      entity: "companies",
      summary: "List companies.",
      readOnly: true,
      idempotent: true,
      destructive: false,
      openWorld: true,
      requestBody: "none",
      embeddedKey: "companies",
      queryParameters: ["with", "page", "limit", "query"],
      responseStatuses: [200, 401]
    },
    createCompanies: {
      method: "POST",
      path: "/companies",
      documentationUrl: docs.addCompanies,
      openapiOperationId: "add-companies",
      phase: "m1-next",
      entity: "companies",
      summary: "Create one or more companies.",
      readOnly: false,
      idempotent: false,
      destructive: false,
      openWorld: true,
      requestBody: "array-of-objects",
      embeddedKey: "companies",
      responseStatuses: [200, 400, 401]
    },
    getCompany: {
      method: "GET",
      path: "/companies/{id}",
      documentationUrl: docs.companyById,
      openapiOperationId: "get-company",
      phase: "m1-next",
      entity: "companies",
      summary: "Get one company by ID.",
      readOnly: true,
      idempotent: true,
      destructive: false,
      openWorld: true,
      requestBody: "none",
      pathParameters: ["id"],
      queryParameters: ["with"],
      responseStatuses: [200, 204, 401]
    },
    updateCompany: {
      method: "PATCH",
      path: "/companies/{id}",
      documentationUrl: docs.updateCompany,
      openapiOperationId: "updating-company",
      phase: "m1-next",
      entity: "companies",
      summary: "Update one company.",
      readOnly: false,
      idempotent: true,
      destructive: false,
      openWorld: true,
      requestBody: "single-object",
      pathParameters: ["id"],
      responseStatuses: [200, 400, 401]
    },
    updateCompanies: {
      method: "PATCH",
      path: "/companies",
      documentationUrl: docs.updateCompanies,
      openapiOperationId: "update-companies",
      phase: "m1-next",
      entity: "companies",
      summary: "Update companies in batch.",
      readOnly: false,
      idempotent: true,
      destructive: false,
      openWorld: true,
      requestBody: "array-of-objects",
      embeddedKey: "companies",
      responseStatuses: [200, 400, 401]
    },
    listTasks: {
      method: "GET",
      path: "/tasks",
      documentationUrl: docs.tasksList,
      openapiOperationId: "tasks-list",
      phase: "m1-next",
      entity: "tasks",
      summary: "List tasks.",
      readOnly: true,
      idempotent: true,
      destructive: false,
      openWorld: true,
      requestBody: "none",
      embeddedKey: "tasks",
      queryParameters: [
        "page",
        "limit",
        "filter[responsible_user_id][]",
        "filter[is_completed]",
        "filter[task_type][]",
        "filter[entity_type]",
        "filter[entity_id][]"
      ],
      responseStatuses: [200, 401]
    },
    createTasks: {
      method: "POST",
      path: "/tasks",
      documentationUrl: docs.addTasks,
      openapiOperationId: "add-tasks",
      phase: "m1-next",
      entity: "tasks",
      summary: "Create tasks.",
      readOnly: false,
      idempotent: false,
      destructive: false,
      openWorld: true,
      requestBody: "array-of-objects",
      embeddedKey: "tasks",
      responseStatuses: [200, 400, 401]
    },
    getTask: {
      method: "GET",
      path: "/tasks/{id}",
      documentationUrl: docs.taskById,
      openapiOperationId: "task-id",
      phase: "m1-next",
      entity: "tasks",
      summary: "Get one task by ID.",
      readOnly: true,
      idempotent: true,
      destructive: false,
      openWorld: true,
      requestBody: "none",
      pathParameters: ["id"],
      responseStatuses: [200, 401]
    },
    updateTask: {
      method: "PATCH",
      path: "/tasks/{id}",
      documentationUrl: docs.updateTask,
      openapiOperationId: "edit-task",
      phase: "m1-next",
      entity: "tasks",
      summary: "Update one task.",
      readOnly: false,
      idempotent: true,
      destructive: false,
      openWorld: true,
      requestBody: "single-object",
      pathParameters: ["id"],
      responseStatuses: [200, 400, 401]
    },
    updateTasks: {
      method: "PATCH",
      path: "/tasks",
      documentationUrl: docs.updateTasks,
      openapiOperationId: "edit-tasks",
      phase: "m1-next",
      entity: "tasks",
      summary: "Update tasks in batch.",
      readOnly: false,
      idempotent: true,
      destructive: false,
      openWorld: true,
      requestBody: "array-of-objects",
      embeddedKey: "tasks",
      responseStatuses: [200, 400, 401]
    },
    listEvents: {
      method: "GET",
      path: "/events",
      documentationUrl: docs.eventsList,
      openapiOperationId: "events-list",
      phase: "m1-next",
      entity: "events",
      summary: "List audit events.",
      readOnly: true,
      idempotent: true,
      destructive: false,
      openWorld: true,
      requestBody: "none",
      embeddedKey: "events",
      queryParameters: ["with", "page", "limit", "filter[entity]", "filter[type]"],
      responseStatuses: [200, 401, 402]
    },
    getEvent: {
      method: "GET",
      path: "/events/{id}",
      documentationUrl: docs.eventById,
      openapiOperationId: "get-event",
      phase: "m1-next",
      entity: "events",
      summary: "Get one audit event by ID.",
      readOnly: true,
      idempotent: true,
      destructive: false,
      openWorld: true,
      requestBody: "none",
      pathParameters: ["id"],
      queryParameters: ["with"],
      responseStatuses: [200, 401, 402]
    },
    listEventTypes: {
      method: "GET",
      path: "/events/types",
      documentationUrl: docs.eventTypes,
      openapiOperationId: "get-events-types",
      phase: "m1-next",
      entity: "events",
      summary: "List available event types.",
      readOnly: true,
      idempotent: true,
      destructive: false,
      openWorld: true,
      requestBody: "none",
      queryParameters: ["language_code"],
      responseStatuses: [200, 400]
    },
    listEntityNotes: {
      method: "GET",
      path: "/{entity_type}/notes",
      documentationUrl: docs.notesList,
      openapiOperationId: "notes-list-entity",
      phase: "m1-next",
      entity: "notes",
      summary: "List notes for leads, contacts or companies.",
      readOnly: true,
      idempotent: true,
      destructive: false,
      openWorld: true,
      requestBody: "none",
      embeddedKey: "notes",
      pathParameters: ["entity_type"],
      queryParameters: ["page", "limit", "filter[note_type][]", "with"],
      withParameters: ["is_pinned"],
      responseStatuses: [200, 401, 402]
    },
    createNotes: {
      method: "POST",
      path: "/{entity_type}/notes",
      documentationUrl: docs.addNotes,
      openapiOperationId: "add-notes",
      phase: "m1-next",
      entity: "notes",
      summary: "Create notes for leads, contacts or companies.",
      readOnly: false,
      idempotent: false,
      destructive: false,
      openWorld: true,
      requestBody: "array-of-objects",
      embeddedKey: "notes",
      pathParameters: ["entity_type"],
      responseStatuses: [200, 400, 401, 402, 403]
    },
    getNote: {
      method: "GET",
      path: "/{entity_type}/notes/{id}",
      documentationUrl: docs.noteById,
      openapiOperationId: "note-by-id",
      phase: "m1-next",
      entity: "notes",
      summary: "Get one note by ID.",
      readOnly: true,
      idempotent: true,
      destructive: false,
      openWorld: true,
      requestBody: "none",
      pathParameters: ["entity_type", "id"],
      responseStatuses: [200, 401, 402]
    },
    updateNote: {
      method: "PATCH",
      path: "/{entity_type}/notes/{id}",
      documentationUrl: docs.updateNote,
      openapiOperationId: "edit-note",
      phase: "m1-next",
      entity: "notes",
      summary: "Update one note.",
      readOnly: false,
      idempotent: true,
      destructive: false,
      openWorld: true,
      requestBody: "single-object",
      pathParameters: ["entity_type", "id"],
      responseStatuses: [200, 400, 401, 402, 403]
    },
    pinNote: {
      method: "POST",
      path: "/{entity_type}/notes/{id}/pin",
      documentationUrl: docs.pinNote,
      openapiOperationId: "post_api-v4-entity-type-notes-id-pin",
      phase: "m1-next",
      entity: "notes",
      summary: "Pin a note.",
      readOnly: false,
      idempotent: true,
      destructive: false,
      openWorld: true,
      requestBody: "none",
      pathParameters: ["entity_type", "id"],
      responseStatuses: [204, 401, 402, 403, 404]
    },
    unpinNote: {
      method: "POST",
      path: "/{entity_type}/notes/{id}/unpin",
      documentationUrl: docs.unpinNote,
      openapiOperationId: "post_api-v4-entity-type-notes-id-unpin",
      phase: "m1-next",
      entity: "notes",
      summary: "Unpin a note.",
      readOnly: false,
      idempotent: true,
      destructive: false,
      openWorld: true,
      requestBody: "none",
      pathParameters: ["entity_type", "id"],
      responseStatuses: [204, 401, 402, 403, 404]
    },
    listEntityTags: {
      method: "GET",
      path: "/{entity_type}/tags",
      documentationUrl: docs.tagsList,
      openapiOperationId: "list-of-entity-tags",
      phase: "m1-next",
      entity: "tags",
      summary: "List tags for leads, contacts or companies.",
      readOnly: true,
      idempotent: true,
      destructive: false,
      openWorld: true,
      requestBody: "none",
      embeddedKey: "tags",
      pathParameters: ["entity_type"],
      queryParameters: ["page", "limit", "query", "filter[id][]", "filter[name]"],
      responseStatuses: [200, 204, 401]
    },
    createEntityTags: {
      method: "POST",
      path: "/{entity_type}/tags",
      documentationUrl: docs.addTags,
      openapiOperationId: "add-tags",
      phase: "m1-next",
      entity: "tags",
      summary: "Create tags for leads, contacts or companies.",
      readOnly: false,
      idempotent: false,
      destructive: false,
      openWorld: true,
      requestBody: "array-of-objects",
      embeddedKey: "tags",
      pathParameters: ["entity_type"],
      responseStatuses: [200, 400, 401]
    },
    updateTagsSingleEntity: {
      method: "PATCH",
      path: "/{entity_type}/{id}",
      documentationUrl: docs.updateTagsSingleEntity,
      openapiOperationId: "update-tags-single-entity",
      phase: "m1-next",
      entity: "tags",
      summary: "Add tags to a single lead, contact or company.",
      readOnly: false,
      idempotent: true,
      destructive: false,
      openWorld: true,
      requestBody: "single-object",
      pathParameters: ["entity_type", "id"],
      responseStatuses: [200, 400, 401]
    },
    updateTags: {
      method: "PATCH",
      path: "/{entity_type}",
      documentationUrl: docs.updateTags,
      openapiOperationId: "update-tags",
      phase: "m1-next",
      entity: "tags",
      summary: "Add tags to entities in batch.",
      readOnly: false,
      idempotent: true,
      destructive: false,
      openWorld: true,
      requestBody: "array-of-objects",
      pathParameters: ["entity_type"],
      responseStatuses: [200, 400, 401]
    },
    listLossReasons: {
      method: "GET",
      path: "/leads/loss_reasons",
      documentationUrl: docs.lossReasons,
      openapiOperationId: "get_apiv4leadsloss_reaso",
      phase: "m1-next",
      entity: "loss_reasons",
      summary: "List lead loss reasons.",
      readOnly: true,
      idempotent: true,
      destructive: false,
      openWorld: true,
      requestBody: "none",
      embeddedKey: "loss_reasons",
      responseStatuses: [200]
    },
    getLossReason: {
      method: "GET",
      path: "/leads/loss_reasons/{id}",
      documentationUrl: docs.lossReasonById,
      openapiOperationId: "get_apiv4leadsloss_reaso-1",
      phase: "m1-next",
      entity: "loss_reasons",
      summary: "Get one lead loss reason by ID.",
      readOnly: true,
      idempotent: true,
      destructive: false,
      openWorld: true,
      requestBody: "none",
      pathParameters: ["id"],
      responseStatuses: [200, 404]
    }
  },
  deferredSurfaces: {
    customFields: {
      phase: "phase-2",
      documentationUrl: "https://developers.kommo.com/reference/custom-fields",
      reason: "Complex entity-specific schemas; PRD places custom fields after M1."
    },
    listsCatalogs: {
      phase: "phase-2",
      documentationUrl: "https://developers.kommo.com/reference/lists",
      reason: "Useful after core CRM operations stabilize."
    },
    usersAndRoles: {
      phase: "phase-2",
      documentationUrl: "https://developers.kommo.com/reference/users-and-roles",
      reason: "Needed for richer assignment tooling, not required for first M1 DoD."
    },
    sources: {
      phase: "phase-2",
      documentationUrl: "https://developers.kommo.com/reference/sources",
      reason: "Source management depends on integration-level source ownership."
    },
    salesbot: {
      phase: "phase-2",
      documentationUrl: "https://developers.kommo.com/reference/salesbot",
      reason: "Actionful automation surface that needs explicit safeguards."
    },
    chats: {
      phase: "future",
      documentationUrl: "https://developers.kommo.com/reference/send-message-guide",
      reason: "Chats API uses a different operational model from basic CRM API."
    },
    files: {
      phase: "future",
      documentationUrl: "https://developers.kommo.com/reference/files-methods",
      reason: "Files API includes file-service upload sessions and binary flows."
    },
    webhooks: {
      phase: "future",
      documentationUrl: "https://developers.kommo.com/reference/webhooks",
      reason: "Incoming event delivery is outside the local stdio M1 path."
    },
    widgets: {
      phase: "future",
      documentationUrl: "https://developers.kommo.com/reference/widgets",
      reason: "Kommo UI widget packaging is separate from MCP server runtime."
    },
    aiApi: {
      phase: "future",
      documentationUrl: "https://developers.kommo.com/reference/ai-api-methods",
      reason: "Separate Kommo AI product surface, not core CRM orchestration."
    }
  }
} as const satisfies KommoApiContract;

export type KommoApiOperationKey = keyof typeof KOMMO_API_CONTRACT.operations;

export function buildKommoApiBaseUrl(subdomain: string): string {
  return `${KOMMO_API_CONTRACT.transport.hostTemplate.replace(
    "{subdomain}",
    subdomain
  )}${KOMMO_API_CONTRACT.transport.apiBasePath}`;
}

export function renderKommoApiPath(
  template: string,
  params: Record<string, string | number> = {}
): string {
  return template.replace(/\{([a-zA-Z0-9_]+)\}/g, (_match, key: string) => {
    const value = params[key];
    if (value === undefined) {
      throw new Error(`Missing Kommo API path parameter: ${key}`);
    }
    return encodeURIComponent(String(value));
  });
}

export function getKommoApiOperation(
  key: KommoApiOperationKey
): (typeof KOMMO_API_CONTRACT.operations)[KommoApiOperationKey] {
  return KOMMO_API_CONTRACT.operations[key];
}
