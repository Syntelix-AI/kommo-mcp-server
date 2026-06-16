import { describe, expect, it } from "vitest";

import { createServerSkeleton } from "../src/index.js";

describe("createServerSkeleton", () => {
  it("uses the core package identity", () => {
    expect(createServerSkeleton()).toEqual({
      name: "kommo-mcp-server",
      role: "server",
      status: "not-implemented"
    });
  });
});
