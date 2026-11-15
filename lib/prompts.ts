import { CATEGORIES, FUNDING_TYPES, SOURCE_TYPES, URGENCY_LEVELS, FIT_SCORES, ELIGIBILITY_GUESSES } from "./constants";
import type { DiscoverRequest } from "./validation";

/**
 * Discovery prompt. Carried over from the original app's prompt engineering
 * (it was already reasonably disciplined — explicit "don't invent",
 * "use Unknown over guessing", exact enums) with one addition: the model is
 * told its citations will be taken from search grounding, not from its own
 * text, so it shouldn't bother fabricating a plausible-looking URL if it
 * isn't confident — "Unknown" is fine, grounding will supply the real link
 * when one exists.
 */
export function buildDiscoveryPrompt(req: DiscoverRequest): string {
  const today = new Date().toISOString().slice(0, 10);

  return `You are a grant discovery agent for an AI Grant Research & Intelligence Platform.

Your job is to find REAL, publicly listed grants, funding programs, competitions, accelerators, tax credits, or non-dilutive funding opportunities in Canada and the United States.

SEARCH CRITERIA:
- Keywords: ${req.keywords}
- Country: ${req.country}
- Category: ${req.category}
- Applicant type: ${req.applicantType}

SEARCH STRATEGY:
Use Google Search to find official and reliable sources. Prioritize government websites, foundation websites, university or accelerator pages, nonprofit funder pages, and official program pages over blog roundups or aggregator listicles.

FOR EACH OPPORTUNITY, extract these fields:
- grant_name: official program or opportunity name
- funder_name: funder, agency, foundation, or organization ("Not stated" if unclear)
- program_url: official public URL for the program
- country: exactly "Canada", "United States", or "Canada/US"
- region: province, state, city, or "National" ("Unknown" if unclear)
- category: exactly one of ${CATEGORIES.map((c) => `"${c}"`).join(", ")}
- funding_type: exactly one of ${FUNDING_TYPES.map((f) => `"${f}"`).join(", ")}
- amount: funding amount if clearly stated, otherwise "Not stated"
- deadline: deadline if clearly stated, "Rolling" if rolling, otherwise "Unknown"
- source: exactly one of ${SOURCE_TYPES.map((s) => `"${s}"`).join(", ")}
- applicant_type: who can apply, in a short phrase
- eligibility_summary: short plain-English eligibility summary, based only on what the page states
- fit_score: "High" if strong match to the search criteria, "Medium" if partial, "Low" if weak or unclear
- urgency: exactly one of ${URGENCY_LEVELS.map((u) => `"${u}"`).join(", ")}
- initial_fit_guess: exactly one of ${ELIGIBILITY_GUESSES.map((g) => `"${g}"`).join(", ")}
- discovery_note: one sentence on why this is relevant to the search
- application_angle: one sentence suggesting how to position an application

HARD RULES:
- Only include opportunities you can actually find through search. Do not invent a program, deadline, amount, or eligibility rule.
- If a detail is unclear or not stated on the page, use "Unknown" / "Not stated" rather than guessing a specific-sounding value.
- If a program appears closed, set urgency to "Closed" and initial_fit_guess to "Unlikely".
- Skip scholarships unless the keywords clearly ask for student funding.
- Today's date is ${today}. Find up to ${req.maxResults} opportunities.

RESPONSE FORMAT:
Return ONLY a raw JSON array of objects with exactly the fields above. No markdown, no code fences, no explanation. Start with [ and end with ].`;
}

export function buildRepairPrompt(raw: string, category: string): string {
  return `Convert this search result into ONLY a JSON array of grant opportunity objects.

Return [] if there are no real grants or funding opportunities described.
Do not invent anything that isn't in the text below.
Use this category when the text doesn't specify one: ${category}

Required fields: grant_name, funder_name, program_url, country, region, category, funding_type, amount, deadline, source, applicant_type, eligibility_summary, fit_score, urgency, initial_fit_guess, discovery_note, application_angle

Text:
${raw}`;
}

export interface EvaluationContext {
  opportunity: {
    grantName: string;
    funderName: string;
    country: string;
    region: string;
    category: string;
    fundingType: string;
    amount: string;
    deadline: string;
    applicantType: string;
    eligibilitySummary: string;
    missingFields: string[];
  };
  org: {
    orgName: string;
    orgType: string;
    country: string;
    region?: string;
    stage?: string;
    teamSize?: string;
    description?: string;
    fundingNeeded?: string;
  };
}

/**
 * Evaluation prompt. The key difference from the original app's single-grant
 * "analyze" call: this evaluates against an actual organization profile
 * (not a generic guess), explicitly asks for REASONING behind the fit score
 * (not just a label), and asks the model to list what it still can't
 * determine rather than papering over gaps.
 */
export function buildEvaluationPrompt(ctx: EvaluationContext): string {
  return `You are a grant fit evaluation assistant. You are given one funding opportunity and one organization profile. Assess fit — do not make a final eligibility decision, since you cannot verify legal/registration details.

OPPORTUNITY:
- Name: ${ctx.opportunity.grantName}
- Funder: ${ctx.opportunity.funderName}
- Country/Region: ${ctx.opportunity.country} / ${ctx.opportunity.region}
- Category: ${ctx.opportunity.category}
- Funding type: ${ctx.opportunity.fundingType}
- Amount: ${ctx.opportunity.amount}
- Deadline: ${ctx.opportunity.deadline}
- Applicant type: ${ctx.opportunity.applicantType}
- Eligibility summary (as researched): ${ctx.opportunity.eligibilitySummary || "Not available"}
- Fields the research step could not confirm: ${ctx.opportunity.missingFields.join(", ") || "none"}

ORGANIZATION PROFILE:
- Name: ${ctx.org.orgName}
- Type: ${ctx.org.orgType}
- Country/Region: ${ctx.org.country} / ${ctx.org.region || "Not stated"}
- Stage: ${ctx.org.stage || "Not stated"}
- Team size: ${ctx.org.teamSize || "Not stated"}
- Funding needed: ${ctx.org.fundingNeeded || "Not stated"}
- Description: ${ctx.org.description || "Not stated"}

Return ONLY a JSON object with exactly this shape:
{
  "fit_score": "High" | "Medium" | "Low",
  "fit_reasoning": "2-3 sentences explaining the score using specific facts above, not a generic statement",
  "eligibility_notes": "What in the organization profile appears to meet or fail stated eligibility criteria, and why",
  "restrictions": "Any important restriction or requirement to flag, or empty string if none stated",
  "missing_info": ["list of specific facts a human still needs to verify before relying on this assessment"],
  "next_actions": ["1-3 concrete next steps, most important first"]
}

RULES:
- fit_score must be justified by fit_reasoning — do not return a score without specific reasoning tied to the facts given.
- This is a fit assessment to support a human decision, not an eligibility determination. Do not claim the organization "is eligible" — describe what matches and what's unverified.
- If a field above was already flagged as unconfirmed, include it in missing_info rather than treating it as fact.`;
}
