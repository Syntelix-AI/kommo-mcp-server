# Contrato da API Kommo

Status: fonte base do projeto  
Verificado em: 2026-06-18  
Fonte raiz: [Kommo llms.txt](https://developers.kommo.com/llms.txt)

Este documento resume o contrato que o `@syntelix/kommo-mcp-core` deve usar ao
implementar tools MCP sobre a API v4 do Kommo. A versão executável deste contrato
fica em `packages/core/src/api-contract.ts`.

## Regras Globais

- Base de conta: `https://{subdomain}.kommo.com/api/v4`.
- Autenticação M1: `Authorization: Bearer <KOMMO_ACCESS_TOKEN>`, usando token de
  longa duração de integração privada.
- Headers padrão: `Accept: application/json`; `Content-Type: application/json`
  em requisições com corpo.
- Transporte: sempre HTTPS e sempre no host da conta, não em `www.kommo.com`.
- Limite operacional documentado: 7 requests por segundo.
- Paginação: `page` + `limit`; o máximo retornado por página é 250 entidades.
- Escrita em lote: máximo 250 entidades por request; recomendado operacional de
  50 por lote para reduzir risco de erro/timeout.
- Listagens CRM usam HAL: itens ficam em `_embedded.<entity>` e navegação em
  `_links`.
- `204` em consultas de item/lista deve ser tratado como sem conteúdo, não como
  erro de transporte.

Fontes oficiais:
[Limitations](https://developers.kommo.com/docs/limitations),
[HTTP status codes](https://developers.kommo.com/docs/http-codes),
[Private integration](https://developers.kommo.com/docs/private-integration),
[Long-lived Token](https://developers.kommo.com/docs/long-lived-token),
[Permissions](https://developers.kommo.com/docs/permissions).

## Status HTTP

O core deve mapear pelo menos:

| Status | Semântica no projeto |
| --- | --- |
| `200` | sucesso com JSON/HAL |
| `204` | sucesso sem corpo; recurso/lista vazia ou inexistente conforme endpoint |
| `400` | validação ou payload inválido |
| `401` | token/credencial inválida, expirada ou método de auth incorreto |
| `402` | restrição de pagamento/plano quando o endpoint expuser esse status |
| `403` | bloqueio/restrição/permissão |
| `404` | recurso não encontrado |
| `422` | validação processada mas recusada, incluindo limites de lote/página |
| `429` | rate limit; respeitar `retry_after`/`Retry-After` quando disponível |
| `500` | falha interna Kommo |

## Núcleo M1

| Operação core | Método e path | Tool MCP | Observações |
| --- | --- | --- | --- |
| `getAccount` | `GET /account` | `get_account` | dados da conta autenticada |
| `listPipelines` | `GET /leads/pipelines` | `list_pipelines` | `_embedded.pipelines`; etapas vêm embutidas na resposta de pipelines |
| `listPipelineStatuses` | `GET /leads/pipelines/{pipeline_id}/statuses` | suporte interno | fonte de validação para `move_lead` |
| `listLeads` | `GET /leads` | `list_leads` | filtros por `query`, pipeline, status, paginação e `with` |
| `getLead` | `GET /leads/{id}` | `get_lead` | aceita `with` |
| `createLeads` | `POST /leads` | `create_lead` | API recebe array de objetos mesmo para criação singular |
| `updateLead` | `PATCH /leads/{id}` | `update_lead`, `move_lead` | mover lead = `pipeline_id` + `status_id` no PATCH |
| `listContacts` | `GET /contacts` | `list_contacts` | `query` busca inclusive por valores de custom fields, útil para telefone |
| `getContact` | `GET /contacts/{id}` | `get_contact` | aceita `with` |
| `createContacts` | `POST /contacts` | `create_contact` | API recebe array de objetos |
| `updateContact` | `PATCH /contacts/{id}` | `update_contact` | payload de patch da entidade |

Fontes oficiais:
[Account parameters](https://developers.kommo.com/reference/account-parameters),
[Pipelines list](https://developers.kommo.com/reference/pipelines-list),
[Pipeline stages list](https://developers.kommo.com/reference/stages-list),
[Leads list](https://developers.kommo.com/reference/leads-list),
[Get a lead by ID](https://developers.kommo.com/reference/getting-a-lead-by-its-id),
[Add leads](https://developers.kommo.com/reference/adding-leads),
[Update a lead](https://developers.kommo.com/reference/updating-single-lead),
[Contacts list](https://developers.kommo.com/reference/contacts-list),
[Get a contact by ID](https://developers.kommo.com/reference/get-contact),
[Add contacts](https://developers.kommo.com/reference/add-contacts),
[Update a contact](https://developers.kommo.com/reference/update-contact).

## Filtros e `with` Importantes

Leads:

- `with`: `contacts`, `only_deleted`, `loss_reason`,
  `is_price_modified_by_robot`, `catalog_elements`, `source_id`, `source`.
- Filtros prioritários M1: `query`, `filter[pipeline_id][]`,
  `filter[statuses][0][pipeline_id]`, `filter[statuses][0][status_id]`,
  `filter[responsible_user_id][]`.
- Restrição documentada: `filter[statuses]` permite uma etapa por pipeline por
  request. Para várias etapas/pipelines, compor chamadas fora do serviço.

Contatos:

- `with`: `leads`, `catalog_elements`.
- `query` pode ser usado para encontrar contato por telefone ou outros valores
  preenchidos em campos da entidade.

Pipelines:

- Máximo documentado: 50 pipelines por conta.
- Cada pipeline pode ter até 100 etapas, incluindo etapas de sistema.

## Núcleo Futuro Já Mapeado

Estas operações fazem parte da cobertura funcional do PRD, mas ficam depois do
DoD mínimo de Conta + Pipelines + Leads + Contatos.

| Superfície | Operações oficiais mapeadas |
| --- | --- |
| Empresas | `GET /companies`, `POST /companies`, `GET /companies/{id}`, `PATCH /companies/{id}`, `PATCH /companies` |
| Tarefas | `GET /tasks`, `POST /tasks`, `GET /tasks/{id}`, `PATCH /tasks/{id}`, `PATCH /tasks` |
| Eventos | `GET /events`, `GET /events/{id}`, `GET /events/types`; no PRD, somente leitura |
| Notas | `GET/POST /{entity_type}/notes`, `GET/PATCH /{entity_type}/notes/{id}`, `POST /pin`, `POST /unpin` |
| Tags | `GET/POST /{entity_type}/tags`, `PATCH /{entity_type}/{id}`, `PATCH /{entity_type}` |
| Motivos de perda | `GET /leads/loss_reasons`, `GET /leads/loss_reasons/{id}` |

Fontes oficiais:
[Companies list](https://developers.kommo.com/reference/companies-list),
[Add companies](https://developers.kommo.com/reference/add-companies),
[Get a company by ID](https://developers.kommo.com/reference/get-company),
[Update a company](https://developers.kommo.com/reference/updating-company),
[Update companies](https://developers.kommo.com/reference/update-companies),
[Tasks List](https://developers.kommo.com/reference/tasks-list),
[Add tasks](https://developers.kommo.com/reference/add-tasks),
[Get a task by ID](https://developers.kommo.com/reference/task-id),
[Edit a single task](https://developers.kommo.com/reference/edit-task),
[Edit tasks](https://developers.kommo.com/reference/edit-tasks),
[Events list](https://developers.kommo.com/reference/events-list),
[Get an event by ID](https://developers.kommo.com/reference/get-event),
[Get events types](https://developers.kommo.com/reference/get-events-types),
[Notes list by entity type](https://developers.kommo.com/reference/notes-list-entity),
[Add notes](https://developers.kommo.com/reference/add-notes),
[Get a note by ID](https://developers.kommo.com/reference/note-by-id),
[Edit a note](https://developers.kommo.com/reference/edit-note),
[Pin a note](https://developers.kommo.com/reference/pin-note),
[Unpin a note](https://developers.kommo.com/reference/unpin-note),
[List of entity tags](https://developers.kommo.com/reference/list-of-entity-tags),
[Create tags](https://developers.kommo.com/reference/add-tags),
[Add tags to a single entity](https://developers.kommo.com/reference/update-tags-single-entity),
[Add tags to entities](https://developers.kommo.com/reference/update-tags),
[Loss reasons list](https://developers.kommo.com/reference/loss-reasons),
[Loss reason by ID](https://developers.kommo.com/reference/loss-reason-by-id).

## Superfícies Adiadas

| Superfície | Decisão |
| --- | --- |
| Custom Fields & Field Groups | Fase 2; esquemas complexos por entidade |
| Catálogos/Listas | Fase 2; útil após estabilizar CRM básico |
| Usuários & Papéis | Fase 2; necessário para UX rica de responsáveis |
| Fontes | Fase 2; depende de ownership da integração |
| Salesbot | Fase 2; ações automatizadas exigem salvaguardas explícitas |
| Chats API | Futuro; modelo operacional diferente do CRM REST básico |
| Files API | Futuro; upload/session/binary flow separado |
| Webhooks | Futuro; entrega inbound, fora do stdio local M1 |
| Widgets | Futuro; empacotamento de UI Kommo, não runtime MCP |
| Kommo AI API | Futuro; superfície de produto separada do CRM core |

## Regras Para Implementação

- Toda nova operação core deve primeiro ser adicionada ao
  `KOMMO_API_CONTRACT.operations`.
- Tools MCP devem derivar `readOnlyHint`, `idempotentHint`,
  `destructiveHint` e `openWorldHint` da semântica registrada no contrato.
- Caminhos com `{id}`, `{pipeline_id}` ou `{entity_type}` devem usar
  `renderKommoApiPath` para evitar concatenação manual.
- Paginação deve usar `KOMMO_API_CONTRACT.limits.maxPageLimit` como teto.
- Operações de criação singular que a Kommo documenta como array devem enviar
  array com um objeto e ler a entidade retornada de `_embedded.<entity>`.
- `move_lead` deve validar que o `status_id` pertence ao `pipeline_id` antes do
  PATCH; a fonte oficial para isso é `listPipelineStatuses` ou `listPipelines`
  com as etapas retornadas.
