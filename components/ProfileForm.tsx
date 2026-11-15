"use client";

import { useState } from "react";
import { COUNTRIES, ORG_STAGES, ORG_TYPES } from "@/lib/constants";
import type { OrgProfile } from "@/lib/types";

const EMPTY: Omit<OrgProfile, "id"> = {
  orgName: "",
  orgType: "Startup",
  country: "Canada",
  region: "",
  stage: "Early revenue",
  teamSize: "",
  description: "",
  fundingNeeded: ""
};

export function ProfileForm({ initialProfile }: { initialProfile: OrgProfile | null }) {
  const [form, setForm] = useState<Omit<OrgProfile, "id">>(initialProfile ? { ...EMPTY, ...initialProfile } : EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    setSaved(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed.");
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-2xl space-y-5 px-4 py-6 sm:px-6">
      <div>
        <h1 className="text-2xl font-black text-ink-primary">Organization profile</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Used to evaluate opportunity fit. This stays on your own instance — a public demo should use a
          placeholder, not your real organization&apos;s private details.
        </p>
      </div>

      <label className="block text-xs font-semibold text-ink-secondary">
        Organization name
        <input
          required
          value={form.orgName}
          onChange={(e) => set("orgName", e.target.value)}
          className="mt-1.5 w-full rounded-lg border border-border bg-canvas px-3 py-2 text-sm text-ink-primary"
        />
      </label>

      <div className="grid grid-cols-2 gap-4">
        <label className="block text-xs font-semibold text-ink-secondary">
          Type
          <select
            value={form.orgType}
            onChange={(e) => set("orgType", e.target.value)}
            className="mt-1.5 w-full rounded-lg border border-border bg-canvas px-3 py-2 text-sm text-ink-primary"
          >
            {ORG_TYPES.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </label>
        <label className="block text-xs font-semibold text-ink-secondary">
          Stage
          <select
            value={form.stage || ""}
            onChange={(e) => set("stage", e.target.value)}
            className="mt-1.5 w-full rounded-lg border border-border bg-canvas px-3 py-2 text-sm text-ink-primary"
          >
            {ORG_STAGES.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </label>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <label className="block text-xs font-semibold text-ink-secondary">
          Country
          <select
            value={form.country}
            onChange={(e) => set("country", e.target.value)}
            className="mt-1.5 w-full rounded-lg border border-border bg-canvas px-3 py-2 text-sm text-ink-primary"
          >
            {COUNTRIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>
        <label className="block text-xs font-semibold text-ink-secondary">
          Region / province / state
          <input
            value={form.region || ""}
            onChange={(e) => set("region", e.target.value)}
            className="mt-1.5 w-full rounded-lg border border-border bg-canvas px-3 py-2 text-sm text-ink-primary"
          />
        </label>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <label className="block text-xs font-semibold text-ink-secondary">
          Team size
          <input
            value={form.teamSize || ""}
            onChange={(e) => set("teamSize", e.target.value)}
            placeholder="e.g. 3"
            className="mt-1.5 w-full rounded-lg border border-border bg-canvas px-3 py-2 text-sm text-ink-primary"
          />
        </label>
        <label className="block text-xs font-semibold text-ink-secondary">
          Funding needed
          <input
            value={form.fundingNeeded || ""}
            onChange={(e) => set("fundingNeeded", e.target.value)}
            placeholder="e.g. CAD $25,000–$75,000"
            className="mt-1.5 w-full rounded-lg border border-border bg-canvas px-3 py-2 text-sm text-ink-primary"
          />
        </label>
      </div>

      <label className="block text-xs font-semibold text-ink-secondary">
        Description
        <textarea
          value={form.description || ""}
          onChange={(e) => set("description", e.target.value)}
          rows={4}
          className="mt-1.5 w-full rounded-lg border border-border bg-canvas px-3 py-2 text-sm text-ink-primary"
          placeholder="What the organization does, who it serves, and anything relevant to funding eligibility."
        />
      </label>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-accent px-5 py-2.5 text-sm font-bold text-white hover:bg-accent/90 disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save profile"}
        </button>
        {saved && <span className="text-sm text-signal-high">Saved</span>}
        {error && <span className="text-sm text-signal-low">{error}</span>}
      </div>
    </form>
  );
}
