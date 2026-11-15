import { z } from "zod";
import {
  CATEGORIES,
  COUNTRIES,
  DISCOVERY_SOURCES,
  ELIGIBILITY_GUESSES,
  FIT_SCORES,
  FUNDING_TYPES,
  ORG_STAGES,
  ORG_TYPES,
  REVIEW_STATUSES,
  OPPORTUNITY_STATUSES,
  SOURCE_TYPES,
  URGENCY_LEVELS
} from "./constants";

const UNKNOWN_VALUES = new Set(["unknown", "not stated", "n/a", "none", "tbd", ""]);

/** True when a model-provided string is a real value, not a placeholder for "I don't know." */
export function isConfirmedValue(value: string | null | undefined): boolean {
  if (!value) return false;
  return !UNKNOWN_VALUES.has(value.trim().toLowerCase());
}

/**
 * Shape we require from a single discovered opportunity, as returned by the
 * discovery step (demo or live) BEFORE it's written to the database.
 *
 * This is intentionally the validation boundary described in the project
 * brief: if the model's JSON doesn't match this shape, the record is
 * rejected rather than coerced into something that looks confident.
 */
export const DiscoveredOpportunitySchema = z.object({
  grant_name: z.string().trim().min(3).max(200),
  funder_name: z.string().trim().max(200).optional().default(""),
  program_url: z.string().trim().url(),
  country: z.enum(COUNTRIES),
  region: z.string().trim().max(120).optional().default("Unknown"),
  category: z.enum(CATEGORIES),
  funding_type: z.enum(FUNDING_TYPES),
  amount: z.string().trim().max(120).optional().default("Not stated"),
  deadline: z.string().trim().max(120).optional().default("Unknown"),
  source: z.enum(SOURCE_TYPES),
  applicant_type: z.string().trim().max(160).optional().default("Unknown"),
  eligibility_summary: z.string().trim().max(600).optional().default(""),
  fit_score: z.enum(FIT_SCORES),
  urgency: z.enum(URGENCY_LEVELS),
  initial_fit_guess: z.enum(ELIGIBILITY_GUESSES),
  discovery_note: z.string().trim().max(400).optional().default(""),
  application_angle: z.string().trim().max(400).optional().default("")
});

export type DiscoveredOpportunity = z.infer<typeof DiscoveredOpportunitySchema>;

/** The model's whole JSON response: an array of candidate opportunities. */
export const DiscoveryResponseSchema = z.array(z.unknown()).max(50);

export const DiscoverRequestSchema = z.object({
  keywords: z.string().trim().min(2).max(200),
  country: z.enum(COUNTRIES),
  category: z.enum(CATEGORIES),
  applicantType: z.string().trim().min(2).max(160),
  maxResults: z.number().int().min(1).max(20).default(10)
});

export type DiscoverRequest = z.infer<typeof DiscoverRequestSchema>;

export const ReviewUpdateSchema = z.object({
  reviewStatus: z.enum(REVIEW_STATUSES).optional(),
  reviewNotes: z.string().trim().max(2000).optional(),
  status: z.enum(OPPORTUNITY_STATUSES).optional()
});

export const OrgProfileSchema = z.object({
  orgName: z.string().trim().min(2).max(160),
  orgType: z.enum(ORG_TYPES),
  country: z.enum(COUNTRIES),
  region: z.string().trim().max(120).optional().default(""),
  stage: z.enum(ORG_STAGES).optional(),
  teamSize: z.string().trim().max(60).optional().default(""),
  description: z.string().trim().max(1000).optional().default(""),
  fundingNeeded: z.string().trim().max(160).optional().default("")
});

export type OrgProfileInput = z.infer<typeof OrgProfileSchema>;

export const EvaluateRequestSchema = z.object({
  opportunityId: z.string().trim().min(1)
});

/**
 * Shape we require from the evaluation step's model output. Note fit_score
 * always travels with fit_reasoning — an unexplained score is rejected.
 */
export const EvaluationResultSchema = z.object({
  fit_score: z.enum(FIT_SCORES),
  fit_reasoning: z.string().trim().min(10).max(600),
  eligibility_notes: z.string().trim().min(5).max(600),
  restrictions: z.string().trim().max(400).optional().default(""),
  missing_info: z.array(z.string().trim().max(200)).max(10).default([]),
  next_actions: z.array(z.string().trim().max(200)).min(1).max(6)
});

export type EvaluationResult = z.infer<typeof EvaluationResultSchema>;

export const DiscoverySourceSchema = z.enum(DISCOVERY_SOURCES);
