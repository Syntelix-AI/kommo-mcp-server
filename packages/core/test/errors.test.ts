import { describe, expect, it } from "vitest";

import {
  KommoAuthError,
  KommoNotFoundError,
  KommoRateLimitError,
  KommoUnexpectedHttpError,
  KommoValidationError,
  mapHttpStatusToError
} from "../src/index.js";

describe("mapHttpStatusToError", () => {
  it("maps 401 to KommoAuthError", () => {
    const error = mapHttpStatusToError(401, { title: "Unauthorized" });
    expect(error).toBeInstanceOf(KommoAuthError);
    expect(error.status).toBe(401);
  });

  it("maps 403 to KommoAuthError", () => {
    const error = mapHttpStatusToError(403, undefined);
    expect(error).toBeInstanceOf(KommoAuthError);
  });

  it("maps 404 to KommoNotFoundError", () => {
    const error = mapHttpStatusToError(404, undefined);
    expect(error).toBeInstanceOf(KommoNotFoundError);
  });

  it("maps 400 to KommoValidationError", () => {
    const error = mapHttpStatusToError(400, { detail: "bad input" });
    expect(error).toBeInstanceOf(KommoValidationError);
    expect(error.message).toContain("bad input");
  });

  it("maps 422 to KommoValidationError", () => {
    const error = mapHttpStatusToError(422, undefined);
    expect(error).toBeInstanceOf(KommoValidationError);
  });

  it("maps 429 to KommoRateLimitError", () => {
    const error = mapHttpStatusToError(429, undefined);
    expect(error).toBeInstanceOf(KommoRateLimitError);
  });

  it("maps 5xx to KommoUnexpectedHttpError", () => {
    const error = mapHttpStatusToError(500, undefined);
    expect(error).toBeInstanceOf(KommoUnexpectedHttpError);
    expect(error.status).toBe(500);
  });

  it("extracts title and detail from HAL-style error body", () => {
    const error = mapHttpStatusToError(422, {
      title: "Validation",
      detail: "name required"
    });
    expect(error.message).toContain("Validation");
    expect(error.message).toContain("name required");
  });
});
