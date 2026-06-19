import {
  KommoNetworkError,
  KommoRateLimitError,
  mapHttpStatusToError
} from "./errors.js";
import { KOMMO_API_CONTRACT, buildKommoApiBaseUrl } from "./api-contract.js";

/**
 * Função `fetch` injetável. Default: a global `fetch` do Node 22+.
 * Tests podem injetar um mock sem tocar no código de produção.
 */
export type FetchLike = typeof fetch;

/** Parâmetros opcionais de uma requisição ao Kommo. */
export interface KommoRequestOptions {
  /** Query string como record (valores serializados com `URLSearchParams`). */
  readonly query?: Record<string, string | number | boolean | undefined>;
  /** Corpo JSON serializável (POST/PATCH/PUT). */
  readonly body?: unknown;
  /** Tempo máximo de espera por requisição, em ms (default: 30_000). */
  readonly timeoutMs?: number;
}

interface KommoHttpClientOptions {
  /** Base URL já montada (ex.: `https://sub.kommo.com/api/v4`). */
  readonly baseUrl: string;
  /** Token de longa duração (Bearer). */
  readonly accessToken: string;
  /** Opções de runtime injetáveis para teste/controle operacional. */
  readonly runtime?: KommoHttpClientRuntimeOptions;
}

/** Opções de runtime do cliente HTTP que não fazem parte da credencial/base URL. */
export interface KommoHttpClientRuntimeOptions {
  /** `fetch` injetável (default: global). */
  readonly fetch?: FetchLike;
  /** Tempo limite por requisição (default 30s). */
  readonly defaultTimeoutMs?: number;
  /** Número máximo de tentativas em 429 (default 3). */
  readonly maxRetries?: number;
  /** Função de espera (default `setTimeout`); facilita testes. */
  readonly sleep?: (ms: number) => Promise<void>;
}

/** Constrói o {@link KommoHttpClient} a partir da config do Kommo. */
export function createKommoHttpClient(
  subdomain: string,
  accessToken: string,
  options: KommoHttpClientRuntimeOptions = {}
): KommoHttpClient {
  const baseUrl = buildKommoApiBaseUrl(subdomain);
  return new KommoHttpClient({ baseUrl, accessToken, runtime: options });
}

/**
 * Cliente HTTP de baixo nível para a API v4 do Kommo.
 *
 * Responsabilidades: montar URL, injetar `Authorization`, serializar query/body,
 * aplicar timeout, mapear erros por status e tratar `429` (respeitando
 * `Retry-After` com backoff). Não conhece o domínio (HAL/types vivem em `kommo.ts`).
 */
export class KommoHttpClient {
  private readonly baseUrl: string;
  private readonly accessToken: string;
  private readonly fetchFn: FetchLike;
  private readonly defaultTimeoutMs: number;
  private readonly maxRetries: number;
  private readonly sleep: (ms: number) => Promise<void>;

  constructor(options: KommoHttpClientOptions) {
    const runtime = options.runtime ?? {};
    this.baseUrl = options.baseUrl.replace(/\/$/, "");
    this.accessToken = options.accessToken;
    this.fetchFn = runtime.fetch ?? fetch;
    this.defaultTimeoutMs = runtime.defaultTimeoutMs ?? 30_000;
    this.maxRetries = runtime.maxRetries ?? 3;
    this.sleep = runtime.sleep ?? defaultSleep;
  }

  async get<T>(path: string, options: KommoRequestOptions = {}): Promise<T> {
    return this.request<T>("GET", path, options);
  }

  async post<T>(
    path: string,
    body: unknown,
    options: Omit<KommoRequestOptions, "body"> = {}
  ): Promise<T> {
    return this.request<T>("POST", path, { ...options, body });
  }

  async patch<T>(
    path: string,
    body: unknown,
    options: Omit<KommoRequestOptions, "body"> = {}
  ): Promise<T> {
    return this.request<T>("PATCH", path, { ...options, body });
  }

  private buildUrl(path: string, query?: KommoRequestOptions["query"]): string {
    const url = new URL(
      path.startsWith("http") ? path : `${this.baseUrl}/${path.replace(/^\//, "")}`
    );
    if (query) {
      for (const [key, value] of Object.entries(query)) {
        if (value !== undefined) {
          url.searchParams.set(key, String(value));
        }
      }
    }
    return url.toString();
  }

