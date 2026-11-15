import type { NextRequest } from "next/server";

/** Best-effort client identifier for rate limiting. Not auth — just abuse control. */
export function getClientKey(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || "unknown";
  return request.headers.get("x-real-ip") || "local";
}
