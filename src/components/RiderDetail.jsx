import { useState } from "react";
import { useC, isDark } from "../lib/theme.jsx";
import { Label, Section, Badge, inp } from "../ui/primitives.jsx";
import { fmtTime, fmtDate } from "../lib/datetime.js";
import { isMobileUA, smsLink } from "../lib/messaging.js";
import NotesList from "./NotesList.jsx";

const InfoRow = ({ label, value, C }) => value ? (
  <div style={{ padding: "10px 0", borderBottom: `1px solid ${C.border}` }}>
    <div style={{ fontSize: 13, fontWeight: 700, color: C.text, fontFamily: "'Atkinson Hyperlegible','IBM Plex Sans',sans-serif", marginBottom: 4 }}>{label}</div>
    <div style={{ fontSize: 15, color: C.text, fontWeight: 500 }}>{value}</div>
  </div>
) : null;

const TimeRow = ({ label, val, C }) => (
  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: `1px solid ${C.border}` }}>
    <span style={{ fontSize: 13, fontWeight: 700, color: C.text, fontFamily: "'Atkinson Hyperlegible','IBM Plex Sans',sans-serif" }}>{label}</span>
    <span style={{ fontSize: 13, fontWeight: 600, fontFamily: "'IBM Plex Mono',monospace", color: val ? C.green : C.borderHi }}>{val ? fmtTime(val) : "—"}</span>
  </div>
);

const sheetBtn = (C) => ({
  width: "100%", display: "flex", alignItems: "center", gap: 14,
  background: C.card, border: `1px solid ${C.borderHi}`, borderRadius: 12,
  padding: "14px 16px", marginBottom: 10, cursor: "pointer", textAlign: "left",
});

// Bottom-sheet asking the rider which channel to message the controller on.
function ChannelChooser({ C, label, controllerName, onPick, onCancel }) {
  return (
    <div onClick={onCancel}
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 1000 }}>
      <div onClick={(e) => e.stopPropagation()}
        style={{ background: C.panel, borderTop: `1px solid ${C.borderHi}`, borderTopLeftRadius: 18, borderTopRightRadius: 18, padding: "18px 18px 24px", width: "100%", maxWidth: 480, boxShadow: "0 -8px 40px rgba(0,0,0,0.4)" }}>
        <div style={{ width: 36, height: 4, background: C.borderHi, borderRadius: 2, margin: "0 auto 16px" }} />
        <div style={{ textAlign: "center", marginBottom: 4, fontSize: 16, fontWeight: 700, color: C.text, fontFamily: "'Atkinson Hyperlegible','IBM Plex Sans',sans-serif" }}>
          Send “{label}” to {controllerName || "controller"}
        </div>
        <div style={{ textAlign: "center", marginBottom: 18, fontSize: 12, color: C.muted }}>
          This opens your Messages app with the update ready to send.
        </div>
        <button onClick={() => onPick("sms")} style={sheetBtn(C)}>
          <span style={{ fontSize: 20 }}>💬</span>
          <span style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", lineHeight: 1.3 }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: C.text }}>Text message</span>
            <span style={{ fontSize: 11, color: C.muted }}>Opens your Messages app</span>
          </span>
        </button>
        <button onClick={onCancel}
          style={{ width: "100%", background: "none", border: "none", color: C.muted, padding: "12px", fontSize: 13, cursor: "pointer", fontFamily: "'IBM Plex Mono',monospace", marginTop: 6 }}>
          CANCEL
        </button>
      </div>
    </div>
  );
}

