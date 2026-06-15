# Specs

Uma **spec** descreve uma unidade de trabalho pequena e fechada, pensada para ser
implementada em **uma sessão de agente** e virar, idealmente, **um único PR**.

## Princípios

- **1 spec ≈ 1 sessão de agente ≈ 1 PR.** Se não cabe, quebre em mais specs.
- Toda spec tem **não-objetivos** explícitos (o que ela deliberadamente *não* faz).
- Toda spec tem **critérios de aceite testáveis** — sem isso, não está pronta
  para implementar.
- Specs derivam do **PRD** (o quê) e respeitam os **ADRs** (como). Se uma spec
  exige contrariar um ADR, primeiro abre-se uma nova ADR.

## Convenções

- Arquivo: `NNN-titulo-em-kebab-case.md` (ex.: `001-cli-setup-wizard.md`).
- Specs podem ser agrupadas em **épicos** (um épico entrega uma capacidade do PRD;
  costuma virar uma Issue "guarda-chuva" no GitHub com checklist de specs).
- Use o [`000-template.md`](./000-template.md) como ponto de partida.

## Índice

**Épicos:** [E1 — Core MCP + CRM núcleo (M1)](./E1-core-mcp-crm-nucleo.md)

| Spec | Épico | Título | Status |
|------|-------|--------|--------|
| [001](./001-bootstrap-monorepo.md) | E1 | Bootstrap do monorepo | Draft |
| [002](./002-cliente-http-kommo.md) | E1 | Cliente HTTP do Kommo (core) | Draft |
| [003](./003-servidor-mcp-base-stdio.md) | E1 | Servidor MCP base + stdio + conformidade | Draft |
| [004](./004-tools-conta-pipelines.md) | E1 | Tools — Conta & Pipelines (somente leitura) | Draft |
| [005](./005-tools-leads.md) | E1 | Tools — Leads (CRUD + mover etapa/pipeline) | Draft |
| [006](./006-tools-contatos.md) | E1 | Tools — Contatos (CRUD) | Draft |
| [007](./007-self-host-stdio-integracao.md) | E1 | Self-host stdio executável + integração de cliente | Draft |
