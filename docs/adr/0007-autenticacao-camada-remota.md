# ADR-0007: Autenticação da camada remota — bearer obrigatório; OAuth só no managed

- **Status:** Accepted
- **Data:** 2026-06-13
- **Decisores:** David Fiocchi (Syntelix)
- **Relacionada a:** PRD §5.1 (Fase 2), §5.3, §8 (M3/M4), §9 (7º item); ADR-0002 (Node único); ADR-0003 (SDK MCP)

## Contexto

Quando o server fica exposto (Fase 2), as requisições MCP precisam ser
autenticadas (PRD §5.3: "autenticação ativa e documentada"). A spec MCP define um
framework de **OAuth 2.1** para o transporte HTTP, mas OAuth remoto é complexo e
não pode atrasar a entrega de valor.

Há uma distinção que muda a resposta: os formatos têm cenários de exposição
diferentes (ADR-0002):

- **self-host stdio (M1):** processo local, não exposto na rede.
- **self-host remoto/VPS (Fase 2):** endpoint HTTPS público, de um **dono único**.
- **managed (futuro):** serviço **multi-tenant** operado pela Syntelix.

Levantamento das opções de OAuth em Node (resumo): SaaS hospedado (WorkOS AuthKit,
Stytch — ambos com suporte explícito a MCP; Auth0; Clerk), IdP open-source
auto-hospedado (Ory Hydra, Zitadel, Keycloak, SuperTokens) e bibliotecas para ser
o próprio authorization server (`oidc-provider`) ou cliente (Arctic/Oslo). O custo
recai sobre três eixos: **dependência externa**, **débito operacional** (rodar
IdP + DB) e **débito de segurança** (fazer OAuth à mão).

## Alternativas consideradas

1. **OAuth em todos os formatos, desde cedo.**
   - **Contras:** impor OAuth (SaaS ou IdP próprio) ao self-host de **dono único** é
     fricção alta sem retorno proporcional; atrasa a Fase 2.

2. **Sem nenhuma auth no self-host remoto.**
   - **Contras:** endpoint HTTPS público sem autenticação é um buraco de segurança —
     viola o PRD §5.3.

3. **Bearer obrigatório como piso; OAuth só onde paga a complexidade** (escolhida).
   - **Prós:** protege todo endpoint exposto desde o M3; reserva o OAuth (caro) para
     o managed, onde o multi-tenant justifica; mantém o self-host simples.
   - **Contras:** self-host não terá login OAuth "bonito" agora (aceito; é fase
     futura).

## Decisão

Regra-mestra: **nenhum endpoint exposto sem autenticação.**

1. **M3 — bearer token obrigatório** em qualquer endpoint exposto (self-host
   remoto/VPS e a base do managed). O stdio local (M1) não exige auth de rede por
   não ser exposto.

2. **Self-host — sem OAuth por enquanto.** A camada OAuth é **deliberadamente
   adiada para fase futura**; não bloqueia a Fase 2. O que se dispensa é apenas a
   camada OAuth *por cima* — o bearer continua sendo o piso obrigatório do
   self-host remoto.

3. **Managed (M4+) — OAuth via SaaS facilitador.** Quando o managed multi-tenant
   for desenvolvido, a autenticação usará um **provedor SaaS facilitador** (em
   Node, nunca Workers — ADR-0002), com **WorkOS AuthKit** e **Stytch** como
   candidatos preferidos (ambos publicaram suporte a MCP e têm free tier
   generoso). O **fornecedor exato é decidido em spec própria**, com pricing e
   lock-in validados na época — não se fixa um vendor neste ADR imutável.

## Consequências

- **Positivas:** Fase 2 utilizável cedo com segurança real (bearer); elimina o
  trabalho de OAuth no self-host sem abrir risco; reserva a complexidade do OAuth
  para o managed, onde o multi-tenant a justifica; preserva liberdade de escolher o
  vendor depois.
- **Negativas / custos:** self-host remoto não terá login OAuth/SSO agora — quem
  precisar disso terá que esperar a fase futura ou usar o managed; o bearer exige
  gestão cuidadosa do segredo (geração, rotação, armazenamento — ver ADR-0008).
- **Follow-ups:**
  - Spec do M3: emissão/validação do bearer, e a regra "exposto ⇒ autenticado"
    (ver também ADR-0005 binding e ADR-0006 proxy).
  - Spec futura: OAuth do managed — seleção do SaaS facilitador (WorkOS/Stytch),
    com pricing validado; integração via helpers do SDK MCP (ADR-0003).
  - ADR/Spec futura (opcional): "BYO OIDC" para o self-host, se houver demanda.
