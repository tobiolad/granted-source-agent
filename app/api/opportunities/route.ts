import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;

  const country = params.get("country");
  const category = params.get("category");
  const fundingType = params.get("fundingType");
  const urgency = params.get("urgency");
  const aiFitScore = params.get("fit");
  const reviewStatus = params.get("reviewStatus");
  const status = params.get("status");
  const search = params.get("search")?.trim();

  const opportunities = await db.opportunity.findMany({
    where: {
      ...(country && country !== "All" ? { country: { contains: country } } : {}),
      ...(category ? { category } : {}),
      ...(fundingType ? { fundingType } : {}),
      ...(urgency ? { urgency } : {}),
      ...(aiFitScore && aiFitScore !== "All" ? { aiFitScore } : {}),
      ...(reviewStatus ? { reviewStatus } : {}),
      ...(status ? { status } : {}),
      ...(search
        ? {
            OR: [
              { grantName: { contains: search } },
              { funderName: { contains: search } },
              { eligibilitySummary: { contains: search } },
              { discoveryNote: { contains: search } },
              { reviewNotes: { contains: search } }
            ]
          }
        : {})
    },
    include: { citations: true, evaluations: { orderBy: { createdAt: "desc" }, take: 1 } },
    orderBy: { discoveredAt: "desc" }
  });

  const withParsedMissingFields = opportunities.map((o) => ({
    ...o,
    missingFields: safeParseArray(o.missingFields)
  }));

  return NextResponse.json({ opportunities: withParsedMissingFields });
}

function safeParseArray(value: string | null): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
