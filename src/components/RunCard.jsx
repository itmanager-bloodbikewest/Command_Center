import { useC } from "../lib/theme.jsx";
import { Badge } from "../ui/primitives.jsx";
import { fmtDT } from "../lib/datetime.js";

export function RunCard({ rc, onClickView }) {
  const C = useC();
  const done = rc.status === "complete";
  return (
    <div onClick={onClickView}
      style={{ background: done ? C.completedBg : C.card, border: `1px solid ${done ? C.border : C.borderHi}`, borderRadius: 10, padding: "13px 18px", marginBottom: 8, cursor: "pointer", opacity: done ? 0.85 : 1 }}
      onMouseEnter={(e) => { e.currentTarget.style.opacity = "1"; e.currentTarget.style.borderColor = C.accent + "88"; }}
      onMouseLeave={(e) => { e.currentTarget.style.opacity = done ? "0.85" : "1"; e.currentTarget.style.borderColor = done ? C.border : C.borderHi; }}>
      <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", marginBottom: 6 }}>
        <Badge s={rc.status} />
      </div>
      <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 2, color: C.text }}>{rc.originHospital} <span style={{ color: C.muted, fontWeight: 400 }}>→</span> {rc.destinationHospital}</div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 6 }}>
        <div style={{ fontSize: 11, color: C.muted }}>{Array.isArray(rc.itemsTransported) ? rc.itemsTransported.join(", ") : rc.itemsTransported || "—"}</div>
        <div style={{ fontSize: 11, color: C.muted, textAlign: "right" }}>{Array.isArray(rc.riders) ? rc.riders.join(", ") : rc.riders || "—"}</div>
      </div>
      <div style={{ fontSize: 10, color: C.muted, marginTop: 4, fontFamily: "'IBM Plex Mono',monospace" }}>{fmtDT(done ? rc.completedAt : rc.timestamp)}</div>
    </div>
  );
}

const groupLabel = (C, color, top) => ({ fontSize: 9, letterSpacing: 3, color, fontFamily: "'IBM Plex Mono',monospace", marginBottom: 10, ...(top ? { marginTop: 24 } : {}) });

// Active run section. Completed runs are intentionally not shown in the app —
// once completed they live only in the CompletedCalls sheet (the spreadsheet run log).
export function RunGroups({ active, onOpen }) {
  const C = useC();
  if (active.length === 0) return null;
  return (
    <>
      <div style={groupLabel(C, C.orange)}>ACTIVE — {active.length} RUN{active.length !== 1 ? "S" : ""}</div>
      {active.map((rc) => <RunCard key={rc.id} rc={rc} onClickView={() => onOpen(rc.id)} />)}
    </>
  );
}
