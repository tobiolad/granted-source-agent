/**
 * Labeled evaluation dataset for the discovery pipeline.
 *
 * IMPORTANT — what this is and isn't:
 * This project had no Gemini API key available during development (see
 * README "Limitations"), so these are NOT live model outputs. Each case is
 * a hand-authored fixture shaped exactly like a real Gemini discovery
 * response (raw text + the citations search-grounding would attach),
 * covering both well-formed and deliberately flawed examples. The harness
 * (run-eval.ts) runs each fixture through the SAME validation, mapping, and
 * dedup code the live app uses — so this measures whether the pipeline's
 * quality controls work, not whether Gemini itself is accurate. See
 * eval/README.md for how to re-run this against real recorded model output.
 *
 * Each case is labeled with the dimension(s) of the six-part brief it
 * exercises: extraction, citation, missing_fields, duplicates, eligibility,
 * hallucination.
 */

export type Dimension = "extraction" | "citation" | "missing_fields" | "duplicates" | "eligibility" | "hallucination";

export interface Citation {
  url: string;
  title?: string;
}

export interface EvalCase {
  id: string;
  description: string;
  dimensions: Dimension[];
  rawText: string;
  citations: Citation[];
  existingKeys?: string[];
  expected: {
    extractedCount: number;
    acceptedCount: number;
    rejectedCount: number;
    uniqueCount: number;
    duplicateCount: number;
    /** Per accepted candidate, keyed by grant_name, what we expect the pipeline to conclude. */
    perCandidate?: Record<
      string,
      {
        missingFields?: string[];
        citationSupported?: boolean;
      }
    >;
    /** Eligibility-classification cases only: ground truth vs. the model's own self-reported fit_score. */
    eligibility?: {
      grantName: string;
      modelFitScore: string;
      expectedFitScore: string;
      note: string;
    };
  };
}

