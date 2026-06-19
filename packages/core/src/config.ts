import { KommoConfigError } from "./errors.js";

/**
 * Configuração necessária para operar o cliente Kommo.
 *
 * No M1 (stdio, headless) o segredo chega por variável de ambiente
 * (ADR-0008). Os nomes são fixados aqui e reutilizados pela spec 007.
 */
export interface KommoConfig {
  /** Subdomínio da conta (ex.: `minhaempresa` em `minhaempresa.kommo.com`). */
  readonly subdomain: string;
  /** Token de longa duração (enviado como `Authorization: Bearer {token}`). */
  readonly accessToken: string;
}

/** Nomes canônicos das variáveis de ambiente (reutilizados pela spec 007). */
export const KOMMO_ENV = {
  subdomain: "KOMMO_SUBDOMAIN",
  accessToken: "KOMMO_ACCESS_TOKEN"
} as const;

/**
 * Lê e valida a configuração a partir de um mapa de ambiente (default: `process.env`).
 *
 * Falha com {@link KommoConfigError} e mensagem acionável — nunca um stack trace cru —
 * quando `subdomain` ou `accessToken` estão ausentes/vazios.
 *
 * @param env Mapa de ambiente. Útil para testes; default `process.env`.
 */
export function loadKommoConfig(
  env: Record<string, string | undefined> = process.env
): KommoConfig {
  const subdomain = (env[KOMMO_ENV.subdomain] ?? "").trim();
  const accessToken = (env[KOMMO_ENV.accessToken] ?? "").trim();

  const missing: string[] = [];
  if (subdomain.length === 0) {
    missing.push(KOMMO_ENV.subdomain);
  }
  if (accessToken.length === 0) {
    missing.push(KOMMO_ENV.accessToken);
  }
  if (missing.length > 0) {
    throw new KommoConfigError(
      `Configuração do Kommo incompleta: defina ${missing.join(" e ")} no ambiente. ` +
        `Consulte o .env.example para saber como configurar.`
    );
  }

  if (!/^[a-z0-9-]+$/i.test(subdomain)) {
    throw new KommoConfigError(
      `"${KOMMO_ENV.subdomain}" contém caracteres inválidos para um subdomínio: "${redact(subdomain)}".`
    );
  }

  return { subdomain, accessToken };
}

/** Evita vazar o conteúdo do input quando o campo NÃO é o token (apenas sanitiza comprimento). */
function redact(value: string): string {
  const trimmed = value.trim();
  if (trimmed.length <= 12) {
    return trimmed;
  }
  return `${trimmed.slice(0, 4)}…${trimmed.slice(-4)}`;
}
