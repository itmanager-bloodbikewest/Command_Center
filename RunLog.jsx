import { useState } from "react";
import { useC, isDark } from "../lib/theme.jsx";
import { Badge } from "../ui/primitives.jsx";
import { fmtDT } from "../lib/datetime.js";

export function RunCard({ rc, onClickView, onComplete, vehicles = [] }) {
  const C = useC();
  const done = rc.status === "complete";
  const [open, setOpen] = useState(false);
  const [veh, setVeh] = useState("");
  const showComplete = !!onComplete && !done;
  const needsVehicle = !rc.vehicleUsed;
  const canConfirm = !needsVehicle || !!veh;
  const stop = (e) => e.stopPropagation();
  const reqBg = isDark(C) ? "#3a3320" : "#fffbe0";

  const openPanel = (e) => { e.stopPropagation(); setOpen(true); };
  const cancelPanel = (e) => { e.stopPropagation(); setOpen(false); setVeh(""); };
  const confirmComplete = (e) => { e.stopPropagation(); if (!canConfirm) return; onComplete(rc.id, needsVehicle ? veh : undefined); };

  return (
    <div onClick={onClickView}
      style={{ background: done ? C.completedBg : C.card, border: `1px solid ${done ? C.border : C.borderHi}`, borderRadius: 10, padding: "13px 18px", marginBottom: 8, cursor: "pointer", opacity: done ? 0.85 : 1 }}
      onMouseEnter={(e) => { e.currentTarget.style.opacity = "1"; e.currentTarget.style.borderColor = C.accent + "88"; }}
      onMouseLeave={(e) => { e.currentTarget.style.opacity = done ? "0.85" : "1"; e.currentTarget.style.borderColor = done ? C.border : C.borderHi; }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6, gap: 8 }}>
        <Badge s={rc.status} />
        {showComplete && !open && (
          <button onClick={openPanel} style={{ background: C.purple, border: "none", color: "#fff", padding: "6px 12px", borderRadius: 6, fontSize: 12, cursor: "pointer", fontFamily: "'Atkinson Hyperlegible','IBM Plex Sans',sans-serif", fontWeight: 700, flexShrink: 0 }}>✓ Mark complete</button>
        )}
      </div>
      <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 3, color: C.text }}>{rc.originHospital} <span style={{ color: C.muted, fontWeight: 400 }}>→</span> {rc.destinationHospital}</div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 6 }}>
        <div style={{ fontSize: 13, color: C.text }}>{Array.isArray(rc.itemsTransported) ? rc.itemsTransported.join(", ") : rc.itemsTransported || "—"}</div>
        <div style={{ fontSize: 13, color: C.text, textAlign: "right" }}>{Array.isArray(rc.riders) ? rc.riders.join(", ") : rc.riders || "—"}</div>
      </div>
      <div style={{ fontSize: 12, color: C.muted, marginTop: 5, fontFamily: "'IBM Plex Mono',monospace" }}>{fmtDT(done ? rc.completedAt : rc.timestamp)}</div>
      {showComplete && <div style={{ fontSize: 13, color: C.text, marginTop: 5, fontFamily: "'Atkinson Hyperlegible','IBM Plex Sans',sans-serif" }}>Vehicle: {rc.vehicleUsed ? rc.vehicleUsed : <span style={{ color: C.red, fontWeight: 700 }}>missing</span>}</div>}

      {open && (
        <div onClick={stop} style={{ marginTop: 12, background: C.sectionBg, border: `1px solid ${C.purple}`, borderRadius: 10, padding: 14 }}>
          {needsVehicle ? (
            <>
              <div style={{ fontSize: 12, color: C.text, marginBottom: 8, fontFamily: "'IBM Plex Mono',monospace" }}>Vehicle required to complete</div>
              <div style={{ fontSize: 10, letterSpacing: 1, color: C.muted, fontFamily: "'IBM Plex Mono',monospace", marginBottom: 5 }}>VEHICLE USED *</div>
              <select value={veh} onChange={(e) => setVeh(e.target.value)} onClick={stop} style={{ width: "100%", marginBottom: 12, background: reqBg, color: C.text, border: `1px solid ${C.borderHi}`, borderRadius: 6, padding: "11px 10px", fontSize: 13, boxSizing: "border-box" }}>
                <option value="">— Select Vehicle —</option>
                {vehicles.map((v) => <option key={v} value={v}>{v}</option>)}
              </select>
            </>
          ) : (
            <>
              <div style={{ fontSize: 13, color: C.text, marginBottom: 12, fontFamily: "'Atkinson Hyperlegible','IBM Plex Sans',sans-serif", fontWeight: 700 }}>Mark Complete</div>
            </>
          )}
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={confirmComplete} disabled={!canConfirm} style={{ flex: 1, background: C.purple, border: "none", color: "#fff", padding: 10, borderRadius: 6, fontSize: 11, cursor: canConfirm ? "pointer" : "not-allowed", fontFamily: "'IBM Plex Mono',monospace", fontWeight: 700, opacity: canConfirm ? 1 : 0.4 }}>Confirm</button>
            <button onClick={cancelPanel} style={{ flex: 1, background: "none", border: `1px solid ${C.borderHi}`, color: C.muted, padding: 10, borderRadius: 6, fontSize: 11, cursor: "pointer", fontFamily: "'Atkinson Hyperlegible','IBM Plex Sans',sans-serif" }}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}

const groupLabel = (C, color, top) => ({ fontSize: 13, fontWeight: 700, color, fontFamily: "'Atkinson Hyperlegible','IBM Plex Sans',sans-serif", marginBottom: 10, ...(top ? { marginTop: 24 } : {}) });

// Active run section. Completed runs are intentionally not shown in the app —
// once completed they live only in the CompletedCalls sheet (the spreadsheet run log).
export function RunGroups({ active, onOpen, onComplete, vehicles }) {
  const C = useC();
  if (active.length === 0) return null;
  return (
    <>
      <div style={groupLabel(C, C.orange)}>Active — {active.length} run{active.length !== 1 ? "s" : ""}</div>
      {active.map((rc) => <RunCard key={rc.id} rc={rc} onClickView={() => onOpen(rc.id)} onComplete={onComplete} vehicles={vehicles} />)}
    </>
  );
}
