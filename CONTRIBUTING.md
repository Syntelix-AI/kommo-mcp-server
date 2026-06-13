# Contribuindo

Obrigado pelo interesse em contribuir com o **Kommo MCP Server**.

Este projeto usa um fluxo de desenvolvimento orientado a documentos:

```
PRD  ──►  ADRs  ──►  Specs  ──►  PRs
```

- **PRD** ([`docs/PRD.md`](./docs/PRD.md)) — o que o produto é e qual o escopo.
- **ADRs** ([`docs/adr/`](./docs/adr/)) — as decisões de arquitetura.
- **Specs** ([`specs/`](./specs/)) — unidades de trabalho (≈ 1 PR cada).

## Como contribuir

1. Pegue (ou proponha) uma **spec** em `specs/`. Se não existe, abra uma issue
   usando o template de Spec antes de codar.
2. Confirme que a mudança **não contraria nenhum ADR aceito**. Se contrariar,
   abra primeiro uma nova ADR (`Proposed`) discutindo a mudança.
3. Crie uma branch a partir de `main`: `feat/<spec-nnn-slug>` ou `fix/<slug>`.
4. Implemente respeitando os **objetivos e não-objetivos** da spec.
5. Abra um PR usando o template. Referencie a spec/ADR/issue.

## Convenções

- **Commits:** [Conventional Commits](https://www.conventionalcommits.org/)
  (`feat:`, `fix:`, `docs:`, `refactor:`, `chore:`, `test:`).
- **Branches:** `feat/…`, `fix/…`, `docs/…`, `chore/…`.
- **Segredos:** nunca commitar `.env`, tokens ou API keys. Use `.env.example`.

> Scripts de build/lint/test serão definidos pelas primeiras specs de
> infraestrutura. Até lá, este documento descreve o **processo**, não promete
> ferramentas que ainda não existem.
