import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";
import { checkRateLimit } from "@/lib/rate-limit";
import { getClientKey } from "@/lib/request-ip";
import { EvaluateRequestSchema, EvaluationResultSchema } from "@/lib/validation";
import { generateJson, isLiveModeConfigured } from "@/lib/gemini";
import { buildEvaluationPrompt } from "@/lib/prompts";
import { extractJsonObject } from "@/lib/json-extract";
import { evaluateWithRules } from "@/lib/rule-based-evaluator";

const LIVE_RATE_LIMIT = Number(process.env.LIVE_DISCOVERY_RATE_LIMIT || 5);
const DEMO_RATE_LIMIT = 60;

function safeParseArray(value: string | null): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = EvaluateRequestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const opportunity = await db.opportunity.findUnique({ where: { id: parsed.data.opportunityId } });
  if (!opportunity) {
    return NextResponse.json({ error: "Opportunity not found" }, { status: 404 });
  }

  const org = await db.orgProfile.findUnique({ where: { id: "default" } });
  if (!org) {
    return NextResponse.json(
      { error: "No organization profile set up yet. Add one on the Profile page before evaluating fit." },
      { status: 400 }
    );
  }

  const liveMode = isLiveModeConfigured();
  const clientKey = getClientKey(request);
  const rateLimit = checkRateLimit(`evaluate:${liveMode ? "live" : "demo"}:${clientKey}`, liveMode ? LIVE_RATE_LIMIT : DEMO_RATE_LIMIT);
  if (!rateLimit.allowed) {
    return NextResponse.json({ error: "Rate limit exceeded. Please wait before evaluating again." }, { status: 429 });
  }

  const missingFields = safeParseArray(opportunity.missingFields);
  let result;
  let source: "demo" | "live" = "demo";

  try {
    if (liveMode) {
      source = "live";
      const prompt = buildEvaluationPrompt({
        opportunity: {
          grantName: opportunity.grantName,
          funderName: opportunity.funderName || "Not stated",
          country: opportunity.country,
          region: opportunity.region || "Unknown",
          category: opportunity.category,
          fundingType: opportunity.fundingType,
          amount: opportunity.amount || "Not stated",
          deadline: opportunity.deadline || "Unknown",
          applicantType: opportunity.applicantType || "Unknown",
          eligibilitySummary: opportunity.eligibilitySummary || "",
          missingFields
        },
        org: {
          orgName: org.orgName,
          orgType: org.orgType,
          country: org.country,
          region: org.region || undefined,
          stage: org.stage || undefined,
          teamSize: org.teamSize || undefined,
          description: org.description || undefined,
          fundingNeeded: org.fundingNeeded || undefined
        }
      });

      const raw = await generateJson({ apiKey: process.env.GEMINI_API_KEY as string, prompt });
      const obj = extractJsonObject(raw);
      if (!obj) throw new Error("Gemini did not return a parseable evaluation. Try again.");

      const validated = EvaluationResultSchema.safeParse({
        fit_score: obj.fit_score,
        fit_reasoning: obj.fit_reasoning,
        eligibility_notes: obj.eligibility_notes,
        restrictions: obj.restrictions ?? "",
        missing_info: obj.missing_info ?? [],
        next_actions: obj.next_actions
      });
      if (!validated.success) {
        throw new Error("Gemini's evaluation didn't match the required format. Try again.");
      }
      result = validated.data;
    } else {
      result = evaluateWithRules({
        opportunity: {
          country: opportunity.country,
          category: opportunity.category,
          fundingType: opportunity.fundingType,
          programUrl: opportunity.programUrl,
          applicationAngle: opportunity.applicationAngle || "",
          missingFields
        },
        org: { orgType: org.orgType, country: org.country }
      });
    }
  } catch (err) {
    logger.error("evaluate.failed", { source, message: err instanceof Error ? err.message : String(err) });
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Evaluation failed. Try again." },
      { status: 502 }
    );
  }

  const saved = await db.evaluation.create({
    data: {
      opportunityId: opportunity.id,
      fitScore: result.fit_score,
      fitReasoning: result.fit_reasoning,
      eligibilityNotes: result.eligibility_notes,
      restrictions: result.restrictions || "",
      missingInfo: JSON.stringify(result.missing_info),
      nextActions: JSON.stringify(result.next_actions),
      evaluatedAgainstOrg: org.orgName,
      source
    }
  });

  logger.info("evaluate.completed", { opportunityId: opportunity.id, source, fitScore: result.fit_score });

  return NextResponse.json({
    evaluation: {
      ...saved,
      missingInfo: result.missing_info,
      nextActions: result.next_actions
    }
  });
}
