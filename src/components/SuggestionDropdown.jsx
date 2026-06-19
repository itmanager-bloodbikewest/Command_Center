import { useC, isDark } from "../lib/theme.jsx";

// Absolute-positioned suggestion list shared by the location and item fields.
export default function SuggestionDropdown({ items, onPick, header, right = 70 }) {
  const C = useC();
  if (!items.length) return null;
  return (
    <div style={{ position: "absolute", top: "100%", left: 0, right, background: C.panel, border: `1px solid ${C.borderHi}`, borderRadius: 6, zIndex: 50, marginTop: 4, boxShadow: "0 4px 16px rgba(0,0,0,0.2)" }}>
      {header && <div style={{ padding: "6px 14px", fontSize: 10, color: C.muted, letterSpacing: 1 }}>{header}</div>}
      {items.map((s) => (
        <div key={s} onClick={() => onPick(s)}
          style={{ padding: "9px 14px", cursor: "pointer", fontSize: 13, borderBottom: `1px solid ${C.border}`, color: C.text }}
          onMouseEnter={(e) => (e.currentTarget.style.background = isDark(C) ? "#2a2a40" : "#eeeef8")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
          {s}
        </div>
      ))}
    </div>
  );
}
