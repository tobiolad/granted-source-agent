/**
 * Shared, reusable metric helpers for the eval harness (eval/run-eval.ts).
 * Kept in lib/ rather than eval/ because they're plain functions over the
 * same data shapes the app itself uses — no reason to duplicate them.
 */

/**
 * Proxy for "is this claimed source actually backed by a real citation."
 * We can't fact-check a URL's content, so this checks the weaker but
 * checkable thing: does the opportunity's program_url share a hostname with
 * at least one of the citations Gemini's grounding actually returned. A
 * mismatch is a concrete, checkable signal that the model's claimed source
 * isn't the one grounding found — one concrete form of "unsupported claim."
 */
export function citationSupportsUrl(programUrl: string, citations: { url: string }[]): boolean {
  if (citations.length === 0) return false;
  try {
    const targetHost = new URL(programUrl).hostname.replace(/^www\./, "");
    return citations.some((c) => {
      try {
        return new URL(c.url).hostname.replace(/^www\./, "") === targetHost;
      } catch {
        return false;
      }
    });
  } catch {
    return false;
  }
}
