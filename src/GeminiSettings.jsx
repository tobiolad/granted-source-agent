import { useEffect, useState } from "react";

export default function GeminiSettings() {
  const [apiKey, setApiKey] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const existing = localStorage.getItem("gemini_api_key") || "";
    setApiKey(existing);
    setSaved(Boolean(existing));
  }, []);

  const saveKey = () => {
    const trimmed = apiKey.trim();
    if (!trimmed) {
      localStorage.removeItem("gemini_api_key");
      setSaved(false);
      return;
    }
    localStorage.setItem("gemini_api_key", trimmed);
    setSaved(true);
  };

  const clearKey = () => {
    localStorage.removeItem("gemini_api_key");
    setApiKey("");
    setSaved(false);
  };

  return (
    <div style={{ background: "#111113", border: "1px solid #1a1a1a", borderRadius: 10, padding: 16, marginBottom: 18 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", flexWrap: "wrap", marginBottom: 10 }}>
        <div>
          <div style={{ fontWeight: 800, fontSize: 15 }}>Gemini Settings</div>
          <div style={{ color: "#666", fontSize: 12 }}>Paste your Gemini API key. It stays in this browser only.</div>
        </div>
        <span style={{ fontSize: 12, color: saved ? "#34d399" : "#f87171", fontWeight: 700 }}>
          {saved ? "Gemini connected" : "Gemini not connected"}
        </span>
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <input
          value={apiKey}
          onChange={e => { setApiKey(e.target.value); setSaved(false); }}
          type="password"
          placeholder="Paste Gemini API key"
          style={{ flex: "1 1 280px", background: "#0d0d0f", border: "1px solid #1a1a1a", borderRadius: 8, padding: "9px 12px", color: "#fff", fontSize: 13 }}
        />
        <button onClick={saveKey} style={{ background: "#7c3aed", color: "#fff", border: "none", borderRadius: 8, padding: "9px 14px", fontWeight: 700, cursor: "pointer" }}>Save</button>
        <button onClick={clearKey} style={{ background: "transparent", color: "#888", border: "1px solid #2a2a2a", borderRadius: 8, padding: "9px 14px", cursor: "pointer" }}>Clear</button>
      </div>
    </div>
  );
}
