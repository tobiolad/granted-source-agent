import { describe, it, expect } from "vitest";
import { evaluateWithRules } from "@/lib/rule-based-evaluator";

const baseOpportunity = {
  country: "Canada",
  category: "Startup",
  fundingType: "Grant",
  programUrl: "https://example.gov/grant",
  applicationAngle: "Lead with traction",
  missingFields: [] as string[]
};

describe("evaluateWithRules", () => {
  it("scores High when country and category match and no fields are missing", () => {
    const result = evaluateWithRules({
      opportunity: baseOpportunity,
      org: { orgType: "Startup", country: "Canada" }
    });
    expect(result.fit_score).toBe("High");
    expect(result.fit_reasoning).toContain("Canada");
  });

  it("scores lower when the country does not match", () => {
    const result = evaluateWithRules({
      opportunity: baseOpportunity,
      org: { orgType: "Startup", country: "United States" }
    });
    expect(result.fit_score).not.toBe("High");
    expect(result.eligibility_notes).toMatch(/does not match/i);
  });

  it("always includes verifying the official page as a next action", () => {
    const result = evaluateWithRules({
      opportunity: baseOpportunity,
      org: { orgType: "Startup", country: "Canada" }
    });
    expect(result.next_actions.some((a) => a.includes(baseOpportunity.programUrl))).toBe(true);
  });

  it("surfaces missing fields in missing_info rather than silently ignoring them", () => {
    const result = evaluateWithRules({
      opportunity: { ...baseOpportunity, missingFields: ["amount", "deadline"] },
      org: { orgType: "Startup", country: "Canada" }
    });
    expect(result.missing_info).toEqual(["amount", "deadline"]);
  });

  it("never claims eligibility outright, regardless of score", () => {
    const result = evaluateWithRules({
      opportunity: baseOpportunity,
      org: { orgType: "Startup", country: "Canada" }
    });
    expect(result.eligibility_notes.toLowerCase()).not.toMatch(/\bis eligible\b/);
  });
});
