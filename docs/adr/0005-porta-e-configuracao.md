# ADR-0005: Porta padrão & configuração do servidor web

- **Status:** Accepted
- **Data:** 2026-06-13
- **Decisores:** David Fiocchi (Syntelix)
- **Relacionada a:** PRD §5.1, §5.3, §9 (5º item); ADR-0003 (transporte HTTP); ADR-0006 (reverse proxy)

## Contexto

O pacote **server** (Streamable HTTP, Fase 2) precisa de uma **porta padrão** e de
uma política de configuração previsível. O self-host via stdio (M1) não usa porta;
esta decisão vale apenas para o cenário web/VPS/managed.

Forças em jogo:

- **Evitar colisão:** a porta default não deve cair nas faixas de dev mais
  disputadas (3000, 5000, 8000, 8080).
- **Compatibilidade com PaaS:** plataformas como Render/Heroku injetam a porta via
  `process.env.PORT`, que **precisa ser sempre respeitada** (PRD §5.1).
- **Segurança por padrão:** o PRD §5.3 pede binding local por padrão, para que uma
  instância exposta sem proxy não fique acessível na rede por acidente.

## Alternativas consideradas

1. **Default 1919 + cascata de precedência + loopback por padrão** (proposta).
   - **Prós:** porta fora das faixas comuns e memorável (19-19); `PORT` respeitado
     para PaaS; seguro por padrão.
   - **Contras:** em container, o binding loopback exige opt-in explícito para o
     proxy alcançar o server.

2. **Porta comum (3000/8080) como default.**
   - **Contras:** colisão frequente com outros serviços de dev.

3. **Bind em `0.0.0.0` por padrão.**
   - **Prós:** funciona em container sem configurar nada.
   - **Contras:** expõe a instância na rede por padrão — contraria a segurança por
     padrão do PRD §5.3.

## Decisão

1. **Porta padrão: `1919`** — fora das faixas de dev comuns, memorável.

2. **Precedência de configuração** (mesma cascata para porta e demais opções como
   host):

   > **flag CLI explícita** (`--port`) > **env `PORT`** > **default `1919`**

   Como nenhuma PaaS passa flag, o `PORT` que ela injeta é sempre honrado na
   prática; o usuário que passa `--port` manualmente vence por ser o mais
   explícito. Isso satisfaz "respeitar `PORT` sempre" sem abrir mão do override
   manual.

3. **Binding padrão: loopback `127.0.0.1`**, com bind em `0.0.0.0` como **opt-in
   explícito**. A ressalva de container (onde o proxy, ex. Caddy, precisa alcançar
   o server e portanto exige `0.0.0.0`) é **documentada** como cenário de opt-in,
   e amarra com o ADR-0006 (reverse proxy).

## Consequências

- **Positivas:** default sem colisão e fácil de lembrar; deploy em PaaS funciona
  sem configuração extra; instância segura por padrão (não exposta na rede sem
  intenção explícita).
- **Negativas / custos:** cenário de container exige o passo extra de habilitar
  `0.0.0.0`, que precisa ficar claro na documentação para não virar dor de
  "o proxy não alcança o server".
- **Follow-ups:**
  - Spec do server (Fase 2): implementar a cascata de configuração, a flag
    `--port`/`--host` e o binding loopback-por-padrão.
  - Documentar o opt-in de `0.0.0.0` junto dos snippets de reverse proxy
    (ADR-0006).
