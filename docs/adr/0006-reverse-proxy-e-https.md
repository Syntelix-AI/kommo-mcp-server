# ADR-0006: Reverse proxy & HTTPS — Caddy provisionado pelo wizard + BYO

- **Status:** Accepted
- **Data:** 2026-06-13
- **Decisores:** David Fiocchi (Syntelix)
- **Relacionada a:** PRD §5.1 (Fase 2), §5.3, §8 (M3), §9 (6º item); ADR-0005 (porta/binding)

## Contexto

A Fase 2 (web/VPS) precisa de **HTTPS num domínio próprio** (PRD §5.1). Há duas
perguntas de arquitetura: **(A)** onde terminar o TLS; **(B)** como atender tanto
quem parte do zero quanto quem já tem um reverse proxy.

O alvo central da Fase 2 é tornar o deploy acessível — inclusive para o usuário
"web" que não quer mexer em infraestrutura. Isso pressiona por **automação real**
do caminho default, não apenas instruções.

Esta decisão amarra no ADR-0005: o server roda em **loopback `127.0.0.1:1919`** e o
proxy faz a ponte pública (com o opt-in de `0.0.0.0` documentado para container).

## Alternativas consideradas

### A — Onde terminar o TLS

1. **TLS no próprio Node** (ACME embutido, ex. greenlock).
   - **Prós:** menos processos; nada externo.
   - **Contras:** gerência de certificado/renovação dentro do app é complexa e
     frágil; reinventa o que reverse proxies já fazem bem.

2. **Delegar a um reverse proxy** (escolhida).
   - **Prós:** padrão de produção; o proxy cuida de TLS, renovação e multi-site.
   - **Contras:** mais um processo na topologia.

### B — Caminho default e nível de automação

1. **Caddy provisionado pelo wizard (instala + configura + sobe)** (escolhida).
   - **Prós:** HTTPS automático via Let's Encrypt; entrega de fato a promessa de
     facilidade da Fase 2 — o usuário informa o domínio e o wizard cuida do resto.
   - **Contras:** automatizar instalação/gerência do Caddy em Windows, macOS e
     Linux multiplica a superfície de manutenção.

2. **Apenas gerar o Caddyfile + instruções** (sem instalar).
   - **Prós:** muito menos superfície de manutenção.
   - **Contras:** deixa o passo mais difícil (instalar/subir o proxy) com o
     usuário — enfraquece a facilidade que é o ponto da Fase 2.

3. **BYO — gerar snippet para proxy existente** (complementar, não exclusiva).
   - Para quem já tem nginx/Traefik/Caddy: gerar o trecho de config (proxy reverso
     → `127.0.0.1:1919`) sem forçar troca de stack.

## Decisão

**(A)** Delegamos a terminação de TLS a um **reverse proxy** — não embutimos ACME
no Node.

**(B)** O caminho **default é o Caddy provisionado pelo wizard de ponta a ponta**
(instala, configura via `Caddyfile` apontando para `127.0.0.1:1919`, e sobe o
serviço), já a partir do **M3**. Aceitamos conscientemente o **custo maior de
manutenção cross-platform** porque a automação completa é parte essencial da
facilidade prometida na Fase 2 — gerar só o arquivo deixaria o passo mais difícil
com o usuário.

Em paralelo, oferecemos o caminho **BYO**: para quem já tem nginx/Traefik/Caddy, o
wizard **gera o snippet de config** apropriado, sem provisionar nada.

## Consequências

- **Positivas:** o usuário web obtém HTTPS funcional informando apenas o domínio;
  TLS e renovação ficam a cargo de uma ferramenta madura; quem já tem proxy não é
  forçado a mudar de stack.
- **Negativas / custos:** assumimos a complexidade de instalar/gerenciar o Caddy
  em três sistemas operacionais (detecção de SO, privilégios, gerenciamento do
  processo/serviço, atualização) — é a parte mais cara desta decisão e precisa de
  testes por plataforma.
- **Follow-ups:**
  - Spec do M3: wizard de deploy — provisionamento do Caddy por SO (instalação,
    Caddyfile, serviço), coleta de domínio, e o opt-in de `0.0.0.0` (ADR-0005).
  - Spec BYO: geração de snippets para nginx/Traefik/Caddy existentes.
  - A autenticação da camada remota é tratada em ADR separado (estratégia de
    OAuth / auth simples).
