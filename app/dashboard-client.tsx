"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ModeBanner } from "@/components/ModeBanner";
import { DiscoverPanel } from "@/components/DiscoverPanel";
import { FilterBar, DEFAULT_FILTERS, type Filters } from "@/components/FilterBar";
import { StatCards } from "@/components/StatCards";
import { OpportunityTable } from "@/components/OpportunityTable";
import { buildOpportunitiesCsv, downloadCsv } from "@/lib/csv";
import type { Opportunity } from "@/lib/types";

export function DashboardClient() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const loadOpportunities = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await fetch("/api/opportunities");
      if (!res.ok) throw new Error("Failed to load opportunities.");
      const data = await res.json();
      setOpportunities(data.opportunities);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Failed to load opportunities.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOpportunities();
  }, [loadOpportunities]);

  const filtered = useMemo(() => {
    return opportunities.filter((o) => {
      if (filters.country !== "All" && !o.country.includes(filters.country)) return false;
      if (filters.fit !== "All" && o.aiFitScore !== filters.fit) return false;
      if (filters.category && o.category !== filters.category) return false;
      if (filters.fundingType && o.fundingType !== filters.fundingType) return false;
      if (filters.urgency && o.urgency !== filters.urgency) return false;
      if (filters.reviewStatus && o.reviewStatus !== filters.reviewStatus) return false;
      if (filters.search) {
        const q = filters.search.toLowerCase();
        const fields = [o.grantName, o.funderName, o.region, o.category, o.eligibilitySummary, o.discoveryNote, o.reviewNotes];
        if (!fields.some((f) => String(f || "").toLowerCase().includes(q))) return false;
      }
      return true;
    });
  }, [opportunities, filters]);

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    setSelected((prev) => {
      const allSelected = filtered.length > 0 && filtered.every((o) => prev.has(o.id));
      if (allSelected) return new Set();
      return new Set(filtered.map((o) => o.id));
    });
  };

  const exportCsv = () => {
    const toExport = selected.size > 0 ? filtered.filter((o) => selected.has(o.id)) : filtered;
    const csv = buildOpportunitiesCsv(toExport);
    downloadCsv(`grant-opportunities-${new Date().toISOString().slice(0, 10)}.csv`, csv);
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-6">
      <ModeBanner />

      <DiscoverPanel onDiscovered={loadOpportunities} />

      <StatCards opportunities={opportunities} />

      <div className="flex flex-col gap-4 lg:flex-row">
        <div className="lg:w-80 lg:shrink-0">
          <FilterBar filters={filters} onChange={setFilters} />
        </div>

        <div className="flex-1 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-ink-muted">
              {filtered.length} opportunit{filtered.length === 1 ? "y" : "ies"}
              {selected.size > 0 ? ` · ${selected.size} selected` : ""}
            </p>
            <button
              type="button"
              onClick={exportCsv}
              disabled={filtered.length === 0}
              className="rounded-lg bg-accent px-4 py-2 text-xs font-bold text-white hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              ↓ Export {selected.size > 0 ? "selected" : "all"} to CSV
            </button>
          </div>

          {loading && <div className="rounded-xl border border-border bg-surface px-6 py-16 text-center text-sm text-ink-muted">Loading opportunities…</div>}
          {loadError && <div className="rounded-xl border border-signal-low/30 bg-red-950/30 px-4 py-3 text-sm text-signal-low">{loadError}</div>}
          {!loading && !loadError && (
            <OpportunityTable
              opportunities={filtered}
              selected={selected}
              onToggleSelect={toggleSelect}
              onToggleSelectAll={toggleSelectAll}
            />
          )}
        </div>
      </div>
    </div>
  );
}
