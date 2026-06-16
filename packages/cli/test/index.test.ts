import { describe, expect, it } from "vitest";

import { describeCli } from "../src/index.js";

describe("describeCli", () => {
  it("uses the core package identity", () => {
    expect(describeCli()).toBe("kommo-mcp-server:cli");
  });
});
