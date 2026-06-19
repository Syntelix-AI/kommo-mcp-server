# ADR-0011: Observabilidade — Sentry diferido para M3

- **Status:** Accepted
- **Data:** 2026-06-19
- **Decisores:** David Fiocchi (Syntelix)
- **Relacionada a:** PRD §7 (observabilidade), §8 (marcos M1–M5); ADR-0002
  (topologia — Node único), ADR-0003 (transporte — stdio no M1, Streamable HTTP
  no M3), ADR-0008 (token por env no M1), ADR-0009 (sustentabilidade), ADR-0010
  (CI — pipeline mínima e roadmap)

## Contexto

O PRD §7 exige "observabilidade: logs úteis sem vazar dados sensíveis". A questão
não é **se** o projeto precisa de observabilidade — precisa —, mas **quando** e
**com quê**.

A Syntelix foi aprovada no programa **Sentry for Startups**, o que concede
créditos e recursos amplos para uso do Sentry (error monitoring, tracing,
profiling, logging) sem custo relevante nos primeiros estágios do produto. Isso
torna o Sentry uma opção economicamente viável desde já — a pergunta que resta é
se faz sentido **técnica e operacionalmente** integrá-lo agora (M1) ou mais
adiante.

### Estado atual do projeto (M1 — em andamento)

- O servidor MCP roda exclusivamente via **stdio** (ADR-0003): o cliente de IA
  (Claude Desktop, Cursor, Codex) lança o processo como filho e se comunica por
  pipes do SO. Não há servidor HTTP, não há porta aberta, não há rede.
- O processo vive enquanto o cliente de IA estiver aberto. Não é um serviço 24/7.
- O usuário-alvo do M1 é o **dev/operador técnico** (PRD §4) que roda
  localmente — crashes aparecem no terminal imediatamente.
- O token do Kommo chega por variável de ambiente (ADR-0008). Não há
  conectividade de rede iniciada pelo servidor — toda comunicação é feita pelo
  processo pai.
- Specs 005 (Leads), 006 (Contatos) e 007 (Self-host) ainda estão pendentes no
  checklist do E1. O foco é fechar o DoD mínimo do M1.

### Por que a questão surgiu agora

O pacote `@sentry/node` foi adicionado como dependência no `package.json` raiz
antes de qualquer código de inicialização (`Sentry.init`) existir — uma
dependência fantasma. Ao avaliar a integração, concluímos que o momento é
prematuro e a dependência foi removida (commit `b72089c` na `main`). Esta ADR
formaliza o raciocínio e o caminho correto.

## Alternativas consideradas

1. **Integrar Sentry agora (M1), de forma enxuta**
   - Criar `instrument.ts` no pacote `cli`, importar como primeiro módulo,
     configurar `Sentry.init` com DSN via env, habilitar error monitoring e
     tracing básico.
   - **Prós:** observabilidade desde o primeiro dia; aproveita os créditos do
     Sentry for Startups imediatamente; captura crashes mesmo no modo stdio.
   - **Contras:**
     - No modo stdio não há servidor HTTP para monitorar — o valor principal do
       Sentry (monitoramento de serviços em produção) não se aplica.
     - O processo é efêmero e local: crashes são visíveis no terminal do
       usuário, não precisam de telemetria remota.
     - Introduz uma dependência de rede (`@sentry/node` reporta para
       `sentry.io`) num processo que, pela ADR-0008, não deveria precisar de
       conectividade iniciada pelo servidor.
     - Adiciona ~200 linhas de deps transitórias ao lockfile sem retorno
       proporcional.
     - Desvia energia do DoD do M1 (Specs 005–007 pendentes) — viola o mesmo
       princípio da ADR-0010 (investir no produto antes da infraestrutura).
     - Exige uma env var `SENTRY_DSN` que o usuário self-host não precisa e não
       quer configurar no M1.

2. **Desenvolver observabilidade própria (logs estruturados + métricas custom)**
   - Criar um módulo de logging interno (ex.: `pino` + formatação estruturada),
     métricas em memória, e eventualmente um dashboard.
   - **Prós:** controle total; sem dependência de SaaS.
   - **Contras:**
     - Reinventar o que o Sentry já faz (stack traces enriquecidos, breadcrumbs,
       release tracking, alerting, dashboards, tracing distribuído, profiling).
     - Custo de desenvolvimento e manutenção contínuo incompatível com o tamanho
       do time (startup enxuta).
     - A Syntelix tem créditos do Sentry for Startups — desenvolver algo próprio
       desperdiça um recurso já aprovado e gratuito.
     - Logs estruturados básicos são úteis, mas não substituem error monitoring
       com contexto (local variables, request data, user context) que o Sentry
       entrega out-of-the-box.

3. **Diferir para M3 (Web/VPS) — integrar quando houver servidor HTTP** (escolhida)
   - Não integrar agora. Quando o transporte Streamable HTTP for implementado
     (M3), o servidor passará a rodar como serviço de longa duração, com tráfego
     de rede, erros que ninguém vê em tempo real, e necessidade real de
     monitoring remoto. Esse é o momento natural.
   - **Prós:**
     - Alinha investimento com retorno: Sentry é mais valioso quando há um
       serviço persistente.
     - Mantém o M1 enxuto e focado no DoD.
     - Não adiciona env vars desnecessárias para o usuário self-host.
     - Não introduz dependência de rede num processo stdio.
     - A integração será mais rica no M3: error monitoring + tracing HTTP +
       profiling + runtime metrics fazem sentido num servidor web real.
   - **Contras:** sem telemetria remota de crashes no M1/M2 — aceitável dado que
     o processo é local e efêmero.

## Decisão

