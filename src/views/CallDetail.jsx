import { useState, useEffect } from "react";
import { useC, isDark } from "../lib/theme.jsx";
import { Section, Badge, inp } from "../ui/primitives.jsx";
import { fmtDate, fmtTime, fmtDT } from "../lib/datetime.js";

// Editable / read-only metadata row.
function EditRow({ label, fieldKey, type = "text", children, readOnly: ro = false, fmt, sc, patchField, notify, isCompleted }) {
  const C = useC();
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(sc[fieldKey] || "");
  useEffect(() => setVal(sc[fieldKey] || ""), [sc[fieldKey]]);
  const save = () => { patchField(sc.id, fieldKey, val); setEditing(false); notify("Saved", C.accent); };

  if (children || ro)
    return (
      <div style={{ display: "flex", gap: 12, padding: "9px 0", borderBottom: `1px solid ${C.border}`, alignItems: "center" }}>
        <div style={{ width: 160, fontSize: 10, color: C.muted, letterSpacing: 1, fontFamily: "'IBM Plex Mono',monospace", flexShrink: 0 }}>{label.toUpperCase()}</div>
        <div style={{ fontSize: 13, color: C.text, flex: 1 }}>{children || (fmt ? fmt(sc[fieldKey]) : sc[fieldKey]) || "—"}</div>
      </div>
    );
  return (
    <div style={{ display: "flex", gap: 12, padding: "9px 0", borderBottom: `1px solid ${C.border}`, alignItems: "center" }}>
      <div style={{ width: 160, fontSize: 10, color: C.muted, letterSpacing: 1, fontFamily: "'IBM Plex Mono',monospace", flexShrink: 0 }}>{label.toUpperCase()}</div>
      {editing
        ? <div style={{ display: "flex", gap: 6, flex: 1 }}><input type={type} value={type === "date" ? fmtDate(val) : type === "time" ? fmtTime(val) : val} onChange={(e) => setVal(e.target.value)} autoFocus style={{ ...inp(C, true), flex: 1, width: "auto" }} onKeyDown={(e) => { if (e.key === "Enter") save(); if (e.key === "Escape") setEditing(false); }} /><button onClick={save} style={{ background: C.green, color: isDark(C) ? "#000" : "#fff", border: "none", borderRadius: 5, padding: "0 12px", cursor: "pointer", fontSize: 11, fontFamily: "'IBM Plex Mono',monospace" }}>SAVE</button><button onClick={() => setEditing(false)} style={{ background: "none", border: `1px solid ${C.borderHi}`, color: C.muted, borderRadius: 5, padding: "0 10px", cursor: "pointer", fontSize: 11 }}>✕</button></div>
        : <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "space-between" }}><span style={{ fontSize: 13, color: val ? C.text : C.muted }}>{fmt ? fmt(val) : val || "—"}</span>{!isCompleted && <button onClick={() => setEditing(true)} style={{ background: "none", border: `1px solid ${C.borderHi}`, color: C.muted, borderRadius: 5, padding: "3px 10px", cursor: "pointer", fontSize: 10, fontFamily: "'IBM Plex Mono',monospace" }}>✎ edit</button>}</div>}
    </div>
  );
}

