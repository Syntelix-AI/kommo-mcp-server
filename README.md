# Kommo MCP Server

Um servidor [Model Context Protocol (MCP)](https://modelcontextprotocol.io) para
o CRM [Kommo](https://www.kommo.com) — permite que assistentes de IA (Claude,
ChatGPT, Codex, Cursor e outros clientes MCP) leiam e operem dados do Kommo de
forma segura e padronizada.

> **Status:** projeto em fase de definição. A arquitetura e o escopo estão sendo
> formalizados via PRD e ADRs antes da implementação. Veja
> [`docs/`](./docs/).

## Formatos de distribuição (planejados)

1. **Self-hosted** — instalação local via `npx`, com wizard de setup e integração
   direta ao Claude Code, Codex, Cursor etc.
2. **Web / VPS** — servidor com HTTPS e domínio próprio, para uso via web
   (ChatGPT, Claude, etc.), com suporte a reverse proxy existente.
3. **Widget do Kommo** — _futuro_: onboarding/conexão direto do marketplace.
4. **Managed (Syntelix)** — _futuro_: hospedagem gerenciada de baixo custo.

## Documentação de projeto

- [PRD](./docs/PRD.md) — visão, escopo e requisitos do produto.
- [ADRs](./docs/adr/) — decisões de arquitetura.
- [Specs](./specs/) — unidades de implementação.
- [Como contribuir](./CONTRIBUTING.md)

## Licença

[MIT](./LICENSE) © Syntelix AI
