"use client";

import { useState } from "react";
import { CATEGORIES } from "@/lib/constants";
import type { DiscoverResult } from "@/lib/types";

const APPLICANT_TYPES = [
  "Startup",
  "Small business",
  "Nonprofit",
  "Founder",
  "Youth founder",
  "Researcher",
  "Women-owned business",
  "BIPOC entrepreneur",
  "Social enterprise",
  "Any eligible applicant"
];

export function DiscoverPanel({ onDiscovered }: { onDiscovered: () => void }) {
  const [open, setOpen] = useState(true);
  const [keywords, setKeywords] = useState("startup grant small business");
  const [country, setCountry] = useState<"Canada/US" | "Canada" | "United States">("Canada/US");
  const [category, setCategory] = useState("Startup");
  const [applicantType, setApplicantType] = useState("Startup");
  const [maxResults, setMaxResults] = useState(10);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DiscoverResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const runDiscovery = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/discover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keywords, country, category, applicantType, maxResults })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Discovery failed.");
      setResult(data);
      onDiscovered();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Discovery failed. Try different keywords.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="rounded-xl border border-border bg-gradient-to-br from-surface to-surface2 p-5" aria-labelledby="discover-heading">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-3 text-left"
        aria-expanded={open}
      >
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-accent-soft">Research step 1 — Discover</p>
          <h2 id="discover-heading" className="mt-0.5 text-lg font-bold text-ink-primary">
            Search for funding opportunities
          </h2>
          <p className="mt-0.5 text-sm text-ink-muted">
            Finds public grants, programs, competitions, and non-dilutive funding in Canada &amp; the US.
          </p>
        </div>
        <span className="text-ink-muted" aria-hidden="true">
          {open ? "▲" : "▼"}
        </span>
      </button>

      {open && (
        <div className="mt-4 space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <label className="sm:col-span-2 lg:col-span-2 text-xs font-semibold text-ink-secondary">
              Search keywords
              <input
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
                placeholder="e.g. AI startup grant, youth entrepreneur funding"
                className="mt-1.5 w-full rounded-lg border border-border bg-canvas px-3 py-2 text-sm text-ink-primary focus:border-accent"
              />
            </label>
            <label className="text-xs font-semibold text-ink-secondary">
              Country
              <select
                value={country}
                onChange={(e) => setCountry(e.target.value as typeof country)}
                className="mt-1.5 w-full rounded-lg border border-border bg-canvas px-3 py-2 text-sm text-ink-primary"
              >
                <option>Canada/US</option>
                <option>Canada</option>
                <option>United States</option>
              </select>
            </label>
            <label className="text-xs font-semibold text-ink-secondary">
              Category
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-border bg-canvas px-3 py-2 text-sm text-ink-primary"
              >
                {CATEGORIES.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </label>
            <label className="text-xs font-semibold text-ink-secondary">
              Applicant type
              <select
                value={applicantType}
                onChange={(e) => setApplicantType(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-border bg-canvas px-3 py-2 text-sm text-ink-primary"
              >
                {APPLICANT_TYPES.map((a) => (
                  <option key={a}>{a}</option>
                ))}
              </select>
            </label>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <label className="text-xs font-semibold text-ink-secondary">
              Max results
              <input
                type="number"
                min={1}
                max={20}
                value={maxResults}
                onChange={(e) => setMaxResults(Number(e.target.value) || 10)}
                className="ml-2 w-16 rounded-lg border border-border bg-canvas px-2 py-1.5 text-sm text-ink-primary"
              />
            </label>
            <button
              type="button"
              onClick={runDiscovery}
              disabled={loading}
              className="ml-auto rounded-lg bg-accent px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Searching…" : "Run discovery"}
            </button>
          </div>

          {result && (
            <div className="rounded-lg border border-signal-high/30 bg-emerald-950/30 p-3 text-sm text-signal-high">
              <p className="font-semibold">
                ✓ Discovery complete ({result.mode === "live" ? "live research" : "demo data"})
              </p>
              <p>
                Found {result.found} · Added {result.added} · Duplicates skipped {result.duplicates}
                {result.invalid > 0 ? ` · ${result.invalid} rejected by validation` : ""}
              </p>
            </div>
          )}

          {error && <div className="rounded-lg border border-signal-low/30 bg-red-950/30 p-3 text-sm text-signal-low">{error}</div>}

          <p className="text-xs leading-relaxed text-ink-muted">
            Always verify deadlines and eligibility on the official program page. In live mode, sources come from
            Gemini&apos;s search grounding, not from the model&apos;s own text.
          </p>
        </div>
      )}
    </section>
  );
}
