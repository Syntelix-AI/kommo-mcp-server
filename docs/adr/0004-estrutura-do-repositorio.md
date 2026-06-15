# ADR-0004: Estrutura do repositório — monorepo pnpm (core / cli / server)

- **Status:** Accepted
- **Data:** 2026-06-13
- **Decisores:** David Fiocchi (Syntelix)
- **Relacionada a:** PRD §5.1, §9 (4º item); ADR-0001 (TS/Node); ADR-0002 (Node único); ADR-0003 (transporte)

## Contexto

O layout de código foi deliberadamente deixado fora da estrutura inicial do repo
para ser decidido aqui. O produto é **um só núcleo** com **três consumidores
distintos** do mesmo código (PRD §5.1):

- **self-host** → entry `npx` (wizard, cofre do SO, transporte stdio);
- **web/VPS** → app HTTP/Streamable (auth, validação de `Origin`, reverse proxy);
- **managed** (futuro) → reusa núcleo + server.

Esses consumidores compartilham a lógica de domínio (cliente HTTP do Kommo +
definições das tools MCP), mas têm **dependências e alvos de publicação
diferentes**: a CLI é publicada no npm (para `npx`), o server pode virar imagem
Docker, e o core é uma biblioteca importável.

Duas perguntas acopladas: **(A)** como organizar o código; **(B)** qual
gerenciador de pacotes.

## Alternativas consideradas

### A — Organização

1. **Monorepo com workspaces** — pacotes `core`, `cli`, `server`.
   - **Prós:** fronteiras já nítidas; deps e alvos de publicação distintos por
     pacote; mudanças atômicas num repo único; core importável isolado.
   - **Contras:** tooling de workspaces (orquestração de build, versionamento).

2. **Pacote único** — pastas em vez de pacotes.
   - **Prós:** mais simples para começar.
   - **Contras:** publicar CLI vs. server isoladamente fica torto; fronteiras
     borram; refatorar para workspaces depois, com código entrelaçado, custa mais
     do que já nascer dividido.

3. **Polyrepo** — repositórios separados.
   - **Contras:** coordenação entre repos; contraria o "um só núcleo".

### B — Gerenciador de pacotes

1. **pnpm** — `node_modules` não-flat (store content-addressable + symlinks).
   - **Prós:** workspaces de primeira classe (`--filter`, `workspace:*`);
     **resolução estrita** que elimina "phantom dependencies" — pega justamente o
     bug que dói ao publicar `cli`/`server` isolados; store global com hard links
     (rápido, pouco disco); `pnpm deploy --filter server` gera artefato podado
     para Docker.
   - **Contras:** exige um passo de Corepack para contribuidores; ressalva menor e
     futura com bundlers antigos sobre `node_modules` simbólico (relevante só no
     follow-up de binário SEA, contornável pelo bundler).

2. **npm** — `node_modules` flat/hoisted.
   - **Prós:** já vem com o Node — atrito zero para contribuidores.
   - **Contras:** workspaces básicos; resolução permissiva (phantom deps viram bug
     silencioso no monorepo); duplica dependências; sem equivalente direto ao
     `pnpm deploy` para a imagem do server.

## Decisão

**(A)** Adotamos **monorepo com workspaces**, com três pacotes:

- **`core`** — cliente HTTP do Kommo + definições das tools MCP + domínio. Sem
  transporte e sem preocupações de processo. Reusável por todos.
- **`cli`** — entry self-host do `npx`: wizard, integração com o cofre do SO
  (Keychain/Credential Manager/libsecret), fiação do transporte stdio, escrita da
  config do cliente MCP.
- **`server`** — app HTTP/Streamable HTTP para VPS/managed: auth, validação de
  `Origin`, compatibilidade com reverse proxy.

As fronteiras já estão nítidas e os alvos de publicação genuinamente divergem;
nascer dividido custa menos do que separar depois.

**(B)** Fixamos **pnpm** como gerenciador. Para este projeto — pacotes publicáveis
independentes, server em Docker, CI — os ganhos de **resolução estrita de
dependências**, **ergonomia de workspace** e **`pnpm deploy`** superam o único
custo real (o passo de Corepack para contribuidores), que é mitigável e
documentável. A versão é fixada via campo `packageManager` no `package.json`
(ativada por Corepack).

## Consequências

- **Positivas:** fronteiras de código explícitas e publicáveis isoladamente;
  dependências estritas que evitam bugs de phantom dependency; instalação rápida e
  enxuta em disco/CI; caminho limpo para a imagem Docker do server via
  `pnpm deploy`.
- **Negativas / custos:** orquestração de workspaces a configurar; contribuidores
  precisam de `corepack enable` (documentar no CONTRIBUTING); ressalva futura de
  bundler/SEA no Windows com `node_modules` simbólico, a tratar no follow-up.
- **Follow-ups:**
  - Spec de bootstrap do monorepo: configurar pnpm workspaces, `packageManager`,
    scripts de build/test por pacote e CI.
  - Atualizar o CONTRIBUTING com o passo de Corepack/pnpm.
  - Quando chegar o follow-up de binário SEA (ADR-0001), validar o bundler contra
    o `node_modules` do pnpm no Windows.
