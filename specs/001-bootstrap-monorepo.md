# Spec 001: Bootstrap do monorepo

- **Épico:** E1 — Core MCP + CRM núcleo (M1)
- **Status:** Done
- **Relacionada a:** PRD §7; ADR-0001, ADR-0004
- **Estimativa:** M

## Objetivo

Estabelecer o esqueleto do monorepo pnpm com os três pacotes (`core`, `cli`,
`server`), TypeScript, lint/format, runner de testes e CI mínima — a fundação sobre
a qual todas as demais specs do M1 são construídas.

## Não-objetivos

- Implementar qualquer tool MCP ou chamada ao Kommo (specs 002+).
- Configurar o cofre do SO ou wizard (Fase 2).
- Empacotamento em binário SEA (follow-up do ADR-0001).
- Publicação no npm.

## Contexto técnico

- **ADR-0004:** monorepo **pnpm workspaces**; pacotes `packages/core`,
  `packages/cli`, `packages/server`; campo `packageManager` no `package.json` raiz
  (ativável por Corepack).
- **ADR-0001:** TypeScript sobre Node.js; fixar versão do Node via `.nvmrc`
  (já existe no repo).
- `core` não depende de `cli`/`server`; `cli` e `server` dependem de `core` via
  protocolo `workspace:*`.
- Fronteiras (ADR-0004): `core` = domínio/cliente Kommo + tools; `cli` = entry
  self-host (stdio); `server` = HTTP/Streamable (Fase 2, só o skeleton aqui).

## Tarefas

- [x] `pnpm-workspace.yaml` + `package.json` raiz com `packageManager` e scripts
      agregados (`build`, `lint`, `test`, `typecheck`).
- [x] Criar `packages/core`, `packages/cli`, `packages/server` com `package.json` e
      `tsconfig` próprios; `cli`/`server` referenciam `core` via `workspace:*`.
- [x] `tsconfig` base compartilhado (strict mode ligado) + por-pacote.
- [x] Lint + format (config única na raiz) e um runner de testes configurado.
- [x] CI (GitHub Actions) rodando `install → typecheck → lint → test → build` com
      Corepack/pnpm.
- [x] Atualizar `CONTRIBUTING.md` com o passo `corepack enable` + comandos pnpm.
- [x] Garantir `.gitignore` cobrindo artefatos de build e segredos (`.env`).

## Critérios de aceite (testáveis)

- [x] `pnpm install` na raiz resolve os três pacotes sem erro.
- [x] `pnpm -r build` compila os três pacotes; `pnpm -r typecheck` passa em strict.
- [x] `pnpm lint` e `pnpm test` rodam (mesmo com suíte mínima/placeholder) e passam.
- [x] `cli` e `server` conseguem importar um símbolo exportado por `core`
      (valida o `workspace:*`).
- [x] O pipeline de CI roda verde em um PR.
- [x] CONTRIBUTING documenta Corepack/pnpm e os scripts.

## Fora de escopo / riscos

- A escolha definitiva de ferramentas de lint/test fica a critério desta spec
  (não há ADR que as fixe); manter padrão e simplicidade.
- Ressalva de bundler/SEA no Windows (ADR-0004) **não** é tratada aqui — só quando
  houver follow-up de binário.
