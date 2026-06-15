# PRD — Kommo MCP Server

> **Product Requirements Document** · Documento vivo
> **Status:** Approved · **Versão:** 1.0 · **Data:** 2026-06-13
> **Autor:** David Fiocchi (Syntelix) · **Revisores:** — (aprovação do autor)

---

## 1. Resumo executivo

O **Kommo MCP Server** é um servidor [Model Context Protocol (MCP)](https://modelcontextprotocol.io)
que conecta assistentes de IA (Claude, ChatGPT, Codex, Cursor e qualquer cliente
MCP) ao CRM [Kommo](https://www.kommo.com). O objetivo é permitir que qualquer
usuário do Kommo — técnico ou não — disponibilize seus dados e operações de CRM
a uma IA **de forma segura, padronizada e sem precisar escrever um plugin
personalizado**.

O produto é **open source (MIT)**, mantido pela **Syntelix**, e oferecido em
formatos que vão do "rode você mesmo em 2 minutos" até uma hospedagem gerenciada
de baixo custo para quem não quer manter infraestrutura.

---

## 2. Problema

Hoje, para usar dados do Kommo dentro de uma IA, o usuário precisa:

- conhecer a API do Kommo e escrever integração própria; **ou**
- depender de automações genéricas (Zapier/Make) que não dão à IA controle
  conversacional real sobre o CRM; **ou**
- contratar desenvolvimento sob medida.

Não existe um caminho **padronizado (MCP)**, **seguro** (sem vazar token) e
**fácil de instalar** para plugar o Kommo em assistentes de IA. Quem é técnico
perde tempo; quem não é técnico simplesmente não consegue.

---

## 3. Objetivos e métricas de sucesso

### 3.1 Objetivos

1. **Padronização MCP real:** ser um servidor MCP em conformidade com a
   especificação oficial (lifecycle, transporte, tools, erros, e — quando fizer
   sentido — resources/prompts).
2. **Facilidade de adoção:** usuário técnico instala e conecta ao seu cliente de
   IA em minutos; usuário não técnico tem um caminho gerenciado.
3. **Segurança por padrão:** o token do Kommo nunca é exposto/commitado;
   conexões remotas sempre sob HTTPS e autenticação.
4. **Cobertura útil da API do Kommo:** as operações de CRM mais valiosas para uso
   conversacional (ler/criar/mover leads, contatos, empresas, pipelines, tarefas,
   notas, relatórios).
5. **Sustentabilidade:** modelo open source em duas frentes distintas:
   (a) **doações de quem usa**, habilitadas já a partir da Fase 1 (self-hosted
   instalável) — voluntárias, sem gate de funcionalidade; e (b) um **produto
   gerenciado opcional** (fase futura), em que a Syntelix hospeda/mantém por um
   valor baixo que custeia infra + pequeno lucro. As duas não se confundem:
   doação é apoio do usuário ao projeto; managed é serviço pago de operação.

### 3.2 Métricas de sucesso (norte, a refinar)

| Métrica | Alvo inicial |
|---------|--------------|
| Tempo do "zero ao primeiro `tools/call`" (self-host) | < 5 min |
| Conformidade com a spec MCP (checklist) | 100% dos itens obrigatórios |
| Operações de CRM cobertas (do conjunto-núcleo da Fase 1, §5.2) | ≥ 80% |
| Instalações self-host (npm downloads / mês) | crescimento M/M |

---

## 4. Personas

| Persona | Quem é | Necessidade central | Formato-alvo |
|---------|--------|---------------------|--------------|
| **Dev/Operador técnico** | Usa Claude Code, Codex, Cursor; tem terminal e talvez VPS | Instalar rápido, controlar o token, integrar ao seu cliente MCP | Self-hosted (1) e Web/VPS (2) |
| **Usuário de IA via web** | Usa ChatGPT/Claude na web; quer conectar o Kommo sem terminal | Uma URL HTTPS estável e login simples | Web/VPS (2), depois Widget (3) e Managed (4) |
| **Cliente gerenciado** | Quer o resultado, não a manutenção | "Façam por mim por um valor baixo" | Managed (4) |
| **Contribuidor** | Dev da comunidade | Entender arquitetura e contribuir com specs/PRs | Todos |

---

## 5. Escopo do produto

### 5.1 Formatos de distribuição

O produto é **um só núcleo** entregue em quatro embalagens, em fases:

1. **Self-hosted (FASE 1 — prioritária)**
   - Instalação via `npx`, com **wizard de setup** que coleta credenciais do
     Kommo e configura o cliente MCP do usuário (Claude Code, Codex, Cursor,
     Claude Desktop).
   - Token guardado com segurança (preferir o cofre do SO: Keychain/Credential
     Manager/libsecret; fallback em arquivo de config protegido).
   - Suporte a Windows, macOS e Linux, com as diferenças tratadas pelo wizard.

2. **Web / VPS (FASE 2)**
   - Servidor HTTP (Streamable HTTP do MCP) acessível por **URL HTTPS própria**,
     para uso em clientes web (ChatGPT, Claude, etc.).
   - **Wizard de deploy** que pergunta domínio (sugestão: `kommo-mcp.seudominio.com`),
     configura HTTPS automático (Caddy por padrão) **e** suporta quem já tem
     reverse proxy (nginx/Traefik/Caddy) — gerando o snippet de config adequado.
   - Porta padrão configurável (sugestão de default fora das faixas comuns;
     `PORT` do ambiente sempre respeitado para PaaS).
   - **Autenticação/OAuth** como subfase: começar com auth simples (token/bearer)
     e evoluir para OAuth com uma camada facilitada.

3. **Widget do Kommo (FASE FUTURA)**
   - Presença no marketplace de widgets do Kommo como **ponte de onboarding**:
     o usuário ativa, segue um passo a passo e conecta o Kommo a qualquer IA sem
     criar plugin próprio.

4. **Managed / Produto Syntelix (FASE FUTURA)**
   - Hospedagem gerenciada multi-tenant de **baixo custo**, para quem não quer
     configurar/manter. Custeia infra + pequeno lucro. Mantém o core MIT.

### 5.2 Cobertura funcional da API do Kommo (priorização)

**Núcleo (Fase 1):** Conta, Leads (listar/criar/atualizar/mover de etapa e
pipeline), Contatos, Empresas, Pipelines & Etapas, Tarefas, Eventos (feed de
auditoria, **somente leitura**), Notas (incl. fixar/desafixar), Tags, Motivos de
perda.

**Próximo (Fase 2+):** Custom Fields & Field Groups, Catálogos (Listas), Usuários
& Papéis, Fontes, relatórios/analytics validados contra a doc oficial,
Salesbot (run/stop) com salvaguardas de permissão.

**Futuro / fora do núcleo:** Chats API, VoIP/Calls, Files API, Webhooks (eventos
em tempo real), Kommo AI API. Entram conforme casos de uso amadureçam.

### 5.3 Conformidade MCP (requisito transversal)

- Handshake `initialize` → `initialized` correto, com **`capabilities` bem
  estruturado** (objeto único contendo `tools`, e `resources`/`prompts` quando
  implementados — *não* como irmãos de `capabilities`).
- Transporte Streamable HTTP conforme spec (headers, sessão, tipos de mensagem).
- Tools com `title`, `inputSchema` válido e **anotações** (`readOnlyHint`,
  `idempotentHint`, `destructiveHint`, `openWorldHint`) onde aplicável.
- Distinção correta entre **erro de execução de tool** (`result` com
  `isError: true`) e **erro de protocolo** (JSON-RPC `error`).
- Segurança do transporte HTTP: validação de `Origin`, binding local por padrão,
  autenticação ativa e documentada.

---

## 6. Não-objetivos (nesta fase)

- **Não** seremos um cliente/automação genérico tipo Zapier/Make.
- **Não** cobriremos Chats/VoIP/Files/Webhooks na Fase 1 (entram depois).
- **Não** construiremos UI web própria de CRM — a interface é o cliente de IA do
  usuário; o Widget (futuro) é só ponte de onboarding.
- **Não** implementaremos motor de "IA própria" embutido (sem heurísticas
  pseudo-IA no servidor); a inteligência mora no modelo do cliente. O servidor
  expõe dados e operações limpas.
- **Não** suportaremos, na Fase 1, multi-conta/multi-tenant complexo no
  self-host (uma instância = uma conta Kommo). Multi-tenant é assunto do tier
  gerenciado.

---

## 7. Requisitos de qualidade e segurança

- **Segredos:** jamais commitados. `.env.example` documenta variáveis; produção
  usa variáveis de ambiente / secret manager.
- **Privacidade:** dados do CRM trafegam entre o cliente de IA e o Kommo via o
  servidor; o servidor não deve persistir dados de negócio além do necessário
  (sem cache sem expiração / sem armazenamento oculto de leads).
- **Observabilidade:** logs úteis sem vazar dados sensíveis.
- **Testabilidade:** o que for entregue deve ter caminho de teste (a definir nas
  specs de infraestrutura). Documentação não promete ferramentas inexistentes.

---

## 8. Marcos (alto nível)

| Fase | Entrega | Resultado observável |
|------|---------|----------------------|
| **M1** | Core MCP + tools de CRM núcleo, em conformidade com a spec. **DoD mínimo:** Conta + Leads (CRUD/mover) + Contatos + Pipelines (listar). Demais ops do núcleo entram ainda no M1. | Usuário roda local e a IA opera o Kommo via stdio |
| **M2** | Self-host: pacote `npx` + wizard de setup multiplataforma | "Zero ao primeiro `tools/call`" < 5 min |
| **M3** | Web/VPS: deploy com HTTPS (Caddy + BYO proxy) e auth simples | URL HTTPS própria funcionando em cliente web |
| **M4** | OAuth na camada remota | Login seguro sem token manual |
| **M5+** | Widget do Kommo · Managed Syntelix · APIs adicionais | Onboarding via marketplace; tier pago |

---

## 9. Decisões a ratificar como ADRs

O PRD define **o quê**. As escolhas de **como** abaixo já foram discutidas e
devem ser formalizadas como ADRs antes da implementação:

- **ADR — Linguagem & runtime:** TypeScript/Node.
- **ADR — Topologia de execução:** "Node único" (mesmo runtime para self-host,
  VPS e managed), em vez de runtimes especializados (ex.: Cloudflare Workers).
- **ADR — Transporte & SDK MCP:** adotar (ou não) o `@modelcontextprotocol/sdk`
  oficial; Streamable HTTP.
- **ADR — Estrutura do repositório:** monorepo com pacotes (core / cli / server)
  vs. alternativas.
- **ADR — Porta padrão e configuração** do servidor web.
- **ADR — Reverse proxy:** Caddy como default + suporte a nginx/Traefik/Caddy
  existente.
- **ADR — Estratégia de OAuth** na camada remota (lib/provedor facilitador).
- **ADR — Armazenamento seguro do token** no self-host (cofre do SO vs. arquivo).
- **ADR — Licença & sustentabilidade:** MIT + doações + tier gerenciado.

---

## 10. Riscos e questões em aberto

| Risco / questão | Nota |
|-----------------|------|
| Endpoints de relatórios/analytics podem divergir da doc oficial | Validar contra a referência antes de expor como tools |
| OAuth remoto é complexo | Mitigar com camada facilitada; começar por auth simples |
| Multi-tenant gerenciado tem implicações de segurança/isolamento | Tratar como fase própria, com ADR dedicado |
| Kommo pode **não aprovar** o widget no marketplace | Pesquisar política/requisitos antes da Fase Widget; manter self-host/VPS como caminhos independentes do marketplace |
| Licença permissiva (MIT) permite **reuso/derivados por terceiros** | Trade-off aceito do MIT; diferenciação por marca, governança e qualidade de manutenção, não por restrição de licença. Ver ADR-0009 |
| Escopo da API pode crescer demais | Priorização por valor conversacional; usar não-objetivos |

---

## 11. Referências

- [Model Context Protocol — documentação](https://modelcontextprotocol.io)
- [Kommo para desenvolvedores (API)](https://pt-developers.kommo.com/docs/kommo-para-desenvolvedores)
- ADRs do projeto: [`docs/adr/`](./adr/)
- Specs do projeto: [`../specs/`](../specs/)
