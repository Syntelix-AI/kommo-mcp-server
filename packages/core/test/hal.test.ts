import { describe, expect, it } from "vitest";

import { paginateHal } from "../src/index.js";
import type { HalCollection } from "../src/index.js";

interface Lead {
  id: number;
  name: string;
}

function page(items: Lead[], hasNext = false): HalCollection<Lead> {
  return {
    _page: 1,
    _links: hasNext ? { next: { href: "https://example/next" } } : undefined,
    _embedded: { leads: items }
  };
}

describe("paginateHal", () => {
  it("concatenates multiple pages of _embedded", async () => {
    const fetchPage = async (pageNum: number) => {
      if (pageNum === 1) {
        return page(
          [
            { id: 1, name: "L1" },
            { id: 2, name: "L2" }
          ],
          true
        );
      }
      if (pageNum === 2) {
        return page([{ id: 3, name: "L3" }], false);
      }
      return undefined;
    };

    const result = await paginateHal(fetchPage, "leads", { limit: 2 });
    expect(result.map((l) => l.id)).toEqual([1, 2, 3]);
  });

  it("stops when a page is empty", async () => {
    const fetchPage = async () => page([], false);
    const result = await paginateHal(fetchPage, "leads");
    expect(result).toEqual([]);
  });

  it("stops when no next link and page is not full", async () => {
    const fetchPage = async () => page([{ id: 1, name: "L1" }], false);
    const result = await paginateHal(fetchPage, "leads", { limit: 50 });
    expect(result).toHaveLength(1);
  });

  it("stops when response is undefined", async () => {
    const fetchPage = async () => undefined;
    const result = await paginateHal(fetchPage, "leads");
    expect(result).toEqual([]);
  });

  it("respects maxPages limit to avoid infinite loops", async () => {
    let calls = 0;
    const fetchPage = async () => {
      calls += 1;
      // Sempre cheia e com next — normalmente continuaria indefinidamente.
      return page(
        Array.from({ length: 2 }, (_, i) => ({ id: calls * 100 + i, name: "L" })),
        true
      );
    };
    const result = await paginateHal(fetchPage, "leads", { limit: 2, maxPages: 3 });
    expect(calls).toBe(3);
    expect(result).toHaveLength(6);
  });
});
