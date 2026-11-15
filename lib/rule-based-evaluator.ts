import type { EvaluationResult } from "./validation";

/**
 * DEMO MODE evaluator — a transparent, rule-based baseline. It is NOT an LLM
 * call and makes no claim to the nuance an LLM evaluation would provide;
 * it exists so the demo (no API key, no cost) still produces something
 * real and explainable, and so the eval framework has a baseline to compare
 * live LLM evaluations against (see eval/README.md).
 *
 * Every number here is a simple, named rule — on purpose, so a reader can
 * see exactly why a score came out the way it did.
 */

interface RuleInput {
  opportunity: {
    country: string;
    category: string;
    fundingType: string;
    programUrl: string;
    applicationAngle: string;
    missingFields: string[];
  };
  org: {
    orgType: string;
    country: string;
  };
}

const ORG_TYPE_TO_CATEGORY: Record<string, string[]> = {
  Startup: ["Startup", "Tech", "Mixed"],
  "Small business": ["Small Business", "Mixed"],
  Nonprofit: ["Nonprofit", "Mixed"],
  "Social enterprise": ["Nonprofit", "Mixed", "Climate"],
  Research: ["Research", "Tech"],
  Other: ["Mixed"]
};

export function evaluateWithRules(input: RuleInput): EvaluationResult {
  const { opportunity, org } = input;
  const reasons: string[] = [];
  let score = 0;

  const countryMatches = opportunity.country === org.country || opportunity.country === "Canada/US";
  if (countryMatches) {
    score += 2;
    reasons.push(`country/region (${opportunity.country}) matches the organization's location`);
  } else {
    reasons.push(`country (${opportunity.country}) does not match the organization's location (${org.country})`);
  }

  const expectedCategories = ORG_TYPE_TO_CATEGORY[org.orgType] || [];
  const categoryMatches = expectedCategories.includes(opportunity.category);
  if (categoryMatches) {
    score += 1;
    reasons.push(`category "${opportunity.category}" fits an organization of type "${org.orgType}"`);
  }

  if (opportunity.fundingType === "Grant") {
    score += 1;
    reasons.push("funding type is a non-dilutive grant");
  }

  const criticalMissing = opportunity.missingFields.filter((f) => ["amount", "deadline", "eligibility_summary"].includes(f));
  score -= Math.max(0, criticalMissing.length - 1);
  if (criticalMissing.length > 0) {
    reasons.push(`${criticalMissing.length} key field(s) unconfirmed by research (${criticalMissing.join(", ")})`);
  }

  const fitScore: EvaluationResult["fit_score"] = score >= 3 ? "High" : score >= 1 ? "Medium" : "Low";

  const nextActions = [
    `Confirm the current deadline and amount directly on the official page: ${opportunity.programUrl}`,
    ...(opportunity.missingFields.length > 0
      ? [`Verify unconfirmed detail(s) with the funder: ${opportunity.missingFields.join(", ")}`]
      : []),
    opportunity.applicationAngle
      ? `If eligible, prepare an application note around: ${opportunity.applicationAngle}`
      : "Review the program's stated priorities before drafting an application."
  ];

  return {
    fit_score: fitScore,
    fit_reasoning: `Rule-based demo score (${score} points): ${reasons.join("; ")}.`,
    eligibility_notes: countryMatches
      ? "Location requirement appears satisfied based on stated country/region. Category and applicant-type fit should still be confirmed against the full program guidelines."
      : "Location does not match what's on file for this opportunity — likely ineligible unless the program explicitly accepts applicants outside its stated region.",
    restrictions: "",
    missing_info: opportunity.missingFields,
    next_actions: nextActions.slice(0, 3)
  };
}
