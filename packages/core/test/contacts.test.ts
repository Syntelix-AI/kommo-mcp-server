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

  it("gets a contact by id", async () => {
    const fetchMock = mockFetch([
      jsonResponse(200, { id: 42, name: "Carlos" })
    ]);
    const client = createKommoClient(
      { subdomain: "acme", accessToken: "token" },
      { fetch: fetchMock }
    );

    await expect(client.getContact(42)).resolves.toMatchObject({
      id: 42,
      name: "Carlos"
    });
    expect(fetchMock.calls[0]?.url).toContain("/api/v4/contacts/42");
  });

  it("creates a contact with name, phone and email and returns it", async () => {
    const fetchMock = mockFetch([
      jsonResponse(200, {
        _embedded: {
          contacts: [
            {
              id: 77,
              name: "Diana",
              custom_fields_values: [
                { field_code: "PHONE", values: [{ value: "+5511999990000" }] },
                { field_code: "EMAIL", values: [{ value: "diana@exemplo.com" }] }
              ]
            }
          ]
        }
      })
    ]);
    const client = createKommoClient(
      { subdomain: "acme", accessToken: "token" },
      { fetch: fetchMock }
    );

    const contact = await client.createContact({
      name: "Diana",
      phone: "+5511999990000",
      email: "diana@exemplo.com"
    });

    expect(contact).toMatchObject({ id: 77, name: "Diana" });
    expect(fetchMock.calls[0]?.init?.method).toBe("POST");
    const body = JSON.parse(String(fetchMock.calls[0]?.init?.body));
    expect(body).toEqual([
      {
        name: "Diana",
        custom_fields_values: [
          { field_code: "PHONE", values: [{ value: "+5511999990000" }] },
          { field_code: "EMAIL", values: [{ value: "diana@exemplo.com" }] }
        ]
      }
    ]);
  });

  it("updates a contact name via PATCH", async () => {
    const fetchMock = mockFetch([
      jsonResponse(200, { id: 88, name: "Novo Nome" })
    ]);
    const client = createKommoClient(
      { subdomain: "acme", accessToken: "token" },
      { fetch: fetchMock }
    );

    const contact = await client.updateContact(88, { name: "Novo Nome" });

    expect(contact).toMatchObject({ id: 88, name: "Novo Nome" });
    expect(fetchMock.calls[0]?.init?.method).toBe("PATCH");
    expect(fetchMock.calls[0]?.url).toContain("/api/v4/contacts/88");
    const body = JSON.parse(String(fetchMock.calls[0]?.init?.body));
    expect(body).toEqual({ name: "Novo Nome" });
  });
});
