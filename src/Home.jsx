import { useEffect, useMemo, useState } from "react";
import GeminiSettings from "./GeminiSettings.jsx";
import AgentPanel from "./AgentPanel.jsx";
import { analyzeGrant } from "./gemini.js";
import { sampleGrants } from "./data/sampleGrants.js";

const STORAGE_KEY = "inscend_grants";

const FIT_STYLES = {
  High: { bg: "#0a2010", text: "#34d399" },
  Medium: { bg: "#1e1a0a", text: "#fbbf24" },
  Low: { bg: "#1e0a0a", text: "#f87171" }
};
const GUESS_STYLES = {
  Likely: { bg: "#0a1e10", text: "#4ade80" },
  Possible: { bg: "#1a1a0a", text: "#facc15" },
  Unlikely: { bg: "#1e0f0a", text: "#fb923c" }
};
const URGENCY_STYLES = {
  "Closing Soon": { bg: "#30100a", text: "#fb923c" },
  Open: { bg: "#0f1e18", text: "#34d399" },
  Rolling: { bg: "#0f1520", text: "#60a5fa" },
  Unknown: { bg: "#1a1a1a", text: "#aaa" },
  Closed: { bg: "#1e0a0a", text: "#f87171" }
};
const STATUS_STYLES = {
  New: { bg: "#12122a", text: "#a78bfa" },
  Reviewed: { bg: "#0f1e18", text: "#34d399" },
  Applying: { bg: "#0f1520", text: "#60a5fa" },
  Applied: { bg: "#0a2010", text: "#4ade80" },
  Rejected: { bg: "#1e0a0a", text: "#f87171" },
  Saved: { bg: "#1a1a10", text: "#fbbf24" }
};

function Pill({ label, style }) {
  return <span style={{ padding: "2px 10px", borderRadius: 20, fontSize: 12, fontWeight: 700, background: style?.bg || "#1a1a1a", color: style?.text || "#aaa" }}>{label}</span>;
}

function LinkBtn({ href, label }) {
  return href ? <a href={href} target="_blank" rel="noreferrer" style={{ fontSize: 12, padding: "3px 10px", borderRadius: 6, background: "#1a1a2a", color: "#a78bfa", textDecoration: "none", border: "1px solid #2a2a3a" }}>{label}</a> : null;
}