// Timing value with inline override.
function TimingRow({ label, fieldKey, note, sc, allCalls, patchField, notify, isCompleted }) {
  const C = useC();
  const val = allCalls.find((x) => x.id === sc.id)?.[fieldKey] || "";
  const [ov, setOv] = useState(false);
  const [ovVal, setOvVal] = useState(val);
  useEffect(() => setOvVal(val), [val]);
  const saveOv = () => { patchField(sc.id, fieldKey, ovVal); setOv(false); notify("Override saved", C.accent); };
  return (
    <div style={{ display: "flex", gap: 12, padding: "9px 0", borderBottom: `1px solid ${C.border}`, alignItems: "center" }}>
      <div style={{ width: 160, fontSize: 10, color: C.muted, letterSpacing: 1, fontFamily: "'IBM Plex Mono',monospace", flexShrink: 0 }}>{label.toUpperCase()}</div>
      {ov
        ? <div style={{ display: "flex", gap: 6, flex: 1 }}><input type="time" value={ovVal} onChange={(e) => setOvVal(e.target.value)} autoFocus style={{ ...inp(C, true), width: 120 }} /><button onClick={saveOv} style={{ background: C.green, color: isDark(C) ? "#000" : "#fff", border: "none", borderRadius: 5, padding: "0 12px", cursor: "pointer", fontSize: 11, fontFamily: "'IBM Plex Mono',monospace" }}>SAVE</button><button onClick={() => setOv(false)} style={{ background: "none", border: `1px solid ${C.borderHi}`, color: C.muted, borderRadius: 5, padding: "0 10px", cursor: "pointer", fontSize: 11 }}>✕</button></div>
        : <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1 }}><span style={{ fontSize: 14, fontWeight: 600, fontFamily: "'IBM Plex Mono',monospace", color: val ? C.text : C.borderHi }}>{val ? fmtTime(val) : "pending…"}</span>{val && <span style={{ fontSize: 9, color: C.green, background: C.green + "22", padding: "1px 6px", borderRadius: 8 }}>RECORDED</span>}{note && !val && <span style={{ fontSize: 9, color: C.muted, fontStyle: "italic" }}>{note}</span>}{!isCompleted && <button onClick={() => setOv(true)} style={{ marginLeft: "auto", background: "none", border: `1px solid ${C.borderHi}`, color: C.muted, borderRadius: 5, padding: "3px 10px", cursor: "pointer", fontSize: 10, fontFamily: "'IBM Plex Mono',monospace" }}>✎ override</button>}</div>}
    </div>
  );
}

