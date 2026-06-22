import { useC, isDark } from "../lib/theme.jsx";
import { STATUS } from "../constants.js";

// Input/select style builders — pass the active palette C.
export const inp = (C, hi = false, ro = false) => ({
  width: "100%", boxSizing: "border-box",
  background: hi ? (isDark(C) ? "#4d8aff0f" : "#1a4fd610") : C.inputBg,
  border: `1px solid ${hi ? (isDark(C) ? "#4d8aff55" : "#1a4fd655") : C.inputBorder}`,
  color: ro ? C.muted : C.text, padding: "10px 12px", borderRadius: 7,
  fontSize: 14, fontFamily: "'Atkinson Hyperlegible','IBM Plex Sans',sans-serif",
  cursor: ro ? "default" : "text",
});
export const sel = (C) => ({ ...inp(C), appearance: "none", cursor: "pointer" });

// Field label. Required fields show a bold red asterisk when empty and a green
// check once filled (pass `filled`). A trailing "*" in the text also marks required.
export const Label = ({ children, auto, optional, note, required, filled }) => {
  const C = useC();
  let text = children, req = required;
  if (typeof children === "string" && children.trim().endsWith("*")) { text = children.replace(/\s*\*\s*$/, ""); req = true; }
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 6 }}>
      <span style={{ fontSize: 14, fontWeight: 700, color: C.text, fontFamily: "'Atkinson Hyperlegible','IBM Plex Sans',sans-serif" }}>{text}</span>
      {req && !filled && <span aria-label="required" style={{ color: C.red, fontWeight: 700, fontSize: 17, lineHeight: 1 }}>*</span>}
      {req && filled  && <span aria-label="provided" style={{ color: C.green, fontWeight: 700, fontSize: 15, lineHeight: 1 }}>✓</span>}
      {auto     && <span style={{ fontSize: 11, fontWeight: 700, background: isDark(C) ? "#2f6bff22" : "#1a4fd618", color: C.accentText, borderRadius: 4, padding: "2px 7px" }}>Auto</span>}
      {optional && <span style={{ fontSize: 12, color: C.muted, fontWeight: 400 }}>optional</span>}
      {note     && <span style={{ fontSize: 12, color: C.muted, fontStyle: "italic" }}>{note}</span>}
    </div>
  );
};

export const Section = ({ title, children, style = {} }) => {
  const C = useC();
  return (
    <div style={{ background: C.sectionBg, border: `1px solid ${C.borderHi}`, borderRadius: 10, padding: "18px 20px", marginBottom: 16, ...style }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: C.text, fontFamily: "'Atkinson Hyperlegible','IBM Plex Sans',sans-serif", marginBottom: 14 }}>{title}</div>
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
    <button onClick={onClick} style={{ padding: "6px 13px", borderRadius: 20, border: `1px solid ${active ? ac : C.borderHi}`, background: active ? ac + "22" : C.card, color: active ? ac : C.text, fontSize: 13, cursor: "pointer", fontFamily: "'Atkinson Hyperlegible','IBM Plex Sans',sans-serif", whiteSpace: "nowrap", fontWeight: active ? 700 : 400 }}>{children}</button>
  );
};

export const Badge = ({ s }) => {
  const C = useC();
  const m = STATUS[s] || { label: s, colorKey: "muted" };
  const col = C[m.colorKey] || C.muted;
  return <span style={{ fontSize: 12, fontWeight: 700, color: col, background: col + "33", padding: "3px 9px", borderRadius: 10, fontFamily: "'Atkinson Hyperlegible','IBM Plex Sans',sans-serif" }}>● {m.label}</span>;
};
