"use client";

import { useEffect, useState } from "react";

export function ModeBanner() {
  const [liveMode, setLiveMode] = useState<boolean | null>(null);

  useEffect(() => {
    fetch("/api/mode")
      .then((res) => res.json())
      .then((data) => setLiveMode(Boolean(data.liveMode)))
      .catch(() => setLiveMode(false));
  }, []);

  if (liveMode === null) return null;

  return (
    <div
      role="status"
      className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm ${
        liveMode
          ? "border-signal-high/30 bg-emerald-950/30 text-signal-high"
          : "border-accent/30 bg-accent-dim text-accent-soft"
      }`}
    >
      <span className={`h-2 w-2 shrink-0 rounded-full ${liveMode ? "bg-signal-high" : "bg-accent-soft"}`} aria-hidden="true" />
      {liveMode ? (
        <span>
          <strong className="font-semibold">Live research mode.</strong> Discovery and evaluation call Gemini with a
          server-held key. Rate-limited; always verify results on the official program page.
        </span>
      ) : (
        <span>
          <strong className="font-semibold">Demo mode.</strong> No API key is configured, so results come from a
          labeled sample dataset and a transparent rule-based evaluator — not a live AI call. See the README for how
          to enable live research.
        </span>
      )}
    </div>
  );
}
