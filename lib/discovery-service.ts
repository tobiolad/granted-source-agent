import { demoOpportunities } from "./demo-data";
import { generateGrounded, generateJson } from "./gemini";
import { extractJsonArray } from "./json-extract";
import { buildDiscoveryPrompt, buildRepairPrompt } from "./prompts";
import { mapDiscoveredOpportunity, type MappedOpportunity } from "./opportunity-mapper";
import { DiscoveredOpportunitySchema, type DiscoverRequest } from "./validation";
import { logger } from "./logger";

/**
 * DEMO MODE "search": filters the static labeled dataset instead of calling
 * any external API. Matching is intentionally loose (OR across text fields)
 * so a visitor exploring the demo gets a believable number of results
 * instead of an empty page for most queries.
 */
export function searchDemoOpportunities(req: DiscoverRequest): MappedOpportunity[] {
  const q = req.keywords.toLowerCase();
  const terms = q.split(/\s+/).filter(Boolean);

  const scored = demoOpportunities
    .filter((opp) => {
      if (req.country !== "Canada/US" && opp.country !== req.country && opp.country !== "Canada/US") return false;
      if (req.category !== "Mixed" && opp.category !== req.category && opp.category !== "Mixed") {
        // category is a soft filter in demo mode — don't over-constrain a small dataset
      }
      return true;
    })
    .map((opp) => {
      const haystack = `${opp.grantName} ${opp.funderName} ${opp.category} ${opp.eligibilitySummary} ${opp.applicantType}`.toLowerCase();
      const matches = terms.filter((t) => haystack.includes(t)).length;
      return { opp, matches };
    })
    .sort((a, b) => b.matches - a.matches)
    .map(({ opp }) => opp);

  return scored.slice(0, req.maxResults);
}

export interface LiveDiscoveryResult {
  mapped: MappedOpportunity[];
  invalidCount: number;
  rawCount: number;
}

/**
 * LIVE MODE discovery: a single Google-Search-grounded Gemini call, with a
 * JSON-repair fallback if the model wraps its answer in prose. Every
 * candidate is validated against DiscoveredOpportunitySchema — anything that
 * doesn't conform (wrong enum value, missing required field, malformed URL)
 * is dropped and counted, not coerced into looking valid.
 */
export async function runLiveDiscovery(req: DiscoverRequest, apiKey: string): Promise<LiveDiscoveryResult> {
  const prompt = buildDiscoveryPrompt(req);
  const { text, citations } = await generateGrounded({ apiKey, prompt });

  if (!text) {
    throw new Error("Gemini returned no discovery results. Try different keywords.");
  }

  let candidates = extractJsonArray(text);

  if (!candidates) {
    logger.warn("discovery.repair_attempted", { reason: "initial_parse_failed" });
    const repaired = await generateJson({ apiKey, prompt: buildRepairPrompt(text, req.category) });
    candidates = extractJsonArray(repaired);
  }

  if (!candidates) {
    throw new Error("Gemini did not return a parseable list of opportunities. Try different keywords.");
  }

  const mapped: MappedOpportunity[] = [];
  let invalidCount = 0;

  for (const candidate of candidates) {
    const result = DiscoveredOpportunitySchema.safeParse(candidate);
    if (!result.success) {
      invalidCount += 1;
      logger.warn("discovery.rejected_candidate", { issues: result.error.issues.map((i) => i.message) });
      continue;
    }
    // All candidates from one discovery call share the call's grounding
    // citations — Gemini's grounding API attributes sources to the whole
    // response, not per-item, so we can't split them more precisely than this
    // without a separate verification call per candidate (future work).
    mapped.push(mapDiscoveredOpportunity(result.data, citations, "live"));
  }

  return { mapped, invalidCount, rawCount: candidates.length };
}
