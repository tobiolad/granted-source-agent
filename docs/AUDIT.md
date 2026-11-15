# Audit of the original application

This is the detailed audit performed before any rebuild work started, referenced from the main README.
The original app lived entirely in `src/` as a Vite + React 18 single-page app: 7 files, roughly 700 lines,
one Git commit.

## Architecture

Single component tree, no router, no backend, no database:

- `Home.jsx` — grant list, filters, stat cards, CSV export, inline `<style>` objects for everything (no CSS
  framework).
- `AgentPanel.jsx` — the discovery search form.
- `GeminiSettings.jsx` — the API key input.
- `agent.js` — the discovery Gemini call.
- `gemini.js` — the per-grant "analyze" Gemini call.
- `data/sampleGrants.js` — 4 sample records.

**Verdict:** reasonable for a weekend prototype, not for a system meant to demonstrate backend engineering,
data modeling, or testing discipline.

## Gemini integration

Both `agent.js` and `gemini.js` called `generativelanguage.googleapis.com` directly from the browser via
`fetch`, with Google Search grounding used for discovery. The prompt engineering was genuinely decent: it
asked for real public sources, used exact enums for categorical fields, and instructed the model to use
`"Unknown"` rather than invent a value. It included a JSON-repair fallback call if the model wrapped its
answer in prose.

**The real gap:** the app never read Gemini's grounding metadata — the actual search-result citations the
API returns alongside a grounded response. It trusted whatever `program_url` string the model typed into its
own JSON. That's the main hallucination surface this rebuild closes.

**Verdict:** keep the prompt's existing discipline, replace the "trust the model's own URL" pattern with
real grounding citations, move the call server-side.

## API key handling

The user's own Gemini key was pasted into the UI, stored in `localStorage` in plaintext, and sent as a URL
query parameter on every request. That's an acceptable pattern for a personal bring-your-own-key toy. It
directly fails the brief's security bar for a public portfolio demo: a public page can't ask visitors to
paste a paid API key, and a key sitting in `localStorage` (or a URL) is exposed to anything that can read the
page — any XSS on the page, or a browser extension with page access.

**Verdict:** replace entirely. The live-mode key now lives only in a server environment variable, never
requested from or sent to the browser.

## Data model

`sampleGrants.js` had 4 realistic, clearly-fictional-but-based-on-real-programs sample records. The flat
schema had good bones: `fit_score` (the AI's confidence) was already kept conceptually separate from
`initial_fit_guess` (an eligibility guess), and `discovery_date` / `status` / `notes` existed.

What was missing:

- No field distinguished AI-asserted information from a human's confirmation of it.
- No citation or source list beyond a single URL string.
- No verification status a human could actually set.
- `status` existed in the data model, but **there was no UI control to change it** — the review/decision
  workflow the brief asks for didn't exist yet, despite data model support suggesting it was intended.

**Verdict:** extend the schema (citations, `missingFields`, `reviewStatus`/`reviewNotes` separate from AI
fields), and actually build the review UI the original data model implied but never got.

## Deduplication

Present, but minimal: a `programUrl|grantName` lowercase string key, computed inline in `AgentPanel.jsx`.

**Verdict:** keep the concept, make it a reusable, tested function (`lib/dedup.ts`), and make URL
normalization more robust (strip tracking params, trailing slashes, scheme/case differences) since the same
program page can come back from search in slightly different URL forms across runs.

## CSV export

A working, correctly quote-escaped CSV export of the filtered grant list.

**Verdict:** keep the logic, move it into a reusable, tested function (`lib/csv.ts`), extend the exported
columns to include the new citation/review fields.

## Security, reliability, maintainability, UX

- No tests of any kind.
- No backend, no persistence beyond `localStorage` (which is per-browser, not shareable, and easy to lose).
- No rate limiting — nothing stopped a page left open from exhausting whatever key was pasted in.
- No loading/error state discipline beyond basic try/catch around the two Gemini calls.
- No distinction between demo data and live results — once a user added a key, sample and real-discovered
  grants sat in the same list with no visual distinction.
- Styling was maintainable at this size (700 lines) but wouldn't scale, and doesn't present as a
  "serious analytics or AI product" per the brief's design bar.

**Verdict:** this is most of why a rebuild — not a redesign — was the right call. These are structural gaps,
not surface-level ones.

## What was preserved as-is (unchanged in spirit)

- The grant/opportunity field set, extended rather than replaced.
- The discovery prompt's core constraints ("don't invent, use Unknown, exact enums, prefer official
  sources").
- The CSV export's column-escaping logic.
- The dedup concept (`programUrl` + `grantName` as the identity key).
- The overall "search → review list → act" shape of the UI, now split into a proper discover/detail/review
  flow.

## What was replaced outright

- Client-side Gemini calls → server-side API routes.
- `localStorage`-based API key entry → server environment variable, no UI for it.
- `localStorage` persistence → SQLite via Prisma.
- Inline `style={{}}` objects → Tailwind CSS with a defined design system.
- No validation → Zod schemas at every boundary, including validating the model's own output.
