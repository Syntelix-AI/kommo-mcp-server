# Spec 006: Tools — Contatos (CRUD)

- **Épico:** E1 — Core MCP + CRM núcleo (M1)
- **Status:** Implemented
- **Relacionada a:** PRD §5.2 (núcleo), §5.3; ADR-0003
- **Estimativa:** M

## Objetivo

Entregar as tools de Contatos — listar/filtrar, obter, criar e atualizar —
completando, com as specs 004 e 005, o DoD mínimo do M1.

## Não-objetivos

- Empresas (spec 008) e vínculo em massa contato↔lead↔empresa.
- Custom fields complexos (Fase 2).
- Exclusão de contatos (fora do núcleo do M1).

## Contexto técnico

- **Endpoints Kommo:** `GET /api/v4/contacts` (com `page`, `limit`, `filter`,
  `with`), `GET /api/v4/contacts/{id}`, `POST /api/v4/contacts`,
  `PATCH /api/v4/contacts/{id}`.
- **Anotações (ADR-0003):** `list_contacts`/`get_contact` → `readOnlyHint: true`;
  `create_contact` → escrita não idempotente; `update_contact` →
  `idempotentHint: true`; todas `openWorldHint: true`.
- Campos comuns: nome, telefone/email (custom fields padrão), responsável. Vínculo
  básico a um lead pode ser exposto se trivial; vínculo em massa fica fora.
- Reusa `core` (spec 002) e o framework de tools (spec 003).

## Tarefas

- [x] `list_contacts` — filtros (query, paginação); resultado enxuto (id, nome,
  telefone/email principais, responsável).
- [x] `get_contact` — detalhe por id.
- [x] `create_contact` — cria com campos básicos; retorna id.
- [x] `update_contact` — atualiza campos básicos por id.
- [x] Anotações e `inputSchema` corretos.
- [x] Testes com Kommo mockado: cada operação + erro 422 → `isError`.

## Critérios de aceite (testáveis)

- [x] `list_contacts` pagina/filtra e retorna a forma enxuta esperada.
- [x] `create_contact` cria e retorna id; aparece num `get_contact` subsequente.
- [x] `update_contact` altera um campo e reflete a mudança.
- [x] Anotações corretas em `tools/list`.
- [ ] Validado em cliente MCP real: a IA cria e edita um contato por instrução em
  linguagem natural. _(pendente — critério delegado à spec 007: smoke E2E)_

## Fora de escopo / riscos

- Telefone/email no Kommo vivem em custom fields padrão com estrutura própria;
  expor uma forma simples e estável, escondendo a complexidade do payload.
