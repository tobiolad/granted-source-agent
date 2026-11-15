import { describe, it, expect, vi, beforeEach } from "vitest";
import { searchDemoOpportunities } from "@/lib/discovery-service";
import type { DiscoverRequest } from "@/lib/validation";

const baseReq: DiscoverRequest = {
  keywords: "women founder grant",
  country: "Canada/US",
  category: "Women",
  applicantType: "Women-owned business",
  maxResults: 10
};

describe("searchDemoOpportunities", () => {
  it("returns results matching the keywords from the labeled demo dataset", () => {
    const results = searchDemoOpportunities(baseReq);
    expect(results.length).toBeGreaterThan(0);
    expect(results.every((r) => r.discoverySource === "demo")).toBe(true);
  });

  it("respects maxResults", () => {
    const results = searchDemoOpportunities({ ...baseReq, keywords: "grant", maxResults: 2 });
    expect(results.length).toBeLessThanOrEqual(2);
  });

  it("filters out opportunities from the other country when a specific country is requested", () => {
    const results = searchDemoOpportunities({ ...baseReq, country: "United States", keywords: "grant", maxResults: 20 });
    expect(results.every((r) => r.country === "United States" || r.country === "Canada/US")).toBe(true);
  });
});

describe("runLiveDiscovery", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("validates model output and rejects candidates that don't match the schema", async () => {
    vi.doMock("@/lib/gemini", () => ({
      generateGrounded: vi.fn().mockResolvedValue({
        text: JSON.stringify([
          {
            grant_name: "Valid Grant",
            funder_name: "Funder",
            program_url: "https://example.gov/grant",
            country: "Canada",
            region: "National",
            category: "Startup",
            funding_type: "Grant",
            amount: "Not stated",
            deadline: "Unknown",
            source: "Government website",
            applicant_type: "Startup",
            eligibility_summary: "Open to startups.",
            fit_score: "High",
            urgency: "Open",
            initial_fit_guess: "Likely"
          },
          {
            grant_name: "Invalid Grant - bad category",
            funder_name: "Funder",
            program_url: "https://example.gov/grant2",
            country: "Canada",
            category: "NotARealCategory",
            funding_type: "Grant",
            source: "Government website",
            fit_score: "High",
            urgency: "Open",
            initial_fit_guess: "Likely"
          }
        ]),
        citations: [{ url: "https://example.gov/grant", title: "Grant page" }]
      }),
      generateJson: vi.fn()
    }));

    const { runLiveDiscovery } = await import("@/lib/discovery-service");
    const result = await runLiveDiscovery(
      { keywords: "startup grant", country: "Canada", category: "Startup", applicantType: "Startup", maxResults: 10 },
      "fake-key"
    );

    expect(result.rawCount).toBe(2);
    expect(result.mapped).toHaveLength(1);
    expect(result.invalidCount).toBe(1);
    expect(result.mapped[0]?.citations).toEqual([{ url: "https://example.gov/grant", title: "Grant page" }]);
  });

  it("throws a clear error when Gemini returns nothing parseable, instead of inventing data", async () => {
    vi.doMock("@/lib/gemini", () => ({
      generateGrounded: vi.fn().mockResolvedValue({ text: "I couldn't find any grants matching that search.", citations: [] }),
      generateJson: vi.fn().mockResolvedValue("not json either")
    }));

    const { runLiveDiscovery } = await import("@/lib/discovery-service");
    await expect(
      runLiveDiscovery({ keywords: "xyz", country: "Canada", category: "Startup", applicantType: "Startup", maxResults: 10 }, "fake-key")
    ).rejects.toThrow();
  });
});
