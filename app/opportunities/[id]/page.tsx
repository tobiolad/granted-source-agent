import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { OpportunityDetailClient } from "@/components/OpportunityDetailClient";
import type { Opportunity } from "@/lib/types";

function parseArray(value: string | null): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export default async function OpportunityDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const record = await db.opportunity.findUnique({
    where: { id },
    include: { citations: true, evaluations: { orderBy: { createdAt: "desc" } } }
  });

  if (!record) notFound();

  const opportunity: Opportunity = {
    id: record.id,
    grantName: record.grantName,
    funderName: record.funderName || "Not stated",
    programUrl: record.programUrl,
    country: record.country,
    region: record.region,
    category: record.category,
    fundingType: record.fundingType,
    applicantType: record.applicantType,
    sourceType: record.sourceType,
    amount: record.amount,
    deadline: record.deadline,
    urgency: record.urgency,
    eligibilitySummary: record.eligibilitySummary,
    discoveryNote: record.discoveryNote,
    applicationAngle: record.applicationAngle,
    aiFitScore: record.aiFitScore,
    aiEligibilityGuess: record.aiEligibilityGuess,
    missingFields: parseArray(record.missingFields),
    reviewStatus: record.reviewStatus,
    reviewNotes: record.reviewNotes,
    status: record.status,
    discoverySource: record.discoverySource,
    discoveredAt: record.discoveredAt.toISOString(),
    citations: record.citations.map((c) => ({ id: c.id, url: c.url, title: c.title })),
    evaluations: record.evaluations.map((e) => ({
      id: e.id,
      opportunityId: e.opportunityId,
      fitScore: e.fitScore,
      fitReasoning: e.fitReasoning,
      eligibilityNotes: e.eligibilityNotes,
      restrictions: e.restrictions || "",
      missingInfo: parseArray(e.missingInfo),
      nextActions: parseArray(e.nextActions),
      evaluatedAgainstOrg: e.evaluatedAgainstOrg,
      source: e.source,
      createdAt: e.createdAt.toISOString()
    }))
  };

  return <OpportunityDetailClient opportunity={opportunity} />;
}
