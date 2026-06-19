import { describe, expect, it, vi } from "vitest";

import { createKommoClient } from "../src/index.js";

import type { FetchLike } from "../src/index.js";

function mockFetch(responses: Response[]): FetchLike & {
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
    return next;
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

describe("KommoClient contacts", () => {
  it("lists contacts with query filter and pagination", async () => {
    const fetchMock = mockFetch([
      jsonResponse(200, {
        _embedded: {
          contacts: [{ id: 1, name: "Ana" }]
        },
        _links: { next: { href: "https://example/next" } }
      }),
      jsonResponse(200, {
        _embedded: {
          contacts: [{ id: 2, name: "Bruno" }]
        }
      })
    ]);
    const client = createKommoClient(
      { subdomain: "acme", accessToken: "token" },
      { fetch: fetchMock }
    );

    const contacts = await client.listContacts({
      query: "a",
      limit: 1,
      maxPages: 2
    });

    expect(contacts.map((c) => c.id)).toEqual([1, 2]);
    const firstUrl = new URL(fetchMock.calls[0]?.url ?? "");
    expect(firstUrl.pathname).toBe("/api/v4/contacts");
    expect(firstUrl.searchParams.get("query")).toBe("a");
  });
});
