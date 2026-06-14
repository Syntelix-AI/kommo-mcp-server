# Spec 007: Self-host stdio executável + integração de cliente

- **Épico:** E1 — Core MCP + CRM núcleo (M1)
- **Status:** Draft
- **Relacionada a:** PRD §5.1 (Fase 1), §8 (M1), §3.1 (obj. 2); ADR-0003, ADR-0004, ADR-0008
- **Estimativa:** M

## Objetivo

Tornar o servidor **executável localmente via stdio** e documentar a integração com
clientes MCP (Claude Desktop/Code, Cursor, Codex), fechando o DoD do M1: o usuário
roda local e a IA opera o Kommo.

## Não-objetivos

- **Wizard de setup** interativo e cofre do SO (Fase 2 / M2) — aqui o token vem por
  **variável de ambiente** (ADR-0008, modo headless do M1).
- Publicação no npm (`npx` distribuído é M2); aqui basta um entry executável local.
- Transporte HTTP/remoto (Fase 2).

## Contexto técnico

- **ADR-0004:** o entry stdio vive no pacote `cli`, consumindo `core`.
- **ADR-0008:** segredos por env (`KOMMO_SUBDOMAIN`, `KOMMO_ACCESS_TOKEN` — nomes
  fixados na spec 002); nunca commitar/embutir.
- Clientes MCP locais lançam o servidor como processo e injetam env na config (ex.:
  `claude_desktop_config.json` / config de MCP do cliente).
- Reúne tudo: framework (003) + tools (004-006) expostos num binário local.

## Tarefas

- [ ] Entry executável do `cli` que sobe o servidor MCP em stdio com todas as tools
  do M1 registradas.
- [ ] Leitura de config por env com validação e mensagem de erro acionável quando
  faltar subdomínio/token.
- [ ] `bin` no `package.json` do `cli` para execução local (ex.: via
  `pnpm --filter cli start` e/ou link local).
- [ ] Documentação de integração (`README`/`docs`) com exemplos de config para
  Claude Desktop, Claude Code, Cursor e Codex, incluindo como passar o token por env
  com segurança.
- [ ] `.env.example` documentando as variáveis (sem valores reais).
- [ ] Smoke test manual roteirizado (passo a passo) e, se viável, um teste
  automatizado de inicialização do processo.

## Critérios de aceite (testáveis)

- [ ] Rodando o entry com env válido, o servidor inicia e responde `initialize` via
  stdio.
- [ ] Configurado em **Claude Desktop** (ou cliente equivalente), o servidor aparece
  e todas as tools do M1 (`get_account`, `list_pipelines`, leads, contatos) estão
  disponíveis.
- [ ] Fluxo fim-a-fim por linguagem natural: a IA lista pipelines, cria um lead,
  **move o lead de etapa**, e cria/edita um contato — tudo via o cliente real.
- [ ] Sem env, o processo falha com instrução clara de configuração (não stack
  trace cru).
- [ ] `.env.example` presente; nenhum segredo no repositório.
- [ ] "Zero ao primeiro `tools/call`" documentado e factível (meta de tempo é do M2,
  mas o caminho já deve ser direto).

## Fora de escopo / riscos

- A experiência "2 minutos / não-técnico" plena depende do wizard (M2); aqui o alvo
  é o usuário técnico com config manual documentada.
- Diferenças de formato de config entre clientes MCP: documentar cada um e manter os
  exemplos atualizados.
