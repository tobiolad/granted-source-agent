import { describe, it, expect } from "vitest";
import { extractJsonArray, extractJsonObject } from "@/lib/json-extract";

describe("extractJsonArray", () => {
  it("parses a clean JSON array", () => {
    expect(extractJsonArray('[{"a":1}]')).toEqual([{ a: 1 }]);
  });

  it("strips a markdown code fence", () => {
    expect(extractJsonArray('```json\n[{"a":1}]\n```')).toEqual([{ a: 1 }]);
  });

  it("recovers an array wrapped in prose", () => {
    const text = 'Here are the results:\n[{"a":1},{"a":2}]\nLet me know if you need more.';
    expect(extractJsonArray(text)).toEqual([{ a: 1 }, { a: 2 }]);
  });

  it("unwraps a {grants: [...]} envelope", () => {
    expect(extractJsonArray('{"grants":[{"a":1}]}')).toEqual([{ a: 1 }]);
  });

  it("returns null for text with no array", () => {
    expect(extractJsonArray("No results found.")).toBeNull();
  });

  it("does not invent data for malformed JSON", () => {
    expect(extractJsonArray("[{broken")).toBeNull();
  });
});

describe("extractJsonObject", () => {
  it("parses a clean JSON object", () => {
    expect(extractJsonObject('{"fit_score":"High"}')).toEqual({ fit_score: "High" });
  });

  it("recovers an object wrapped in a code fence and prose", () => {
    const text = '```json\n{"fit_score":"Medium"}\n```';
    expect(extractJsonObject(text)).toEqual({ fit_score: "Medium" });
  });

  it("returns null for an array, not an object", () => {
    expect(extractJsonObject("[1,2,3]")).toBeNull();
  });
});
