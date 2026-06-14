# ADR-0002: Topologia de execução — "Node único"

- **Status:** Accepted
- **Data:** 2026-06-13
- **Decisores:** David Fiocchi (Syntelix)
- **Relacionada a:** PRD §5.1, §9 (2º item); ADR-0001 (runtime); ADR-0008 (cofre de token); ADR-0003 (transporte)

## Contexto

O produto é **um só núcleo** entregue em quatro embalagens (PRD §5.1): self-host,
Web/VPS, Widget e managed. A questão de topologia é: **como rodar esse mesmo
núcleo nos três formatos executáveis (self-host, VPS, managed) sem manter código
divergente por plataforma?**

Esta decisão substitui uma escolha anterior por Cloudflare Workers, revertida
explicitamente. O ADR existe para registrar **por que** Workers foi descartado e
fixar o princípio de "mesmo artefato em todo lugar".

Restrições que pesam: o self-host precisa de acesso ao **filesystem e ao cofre de
credenciais do SO** (ADR-0008), o wizard precisa de **child processes**, e o
transporte Streamable HTTP envolve **conexões longas/streaming** (ADR-0003).

## Alternativas consideradas

1. **Node único** — o mesmo runtime Node serve self-host, VPS e managed.
   - **Prós:** um runtime idêntico em todos os ambientes; acesso às **APIs
     completas do Node** (filesystem para o cofre de token, child processes para o
     wizard, conexões longas para Streamable HTTP); roda em qualquer VPS/PaaS sem
     adaptação; um único conjunto de bugs.
   - **Contras:** a escala/infra do tier managed fica por nossa conta (sem
     auto-scaling "de graça").

2. **Cloudflare Workers (edge)** — runtime serverless no edge.
   - **Prós:** serverless, auto-escala, custo de edge baixo.
   - **Contras:** runtime restrito, **sem APIs nativas do Node** (sem acesso a
     Keychain/Credential Manager/filesystem); limites em conexões longas/streaming;
     **o self-host não mapeia para Workers** — exigiria uma segunda base de código.
     Não é possível rodar o mesmo artefato localmente. Foi o motivo da reversão.

3. **Híbrido (Node no self-host + Workers no managed)** — runtimes distintos por
   formato.
   - **Prós:** no papel, pega edge/scale no managed e Node no self-host.
   - **Contras:** dois runtimes, dois conjuntos de bugs e divergência inevitável —
     contraria o princípio de "um só núcleo" do PRD.

## Decisão

Adotamos **"Node único"**: o mesmo runtime Node executa self-host, VPS e managed.

A tensão real era o auto-scaling e o custo de edge do **Cloudflare Workers** no
tier managed. Aceitamos **abrir mão dessa vantagem de escala** em troca de um
único runtime que funciona de forma idêntica do self-host ao managed e que dá
**acesso total às APIs do Node** — pré-requisito de decisões já tomadas (cofre de
token no SO, wizard com child processes, Streamable HTTP com conexões longas).
Workers é incompatível com essas necessidades e quebraria o "um só núcleo".

A questão de **como escalar o tier managed** sem o auto-scaling do edge é
reconhecida e **deliberadamente adiada para um ADR dedicado**, quando o managed
sair do estado de fase futura.

## Consequências

- **Positivas:** uma única base de código e runtime para manter; paridade total
  entre o que o contribuidor roda local e o que roda em produção; liberdade para
  usar qualquer API do Node; portabilidade para qualquer VPS/PaaS.
- **Negativas / custos:** sem auto-scaling nativo de edge; a operação e o
  dimensionamento do managed serão responsabilidade nossa, com custo e
  complexidade de infra próprios.
- **Follow-ups:**
  - ADR futuro dedicado: estratégia de escala/isolamento do tier managed
    multi-tenant.
  - ADR-0003 (transporte & SDK) e ADR-0008 (cofre de token) dependem do acesso
    pleno às APIs do Node garantido por esta decisão.
