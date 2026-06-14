# ADR-0003: Transporte & SDK MCP — SDK oficial com stdio + Streamable HTTP

- **Status:** Accepted
- **Data:** 2026-06-13
- **Decisores:** David Fiocchi (Syntelix)
- **Relacionada a:** PRD §5.3, §9 (3º item); ADR-0001 (runtime TS/Node); ADR-0002 (Node único)

## Contexto

O servidor precisa falar **Model Context Protocol em conformidade** com a
especificação oficial — corrigindo o problema central do repo anterior, cuja
implementação manual quebrava a estrutura de `capabilities` (resources/prompts
como irmãos de `capabilities` em vez de aninhados) e tratava erros fora do padrão.

Há ainda **dois cenários de conexão** a atender (PRD §5.1, §5.3):

- **Local / self-host:** clientes como Claude Desktop, Claude Code, Cursor e Codex
  conectam tipicamente via **stdio**. É o alvo do M1.
- **Remoto / web:** clientes web (ChatGPT, Claude) exigem **Streamable HTTP** sobre
  HTTPS, com validação de `Origin`, sessão e tipos de mensagem corretos. É o alvo
  do M2/Fase 2.

Logo, a decisão tem duas partes acopladas: **(A)** construir sobre o SDK MCP
oficial ou implementar o protocolo do zero; e **(B)** quais transportes suportar.

## Alternativas consideradas

### A — SDK oficial vs. implementação própria

1. **`@modelcontextprotocol/sdk` oficial** — biblioteca TS mantida pelo time do MCP.
   - **Prós:** cuida de lifecycle (`initialize`/`initialized`), framing JSON-RPC,
     estrutura de `capabilities`, distinção entre erro de tool e erro de protocolo,
     e dos **dois transportes** prontos; evolui junto com a spec; é a garantia de
     conformidade.
   - **Contras:** dependência externa; menos controle fino; alguma abstração sobre
     o protocolo.

2. **Implementação própria do protocolo** — montar lifecycle/transporte à mão.
   - **Prós:** controle total sobre cada detalhe.
   - **Contras:** o repo anterior fez exatamente isso e **errou a conformidade** —
     reinventar repete o custo e o risco que viemos eliminar.

### B — Transporte

1. **stdio + Streamable HTTP (ambos)** — stdio para clientes locais, Streamable
   HTTP para remoto/web.
   - **Prós:** cobre os dois cenários do PRD com um só núcleo; o SDK oficial
     entrega ambos.
   - **Contras:** dois caminhos de transporte para testar.

2. **Apenas um transporte** — só stdio ou só HTTP.
   - **Contras:** deixaria de fora metade dos cenários-alvo (local *ou* web).

## Decisão

**(A)** Construímos sobre o **`@modelcontextprotocol/sdk` oficial**. O fato de o
repo anterior ter quebrado a conformidade *à mão* é o argumento decisivo: o SDK é
a nossa garantia de aderência à spec e nos poupa de reimplementar lifecycle,
framing e capabilities.

**(B)** Suportamos **os dois transportes desde o desenho**: **stdio** operacional
no M1 (clientes locais) e **Streamable HTTP** no M2/Fase 2 (remoto/web), ambos
fornecidos pelo SDK.

A política de **versão mínima do SDK e de acompanhamento ativo da evolução da
spec** fica como **detalhe de spec de implementação**, não é fixada neste ADR.

## Consequências

- **Positivas:** conformidade MCP garantida pelo SDK (resolve a falha-raiz do repo
  anterior); menos código de protocolo para manter; os dois cenários de conexão
  cobertos pelo mesmo núcleo; evolução acompanhando o upstream.
- **Negativas / custos:** acoplamento à API e ao ritmo de releases do SDK oficial;
  dois caminhos de transporte a manter e testar; menor controle sobre detalhes
  internos do protocolo.
- **Follow-ups:**
  - Spec de infraestrutura do core MCP: fixar versão mínima do SDK, política de
    atualização e cobertura de conformidade (checklist da spec).
  - Spec da Fase 2: segurança do transporte HTTP (validação de `Origin`, binding,
    sessão) — ver também ADR-0005 (porta) e ADR-0006 (reverse proxy).
