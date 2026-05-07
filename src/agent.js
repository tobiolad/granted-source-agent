/**
 * Gemini-powered grant discovery agent.
 * Uses Google Search grounding to find real public grant and funding programs.
 */

const TODAY = new Date().toISOString().slice(0, 10);

function buildPrompt({ keywords, country, category, applicantType, maxGrants }) {
  return `You are a grant discovery agent for Inscend GRANTED Lead Radar.

Your job is to find real, publicly listed grants, funding programs, competitions, accelerators, tax credits, or non-dilutive funding opportunities in Canada and the United States.

SEARCH CRITERIA:
- Keywords: ${keywords}
- Country: ${country}
- Category: ${category}
- Applicant type: ${applicantType}

SEARCH STRATEGY:
Use Google Search to find official and reliable sources. Prioritize:
- government websites
- foundation websites
- university or accelerator pages
- nonprofit funder pages
- official program pages

Try searches like:
- ${keywords} ${country} grant funding ${category}
- site:.gov ${keywords} grant ${country}
- site:.gc.ca ${keywords} grant Canada
- site:.org ${keywords} funding ${category}
- startup grant ${country} ${category}

FOR EACH OPPORTUNITY, extract these fields:
- grant_name: official program or opportunity name
- funder_name: funder, agency, foundation, or organization
- program_url: official public URL
- country: exactly "Canada", "United States", or "Canada/US"
- region: province, state, city, or "National"
- category: exactly one of "Startup", "Nonprofit", "Research", "Small Business", "Youth", "Women", "BIPOC", "Climate", "Tech", "Arts", "Mixed"
- funding_type: exactly one of "Grant", "Loan", "Prize", "Accelerator", "Tax Credit", "Other"
- amount: funding amount if visible, otherwise "Not stated"
- deadline: deadline if visible, "Rolling" if rolling, or "Unknown"
- source: exactly one of "Government website", "Foundation website", "Accelerator", "University", "Nonprofit", "Other"
- applicant_type: who can apply
- eligibility_summary: short plain-English eligibility summary
- fit_score: "High" if strong match, "Medium" if partial match, "Low" if weak or unclear
- urgency: exactly one of "Closing Soon", "Open", "Rolling", "Unknown", "Closed"
- initial_fit_guess: exactly one of "Likely", "Possible", "Unlikely"
- discovery_note: one sentence explaining why this is relevant
- application_angle: one sentence suggesting how to position an application
- status: "New"
- discovery_date: "${TODAY}"
- notes: short caution or detail if needed

RULES:
- Only include REAL opportunities you can find through search.
- Prefer official program pages over blog roundups.
- Do not invent deadlines, amounts, or eligibility.
- If deadline is unclear, use "Unknown".
- If a program appears closed, set urgency to "Closed" and initial_fit_guess to "Unlikely".
- Skip scholarships unless the keywords clearly ask for student funding.
- Find up to ${maxGrants} opportunities.

RESPONSE FORMAT:
Return ONLY a raw JSON array. No markdown. No code fences. No explanation.
Start with [ and end with ].`;
}

function cleanJson(text) {
  return String(text || "")
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();
}

function parseGrantArray(text) {
  const cleaned = cleanJson(text);

  try {
    const parsed = JSON.parse(cleaned);
    if (Array.isArray(parsed)) return parsed;
    if (Array.isArray(parsed?.grants)) return parsed.grants;
    if (Array.isArray(parsed?.opportunities)) return parsed.opportunities;
  } catch (_) {}

  const start = cleaned.indexOf("[");
  const end = cleaned.lastIndexOf("]");
  if (start === -1 || end === -1 || end <= start) return null;

  try {
    return JSON.parse(cleaned.slice(start, end + 1).replace(/,\s*([}\]])/g, "$1"));
  } catch (_) {
    return null;
  }
}

async function repairGrantArray({ raw, apiKey, category }) {
  const repairPrompt = `Convert this search result into ONLY a JSON array of grant opportunity objects.

Return [] if there are no real grants or funding opportunities.
Do not invent anything.
Use this category when missing: ${category}

Required fields:
grant_name, funder_name, program_url, country, region, category, funding_type, amount, deadline, source, applicant_type, eligibility_summary, fit_score, urgency, initial_fit_guess, discovery_note, application_angle, status, discovery_date, notes

Text:
${raw}`;

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: repairPrompt }] }],
        generationConfig: {
          temperature: 0,
          maxOutputTokens: 5000,
          responseMimeType: "application/json"
        }
      })
    }
  );

  if (!res.ok) return null;
  const data = await res.json().catch(() => null);
  const repaired = data?.candidates?.[0]?.content?.parts?.map(p => p.text || "").join("\n");
  return parseGrantArray(repaired);
}

export async function runDiscovery({ keywords, country, category, applicantType, maxGrants = 10 }) {
  const apiKey = localStorage.getItem("gemini_api_key");
  if (!apiKey) throw new Error("No Gemini API key found. Open Gemini settings and add one.");

  const prompt = buildPrompt({ keywords, country, category, applicantType, maxGrants });

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        tools: [{ google_search: {} }],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 5000
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
  if (!raw) throw new Error("Gemini returned no grant results. Try again.");

  const grants = parseGrantArray(raw) || await repairGrantArray({ raw, apiKey, category });
  if (!Array.isArray(grants)) throw new Error("Gemini could not format the grant list. Try different keywords.");

  return grants
    .filter(g => g.grant_name && g.program_url)
    .map((g, i) => ({
      id: `disc_${Date.now()}_${i}`,
      grant_name: g.grant_name || "",
      funder_name: g.funder_name || "",
      program_url: g.program_url || "",
      country: g.country || country || "",
      region: g.region || "Unknown",
      category: g.category || category || "Mixed",
      funding_type: g.funding_type || "Grant",
      amount: g.amount || "Not stated",
      deadline: g.deadline || "Unknown",
      source: g.source || "Other",
      applicant_type: g.applicant_type || applicantType || "Unknown",
      eligibility_summary: g.eligibility_summary || "",
      fit_score: g.fit_score || "Medium",
      urgency: g.urgency || "Unknown",
      initial_fit_guess: g.initial_fit_guess || "Possible",
      discovery_note: g.discovery_note || "",
      application_angle: g.application_angle || "",
      status: g.status || "New",
      discovery_date: g.discovery_date || TODAY,
      notes: g.notes || ""
    }));
}
