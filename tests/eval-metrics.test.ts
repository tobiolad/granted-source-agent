import { describe, it, expect } from "vitest";
import { citationSupportsUrl } from "@/lib/eval-metrics";

describe("citationSupportsUrl", () => {
  it("returns true when a citation shares the program URL's hostname", () => {
    expect(citationSupportsUrl("https://example.gov/grant", [{ url: "https://example.gov/other-page" }])).toBe(true);
  });

  it("returns false when no citation matches the hostname", () => {
    expect(citationSupportsUrl("https://example.gov/grant", [{ url: "https://en.wikipedia.org/wiki/Example" }])).toBe(false);
  });

  it("returns false when there are no citations at all", () => {
    expect(citationSupportsUrl("https://example.gov/grant", [])).toBe(false);
  });

  it("ignores a www. prefix when comparing hosts", () => {
    expect(citationSupportsUrl("https://www.example.gov/grant", [{ url: "https://example.gov/other" }])).toBe(true);
  });
});
