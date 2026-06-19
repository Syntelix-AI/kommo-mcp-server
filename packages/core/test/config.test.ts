import { describe, expect, it } from "vitest";

import { KOMMO_ENV, loadKommoConfig } from "../src/index.js";
import { KommoConfigError } from "../src/index.js";

describe("loadKommoConfig", () => {
  it("reads subdomain and token from env", () => {
    const config = loadKommoConfig({
      [KOMMO_ENV.subdomain]: "minhaempresa",
      [KOMMO_ENV.accessToken]: "token-longa-duracao"
    });
    expect(config).toEqual({
      subdomain: "minhaempresa",
      accessToken: "token-longa-duracao"
    });
  });

  it("trims whitespace from values", () => {
    const config = loadKommoConfig({
      [KOMMO_ENV.subdomain]: "  minhaempresa  ",
      [KOMMO_ENV.accessToken]: "  token  "
    });
    expect(config.subdomain).toBe("minhaempresa");
    expect(config.accessToken).toBe("token");
  });

  it("throws KommoConfigError when token is missing (actionable, not a stack trace)", () => {
    expect(() => loadKommoConfig({ [KOMMO_ENV.subdomain]: "minhaempresa" })).toThrow(
      KommoConfigError
    );
  });

  it("throws KommoConfigError when subdomain is missing", () => {
    expect(() => loadKommoConfig({ [KOMMO_ENV.accessToken]: "token" })).toThrow(
      KommoConfigError
    );
  });

  it("mentions both env names when both are missing", () => {
    expect(() => loadKommoConfig({})).toThrow(/KOMMO_SUBDOMAIN e KOMMO_ACCESS_TOKEN/);
  });

  it("rejects a subdomain with invalid characters", () => {
    expect(() =>
      loadKommoConfig({
        [KOMMO_ENV.subdomain]: "https://evil.com",
        [KOMMO_ENV.accessToken]: "token"
      })
    ).toThrow(KommoConfigError);
  });

  it("does not expose the access token when reporting invalid config", () => {
    const secret = "token-super-secreto";
    try {
      loadKommoConfig({
        [KOMMO_ENV.subdomain]: "https://evil.com",
        [KOMMO_ENV.accessToken]: secret
      });
    } catch (error) {
      expect((error as Error).message).not.toContain(secret);
    }
  });
});