export default function RiderDetail({ call: c, onBack, onPickup, onDropoff, onRiderHome, onNote }) {
  const C = useC();
  const [riderNote, setRiderNote] = useState("");
  const [noteSaved, setNoteSaved] = useState(false);
  const [chooser, setChooser] = useState(null); // { label, handler } | null

  const canPickup = c.status === "pending-pickup";
  const canDropoff = c.status === "in-transit";
  const canHome = c.status === "delivered";

  // On mobile with a controller number, prompt for channel; otherwise write
  // the status straight through (desktop, or no number to message).
  const handleStatus = (label, handler) => {
    if (isMobileUA() && c.controllerPhone) setChooser({ label, handler });
    else handler();
  };

  // Channel picked: commit the status, then open the messaging draft.
  const pickChannel = (channel) => {
    if (!chooser) return;
    const { label, handler } = chooser;
    handler(); // status write — this is the commit point
    const link = smsLink(c.controllerPhone, label);
    if (link) window.location.href = link;
    setChooser(null);
  };

  const saveNote = () => {
    if (!riderNote.trim()) return;
    onNote(riderNote.trim());
    setRiderNote(""); setNoteSaved(true); setTimeout(() => setNoteSaved(false), 2000);
  };

  return (
    <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", zoom: 1.25 }}>
      <div style={{ background: C.panel, borderBottom: `1px solid ${C.border}`, padding: "14px 24px", position: "sticky", top: 0, zIndex: 2, flexShrink: 0 }}>
        <button onClick={onBack} style={{ background: "none", border: "none", color: C.muted, fontSize: 12, cursor: "pointer", fontFamily: "'IBM Plex Mono',monospace", padding: 0, marginBottom: 6 }}>← BACK</button>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 16, color: C.accentText, fontWeight: 700 }}>{c.originHospital} → {c.destinationHospital}</div>
            <div style={{ marginTop: 4 }}><Badge s={c.status} /></div>
          </div>
          {c.greenLights === true && (
            <div style={{ background: C.green + "18", border: `1px solid ${C.green}55`, borderRadius: 8, padding: "8px 14px" }}>
              <span style={{ color: C.green, fontFamily: "'IBM Plex Mono',monospace", fontSize: 11, fontWeight: 700, letterSpacing: 2 }}>🟢 GREEN LIGHTS AUTH.</span>
            </div>
          )}
        </div>
      </div>
      <div style={{ padding: 24 }}>
        <div style={{ marginBottom: 24, display: "flex", flexDirection: "column", gap: 12 }}>
          {canPickup && <button onClick={() => handleStatus("Picked up", onPickup)} style={{ background: C.accent, border: "none", color: "#fff", padding: "20px", borderRadius: 12, fontSize: 17, cursor: "pointer", fontFamily: "'IBM Plex Mono',monospace", fontWeight: 700, letterSpacing: 2, boxShadow: `0 0 30px ${C.accent}55` }}>⬆  Picked up</button>}
          {canDropoff && <button onClick={() => handleStatus("Dropped off", onDropoff)} style={{ background: C.green, border: "none", color: isDark(C) ? "#000" : "#fff", padding: "20px", borderRadius: 12, fontSize: 17, cursor: "pointer", fontFamily: "'IBM Plex Mono',monospace", fontWeight: 700, letterSpacing: 2, boxShadow: `0 0 30px ${C.green}55` }}>✓  Dropped off</button>}
          {(canHome || c.riderHome) && <button onClick={canHome ? () => handleStatus("Rider home", onRiderHome) : undefined} disabled={!!c.riderHome} style={{ background: c.riderHome ? C.card : C.orange, border: `1px solid ${c.riderHome ? C.borderHi : "transparent"}`, color: c.riderHome ? C.muted : isDark(C) ? "#000" : "#fff", padding: "20px", borderRadius: 12, fontSize: 17, cursor: c.riderHome ? "default" : "pointer", fontFamily: "'IBM Plex Mono',monospace", fontWeight: 700, letterSpacing: 2, boxShadow: c.riderHome ? "none" : `0 0 30px ${C.orange}55` }}>🏠  Rider home{c.riderHome ? ` — ${fmtTime(c.riderHome)}` : ""}</button>}
          {c.status === "delivered" && <div style={{ background: C.card, border: `1px solid ${C.borderHi}`, borderRadius: 12, padding: "14px", textAlign: "center", color: C.muted, fontFamily: "'IBM Plex Mono',monospace", fontSize: 12, letterSpacing: 2 }}>Waiting for controller to mark complete</div>}
        </div>
        <Section title="Run details">
          <InfoRow C={C} label="Origin" value={c.originHospital} />
          <InfoRow C={C} label="Destination" value={c.destinationHospital} />
          <InfoRow C={C} label="Items transported" value={Array.isArray(c.itemsTransported) ? c.itemsTransported.join(", ") : c.itemsTransported || null} />
          <InfoRow C={C} label="Pick-up address" value={c.pickupAddress || null} />
          <InfoRow C={C} label="Drop-off address" value={c.dropOffAddress || null} />
          <InfoRow C={C} label="Vehicle" value={c.vehicleUsed || null} />
          <InfoRow C={C} label="Controller" value={c.controllerName || null} />
          <InfoRow C={C} label="Controller phone" value={c.controllerPhone ? <a href={`tel:${c.controllerPhone}`} style={{ color: C.accentText, textDecoration: "none" }}>{c.controllerPhone}</a> : null} />
        </Section>
        {((Array.isArray(c.meetOtherGroup) ? c.meetOtherGroup.length > 0 : c.meetOtherGroup) || c.scheduledMeetupDate || c.scheduledMeetupTime) && (
          <Section title="Meet-up">
            <InfoRow C={C} label="Meet with" value={Array.isArray(c.meetOtherGroup) ? c.meetOtherGroup.join(", ") || null : c.meetOtherGroup || null} />
            <InfoRow C={C} label="Scheduled meet-up date" value={c.scheduledMeetupDate ? fmtDate(c.scheduledMeetupDate) : null} />
            <InfoRow C={C} label="Scheduled meet-up time" value={c.scheduledMeetupTime ? fmtTime(c.scheduledMeetupTime) : null} />
          </Section>
        )}
        {(c.contactName || c.contactPhone) && (
          <Section title="Contact">
            <InfoRow C={C} label="Contact name" value={c.contactName || null} />
            <InfoRow C={C} label="Contact phone" value={c.contactPhone ? <a href={`tel:${c.contactPhone}`} style={{ color: C.accentText, textDecoration: "none" }}>{c.contactPhone}</a> : null} />
          </Section>
        )}
        <Section title="Timing">
          <TimeRow C={C} label="Rider called" val={c.riderCalled} />
          <TimeRow C={C} label="Picked Up" val={c.pickupTime} />
          <TimeRow C={C} label="Delivered" val={c.deliveryTime} />
          <TimeRow C={C} label="Rider home" val={c.riderHome} />
        </Section>
        {c.notes && <Section title="Notes"><NotesList notes={c.notes} /></Section>}
        <Section title="Add note">
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
      {chooser && (
        <ChannelChooser C={C} label={chooser.label} controllerName={c.controllerName}
          onPick={pickChannel} onCancel={() => setChooser(null)} />
      )}
    </div>
  );
}
