# ADR-0001: Linguagem & runtime — TypeScript sobre Node.js

- **Status:** Accepted
- **Data:** 2026-06-13
- **Decisores:** David Fiocchi (Syntelix)
- **Relacionada a:** PRD §5.1, §9 (1º item); ADR-0002 (topologia), ADR-0003 (transporte & SDK)

## Contexto

O Kommo MCP Server precisa de uma linguagem e runtime que sirvam ao mesmo
núcleo em três formatos (PRD §5.1): self-host instalável, Web/VPS e, futuramente,
managed. O alvo mais exigente é o **self-host para usuário não-técnico**, com a
meta de "zero ao primeiro `tools/call` em < 5 min" (PRD §3.2). Isso pressiona por
uma distribuição de baixíssima fricção e multiplataforma (Windows/macOS/Linux).

Há também o histórico: o repositório anterior (`cafesemcafeina/kommo-mcp`) era
TypeScript, e a equipe tem fluência no ecossistema Node.

A questão real não é "qual linguagem a equipe gosta", e sim **qual runtime melhor
equilibra fricção de distribuição × maturidade do SDK MCP × velocidade de
iteração** para um projeto open source mantido por uma equipe pequena.

## Alternativas consideradas

1. **TypeScript / Node.js** — runtime JS no servidor.
   - **Prós:** SDK MCP oficial (`@modelcontextprotocol/sdk`) é TS-first e o mais
     maduro; `npx` é o caminho de distribuição mais suave que existe para um CLI
     multiplataforma; ecossistema enorme; alta velocidade de iteração; continuidade
     com o repo anterior (em TS).
   - **Contras:** exige Node instalado na máquina do usuário; modelo single-thread;
     peso de `node_modules`.

2. **Python** — runtime Python no servidor.
   - **Prós:** SDK MCP oficial também existe; linguagem popular no mundo de IA.
   - **Contras:** distribuição para usuário não-técnico é pior (venv/pip,
     especialmente no Windows); não há equivalente tão limpo ao `npx` para o
     wizard de setup.

3. **Go / Rust** — compilar para binário nativo.
   - **Prós:** **binário único** elimina a necessidade de runtime na máquina do
     usuário — encaixa muito bem no objetivo de adoção sem fricção; performance
     superior.
   - **Contras:** SDK MCP menos maduro nessas linguagens; menor velocidade de
     iteração para uma equipe pequena; rompe a continuidade com o repo anterior.

## Decisão

Adotamos **TypeScript sobre Node.js**.

A alternativa que de fato tensionava a escolha era **Go/Rust**, pelo binário
único: tecnicamente seria *melhor* para o objetivo de instalação sem fricção, já
que o usuário não precisaria ter um runtime instalado. Aceitamos conscientemente
**trocar essa vantagem de distribuição** pela combinação de **SDK MCP oficial
maduro + velocidade de desenvolvimento + distribuição via `npx`**, que reduz o
custo de construir e manter o produto com uma equipe pequena e acelera o caminho
até o M1/M2.

A dependência de "ter Node instalado" é mitigada pelo wizard `npx` (PRD §5.1) e,
quando a fricção de distribuição se tornar essencial, pela opção de empacotar um
**binário único via Node SEA (Single Executable Application)** — tratada como
**follow-up futuro**, não como requisito desta decisão nem do M2.

## Consequências

- **Positivas:** acesso direto ao SDK MCP oficial e ao seu ritmo de evolução;
  distribuição self-host via `npx` sem etapas extras; iteração rápida; reuso de
  conhecimento e parte do aprendizado do repo anterior.
- **Negativas / custos:** o usuário precisa de um runtime Node disponível;
  assumimos as limitações de concorrência do modelo single-thread e o peso de
  dependências; performance bruta inferior a um binário nativo.
- **Follow-ups:**
  - ADR-0003 decide a adoção (ou não) do `@modelcontextprotocol/sdk` e o
    transporte.
  - ADR-0004 decide a estrutura do repositório (monorepo core/cli/server).
  - Spec futura (fase self-host): avaliar empacotamento em binário único via
    Node SEA, caso a fricção de "exigir Node" se mostre um gargalo de adoção.
