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

describe("KommoClient leads", () => {
  it("lists leads with query, pipeline/status filters and pagination", async () => {
    const fetchMock = mockFetch([
      jsonResponse(200, {
        _embedded: {
          leads: [
            {
              id: 1,
              name: "Lead A",
              price: 1000,
              pipeline_id: 10,
              status_id: 101
            }
          ]
        },
        _links: { next: { href: "https://example/next" } }
      }),
      jsonResponse(200, {
        _embedded: {
          leads: [
            {
              id: 2,
              name: "Lead B",
              price: 2000,
              pipeline_id: 10,
              status_id: 102
            }
          ]
        }
      })
    ]);
    const client = createKommoClient(
      { subdomain: "acme", accessToken: "token" },
      { fetch: fetchMock }
    );

    const leads = await client.listLeads({
      query: "Lead",
      pipelineId: 10,
      statusId: 101,
      limit: 1,
      maxPages: 2
    });

    expect(leads.map((lead) => lead.id)).toEqual([1, 2]);
    const firstUrl = new URL(fetchMock.calls[0]?.url ?? "");
    expect(firstUrl.pathname).toBe("/api/v4/leads");
    expect(firstUrl.searchParams.get("query")).toBe("Lead");
    expect(firstUrl.searchParams.get("filter[statuses][0][pipeline_id]")).toBe("10");
    expect(firstUrl.searchParams.get("filter[statuses][0][status_id]")).toBe("101");
  });

  it("gets a lead by id", async () => {
    const fetchMock = mockFetch([jsonResponse(200, { id: 123, name: "Lead" })]);
    const client = createKommoClient(
      { subdomain: "acme", accessToken: "token" },
      { fetch: fetchMock }
    );

    await expect(client.getLead(123)).resolves.toMatchObject({ id: 123 });
    expect(fetchMock.calls[0]?.url).toContain("/api/v4/leads/123");
  });

  it("creates a lead using Kommo array payload and returns the created lead", async () => {
    const fetchMock = mockFetch([
      jsonResponse(200, { _embedded: { leads: [{ id: 123, name: "Novo" }] } })
    ]);
    const client = createKommoClient(
      { subdomain: "acme", accessToken: "token" },
      { fetch: fetchMock }
    );

    const lead = await client.createLead({ name: "Novo", price: 5000 });

    expect(lead).toEqual({ id: 123, name: "Novo" });
    expect(fetchMock.calls[0]?.init?.method).toBe("POST");
    expect(fetchMock.calls[0]?.init?.body).toBe(
      JSON.stringify([{ name: "Novo", price: 5000 }])
    );
  });

  it("updates a lead by id", async () => {
    const fetchMock = mockFetch([
      jsonResponse(200, { id: 123, name: "Atualizado", price: 7000 })
    ]);
    const client = createKommoClient(
      { subdomain: "acme", accessToken: "token" },
      { fetch: fetchMock }
    );

    const lead = await client.updateLead(123, { name: "Atualizado", price: 7000 });

    expect(lead).toMatchObject({ id: 123, name: "Atualizado", price: 7000 });
    expect(fetchMock.calls[0]?.init?.method).toBe("PATCH");
    expect(fetchMock.calls[0]?.init?.body).toBe(
      JSON.stringify({ name: "Atualizado", price: 7000 })
    );
  });

  it("moves a lead by patching pipeline_id and status_id", async () => {
    const fetchMock = mockFetch([
      jsonResponse(200, { id: 123, pipeline_id: 20, status_id: 201 })
    ]);
    const client = createKommoClient(
      { subdomain: "acme", accessToken: "token" },
      { fetch: fetchMock }
    );

    const lead = await client.moveLead(123, { pipelineId: 20, statusId: 201 });

    expect(lead).toMatchObject({ id: 123, pipeline_id: 20, status_id: 201 });
    expect(fetchMock.calls[0]?.init?.body).toBe(
      JSON.stringify({ pipeline_id: 20, status_id: 201 })
    );
  });
});
