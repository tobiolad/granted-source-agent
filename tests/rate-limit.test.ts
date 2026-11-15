import { describe, it, expect, beforeEach } from "vitest";
import { checkRateLimit, __resetRateLimitsForTests } from "@/lib/rate-limit";

describe("checkRateLimit", () => {
  beforeEach(() => {
    __resetRateLimitsForTests();
  });

  it("allows requests up to the limit", () => {
    const key = "test-key";
    for (let i = 0; i < 3; i++) {
      const result = checkRateLimit(key, 3);
      expect(result.allowed).toBe(true);
    }
  });

  it("blocks requests once the limit is exceeded within the window", () => {
    const key = "test-key-2";
    checkRateLimit(key, 2);
    checkRateLimit(key, 2);
    const third = checkRateLimit(key, 2);
    expect(third.allowed).toBe(false);
    expect(third.remaining).toBe(0);
  });

  it("tracks separate keys independently", () => {
    checkRateLimit("a", 1);
    const result = checkRateLimit("b", 1);
    expect(result.allowed).toBe(true);
  });
});
