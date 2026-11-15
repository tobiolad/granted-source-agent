import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ReviewUpdateSchema } from "@/lib/validation";
import { logger } from "@/lib/logger";

function safeParseArray(value: string | null): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const opportunity = await db.opportunity.findUnique({
    where: { id },
    include: { citations: true, evaluations: { orderBy: { createdAt: "desc" } } }
  });

  if (!opportunity) {
    return NextResponse.json({ error: "Opportunity not found" }, { status: 404 });
  }

  return NextResponse.json({ opportunity: { ...opportunity, missingFields: safeParseArray(opportunity.missingFields) } });
}

/**
 * Updates the HUMAN review layer only — reviewStatus, reviewNotes, and the
 * workflow status. This endpoint never touches the AI-asserted fields
 * (aiFitScore, eligibilitySummary, etc.), which is the whole point of
 * keeping the two separate: a human marking something "verified" doesn't
 * silently rewrite what the AI originally said.
 */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = ReviewUpdateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid update", issues: parsed.error.issues.map((i) => ({ path: i.path, message: i.message })) },
      { status: 400 }
    );
  }

  if (Object.keys(parsed.data).length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  try {
    const updated = await db.opportunity.update({
      where: { id },
      data: parsed.data,
      include: { citations: true }
    });
    logger.info("opportunity.reviewed", { id, ...parsed.data });
    return NextResponse.json({ opportunity: { ...updated, missingFields: safeParseArray(updated.missingFields) } });
  } catch {
    return NextResponse.json({ error: "Opportunity not found" }, { status: 404 });
  }
}
