import { useState } from "react";
import { useC, isDark } from "../lib/theme.jsx";
import { Label, Section, Badge, inp } from "../ui/primitives.jsx";
import { fmtTime } from "../lib/datetime.js";

const InfoRow = ({ label, value, C }) => value ? (
  <div style={{ padding: "10px 0", borderBottom: `1px solid ${C.border}` }}>
    <div style={{ fontSize: 9, color: C.muted, letterSpacing: 2, fontFamily: "'IBM Plex Mono',monospace", marginBottom: 4 }}>{label.toUpperCase()}</div>
    <div style={{ fontSize: 14, color: C.text, fontWeight: 500 }}>{value}</div>
  </div>
) : null;

const TimeRow = ({ label, val, C }) => (
  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: `1px solid ${C.border}` }}>
    <span style={{ fontSize: 11, color: C.muted, fontFamily: "'IBM Plex Mono',monospace", letterSpacing: 1 }}>{label.toUpperCase()}</span>
    <span style={{ fontSize: 13, fontWeight: 600, fontFamily: "'IBM Plex Mono',monospace", color: val ? C.green : C.borderHi }}>{val ? fmtTime(val) : "—"}</span>
  </div>
);

export default function RiderDetail({ call: c, onBack, onPickup, onDropoff, onRiderHome, onNote }) {
  const C = useC();
  const [riderNote, setRiderNote] = useState("");
  const [noteSaved, setNoteSaved] = useState(false);

  const canPickup = c.status === "pending-pickup";
  const canDropoff = c.status === "in-transit";
  const canHome = c.status === "delivered";

  const saveNote = () => {
    if (!riderNote.trim()) return;
    onNote(riderNote.trim());
    setRiderNote(""); setNoteSaved(true); setTimeout(() => setNoteSaved(false), 2000);
  };

  return (
    <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column" }}>
      <div style={{ background: C.panel, borderBottom: `1px solid ${C.border}`, padding: "14px 24px", flexShrink: 0 }}>
        <button onClick={onBack} style={{ background: "none", border: "none", color: C.muted, fontSize: 12, cursor: "pointer", fontFamily: "'IBM Plex Mono',monospace", padding: 0, marginBottom: 6 }}>← BACK</button>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 16, color: C.accentText, fontWeight: 700 }}>{c.id}</div>
            <div style={{ marginTop: 4 }}><Badge s={c.status} /></div>
          </div>
          {c.greenLights === true && (
            <div style={{ background: C.green + "18", border: `1px solid ${C.green}55`, borderRadius: 8, padding: "8px 14px" }}>
              <span style={{ color: C.green, fontFamily: "'IBM Plex Mono',monospace", fontSize: 11, fontWeight: 700, letterSpacing: 2 }}>🟢 GREEN LIGHTS AUTH.</span>
            </div>
          )}
        </div>
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: 24 }}>
        <div style={{ marginBottom: 24, display: "flex", flexDirection: "column", gap: 12 }}>
          {canPickup && <button onClick={onPickup} style={{ background: C.accent, border: "none", color: "#fff", padding: "20px", borderRadius: 12, fontSize: 17, cursor: "pointer", fontFamily: "'IBM Plex Mono',monospace", fontWeight: 700, letterSpacing: 2, boxShadow: `0 0 30px ${C.accent}55` }}>⬆  PICKED UP</button>}
          {canDropoff && <button onClick={onDropoff} style={{ background: C.green, border: "none", color: isDark(C) ? "#000" : "#fff", padding: "20px", borderRadius: 12, fontSize: 17, cursor: "pointer", fontFamily: "'IBM Plex Mono',monospace", fontWeight: 700, letterSpacing: 2, boxShadow: `0 0 30px ${C.green}55` }}>✓  DROPPED OFF</button>}
          {(canHome || c.riderHome) && <button onClick={canHome ? onRiderHome : undefined} disabled={!!c.riderHome} style={{ background: c.riderHome ? C.card : C.orange, border: `1px solid ${c.riderHome ? C.borderHi : "transparent"}`, color: c.riderHome ? C.muted : isDark(C) ? "#000" : "#fff", padding: "20px", borderRadius: 12, fontSize: 17, cursor: c.riderHome ? "default" : "pointer", fontFamily: "'IBM Plex Mono',monospace", fontWeight: 700, letterSpacing: 2, boxShadow: c.riderHome ? "none" : `0 0 30px ${C.orange}55` }}>🏠  RIDER HOME{c.riderHome ? ` — ${fmtTime(c.riderHome)}` : ""}</button>}
          {c.status === "delivered" && <div style={{ background: C.card, border: `1px solid ${C.borderHi}`, borderRadius: 12, padding: "14px", textAlign: "center", color: C.muted, fontFamily: "'IBM Plex Mono',monospace", fontSize: 12, letterSpacing: 2 }}>Waiting for controller to mark complete</div>}
        </div>
        <Section title="Run Details">
          <InfoRow C={C} label="Origin" value={c.originHospital} />
          <InfoRow C={C} label="Destination" value={c.destinationHospital} />
          <InfoRow C={C} label="Items Transported" value={Array.isArray(c.itemsTransported) ? c.itemsTransported.join(", ") : c.itemsTransported || null} />
          <InfoRow C={C} label="Pick-up Address" value={c.pickupAddress || null} />
          <InfoRow C={C} label="Drop-off Address" value={c.dropOffAddress || null} />
          <InfoRow C={C} label="Vehicle" value={c.vehicleUsed || null} />
        </Section>
        {((Array.isArray(c.meetOtherGroup) ? c.meetOtherGroup.length > 0 : c.meetOtherGroup) || c.scheduledMeetupTime) && (
          <Section title="Meet-up">
            <InfoRow C={C} label="Meet with" value={Array.isArray(c.meetOtherGroup) ? c.meetOtherGroup.join(", ") || null : c.meetOtherGroup || null} />
            <InfoRow C={C} label="Scheduled Meet-up Time" value={c.scheduledMeetupTime || null} />
          </Section>
        )}
        {(c.contactName || c.contactPhone) && (
          <Section title="Contact">
            <InfoRow C={C} label="Contact Name" value={c.contactName || null} />
            <InfoRow C={C} label="Contact Phone" value={c.contactPhone ? <a href={`tel:${c.contactPhone}`} style={{ color: C.accentText, textDecoration: "none" }}>{c.contactPhone}</a> : null} />
          </Section>
        )}
        <Section title="Timing">
          <TimeRow C={C} label="Rider Called" val={c.riderCalled} />
          <TimeRow C={C} label="Picked Up" val={c.pickupTime} />
          <TimeRow C={C} label="Delivered" val={c.deliveryTime} />
          <TimeRow C={C} label="Rider Home" val={c.riderHome} />
        </Section>
        {c.notes && <Section title="Dispatcher Notes"><div style={{ fontSize: 13, color: C.text, lineHeight: 1.8, whiteSpace: "pre-line" }}>{c.notes}</div></Section>}
        <Section title="Add Note">
          <Label optional>Visible to controller</Label>
          <textarea value={riderNote} onChange={(e) => setRiderNote(e.target.value)} rows={3}
            placeholder="Add a note for this run…"
            style={{ ...inp(C), width: "100%", boxSizing: "border-box", resize: "vertical", lineHeight: 1.7 }} />
          <div style={{ display: "flex", gap: 8, marginTop: 10, alignItems: "center" }}>
            <button onClick={saveNote} style={{ background: C.accent, border: "none", color: "#fff", padding: "8px 18px", borderRadius: 6, fontSize: 11, cursor: "pointer", fontFamily: "'IBM Plex Mono',monospace", fontWeight: 700 }}>SAVE NOTE</button>
            {noteSaved && <span style={{ fontSize: 11, color: C.green, fontFamily: "'IBM Plex Mono',monospace" }}>✓ Saved</span>}
          </div>
        </Section>
      </div>
    </div>
  );
}
