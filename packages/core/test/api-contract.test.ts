import { describe, expect, it } from "vitest";

import {
  KOMMO_API_CONTRACT,
  buildKommoApiBaseUrl,
  getKommoApiOperation,
  renderKommoApiPath
} from "../src/index.js";

describe("KOMMO_API_CONTRACT", () => {
  it("records the official Kommo API transport and limits used by the client", () => {
    expect(buildKommoApiBaseUrl("acme")).toBe("https://acme.kommo.com/api/v4");
    expect(KOMMO_API_CONTRACT.transport.authScheme).toBe("Bearer");
    expect(KOMMO_API_CONTRACT.limits.requestsPerSecond).toBe(7);
    expect(KOMMO_API_CONTRACT.limits.maxPageLimit).toBe(250);
    expect(KOMMO_API_CONTRACT.limits.recommendedBatchEntities).toBe(50);
  });

  it("renders documented path templates without guessing path params", () => {
    expect(
      renderKommoApiPath(KOMMO_API_CONTRACT.operations.getLead.path, { id: 123 })
    ).toBe("/leads/123");
    expect(() =>
      renderKommoApiPath(KOMMO_API_CONTRACT.operations.getLead.path)
    ).toThrow("Missing Kommo API path parameter: id");
  });

  it("maps M1 MCP tools to the documented API operations", () => {
    expect(getKommoApiOperation("getAccount")).toMatchObject({
      method: "GET",
      path: "/account",
      readOnly: true,
      mcpTools: ["get_account"]
    });
    expect(getKommoApiOperation("listPipelines")).toMatchObject({
      method: "GET",
      path: "/leads/pipelines",
      embeddedKey: "pipelines",
      mcpTools: ["list_pipelines"]
    });
    expect(getKommoApiOperation("createLeads")).toMatchObject({
      method: "POST",
      path: "/leads",
      requestBody: "array-of-objects",
      readOnly: false,
      idempotent: false,
      mcpTools: ["create_lead"]
    });
    expect(getKommoApiOperation("updateLead")).toMatchObject({
      method: "PATCH",
      path: "/leads/{id}",
      idempotent: true,
      mcpTools: ["update_lead", "move_lead"]
    });
    expect(getKommoApiOperation("createContacts")).toMatchObject({
      method: "POST",
      path: "/contacts",
      requestBody: "array-of-objects",
      mcpTools: ["create_contact"]
    });
  });

  it("keeps future CRM nucleus endpoints explicit instead of undocumented", () => {
    expect(getKommoApiOperation("listEvents")).toMatchObject({
      path: "/events",
      readOnly: true,
      phase: "m1-next"
    });
    expect(getKommoApiOperation("pinNote")).toMatchObject({
      method: "POST",
      path: "/{entity_type}/notes/{id}/pin",
      idempotent: true
    });
    expect(getKommoApiOperation("listLossReasons")).toMatchObject({
      method: "GET",
      path: "/leads/loss_reasons",
      readOnly: true
    });
  });

  it("documents deferred non-CRM or higher-risk surfaces separately", () => {
    expect(KOMMO_API_CONTRACT.deferredSurfaces.chats.phase).toBe("future");
    expect(KOMMO_API_CONTRACT.deferredSurfaces.customFields.phase).toBe("phase-2");
    expect(KOMMO_API_CONTRACT.deferredSurfaces.webhooks.reason).toContain("stdio");
  });
});
