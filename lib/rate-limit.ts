/**
 * In-memory, fixed-window rate limiter.
 *
 * Purpose: a server-held Gemini key must not be exposed to "uncontrolled
 * usage" from the browser (project requirement). This caps how many live
 * research calls a single client can make in a window.
 *
 * Known limitation (documented here on purpose, see README "Limitations"):
 * this state lives in one Node process. On a serverless platform with
 * multiple instances/regions, each instance has its own counter, so the
 * *effective* limit is the per-instance limit times however many instances
 * are warm — not a global cap. For a single-instance deploy (e.g. a small
 * VM, a container, or `next start` on one machine) it works as intended.
 * A production system handling real traffic would move this to Redis
 * (e.g. Upstash) — intentionally out of scope here to avoid paying for
 * infrastructure a personal project doesn't need.
 */

interface Bucket {
  count: number;
  windowStart: number;
}

const WINDOW_MS = 60_000;
const buckets = new Map<string, Bucket>();

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  limit: number;
  resetAt: number;
}

export function checkRateLimit(key: string, limit: number): RateLimitResult {
  const now = Date.now();
  const existing = buckets.get(key);

  if (!existing || now - existing.windowStart >= WINDOW_MS) {
    buckets.set(key, { count: 1, windowStart: now });
    return { allowed: true, remaining: limit - 1, limit, resetAt: now + WINDOW_MS };
  }

  if (existing.count >= limit) {
    return { allowed: false, remaining: 0, limit, resetAt: existing.windowStart + WINDOW_MS };
  }

  existing.count += 1;
  return { allowed: true, remaining: limit - existing.count, limit, resetAt: existing.windowStart + WINDOW_MS };
}

/** Test-only hook to reset state between unit tests. */
export function __resetRateLimitsForTests() {
  buckets.clear();
}
