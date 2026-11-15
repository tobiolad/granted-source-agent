const TONE_CLASSES: Record<string, string> = {
  high: "bg-emerald-950/60 text-signal-high border-emerald-900/60",
  medium: "bg-amber-950/50 text-signal-medium border-amber-900/50",
  low: "bg-red-950/50 text-signal-low border-red-900/50",
  info: "bg-blue-950/50 text-signal-info border-blue-900/50",
  neutral: "bg-surface2 text-ink-secondary border-border",
  accent: "bg-accent-dim text-accent-soft border-accent/30"
};

const FIT_TONE: Record<string, string> = { High: "high", Medium: "medium", Low: "low" };
const GUESS_TONE: Record<string, string> = { Likely: "high", Possible: "medium", Unlikely: "low" };
const URGENCY_TONE: Record<string, string> = {
  "Closing Soon": "medium",
  Open: "high",
  Rolling: "info",
  Unknown: "neutral",
  Closed: "low"
};
const REVIEW_TONE: Record<string, string> = {
  verified: "high",
  uncertain: "medium",
  rejected: "low",
  unreviewed: "neutral"
};

export function Badge({ label, tone = "neutral" }: { label: string; tone?: keyof typeof TONE_CLASSES }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold tracking-wide ${TONE_CLASSES[tone] || TONE_CLASSES.neutral}`}
    >
      {label}
    </span>
  );
}

export function FitBadge({ score }: { score: string | null }) {
  if (!score) return null;
  return <Badge label={`Fit: ${score}`} tone={(FIT_TONE[score] as keyof typeof TONE_CLASSES) || "neutral"} />;
}

export function GuessBadge({ guess }: { guess: string | null }) {
  if (!guess) return null;
  return <Badge label={guess} tone={(GUESS_TONE[guess] as keyof typeof TONE_CLASSES) || "neutral"} />;
}

export function UrgencyBadge({ urgency }: { urgency: string | null }) {
  if (!urgency) return null;
  return <Badge label={urgency} tone={(URGENCY_TONE[urgency] as keyof typeof TONE_CLASSES) || "neutral"} />;
}

export function ReviewBadge({ status }: { status: string }) {
  const label = status === "unreviewed" ? "Needs review" : status.charAt(0).toUpperCase() + status.slice(1);
  return <Badge label={label} tone={(REVIEW_TONE[status] as keyof typeof TONE_CLASSES) || "neutral"} />;
}
