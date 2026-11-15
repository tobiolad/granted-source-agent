/**
 * Tolerant JSON extraction from LLM text output.
 *
 * Models asked to "return only JSON" sometimes still wrap it in a code
 * fence or add a stray sentence. This strips common wrappers and, failing a
 * direct parse, falls back to slicing between the first/last bracket. It
 * does NOT invent or repair field values — it only recovers well-formed JSON
 * that's surrounded by noise. Ported and generalized from the original
 * app's `cleanJson`/`parseGrantArray`/`parseJsonObject` helpers.
 */

function stripCodeFence(text: string): string {
  return String(text || "")
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();
}

function tryParse(text: string): unknown | null {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export function extractJsonArray(text: string): unknown[] | null {
  const cleaned = stripCodeFence(text);

  const direct = tryParse(cleaned);
  if (Array.isArray(direct)) return direct;
  if (direct && typeof direct === "object") {
    const obj = direct as Record<string, unknown>;
    if (Array.isArray(obj.grants)) return obj.grants;
    if (Array.isArray(obj.opportunities)) return obj.opportunities;
  }

  const start = cleaned.indexOf("[");
  const end = cleaned.lastIndexOf("]");
  if (start === -1 || end === -1 || end <= start) return null;

  const sliced = tryParse(cleaned.slice(start, end + 1).replace(/,\s*([}\]])/g, "$1"));
  return Array.isArray(sliced) ? sliced : null;
}

export function extractJsonObject(text: string): Record<string, unknown> | null {
  const cleaned = stripCodeFence(text);

  const direct = tryParse(cleaned);
  if (direct && typeof direct === "object" && !Array.isArray(direct)) {
    return direct as Record<string, unknown>;
  }

  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return null;

  const sliced = tryParse(cleaned.slice(start, end + 1).replace(/,\s*([}\]])/g, "$1"));
  return sliced && typeof sliced === "object" && !Array.isArray(sliced) ? (sliced as Record<string, unknown>) : null;
}
