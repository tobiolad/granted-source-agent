"use client";

import { CATEGORIES, FUNDING_TYPES, URGENCY_LEVELS } from "@/lib/constants";

export interface Filters {
  search: string;
  country: string;
  fit: string;
  category: string;
  fundingType: string;
  urgency: string;
  reviewStatus: string;
}

export const DEFAULT_FILTERS: Filters = {
  search: "",
  country: "All",
  fit: "All",
  category: "",
  fundingType: "",
  urgency: "",
  reviewStatus: ""
};

function ToggleGroup({
  label,
  value,
  options,
  onChange
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="mr-1 text-xs font-semibold text-ink-muted">{label}:</span>
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => onChange(opt)}
          aria-pressed={value === opt}
          className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
            value === opt ? "bg-accent text-white" : "bg-surface2 text-ink-secondary hover:bg-border"
          }`}
        >
          {opt === "United States" ? "US" : opt}
        </button>
      ))}
    </div>
  );
}

export function FilterBar({ filters, onChange }: { filters: Filters; onChange: (f: Filters) => void }) {
  const set = <K extends keyof Filters>(key: K, value: Filters[K]) => onChange({ ...filters, [key]: value });
  const hasActiveFilters =
    filters.search ||
    filters.country !== "All" ||
    filters.fit !== "All" ||
    filters.category ||
    filters.fundingType ||
    filters.urgency ||
    filters.reviewStatus;

  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <label className="sr-only" htmlFor="opportunity-search">
        Search opportunities
      </label>
      <input
        id="opportunity-search"
        value={filters.search}
        onChange={(e) => set("search", e.target.value)}
        placeholder="Search grant, funder, eligibility, notes…"
        className="mb-3 w-full rounded-lg border border-border bg-canvas px-3 py-2 text-sm text-ink-primary focus:border-accent"
      />

      <div className="flex flex-col gap-2.5">
        <ToggleGroup label="Country" value={filters.country} options={["All", "Canada", "United States"]} onChange={(v) => set("country", v)} />
        <ToggleGroup label="AI fit" value={filters.fit} options={["All", "High", "Medium", "Low"]} onChange={(v) => set("fit", v)} />
        <ToggleGroup
          label="Review"
          value={filters.reviewStatus || "All"}
          options={["All", "unreviewed", "verified", "uncertain", "rejected"]}
          onChange={(v) => set("reviewStatus", v === "All" ? "" : v)}
        />
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <select
          value={filters.category}
          onChange={(e) => set("category", e.target.value)}
          className="rounded-lg border border-border bg-canvas px-3 py-1.5 text-xs text-ink-secondary"
        >
          <option value="">All categories</option>
          {CATEGORIES.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
        <select
          value={filters.fundingType}
          onChange={(e) => set("fundingType", e.target.value)}
          className="rounded-lg border border-border bg-canvas px-3 py-1.5 text-xs text-ink-secondary"
        >
          <option value="">All funding types</option>
          {FUNDING_TYPES.map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>
        <select
          value={filters.urgency}
          onChange={(e) => set("urgency", e.target.value)}
          className="rounded-lg border border-border bg-canvas px-3 py-1.5 text-xs text-ink-secondary"
        >
          <option value="">All urgency</option>
          {URGENCY_LEVELS.map((u) => (
            <option key={u}>{u}</option>
          ))}
        </select>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={() => onChange(DEFAULT_FILTERS)}
            className="rounded-lg border border-border px-3 py-1.5 text-xs text-ink-muted hover:text-ink-primary"
          >
            ✕ Clear filters
          </button>
        )}
      </div>
    </div>
  );
}
