import { logger } from "./logger";

/**
 * Server-side Gemini client for LIVE mode only. This file is never imported
 * by client components — Next.js route handlers are the only callers, so the
 * API key never reaches the browser.
 *
 * IMPORTANT (see README "Limitations"): this module was implemented against
 * the documented Gemini API request/response shape for Google Search
 * grounding (`tools: [{ google_search: {} }]`, which returns
 * `candidates[0].groundingMetadata.groundingChunks[].web.{uri,title}`). It
 * has NOT been exercised against the live API in this project's current
 * state — no API key was available during development. Automated tests and
 * the eval harness run against recorded fixture responses shaped like real
 * API output, not live calls. Anyone enabling LIVE_MODE with a real key
 * should treat the first few runs as a verification pass, not an assumption
 * that this is already proven end-to-end.
 */

const GEMINI_MODEL = "gemini-2.5-flash";
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

export interface GeminiGroundedResult {
  text: string;
  citations: { url: string; title?: string }[];
}

interface GeminiCandidatePart {
  text?: string;
}

interface GeminiGroundingChunk {
  web?: { uri?: string; title?: string };
}

interface GeminiResponseBody {
  candidates?: {
    content?: { parts?: GeminiCandidatePart[] };
    groundingMetadata?: { groundingChunks?: GeminiGroundingChunk[] };
  }[];
  error?: { message?: string };
}

async function callGemini(params: {
  apiKey: string;
  prompt: string;
  temperature: number;
  maxOutputTokens: number;
  grounded: boolean;
  jsonMime?: boolean;
}): Promise<GeminiResponseBody> {
  const { apiKey, prompt, temperature, maxOutputTokens, grounded, jsonMime } = params;

  const body: Record<string, unknown> = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      temperature,
      maxOutputTokens,
      ...(jsonMime ? { responseMimeType: "application/json" } : {})
    }
  };

  if (grounded) {
    body.tools = [{ google_search: {} }];
  }

  const res = await fetch(`${GEMINI_ENDPOINT}?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });

  const data = (await res.json().catch(() => ({}))) as GeminiResponseBody;

  if (!res.ok) {
    logger.error("gemini.request_failed", { status: res.status, message: data?.error?.message });
    throw new Error(data?.error?.message || `Gemini API error ${res.status}`);
  }

  return data;
}

/**
 * Runs a Google-Search-grounded generation call and returns the model's text
 * alongside the REAL source URLs Gemini's grounding reports — not whatever
 * URL string the model happens to type into its own JSON output. This is
 * the main defence against citing a hallucinated or mismatched source.
 */
export async function generateGrounded(params: {
  apiKey: string;
  prompt: string;
  temperature?: number;
  maxOutputTokens?: number;
}): Promise<GeminiGroundedResult> {
  const data = await callGemini({
    apiKey: params.apiKey,
    prompt: params.prompt,
    temperature: params.temperature ?? 0.2,
    maxOutputTokens: params.maxOutputTokens ?? 5000,
    grounded: true
  });

  const candidate = data.candidates?.[0];
  const text = candidate?.content?.parts?.map((p) => p.text || "").join("\n").trim() || "";

  const citations = (candidate?.groundingMetadata?.groundingChunks || [])
    .map((chunk) => chunk.web)
    .filter((web): web is { uri: string; title?: string } => Boolean(web?.uri))
    .map((web) => ({ url: web.uri, title: web.title }));

  // De-duplicate citations that point at the same URL.
  const seen = new Set<string>();
  const uniqueCitations = citations.filter((c) => {
    if (seen.has(c.url)) return false;
    seen.add(c.url);
    return true;
  });

  return { text, citations: uniqueCitations };
}

/** Ungrounded JSON generation, used for the evaluation step and JSON repair. */
export async function generateJson(params: {
  apiKey: string;
  prompt: string;
  temperature?: number;
  maxOutputTokens?: number;
}): Promise<string> {
  const data = await callGemini({
    apiKey: params.apiKey,
    prompt: params.prompt,
    temperature: params.temperature ?? 0.2,
    maxOutputTokens: params.maxOutputTokens ?? 1200,
    grounded: false,
    jsonMime: true
  });

  const candidate = data.candidates?.[0];
  return candidate?.content?.parts?.map((p) => p.text || "").join("\n").trim() || "";
}

export function isLiveModeConfigured(): boolean {
  return Boolean(process.env.GEMINI_API_KEY);
}
