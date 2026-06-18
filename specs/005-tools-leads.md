# Spec 005: Tools — Leads (CRUD + mover etapa/pipeline)

- **Épico:** E1 — Core MCP + CRM núcleo (M1)
- **Status:** In progress
- **Relacionada a:** PRD §5.2 (núcleo), §5.3; ADR-0003
- **Estimativa:** L

## Objetivo

Entregar o coração do M1: as tools de Leads — listar/filtrar, obter, criar,
atualizar e **mover de etapa e pipeline**. É a capacidade central que dá valor
conversacional ao produto.

## Não-objetivos

- Custom fields complexos (Fase 2 — PRD §5.2 "próximo").
- Vincular contatos/empresas em massa (vínculo básico pode entrar; massa não).
- Excluir leads (não previsto no núcleo do M1; evitar operação destrutiva pesada
  nesta fase).

## Contexto técnico

- **Endpoints Kommo:** `GET /api/v4/leads` (com `page`, `limit`, `filter`, `with`),
  `GET /api/v4/leads/{id}`, `POST /api/v4/leads`, `PATCH /api/v4/leads/{id}`.
  **Mover** = `PATCH` no lead com `status_id` (etapa) e `pipeline_id`.
- **Anotações (ADR-0003):**
  - `list_leads`, `get_lead` → `readOnlyHint: true`.
  - `create_lead` → escrita, não idempotente (`destructiveHint: false`).
  - `update_lead`, `move_lead` → `idempotentHint: true` (PATCH com mesmo alvo é
    idempotente); `destructiveHint: false`.
  - Todas `openWorldHint: true`.
- `move_lead` deve validar `status_id`/`pipeline_id` coerentes (usar `list_pipelines`
  da spec 004 como referência) e dar erro claro se a etapa não pertence ao pipeline.
- Reusa paginação e mapeamento de erro do `core` (spec 002).

## Tarefas

- [x] `list_leads` — filtros úteis (query, pipeline/status, paginação); resultado
  enxuto (id, nome, preço, status/pipeline, responsável).
- [x] `get_lead` — detalhe de um lead por id (com `with` relevante).
- [x] `create_lead` — cria com campos básicos (nome, preço, pipeline/status,
  responsável); retorna o id criado.
- [x] `update_lead` — atualiza campos básicos por id.
- [x] `move_lead` — move etapa/pipeline com validação de coerência etapa↔pipeline.
- [x] Anotações corretas por tool; `inputSchema` validado.
- [x] Testes com Kommo mockado: cada operação, erro 422 de validação → `isError`,
  e o caso de etapa incompatível em `move_lead`.

## Critérios de aceite (testáveis)

- [x] `list_leads` pagina e filtra; retorna a forma enxuta esperada.
- [x] `create_lead` cria e retorna o id; o lead aparece num `get_lead` subsequente
  (no mock/sandbox).
- [x] `update_lead` altera um campo e o resultado reflete a mudança.
- [x] `move_lead` move o lead para outra etapa **e** outro pipeline com sucesso.
- [x] `move_lead` com etapa que não pertence ao pipeline retorna `isError` com
  mensagem explicativa (não tenta a chamada inválida).
- [x] Anotações por tool corretas em `tools/list`.
- [ ] Validado em cliente MCP real: a IA cria um lead e o move de etapa por
  instrução em linguagem natural.

## Fora de escopo / riscos

- A semântica de mover entre pipelines no Kommo exige `status_id` válido do pipeline
  destino — a validação de coerência é parte do aceite e não pode ser pulada.
- Exclusão e operações em massa ficam fora; se surgir necessidade, nova spec.