  private async request<T>(
    method: string,
    path: string,
    options: KommoRequestOptions
  ): Promise<T> {
    const url = this.buildUrl(path, options.query);
    const timeoutMs = options.timeoutMs ?? this.defaultTimeoutMs;
    const bodyPayload =
      options.body === undefined ? undefined : JSON.stringify(options.body);

    let attempt = 0;
    // Loop de retry: só re-tenta em 429 (KommoRateLimitError).
    while (true) {
      let response: Response;
      try {
        response = await this.fetchFn(
          url,
          this.buildInit(method, bodyPayload, timeoutMs)
        );
      } catch (cause) {
        // AbortError → tratar como falha de rede (timeout é um caso de rede).
        throw new KommoNetworkError(
          `Falha de rede ao chamar ${method} ${path}: ${describeCause(cause)}.`
        );
      }

      if (response.status === 429 && attempt < this.maxRetries) {
        const wait = computeRetryDelayMs(response, attempt);
        await this.sleep(wait);
        attempt += 1;
        continue;
      }

      if (!response.ok) {
        const parsedBody = await safeParseJson(response);
        const error =
          response.status === 429
            ? new KommoRateLimitError(
                429,
                "Limite de requisições excedido (HTTP 429) após todas as tentativas.",
                parsedBody
              )
            : mapHttpStatusToError(response.status, parsedBody);
        throw error;
      }

      // 204 ou corpo vazio → sem conteúdo.
      if (response.status === 204) {
        return undefined as T;
      }
      const text = await response.text();
      if (text.length === 0) {
        return undefined as T;
      }
      return JSON.parse(text) as T;
    }
  }

  private buildHeaders(hasBody: boolean): Record<string, string> {
    const headers: Record<string, string> = {
      Accept: KOMMO_API_CONTRACT.transport.defaultAccept,
      Authorization: `${KOMMO_API_CONTRACT.transport.authScheme} ${this.accessToken}`,
      "User-Agent": KOMMO_API_CONTRACT.transport.userAgent
    };
    if (hasBody) {
      headers["Content-Type"] = KOMMO_API_CONTRACT.transport.jsonContentType;
    }
    return headers;
  }

  /** Monta o RequestInit respeitando `exactOptionalPropertyTypes` (sem `body: undefined`). */
  private buildInit(
    method: string,
    bodyPayload: string | undefined,
    timeoutMs: number
  ): RequestInit {
    const init: RequestInit = {
      method,
      headers: this.buildHeaders(bodyPayload !== undefined)
    };
    if (bodyPayload !== undefined) {
      init.body = bodyPayload;
    }
    if (timeoutMs > 0) {
      init.signal = AbortSignal.timeout(timeoutMs);
    }
    return init;
  }
}

/** Calcula o atraso de retry a partir do `Retry-After` (segundos) ou backoff exponencial. */
function computeRetryDelayMs(response: Response, attempt: number): number {
  const retryAfter = response.headers.get("retry-after");
  if (retryAfter) {
    const seconds = Number(retryAfter);
    if (Number.isFinite(seconds) && seconds > 0) {
      return Math.min(seconds * 1000, 30_000);
    }
    // Formato de data HTTP — usa diferença em ms; se inválido, cai no backoff.
    const dateMs = Date.parse(retryAfter);
    if (!Number.isNaN(dateMs)) {
      return Math.max(0, Math.min(dateMs - Date.now(), 30_000));
    }
  }
  // Backoff exponencial com teto de 30s: 250ms, 500ms, 1000ms…
  return Math.min(250 * 2 ** attempt, 30_000);
}

function defaultSleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function safeParseJson(response: Response): Promise<unknown> {
  try {
    const text = await response.text();
    if (text.length === 0) {
      return undefined;
    }
    return JSON.parse(text) as unknown;
  } catch {
    return undefined;
  }
}

function describeCause(cause: unknown): string {
  if (cause instanceof Error) {
    return cause.name === "TimeoutError" || cause instanceof DOMException
      ? `tempo limite excedido (${cause.name})`
      : cause.message;
  }
  return String(cause);
}