function GrantRow({ grant }) {
  const [open, setOpen] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisError, setAnalysisError] = useState(null);
  const today = new Date().toISOString().slice(0, 10);

  const runAnalysis = async e => {
    e.stopPropagation();
    setAnalysisLoading(true);
    setAnalysisError(null);
    try {
      setAnalysis(await analyzeGrant(grant));
    } catch (err) {
      setAnalysisError(err.message || "Analysis failed. Try again.");
    } finally {
      setAnalysisLoading(false);
    }
  };

  return (
    <div style={{ background: "#111113", border: "1px solid #1a1a1a", borderRadius: 10, marginBottom: 8, overflow: "hidden" }}>
      <div onClick={() => setOpen(o => !o)} style={{ padding: "12px 16px", cursor: "pointer", display: "flex", flexDirection: "column", gap: 6 }}>
        <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
          <span style={{ color: "#fff", fontWeight: 800, fontSize: 15 }}>{grant.grant_name}</span>
          {grant.country && <span style={{ color: "#666", fontSize: 12 }}>{grant.country}{grant.region ? ` · ${grant.region}` : ""}</span>}
          {grant.discovery_date === today && <span style={{ fontSize: 11, background: "#1e0a30", color: "#c084fc", borderRadius: 20, padding: "1px 8px", fontWeight: 800 }}>TODAY</span>}
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
            {grant.deadline && <span style={{ color: "#555", fontSize: 12 }}>Deadline: {grant.deadline}</span>}
            <span style={{ color: "#555", fontSize: 16 }}>{open ? "▲" : "▼"}</span>
          </div>
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
          {grant.fit_score && <Pill label={grant.fit_score} style={FIT_STYLES[grant.fit_score]} />}
          {grant.initial_fit_guess && <Pill label={grant.initial_fit_guess} style={GUESS_STYLES[grant.initial_fit_guess]} />}
          {grant.urgency && <Pill label={grant.urgency} style={URGENCY_STYLES[grant.urgency]} />}
          {grant.category && <Pill label={grant.category} />}
          {grant.funding_type && <Pill label={grant.funding_type} />}
          {grant.status && <Pill label={grant.status} style={STATUS_STYLES[grant.status]} />}
          <LinkBtn href={grant.program_url} label="Program ↗" />
        </div>

        {grant.discovery_note && <div style={{ color: "#777", fontSize: 12, fontStyle: "italic", paddingTop: 2 }}>{grant.discovery_note}</div>}
      </div>

      {open && (
        <div style={{ padding: "12px 16px 16px", borderTop: "1px solid #1a1a1a" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12, marginBottom: 12 }}>
            {[ ["Funder", grant.funder_name], ["Amount", grant.amount], ["Applicant", grant.applicant_type], ["Source", grant.source] ].map(([label, value]) => value ? (
              <div key={label}>
                <div style={{ color: "#555", fontSize: 11, textTransform: "uppercase", letterSpacing: 1, marginBottom: 3 }}>{label}</div>
                <div style={{ color: "#ccc", fontSize: 13 }}>{value}</div>
              </div>
            ) : null)}
          </div>

          {grant.eligibility_summary && (
            <div style={{ borderLeft: "3px solid #a78bfa", paddingLeft: 12, marginBottom: 12, color: "#aaa", fontSize: 13 }}>
              {grant.eligibility_summary}
            </div>
          )}

          {grant.application_angle && (
            <div style={{ background: "#0d0d0f", borderRadius: 6, padding: "10px 14px", color: "#888", fontSize: 13, marginBottom: 10 }}>
              <span style={{ color: "#a78bfa", fontWeight: 800 }}>Application angle: </span>{grant.application_angle}
            </div>
          )}

          {grant.notes && <div style={{ color: "#777", fontSize: 13, marginBottom: 12 }}>{grant.notes}</div>}

          <div style={{ background: "#0d0d0f", border: "1px solid #1a1a1a", borderRadius: 8, padding: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <div style={{ color: "#a78bfa", fontSize: 13, fontWeight: 800 }}>✦ Gemini Grant Analysis</div>
              <button onClick={runAnalysis} disabled={analysisLoading} style={{ background: "#7c3aed", color: "#fff", border: "none", borderRadius: 7, padding: "6px 12px", fontWeight: 800, cursor: analysisLoading ? "not-allowed" : "pointer" }}>
                {analysisLoading ? "Analyzing..." : "Analyze"}
              </button>
            </div>
            {analysisError && <div style={{ color: "#f87171", fontSize: 13, marginTop: 8 }}>{analysisError}</div>}
            {analysis && (
              <div style={{ marginTop: 10, color: "#aaa", fontSize: 13, lineHeight: 1.6 }}>
                <div><b style={{ color: "#fff" }}>Fit:</b> {analysis.fit_score} · {analysis.initial_fit_guess}</div>
                <div><b style={{ color: "#fff" }}>Eligibility:</b> {analysis.eligibility_summary}</div>
                <div><b style={{ color: "#fff" }}>Angle:</b> {analysis.application_angle}</div>
                <div><b style={{ color: "#fff" }}>Next step:</b> {analysis.next_step}</div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function Home() {
  const [grants, setGrants] = useState([]);
  const [search, setSearch] = useState("");
  const [country, setCountry] = useState("All");
  const [fit, setFit] = useState("All");
  const [category, setCategory] = useState("");
  const [fundingType, setFundingType] = useState("");
  const [urgency, setUrgency] = useState("");
  const [statFilter, setStatFilter] = useState(null);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try { setGrants(JSON.parse(stored)); return; } catch (_) {}
    }
    setGrants(sampleGrants);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sampleGrants));
  }, []);

  const saveGrants = next => {
    setGrants(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  const addGrants = newGrants => {
    if (!newGrants.length) return;
    saveGrants([...newGrants, ...grants]);
  };

  const today = new Date().toISOString().slice(0, 10);

  const filtered = useMemo(() => grants.filter(g => {
    if (statFilter === "High" && g.fit_score !== "High") return false;
    if (statFilter === "Likely" && g.initial_fit_guess !== "Likely") return false;
    if (statFilter === "Canada" && !String(g.country).includes("Canada")) return false;
    if (statFilter === "United States" && !String(g.country).includes("United States")) return false;
    if (search) {
      const q = search.toLowerCase();
      const fields = [g.grant_name, g.funder_name, g.country, g.region, g.category, g.applicant_type, g.eligibility_summary, g.discovery_note, g.notes].map(v => String(v || "").toLowerCase());
      if (!fields.some(f => f.includes(q))) return false;
    }
    if (country !== "All" && !String(g.country).includes(country)) return false;
    if (fit !== "All" && g.fit_score !== fit) return false;
    if (category && g.category !== category) return false;
    if (fundingType && g.funding_type !== fundingType) return false;
    if (urgency && g.urgency !== urgency) return false;
    return true;
  }), [grants, search, country, fit, category, fundingType, urgency, statFilter]);

  const clearAll = () => { setSearch(""); setCountry("All"); setFit("All"); setCategory(""); setFundingType(""); setUrgency(""); setStatFilter(null); };
  const hasFilters = search || country !== "All" || fit !== "All" || category || fundingType || urgency || statFilter;

  const exportCSV = () => {
    const cols = ["grant_name", "funder_name", "program_url", "country", "region", "category", "funding_type", "amount", "deadline", "source", "applicant_type", "eligibility_summary", "fit_score", "urgency", "initial_fit_guess", "discovery_note", "application_angle", "status", "discovery_date", "notes"];
    const rows = [cols.join(",")];
    filtered.forEach(g => rows.push(cols.map(c => `"${String(g[c] || "").replace(/"/g, '""')}"`).join(",")));
    const blob = new Blob([rows.join("\n")], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `inscend-grants-${today}.csv`;
    a.click();
  };

  const statCards = [
    { label: "Total Grants", value: grants.length, key: null },
    { label: "Added Today", value: grants.filter(g => g.discovery_date === today).length, key: null },
    { label: "🟢 High Fit", value: grants.filter(g => g.fit_score === "High").length, key: "High" },
    { label: "✅ Likely", value: grants.filter(g => g.initial_fit_guess === "Likely").length, key: "Likely" },
    { label: "🍁 Canada", value: grants.filter(g => String(g.country).includes("Canada")).length, key: "Canada" },
    { label: "🇺🇸 US", value: grants.filter(g => String(g.country).includes("United States")).length, key: "United States" }
  ];

  const toggleBtn = (active, onClick, label) => <button key={label} onClick={onClick} style={{ padding: "5px 14px", borderRadius: 20, border: "none", cursor: "pointer", fontSize: 13, fontWeight: active ? 800 : 400, background: active ? "#a78bfa" : "#1a1a1a", color: active ? "#fff" : "#888" }}>{label}</button>;
  const sel = { background: "#111113", color: "#aaa", border: "1px solid #1a1a1a", borderRadius: 8, padding: "6px 12px", fontSize: 13 };

  return (
    <div style={{ background: "#080809", minHeight: "100vh", color: "#fff", fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      <div style={{ maxWidth: 940, margin: "0 auto", padding: "24px 16px 60px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20, gap: 12 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 26, fontWeight: 900 }}><span style={{ color: "#a78bfa" }}>Inscend</span> GRANTED Lead Radar</h1>
            <p style={{ margin: "4px 0 0", color: "#555", fontSize: 13 }}>Grant and non-dilutive funding discovery for Canada & the US</p>
          </div>
          <button onClick={exportCSV} style={{ background: "#7c3aed", color: "#fff", border: "none", borderRadius: 8, padding: "8px 18px", fontWeight: 800, fontSize: 13, cursor: "pointer" }}>↓ Export CSV</button>
        </div>

        <GeminiSettings />
        <AgentPanel grants={grants} onAddGrants={addGrants} />

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 10, marginBottom: 20 }}>
          {statCards.map(({ label, value, key }) => (
            <div key={label} onClick={() => key && setStatFilter(statFilter === key ? null : key)} style={{ background: statFilter === key && key ? "#1e1030" : "#111113", border: `1px solid ${statFilter === key && key ? "#7c3aed" : "#1a1a1a"}`, borderRadius: 10, padding: "14px 16px", cursor: key ? "pointer" : "default" }}>
              <div style={{ fontSize: 28, fontWeight: 900 }}>{value}</div>
              <div style={{ fontSize: 12, color: "#666", marginTop: 2 }}>{label}</div>
            </div>
          ))}
        </div>

        <div style={{ background: "#111113", border: "1px solid #1a1a1a", borderRadius: 10, padding: 16, marginBottom: 20 }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search grant, funder, region, eligibility, notes..." style={{ width: "100%", background: "#0d0d0f", border: "1px solid #1a1a1a", borderRadius: 8, padding: "8px 14px", color: "#fff", fontSize: 14, marginBottom: 14, boxSizing: "border-box" }} />
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
            <span style={{ color: "#555", fontSize: 12, alignSelf: "center" }}>Country:</span>
            {["All", "Canada", "United States"].map(c => toggleBtn(country === c, () => setCountry(c), c === "United States" ? "US" : c))}
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
            <span style={{ color: "#555", fontSize: 12, alignSelf: "center" }}>Fit:</span>
            {["All", "High", "Medium", "Low"].map(f => toggleBtn(fit === f, () => setFit(f), f))}
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <select value={category} onChange={e => setCategory(e.target.value)} style={sel}>
              <option value="">All Categories</option>
              {["Startup", "Nonprofit", "Research", "Small Business", "Youth", "Women", "BIPOC", "Climate", "Tech", "Arts", "Mixed"].map(c => <option key={c}>{c}</option>)}
            </select>
            <select value={fundingType} onChange={e => setFundingType(e.target.value)} style={sel}>
              <option value="">All Funding Types</option>
              {["Grant", "Loan", "Prize", "Accelerator", "Tax Credit", "Other"].map(t => <option key={t}>{t}</option>)}
            </select>
            <select value={urgency} onChange={e => setUrgency(e.target.value)} style={sel}>
              <option value="">All Urgency</option>
              {["Closing Soon", "Open", "Rolling", "Unknown", "Closed"].map(u => <option key={u}>{u}</option>)}
            </select>
          </div>
          {hasFilters && <button onClick={clearAll} style={{ marginTop: 12, background: "transparent", border: "1px solid #2a2a2a", color: "#888", borderRadius: 6, padding: "4px 14px", cursor: "pointer", fontSize: 12 }}>✕ Clear all filters</button>}
        </div>

        <div style={{ color: "#555", fontSize: 13, marginBottom: 12 }}>{filtered.length} grant{filtered.length !== 1 ? "s" : ""} {hasFilters ? "(filtered)" : "total"}</div>
        {filtered.length === 0 && <div style={{ textAlign: "center", color: "#444", padding: "60px 0", fontSize: 14 }}>No grants match the current filters.</div>}
        {filtered.map(grant => <GrantRow key={grant.id} grant={grant} />)}

        <div style={{ textAlign: "center", color: "#333", fontSize: 12, marginTop: 40 }}>Always verify deadlines and eligibility on the official program page · Inscend GRANTED Lead Radar</div>
      </div>
    </div>
  );
}
