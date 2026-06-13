# Documentação — Kommo MCP Server

Esta pasta concentra a documentação **de projeto** (o "porquê" e o "o quê"),
separada da documentação de uso/instalação (que vive no `README.md` da raiz e,
futuramente, em `docs/usage/`).

O projeto segue um fluxo de desenvolvimento agêntico em três camadas:

```
PRD  ──►  ADRs  ──►  Specs  ──►  código (PRs)
(o quê)   (como,      (unidade     (1 spec ≈
          decisões)   executável)   1 PR)
```

## Mapa

| Caminho | O que é | Estado |
|---------|---------|--------|
| [`PRD.md`](./PRD.md) | **Product Requirements Document.** Visão, problema, personas, escopo, formatos de distribuição, métricas de sucesso e não-objetivos. Documento vivo. | _a definir_ |
| [`adr/`](./adr/) | **Architecture Decision Records.** Decisões arquiteturais imutáveis (linguagem, runtime, transporte, auth, hospedagem…). Append-only. | _a definir_ |
| [`../specs/`](../specs/) | **Specs.** Cada spec é uma unidade de trabalho executável por um agente, com objetivos, não-objetivos e critérios de aceite testáveis. | _a definir_ |
| [`architecture/`](./architecture/) | Diagramas (Mermaid), notas de arquitetura de apoio aos ADRs. | _a definir_ |

## Ordem de leitura recomendada

1. **PRD** — entenda o produto e o escopo antes de qualquer decisão técnica.
2. **ADRs** — entenda *como* e *por que* as escolhas técnicas foram feitas.
3. **Specs** — pegue uma spec e implemente; cada uma vira (idealmente) um PR.

## Regras

- **PRD**: vivo e versionado. Mudou o produto, atualiza-se o PRD no mesmo PR.
- **ADR**: imutável. Não se edita uma decisão aceita — cria-se uma nova ADR que
  a **substitui** (`Superseded by ADR-XXXX`).
- **Spec**: versionada. Uma spec sem critério de aceite testável não está pronta
  para ser implementada.
- **Segredos**: nunca entram em nenhum desses documentos nem no repositório.
