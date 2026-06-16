import { describe, expect, it } from "vitest";

import { createPackageIdentity } from "../src/index.js";

describe("createPackageIdentity", () => {
  it("returns the requested package role", () => {
    expect(createPackageIdentity("core")).toEqual({
      name: "kommo-mcp-server",
      role: "core",
      version: "0.0.0"
    });
  });
});
