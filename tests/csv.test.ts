import { describe, it, expect } from "vitest";
import { buildOpportunitiesCsv } from "@/lib/csv";
import type { Opportunity } from "@/lib/types";

const sample: Opportunity = {
  id: "1",
  grantName: 'Test "Grant", Inc.',
  funderName: "Funder",
  programUrl: "https://example.gov/grant",
  country: "Canada",
  region: "Ontario",
  category: "Startup",
  fundingType: "Grant",
  applicantType: "Startup",
  sourceType: "Government website",
  amount: "CAD $10,000",
  deadline: "2026-12-01",
  urgency: "Open",
  eligibilitySummary: "Open to startups.",
  discoveryNote: "note",
  applicationAngle: "angle",
  aiFitScore: "High",
  aiEligibilityGuess: "Likely",
  missingFields: ["amount"],
  reviewStatus: "unreviewed",
  reviewNotes: null,
  status: "new",
  discoverySource: "demo",
  discoveredAt: "2026-01-01T00:00:00.000Z",
  citations: [{ id: "c1", url: "https://example.gov/grant", title: "Grant page" }]
};

describe("buildOpportunitiesCsv", () => {
  it("includes a header row and one row per opportunity", () => {
    const csv = buildOpportunitiesCsv([sample]);
    const lines = csv.split("\n");
    expect(lines).toHaveLength(2);
    expect(lines[0]).toContain("Grant Name");
  });

  it("escapes embedded quotes so the CSV stays well-formed", () => {
    const csv = buildOpportunitiesCsv([sample]);
    expect(csv).toContain('"Test ""Grant"", Inc."');
  });

  it("joins multiple citation URLs with a separator", () => {
    const withTwoCitations: Opportunity = {
      ...sample,
      citations: [
        { id: "c1", url: "https://example.gov/a", title: "A" },
        { id: "c2", url: "https://example.gov/b", title: "B" }
      ]
    };
    const csv = buildOpportunitiesCsv([withTwoCitations]);
    expect(csv).toContain("https://example.gov/a | https://example.gov/b");
  });

  it("returns just the header row for an empty list", () => {
    const csv = buildOpportunitiesCsv([]);
    expect(csv.split("\n")).toHaveLength(1);
  });
});
