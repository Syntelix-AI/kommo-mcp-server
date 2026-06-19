import { describe, expect, it, vi } from "vitest";

import {
  KommoAuthError,
  KommoNotFoundError,
  KommoRateLimitError,
  KommoValidationError,
  createKommoHttpClient
} from "../src/index.js";

import type { FetchLike } from "../src/index.js";

/** Cria um mock de fetch com fila de respostas. */
function mockFetch(responses: (Response | (() => Response))[]): FetchLike & {
  calls: { url: string; init?: RequestInit }[];
} {
  const queue = [...responses];
  const calls: { url: string; init?: RequestInit }[] = [];
  const fn = vi.fn(async (url: string | URL | Request, init?: RequestInit) => {
    calls.push({ url: String(url), init });
    const next = queue.shift();
    if (next === undefined) {
      throw new Error("mockFetch: fila de respostas esgotada");
    }
    return typeof next === "function" ? next() : next;
  }) as unknown as FetchLike & { calls: typeof calls };
  Object.defineProperty(fn, "calls", { value: calls });
  return fn;
}

function jsonResponse(
  status: number,
  body: unknown,
  headers: Record<string, string> = {}
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", ...headers }
  });
}

describe("KommoHttpClient", () => {
  it("GET account returns typed payload", async () => {
    const fetchMock = mockFetch([
      jsonResponse(200, { id: 12345, name: "Acme", subdomain: "acme" })
    ]);
    const client = createKommoHttpClient("acme", "token", { fetch: fetchMock });
    const account = await client.get<{ id: number; name: string }>("/account");
    expect(account).toEqual({ id: 12345, name: "Acme", subdomain: "acme" });
    expect(fetchMock.calls[0]?.url).toContain("https://acme.kommo.com/api/v4/account");
  });

  it("sends Authorization: Bearer {token}", async () => {
    const fetchMock = mockFetch([jsonResponse(200, {})] as Response[]);
    const client = createKommoHttpClient("acme", "secret-token", { fetch: fetchMock });
    await client.get("/account");
    const headers = new Headers(fetchMock.calls[0]?.init?.headers as HeadersInit);
    expect(headers.get("authorization")).toBe("Bearer secret-token");
  });

  it("serializes query params", async () => {
    const fetchMock = mockFetch([jsonResponse(200, {})] as Response[]);
    const client = createKommoHttpClient("acme", "token", { fetch: fetchMock });
    await client.get("/leads", { query: { page: 2, limit: 10, with: "contacts" } });
    const firstCall = fetchMock.calls[0];
    expect(firstCall).toBeDefined();
    const url = new URL(firstCall?.url ?? "");
    expect(url.searchParams.get("page")).toBe("2");
    expect(url.searchParams.get("limit")).toBe("10");
    expect(url.searchParams.get("with")).toBe("contacts");
  });

  it("POST sends JSON body and Content-Type", async () => {
    const fetchMock = mockFetch([jsonResponse(200, { ok: true })]);
    const client = createKommoHttpClient("acme", "token", { fetch: fetchMock });
    await client.post("/leads", { name: "Novo Lead" });
    const firstCall = fetchMock.calls[0];
    expect(firstCall).toBeDefined();
    const init = firstCall?.init;
    expect(init?.method).toBe("POST");
    expect(init?.body).toBe(JSON.stringify({ name: "Novo Lead" }));
    const headers = new Headers((init?.headers ?? {}) as HeadersInit);
    expect(headers.get("content-type")).toBe("application/json");
  });

  it("maps 401 to KommoAuthError", async () => {
    const fetchMock = mockFetch([
      jsonResponse(401, { title: "Unauthorized", detail: "token inválido" })
    ]);
    const client = createKommoHttpClient("acme", "bad", { fetch: fetchMock });
    await expect(client.get("/account")).rejects.toBeInstanceOf(KommoAuthError);
  });

  it("maps 404 to KommoNotFoundError", async () => {
    const fetchMock = mockFetch([jsonResponse(404, undefined)]);
    const client = createKommoHttpClient("acme", "token", { fetch: fetchMock });
    await expect(client.get("/leads/9999")).rejects.toBeInstanceOf(KommoNotFoundError);
  });

  it("maps 422 to KommoValidationError", async () => {
    const fetchMock = mockFetch([
      jsonResponse(422, { title: "Validation Error", detail: "name is required" })
    ]);
    const client = createKommoHttpClient("acme", "token", { fetch: fetchMock });
    await expect(client.post("/leads", {})).rejects.toBeInstanceOf(
      KommoValidationError
    );
  });

  it("retries on 429 with Retry-After and eventually succeeds", async () => {
    const fetchMock = mockFetch([
      jsonResponse(429, { title: "Too Many Requests" }, { "retry-after": "0" }),
      jsonResponse(200, { id: 1 })
    ]);
    const sleep = vi.fn().mockResolvedValue(undefined);
    const client = createKommoHttpClient("acme", "token", {
      fetch: fetchMock,
      sleep,
      maxRetries: 3
    });
    const result = await client.get<{ id: number }>("/account");
    expect(result).toEqual({ id: 1 });
    expect(fetchMock.calls).toHaveLength(2);
    expect(sleep).toHaveBeenCalledTimes(1);
  });

  it("throws KommoRateLimitError after exhausting retries", async () => {
    const fetchMock = mockFetch([
      jsonResponse(429, undefined, { "retry-after": "0" }),
      jsonResponse(429, undefined, { "retry-after": "0" }),
      jsonResponse(429, undefined, { "retry-after": "0" }),
      jsonResponse(429, undefined, { "retry-after": "0" })
    ]);
    const client = createKommoHttpClient("acme", "token", {
      fetch: fetchMock,
      sleep: async () => undefined,
      maxRetries: 3
    });
    await expect(client.get("/account")).rejects.toBeInstanceOf(KommoRateLimitError);
    expect(fetchMock.calls).toHaveLength(4);
  });

  it("does not log the token in error messages", async () => {
    const fetchMock = mockFetch([jsonResponse(401, undefined)]);
    const client = createKommoHttpClient("acme", "super-secret-token-value", {
      fetch: fetchMock
    });
    try {
      await client.get("/account");
    } catch (error) {
      expect((error as Error).message).not.toContain("super-secret-token-value");
    }
  });
});
