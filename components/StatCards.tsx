"use client";

import type { Opportunity } from "@/lib/types";

export function StatCards({ opportunities }: { opportunities: Opportunity[] }) {
  const today = new Date().toISOString().slice(0, 10);
  const cards = [
    { label: "Total opportunities", value: opportunities.length },
    { label: "Discovered today", value: opportunities.filter((o) => o.discoveredAt.slice(0, 10) === today).length },
    { label: "High AI fit", value: opportunities.filter((o) => o.aiFitScore === "High").length },
    { label: "Needs review", value: opportunities.filter((o) => o.reviewStatus === "unreviewed").length },
    { label: "Verified", value: opportunities.filter((o) => o.reviewStatus === "verified").length },
    { label: "Missing key info", value: opportunities.filter((o) => o.missingFields.length > 0).length }
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      {cards.map((c) => (
        <div key={c.label} className="rounded-xl border border-border bg-surface p-4">
          <div className="text-2xl font-bold text-ink-primary">{c.value}</div>
          <div className="mt-1 text-xs text-ink-muted">{c.label}</div>
        </div>
      ))}
    </div>
  );
}
