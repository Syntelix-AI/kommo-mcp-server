# ADR-0008: Armazenamento seguro do token no self-host

- **Status:** Accepted
- **Data:** 2026-06-13
- **Decisores:** David Fiocchi (Syntelix)
- **Relacionada a:** PRD §5.1, §7, §9 (8º item); ADR-0004 (pnpm/SEA), ADR-0007 (bearer)

## Contexto

O self-host guarda segredos: o **token da API do Kommo** e, no cenário remoto, o
**bearer** (ADR-0007). O anti-padrão a eliminar é o do repositório anterior, cujo
Dockerfile **copiava o `.env` para dentro da imagem**. O PRD §7 exige: segredos
**jamais commitados**; produção usa variáveis de ambiente / secret manager.

Dois fatos técnicos moldam a decisão:

- **Dependência nativa do cofre do SO.** Acessar Keychain (macOS), Credential
  Manager (Windows) ou libsecret (Linux) em Node exige módulo nativo. O histórico
  `keytar` (Electron) está **arquivado/descontinuado**; o substituto ativo e
  cross-platform é **`@napi-rs/keyring`** (Rust + napi, com prebuilds). Módulo
  nativo implica prebuilds por SO e **interage com a ressalva de bundler/SEA no
  Windows** registrada no ADR-0004.
- **Realidade headless.** Em **VPS/container normalmente não há cofre do SO**
  (sem libsecret/D-Bus no container). Portanto o "fallback" não é exceção rara — é
  o **modo normal de operação de servidor**.

## Alternativas consideradas

1. **Cofre do SO preferencial + camadas por ambiente** (escolhida).
   - **Prós:** melhor proteção no desktop; caminho de primeira classe para
     servidores headless (env/secret manager); nunca embute segredo na imagem.
   - **Contras:** dependência de módulo nativo (`@napi-rs/keyring`) e seus
     prebuilds; lógica de seleção por ambiente.

2. **Sempre `.env`/arquivo simples.**
   - **Contras:** baixa segurança; foi a origem do anti-padrão (segredo vazando
     para a imagem/git).

3. **Arquivo cifrado com chave-mestra própria.**
   - **Contras:** o problema só se desloca para "onde guardar a chave-mestra"; sem
     um cofre, não há ganho real sobre o cofre do SO.

## Decisão

Política de armazenamento **em camadas, por ambiente**, com a regra dura herdada
do anti-padrão: **segredo nunca entra na imagem e nunca no git.**

| Ambiente | Armazenamento |
|---|---|
| Desktop self-host (Win/macOS/Linux com sessão) | **Cofre do SO** via módulo de keyring |
| VPS/container headless | **Variável de ambiente / secret manager** (caminho de primeira classe, não "fallback de segunda") |
| Último recurso | **Arquivo de config protegido** (permissões restritas), fora do controle de versão |

Para o cofre do SO, o candidato é **`@napi-rs/keyring`** (substituindo o `keytar`
descontinuado). Seguindo o mesmo critério do ADR-0007 (não fixar dependência não
validada em ADR imutável), a **fixação definitiva da biblioteca de keyring fica
para a spec de implementação**, que também deve revalidá-la contra o follow-up de
binário SEA (ADR-0004).

## Consequências

- **Positivas:** segredos protegidos pelo cofre do SO no desktop; caminho headless
  limpo e padrão (env/secret manager) para servidores; o anti-padrão de embutir
  `.env` na imagem fica estruturalmente impossível por política.
- **Negativas / custos:** dependência de módulo nativo com prebuilds por SO e a
  revalidar no empacotamento SEA/Windows; o código precisa detectar o ambiente e
  escolher a camada de armazenamento correta; documentação clara para o usuário
  headless sobre onde colocar o segredo.
- **Follow-ups:**
  - Spec do wizard de setup (self-host): fixar a lib de keyring, implementar a
    seleção por ambiente e a escrita segura; garantir que `.env`/segredos estejam
    no `.gitignore` e fora de qualquer imagem.
  - Revalidar o módulo nativo no follow-up de binário SEA (ADR-0004).