export default function CallDetail({ sc, allCalls, patchField, notify, confirmComplete, setConfirmComplete, markComplete, onBack }) {
  const C = useC();
  const isCompleted = sc.status === "complete";
  const rowCtx = { sc, patchField, notify, isCompleted };
  const timeCtx = { sc, allCalls, patchField, notify, isCompleted };

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: 16, maxWidth: 900, margin: "0 auto", width: "100%", boxSizing: "border-box" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20, gap: 12 }}>
        <div><button onClick={onBack} style={{ background: "none", border: "none", color: C.muted, fontSize: 12, cursor: "pointer", fontFamily: "'IBM Plex Mono',monospace", padding: 0, marginBottom: 6 }}>← BACK TO LOG</button><div style={{ fontSize: 22, fontWeight: 700, fontFamily: "'IBM Plex Mono',monospace", color: isCompleted ? C.purple : C.accentText }}>{sc.originHospital} → {sc.destinationHospital}</div><div style={{ marginTop: 6 }}><Badge s={sc.status} /></div>{isCompleted && <div style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>Completed {sc.completedAt}</div>}</div>
        {!isCompleted && (!confirmComplete
          ? <button onClick={() => setConfirmComplete(true)} style={{ background: C.purple, border: "none", color: "#fff", padding: "10px 16px", borderRadius: 8, fontSize: 11, cursor: "pointer", fontFamily: "'IBM Plex Mono',monospace", fontWeight: 700, letterSpacing: 1, boxShadow: `0 0 20px ${C.purple}44`, flexShrink: 0 }}>✓ MARK COMPLETE</button>
          : <div style={{ background: C.confirmBg, border: `1px solid ${C.purple}`, borderRadius: 10, padding: "14px 18px", textAlign: "center", minWidth: 200 }}><div style={{ fontSize: 12, color: C.text, marginBottom: 10, fontFamily: "'IBM Plex Mono',monospace" }}>Move to Completed Calls?</div><div style={{ fontSize: 11, color: C.muted, marginBottom: 14 }}>This will archive the record.</div><div style={{ display: "flex", gap: 8 }}><button onClick={() => markComplete(sc.id)} style={{ flex: 1, background: C.purple, border: "none", color: "#fff", padding: "8px", borderRadius: 6, fontSize: 12, cursor: "pointer", fontFamily: "'IBM Plex Mono',monospace", fontWeight: 700 }}>CONFIRM</button><button onClick={() => setConfirmComplete(false)} style={{ flex: 1, background: "none", border: `1px solid ${C.borderHi}`, color: C.muted, padding: "8px", borderRadius: 6, fontSize: 12, cursor: "pointer", fontFamily: "'IBM Plex Mono',monospace" }}>CANCEL</button></div></div>
        )}
      </div>
      <Section title="Call Metadata">
        <EditRow {...rowCtx} label="Timestamp" readOnly><span>{fmtDT(sc.timestamp)}</span></EditRow>
        <EditRow {...rowCtx} label="Time of Call" fieldKey="timeOfCall" type="time" fmt={fmtTime} />
        <EditRow {...rowCtx} label="Date of Call" fieldKey="dateOfCallFromHospital" type="date" fmt={fmtDate} />
        <EditRow {...rowCtx} label="Controller" fieldKey="controllerName" />
        <EditRow {...rowCtx} label="Transport Date" fieldKey="transportDate" type="date" fmt={fmtDate} />
        <EditRow {...rowCtx} label="Date Call Received" fieldKey="dateCallReceived" type="date" fmt={fmtDate} />
        <EditRow {...rowCtx} label="Rider Called" readOnly><span style={{ fontFamily: "'IBM Plex Mono',monospace" }}>{fmtTime(sc.riderCalled)}</span></EditRow>
      </Section>
      <Section title="Route">
        <EditRow {...rowCtx} label="Origin" readOnly><span>{sc.originHospital}</span></EditRow>
        <EditRow {...rowCtx} label="Destination" readOnly><span>{sc.destinationHospital}</span></EditRow>
        <EditRow {...rowCtx} label="Items" readOnly><span>{Array.isArray(sc.itemsTransported) ? sc.itemsTransported.join(", ") : sc.itemsTransported || "—"}</span></EditRow>
        <EditRow {...rowCtx} label="No. of Packages" fieldKey="numPackages" type="number" />
        <EditRow {...rowCtx} label="Pick-up Address" fieldKey="pickupAddress" />
        <EditRow {...rowCtx} label="Drop-off Address" fieldKey="dropOffAddress" />
      </Section>
      <Section title="Contact">
        <EditRow {...rowCtx} label="Contact Name" fieldKey="contactName" />
        <EditRow {...rowCtx} label="Contact Phone" fieldKey="contactPhone" type="tel" />
      </Section>
      <Section title="Crew & Vehicle">
        <EditRow {...rowCtx} label="Rider(s)" readOnly><span>{Array.isArray(sc.riders) ? sc.riders.join(", ") : sc.riders || "—"}</span></EditRow>
        <EditRow {...rowCtx} label="Duty Status" readOnly><span>{sc.riderDutyStatus || "—"}</span></EditRow>
        <EditRow {...rowCtx} label="Vehicle" readOnly><span>{sc.vehicleUsed || "—"}</span></EditRow>
        <EditRow {...rowCtx} label="Meet Other Group" readOnly><span>{Array.isArray(sc.meetOtherGroup) ? sc.meetOtherGroup.join(", ") || "—" : sc.meetOtherGroup || "—"}</span></EditRow>
        <EditRow {...rowCtx} label="Meet-up Date" fieldKey="scheduledMeetupDate" type="date" fmt={fmtDate} />
        <EditRow {...rowCtx} label="Meet-up Time" fieldKey="scheduledMeetupTime" type="time" fmt={fmtTime} />
        <EditRow {...rowCtx} label="Green Lights" readOnly><span style={{ color: sc.greenLights === true ? C.green : sc.greenLights === false ? C.red : C.muted }}>{sc.greenLights === true ? "✓ YES" : sc.greenLights === false ? "✕ NO" : "—"}</span></EditRow>
      </Section>
      <Section title="Timing Log">
        <TimingRow {...timeCtx} label="Rider Called" fieldKey="riderCalled" />
        <TimingRow {...timeCtx} label="Pickup Time" fieldKey="pickupTime" note="triggers on rider Picked Up" />
        <EditRow {...rowCtx} label="Scheduled Meet-up" fieldKey="scheduledMeetupTime" type="time" fmt={fmtTime} />
        <TimingRow {...timeCtx} label="Actual Meet-up" fieldKey="meetupTime" note="triggers on rider Dropped Off" />
        <TimingRow {...timeCtx} label="Delivery Time" fieldKey="deliveryTime" note="triggers on rider Dropped Off" />
        <TimingRow {...timeCtx} label="Rider Home" fieldKey="riderHome" note="triggers on rider Rider Home" />
        {isCompleted && <TimingRow {...timeCtx} label="Completed At" fieldKey="completedAt" />}
      </Section>
      {sc.notes && <Section title="Notes"><div style={{ fontSize: 13, color: C.text, lineHeight: 1.8 }}>{sc.notes}</div></Section>}
    </div>
  );
}
