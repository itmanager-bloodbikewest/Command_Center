import { useState, useEffect } from "react";
import { useC, isDark, THEME } from "../lib/theme.jsx";
import { Label, inp, sel } from "../ui/primitives.jsx";
import SuggestionDropdown from "./SuggestionDropdown.jsx";

export default function LocationField({ label, value, onChange, options, exclude = [], onAdd, bg }) {
  const C = useC();
  const [adding, setAdding] = useState(false);
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [confirmVal, setConfirmVal] = useState(null);

  useEffect(() => {
    if (!query.trim()) { setSuggestions([]); return; }
    const q = query.toLowerCase();
    setSuggestions(options.filter((o) => o.toLowerCase().includes(q) && !exclude.includes(o)));
  }, [query, options, exclude]);

  const handleAdd = () => {
    const v = query.trim(); if (!v) return;
    const exact = options.find((o) => o.toLowerCase() === v.toLowerCase());
    if (exact) { onChange(exact); setAdding(false); setQuery(""); return; }
    setConfirmVal(v);
  };
  const confirmAdd = () => {
    onAdd(confirmVal); onChange(confirmVal);
    setAdding(false); setQuery(""); setConfirmVal(null);
  };
  const pickSuggestion = (s) => { onChange(s); setAdding(false); setQuery(""); setSuggestions([]); };

  return (
    <div>
      <Label>{label}</Label>
      {!adding ? (
        <div style={{ display: "flex", gap: 6 }}>
          <select aria-label={label} value={value} onChange={(e) => onChange(e.target.value)} style={{ ...sel(C), flex: 1, width: "auto", background: bg || C.inputBg }}>
            <option value="">— Select —</option>
            {options.filter((o) => !exclude.includes(o)).map((h) => <option key={h}>{h}</option>)}
          </select>
          <button onClick={() => setAdding(true)} style={{ background: C.card, border: `1px solid ${C.borderHi}`, color: C.muted, borderRadius: 6, padding: "0 12px", fontSize: 11, cursor: "pointer", fontFamily: "'IBM Plex Mono',monospace", whiteSpace: "nowrap" }}>+ ADD</button>
        </div>
      ) : (
        <div>
          {confirmVal ? (
            <div style={{ background: C.successBg, border: `1px solid ${C.green}`, borderRadius: 7, padding: "10px 14px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 13, color: C.text }}>Add <strong>"{confirmVal}"</strong> to the list?</span>
              <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                <button onClick={confirmAdd} style={{ background: C.green, color: isDark(C) ? "#000" : "#fff", border: "none", borderRadius: 5, padding: "5px 12px", fontSize: 11, cursor: "pointer", fontFamily: "'IBM Plex Mono',monospace", fontWeight: 700 }}>CONFIRM</button>
                <button aria-label="Cancel" onClick={() => setConfirmVal(null)} style={{ background: "none", border: `1px solid ${C.borderHi}`, color: C.muted, borderRadius: 5, padding: "5px 8px", fontSize: 11, cursor: "pointer" }}>✕</button>
              </div>
            </div>
          ) : (
            <div style={{ position: "relative" }}>
              <div style={{ display: "flex", gap: 6 }}>
                <input aria-label={label} value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleAdd()} placeholder="Type location name…" autoFocus style={{ ...inp(C), flex: 1, width: "auto" }} />
                <button onClick={handleAdd} style={{ background: C.accent, border: "none", color: "#fff", borderRadius: 6, padding: "0 12px", fontSize: 11, cursor: "pointer", fontFamily: "'IBM Plex Mono',monospace" }}>ADD</button>
                <button aria-label="Cancel adding location" onClick={() => { setAdding(false); setQuery(""); setSuggestions([]); }} style={{ background: "none", border: `1px solid ${C.borderHi}`, color: C.muted, borderRadius: 6, padding: "0 10px", fontSize: 11, cursor: "pointer" }}>✕</button>
              </div>
              <SuggestionDropdown items={suggestions} onPick={pickSuggestion} header="SIMILAR EXISTING OPTIONS:" right={80} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
