import { useState } from "react";
import { runDiscovery } from "./agent.js";

const categories = ["Startup", "Nonprofit", "Research", "Small Business", "Youth", "Women", "BIPOC", "Climate", "Tech", "Arts", "Mixed"];
const applicantTypes = ["Startup", "Small business", "Nonprofit", "Founder", "Youth founder", "Researcher", "Women-owned business", "BIPOC entrepreneur", "Social enterprise", "Any eligible applicant"];

export default function AgentPanel({ grants, onAddGrants }) {
  const [open, setOpen] = useState(true);
  const [keywords, setKeywords] = useState("startup grant small business");
  const [country, setCountry] = useState("Canada/US");
  const [category, setCategory] = useState("Startup");
  const [applicantType, setApplicantType] = useState("Startup");
  const [maxGrants, setMaxGrants] = useState(10);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const discover = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const found = await runDiscovery({ keywords, country, category, applicantType, maxGrants: Number(maxGrants) || 10 });
      const existingKeys = new Set(grants.map(g => `${(g.program_url || "").toLowerCase()}|${(g.grant_name || "").toLowerCase()}`));
      const newGrants = found.filter(g => !existingKeys.has(`${(g.program_url || "").toLowerCase()}|${(g.grant_name || "").toLowerCase()}`));
      const duplicates = found.length - newGrants.length;

      onAddGrants(newGrants);
      setResult({ found: found.length, added: newGrants.length, duplicates, ranAt: new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) });
    } catch (err) {
      setError(err.message || "Discovery failed. Try different keywords.");
    } finally {
      setLoading(false);
    }
  };

  const label = { display: "block", color: "#777", fontSize: 12, marginBottom: 6, fontWeight: 700 };
  const input = { width: "100%", background: "#0d0d0f", border: "1px solid #1a1a1a", borderRadius: 8, padding: "9px 12px", color: "#fff", fontSize: 13, boxSizing: "border-box" };

  return (
    <div style={{ background: "linear-gradient(135deg, #111113, #0c0c10)", border: "1px solid #252030", borderRadius: 12, padding: 16, marginBottom: 18 }}>
      <div onClick={() => setOpen(o => !o)} style={{ display: "flex", justifyContent: "space-between", cursor: "pointer", gap: 12 }}>
        <div>
          <div style={{ color: "#a78bfa", fontSize: 12, fontWeight: 800, marginBottom: 3 }}>✦ Gemini Grant Discovery</div>
          <div style={{ color: "#fff", fontWeight: 800, fontSize: 17 }}>AI-powered funding search for Canada & US</div>
          <div style={{ color: "#666", fontSize: 12, marginTop: 3 }}>Finds public grants, programs, competitions, and non-dilutive funding.</div>
        </div>
        <div style={{ color: "#777" }}>{open ? "▲" : "▼"}</div>
      </div>

      {open && (
        <div style={{ marginTop: 16 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, marginBottom: 12 }}>
            <div style={{ gridColumn: "span 2" }}>
              <label style={label}>Search Keywords</label>
              <input value={keywords} onChange={e => setKeywords(e.target.value)} style={input} placeholder="e.g. AI startup grant, youth entrepreneur funding" />
              <div style={{ color: "#555", fontSize: 11, marginTop: 5 }}>Use direct phrases like “women founder grant Ontario” or “SBIR AI startup”.</div>
            </div>
            <div>
              <label style={label}>Country</label>
              <select value={country} onChange={e => setCountry(e.target.value)} style={input}>
                {["Canada/US", "Canada", "United States"].map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label style={label}>Category</label>
              <select value={category} onChange={e => setCategory(e.target.value)} style={input}>
                {categories.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label style={label}>Applicant Type</label>
              <select value={applicantType} onChange={e => setApplicantType(e.target.value)} style={input}>
                {applicantTypes.map(a => <option key={a}>{a}</option>)}
              </select>
            </div>
            <div>
              <label style={label}>Max Results</label>
              <input value={maxGrants} min="1" max="20" type="number" onChange={e => setMaxGrants(e.target.value)} style={input} />
            </div>
          </div>

          <button onClick={discover} disabled={loading} style={{ width: "100%", background: loading ? "#3a2a5a" : "#7c3aed", color: "#fff", border: "none", borderRadius: 10, padding: "11px 16px", fontWeight: 800, cursor: loading ? "not-allowed" : "pointer" }}>
            {loading ? "Searching official funding sources..." : "✦ Run Grant Discovery"}
          </button>

          {result && (
            <div style={{ marginTop: 12, background: "#0a2010", color: "#34d399", border: "1px solid #123b20", borderRadius: 8, padding: 12, fontSize: 13 }}>
              <div style={{ fontWeight: 800, marginBottom: 4 }}>✓ Discovery complete</div>
              <div>Found: {result.found} opportunities</div>
              <div>New grants added: {result.added}</div>
              <div>Duplicates skipped: {result.duplicates}</div>
              <div>Ran at: {result.ranAt}</div>
            </div>
          )}

          {error && (
            <div style={{ marginTop: 12, background: "#1e0a0a", color: "#f87171", border: "1px solid #3a1212", borderRadius: 8, padding: 12, fontSize: 13 }}>✕ {error}</div>
          )}

          <div style={{ color: "#555", fontSize: 12, marginTop: 12, lineHeight: 1.6 }}>
            Tips: verify deadlines on the official page before acting. Grant pages change often, and Gemini only reads public web results.
          </div>
        </div>
      )}
    </div>
  );
}
