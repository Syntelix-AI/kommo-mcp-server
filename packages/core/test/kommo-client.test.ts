import { describe, expect, it, vi } from "vitest";

import {
  KOMMO_ENV,
  KommoConfigError,
  createKommoClient,
  createKommoClientFromEnv
} from "../src/index.js";

import type { FetchLike, KommoAccount } from "../src/index.js";

function mockFetch(response: Response): FetchLike & {
  calls: { url: string; init?: RequestInit }[];
} {
  const calls: { url: string; init?: RequestInit }[] = [];
  const fn = vi.fn(async (url: string | URL | Request, init?: RequestInit) => {
    calls.push({ url: String(url), init });
    return response;
  }) as unknown as FetchLike & { calls: typeof calls };
  Object.defineProperty(fn, "calls", { value: calls });
  return fn;
}

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" }
  });
}

describe("KommoClient", () => {
  it("creates a client from env and returns a typed account", async () => {
    const accountBody: KommoAccount = {
      id: 12345,
      name: "Acme",
      subdomain: "acme",
      timezone: "America/Sao_Paulo"
    };
    const fetchMock = mockFetch(jsonResponse(200, accountBody));

    const client = createKommoClientFromEnv(
      {
        [KOMMO_ENV.subdomain]: "acme",
        [KOMMO_ENV.accessToken]: "token-longa-duracao"
      },
      { fetch: fetchMock }
    );

    const account = await client.getAccount();

    expect(account).toEqual(accountBody);
    expect(fetchMock.calls[0]?.url).toBe("https://acme.kommo.com/api/v4/account");
    const headers = new Headers(fetchMock.calls[0]?.init?.headers as HeadersInit);
    expect(headers.get("authorization")).toBe("Bearer token-longa-duracao");
  });

  it("fails before creating a request when env is incomplete", () => {
    const fetchMock = mockFetch(jsonResponse(200, {}));

    expect(() =>
      createKommoClientFromEnv(
        {
          [KOMMO_ENV.subdomain]: "acme"
        },
        { fetch: fetchMock }
      )
    ).toThrow(KommoConfigError);

    expect(fetchMock.calls).toHaveLength(0);
  });

  it("creates a client from an already validated config", async () => {
    const fetchMock = mockFetch(jsonResponse(200, { id: 1, name: "Acme" }));
    const client = createKommoClient(
      { subdomain: "acme", accessToken: "token" },
      { fetch: fetchMock }
    );

    await expect(client.getAccount()).resolves.toMatchObject({ id: 1 });
  });

  it("lists pipelines with embedded statuses", async () => {
    const fetchMock = mockFetch(
      jsonResponse(200, {
        _embedded: {
          pipelines: [
            {
              id: 10,
              name: "Vendas",
              sort: 1,
              is_main: true,
              _embedded: {
                statuses: [
                  { id: 101, name: "Novo", sort: 10, type: 1 },
                  { id: 142, name: "Ganho", sort: 100, type: 0 }
                ]
              }
            }
          ]
        }
      })
    );
    const client = createKommoClient(
      { subdomain: "acme", accessToken: "token" },
      { fetch: fetchMock }
    );

    const pipelines = await client.listPipelines();

    expect(pipelines).toEqual([
      {
        id: 10,
        name: "Vendas",
        sort: 1,
        is_main: true,
        _embedded: {
          statuses: [
            { id: 101, name: "Novo", sort: 10, type: 1 },
            { id: 142, name: "Ganho", sort: 100, type: 0 }
          ]
        }
      }
    ]);
    expect(fetchMock.calls[0]?.url).toContain(
      "https://acme.kommo.com/api/v4/leads/pipelines"
    );
  });
});
