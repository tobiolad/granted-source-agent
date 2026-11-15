"use client";

import Link from "next/link";
import { FitBadge, GuessBadge, UrgencyBadge, ReviewBadge } from "./Badge";
import type { Opportunity } from "@/lib/types";

export function OpportunityTable({
  opportunities,
  selected,
  onToggleSelect,
  onToggleSelectAll
}: {
  opportunities: Opportunity[];
  selected: Set<string>;
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: () => void;
}) {
  if (opportunities.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-surface px-6 py-16 text-center text-sm text-ink-muted">
        No opportunities match the current filters.
      </div>
    );
  }

  const allSelected = opportunities.length > 0 && opportunities.every((o) => selected.has(o.id));

  return (
    <div className="overflow-hidden rounded-xl border border-border">
      <table className="w-full text-sm">
        <caption className="sr-only">Discovered funding opportunities</caption>
        <thead className="bg-surface2 text-left text-xs uppercase tracking-wide text-ink-muted">
          <tr>
            <th scope="col" className="w-10 px-3 py-3">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={onToggleSelectAll}
                aria-label="Select all visible opportunities"
                className="h-4 w-4 accent-accent"
              />
            </th>
            <th scope="col" className="px-3 py-3">
              Opportunity
            </th>
            <th scope="col" className="hidden px-3 py-3 sm:table-cell">
              Signals
            </th>
            <th scope="col" className="hidden px-3 py-3 md:table-cell">
              Deadline
            </th>
            <th scope="col" className="px-3 py-3">
              Review
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border bg-surface">
          {opportunities.map((opp) => (
            <tr key={opp.id} className="hover:bg-surface2/60">
              <td className="px-3 py-3 align-top">
                <input
                  type="checkbox"
                  checked={selected.has(opp.id)}
                  onChange={() => onToggleSelect(opp.id)}
                  aria-label={`Select ${opp.grantName}`}
                  className="h-4 w-4 accent-accent"
                />
              </td>
              <td className="px-3 py-3 align-top">
                <Link href={`/opportunities/${opp.id}`} className="font-semibold text-ink-primary hover:text-accent-soft">
                  {opp.grantName}
                </Link>
                <div className="mt-0.5 text-xs text-ink-muted">
                  {opp.funderName} · {opp.country}
                  {opp.region ? ` · ${opp.region}` : ""}
                </div>
                {opp.missingFields.length > 0 && (
                  <div className="mt-1 text-[11px] font-medium text-amber-400">
                    {opp.missingFields.length} field{opp.missingFields.length > 1 ? "s" : ""} need verification
                  </div>
                )}
              </td>
              <td className="hidden px-3 py-3 align-top sm:table-cell">
                <div className="flex flex-wrap gap-1.5">
                  <FitBadge score={opp.aiFitScore} />
                  <GuessBadge guess={opp.aiEligibilityGuess} />
                  <UrgencyBadge urgency={opp.urgency} />
                </div>
              </td>
              <td className="hidden px-3 py-3 align-top text-ink-secondary md:table-cell">{opp.deadline || "Unknown"}</td>
              <td className="px-3 py-3 align-top">
                <ReviewBadge status={opp.reviewStatus} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
