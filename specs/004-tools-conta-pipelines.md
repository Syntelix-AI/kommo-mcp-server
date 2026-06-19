# Spec 004: Tools — Conta & Pipelines (somente leitura)

- **Épico:** E1 — Core MCP + CRM núcleo (M1)
- **Status:** Done
- **Relacionada a:** PRD §5.2, §5.3; ADR-0003
- **Estimativa:** S

## Objetivo

Entregar as primeiras tools de negócio, todas **read-only**: obter dados da conta e
listar pipelines com suas etapas. Validam o framework de tools (spec 003) e o
cliente (spec 002) fim-a-fim com baixo risco (sem escrita).

## Não-objetivos

- Criar/editar pipelines ou etapas (não previsto no núcleo do M1).
- Qualquer operação de escrita.

## Contexto técnico

- **Endpoints Kommo:** `GET /api/v4/account`; `GET /api/v4/leads/pipelines` e
  etapas (`_embedded.statuses`) por pipeline.
- **Anotações (ADR-0003):** ambas as tools são `readOnlyHint: true`,
  `openWorldHint: true` (dados externos do Kommo). Sem `destructiveHint`.
- Consome o cliente da spec 002 e registra no framework da spec 003.

## Tarefas

- [x] Tool `get_account` — retorna dados essenciais da conta (id, nome, subdomínio,
      moeda, fuso, etc.) de forma enxuta para o modelo.
- [x] Tool `list_pipelines` — lista pipelines com suas etapas (id, nome, ordem,
      tipo), de forma que o modelo consiga mapear nomes → ids para a spec 005.
- [x] `inputSchema` válido (mesmo que vazio/poucos filtros) e anotações corretas.
- [x] Testes com Kommo mockado: forma do resultado, anotações, erro 401 → `isError`.

## Critérios de aceite (testáveis)

- [x] `get_account` retorna o objeto da conta com os campos essenciais.
- [x] `list_pipelines` retorna pipelines **e** suas etapas, com ids utilizáveis.
- [x] Ambas declaram `readOnlyHint: true` em `tools/list`.
- [x] Token inválido resulta em `result.isError === true` com mensagem clara.
- [x] Validado em um cliente MCP real: a IA consegue responder "quais são meus
      pipelines e etapas?".

## Fora de escopo / riscos

- Campos da conta/pipelines podem variar por plano Kommo; retornar um subconjunto
  estável e documentado, não o payload bruto inteiro.
