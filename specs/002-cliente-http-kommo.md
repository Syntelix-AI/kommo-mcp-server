# Spec 002: Cliente HTTP do Kommo (core)

- **Épico:** E1 — Core MCP + CRM núcleo (M1)
- **Status:** Done
- **Relacionada a:** PRD §5.2, §7; ADR-0001, ADR-0004, ADR-0008
- **Estimativa:** M

## Objetivo

Implementar no pacote `core` o cliente HTTP tipado para a API v4 do Kommo:
autenticação por token, montagem de URL por subdomínio, paginação, tratamento de
rate limit e mapeamento de erros. É a camada que todas as tools consomem.

## Não-objetivos

- Definir/registrar tools MCP (specs 003+).
- Cofre do SO / wizard de credenciais (Fase 2) — aqui o token vem por
  **variável de ambiente** (ADR-0008, modo headless/stdio do M1).
- Cobrir endpoints fora do núcleo do M1.
- Cache de dados de negócio (PRD §7 proíbe cache sem expiração/armazenamento oculto).

## Contexto técnico

- **API Kommo v4:** base `https://{subdomain}.kommo.com/api/v4/`; autenticação por
  **token de longa duração** via header `Authorization: Bearer {token}`. Respostas
  usam HAL (`_embedded`, `_links`, `_page`); listagens paginam por `page`/`limit`.
- **Config por env (ADR-0008):** `KOMMO_SUBDOMAIN` e `KOMMO_ACCESS_TOKEN` (nomes a
  confirmar na implementação). Validar presença e falhar com erro claro se ausentes.
- **Rate limit:** a API limita requisições/seg; o cliente deve tratar `429`
  (respeitar `Retry-After`, com backoff) sem travar o processo.
- `core` permanece sem dependência de transporte MCP (ADR-0004).

## Tarefas

- [x] Leitura/validação da config (`subdomain`, `token`) a partir do ambiente.
- [x] Wrapper HTTP base: baseURL, headers de auth, timeout, parsing de JSON/HAL.
- [x] Helper de paginação que itera `_embedded` por páginas até o fim ou um limite.
- [x] Mapeamento de erros: distinguir erro de **autenticação** (401/403), **não
      encontrado** (404), **validação** (400/422) e **rate limit** (429) em tipos de
      erro internos consumíveis pela camada de tools.
- [x] Tratamento de `429` com `Retry-After`/backoff.
- [x] Testes unitários com HTTP mockado (sucesso, 401, 404, 422, 429, paginação).

## Critérios de aceite (testáveis)

- [x] Com env válido, uma chamada `GET account` retorna o objeto da conta tipado.
- [x] Sem `KOMMO_ACCESS_TOKEN`/`KOMMO_SUBDOMAIN`, o cliente falha com mensagem
      acionável (não stack trace cru).
- [x] O helper de paginação concatena corretamente múltiplas páginas de `_embedded`
      (testado com 2+ páginas mockadas).
- [x] Respostas 401/404/422/429 são mapeadas para os tipos de erro esperados
      (asserções unitárias).
- [x] Um `429` com `Retry-After` dispara retry e eventual sucesso no mock.
- [x] Nenhum segredo é logado.

## Fora de escopo / riscos

- Refresh de OAuth/token de curta duração não se aplica ao M1 (token de longa
  duração); OAuth é da camada remota (ADR-0007), fase futura.
- Os nomes exatos das variáveis de ambiente são fixados nesta spec e reusados pela
  spec 007.
