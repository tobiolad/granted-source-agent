import type { DiscoveredOpportunity } from "./validation";
import { isConfirmedValue } from "./validation";

export interface Citation {
  url: string;
  title?: string;
}

export interface MappedOpportunity {
  grantName: string;
  funderName: string;
  programUrl: string;
  country: string;
  region: string;
  category: string;
  fundingType: string;
  applicantType: string;
  sourceType: string;
  amount: string;
  deadline: string;
  urgency: string;
  eligibilitySummary: string;
  discoveryNote: string;
  applicationAngle: string;
  aiFitScore: string;
  aiEligibilityGuess: string;
  missingFields: string[];
  discoverySource: "demo" | "live";
  citations: Citation[];
}

/**
 * Converts a validated model output into the shape stored in the database,
 * and — critically — figures out which fields the model could not actually
 * confirm, so the UI can surface "needs verification" instead of presenting
 * a placeholder like "Unknown" as if it were researched fact.
 */
export function mapDiscoveredOpportunity(
  raw: DiscoveredOpportunity,
  citations: Citation[],
  discoverySource: "demo" | "live"
): MappedOpportunity {
  const missingFields: string[] = [];

  if (!isConfirmedValue(raw.amount)) missingFields.push("amount");
  if (!isConfirmedValue(raw.deadline)) missingFields.push("deadline");
  if (!isConfirmedValue(raw.eligibility_summary)) missingFields.push("eligibility_summary");
  if (!isConfirmedValue(raw.funder_name)) missingFields.push("funder_name");
  if (!isConfirmedValue(raw.region) || raw.region.toLowerCase() === "unknown") missingFields.push("region");
  if (citations.length === 0) missingFields.push("source_citation");

  return {
    grantName: raw.grant_name,
    funderName: raw.funder_name || "Not stated",
    programUrl: raw.program_url,
    country: raw.country,
    region: raw.region || "Unknown",
    category: raw.category,
    fundingType: raw.funding_type,
    applicantType: raw.applicant_type || "Unknown",
    sourceType: raw.source,
    amount: raw.amount || "Not stated",
    deadline: raw.deadline || "Unknown",
    urgency: raw.urgency,
    eligibilitySummary: raw.eligibility_summary || "",
    discoveryNote: raw.discovery_note || "",
    applicationAngle: raw.application_angle || "",
    aiFitScore: raw.fit_score,
    aiEligibilityGuess: raw.initial_fit_guess,
    missingFields,
    discoverySource,
    citations
  };
}
