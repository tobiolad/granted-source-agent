import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { POST as discover } from "@/app/api/discover/route";
import { __resetRateLimitsForTests } from "@/lib/rate-limit";

function postRequest(url: string, body: unknown) {
  return new NextRequest(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
}

describe("POST /api/discover (demo mode)", () => {
  beforeEach(async () => {
    __resetRateLimitsForTests();
    await db.citation.deleteMany();
    await db.opportunity.deleteMany();
  });

  afterAll(async () => {
    await db.$disconnect();
  });

  it("runs in demo mode when no server API key is configured", async () => {
    const res = await discover(
      postRequest("http://localhost/api/discover", {
        keywords: "women founder grant",
        country: "Canada/US",
        category: "Women",
        applicantType: "Women-owned business",
        maxResults: 10
      })
    );
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.mode).toBe("demo");
    expect(data.added).toBeGreaterThan(0);
  });

  it("persists discovered opportunities with their citations", async () => {
    await discover(
      postRequest("http://localhost/api/discover", {
        keywords: "startup",
        country: "Canada",
        category: "Startup",
        applicantType: "Startup",
        maxResults: 5
      })
    );

    const stored = await db.opportunity.findMany({ include: { citations: true } });
    expect(stored.length).toBeGreaterThan(0);
    expect(stored.every((o) => o.citations.length > 0)).toBe(true);
  });

  it("skips duplicates on a second identical run instead of re-adding them", async () => {
    const body = { keywords: "startup", country: "Canada", category: "Startup", applicantType: "Startup", maxResults: 5 };
    const first = await (await discover(postRequest("http://localhost/api/discover", body))).json();
    const second = await (await discover(postRequest("http://localhost/api/discover", body))).json();

    expect(first.added).toBeGreaterThan(0);
    expect(second.added).toBe(0);
    expect(second.duplicates).toBeGreaterThan(0);
  });

  it("rejects an invalid request body (bad category enum)", async () => {
    const res = await discover(
      postRequest("http://localhost/api/discover", {
        keywords: "startup",
        country: "Canada",
        category: "NotARealCategory",
        applicantType: "Startup",
        maxResults: 5
      })
    );
    expect(res.status).toBe(400);
  });

  it("enforces the demo rate limit after repeated requests", async () => {
    const body = { keywords: "test", country: "Canada", category: "Startup", applicantType: "Startup", maxResults: 1 };
    let lastStatus = 200;
    for (let i = 0; i < 35; i++) {
      const res = await discover(postRequest("http://localhost/api/discover", body));
      lastStatus = res.status;
    }
    expect(lastStatus).toBe(429);
  });
});
