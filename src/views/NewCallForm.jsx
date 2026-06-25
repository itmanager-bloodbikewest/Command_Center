import { useState, useRef } from "react";
import { useC, isDark } from "../lib/theme.jsx";
import { Section, Grid, Label, Chip, HomeButton, inp, sel } from "../ui/primitives.jsx";
import { fmtDate, fmtTime } from "../lib/datetime.js";
import LocationField from "../components/LocationField.jsx";

const PAGES = ["Call & route", "Crew & vehicle", "Optional & notes", "Summary"];

// Step indicator + home control row shown at the top of every wizard screen.
function WizardHeader({ C, page, onHome }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, gap: 12 }}>
      <HomeButton onClick={onHome} title="Leave form" />
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontSize: 11, color: C.muted, fontFamily: "'IBM Plex Mono',monospace", letterSpacing: 2, fontWeight: 700 }}>STEP {page + 1} OF 4</span>
        <div style={{ display: "flex", gap: 6 }}>
          {[0, 1, 2, 3].map((i) => <span key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: i <= page ? C.accent : C.borderHi }} />)}
        </div>
      </div>
    </div>
  );
}

// Summary field row: shows the value (or muted "Not set") with an inline Edit
// affordance. Tapping Edit swaps in the live editor in place; Done closes it.
// Module-level so its editing state survives parent re-renders during live edits.
function SummaryRow({ C, label, required, display, editor }) {
  const [editing, setEditing] = useState(false);
  const empty = display == null || display === "";
  return (
    <div style={{ display: "flex", gap: 12, padding: "10px 0", borderBottom: `1px solid ${C.border}`, alignItems: editing ? "flex-start" : "center" }}>
      <div style={{ width: 150, flexShrink: 0, fontSize: 13, fontWeight: 700, color: C.text, fontFamily: "'Atkinson Hyperlegible','IBM Plex Sans',sans-serif", display: "flex", alignItems: "center", gap: 6, paddingTop: editing ? 7 : 0 }}>
        <span>{label}</span>
        {required && empty && <span aria-label="required" style={{ color: C.red, fontWeight: 700, fontSize: 16, lineHeight: 1 }}>*</span>}
      </div>
      {editing
        ? <div style={{ display: "flex", gap: 8, flex: 1, alignItems: "flex-start", flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: 150 }}>{editor}</div>
            <button onClick={() => setEditing(false)} style={{ background: C.green, border: "none", color: isDark(C) ? "#000" : "#fff", borderRadius: 5, padding: "7px 16px", cursor: "pointer", fontSize: 12, fontWeight: 700, fontFamily: "'Atkinson Hyperlegible','IBM Plex Sans',sans-serif" }}>Done</button>
          </div>
        : <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
            <span style={{ fontSize: 13, color: empty ? C.muted : C.text, fontStyle: empty ? "italic" : "normal", wordBreak: "break-word" }}>{empty ? "Not set" : display}</span>
            <button onClick={() => setEditing(true)} style={{ background: "none", border: `1px solid ${C.borderHi}`, color: C.muted, borderRadius: 5, padding: "3px 10px", cursor: "pointer", fontSize: 10, fontFamily: "'IBM Plex Mono',monospace", flexShrink: 0 }}>✎ edit</button>
          </div>}
    </div>
  );
}

