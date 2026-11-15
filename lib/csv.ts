import type { Opportunity } from "./types";

const COLUMNS: { key: keyof Opportunity | "citationUrls"; label: string }[] = [
  { key: "grantName", label: "Grant Name" },
  { key: "funderName", label: "Funder" },
  { key: "programUrl", label: "Program URL" },
  { key: "country", label: "Country" },
  { key: "region", label: "Region" },
  { key: "category", label: "Category" },
  { key: "fundingType", label: "Funding Type" },
  { key: "amount", label: "Amount" },
  { key: "deadline", label: "Deadline" },
  { key: "urgency", label: "Urgency" },
  { key: "applicantType", label: "Applicant Type" },
  { key: "eligibilitySummary", label: "Eligibility Summary" },
  { key: "aiFitScore", label: "AI Fit Score" },
  { key: "aiEligibilityGuess", label: "AI Eligibility Guess" },
  { key: "reviewStatus", label: "Human Review Status" },
  { key: "reviewNotes", label: "Review Notes" },
  { key: "status", label: "Pipeline Status" },
  { key: "discoverySource", label: "Discovery Source" },
  { key: "discoveredAt", label: "Discovered At" },
  { key: "citationUrls", label: "Source Citations" }
];

function escapeCell(value: unknown): string {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
}

export function buildOpportunitiesCsv(opportunities: Opportunity[]): string {
  const header = COLUMNS.map((c) => escapeCell(c.label)).join(",");
  const rows = opportunities.map((opp) =>
    COLUMNS.map((c) => {
      if (c.key === "citationUrls") return escapeCell(opp.citations.map((cit) => cit.url).join(" | "));
      if (c.key === "missingFields") return escapeCell((opp.missingFields || []).join(" | "));
      return escapeCell((opp as unknown as Record<string, unknown>)[c.key as string]);
    }).join(",")
  );
  return [header, ...rows].join("\n");
}

export function downloadCsv(filename: string, csv: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
