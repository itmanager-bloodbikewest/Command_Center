import { useState } from "react";
import { useC, isDark } from "../lib/theme.jsx";
import { Section, Grid, Label, Chip, inp, sel } from "../ui/primitives.jsx";
import LocationField from "../components/LocationField.jsx";
import AutoTime from "../components/AutoTime.jsx";

export default function NewCallForm({
  form, fset, ftog, handleOverride,
  lists, onAddLocation, onAddMeetup,
  onSubmit, onCancel,
}) {
  const C = useC();
  const { controllers, riders, hospitals, vehicles, meetups, itemPicklist, dutyStatuses } = lists;
  const [newGroup, setNewGroup] = useState("");
  const [confirmLeave, setConfirmLeave] = useState(false);

  const reqFrame = { border: `2px solid ${C.accent}` };   // required -> 2px accent frame
  const autoBg = "transparent";                            // auto-captured -> neutral (AUTO chip carries meaning)
  const reqBg = "transparent";                             // (kept name; required now uses the frame, not a fill)
  const isOtherNotes = (item) => { const l = String(item).toLowerCase(); return l.includes("other") && l.includes("note"); };

  // "Other (Add to Notes)" notes popup (replaces former scroll-to-focus behaviour)
  const [notesModalOpen, setNotesModalOpen] = useState(false);
  const [notesDraft, setNotesDraft] = useState("");
  const [otherNoteSaved, setOtherNoteSaved] = useState(false);
  const openOtherNotes = () => { setNotesDraft(otherNoteSaved ? (form.notes || "") : ""); setNotesModalOpen(true); };
  const saveOtherNotes = () => {
    if (!otherNoteSaved) {
      const t = notesDraft.trim();
      if (t) {
        const newNotes = (form.notes ? form.notes + "\n" : "") + "Other item: " + t;
        fset("notes", newNotes);
        setOtherNoteSaved(true);
      }
    } else {
      fset("notes", notesDraft);
    }
    setNotesModalOpen(false);
  };
  const cancelOtherNotes = () => setNotesModalOpen(false); // leaves "Other" selected, no change

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
      {notesModalOpen && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 16 }}>
          <div style={{ background: C.card, border: `1px solid ${C.borderHi}`, borderRadius: 10, padding: 20, width: "100%", maxWidth: 520, boxSizing: "border-box" }}>
            <div style={{ fontSize: 10, letterSpacing: 3, color: C.muted, fontFamily: "'IBM Plex Mono',monospace", marginBottom: 12 }}>{otherNoteSaved ? "EDIT NOTES" : "OTHER ITEM — ADD TO NOTES"}</div>
            <textarea aria-label="Other item notes" value={notesDraft} onChange={(e) => setNotesDraft(e.target.value)} rows={otherNoteSaved ? 8 : 4} autoFocus placeholder={otherNoteSaved ? "Edit notes…" : "Describe the other item…"} style={{ ...inp(C), width: "100%", boxSizing: "border-box", resize: "vertical", lineHeight: 1.7 }} />
            <div style={{ display: "flex", gap: 8, marginTop: 14, justifyContent: "flex-end" }}>
              <button onClick={cancelOtherNotes} style={{ background: "none", border: `1px solid ${C.borderHi}`, color: C.muted, borderRadius: 6, padding: "8px 16px", fontSize: 11, cursor: "pointer", fontFamily: "'IBM Plex Mono',monospace" }}>CANCEL</button>
              <button onClick={saveOtherNotes} style={{ background: C.accent, border: "none", color: "#fff", borderRadius: 6, padding: "8px 18px", fontSize: 11, cursor: "pointer", fontFamily: "'IBM Plex Mono',monospace", fontWeight: 700 }}>SAVE AND CLOSE</button>
            </div>
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

      <Section title="Call date and time">
        <Grid cols={2}>
          <div><Label required filled={!!form.timeOfCall}>Time of call from hospital</Label><input type="time" aria-label="Time of call from hospital" value={form.timeOfCall} onChange={(e) => fset("timeOfCall", e.target.value)} style={{ ...inp(C), width: "100%", ...reqFrame }} /></div>
          <div><Label auto>Date of call from hospital</Label><input type="date" aria-label="Date of Call from Hospital (auto)" value={form.dateOfCallFromHospital} onChange={(e) => fset("dateOfCallFromHospital", e.target.value)} style={{ ...inp(C), width: "100%", background: autoBg }} /></div>
          <div><Label required filled={!!form.transportDate}>Transport date</Label><input type="date" aria-label="Transport date" value={form.transportDate} onChange={(e) => fset("transportDate", e.target.value)} style={{ ...inp(C), width: "100%", ...reqFrame }} /></div>
        </Grid>
      </Section>

      <Section title="Route">
        <Grid cols={1}>
          <LocationField label="Origin" required filled={!!form.originHospital} value={form.originHospital} onChange={(v) => fset("originHospital", v)} options={hospitals} exclude={[form.destinationHospital]} onAdd={onAddLocation} />
          <LocationField label="Destination" required filled={!!form.destinationHospital} value={form.destinationHospital} onChange={(v) => fset("destinationHospital", v)} options={hospitals} exclude={[form.originHospital]} onAdd={onAddLocation} />
        </Grid>
      </Section>

      <Section title="Items transported">
        <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginBottom: 14 }}>
          {itemPicklist.map((item) => <Chip key={item} active={form.itemsTransported.includes(item)} onClick={() => { const wasActive = form.itemsTransported.includes(item); ftog("itemsTransported", item); if (!wasActive && isOtherNotes(item)) openOtherNotes(); }}>{form.itemsTransported.includes(item) ? "✓ " : ""}{item}</Chip>)}
        </div>
        {(() => { const shown = form.itemsTransported.filter((i) => !isOtherNotes(i)); return shown.length > 0 && <div style={{ marginTop: 10, display: "flex", flexWrap: "wrap", gap: 6 }}>{shown.map((i) => <span key={i} style={{ background: C.accent + "22", color: C.accentText, border: `1px solid ${C.accent}44`, borderRadius: 12, padding: "3px 10px", fontSize: 11 }}>{i} <span onClick={() => ftog("itemsTransported", i)} style={{ cursor: "pointer", marginLeft: 4, color: C.red }}>×</span></span>)}</div>; })()}
        <div style={{ marginTop: 14 }}><Label required filled={Number(form.numPackages) >= 1}>Number of packages</Label><input type="number" min="1" aria-label="Number of packages" value={form.numPackages} onChange={(e) => fset("numPackages", e.target.value)} placeholder="0" style={{ ...inp(C), width: 120, ...reqFrame }} /></div>
      </Section>

      <Section title="Crew & vehicle">
        <Grid cols={1} gap={12}>
          <div><Label required filled={form.riders.length > 0}>Rider</Label>
            <select aria-label="Rider" value={form.riders[0] || ""} onChange={(e) => fset("riders", e.target.value ? [e.target.value] : [])} style={{ ...sel(C), width: "100%", ...reqFrame }}>
              <option value="">— Select Rider —</option>
              {riders.map((r, i) => <option key={i}>{String(r.name || r)}</option>)}
            </select>
          </div>
          <div><Label>Rider duty status</Label><select aria-label="Rider duty status" value={form.riderDutyStatus} onChange={(e) => fset("riderDutyStatus", e.target.value)} style={{ ...sel(C), width: "100%" }}><option value="">— Select —</option>{dutyStatuses.map((s) => <option key={s}>{s}</option>)}</select></div>
          <div><Label>Vehicle used</Label><select aria-label="Vehicle used" value={form.vehicleUsed} onChange={(e) => fset("vehicleUsed", e.target.value)} style={{ ...sel(C), width: "100%" }}><option value="">— Select Vehicle —</option>{vehicles.map((v) => <option key={v}>{v}</option>)}</select></div>
          <div>
            <Label optional>Meet with other group</Label>
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
              <input aria-label="Add a new group" value={newGroup} onChange={(e) => setNewGroup(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addGroup())} placeholder="Add a new group…" style={{ ...inp(C), flex: 1, width: "auto" }} />
              <button onClick={addGroup} style={{ background: C.card, border: `1px solid ${C.borderHi}`, color: C.muted, borderRadius: 6, padding: "0 14px", fontSize: 11, cursor: "pointer", fontFamily: "'IBM Plex Mono',monospace" }}>ADD</button>
            </div>
          </div>
          <Grid cols={2}>
            <div><Label optional>Scheduled meet-up date</Label><input type="date" aria-label="Scheduled meet-up date" value={form.scheduledMeetupDate} onChange={(e) => fset("scheduledMeetupDate", e.target.value)} style={{ ...inp(C), width: "100%" }} /></div>
            <div><Label optional>Scheduled meet-up time</Label><input type="time" aria-label="Scheduled meet-up time" value={form.scheduledMeetupTime} onChange={(e) => fset("scheduledMeetupTime", e.target.value)} style={{ ...inp(C), width: "100%" }} /></div>
          </Grid>
        </Grid>
      </Section>

      <Section title="Authorisation">
        <Label>Green lights authorised</Label>
        <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
          {[true, false].map((val) => <button key={String(val)} onClick={() => fset("greenLights", val)} style={{ padding: "8px 24px", borderRadius: 7, border: `1px solid ${form.greenLights === val ? (val ? C.green : C.red) : C.borderHi}`, background: form.greenLights === val ? (val ? C.green + "22" : C.red + "22") : C.card, color: form.greenLights === val ? (val ? C.green : C.red) : C.muted, fontSize: 12, cursor: "pointer", fontFamily: "'IBM Plex Mono',monospace", fontWeight: 700 }}>{val ? "✓  YES" : "✕  NO"}</button>)}
        </div>
      </Section>

      <Section title="Optional details">
        <Grid cols={1} gap={12}>
          <div><Label optional>Contact name</Label><input aria-label="Contact name" value={form.contactName} onChange={(e) => fset("contactName", e.target.value)} placeholder="Name of contact" style={{ ...inp(C), width: "100%" }} /></div>
          <div><Label optional>Contact phone number</Label><input type="tel" aria-label="Contact phone number" value={form.contactPhone} onChange={(e) => fset("contactPhone", e.target.value)} placeholder="+353…" style={{ ...inp(C), width: "100%" }} /></div>
          <div><Label optional>Pick-up address</Label><input aria-label="Pick-up address" value={form.pickupAddress} onChange={(e) => fset("pickupAddress", e.target.value)} placeholder="Street address / dept" style={{ ...inp(C), width: "100%" }} /></div>
          <div><Label optional>Drop-off address</Label><input aria-label="Drop-off address" value={form.dropOffAddress} onChange={(e) => fset("dropOffAddress", e.target.value)} placeholder="Street address / dept" style={{ ...inp(C), width: "100%" }} /></div>
        </Grid>
      </Section>

      <Section title="Automated timestamps — edit only if required">
        <Grid cols={2}>
          <AutoTime label="Rider called" value={form.riderCalled} fieldKey="riderCalled" overrides={form.overrides} onOverride={handleOverride} note="auto on New Call" />
          <AutoTime label="Pickup time" value={form.pickupTime} fieldKey="pickupTime" overrides={form.overrides} onOverride={handleOverride} note="auto on Picked Up" />
          <AutoTime label="Meet-up Time (actual)" value={form.meetupTime} fieldKey="meetupTime" overrides={form.overrides} onOverride={handleOverride} note="auto on Dropped Off" />
          <AutoTime label="Delivery time" value={form.deliveryTime} fieldKey="deliveryTime" overrides={form.overrides} onOverride={handleOverride} note="auto on Dropped Off" />
          <AutoTime label="Rider home" value={form.riderHome} fieldKey="riderHome" overrides={form.overrides} onOverride={handleOverride} note="auto on Rider Home" />
        </Grid>
      </Section>

      <Section title="Other details / notes">
        <textarea aria-label="Notes" value={form.notes} onChange={(e) => fset("notes", e.target.value)} rows={3} placeholder="Additional details, special instructions, observations…" style={{ ...inp(C), width: "100%", boxSizing: "border-box", resize: "vertical", lineHeight: 1.7 }} />
      </Section>

      <div style={{ display: "flex", gap: 10, marginBottom: 40 }}>
        <button onClick={onSubmit} style={{ flex: 1, background: C.accent, border: "none", color: "#fff", padding: "14px", borderRadius: 8, fontSize: 13, cursor: "pointer", fontFamily: "'IBM Plex Mono',monospace", fontWeight: 700, letterSpacing: 1 }}>LOG CALL & OPEN RUN</button>
        <button onClick={() => setConfirmLeave(true)} style={{ background: "none", border: `1px solid ${C.borderHi}`, color: C.muted, padding: "14px 22px", borderRadius: 8, fontSize: 12, cursor: "pointer", fontFamily: "'IBM Plex Mono',monospace" }}>CANCEL</button>
      </div>
    </div>
  );
}
