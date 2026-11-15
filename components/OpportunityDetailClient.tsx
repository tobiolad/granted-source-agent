"use client";

import { useState } from "react";
import Link from "next/link";
import { FitBadge, GuessBadge, UrgencyBadge, Badge } from "./Badge";
import { ReviewPanel } from "./ReviewPanel";
import { EvaluationPanel } from "./EvaluationPanel";
import type { Opportunity } from "@/lib/types";

const FIELD_LABELS: Record<string, string> = {
  amount: "Amount",
  deadline: "Deadline",
  eligibility_summary: "Eligibility summary",
  funder_name: "Funder name",
  region: "Region",
  source_citation: "Source citation"
};

export function OpportunityDetailClient({ opportunity }: { opportunity: Opportunity }) {
  const [opp, setOpp] = useState(opportunity);

  const facts: { label: string; value: string | null; confirmed: boolean }[] = [
    { label: "Funder", value: opp.funderName, confirmed: !opp.missingFields.includes("funder_name") },
    { label: "Amount", value: opp.amount, confirmed: !opp.missingFields.includes("amount") },
    { label: "Deadline", value: opp.deadline, confirmed: !opp.missingFields.includes("deadline") },
    { label: "Region", value: opp.region, confirmed: !opp.missingFields.includes("region") },
    { label: "Applicant type", value: opp.applicantType, confirmed: true },
    { label: "Source type", value: opp.sourceType, confirmed: true }
  ];

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-6 sm:px-6">
      <Link href="/" className="text-sm text-ink-muted hover:text-ink-primary">
        ← Back to dashboard
      </Link>

      <header className="rounded-xl border border-border bg-surface p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
              {opp.country}
              {opp.region ? ` · ${opp.region}` : ""} · {opp.category}
            </p>
            <h1 className="mt-1 text-2xl font-black text-ink-primary">{opp.grantName}</h1>
          </div>
          <a
            href={opp.programUrl}
            target="_blank"
            rel="noreferrer"
            className="shrink-0 rounded-lg border border-accent/40 bg-accent-dim px-4 py-2 text-xs font-bold text-accent-soft hover:bg-accent/20"
          >
            Official program page ↗
          </a>
        </div>

        <div className="mt-4 flex flex-wrap gap-1.5">
          <FitBadge score={opp.aiFitScore} />
          <GuessBadge guess={opp.aiEligibilityGuess} />
          <UrgencyBadge urgency={opp.urgency} />
          <Badge label={opp.fundingType} tone="neutral" />
          <Badge label={opp.discoverySource === "live" ? "Discovered live" : "Demo dataset"} tone="accent" />
        </div>

        {opp.missingFields.length > 0 && (
          <div className="mt-4 rounded-lg border border-amber-900/50 bg-amber-950/30 px-4 py-3 text-sm text-amber-300">
            <p className="font-semibold">Needs verification before you rely on this:</p>
            <ul className="mt-1 list-inside list-disc">
              {opp.missingFields.map((f) => (
                <li key={f}>{FIELD_LABELS[f] || f} could not be confirmed by research</li>
              ))}
            </ul>
          </div>
        )}
      </header>

      <section className="rounded-xl border border-border bg-surface p-6" aria-labelledby="facts-heading">
        <h2 id="facts-heading" className="sr-only">
          Opportunity facts
        </h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {facts.map((f) => (
            <div key={f.label}>
              <div className="text-xs uppercase tracking-wide text-ink-muted">{f.label}</div>
              <div className={`mt-1 text-sm ${f.confirmed ? "text-ink-primary" : "text-amber-400"}`}>
                {f.value || "Not stated"}
                {!f.confirmed && <span className="ml-1 text-[10px] font-semibold">(unverified)</span>}
              </div>
            </div>
          ))}
        </div>

        {opp.eligibilitySummary && (
          <div className="mt-5 border-l-2 border-accent/50 pl-4">
            <p className="text-xs uppercase tracking-wide text-ink-muted">Eligibility, as researched</p>
            <p className="mt-1 text-sm text-ink-secondary">{opp.eligibilitySummary}</p>
          </div>
        )}

        {opp.discoveryNote && (
          <p className="mt-4 text-sm italic text-ink-muted">&ldquo;{opp.discoveryNote}&rdquo;</p>
        )}
      </section>

      <section className="rounded-xl border border-border bg-surface p-6" aria-labelledby="evidence-heading">
        <h2 id="evidence-heading" className="mb-3 text-sm font-bold uppercase tracking-wide text-ink-secondary">
          Evidence &amp; sources
        </h2>
        {opp.citations.length === 0 ? (
          <p className="text-sm text-amber-400">No source citation was confirmed for this opportunity — treat it as unverified.</p>
        ) : (
          <ul className="space-y-2">
            {opp.citations.map((c) => (
              <li key={c.id}>
                <a href={c.url} target="_blank" rel="noreferrer" className="text-sm text-accent-soft hover:underline">
                  {c.title || c.url}
                </a>
                <span className="ml-2 text-xs text-ink-muted">({new URL(c.url).hostname})</span>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-3 text-xs text-ink-muted">
          {opp.discoverySource === "live"
            ? "Sources come from Gemini's search-grounding metadata, not from the model's own generated text."
            : "Demo dataset: the citation is the program's official page, included directly in the sample data."}
        </p>
      </section>

      <EvaluationPanel opportunityId={opp.id} evaluations={opp.evaluations || []} />

      <ReviewPanel
        opportunityId={opp.id}
        reviewStatus={opp.reviewStatus}
        reviewNotes={opp.reviewNotes}
        status={opp.status}
        onUpdated={(patch) => setOpp((prev) => ({ ...prev, ...patch }))}
      />
    </div>
  );
}
