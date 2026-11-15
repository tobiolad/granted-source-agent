"use client";

import { useState } from "react";
import { FitBadge } from "./Badge";
import type { Evaluation } from "@/lib/types";

export function EvaluationPanel({ opportunityId, evaluations }: { opportunityId: string; evaluations: Evaluation[] }) {
  const [history, setHistory] = useState(evaluations);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runEvaluation = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ opportunityId })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Evaluation failed.");
      setHistory([data.evaluation, ...history]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Evaluation failed.");
    } finally {
      setLoading(false);
    }
  };

  const latest = history[0];

  return (
    <section className="rounded-xl border border-border bg-surface p-5" aria-labelledby="eval-heading">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-accent-soft">Research step 3 — Evaluate</p>
          <h2 id="eval-heading" className="text-lg font-bold text-ink-primary">
            Fit against your organization profile
          </h2>
        </div>
        <button
          type="button"
          onClick={runEvaluation}
          disabled={loading}
          className="shrink-0 rounded-lg bg-accent px-4 py-2 text-xs font-bold text-white hover:bg-accent/90 disabled:opacity-60"
        >
          {loading ? "Evaluating…" : history.length > 0 ? "Re-run evaluation" : "Run evaluation"}
        </button>
      </div>

      {error && <p className="mb-3 text-sm text-signal-low">{error}</p>}

      {!latest && !error && (
        <p className="text-sm text-ink-muted">
          No evaluation yet. Set up an org profile, then run an evaluation to see an explained fit assessment —
          this is a decision aid, not a final eligibility ruling.
        </p>
      )}

      {latest && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <FitBadge score={latest.fitScore} />
            <span className="text-xs text-ink-muted">
              against &ldquo;{latest.evaluatedAgainstOrg}&rdquo; · {latest.source === "live" ? "live AI evaluation" : "demo rule-based baseline"}
            </span>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Why this score</p>
            <p className="mt-1 text-sm text-ink-primary">{latest.fitReasoning}</p>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Eligibility notes</p>
            <p className="mt-1 text-sm text-ink-secondary">{latest.eligibilityNotes}</p>
          </div>

          {latest.restrictions && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Restrictions</p>
              <p className="mt-1 text-sm text-ink-secondary">{latest.restrictions}</p>
            </div>
          )}

          {latest.missingInfo.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-amber-400">Needs human verification</p>
              <ul className="mt-1 list-inside list-disc text-sm text-ink-secondary">
                {latest.missingInfo.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>
          )}

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Recommended next actions</p>
            <ol className="mt-1 list-inside list-decimal text-sm text-ink-secondary">
              {latest.nextActions.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ol>
          </div>

          <p className="border-t border-border pt-3 text-xs text-ink-muted">
            This is an explainable fit assessment to support your decision — not a definitive eligibility
            determination. Confirm program-specific legal/registration requirements directly with the funder.
          </p>
        </div>
      )}
    </section>
  );
}
