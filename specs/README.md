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

| Spec | Épico | Título | Status |
|------|-------|--------|--------|
| _—_ | _—_ | _nenhuma spec ainda_ | _—_ |
