/**
 * Evaluation harness. Run with `npm run eval`.
 *
 * Runs every case in eval/dataset.ts through the real pipeline (JSON
 * extraction -> schema validation -> field-mapping / missing-field
 * detection -> dedup) and compares the result against hand-written
 * expectations. No network calls, no API key needed, deterministic.
 *
 * Exit code is non-zero if any case fails, so this is safe to wire into CI.
 */
import { extractJsonArray } from "../lib/json-extract";
import { DiscoveredOpportunitySchema } from "../lib/validation";
import { mapDiscoveredOpportunity, type MappedOpportunity } from "../lib/opportunity-mapper";
import { partitionDuplicates } from "../lib/dedup";
import { citationSupportsUrl } from "../lib/eval-metrics";
import { EVAL_CASES, type Dimension, type EvalCase } from "./dataset";
import { writeFileSync } from "node:fs";
import path from "node:path";

interface CaseResult {
  id: string;
  description: string;
  dimensions: Dimension[];
  pass: boolean;
  failures: string[];
}

function runCase(testCase: EvalCase): CaseResult {
  const failures: string[] = [];

  const extracted = extractJsonArray(testCase.rawText) || [];
  if (extracted.length !== testCase.expected.extractedCount) {
    failures.push(`extractedCount: expected ${testCase.expected.extractedCount}, got ${extracted.length}`);
  }

  const accepted: MappedOpportunity[] = [];
  let rejected = 0;

  for (const candidate of extracted) {
    const result = DiscoveredOpportunitySchema.safeParse(candidate);
    if (!result.success) {
      rejected += 1;
      continue;
    }
    accepted.push(mapDiscoveredOpportunity(result.data, testCase.citations, "live"));
  }

  if (accepted.length !== testCase.expected.acceptedCount) {
    failures.push(`acceptedCount: expected ${testCase.expected.acceptedCount}, got ${accepted.length}`);
  }
  if (rejected !== testCase.expected.rejectedCount) {
    failures.push(`rejectedCount: expected ${testCase.expected.rejectedCount}, got ${rejected}`);
  }

  const existingKeys = new Set(testCase.existingKeys || []);
  const { unique, duplicateCount } = partitionDuplicates(
    accepted.map((a) => ({ ...a, program_url: a.programUrl, grant_name: a.grantName })),
    existingKeys
  );

  if (unique.length !== testCase.expected.uniqueCount) {
    failures.push(`uniqueCount: expected ${testCase.expected.uniqueCount}, got ${unique.length}`);
  }
  if (duplicateCount !== testCase.expected.duplicateCount) {
    failures.push(`duplicateCount: expected ${testCase.expected.duplicateCount}, got ${duplicateCount}`);
  }

  if (testCase.expected.perCandidate) {
    for (const [grantName, expectation] of Object.entries(testCase.expected.perCandidate)) {
      const match = accepted.find((a) => a.grantName.toLowerCase() === grantName.toLowerCase());
      if (!match) {
        failures.push(`perCandidate[${grantName}]: candidate not found among accepted results`);
        continue;
      }
      if (expectation.missingFields) {
        const got = [...match.missingFields].sort();
        const want = [...expectation.missingFields].sort();
        if (JSON.stringify(got) !== JSON.stringify(want)) {
          failures.push(`perCandidate[${grantName}].missingFields: expected ${JSON.stringify(want)}, got ${JSON.stringify(got)}`);
        }
      }
      if (expectation.citationSupported !== undefined) {
        const got = citationSupportsUrl(match.programUrl, match.citations);
        if (got !== expectation.citationSupported) {
          failures.push(`perCandidate[${grantName}].citationSupported: expected ${expectation.citationSupported}, got ${got}`);
        }
      }
    }
  }

  if (testCase.expected.eligibility) {
    const { modelFitScore, expectedFitScore, grantName } = testCase.expected.eligibility;
    // This is a labeled disagreement check, not a pipeline bug: the dataset
    // records what the MODEL said vs. what a human reviewer would expect,
    // so the "failure" when they differ is informative, not a defect to fix
    // in code — it's exactly the gap a human-in-the-loop review step exists
    // to catch. We still record it, since under-reporting this would be the
    // "don't manufacture impressive scores" mistake the brief warns against.
    if (modelFitScore !== expectedFitScore) {
      failures.push(
        `eligibility[${grantName}]: model said "${modelFitScore}", labeled expectation is "${expectedFitScore}" — flag for human review, not a pipeline defect`
      );
    }
  }

  return { id: testCase.id, description: testCase.description, dimensions: testCase.dimensions, pass: failures.length === 0, failures };
}

function summarizeByDimension(results: CaseResult[]) {
  const dims = new Map<Dimension, { total: number; passed: number }>();
  for (const r of results) {
    for (const d of r.dimensions) {
      const entry = dims.get(d) || { total: 0, passed: 0 };
      entry.total += 1;
      if (r.pass) entry.passed += 1;
      dims.set(d, entry);
    }
  }
  return dims;
}

function main() {
  const results = EVAL_CASES.map(runCase);
  const dims = summarizeByDimension(results);
  const overallPassed = results.filter((r) => r.pass).length;

  console.log(`\nAI Grant Research & Intelligence Platform — pipeline evaluation\n${"=".repeat(64)}`);
  for (const r of results) {
    console.log(`${r.pass ? "✓" : "✗"} ${r.id} — ${r.description}`);
    for (const f of r.failures) console.log(`    - ${f}`);
  }

  console.log(`\nBy dimension:`);
  for (const [dim, { total, passed }] of dims) {
    console.log(`  ${dim.padEnd(16)} ${passed}/${total} cases passed`);
  }

  console.log(`\nOverall: ${overallPassed}/${results.length} cases passed\n`);

  const report = {
    generatedAt: new Date().toISOString(),
    note: "Fixture-based pipeline evaluation — see eval/README.md. Not a live-model benchmark.",
    overall: { passed: overallPassed, total: results.length },
    byDimension: Object.fromEntries([...dims.entries()].map(([k, v]) => [k, v])),
    cases: results
  };

  writeFileSync(path.resolve(__dirname, "report.json"), JSON.stringify(report, null, 2));
  console.log(`Report written to eval/report.json`);

  if (overallPassed !== results.length) {
    process.exitCode = 1;
  }
}

main();
