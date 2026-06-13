# Política de Segurança

## Reportando uma vulnerabilidade

Se você encontrar uma vulnerabilidade de segurança, **não abra uma issue
pública**. Em vez disso, use os
[Security Advisories privados do GitHub](https://github.com/Syntelix-AI/kommo-mcp-server/security/advisories/new)
ou entre em contato diretamente com a Syntelix.

Faremos o possível para responder em tempo hábil e creditar quem reportar,
quando desejado.

## Boas práticas para usuários

- **Tokens do Kommo** e qualquer credencial nunca devem ser commitados. Use
  variáveis de ambiente ou um gerenciador de segredos.
- No formato self-hosted, prefira armazenamento seguro do SO para o token
  (Keychain no macOS, Credential Manager no Windows, libsecret no Linux).
- No formato web/VPS, exponha o servidor sempre atrás de HTTPS e com
  autenticação ativa.