export default function NewCallForm({
  form, fset, ftog,
  lists, onAddLocation, onAddMeetup,
  onSubmit, onCancel,
}) {
  const C = useC();
  const { controllers, riders, hospitals, vehicles, meetups, itemPicklist, dutyStatuses } = lists;
  const [newGroup, setNewGroup] = useState("");
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [page, setPage] = useState(0);
  const scrollRef = useRef(null);

  const reqFrame = { border: `2px solid ${C.accent}` };   // required -> 2px accent frame
  const autoBg = "transparent";                            // auto-captured -> neutral (AUTO chip carries meaning)
  const isOtherNotes = (item) => { const l = String(item).toLowerCase(); return l.includes("other") && l.includes("note"); };

  const go = (d) => {
    setPage((p) => Math.max(0, Math.min(3, p + d)));
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  };

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

  // --- summary helpers -------------------------------------------------------
  const rider1 = form.riders?.[0] || "";
  const rider2Options = (riders || []).map((r) => String(r.name || r)).filter((n) => n !== rider1);
  const groupArr = Array.isArray(form.meetOtherGroup) ? form.meetOtherGroup : [];
  const itemsArr = Array.isArray(form.itemsTransported) ? form.itemsTransported : [];

  // Two-way clearing, mirrored from the form pages: setting a second rider clears
  // any other-group; choosing a group clears the second rider and its meet-time.
  const setRider2 = (v) => { if (v) { fset("rider2", v); fset("meetOtherGroup", []); } else { fset("rider2", ""); fset("rider2MeetupTime", ""); } };
  const toggleGroup = (g) => {
    const next = groupArr.includes(g) ? groupArr.filter((x) => x !== g) : [...groupArr, g];
    fset("meetOtherGroup", next);
    if (next.length) { fset("rider2", ""); fset("rider2MeetupTime", ""); }
  };
  const toggleItem = (item) => { ftog("itemsTransported", item); };

  const editIn = { ...inp(C, true), width: "100%" };
  const editSel = { ...sel(C), width: "100%" };

  return (
    <div ref={scrollRef} style={{ flex: 1, overflowY: "auto", padding: 16, maxWidth: 920, margin: "0 auto", width: "100%", boxSizing: "border-box" }}>
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
        <div style={{ background: C.confirmBg, border: `1px solid ${C.red}`, borderRadius: 8, padding: "12px 16px", marginBottom: 16 }}>
          <div style={{ fontSize: 13, color: C.text, lineHeight: 1.5 }}>
            You’re leaving the form and all information will be lost.{page > 0 && page < 3 ? " To go back a step instead, tap Previous below." : ""}
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 12, justifyContent: "flex-end" }}>
            <button onClick={() => setConfirmLeave(false)} style={{ background: "none", border: `1px solid ${C.borderHi}`, color: C.muted, borderRadius: 5, padding: "6px 12px", fontSize: 11, cursor: "pointer", fontFamily: "'IBM Plex Mono',monospace" }}>STAY</button>
            <button onClick={onCancel} style={{ background: C.red, color: "#fff", border: "none", borderRadius: 5, padding: "6px 16px", fontSize: 11, cursor: "pointer", fontFamily: "'IBM Plex Mono',monospace", fontWeight: 700 }}>DISCARD</button>
          </div>
        </div>
      )}

      <WizardHeader C={C} page={page} onHome={() => setConfirmLeave(true)} />
      <div style={{ fontSize: 10, color: C.muted, fontFamily: "'IBM Plex Mono',monospace", letterSpacing: 2, marginBottom: 18 }}>
        {page === 3 ? "SUMMARY — CHECK, EDIT & LOG" : "NEW CALL — * REQUIRED FIELDS"}
      </div>

      {/* ---------------------------------------------------------------- PAGE 1 */}
      {page === 0 && (
        <>
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
              {itemPicklist.map((item) => <Chip key={item} active={itemsArr.includes(item)} onClick={() => { const wasActive = itemsArr.includes(item); ftog("itemsTransported", item); if (!wasActive && isOtherNotes(item)) openOtherNotes(); }}>{itemsArr.includes(item) ? "✓ " : ""}{item}</Chip>)}
            </div>
            <div style={{ marginTop: 14 }}><Label required filled={Number(form.numPackages) >= 1}>Number of packages</Label><input type="number" min="1" aria-label="Number of packages" value={form.numPackages} onChange={(e) => fset("numPackages", e.target.value)} placeholder="0" style={{ ...inp(C), width: 120, ...reqFrame }} /></div>
          </Section>
        </>
      )}

      {/* ---------------------------------------------------------------- PAGE 2 */}
      {page === 1 && (
        <Section title="Crew & vehicle">
          <Grid cols={1} gap={12}>
            <div><Label required filled={form.riders.length > 0}>Rider</Label>
              <select aria-label="Rider" value={form.riders[0] || ""} onChange={(e) => fset("riders", e.target.value ? [e.target.value] : [])} style={{ ...sel(C), width: "100%", ...reqFrame }}>
                <option value="">— Select Rider —</option>
                {riders.map((r, i) => <option key={i}>{String(r.name || r)}</option>)}
              </select>
            </div>
            <div><Label required filled={!!form.riderDutyStatus}>Rider duty status</Label><select aria-label="Rider duty status" value={form.riderDutyStatus} onChange={(e) => fset("riderDutyStatus", e.target.value)} style={{ ...sel(C), width: "100%", ...reqFrame }}><option value="">— Select —</option>{dutyStatuses.map((s) => <option key={s}>{s}</option>)}</select></div>
            <div><Label required filled={!!form.vehicleUsed}>Vehicle used</Label><select aria-label="Vehicle used" value={form.vehicleUsed} onChange={(e) => fset("vehicleUsed", e.target.value)} style={{ ...sel(C), width: "100%", ...reqFrame }}><option value="">— Select Vehicle —</option>{vehicles.map((v) => <option key={v}>{v}</option>)}</select></div>
            {!(Array.isArray(form.meetOtherGroup) && form.meetOtherGroup.length > 0) && (
              <div><Label optional>Second rider</Label>
                <select aria-label="Second rider" value={form.rider2 || ""} onChange={(e) => { const v = e.target.value; if (v) fset("rider2", v); else { fset("rider2", ""); fset("rider2MeetupTime", ""); } }} style={{ ...sel(C), width: "100%" }}>
                  <option value="">No Second Rider</option>
                  {riders.filter((r) => String(r.name || r) !== (form.riders[0] || "")).map((r, i) => <option key={i}>{String(r.name || r)}</option>)}
                </select>
              </div>
            )}
            {!!form.rider2 && (
              <div><Label optional>Meetup with Rider 2 — Time</Label><input type="time" aria-label="Meetup with Rider 2 time" value={form.rider2MeetupTime} onChange={(e) => fset("rider2MeetupTime", e.target.value)} style={{ ...inp(C), width: "100%" }} /></div>
            )}
            <div>
              <Label>Green lights authorised</Label>
              <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
                {[true, false].map((val) => <button key={String(val)} onClick={() => fset("greenLights", val)} style={{ padding: "8px 24px", borderRadius: 7, border: `1px solid ${form.greenLights === val ? (val ? C.green : C.red) : C.borderHi}`, background: form.greenLights === val ? (val ? C.green + "22" : C.red + "22") : C.card, color: form.greenLights === val ? (val ? C.green : C.red) : C.muted, fontSize: 12, cursor: "pointer", fontFamily: "'Atkinson Hyperlegible','IBM Plex Sans',sans-serif", fontWeight: 700 }}>{val ? "✓  YES" : "✕  NO"}</button>)}
              </div>
            </div>
            {!form.rider2 && (
            <div>
              <Label optional>Meet with other group</Label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 7, marginTop: 4 }}>
                {[...meetups].sort((a, b) => String(a).localeCompare(String(b))).map((g) => {
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
            )}
            {Array.isArray(form.meetOtherGroup) && form.meetOtherGroup.length > 0 && (
              <Grid cols={2}>
                <div><Label optional>Scheduled meet-up date</Label><input type="date" aria-label="Scheduled meet-up date" value={form.scheduledMeetupDate} onChange={(e) => fset("scheduledMeetupDate", e.target.value)} style={{ ...inp(C), width: "100%" }} /></div>
                <div><Label optional>Scheduled meet-up time</Label><input type="time" aria-label="Scheduled meet-up time" value={form.scheduledMeetupTime} onChange={(e) => fset("scheduledMeetupTime", e.target.value)} style={{ ...inp(C), width: "100%" }} /></div>
              </Grid>
            )}
          </Grid>
        </Section>
      )}

      {/* ---------------------------------------------------------------- PAGE 3 */}
      {page === 2 && (
        <>
          <Section title="Optional details">
            <Grid cols={1} gap={12}>
              <div><Label optional>Contact name</Label><input aria-label="Contact name" value={form.contactName} onChange={(e) => fset("contactName", e.target.value)} placeholder="Name of contact" style={{ ...inp(C), width: "100%" }} /></div>
              <div><Label optional>Contact phone number</Label><input type="tel" aria-label="Contact phone number" value={form.contactPhone} onChange={(e) => fset("contactPhone", e.target.value)} placeholder="+353…" style={{ ...inp(C), width: "100%" }} /></div>
              <div><Label optional>Pick-up address</Label><input aria-label="Pick-up address" value={form.pickupAddress} onChange={(e) => fset("pickupAddress", e.target.value)} placeholder="Street address / dept" style={{ ...inp(C), width: "100%" }} /></div>
              <div><Label optional>Drop-off address</Label><input aria-label="Drop-off address" value={form.dropOffAddress} onChange={(e) => fset("dropOffAddress", e.target.value)} placeholder="Street address / dept" style={{ ...inp(C), width: "100%" }} /></div>
            </Grid>
          </Section>

          <Section title="Other details / notes">
            <textarea aria-label="Notes" value={form.notes} onChange={(e) => fset("notes", e.target.value)} rows={3} placeholder="Additional details, special instructions, observations…" style={{ ...inp(C), width: "100%", boxSizing: "border-box", resize: "vertical", lineHeight: 1.7 }} />
          </Section>
        </>
      )}

      {/* ---------------------------------------------------------------- SUMMARY */}
      {page === 3 && (
        <>
          <Section title="Call date and time">
            <SummaryRow C={C} label="Time of call" required display={form.timeOfCall ? fmtTime(form.timeOfCall) : ""}
              editor={<input type="time" aria-label="Time of call" value={form.timeOfCall} onChange={(e) => fset("timeOfCall", e.target.value)} style={editIn} />} />
            <SummaryRow C={C} label="Date of call" display={form.dateOfCallFromHospital ? fmtDate(form.dateOfCallFromHospital) : ""}
              editor={<input type="date" aria-label="Date of call" value={form.dateOfCallFromHospital} onChange={(e) => fset("dateOfCallFromHospital", e.target.value)} style={editIn} />} />
            <SummaryRow C={C} label="Transport date" required display={form.transportDate ? fmtDate(form.transportDate) : ""}
              editor={<input type="date" aria-label="Transport date" value={form.transportDate} onChange={(e) => fset("transportDate", e.target.value)} style={editIn} />} />
          </Section>

          <Section title="Route">
            <SummaryRow C={C} label="Origin" required display={form.originHospital}
              editor={<select aria-label="Origin" value={form.originHospital || ""} onChange={(e) => fset("originHospital", e.target.value)} style={editSel}><option value="">— Select —</option>{hospitals.filter((h) => h !== form.destinationHospital).map((h) => <option key={h}>{h}</option>)}</select>} />
            <SummaryRow C={C} label="Destination" required display={form.destinationHospital}
              editor={<select aria-label="Destination" value={form.destinationHospital || ""} onChange={(e) => fset("destinationHospital", e.target.value)} style={editSel}><option value="">— Select —</option>{hospitals.filter((h) => h !== form.originHospital).map((h) => <option key={h}>{h}</option>)}</select>} />
          </Section>

          <Section title="Items transported">
            <SummaryRow C={C} label="Items" display={itemsArr.join(", ")}
              editor={<div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>{itemPicklist.map((item) => <Chip key={item} active={itemsArr.includes(item)} onClick={() => toggleItem(item)}>{itemsArr.includes(item) ? "✓ " : ""}{item}</Chip>)}</div>} />
            <SummaryRow C={C} label="No. of packages" required display={Number(form.numPackages) >= 1 ? String(form.numPackages) : ""}
              editor={<input type="number" min="1" aria-label="Number of packages" value={form.numPackages} onChange={(e) => fset("numPackages", e.target.value)} style={editIn} />} />
          </Section>

          <Section title="Crew & vehicle">
            <SummaryRow C={C} label="Rider" required display={rider1}
              editor={<select aria-label="Rider" value={rider1} onChange={(e) => fset("riders", e.target.value ? [e.target.value] : [])} style={editSel}><option value="">— Select Rider —</option>{riders.map((r, i) => <option key={i}>{String(r.name || r)}</option>)}</select>} />
            <SummaryRow C={C} label="Rider duty status" display={form.riderDutyStatus}
              editor={<select aria-label="Rider duty status" value={form.riderDutyStatus || ""} onChange={(e) => fset("riderDutyStatus", e.target.value)} style={editSel}><option value="">— Select —</option>{dutyStatuses.map((s) => <option key={s}>{s}</option>)}</select>} />
            <SummaryRow C={C} label="Vehicle used" display={form.vehicleUsed}
              editor={<select aria-label="Vehicle used" value={form.vehicleUsed || ""} onChange={(e) => fset("vehicleUsed", e.target.value)} style={editSel}><option value="">— Select Vehicle —</option>{vehicles.map((v) => <option key={v}>{v}</option>)}</select>} />
            <SummaryRow C={C} label="Second rider" display={form.rider2}
              editor={<select aria-label="Second rider" value={form.rider2 || ""} onChange={(e) => setRider2(e.target.value)} style={editSel}><option value="">No Second Rider</option>{rider2Options.map((n, i) => <option key={i}>{n}</option>)}</select>} />
            <SummaryRow C={C} label="Rider 2 meet-up time" display={form.rider2MeetupTime ? fmtTime(form.rider2MeetupTime) : ""}
              editor={<input type="time" aria-label="Rider 2 meet-up time" value={form.rider2MeetupTime} onChange={(e) => fset("rider2MeetupTime", e.target.value)} style={editIn} />} />
            <SummaryRow C={C} label="Green lights" display={form.greenLights === true ? "Yes" : form.greenLights === false ? "No" : ""}
              editor={<div style={{ display: "flex", gap: 8 }}>{[true, false].map((val) => <button key={String(val)} onClick={() => fset("greenLights", val)} style={{ padding: "6px 18px", borderRadius: 6, border: `1px solid ${form.greenLights === val ? (val ? C.green : C.red) : C.borderHi}`, background: form.greenLights === val ? (val ? C.green + "22" : C.red + "22") : C.card, color: form.greenLights === val ? (val ? C.green : C.red) : C.muted, fontSize: 12, cursor: "pointer", fontFamily: "'Atkinson Hyperlegible','IBM Plex Sans',sans-serif", fontWeight: 700 }}>{val ? "✓ YES" : "✕ NO"}</button>)}</div>} />
            <SummaryRow C={C} label="Meet other group" display={groupArr.join(", ")}
              editor={<div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 7 }}>{[...meetups].sort((a, b) => String(a).localeCompare(String(b))).map((g) => <Chip key={g} active={groupArr.includes(g)} onClick={() => toggleGroup(g)}>{groupArr.includes(g) ? "✓ " : ""}{g}</Chip>)}</div>} />
            <SummaryRow C={C} label="Meet-up date" display={form.scheduledMeetupDate ? fmtDate(form.scheduledMeetupDate) : ""}
              editor={<input type="date" aria-label="Scheduled meet-up date" value={form.scheduledMeetupDate} onChange={(e) => fset("scheduledMeetupDate", e.target.value)} style={editIn} />} />
            <SummaryRow C={C} label="Meet-up time" display={form.scheduledMeetupTime ? fmtTime(form.scheduledMeetupTime) : ""}
              editor={<input type="time" aria-label="Scheduled meet-up time" value={form.scheduledMeetupTime} onChange={(e) => fset("scheduledMeetupTime", e.target.value)} style={editIn} />} />
          </Section>

          <Section title="Optional details">
            <SummaryRow C={C} label="Contact name" display={form.contactName}
              editor={<input aria-label="Contact name" value={form.contactName} onChange={(e) => fset("contactName", e.target.value)} style={editIn} />} />
            <SummaryRow C={C} label="Contact phone" display={form.contactPhone}
              editor={<input type="tel" aria-label="Contact phone" value={form.contactPhone} onChange={(e) => fset("contactPhone", e.target.value)} style={editIn} />} />
            <SummaryRow C={C} label="Pick-up address" display={form.pickupAddress}
              editor={<input aria-label="Pick-up address" value={form.pickupAddress} onChange={(e) => fset("pickupAddress", e.target.value)} style={editIn} />} />
            <SummaryRow C={C} label="Drop-off address" display={form.dropOffAddress}
              editor={<input aria-label="Drop-off address" value={form.dropOffAddress} onChange={(e) => fset("dropOffAddress", e.target.value)} style={editIn} />} />
          </Section>

          <Section title="Other details / notes">
            <SummaryRow C={C} label="Notes" display={form.notes}
              editor={<textarea aria-label="Notes" value={form.notes} onChange={(e) => fset("notes", e.target.value)} rows={4} style={{ ...editIn, boxSizing: "border-box", resize: "vertical", lineHeight: 1.7 }} />} />
          </Section>
        </>
      )}

      {/* ---------------------------------------------------------------- NAV */}
      <div style={{ display: "flex", gap: 10, marginTop: 4, marginBottom: 40 }}>
        {page > 0 && (
          <button onClick={() => go(-1)} style={{ background: "none", border: `1px solid ${C.borderHi}`, color: C.muted, padding: "14px 22px", borderRadius: 8, fontSize: 12, cursor: "pointer", fontFamily: "'IBM Plex Mono',monospace", letterSpacing: 1 }}>PREVIOUS</button>
        )}
        {page < 3 && (
          <button onClick={() => go(1)} style={{ flex: 1, background: C.accent, border: "none", color: "#fff", padding: "14px", borderRadius: 8, fontSize: 13, cursor: "pointer", fontFamily: "'IBM Plex Mono',monospace", fontWeight: 700, letterSpacing: 1 }}>CONTINUE</button>
        )}
        {page === 3 && (
          <button onClick={onSubmit} style={{ flex: 1, background: C.accent, border: "none", color: "#fff", padding: "14px", borderRadius: 8, fontSize: 13, cursor: "pointer", fontFamily: "'IBM Plex Mono',monospace", fontWeight: 700, letterSpacing: 1 }}>LOG CALL &amp; OPEN RUN</button>
        )}
      </div>
    </div>
  );
}
