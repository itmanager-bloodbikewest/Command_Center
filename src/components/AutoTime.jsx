import { useC, isDark } from "../lib/theme.jsx";
import { Label, inp } from "../ui/primitives.jsx";
import { nowTime } from "../lib/datetime.js";

export default function AutoTime({ label, value, fieldKey, overrides, onOverride, note }) {
  const C = useC();
  const ov = !!overrides[fieldKey];
  return (
    <div>
      <Label auto note={note}>{label}</Label>
      <div style={{ display: "flex", gap: 6 }}>
        <input type="time" value={value} readOnly={!ov} onChange={(e) => ov && onOverride(fieldKey, e.target.value)}
          style={{ ...inp(C, ov, !ov), flex: 1, color: value ? C.text : C.muted }} />
        <button onClick={() => onOverride(fieldKey, ov ? null : (value || nowTime()))}
          style={{ background: ov ? (isDark(C) ? "#4d8aff22" : "#1a4fd618") : C.card, border: `1px solid ${ov ? C.accent : C.borderHi}`, color: ov ? C.accentText : C.muted, borderRadius: 6, padding: "0 10px", cursor: "pointer", fontSize: 10, whiteSpace: "nowrap" }}>
          {ov ? "✎ on" : "✎"}
        </button>
      </div>
    </div>
  );
}
