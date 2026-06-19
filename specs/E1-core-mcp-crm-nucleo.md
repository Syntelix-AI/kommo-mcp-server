# Épico E1 — Core MCP + CRM núcleo (M1)

- **Status:** In progress
- **Capacidade do PRD:** §8 (M1) — "Core MCP + tools de CRM núcleo, em conformidade
  com a spec". **DoD mínimo do M1:** Conta + Leads (CRUD/mover) + Contatos +
  Pipelines (listar). Resultado observável: o usuário roda local e a IA opera o
  Kommo via **stdio**.
- **PRD relacionado:** §3.1 (obj. 1, 4), §5.2 (núcleo), §5.3 (conformidade MCP), §7.

## ADRs que restringem este épico

- **ADR-0001** — TypeScript sobre Node.js.
- **ADR-0002** — Node único (mesmo runtime; sem Workers).
- **ADR-0003** — `@modelcontextprotocol/sdk` oficial; **transporte stdio** no M1.
- **ADR-0004** — monorepo pnpm (`core` / `cli` / `server`).
- **ADR-0008** — token: no M1 stdio o segredo chega por **variável de ambiente**
  (cofre do SO/wizard são da Fase 2).

## Specs (checklist)

Caminho do DoD mínimo (este épico):

- [x] **Spec 001** — Bootstrap do monorepo (pnpm, TS, lint, test, CI, skeletons)
- [x] **Spec 002** — Cliente HTTP do Kommo (`core`): auth por token, paginação, erros
- [x] **Spec 003** — Servidor MCP base + stdio + conformidade (capabilities, erros, anotações)
- [x] **Spec 004** — Tools: Conta & Pipelines (somente leitura)
- [ ] **Spec 005** — Tools: Leads (listar/obter/criar/atualizar/mover etapa e pipeline)
- [ ] **Spec 006** — Tools: Contatos (listar/obter/criar/atualizar)
- [ ] **Spec 007** — Self-host stdio executável + integração de cliente (fecha o DoD)

Restante do núcleo da Fase 1 (PRD §5.2 — ainda no M1, **após** o DoD; specs a
detalhar quando o caminho abrir, seguindo o padrão das specs 004-006):

- [ ] Spec 008 — Tools: Empresas (CRUD)
- [ ] Spec 009 — Tools: Tarefas (CRUD)
- [ ] Spec 010 — Tools: Eventos (somente leitura — feed de auditoria)
- [ ] Spec 011 — Tools: Notas (CRUD + fixar/desafixar)
- [ ] Spec 012 — Tools: Tags
- [ ] Spec 013 — Tools: Motivos de perda

## Definição de pronto (épico)

Com o servidor configurado em um cliente MCP local (ex.: Claude Desktop) via stdio,
a IA consegue: ler dados da conta; listar pipelines e etapas; listar/criar/atualizar
leads e **mover um lead de etapa/pipeline**; e listar/criar/atualizar contatos —
tudo em conformidade com a spec MCP (capabilities, anotações de tool e semântica de
erro corretas). As demais tools do núcleo (008-013) podem seguir após o DoD sem
bloquear o marco.
