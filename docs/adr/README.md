# Architecture Decision Records (ADRs)

Registramos aqui cada decisão de arquitetura significativa, no formato proposto
por Michael Nygard ([Documenting Architecture Decisions](https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions), 2011).

## Por que ADRs

- Tornam explícito **o contexto** e **as alternativas** de cada escolha técnica.
- São **imutáveis**: uma decisão aceita não é editada; se mudar, cria-se uma nova
  ADR que **substitui** a anterior. Assim o histórico de raciocínio é preservado.
- Servem de insumo direto para as **specs** (uma decisão arquitetural costuma
  gerar uma ou mais specs de implementação).

## Convenções

- Arquivo: `NNNN-titulo-em-kebab-case.md` (ex.: `0002-runtime-e-hospedagem.md`).
- Numeração sequencial, com zero à esquerda (4 dígitos).
- Use o [`0000-template.md`](./0000-template.md) como ponto de partida.
- **Status** de uma ADR: `Proposed` → `Accepted` → (`Superseded by ADR-XXXX` |
  `Deprecated`).
- Para substituir uma decisão: crie uma nova ADR, marque a antiga como
  `Superseded by ADR-XXXX` e referencie a antiga na nova (`Supersedes ADR-YYYY`).

## Índice

| ADR | Título | Status |
|-----|--------|--------|
| [0001](./0001-linguagem-e-runtime.md) | Linguagem & runtime — TypeScript sobre Node.js | Accepted |
| [0002](./0002-topologia-de-execucao.md) | Topologia de execução — "Node único" | Accepted |
| [0003](./0003-transporte-e-sdk-mcp.md) | Transporte & SDK MCP — SDK oficial com stdio + Streamable HTTP | Accepted |
| [0004](./0004-estrutura-do-repositorio.md) | Estrutura do repositório — monorepo pnpm (core / cli / server) | Accepted |
| [0005](./0005-porta-e-configuracao.md) | Porta padrão & configuração do servidor web | Accepted |
| [0006](./0006-reverse-proxy-e-https.md) | Reverse proxy & HTTPS — Caddy provisionado pelo wizard + BYO | Accepted |
| [0007](./0007-autenticacao-camada-remota.md) | Autenticação da camada remota — bearer obrigatório; OAuth só no managed | Accepted |
| [0008](./0008-armazenamento-seguro-do-token.md) | Armazenamento seguro do token no self-host | Accepted |
| [0009](./0009-licenca-e-sustentabilidade.md) | Licença & sustentabilidade — MIT | Accepted |

> Atualize esta tabela a cada nova ADR.