export const EVAL_CASES: EvalCase[] = [
  {
    id: "clean-single",
    description: "A single well-formed candidate with a matching grounding citation.",
    dimensions: ["extraction", "citation"],
    rawText: JSON.stringify([
      {
        grant_name: "Clean Grant Example",
        funder_name: "Example Funder",
        program_url: "https://example.gov/clean-grant",
        country: "Canada",
        region: "Ontario",
        category: "Startup",
        funding_type: "Grant",
        amount: "CAD $10,000",
        deadline: "2026-12-01",
        source: "Government website",
        applicant_type: "Startup",
        eligibility_summary: "Open to incorporated Ontario startups.",
        fit_score: "High",
        urgency: "Open",
        initial_fit_guess: "Likely",
        discovery_note: "Direct match on keywords.",
        application_angle: "Lead with traction."
      }
    ]),
    citations: [{ url: "https://example.gov/clean-grant", title: "Clean Grant Example — official page" }],
    expected: {
      extractedCount: 1,
      acceptedCount: 1,
      rejectedCount: 0,
      uniqueCount: 1,
      duplicateCount: 0,
      perCandidate: { "Clean Grant Example": { missingFields: [], citationSupported: true } }
    }
  },
  {
    id: "invalid-category",
    description: "A candidate using a category outside the fixed vocabulary — must be rejected, not coerced.",
    dimensions: ["extraction"],
    rawText: JSON.stringify([
      {
        grant_name: "Off Vocabulary Grant",
        funder_name: "Example Funder",
        program_url: "https://example.gov/off-vocab",
        country: "Canada",
        category: "Food Truck",
        funding_type: "Grant",
        source: "Government website",
        fit_score: "High",
        urgency: "Open",
        initial_fit_guess: "Likely"
      }
    ]),
    citations: [{ url: "https://example.gov/off-vocab" }],
    expected: { extractedCount: 1, acceptedCount: 0, rejectedCount: 1, uniqueCount: 0, duplicateCount: 0 }
  },
  {
    id: "malformed-url",
    description: "A candidate whose program_url isn't a real URL — must be rejected.",
    dimensions: ["extraction"],
    rawText: JSON.stringify([
      {
        grant_name: "No Protocol Grant",
        funder_name: "Example Funder",
        program_url: "example.gov/no-protocol",
        country: "Canada",
        category: "Startup",
        funding_type: "Grant",
        source: "Government website",
        fit_score: "Medium",
        urgency: "Unknown",
        initial_fit_guess: "Possible"
      }
    ]),
    citations: [],
    expected: { extractedCount: 1, acceptedCount: 0, rejectedCount: 1, uniqueCount: 0, duplicateCount: 0 }
  },
  {
    id: "placeholder-values",
    description: "A valid candidate that honestly reports unknown amount/deadline/eligibility instead of guessing.",
    dimensions: ["missing_fields"],
    rawText: JSON.stringify([
      {
        grant_name: "Underspecified Grant",
        funder_name: "Example Funder",
        program_url: "https://example.gov/underspecified",
        country: "United States",
        region: "National",
        category: "Tech",
        funding_type: "Grant",
        amount: "Unknown",
        deadline: "Not stated",
        source: "Government website",
        eligibility_summary: "n/a",
        fit_score: "Medium",
        urgency: "Unknown",
        initial_fit_guess: "Possible"
      }
    ]),
    citations: [{ url: "https://example.gov/underspecified" }],
    expected: {
      extractedCount: 1,
      acceptedCount: 1,
      rejectedCount: 0,
      uniqueCount: 1,
      duplicateCount: 0,
      perCandidate: {
        "Underspecified Grant": { missingFields: ["amount", "deadline", "eligibility_summary"], citationSupported: true }
      }
    }
  },
  {
    id: "no-citations",
    description: "A valid candidate but the discovery call returned zero grounding citations.",
    dimensions: ["missing_fields", "citation"],
    rawText: JSON.stringify([
      {
        grant_name: "Uncited Grant",
        funder_name: "Example Funder",
        program_url: "https://example.gov/uncited",
        country: "Canada",
        region: "National",
        category: "Nonprofit",
        funding_type: "Grant",
        amount: "CAD $5,000",
        deadline: "2026-09-01",
        eligibility_summary: "Open to registered Canadian nonprofits.",
        source: "Nonprofit",
        fit_score: "Medium",
        urgency: "Unknown",
        initial_fit_guess: "Possible"
      }
    ]),
    citations: [],
    expected: {
      extractedCount: 1,
      acceptedCount: 1,
      rejectedCount: 0,
      uniqueCount: 1,
      duplicateCount: 0,
      perCandidate: { "Uncited Grant": { missingFields: ["source_citation"], citationSupported: false } }
    }
  },
  {
    id: "duplicate-within-batch",
    description: "The same program returned twice in one response, with a trivially different URL form.",
    dimensions: ["duplicates", "extraction"],
    rawText: JSON.stringify([
      {
        grant_name: "Repeated Grant",
        funder_name: "Example Funder",
        program_url: "https://example.gov/repeated/",
        country: "Canada",
        category: "Startup",
        funding_type: "Grant",
        source: "Government website",
        fit_score: "High",
        urgency: "Open",
        initial_fit_guess: "Likely"
      },
      {
        grant_name: "repeated grant",
        funder_name: "Example Funder",
        program_url: "https://example.gov/repeated?utm_source=search",
        country: "Canada",
        category: "Startup",
        funding_type: "Grant",
        source: "Government website",
        fit_score: "High",
        urgency: "Open",
        initial_fit_guess: "Likely"
      }
    ]),
    citations: [{ url: "https://example.gov/repeated" }],
    expected: { extractedCount: 2, acceptedCount: 2, rejectedCount: 0, uniqueCount: 1, duplicateCount: 1 }
  },
  {
    id: "duplicate-against-existing",
    description: "A re-run of a prior search returns a program already stored from an earlier discovery run.",
    dimensions: ["duplicates"],
    rawText: JSON.stringify([
      {
        grant_name: "Already Stored Grant",
        funder_name: "Example Funder",
        program_url: "https://example.gov/already-stored",
        country: "Canada",
        category: "Startup",
        funding_type: "Grant",
        source: "Government website",
        fit_score: "High",
        urgency: "Open",
        initial_fit_guess: "Likely"
      }
    ]),
    citations: [{ url: "https://example.gov/already-stored" }],
    existingKeys: ["example.gov/already-stored|already stored grant"],
    expected: { extractedCount: 1, acceptedCount: 1, rejectedCount: 0, uniqueCount: 0, duplicateCount: 1 }
  },
  {
    id: "citation-domain-mismatch",
    description: "Grounding returned a citation, but it points at a different domain than the claimed program_url — a concrete, checkable hallucination signal.",
    dimensions: ["citation", "hallucination"],
    rawText: JSON.stringify([
      {
        grant_name: "Mismatched Source Grant",
        funder_name: "Example Funder",
        program_url: "https://grants.examplefunder.org/mismatched",
        country: "United States",
        category: "Small Business",
        funding_type: "Grant",
        source: "Foundation website",
        fit_score: "Medium",
        urgency: "Unknown",
        initial_fit_guess: "Possible"
      }
    ]),
    citations: [{ url: "https://en.wikipedia.org/wiki/Example_Funder", title: "Example Funder — Wikipedia" }],
    expected: {
      extractedCount: 1,
      acceptedCount: 1,
      rejectedCount: 0,
      uniqueCount: 1,
      duplicateCount: 0,
      perCandidate: { "Mismatched Source Grant": { citationSupported: false } }
    }
  },
  {
    id: "wrapped-in-prose-and-fence",
    description: "A valid candidate, but the model wrapped it in a markdown code fence and a sentence of commentary.",
    dimensions: ["extraction"],
    rawText:
      "Here are the opportunities I found:\n```json\n" +
      JSON.stringify([
        {
          grant_name: "Fenced Grant",
          funder_name: "Example Funder",
          program_url: "https://example.gov/fenced",
          country: "Canada",
          category: "Research",
          funding_type: "Grant",
          source: "University",
          fit_score: "Medium",
          urgency: "Rolling",
          initial_fit_guess: "Possible"
        }
      ]) +
      "\n```\nLet me know if you'd like more.",
    citations: [{ url: "https://example.gov/fenced" }],
    expected: { extractedCount: 1, acceptedCount: 1, rejectedCount: 0, uniqueCount: 1, duplicateCount: 0 }
  },
  {
    id: "eligibility-mismatch",
    description:
      "Program is explicitly restricted to women-owned businesses; the organization profile doesn't match, but the model still rates it High.",
    dimensions: ["eligibility"],
    rawText: JSON.stringify([
      {
        grant_name: "Women Founders Fund",
        funder_name: "Example Foundation",
        program_url: "https://example.org/women-founders",
        country: "United States",
        category: "Women",
        funding_type: "Grant",
        applicant_type: "Women-owned business",
        eligibility_summary: "Open exclusively to women-owned businesses.",
        source: "Foundation website",
        fit_score: "High",
        urgency: "Open",
        initial_fit_guess: "Likely"
      }
    ]),
    citations: [{ url: "https://example.org/women-founders" }],
    expected: {
      extractedCount: 1,
      acceptedCount: 1,
      rejectedCount: 0,
      uniqueCount: 1,
      duplicateCount: 0,
      eligibility: {
        grantName: "Women Founders Fund",
        modelFitScore: "High",
        expectedFitScore: "Low",
        note: "Eligibility text explicitly restricts to women-owned businesses; a mixed-gender-founded applicant should not read as a High fit."
      }
    }
  },
  {
    id: "eligibility-match",
    description: "Program targeting youth founders, model rates it Medium for a youth-founder applicant — a reasonable, non-overconfident score.",
    dimensions: ["eligibility"],
    rawText: JSON.stringify([
      {
        grant_name: "Youth Founder Launchpad",
        funder_name: "Example Foundation",
        program_url: "https://example.org/youth-launchpad",
        country: "Canada",
        category: "Youth",
        funding_type: "Grant",
        applicant_type: "Youth founder",
        eligibility_summary: "Open to founders aged 18-29 with an early-stage business.",
        source: "Foundation website",
        fit_score: "Medium",
        urgency: "Rolling",
        initial_fit_guess: "Possible"
      }
    ]),
    citations: [{ url: "https://example.org/youth-launchpad" }],
    expected: {
      extractedCount: 1,
      acceptedCount: 1,
      rejectedCount: 0,
      uniqueCount: 1,
      duplicateCount: 0,
      eligibility: {
        grantName: "Youth Founder Launchpad",
        modelFitScore: "Medium",
        expectedFitScore: "Medium",
        note: "Applicant type matches; Medium (not High) is appropriate without more profile detail."
      }
    }
  },
  {
    id: "mixed-batch",
    description: "A realistic batch: one clean candidate, one invalid candidate, and a duplicate of the clean one.",
    dimensions: ["extraction", "duplicates"],
    rawText: JSON.stringify([
      {
        grant_name: "Batch Clean Grant",
        funder_name: "Example Funder",
        program_url: "https://example.gov/batch-clean",
        country: "Canada",
        category: "Startup",
        funding_type: "Grant",
        source: "Government website",
        fit_score: "High",
        urgency: "Open",
        initial_fit_guess: "Likely"
      },
      {
        grant_name: "Batch Invalid Grant",
        funder_name: "Example Funder",
        program_url: "https://example.gov/batch-invalid",
        country: "Canada",
        category: "Not A Category",
        funding_type: "Grant",
        source: "Government website",
        fit_score: "High",
        urgency: "Open",
        initial_fit_guess: "Likely"
      },
      {
        grant_name: "Batch Clean Grant",
        funder_name: "Example Funder",
        program_url: "https://example.gov/batch-clean/",
        country: "Canada",
        category: "Startup",
        funding_type: "Grant",
        source: "Government website",
        fit_score: "High",
        urgency: "Open",
        initial_fit_guess: "Likely"
      }
    ]),
    citations: [{ url: "https://example.gov/batch-clean" }],
    expected: { extractedCount: 3, acceptedCount: 2, rejectedCount: 1, uniqueCount: 1, duplicateCount: 1 }
  }
];
