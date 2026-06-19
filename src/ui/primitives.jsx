import { useC, isDark } from "../lib/theme.jsx";
import { STATUS } from "../constants.js";

// Input/select style builders — pass the active palette C.
export const inp = (C, hi = false, ro = false) => ({
  width: "100%", boxSizing: "border-box",
  background: hi ? (isDark(C) ? "#4d8aff0f" : "#1a4fd610") : C.inputBg,
  border: `1px solid ${hi ? (isDark(C) ? "#4d8aff55" : "#1a4fd655") : C.inputBorder}`,
  color: ro ? C.muted : C.text, padding: "9px 12px", borderRadius: 7,
  fontSize: 13, fontFamily: "'IBM Plex Sans',sans-serif",
  outline: "none", cursor: ro ? "default" : "text",
});
export const sel = (C) => ({ ...inp(C), appearance: "none", cursor: "pointer" });

export const Label = ({ children, auto, optional, note }) => {
  const C = useC();
  return (
    <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 5 }}>
      <span style={{ fontSize: 9, letterSpacing: 2, color: C.muted, fontFamily: "'IBM Plex Mono',monospace", textTransform: "uppercase" }}>{children}</span>
      {auto     && <span style={{ fontSize: 8, background: isDark(C) ? "#4d8aff22" : "#1a4fd618", color: C.accentText, borderRadius: 3, padding: "1px 5px", letterSpacing: 1 }}>AUTO</span>}
      {optional && <span style={{ fontSize: 8, background: isDark(C) ? "#fbbf2422" : "#92400e18", color: C.orange, borderRadius: 3, padding: "1px 5px", letterSpacing: 1 }}>OPTIONAL</span>}
      {note     && <span style={{ fontSize: 8, color: C.muted, fontStyle: "italic" }}>{note}</span>}
    </div>
  );
};

export const Section = ({ title, children, style = {} }) => {
  const C = useC();
  return (
    <div style={{ background: C.sectionBg, border: `1px solid ${C.borderHi}`, borderRadius: 10, padding: "18px 20px", marginBottom: 16, ...style }}>
      <div style={{ fontSize: 9, letterSpacing: 3, color: C.muted, fontFamily: "'IBM Plex Mono',monospace", marginBottom: 14 }}>{title}</div>
      {children}
    </div>
  );
};

export const Grid = ({ cols = 2, children, gap = 14 }) => (
  <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols},1fr)`, gap }}>{children}</div>
);

export const Chip = ({ active, children, onClick, color }) => {
  const C = useC();
  const ac = color || (active ? C.accent : "#2a2a42");
  return (
    <button onClick={onClick} style={{ padding: "5px 12px", borderRadius: 20, border: `1px solid ${active ? ac : C.borderHi}`, background: active ? ac + "22" : C.card, color: active ? ac : C.muted, fontSize: 11, cursor: "pointer", fontFamily: "'IBM Plex Sans',sans-serif", whiteSpace: "nowrap" }}>{children}</button>
  );
};

export const Badge = ({ s }) => {
  const C = useC();
  const m = STATUS[s] || { label: s, colorKey: "muted" };
  const col = C[m.colorKey] || C.muted;
  return <span style={{ fontSize: 9, color: col, background: col + "33", padding: "2px 8px", borderRadius: 10, letterSpacing: 1, fontFamily: "'IBM Plex Mono',monospace" }}>● {m.label.toUpperCase()}</span>;
};
