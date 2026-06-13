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
| _—_ | _nenhuma ADR aceita ainda_ | _—_ |

> Atualize esta tabela a cada nova ADR.
