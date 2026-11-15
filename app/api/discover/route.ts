import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";
import { checkRateLimit } from "@/lib/rate-limit";
import { getClientKey } from "@/lib/request-ip";
import { partitionDuplicates, dedupKey } from "@/lib/dedup";
import { searchDemoOpportunities, runLiveDiscovery } from "@/lib/discovery-service";
import { DiscoverRequestSchema } from "@/lib/validation";
import { isLiveModeConfigured } from "@/lib/gemini";
import type { MappedOpportunity } from "@/lib/opportunity-mapper";

const DEMO_RATE_LIMIT = 30;
const LIVE_RATE_LIMIT = Number(process.env.LIVE_DISCOVERY_RATE_LIMIT || 5);

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = DiscoverRequestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request", issues: parsed.error.issues.map((i) => ({ path: i.path, message: i.message })) },
      { status: 400 }
    );
  }

  const liveMode = isLiveModeConfigured();
  const clientKey = getClientKey(request);
  const rateLimit = checkRateLimit(`discover:${liveMode ? "live" : "demo"}:${clientKey}`, liveMode ? LIVE_RATE_LIMIT : DEMO_RATE_LIMIT);

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Rate limit exceeded. Please wait before running discovery again.", resetAt: rateLimit.resetAt },
      { status: 429 }
    );
  }

  let mapped: MappedOpportunity[];
  let invalidCount = 0;
  let mode: "demo" | "live" = "demo";

  try {
    if (liveMode) {
      mode = "live";
      const result = await runLiveDiscovery(parsed.data, process.env.GEMINI_API_KEY as string);
      mapped = result.mapped;
      invalidCount = result.invalidCount;
    } else {
      mapped = searchDemoOpportunities(parsed.data);
    }
  } catch (err) {
    logger.error("discover.failed", { mode, message: err instanceof Error ? err.message : String(err) });
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Discovery failed. Try different keywords." },
      { status: 502 }
    );
  }

  const existing = await db.opportunity.findMany({ select: { programUrl: true, grantName: true } });
  const existingKeys = new Set(
    existing.map((o) => dedupKey({ program_url: o.programUrl, grant_name: o.grantName }))
  );

  const { unique, duplicateCount } = partitionDuplicates(
    mapped.map((m) => ({ ...m, program_url: m.programUrl, grant_name: m.grantName })),
    existingKeys
  );

  const created = [];
  for (const opp of unique) {
    try {
      const record = await db.opportunity.create({
        data: {
          grantName: opp.grantName,
          funderName: opp.funderName,
          programUrl: opp.programUrl,
          country: opp.country,
          region: opp.region,
          category: opp.category,
          fundingType: opp.fundingType,
          applicantType: opp.applicantType,
          sourceType: opp.sourceType,
          amount: opp.amount,
          deadline: opp.deadline,
          urgency: opp.urgency,
          eligibilitySummary: opp.eligibilitySummary,
          discoveryNote: opp.discoveryNote,
          applicationAngle: opp.applicationAngle,
          aiFitScore: opp.aiFitScore,
          aiEligibilityGuess: opp.aiEligibilityGuess,
          missingFields: JSON.stringify(opp.missingFields),
          discoverySource: opp.discoverySource,
          citations: { create: opp.citations.map((c) => ({ url: c.url, title: c.title })) }
        }
      });
      created.push(record);
    } catch (err) {
      // Most likely a race on the unique (programUrl, grantName) constraint —
      // treat as a duplicate rather than failing the whole request.
      logger.warn("discover.insert_skipped", { grantName: opp.grantName, message: err instanceof Error ? err.message : String(err) });
    }
  }

  logger.info("discover.completed", { mode, found: mapped.length, added: created.length, duplicates: duplicateCount, invalid: invalidCount });

  return NextResponse.json({
    mode,
    found: mapped.length,
    added: created.length,
    duplicates: duplicateCount,
    invalid: invalidCount,
    ranAt: new Date().toISOString(),
    addedIds: created.map((c) => c.id)
  });
}
