# ADR-0009: Licença & sustentabilidade — MIT

- **Status:** Accepted
- **Data:** 2026-06-13
- **Decisores:** David Fiocchi (Syntelix)
- **Relacionada a:** PRD §3.1 (obj. 5), §5.1 (Fase 4), §9 (9º item), §10

## Contexto

O projeto é open source, mantido pela Syntelix, com sustentabilidade prevista em
duas frentes (PRD §3.1): **doações de quem usa** (a partir da Fase 1, self-hosted)
e um **tier gerenciado** opcional (fase futura). É preciso escolher uma licença
coerente com os objetivos centrais do produto: **adoção ampla** e **facilidade de
contribuição** pela comunidade.

Uma licença permissiva (MIT) implica um trade-off conhecido: o código pode ser
reusado livremente, inclusive por terceiros que ofereçam serviços derivados. A
decisão pondera esse trade-off contra o ganho de adoção e contribuição.

## Alternativas consideradas

1. **MIT** (escolhida) — permissiva.
   - **Prós:** atrito mínimo para adoção e contribuição; compatível com qualquer
     ambiente corporativo; favorece o projeto se tornar uma escolha padrão na
     comunidade; simples de entender e cumprir.
   - **Contras:** não impõe obrigações a quem reusa o código (incl. derivados
     comerciais ou serviços concorrentes).

2. **AGPL-3.0 (eventualmente com dual-license)** — copyleft de rede.
   - **Prós:** exigiria que versões modificadas oferecidas como serviço tivessem o
     código aberto.
   - **Contras:** muitos ambientes corporativos **restringem ou proíbem AGPL**, o
     que reduziria adoção e contribuição — justamente os objetivos centrais; e
     adiciona fricção de entendimento/conformidade.

3. **BSL / source-available** — restringe hospedagem comercial por um período.
   - **Contras:** não é uma licença OSI-aprovada; tende a esfriar a confiança e a
     contribuição da comunidade, contrariando a estratégia de adoção.

## Decisão

Adotamos **MIT**.

A licença permissiva maximiza adoção e reduz o atrito de contribuição, que são
objetivos centrais do PRD. Alternativas copyleft/source-available (AGPL, BSL)
foram descartadas porque a fricção que introduzem — restrições corporativas a
AGPL, perda de confiança em licenças não-OSI — atuaria contra esses mesmos
objetivos. Aceitamos conscientemente o trade-off de reuso livre que o MIT implica.

Como o MIT não impõe obrigações a terceiros, a identidade do projeto é protegida
por mecanismos fora da licença do código:

1. **Marca / nome do projeto.** O MIT cobre o **código**, não o **nome**. A
   Syntelix protege o nome e a identidade do projeto: o código pode ser forkado,
   mas um fork **não pode se apresentar como o projeto oficial**.
2. **Governança / manutenção.** A Syntelix é registrada como **mantenedora-âncora**
   (em documento de governança/`MAINTAINERS`), deixando claro qual é a linha
   oficial do projeto.

**Sustentabilidade**, em duas frentes distintas (PRD §3.1):

- **Doações de quem usa**, habilitadas a partir da Fase 1 (self-hosted
  instalável) — voluntárias, sem qualquer gate de funcionalidade.
- **Tier gerenciado** opcional (fase futura): hospedagem/manutenção por um valor
  baixo que custeia infraestrutura. O core permanece MIT.

## Consequências

- **Positivas:** adoção e contribuição sem atrito; compatibilidade com qualquer
  ambiente; identidade do projeto protegida por marca e governança, sem depender de
  restringir terceiros; sustentabilidade que não trava funcionalidade atrás de
  paywall.
- **Negativas / custos:** a licença não impede reuso comercial por terceiros; a
  diferenciação do projeto depende de marca, governança e qualidade de manutenção,
  não de cláusulas de licença.
- **Follow-ups:**
  - Registrar/proteger a marca e a identidade do projeto.
  - Documento de governança/`MAINTAINERS` formalizando a manutenção.
  - Infra de doações na Fase 1 (canais, sem gate).
  - Quando o tier gerenciado for desenvolvido: ADR/spec própria (escala — ADR-0002;
    autenticação — ADR-0007).
