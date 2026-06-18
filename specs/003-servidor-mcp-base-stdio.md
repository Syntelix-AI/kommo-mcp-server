# Spec 003: Servidor MCP base + stdio + conformidade

- **Épico:** E1 — Core MCP + CRM núcleo (M1)
- **Status:** Done
- **Relacionada a:** PRD §5.3, §3.1 (obj. 1); ADR-0001, ADR-0002, ADR-0003
- **Estimativa:** M

## Objetivo

Montar o servidor MCP base usando o `@modelcontextprotocol/sdk` oficial sobre
transporte **stdio**, com o framework de registro de tools e a conformidade de
protocolo correta — o "shell" no qual as tools das specs 004-006 plugam.

## Não-objetivos

- Implementar tools de negócio do Kommo (specs 004+).
- Transporte Streamable HTTP / auth bearer (Fase 2 — ADR-0003, ADR-0007).
- Resources e prompts MCP (podem entrar depois; não no M1).

## Contexto técnico

- **ADR-0003:** usar o SDK oficial; **stdio** no M1. O SDK garante lifecycle
  (`initialize`/`initialized`), framing JSON-RPC e estrutura de `capabilities`.
- **PRD §5.3 — conformidade (corrige a falha do repo anterior):**
  - `capabilities` como **objeto único** com `tools` (e `resources`/`prompts` só se
    implementados, **aninhados** — nunca como irmãos de `capabilities`).
  - Cada tool com `title`, `inputSchema` válido e **anotações** aplicáveis
    (`readOnlyHint`, `idempotentHint`, `destructiveHint`, `openWorldHint`).
  - **Erro de execução de tool** → `result` com `isError: true`; **erro de
    protocolo** → JSON-RPC `error`. Mapear os erros do `core` (spec 002) para
    `isError: true` com mensagem útil ao modelo.
- Um **registry de tools**: cada tool declara nome, title, schema, anotações e
  handler; o servidor as expõe em `tools/list` e despacha em `tools/call`.

## Tarefas

- [x] Inicializar o servidor MCP do SDK no pacote `cli` (entry stdio), consumindo
      `core`.
- [x] Definir a interface/contrato de uma "tool" (nome, title, inputSchema,
      anotações, handler) e um registry que o servidor percorre.
- [x] Implementar o adaptador de erro: erro de tool (negócio/validação do Kommo) →
      `isError: true`; falha de protocolo → JSON-RPC `error`.
- [x] Registrar uma tool trivial de saúde (ex.: `ping`/`whoami` sem efeito) para
      validar o caminho fim-a-fim do framework.
- [x] Testes: `initialize` retorna `capabilities` no formato correto; `tools/list`
      lista a tool de saúde com anotações; um erro de handler vira `isError: true`.

## Critérios de aceite (testáveis)

- [x] Um cliente MCP (ou harness de teste) completa `initialize`/`initialized` e
      recebe `capabilities` com `tools` aninhado corretamente.
- [x] `tools/list` retorna a tool de saúde com `title`, `inputSchema` e anotações.
- [x] `tools/call` na tool de saúde retorna sucesso.
- [x] Um handler que lança erro de negócio responde com `result.isError === true` e
      mensagem legível — **não** derruba a conexão nem vira `error` de protocolo.
- [x] Conectado via stdio a um cliente MCP real (ex.: Claude Desktop), o servidor
      aparece e a tool de saúde executa.

## Fora de escopo / riscos

- A versão mínima do SDK e a política de atualização são fixadas aqui (follow-up do
  ADR-0003) e reusadas pelas specs seguintes.
- Conformidade é o ponto mais sensível (falha-raiz do repo anterior): cobrir o
  formato de `capabilities` e a semântica de erro com testes desde já.
