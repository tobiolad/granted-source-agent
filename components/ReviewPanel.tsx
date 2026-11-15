"use client";

import { useState } from "react";
import { ReviewBadge } from "./Badge";

const REVIEW_OPTIONS = [
  { value: "verified", label: "Mark verified" },
  { value: "uncertain", label: "Mark uncertain" },
  { value: "rejected", label: "Reject" }
];

const STATUS_OPTIONS = ["new", "reviewed", "applying", "applied", "saved", "rejected"];

export function ReviewPanel({
  opportunityId,
  reviewStatus,
  reviewNotes,
  status,
  onUpdated
}: {
  opportunityId: string;
  reviewStatus: string;
  reviewNotes: string | null;
  status: string;
  onUpdated: (patch: { reviewStatus?: string; reviewNotes?: string; status?: string }) => void;
}) {
  const [notes, setNotes] = useState(reviewNotes || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  const patch = async (body: Record<string, string>) => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/opportunities/${opportunityId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Update failed.");
      onUpdated(body);
      setSavedAt(Date.now());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="rounded-xl border border-border bg-surface p-5" aria-labelledby="review-heading">
      <div className="mb-4 flex items-center justify-between">
        <h2 id="review-heading" className="text-sm font-bold uppercase tracking-wide text-ink-secondary">
          Human review
        </h2>
        <ReviewBadge status={reviewStatus} />
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {REVIEW_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            disabled={saving}
            onClick={() => patch({ reviewStatus: opt.value })}
            className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors ${
              reviewStatus === opt.value
                ? "border-accent bg-accent-dim text-accent-soft"
                : "border-border text-ink-secondary hover:border-accent/40"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <label className="block text-xs font-semibold text-ink-secondary" htmlFor="status-select">
        Pipeline status
      </label>
      <select
        id="status-select"
        value={status}
        onChange={(e) => patch({ status: e.target.value })}
        disabled={saving}
        className="mt-1.5 w-full rounded-lg border border-border bg-canvas px-3 py-2 text-sm text-ink-primary"
      >
        {STATUS_OPTIONS.map((s) => (
          <option key={s} value={s}>
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </option>
        ))}
      </select>

      <label className="mt-4 block text-xs font-semibold text-ink-secondary" htmlFor="review-notes">
        Notes (your own — kept separate from AI output)
      </label>
      <textarea
        id="review-notes"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        rows={4}
        className="mt-1.5 w-full rounded-lg border border-border bg-canvas px-3 py-2 text-sm text-ink-primary"
        placeholder="e.g. Called the program office, confirmed deadline is March 15..."
      />
      <button
        type="button"
        disabled={saving}
        onClick={() => patch({ reviewNotes: notes })}
        className="mt-2 rounded-lg bg-accent px-4 py-2 text-xs font-bold text-white hover:bg-accent/90 disabled:opacity-60"
      >
        {saving ? "Saving…" : "Save notes"}
      </button>
      {savedAt && !saving && <span className="ml-3 text-xs text-signal-high">Saved</span>}
      {error && <p className="mt-2 text-xs text-signal-low">{error}</p>}
    </section>
  );
}
