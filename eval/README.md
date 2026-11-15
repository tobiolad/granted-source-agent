# Evaluation methodology

`npm run eval` runs [`run-eval.ts`](./run-eval.ts) against the labeled cases in
[`dataset.ts`](./dataset.ts) and writes [`report.json`](./report.json). No
network calls, no API key, deterministic — safe to run anywhere, including CI.

## What this evaluates, and what it doesn't

**This project had no Gemini API key available during development** (see the
main README's "Limitations" section). That means this harness cannot be a
live-model benchmark — there was no live model to benchmark against.

Instead, each case in `dataset.ts` is a **hand-authored fixture**, written in
the exact shape a real Gemini discovery response takes (raw text, plus the
citations search-grounding would attach), covering both well-formed and
deliberately flawed examples. The harness runs every fixture through the
**real production pipeline** — `extractJsonArray` → `DiscoveredOpportunitySchema`
validation → `mapDiscoveredOpportunity` → `partitionDuplicates` — the same
functions `/api/discover` calls.

So this answers: *"does the pipeline's quality-control logic behave
correctly when it receives output shaped like X?"* — not *"is Gemini
accurate?"*. Those are different questions, and conflating them would be
exactly the kind of inflated claim the project brief warned against.

If you have a Gemini API key, the path to turning this into a live-model
eval is: run a few real discovery/evaluation calls, save the raw
response text and grounding citations to new fixtures in the same shape as
`dataset.ts`, and add them as new cases — the harness itself needs no
changes, because it already operates on "raw text + citations in, pipeline
output out." That's intentional future work, not done here, so as not to
claim a live evaluation that never happened.

## The six dimensions, and how each is measured

| Dimension | What's measured | How |
|---|---|---|
| Extraction accuracy | Can the pipeline recover well-formed JSON from noisy model text (code fences, prose), and does schema validation correctly accept good records and reject malformed ones (bad enum, bad URL)? | `extractedCount`, `acceptedCount`, `rejectedCount` per case |
| Source citation accuracy | Does the opportunity's claimed `program_url` actually match a domain the grounding step returned? | `citationSupportsUrl` — hostname match between `program_url` and the case's citations |
| Missing-field handling | When amount/deadline/eligibility/region/citations aren't confirmed, does the pipeline flag them instead of defaulting silently? | `missingFields` per candidate |
| Duplicate detection | Are repeated opportunities within one batch, and repeats of an already-stored opportunity, both caught? | `uniqueCount` / `duplicateCount` via `partitionDuplicates` |
| Eligibility classification quality | Does the model's self-reported `fit_score` match what a human reviewer would expect from the stated eligibility text? | Labeled `expected.eligibility` vs. the fixture's `fit_score` |
| Unsupported / hallucinated claims | The same citation-domain-mismatch check above is the concrete, checkable proxy used here — see caveat below. | `citationSupportsUrl` |

**Caveat on hallucination detection:** we can't fact-check a claim's
*content* without a second, independent research step (out of scope for
this project). `citationSupportsUrl` only catches one concrete form of
unsupported claim — citing a source whose domain doesn't match the claimed
program page. A model that invents a plausible-looking amount on a
real, correctly-cited page would not be caught by this check. This is a
genuine limitation, stated here rather than glossed over.

## Reading the result

The current run is **11/12 cases passing**, and that's by design, not a bug
to chase to 12/12: the `eligibility-mismatch` case exists specifically to
demonstrate that the harness *can* catch a case where the model's
self-reported fit score disagrees with what the stated eligibility text
supports. That "failure" is the harness working — it's exactly the kind of
disagreement a human review step exists to catch before anyone relies on
the AI's score. A dataset that only ever reports 100% would be a sign the
cases aren't testing anything hard, not a sign of a better pipeline.

## Extending the dataset

Add a new object to the `EVAL_CASES` array in `dataset.ts` following the
existing shape: `rawText` (a JSON string, optionally wrapped in prose/fences
to test parser robustness), `citations`, optional `existingKeys` for
duplicate-detection cases, and an `expected` block. Run `npm run eval` to see
it included in both the console output and `report.json`.
