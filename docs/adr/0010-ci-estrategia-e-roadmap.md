# ADR-0010: CI — pipeline mínima e roadmap de evolução

- **Status:** Accepted
- **Data:** 2026-06-19
- **Decisores:** David Fiocchi (Syntelix)
- **Relacionada a:** PRD §7 (testabilidade), §8 (marcos); ADR-0001 (TS/Node), ADR-0004 (monorepo pnpm); Spec 001 (bootstrap)

## Contexto

O monorepo já possui CI funcional (GitHub Actions) desde a Spec 001, que
estabeleceu o pipeline `install → typecheck → lint → test → build`. A questão
não é **se** devemos ter CI — já temos —, mas **qual é o escopo correto de CI
para cada fase do produto** e **quando evoluir**.

Há uma tensão comum em projetos open source incipientes: investir cedo demais em
infraestrutura de CI sofisticada (matrix de versões, coverage enforcement,
security scanning, deploy preview) consome tempo que deveria ir para o produto,
e produz complexidade operacional sem retorno proporcional. Por outro lado,
postergar CI demais resulta em regressões que custam mais para consertar.

### Estado atual do projeto (pré-M1)

- Três pacotes no monorepo: `core` (domínio, ~60 KB de source), `cli` (MCP
  stdio, ~26 KB), `server` (skeleton, ~400 B — Fase 2).
- 15 arquivos de teste distribuídos em `core` (9) e `cli` (5) e `server` (1).
- Node fixado em 22 (`.nvmrc`); pnpm fixado via `packageManager` (Corepack).
- CI roda em `ubuntu-latest`, trigado por PR e push em `main`.
- Não há publicação npm, Docker, deploy, ou contribuidores externos ativos.

O PRD §7 exige "testabilidade: o que for entregue deve ter caminho de teste" —
mas não prescreve um nível específico de sofisticação de CI. A Spec 001 definiu
o pipeline mínimo como critério de aceite e esse pipeline já está verde.

## Alternativas consideradas

1. **Pipeline mínima sequencial (5 passos, job único)**
   - `pnpm install --frozen-lockfile` → `pnpm typecheck` → `pnpm lint` →
     `pnpm test` → `pnpm build`.
   - **Prós:** trivial de manter; execução em 1-2 min; nenhuma config de cache
     ou orquestração; cobre todas as garantias essenciais (deps íntegras, tipos,
     estilo, regressões, compilação).
   - **Contras:** sem paralelismo; sem visibilidade de cobertura; sem scanning.

2. **Jobs paralelos (typecheck | lint | test | build)**
   - Cada verificação num job separado, rodando em paralelo.
   - **Prós:** falha mais rápida em cada dimensão; badge granular por check.
   - **Contras:** 4× overhead de checkout + install + setup Node; com 3 pacotes
     o tempo total *aumenta*, não diminui (~40s de overhead × 4 jobs > ganho de
     paralelismo); complexidade de manutenção desproporcional.

3. **Pipeline completa prematura** (matrix de Node, coverage gates, Dependabot,
   CodeQL, Docker build, deploy preview)
   - **Prós:** postura de segurança e qualidade de projeto maduro.
   - **Contras:** o repo tem ~3 deps de produção; não publica npm nem Docker; não
     tem contribuidores externos; cada item é overhead operacional (PRs de
     Dependabot, falhas de CodeQL a triar, threshold de coverage a negociar) sem
     usuário real que se beneficie. Viola o princípio de investir tempo no
     produto, não na infraestrutura, antes de entregar o M1.

## Decisão

Adotamos a **alternativa 1 — pipeline mínima sequencial** — como o CI do
projeto até o M1, com evolução faseada acompanhando os marcos do PRD.

### Pipeline mínima (vigente)

```
pnpm install --frozen-lockfile
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```

Num único job `verify`, em `ubuntu-latest`, trigado por `pull_request` e `push`
em `main`. Usa `actions/setup-node` com `.nvmrc` e Corepack habilitado.

### O que essa pipeline protege

| Garantia | Passo |
|----------|-------|
| Lockfile íntegro, sem phantom deps | `install --frozen-lockfile` |
| Tipos corretos (strict mode, ADR-0001) | `typecheck` (`tsc -p tsconfig.typecheck.json` por pacote) |
| Estilo consistente (ESLint + Prettier) | `lint` (inclui `prettier --check`) |
| Regressões funcionais | `test` (Vitest, 15 test files) |
| Pacotes compilam e fronteiras do workspace estão corretas | `build` (`tsc -b` com project references) |

### Roadmap de evolução do CI

A CI evolui **junto com o produto**, não antes dele. Cada adição é justificada
por uma mudança concreta no perfil do projeto:

| Gatilho (marco do PRD) | O que adicionar ao CI | Justificativa |
|------------------------|----------------------|---------------|
| **Specs 005-007 entregues** (DoD do M1 atingido) | Report de cobertura sem enforcement (ex.: `vitest --coverage` + upload para Codecov/Coveralls) | Visibilidade sobre a saúde dos testes; sem threshold para não bloquear PRs. |
| **M2 — publicação npm** (`npx`) | `pnpm pack --dry-run` no CI para validar artefato publicável | Garante que `files`, `exports` e `bin` estão corretos antes de publicar. |
| **M2 — abertura para contribuidores** | Dependabot (security updates only, auto-merge para patches) | Deps expostas a terceiros precisam de atualizações de segurança automatizadas. |
| **M3 — server HTTP** (Streamable HTTP) | Docker build + smoke test do container; cache do pnpm store | Server real em container justifica validar o build; install fica mais pesado com deps de HTTP, justifica cache. |
| **M3 — deploy em VPS** | Lint de Dockerfile; validação de `pnpm deploy --filter server` | Garante que o artefato de deploy está podado e funcional. |
| **M4 — OAuth** | Secrets scanning (ex.: `trufflehog` ou `gitleaks`) | Código de auth aumenta o risco de secret leak acidental. |
| **M5+ — managed multi-tenant** | Matrix de OS (ubuntu/windows/macos); E2E com ambiente de staging; CodeQL | Produto maduro, base de usuários, superfície de ataque real. |

### O que explicitamente **não** fazemos agora e por quê

- **Matrix de Node versions:** `.nvmrc` fixa Node 22; ADR-0002 define runtime
  único. Testar contra outras versões não entrega valor.
- **Coverage enforcement:** sem massa de testes suficiente para um threshold
  significativo; criaria falsos bloqueios.
- **Security scanning (CodeQL, Dependabot):** 3 deps de produção, sem
  contribuidores externos, sem publicação. Overhead > retorno.
- **Cache do pnpm store:** install leva ~15s. Cache economiza ~10s às custas de
  complexidade de chave. Não vale até o install passar de 30s+.

## Consequências

- **Positivas:** CI que protege o essencial sem overhead; tempo de manutenção
  próximo de zero; pipeline rápida (~1-2 min); decisão documentada sobre
  **quando** evoluir, evitando discussões recorrentes de "deveríamos adicionar
  X ao CI?".
- **Negativas / custos:** sem visibilidade de cobertura até pós-DoD do M1; sem
  scanning de segurança automatizado até M2+; possível percepção de "CI
  incompleto" por contribuidores vindos de projetos maiores.
- **Follow-ups:**
  - Ao atingir o DoD do M1, adicionar report de cobertura (sem enforcement).
  - Ao iniciar M2 (npx), adicionar validação de artefato npm e Dependabot.
  - Ao iniciar M3 (server HTTP), adicionar Docker build e cache do pnpm store.
