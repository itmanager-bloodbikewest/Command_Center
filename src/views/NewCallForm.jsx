import { useState } from "react";
import { useC, isDark } from "../lib/theme.jsx";
import { Section, Grid, Label, Chip, inp, sel } from "../ui/primitives.jsx";
import LocationField from "../components/LocationField.jsx";
import SuggestionDropdown from "../components/SuggestionDropdown.jsx";
import AutoTime from "../components/AutoTime.jsx";

export default function NewCallForm({
  form, fset, ftog, handleOverride,
  lists, onAddLocation, onAddMeetup,
  itemQuery, setItemQ, itemSugg, addItem, confirmItem, setCI, confirmAdd,
  onSubmit, onCancel,
}) {
  const C = useC();
  const { controllers, riders, hospitals, vehicles, meetups, itemPicklist, dutyStatuses } = lists;
  const [newGroup, setNewGroup] = useState("");
  const [confirmLeave, setConfirmLeave] = useState(false);

  const addGroup = () => {
    const v = newGroup.trim();
    if (!v) return;
    if (!meetups.includes(v)) onAddMeetup(v);
    const cur = Array.isArray(form.meetOtherGroup) ? form.meetOtherGroup : [];
    if (!cur.includes(v)) fset("meetOtherGroup", [...cur, v]);
    setNewGroup("");
  };

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: 16, maxWidth: 920, margin: "0 auto", width: "100%", boxSizing: "border-box" }}>
      {confirmItem && (
        <div style={{ background: C.successBg, border: `1px solid ${C.green}`, borderRadius: 8, padding: "12px 16px", marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 13, color: C.text }}>Add <strong>"{confirmItem}"</strong> to the picklist?</span>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={confirmAdd} style={{ background: C.green, color: isDark(C) ? "#000" : "#fff", border: "none", borderRadius: 5, padding: "6px 16px", fontSize: 11, cursor: "pointer", fontFamily: "'IBM Plex Mono',monospace", fontWeight: 700 }}>CONFIRM & ADD</button>
            <button onClick={() => setCI(null)} style={{ background: "none", border: `1px solid ${C.borderHi}`, color: C.muted, borderRadius: 5, padding: "6px 12px", fontSize: 11, cursor: "pointer", fontFamily: "'IBM Plex Mono',monospace" }}>CANCEL</button>
          </div>
        </div>
      )}
      {confirmLeave && (
        <div style={{ background: C.confirmBg, border: `1px solid ${C.red}`, borderRadius: 8, padding: "12px 16px", marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 13, color: C.text }}>Go back? Unsaved details will be lost.</span>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={onCancel} style={{ background: C.red, color: "#fff", border: "none", borderRadius: 5, padding: "6px 16px", fontSize: 11, cursor: "pointer", fontFamily: "'IBM Plex Mono',monospace", fontWeight: 700 }}>DISCARD</button>
            <button onClick={() => setConfirmLeave(false)} style={{ background: "none", border: `1px solid ${C.borderHi}`, color: C.muted, borderRadius: 5, padding: "6px 12px", fontSize: 11, cursor: "pointer", fontFamily: "'IBM Plex Mono',monospace" }}>STAY</button>
          </div>
        </div>
      )}
      <button onClick={() => setConfirmLeave(true)} style={{ background: "none", border: "none", color: C.muted, fontSize: 12, cursor: "pointer", fontFamily: "'IBM Plex Mono',monospace", padding: 0, marginBottom: 10 }}>← BACK</button>
      <div style={{ fontSize: 10, color: C.muted, fontFamily: "'IBM Plex Mono',monospace", letterSpacing: 2, marginBottom: 18 }}>NEW CALL — * REQUIRED FIELDS</div>

      <Section title="Call Metadata">
        <Grid cols={2}>
          <div><Label auto>Timestamp</Label><input value={form.timestamp} readOnly style={{ ...inp(C, false, true), width: "100%" }} /></div>
          <div><Label>Time of Call from Hospital *</Label><input type="time" value={form.timeOfCall} onChange={(e) => fset("timeOfCall", e.target.value)} style={{ ...inp(C), width: "100%" }} /></div>
          <div><Label note="defaults to today">Date of Call from Hospital</Label><input type="date" value={form.dateOfCallFromHospital} onChange={(e) => fset("dateOfCallFromHospital", e.target.value)} style={{ ...inp(C), width: "100%" }} /></div>
          <div><Label>Controller Name *</Label>
            <select value={form.controllerName} onChange={(e) => fset("controllerName", e.target.value)} style={{ ...sel(C), width: "100%" }}>
              <option value="">— Select —</option>
              {controllers.map((ctrl, i) => <option key={i}>{String(ctrl.name || ctrl)}</option>)}
            </select>
          </div>
          <div><Label>Transport Date *</Label><input type="date" value={form.transportDate} onChange={(e) => fset("transportDate", e.target.value)} style={{ ...inp(C), width: "100%" }} /></div>
          <div>
            <Label auto note="syncs to transport date">Date Call Received</Label>
            <input type="date" value={form.dateCallReceived} onChange={(e) => fset("dateCallReceived", e.target.value)} style={{ ...inp(C), width: "100%" }} />
          </div>
        </Grid>
      </Section>

      <Section title="Route">
        <Grid cols={1}>
          <LocationField label="Origin *" value={form.originHospital} onChange={(v) => fset("originHospital", v)} options={hospitals} exclude={[form.destinationHospital]} onAdd={onAddLocation} />
          <LocationField label="Destination *" value={form.destinationHospital} onChange={(v) => fset("destinationHospital", v)} options={hospitals} exclude={[form.originHospital]} onAdd={onAddLocation} />
        </Grid>
      </Section>

      <Section title="Items Transported">
        <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginBottom: 14 }}>
          {itemPicklist.map((item) => <Chip key={item} active={form.itemsTransported.includes(item)} onClick={() => ftog("itemsTransported", item)}>{form.itemsTransported.includes(item) ? "✓ " : ""}{item}</Chip>)}
        </div>
        <div style={{ position: "relative" }}>
          <Label optional note="type to search or add new">Custom Item</Label>
          <div style={{ display: "flex", gap: 6 }}>
            <input value={itemQuery} onChange={(e) => setItemQ(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addItem()} placeholder="Type item name…" style={{ ...inp(C), flex: 1, width: "auto" }} />
            <button onClick={addItem} style={{ background: C.card, border: `1px solid ${C.borderHi}`, color: C.muted, borderRadius: 6, padding: "0 14px", fontSize: 11, cursor: "pointer", fontFamily: "'IBM Plex Mono',monospace" }}>ADD</button>
          </div>
          <SuggestionDropdown items={itemSugg} onPick={(s) => { ftog("itemsTransported", s); setItemQ(""); }} right={70} />
        </div>
        {form.itemsTransported.length > 0 && <div style={{ marginTop: 10, display: "flex", flexWrap: "wrap", gap: 6 }}>{form.itemsTransported.map((i) => <span key={i} style={{ background: C.accent + "22", color: C.accentText, border: `1px solid ${C.accent}44`, borderRadius: 12, padding: "3px 10px", fontSize: 11 }}>{i} <span onClick={() => ftog("itemsTransported", i)} style={{ cursor: "pointer", marginLeft: 4, color: C.red }}>×</span></span>)}</div>}
        <div style={{ marginTop: 14 }}><Label>Number of Packages *</Label><input type="number" min="1" value={form.numPackages} onChange={(e) => fset("numPackages", e.target.value)} placeholder="0" style={{ ...inp(C), width: 120 }} /></div>
      </Section>

      <Section title="Crew & Vehicle">
        <Grid cols={1} gap={12}>
          <div><Label>Rider *</Label>
            <select value={form.riders[0] || ""} onChange={(e) => fset("riders", e.target.value ? [e.target.value] : [])} style={{ ...sel(C), width: "100%" }}>
              <option value="">— Select Rider —</option>
              {riders.map((r, i) => <option key={i}>{String(r.name || r)}</option>)}
            </select>
          </div>
          <div><Label>Rider Duty Status</Label><select value={form.riderDutyStatus} onChange={(e) => fset("riderDutyStatus", e.target.value)} style={{ ...sel(C), width: "100%" }}><option value="">— Select —</option>{dutyStatuses.map((s) => <option key={s}>{s}</option>)}</select></div>
          <div><Label>Vehicle Used</Label><select value={form.vehicleUsed} onChange={(e) => fset("vehicleUsed", e.target.value)} style={{ ...sel(C), width: "100%" }}><option value="">— Select Vehicle —</option>{vehicles.map((v) => <option key={v}>{v}</option>)}</select></div>
          <div>
            <Label>Meet with Other Group</Label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginTop: 4 }}>
              {meetups.map((g) => {
                const active = Array.isArray(form.meetOtherGroup) && form.meetOtherGroup.includes(g);
                return <Chip key={g} active={active} onClick={() => {
                  const cur = Array.isArray(form.meetOtherGroup) ? form.meetOtherGroup : [];
                  fset("meetOtherGroup", active ? cur.filter((x) => x !== g) : [...cur, g]);
                }}>{active ? "✓ " : ""}{g}</Chip>;
              })}
            </div>
            <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
              <input value={newGroup} onChange={(e) => setNewGroup(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addGroup())} placeholder="Add a new group…" style={{ ...inp(C), flex: 1, width: "auto" }} />
              <button onClick={addGroup} style={{ background: C.card, border: `1px solid ${C.borderHi}`, color: C.muted, borderRadius: 6, padding: "0 14px", fontSize: 11, cursor: "pointer", fontFamily: "'IBM Plex Mono',monospace" }}>ADD</button>
            </div>
          </div>
          <Grid cols={2}>
            <div><Label optional>Scheduled Meet-up Date</Label><input type="date" value={form.scheduledMeetupDate} onChange={(e) => fset("scheduledMeetupDate", e.target.value)} style={{ ...inp(C), width: "100%" }} /></div>
            <div><Label optional>Scheduled Meet-up Time</Label><input type="time" value={form.scheduledMeetupTime} onChange={(e) => fset("scheduledMeetupTime", e.target.value)} style={{ ...inp(C), width: "100%" }} /></div>
          </Grid>
        </Grid>
      </Section>

      <Section title="Authorisation">
        <Label>Green Lights Authorised</Label>
        <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
          {[true, false].map((val) => <button key={String(val)} onClick={() => fset("greenLights", val)} style={{ padding: "8px 24px", borderRadius: 7, border: `1px solid ${form.greenLights === val ? (val ? C.green : C.red) : C.borderHi}`, background: form.greenLights === val ? (val ? C.green + "22" : C.red + "22") : C.card, color: form.greenLights === val ? (val ? C.green : C.red) : C.muted, fontSize: 12, cursor: "pointer", fontFamily: "'IBM Plex Mono',monospace", fontWeight: 700 }}>{val ? "✓  YES" : "✕  NO"}</button>)}
        </div>
      </Section>

      <Section title="Optional Details">
        <Grid cols={1} gap={12}>
          <div><Label optional>Contact Name</Label><input value={form.contactName} onChange={(e) => fset("contactName", e.target.value)} placeholder="Name of contact" style={{ ...inp(C), width: "100%" }} /></div>
          <div><Label optional>Contact Phone Number</Label><input type="tel" value={form.contactPhone} onChange={(e) => fset("contactPhone", e.target.value)} placeholder="+353…" style={{ ...inp(C), width: "100%" }} /></div>
          <div><Label optional>Pick-up Address</Label><input value={form.pickupAddress} onChange={(e) => fset("pickupAddress", e.target.value)} placeholder="Street address / dept" style={{ ...inp(C), width: "100%" }} /></div>
          <div><Label optional>Drop-off Address</Label><input value={form.dropOffAddress} onChange={(e) => fset("dropOffAddress", e.target.value)} placeholder="Street address / dept" style={{ ...inp(C), width: "100%" }} /></div>
        </Grid>
      </Section>

      <Section title="Timing — Auto-Captured (Override Available)">
        <Grid cols={2}>
          <AutoTime label="Rider Called" value={form.riderCalled} fieldKey="riderCalled" overrides={form.overrides} onOverride={handleOverride} note="auto on New Call" />
          <AutoTime label="Pickup Time" value={form.pickupTime} fieldKey="pickupTime" overrides={form.overrides} onOverride={handleOverride} note="auto on Picked Up" />
          <AutoTime label="Meet-up Time (actual)" value={form.meetupTime} fieldKey="meetupTime" overrides={form.overrides} onOverride={handleOverride} note="auto on Dropped Off" />
          <AutoTime label="Delivery Time" value={form.deliveryTime} fieldKey="deliveryTime" overrides={form.overrides} onOverride={handleOverride} note="auto on Dropped Off" />
          <AutoTime label="Rider Home" value={form.riderHome} fieldKey="riderHome" overrides={form.overrides} onOverride={handleOverride} note="auto on Rider Home" />
        </Grid>
      </Section>

      <Section title="Other Details / Notes">
        <textarea value={form.notes} onChange={(e) => fset("notes", e.target.value)} rows={3} placeholder="Additional details, special instructions, observations…" style={{ ...inp(C), width: "100%", boxSizing: "border-box", resize: "vertical", lineHeight: 1.7 }} />
      </Section>

      <div style={{ display: "flex", gap: 10, marginBottom: 40 }}>
        <button onClick={onSubmit} style={{ flex: 1, background: C.accent, border: "none", color: "#fff", padding: "14px", borderRadius: 8, fontSize: 13, cursor: "pointer", fontFamily: "'IBM Plex Mono',monospace", fontWeight: 700, letterSpacing: 1 }}>LOG CALL & OPEN RUN</button>
        <button onClick={() => setConfirmLeave(true)} style={{ background: "none", border: `1px solid ${C.borderHi}`, color: C.muted, padding: "14px 22px", borderRadius: 8, fontSize: 12, cursor: "pointer", fontFamily: "'IBM Plex Mono',monospace" }}>CANCEL</button>
      </div>
    </div>
  );
}
