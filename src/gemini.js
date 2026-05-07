function cleanJson(text) {
  return String(text || "")
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();
}

function parseJsonObject(text) {
  const cleaned = cleanJson(text);

  try {
    const parsed = JSON.parse(cleaned);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) return parsed;
  } catch (_) {}

  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return null;

  try {
    return JSON.parse(cleaned.slice(start, end + 1).replace(/,\s*([}\]])/g, "$1"));
  } catch (_) {
    return null;
  }
}

export async function analyzeGrant(grant) {
  const apiKey = localStorage.getItem("gemini_api_key");
  if (!apiKey) throw new Error("No Gemini API key found. Open Gemini settings and add one.");

  const prompt = `You are a grant fit and application strategy assistant.

Analyze this funding opportunity and return ONLY a JSON object.

Grant:
- Name: ${grant.grant_name}
- Funder: ${grant.funder_name || "Unknown"}
- Country: ${grant.country || "Unknown"}
- Region: ${grant.region || "Unknown"}
- Category: ${grant.category || "Unknown"}
- Funding type: ${grant.funding_type || "Unknown"}
- Amount: ${grant.amount || "Unknown"}
- Deadline: ${grant.deadline || "Unknown"}
- Applicant type: ${grant.applicant_type || "Unknown"}
- Eligibility: ${grant.eligibility_summary || "Unknown"}
- Notes: ${grant.notes || "None"}

Return exactly this JSON shape:
{
  "fit_score": "High" | "Medium" | "Low",
  "initial_fit_guess": "Likely" | "Possible" | "Unlikely",
  "eligibility_summary": "Plain-English eligibility summary",
  "application_angle": "One sentence on how to position the application",
  "next_step": "One specific next action before applying"
}`;

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 700,
          responseMimeType: "application/json"
        }
      })
    }
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Gemini API error ${res.status}`);
  }

  const data = await res.json();
  const raw = data.candidates?.[0]?.content?.parts?.map(p => p.text || "").join("\n").trim();
  if (!raw) throw new Error("Gemini returned an empty analysis. Try again.");

  const parsed = parseJsonObject(raw);
  if (!parsed) throw new Error("Gemini could not format the analysis. Try again.");

  return {
    fit_score: parsed.fit_score || grant.fit_score || "Medium",
    initial_fit_guess: parsed.initial_fit_guess || grant.initial_fit_guess || "Possible",
    eligibility_summary: parsed.eligibility_summary || grant.eligibility_summary || "",
    application_angle: parsed.application_angle || grant.application_angle || "",
    next_step: parsed.next_step || "Open the official program page and verify the current deadline."
  };
}
