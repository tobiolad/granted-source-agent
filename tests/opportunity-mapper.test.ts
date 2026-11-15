import { describe, it, expect } from "vitest";
import { DiscoveredOpportunitySchema } from "@/lib/validation";
import { mapDiscoveredOpportunity } from "@/lib/opportunity-mapper";

const BASE_RAW = {
  grant_name: "Test Grant Program",
  funder_name: "Test Funder",
  program_url: "https://example.gov/grant",
  country: "Canada" as const,
  region: "Ontario",
  category: "Startup" as const,
  funding_type: "Grant" as const,
  amount: "CAD $10,000",
  deadline: "2026-12-01",
  source: "Government website" as const,
  applicant_type: "Startup",
  eligibility_summary: "Open to incorporated Canadian startups.",
  fit_score: "High" as const,
  urgency: "Open" as const,
  initial_fit_guess: "Likely" as const,
  discovery_note: "Good fit",
  application_angle: "Lead with traction"
};

describe("mapDiscoveredOpportunity", () => {
  it("reports no missing fields when everything is confirmed and a citation exists", () => {
    const validated = DiscoveredOpportunitySchema.parse(BASE_RAW);
    const mapped = mapDiscoveredOpportunity(validated, [{ url: "https://example.gov/grant", title: "Grant" }], "live");
    expect(mapped.missingFields).toEqual([]);
  });

  it("flags amount, deadline, and eligibility as missing when the model used placeholder values", () => {
    const validated = DiscoveredOpportunitySchema.parse({
      ...BASE_RAW,
      amount: "Unknown",
      deadline: "Not stated",
      eligibility_summary: "n/a"
    });
    const mapped = mapDiscoveredOpportunity(validated, [{ url: "https://example.gov/grant" }], "live");
    expect(mapped.missingFields).toEqual(expect.arrayContaining(["amount", "deadline", "eligibility_summary"]));
  });

  it("flags source_citation as missing when no citation is provided", () => {
    const validated = DiscoveredOpportunitySchema.parse(BASE_RAW);
    const mapped = mapDiscoveredOpportunity(validated, [], "live");
    expect(mapped.missingFields).toContain("source_citation");
  });

  it("rejects a candidate with an invalid category enum", () => {
    const result = DiscoveredOpportunitySchema.safeParse({ ...BASE_RAW, category: "Not A Real Category" });
    expect(result.success).toBe(false);
  });

  it("rejects a candidate missing a program_url", () => {
    const { program_url, ...rest } = BASE_RAW;
    const result = DiscoveredOpportunitySchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it("rejects a candidate with a malformed program_url", () => {
    const result = DiscoveredOpportunitySchema.safeParse({ ...BASE_RAW, program_url: "not a url" });
    expect(result.success).toBe(false);
  });
});
