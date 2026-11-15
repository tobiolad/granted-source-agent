import { describe, it, expect } from "vitest";
import { dedupKey, partitionDuplicates } from "@/lib/dedup";

describe("dedupKey", () => {
  it("normalizes trailing slashes and case in the URL", () => {
    const a = dedupKey({ program_url: "https://Example.com/Program/", grant_name: "Test Grant" });
    const b = dedupKey({ program_url: "https://example.com/Program", grant_name: "test grant" });
    expect(a).toBe(b);
  });

  it("strips common tracking params", () => {
    const a = dedupKey({ program_url: "https://example.com/program?utm_source=newsletter", grant_name: "Grant" });
    const b = dedupKey({ program_url: "https://example.com/program", grant_name: "Grant" });
    expect(a).toBe(b);
  });

  it("treats different program URLs as distinct even with the same name", () => {
    const a = dedupKey({ program_url: "https://example.com/a", grant_name: "Grant" });
    const b = dedupKey({ program_url: "https://example.com/b", grant_name: "Grant" });
    expect(a).not.toBe(b);
  });

  it("falls back to a lowercased raw string for unparseable URLs", () => {
    const a = dedupKey({ program_url: "not-a-url", grant_name: "Grant" });
    expect(a).toBe("not-a-url|grant");
  });
});

describe("partitionDuplicates", () => {
  const candidates = [
    { program_url: "https://example.com/a", grant_name: "Grant A" },
    { program_url: "https://example.com/a", grant_name: "Grant A" }, // duplicate within batch
    { program_url: "https://example.com/b", grant_name: "Grant B" }
  ];

  it("removes duplicates within the same batch", () => {
    const { unique, duplicateCount } = partitionDuplicates(candidates, new Set());
    expect(unique).toHaveLength(2);
    expect(duplicateCount).toBe(1);
  });

  it("removes items that already exist, using the provided key set", () => {
    const existing = new Set([dedupKey(candidates[0]!)]);
    const { unique, duplicateCount } = partitionDuplicates(candidates, existing);
    expect(unique).toHaveLength(1);
    expect(unique[0]?.grant_name).toBe("Grant B");
    expect(duplicateCount).toBe(2);
  });
});
