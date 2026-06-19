/**
 * Tipos de erro do cliente Kommo.
 *
 * Cada classe representa uma categoria distinta de falha, de modo que a camada de
 * tools (spec 003+) consiga reagir (ex.: 401 → `isError`, 429 → retry) sem precisar
 * inspecionar o status HTTP bruto.
 */

/** Falha de configuração (env ausente/inválido). Lançada antes de qualquer chamada. */
export class KommoConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "KommoConfigError";
  }
}

/** Erro de rede/conexão (DNS offline, timeout de conexão, etc.). */
export class KommoNetworkError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "KommoNetworkError";
  }
}

/** Base para erros mapeados a partir de uma resposta HTTP do Kommo. */
export abstract class KommoHttpError extends Error {
  /** Status HTTP retornado pelo Kommo. */
  readonly status: number;
  /** Corpo bruto (objeto) quando disponível, para diagnóstico. */
  readonly body?: unknown;

  constructor(status: number, message: string, body?: unknown) {
    super(message);
    this.name = "KommoHttpError";
    this.status = status;
    if (body !== undefined) {
      this.body = body;
    }
  }
}

/** 401/403 — token ausente, inválido ou sem permissão. */
export class KommoAuthError extends KommoHttpError {
  constructor(status: number, message: string, body?: unknown) {
    super(status, message, body);
    this.name = "KommoAuthError";
  }
}

/** 404 — recurso não encontrado. */
export class KommoNotFoundError extends KommoHttpError {
  constructor(status: number, message: string, body?: unknown) {
    super(status, message, body);
    this.name = "KommoNotFoundError";
  }
}

/** 400/422 — falha de validação do payload pelo Kommo. */
export class KommoValidationError extends KommoHttpError {
  constructor(status: number, message: string, body?: unknown) {
    super(status, message, body);
    this.name = "KommoValidationError";
  }
}

/** 429 — limite de requisições excedido. */
export class KommoRateLimitError extends KommoHttpError {
  /** Segundos sugeridos pelo header `Retry-After`, quando presente. */
  readonly retryAfterSeconds?: number;

  constructor(
    status: number,
    message: string,
    body?: unknown,
    retryAfterSeconds?: number
  ) {
    super(status, message, body);
    this.name = "KommoRateLimitError";
    if (retryAfterSeconds !== undefined) {
      this.retryAfterSeconds = retryAfterSeconds;
    }
  }
}

/** Qualquer outro status HTTP não esperado (5xx, etc.). */
export class KommoUnexpectedHttpError extends KommoHttpError {
  constructor(status: number, message: string, body?: unknown) {
    super(status, message, body);
    this.name = "KommoUnexpectedHttpError";
  }
}

/**
 * Converte um status HTTP + corpo em um erro tipado.
 * Centraliza o mapeamento para que o cliente HTTP e os testes usem a mesma lógica.
 */
export function mapHttpStatusToError(status: number, body: unknown): KommoHttpError {
  const detail = extractErrorDetail(body);
  switch (status) {
    case 401:
    case 403:
      return new KommoAuthError(
        status,
        `Falha de autenticação (HTTP ${status}). ${detail}`.trim(),
        body
      );
    case 404:
      return new KommoNotFoundError(
        status,
        `Recurso não encontrado (HTTP 404). ${detail}`.trim(),
        body
      );
    case 400:
    case 422:
      return new KommoValidationError(
        status,
        `Erro de validação do Kommo (HTTP ${status}). ${detail}`.trim(),
        body
      );
    case 429:
      return new KommoRateLimitError(
        status,
        `Limite de requisições excedido (HTTP 429). ${detail}`.trim(),
        body
      );
    default:
      return new KommoUnexpectedHttpError(
        status,
        `Resposta inesperada do Kommo (HTTP ${status}). ${detail}`.trim(),
        body
      );
  }
}

/** Extrai uma mensagem humana de um corpo de erro típico do Kommo (`{ title, detail }`). */
function extractErrorDetail(body: unknown): string {
  if (body === undefined) {
    return "";
  }
  if (typeof body === "object" && body !== null) {
    const record = body as Record<string, unknown>;
    const title = typeof record["title"] === "string" ? record["title"] : "";
    const detail = typeof record["detail"] === "string" ? record["detail"] : "";
    const merged = [title, detail].filter(Boolean).join(": ");
    if (merged) {
      return merged;
    }
  }
  return "";
}
