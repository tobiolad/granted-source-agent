// Plain client-safe types mirroring the API's JSON shape. Deliberately not
// importing from @prisma/client here — that pulls server-only code into the
// client bundle. These are the wire shapes, kept close to the DB schema.

export interface Citation {
  id: string;
  url: string;
  title: string | null;
}

export interface Evaluation {
  id: string;
  opportunityId: string;
  fitScore: string;
  fitReasoning: string;
  eligibilityNotes: string;
  restrictions: string;
  missingInfo: string[];
  nextActions: string[];
  evaluatedAgainstOrg: string;
  source: string;
  createdAt: string;
}

export interface Opportunity {
  id: string;
  grantName: string;
  funderName: string;
  programUrl: string;
  country: string;
  region: string | null;
  category: string;
  fundingType: string;
  applicantType: string | null;
  sourceType: string;
  amount: string | null;
  deadline: string | null;
  urgency: string | null;
  eligibilitySummary: string | null;
  discoveryNote: string | null;
  applicationAngle: string | null;
  aiFitScore: string | null;
  aiEligibilityGuess: string | null;
  missingFields: string[];
  reviewStatus: string;
  reviewNotes: string | null;
  status: string;
  discoverySource: string;
  discoveredAt: string;
  citations: Citation[];
  evaluations?: Evaluation[];
}

export interface OrgProfile {
  id: string;
  orgName: string;
  orgType: string;
  country: string;
  region: string | null;
  stage: string | null;
  teamSize: string | null;
  description: string | null;
  fundingNeeded: string | null;
}

export interface DiscoverResult {
  mode: "demo" | "live";
  found: number;
  added: number;
  duplicates: number;
  invalid: number;
  ranAt: string;
  addedIds: string[];
}
