import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { POST as evaluate } from "@/app/api/evaluate/route";
import { PATCH as patchOpportunity, GET as getOpportunity } from "@/app/api/opportunities/[id]/route";
import { __resetRateLimitsForTests } from "@/lib/rate-limit";

function postRequest(url: string, body: unknown) {
  return new NextRequest(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
}

function patchRequest(url: string, body: unknown) {
  return new NextRequest(url, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
}

describe("POST /api/evaluate (demo mode)", () => {
  let opportunityId: string;

  beforeEach(async () => {
    __resetRateLimitsForTests();
    await db.evaluation.deleteMany();
    await db.citation.deleteMany();
    await db.opportunity.deleteMany();
    await db.orgProfile.deleteMany();

    const opp = await db.opportunity.create({
      data: {
        grantName: "Test Grant",
        funderName: "Test Funder",
        programUrl: "https://example.gov/test-grant",
        country: "Canada",
        region: "Ontario",
        category: "Startup",
        fundingType: "Grant",
        applicantType: "Startup",
        sourceType: "Government website",
        amount: "Not stated",
        deadline: "Unknown",
        eligibilitySummary: "Open to startups.",
        missingFields: JSON.stringify(["amount", "deadline"])
      }
    });
    opportunityId = opp.id;

    await db.orgProfile.create({
      data: { id: "default", orgName: "Test Co", orgType: "Startup", country: "Canada" }
    });
  });

  afterAll(async () => {
    await db.$disconnect();
  });

  it("requires an org profile before evaluating", async () => {
    await db.orgProfile.deleteMany();
    const res = await evaluate(postRequest("http://localhost/api/evaluate", { opportunityId }));
    expect(res.status).toBe(400);
  });

  it("produces an explainable rule-based evaluation in demo mode", async () => {
    const res = await evaluate(postRequest("http://localhost/api/evaluate", { opportunityId }));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.evaluation.source).toBe("demo");
    expect(["High", "Medium", "Low"]).toContain(data.evaluation.fitScore);
    expect(data.evaluation.fitReasoning.length).toBeGreaterThan(0);
    expect(data.evaluation.missingInfo).toEqual(["amount", "deadline"]);
  });

  it("never asserts a fit score without reasoning", async () => {
    const res = await evaluate(postRequest("http://localhost/api/evaluate", { opportunityId }));
    const data = await res.json();
    expect(data.evaluation.fitReasoning).toBeTruthy();
  });

  it("404s for an opportunity that doesn't exist", async () => {
    const res = await evaluate(postRequest("http://localhost/api/evaluate", { opportunityId: "does-not-exist" }));
    expect(res.status).toBe(404);
  });
});

describe("PATCH /api/opportunities/[id] — human review layer", () => {
  let opportunityId: string;

  beforeEach(async () => {
    await db.citation.deleteMany();
    await db.opportunity.deleteMany();

    const opp = await db.opportunity.create({
      data: {
        grantName: "Review Test Grant",
        funderName: "Funder",
        programUrl: "https://example.gov/review-test",
        country: "Canada",
        category: "Startup",
        fundingType: "Grant",
        sourceType: "Government website"
      }
    });
    opportunityId = opp.id;
  });

  afterAll(async () => {
    await db.$disconnect();
  });

  it("updates review status without touching AI-asserted fields", async () => {
    const before = await (await getOpportunity(new NextRequest("http://localhost"), { params: Promise.resolve({ id: opportunityId }) })).json();

    const res = await patchOpportunity(patchRequest("http://localhost", { reviewStatus: "verified", reviewNotes: "Confirmed by phone." }), {
      params: Promise.resolve({ id: opportunityId })
    });
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.opportunity.reviewStatus).toBe("verified");
    expect(data.opportunity.reviewNotes).toBe("Confirmed by phone.");
    expect(data.opportunity.grantName).toBe(before.opportunity.grantName);
    expect(data.opportunity.aiFitScore).toBe(before.opportunity.aiFitScore);
  });

  it("rejects an invalid reviewStatus value", async () => {
    const res = await patchOpportunity(patchRequest("http://localhost", { reviewStatus: "approved-by-ai" }), {
      params: Promise.resolve({ id: opportunityId })
    });
    expect(res.status).toBe(400);
  });
});