Adotamos a **alternativa 3 — diferir a integração do Sentry para M3**.

### Por que Sentry (e não solução própria)

Quando o momento chegar, o Sentry será a ferramenta de observabilidade, não uma
solução desenvolvida internamente. As razões:

1. **Profundidade out-of-the-box.** Error monitoring com stack traces
   enriquecidos, local variables, breadcrumbs automáticos, release tracking,
   source maps, tracing distribuído, profiling contínuo, session replay (futuro,
   se houver UI), alerting configurável, dashboards — tudo pronto. Desenvolver um
   subconjunto disso internamente custaria meses de engenharia sem atingir a
   mesma qualidade.

2. **Custo zero (Sentry for Startups).** A Syntelix foi aprovada no programa
   Sentry for Startups, que concede créditos e recursos amplos. O custo de
   adoção é efetivamente zero nos estágios iniciais do produto — seria
   irracional gastar tempo de engenharia desenvolvendo algo que já temos acesso
   gratuito e maduro.

3. **Ecossistema Node.js/TypeScript.** O `@sentry/node` (v10+) integra
   nativamente com OpenTelemetry para tracing, suporta ESM via `--import`, e
   oferece integrações automáticas para frameworks HTTP (Express, Fastify, Koa) —
   exatamente o stack do projeto (ADR-0001, ADR-0002).

4. **Foco da Syntelix.** O produto é um servidor MCP para o Kommo, não uma
   plataforma de observabilidade. Cada hora gasta em logging/monitoring custom é
   uma hora a menos no CRM tooling que diferencia o produto.

5. **Compatibilidade com o modelo open source.** O Sentry é open source (BSL →
   Apache 2.0 após 3 anos); o self-hoster pode optar por rodar sem DSN
   configurado (Sentry não inicializa sem DSN) ou apontar para uma instância
   self-hosted do Sentry. O SDK não cria lock-in funcional.

### Roadmap de integração

A integração acompanha os marcos do PRD, na mesma lógica da ADR-0010 (CI evolui
com o produto):

| Marco | Ação | Justificativa |
|-------|------|---------------|
| **M1 (stdio, atual)** | Nenhuma. Sem Sentry. | Processo local e efêmero; crashes visíveis no terminal. |
| **M2 (npx + wizard)** | **Opcional:** capturar crashes do wizard interativo, se o wizard tiver interação complexa que justifique telemetria. Decisão na spec do wizard. | O wizard roda uma vez e sai — valor marginal. Avaliar na hora. |
| **M3 (Web/VPS — Streamable HTTP)** | **Integrar Sentry.** `@sentry/node` no pacote `server`; `instrument.ts` carregado via `--import`; DSN via env (`SENTRY_DSN`); error monitoring + tracing HTTP + runtime metrics. | Servidor de longa duração, com tráfego real, erros invisíveis sem telemetria remota. Momento de retorno máximo. |
| **M4 (OAuth)** | Adicionar contexto de usuário (`Sentry.setUser`) nas requisições autenticadas. | Erros correlacionados a usuários ajudam a diagnosticar problemas de auth. |
| **M5+ (managed multi-tenant)** | Profiling contínuo; alerting por tenant; Sentry Crons para monitorar jobs de manutenção; métricas custom de uso. | Operação de produção multi-tenant exige observabilidade completa. |

### Configuração técnica prevista (M3)

Quando a integração acontecer, o plano técnico é:

```typescript
// packages/server/src/instrument.ts — carregado via --import
import * as Sentry from "@sentry/node";

Sentry.init({
  dsn: process.env.SENTRY_DSN,          // sem DSN = Sentry não inicializa (safe default)
  environment: process.env.NODE_ENV ?? "production",
  sendDefaultPii: true,
  tracesSampleRate: process.env.NODE_ENV === "development" ? 1.0 : 0.1,
  includeLocalVariables: true,
  integrations: [
    Sentry.nodeRuntimeMetricsIntegration(),
  ],
});
```

- **Pacote-alvo:** `server` (não `cli`). No M3, o servidor HTTP vive no pacote
  `server`; o `cli` continua sendo stdio.
- **DSN opcional:** self-hosters podem omitir `SENTRY_DSN` e o Sentry
  simplesmente não inicializa — sem impacto funcional.
- **ESM:** o projeto usa `"type": "module"` (ADR-0001); o SDK é carregado via
  `--import ./instrument.mjs` conforme a documentação oficial do Sentry para
  Node.js ESM.

## Consequências

- **Positivas:**
  - M1 fica enxuto: sem dependência de rede, sem env vars extras, sem código de
    instrumentação a manter antes de ter retorno.
  - Decisão documentada sobre **quando** integrar Sentry, evitando a discussão
    recorrente de "deveríamos adicionar observabilidade agora?".
  - Quando a integração acontecer (M3), o valor será alto: servidor HTTP 24/7
    com tráfego real.
  - Créditos do Sentry for Startups preservados para quando tiverem retorno real.
- **Negativas / custos:**
  - Sem telemetria remota de crashes no M1/M2 — aceitável dado que o processo é
    local e o usuário vê o erro diretamente.
  - Se um bug raro ocorrer em stdio e o usuário não reportar, não teremos
    visibilidade — mitigado por logs locais e pelo fato de que o público do M1
    são desenvolvedores técnicos.
- **Follow-ups:**
  - Ao iniciar M3 (Streamable HTTP), criar spec de integração do Sentry no
    pacote `server` seguindo o plano técnico descrito acima.
  - Avaliar no M2 se o wizard justifica captura de crashes (decisão local, não
    precisa de ADR).
  - Manter os créditos do Sentry for Startups ativos e monitorar a validade do
    programa.
