/**
 * Duplicate detection for discovered opportunities.
 *
 * Ported from the original app's inline `programUrl|grantName` key check,
 * made reusable and a bit more robust: URLs are normalized (scheme/host
 * case, trailing slash, tracking query params) before comparing, since the
 * same program page can come back from search with slightly different URL
 * forms across runs.
 */

function normalizeUrl(url: string): string {
  try {
    const u = new URL(url);
    u.hash = "";
    // Strip common tracking params that don't change the destination.
    ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"].forEach((p) =>
      u.searchParams.delete(p)
    );
    let normalized = `${u.hostname.toLowerCase()}${u.pathname.replace(/\/+$/, "")}`;
    const remainingParams = u.searchParams.toString();
    if (remainingParams) normalized += `?${remainingParams}`;
    return normalized;
  } catch {
    return url.trim().toLowerCase();
  }
}

function normalizeName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, " ");
}

export function dedupKey(opportunity: { program_url: string; grant_name: string }): string {
  return `${normalizeUrl(opportunity.program_url)}|${normalizeName(opportunity.grant_name)}`;
}

/**
 * Splits newly discovered opportunities into unique vs. duplicates of what's
 * already stored, using both an existing-key set and de-duplication within
 * the new batch itself (a single discovery run can return the same program
 * twice via different search snippets).
 */
export function partitionDuplicates<T extends { program_url: string; grant_name: string }>(
  candidates: T[],
  existingKeys: Set<string>
): { unique: T[]; duplicateCount: number } {
  const seen = new Set(existingKeys);
  const unique: T[] = [];
  let duplicateCount = 0;

  for (const candidate of candidates) {
    const key = dedupKey(candidate);
    if (seen.has(key)) {
      duplicateCount += 1;
      continue;
    }
    seen.add(key);
    unique.push(candidate);
  }

  return { unique, duplicateCount };
}
