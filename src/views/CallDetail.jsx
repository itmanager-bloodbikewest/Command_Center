import { useState, useEffect, Children, cloneElement, isValidElement } from "react";
import { useC, isDark } from "../lib/theme.jsx";
import { Section, Badge, Chip, HomeButton, inp, sel } from "../ui/primitives.jsx";
import { fmtDate, fmtTime, fmtDT, nowDT } from "../lib/datetime.js";
import { api } from "../lib/api.js";
import NotesList from "../components/NotesList.jsx";

// Lets a controller append a timestamped note to an active run.
function ControllerNoteBox({ sc, patchField, notify }) {
  const C = useC();
  const [note, setNote] = useState("");
  const [saved, setSaved] = useState(false);
  const save = () => {
    const t = note.trim();
    if (!t) return;
    const updated = (sc.notes ? sc.notes + "\n\n" : "") + `[Controller ${nowDT()}]: ` + t;
    patchField(sc.id, "notes", updated);
    setNote(""); setSaved(true); setTimeout(() => setSaved(false), 2000);
    notify("Note added", C.accent);
  };
  return (
    <div style={{ marginTop: 12 }}>
      <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} placeholder="Add a note to this run…"
        style={{ ...inp(C), width: "100%", boxSizing: "border-box", resize: "vertical", lineHeight: 1.6 }} />
      <div style={{ display: "flex", gap: 8, marginTop: 8, alignItems: "center" }}>
        <button onClick={save} style={{ background: C.accent, border: "none", color: "#fff", padding: "8px 18px", borderRadius: 6, fontSize: 11, cursor: "pointer", fontFamily: "'IBM Plex Mono',monospace", fontWeight: 700 }}>ADD NOTE</button>
        {saved && <span style={{ fontSize: 11, color: C.green, fontFamily: "'IBM Plex Mono',monospace" }}>✓ Added</span>}
      </div>
    </div>
  );
}

// Editable / read-only metadata row.
function EditRow({ label, fieldKey, type = "text", children, readOnly: ro = false, fmt, options, multi, bool, arrayWrap, onChanged, sc, patchField, notify, isCompleted, editing: extEditing }) {
  const C = useC();
  const controlled = extEditing !== undefined;
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(sc[fieldKey] || "");
  useEffect(() => setVal(sc[fieldKey] || ""), [sc[fieldKey]]);
  const save = () => { patchField(sc.id, fieldKey, val); setEditing(false); notify("Saved", C.accent); };
  const liveSet = (v) => { setVal(v); patchField(sc.id, fieldKey, v); onChanged && onChanged(v); };
  const liveSetWrapped = (v) => { setVal(v); patchField(sc.id, fieldKey, v ? [v] : []); onChanged && onChanged(v); };

  const arr = Array.isArray(sc[fieldKey]) ? sc[fieldKey] : (sc[fieldKey] ? [sc[fieldKey]] : []);
  const toggleMulti = (item) => { const next = arr.includes(item) ? arr.filter((x) => x !== item) : [...arr, item]; patchField(sc.id, fieldKey, next); onChanged && onChanged(next); };
  const multiDisplay = arr.length ? arr.join(", ") : "—";
  const wrappedVal = arrayWrap ? (Array.isArray(sc[fieldKey]) ? sc[fieldKey][0] || "" : sc[fieldKey] || "") : val;
  const boolDisplay = <span style={{ color: sc[fieldKey] === true ? C.green : sc[fieldKey] === false ? C.red : C.muted }}>{sc[fieldKey] === true ? "✓ YES" : sc[fieldKey] === false ? "✕ NO" : "—"}</span>;

  if (children || ro)
    return (
      <div style={{ display: "flex", gap: 12, padding: "9px 0", borderBottom: `1px solid ${C.border}`, alignItems: "center" }}>
        <div style={{ width: 150, fontSize: 13, fontWeight: 700, color: C.text, fontFamily: "'Atkinson Hyperlegible','IBM Plex Sans',sans-serif", flexShrink: 0 }}>{label}</div>
        <div style={{ fontSize: 13, color: C.text, flex: 1 }}>{children || (fmt ? fmt(sc[fieldKey]) : sc[fieldKey]) || "—"}</div>
      </div>
    );

  if (controlled)
    return (
      <div style={{ display: "flex", gap: 12, padding: "9px 0", borderBottom: `1px solid ${C.border}`, alignItems: multi ? "flex-start" : "center" }}>
        <div style={{ width: 150, fontSize: 13, fontWeight: 700, color: C.text, fontFamily: "'Atkinson Hyperlegible','IBM Plex Sans',sans-serif", flexShrink: 0, paddingTop: multi && extEditing ? 4 : 0 }}>{label}</div>
        {extEditing
          ? (bool
              ? <div style={{ display: "flex", gap: 8 }}>{[true, false].map((b) => <button key={String(b)} onClick={() => liveSet(b)} style={{ padding: "6px 16px", borderRadius: 6, border: `1px solid ${sc[fieldKey] === b ? (b ? C.green : C.red) : C.borderHi}`, background: sc[fieldKey] === b ? (b ? C.green + "22" : C.red + "22") : C.card, color: sc[fieldKey] === b ? (b ? C.green : C.red) : C.muted, fontSize: 12, cursor: "pointer", fontFamily: "'Atkinson Hyperlegible','IBM Plex Sans',sans-serif", fontWeight: 700 }}>{b ? "✓ YES" : "✕ NO"}</button>)}</div>
              : multi
                ? <div style={{ display: "flex", flexWrap: "wrap", gap: 6, flex: 1 }}>{(options || []).map((o) => <Chip key={o} active={arr.includes(o)} onClick={() => toggleMulti(o)}>{arr.includes(o) ? "✓ " : ""}{o}</Chip>)}</div>
                : options
                  ? <select aria-label={label} value={arrayWrap ? wrappedVal : val} onChange={(e) => (arrayWrap ? liveSetWrapped : liveSet)(e.target.value)} style={{ ...sel(C), flex: 1, width: "auto" }}><option value="">— Select —</option>{options.map((o) => <option key={o}>{o}</option>)}</select>
                  : <input aria-label={label} type={type} value={type === "date" ? fmtDate(val) : type === "time" ? fmtTime(val) : val} onChange={(e) => liveSet(e.target.value)} style={{ ...inp(C, true), flex: 1, width: "auto" }} />)
          : <span style={{ flex: 1, fontSize: 13, color: (bool || multi || val || wrappedVal) ? C.text : C.muted }}>{bool ? boolDisplay : multi ? multiDisplay : arrayWrap ? (wrappedVal || "—") : (fmt ? fmt(val) : val || "—")}</span>}
      </div>
    );

  return (
    <div style={{ display: "flex", gap: 12, padding: "9px 0", borderBottom: `1px solid ${C.border}`, alignItems: "center" }}>
      <div style={{ width: 150, fontSize: 13, fontWeight: 700, color: C.text, fontFamily: "'Atkinson Hyperlegible','IBM Plex Sans',sans-serif", flexShrink: 0 }}>{label}</div>
      {editing
        ? <div style={{ display: "flex", gap: 6, flex: 1 }}>{options
            ? <select aria-label={label} value={val} onChange={(e) => setVal(e.target.value)} autoFocus style={{ ...sel(C), flex: 1, width: "auto" }}><option value="">— Select —</option>{options.map((o) => <option key={o}>{o}</option>)}</select>
            : <input aria-label={label} type={type} value={type === "date" ? fmtDate(val) : type === "time" ? fmtTime(val) : val} onChange={(e) => setVal(e.target.value)} autoFocus style={{ ...inp(C, true), flex: 1, width: "auto" }} onKeyDown={(e) => { if (e.key === "Enter") save(); if (e.key === "Escape") setEditing(false); }} />}<button onClick={save} style={{ background: C.green, color: isDark(C) ? "#000" : "#fff", border: "none", borderRadius: 5, padding: "0 12px", cursor: "pointer", fontSize: 11, fontFamily: "'IBM Plex Mono',monospace" }}>SAVE</button><button aria-label="Cancel edit" onClick={() => setEditing(false)} style={{ background: "none", border: `1px solid ${C.borderHi}`, color: C.muted, borderRadius: 5, padding: "0 10px", cursor: "pointer", fontSize: 11 }}>✕</button></div>
        : <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "space-between" }}><span style={{ fontSize: 13, color: val ? C.text : C.muted }}>{fmt ? fmt(val) : val || "—"}</span>{!isCompleted && <button onClick={() => setEditing(true)} style={{ background: "none", border: `1px solid ${C.borderHi}`, color: C.muted, borderRadius: 5, padding: "3px 10px", cursor: "pointer", fontSize: 10, fontFamily: "'IBM Plex Mono',monospace" }}>✎ edit</button>}</div>}
    </div>
  );
}

// Timing value row — shows recorded time or "pending…"
function TimingRow({ label, fieldKey, sc, allCalls, patchField, notify, editing }) {
  const C = useC();
  const val = allCalls.find((x) => x.id === sc.id)?.[fieldKey] || "";
  return (
    <div style={{ display: "flex", gap: 12, padding: "9px 0", borderBottom: `1px solid ${C.border}`, alignItems: "center" }}>
      <div style={{ width: 150, fontSize: 13, fontWeight: 700, color: C.text, fontFamily: "'Atkinson Hyperlegible','IBM Plex Sans',sans-serif", flexShrink: 0 }}>{label}</div>
      {editing
        ? <input aria-label={label} type="time" value={val ? fmtTime(val) : ""} onChange={(e) => patchField(sc.id, fieldKey, e.target.value)} style={{ ...inp(C, true), width: 140 }} />
        : <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1 }}><span style={{ fontSize: 14, fontWeight: 600, fontFamily: "'IBM Plex Mono',monospace", color: val ? C.text : C.borderHi }}>{val ? fmtTime(val) : "pending…"}</span>{val && <span style={{ fontSize: 9, color: C.green, background: C.green + "22", padding: "1px 6px", borderRadius: 8 }}>Recorded</span>}</div>}
    </div>
  );
}

// Collapsible card with Edit/Done toggle.
function CollapsibleSection({ title, children, locked }) {
  const C = useC();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const kids = Children.map(children, (ch) => isValidElement(ch) ? cloneElement(ch, { editing }) : ch);
  return (
    <div style={{ background: C.sectionBg, border: `1px solid ${C.borderHi}`, borderRadius: 10, padding: "18px 20px", marginBottom: 16 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: open ? 14 : 0, gap: 8 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: C.text, fontFamily: "'Atkinson Hyperlegible','IBM Plex Sans',sans-serif" }}>{title}</div>
        <div style={{ display: "flex", gap: 8 }}>
          {open && !locked && <button onClick={() => setEditing((e) => !e)} style={{ background: editing ? C.green : "none", border: `1px solid ${editing ? C.green : C.borderHi}`, color: editing ? (isDark(C) ? "#000" : "#fff") : C.text, borderRadius: 5, padding: "4px 14px", cursor: "pointer", fontSize: 12, fontWeight: 700, fontFamily: "'Atkinson Hyperlegible','IBM Plex Sans',sans-serif" }}>{editing ? "Done" : "Edit"}</button>}
          <button onClick={() => setOpen((o) => { if (o) setEditing(false); return !o; })} style={{ background: "none", border: `1px solid ${C.borderHi}`, color: C.muted, borderRadius: 5, padding: "4px 12px", cursor: "pointer", fontSize: 10, fontFamily: "'IBM Plex Mono',monospace", letterSpacing: 1 }}>{open ? "Hide" : "View or edit"}</button>
        </div>
      </div>
      {open && kids}
    </div>
  );
}

// =============================================================================
// LOCATION LOG — vehicle GPS coords captured at milestones + live tracker button
// =============================================================================
function LocationRow({ label, lat, lng }) {
  const C = useC();
  if (!lat || !lng) return null;
  const url = `https://maps.google.com/?q=${lat},${lng}`;
  return (
    <div style={{ display: "flex", gap: 12, padding: "9px 0", borderBottom: `1px solid ${C.border}`, alignItems: "center" }}>
      <div style={{ width: 150, fontSize: 13, fontWeight: 700, color: C.text, fontFamily: "'Atkinson Hyperlegible','IBM Plex Sans',sans-serif", flexShrink: 0 }}>{label}</div>
      <a href={url} target="_blank" rel="noopener noreferrer"
        style={{ display: "inline-flex", alignItems: "center", gap: 6, background: C.accent, color: "#fff", border: "none", borderRadius: 7, padding: "7px 14px", fontSize: 12, cursor: "pointer", fontFamily: "'IBM Plex Mono',monospace", fontWeight: 700, letterSpacing: 1, textDecoration: "none" }}>
        📍 View on map
      </a>
    </div>
  );
}

function LiveLocationRow({ sc, notify }) {
  const C = useC();
  const [loading, setLoading] = useState(false);
  const open = async () => {
    setLoading(true);
    try {
      const res = await api("getVehicleLocation", { reg: sc.vehicleReg });
      if (res.error) { notify("Location unavailable: " + res.error, C.red); }
      else if (res.lat && res.lng) { window.open(`https://maps.google.com/?q=${res.lat},${res.lng}`, "_blank"); }
      else { notify("No position data returned for this vehicle", C.orange); }
    } catch { notify("Location fetch failed", C.red); }
    setLoading(false);
  };
  return (
    <div style={{ display: "flex", gap: 12, padding: "9px 0", borderBottom: `1px solid ${C.border}`, alignItems: "center" }}>
      <div style={{ width: 150, fontSize: 13, fontWeight: 700, color: C.text, fontFamily: "'Atkinson Hyperlegible','IBM Plex Sans',sans-serif", flexShrink: 0 }}>Live location</div>
      <button onClick={open} disabled={loading}
        style={{ background: loading ? C.card : C.accent, border: `1px solid ${loading ? C.borderHi : C.accent}`, color: loading ? C.muted : "#fff", borderRadius: 7, padding: "7px 14px", fontSize: 12, cursor: loading ? "default" : "pointer", fontFamily: "'IBM Plex Mono',monospace", fontWeight: 700, letterSpacing: 1 }}>
        {loading ? "⟳ Fetching…" : "📍 View on map"}
      </button>
    </div>
  );
}

function LocationLog({ sc, isCompleted, notify }) {
  const C = useC();
  const hasLive    = !isCompleted && sc.vehicleReg && String(sc.vehicleReg).trim() !== "";
  const hasPickup  = sc.pickupLat  && sc.pickupLng;
  const hasDropoff = sc.dropoffLat && sc.dropoffLng;
  const hasHome    = sc.riderHomeLat && sc.riderHomeLng;

  if (!hasLive && !hasPickup && !hasDropoff && !hasHome) return null;

  return (
    <div style={{ background: C.sectionBg, border: `1px solid ${C.borderHi}`, borderRadius: 10, padding: "18px 20px", marginBottom: 16 }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: C.text, fontFamily: "'Atkinson Hyperlegible','IBM Plex Sans',sans-serif", marginBottom: 14 }}>Location log</div>
      {hasLive    && <LiveLocationRow sc={sc} notify={notify} />}
      {hasPickup  && <LocationRow label="Pickup"     lat={sc.pickupLat}    lng={sc.pickupLng} />}
      {hasDropoff && <LocationRow label="Drop-off"   lat={sc.dropoffLat}   lng={sc.dropoffLng} />}
      {hasHome    && <LocationRow label="Rider home" lat={sc.riderHomeLat} lng={sc.riderHomeLng} />}
    </div>
  );
}

// =============================================================================
// MAIN EXPORT
// =============================================================================
export default function CallDetail({ sc, allCalls, patchField, notify, vehicles = [], lists = {}, confirmComplete, setConfirmComplete, markComplete, onTryComplete, onBack, readOnly = false }) {
  const C = useC();
  const isCompleted = sc.status === "complete";
  const locked = isCompleted || readOnly;
  const hospitals = lists.hospitals || [];
  const riderNames = (lists.riders || []).map((r) => String(r.name || r));
  const rider1 = Array.isArray(sc.riders) ? (sc.riders[0] || "") : (sc.riders || "");
  const rider2Options = riderNames.filter((n) => n !== rider1);
  const hasRider2 = !!sc.rider2;
  const hasGroup = Array.isArray(sc.meetOtherGroup) ? sc.meetOtherGroup.length > 0 : !!sc.meetOtherGroup;
  const itemPicklist = lists.itemPicklist || [];
  const dutyStatuses = lists.dutyStatuses || [];
  const meetups = lists.meetups || [];
  const vehicleList = vehicles.length ? vehicles : (lists.vehicles || []);
  const [timingEdit, setTimingEdit] = useState(false);
  const rowCtx = { sc, patchField, notify, isCompleted: locked };
  const timeCtx = { sc, allCalls, patchField, notify, isCompleted: locked };

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: 16, maxWidth: 900, margin: "0 auto", width: "100%", boxSizing: "border-box" }}>
      {readOnly && !isCompleted && (
        <div style={{ background: C.card, border: `1px solid ${C.borderHi}`, borderRadius: 8, padding: "8px 14px", marginBottom: 14, fontSize: 11, color: C.muted, fontFamily: "'IBM Plex Mono',monospace", letterSpacing: 1 }}>
          👁  READ-ONLY — admin view. You can view this run but not edit it.
        </div>
      )}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20, gap: 12 }}>
        <div><div style={{ marginBottom: 10 }}><HomeButton onClick={onBack} /></div><div style={{ fontSize: 22, fontWeight: 700, fontFamily: "'IBM Plex Mono',monospace", color: isCompleted ? C.purple : C.accentText }}>{sc.originHospital} → {sc.destinationHospital}</div><div style={{ marginTop: 6 }}><Badge s={sc.status} /></div>{isCompleted && <div style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>Completed {sc.completedAt}</div>}</div>
        {!locked && (!confirmComplete
          ? <button onClick={onTryComplete} style={{ background: C.purple, border: "none", color: "#fff", padding: "10px 16px", borderRadius: 8, fontSize: 11, cursor: "pointer", fontFamily: "'IBM Plex Mono',monospace", fontWeight: 700, letterSpacing: 1, boxShadow: `0 0 20px ${C.purple}44`, flexShrink: 0 }}>✓ MARK COMPLETE</button>
          : <div style={{ background: C.confirmBg, border: `1px solid ${C.purple}`, borderRadius: 10, padding: "14px 18px", textAlign: "center", minWidth: 200 }}><div style={{ fontSize: 13, color: C.text, marginBottom: 12, fontFamily: "'Atkinson Hyperlegible','IBM Plex Sans',sans-serif", fontWeight: 700 }}>Mark Complete</div><div style={{ display: "flex", gap: 8 }}><button onClick={() => markComplete(sc.id)} style={{ flex: 1, background: C.purple, border: "none", color: "#fff", padding: "8px", borderRadius: 6, fontSize: 12, cursor: "pointer", fontFamily: "'IBM Plex Mono',monospace", fontWeight: 700 }}>CONFIRM</button><button onClick={() => setConfirmComplete(false)} style={{ flex: 1, background: "none", border: `1px solid ${C.borderHi}`, color: C.muted, padding: "8px", borderRadius: 6, fontSize: 12, cursor: "pointer", fontFamily: "'IBM Plex Mono',monospace" }}>CANCEL</button></div></div>
        )}
      </div>

      {/* Timing log — pinned at top, always visible */}
      <div style={{ background: C.sectionBg, border: `1px solid ${C.borderHi}`, borderRadius: 10, padding: "18px 20px", marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: C.text, fontFamily: "'Atkinson Hyperlegible','IBM Plex Sans',sans-serif" }}>Timing log</div>
          {!locked && <button onClick={() => setTimingEdit((e) => !e)} style={{ background: timingEdit ? C.green : "none", border: `1px solid ${timingEdit ? C.green : C.borderHi}`, color: timingEdit ? (isDark(C) ? "#000" : "#fff") : C.text, borderRadius: 6, padding: "5px 16px", cursor: "pointer", fontSize: 12, fontWeight: 700, fontFamily: "'Atkinson Hyperlegible','IBM Plex Sans',sans-serif" }}>{timingEdit ? "Done" : "Edit"}</button>}
        </div>
        <TimingRow {...timeCtx} editing={timingEdit} label="Rider called" fieldKey="riderCalled" />
        <TimingRow {...timeCtx} editing={timingEdit} label="Pickup time" fieldKey="pickupTime" />
        <EditRow {...rowCtx} editing={timingEdit} label="Scheduled meet-up" fieldKey="scheduledMeetupTime" type="time" fmt={fmtTime} />
        <TimingRow {...timeCtx} editing={timingEdit} label="Actual meet-up" fieldKey="meetupTime" />
        <TimingRow {...timeCtx} editing={timingEdit} label="Delivery time" fieldKey="deliveryTime" />
        <TimingRow {...timeCtx} editing={timingEdit} label="Rider home" fieldKey="riderHome" />
        {isCompleted && <TimingRow {...timeCtx} label="Completed at" fieldKey="completedAt" />}
      </div>

      {/* Location log — shown when any GPS data is available */}
      <LocationLog sc={sc} isCompleted={isCompleted} notify={notify} />

      {/* Collapsible detail sections */}
      <CollapsibleSection title="Call date and time" locked={locked}>
        <EditRow {...rowCtx} label="Timestamp" readOnly><span>{fmtDT(sc.timestamp)}</span></EditRow>
        <EditRow {...rowCtx} label="Time of call" fieldKey="timeOfCall" type="time" fmt={fmtTime} />
        <EditRow {...rowCtx} label="Date of call" fieldKey="dateOfCallFromHospital" type="date" fmt={fmtDate} />
        <EditRow {...rowCtx} label="Controller" fieldKey="controllerName" />
        <EditRow {...rowCtx} label="Transport date" fieldKey="transportDate" type="date" fmt={fmtDate} />
        <EditRow {...rowCtx} label="Date call received" fieldKey="dateCallReceived" type="date" fmt={fmtDate} />
        <EditRow {...rowCtx} label="Rider called" readOnly><span style={{ fontFamily: "'IBM Plex Mono',monospace" }}>{fmtTime(sc.riderCalled)}</span></EditRow>
      </CollapsibleSection>
      <CollapsibleSection title="Route" locked={locked}>
        <EditRow {...rowCtx} label="Origin" fieldKey="originHospital" options={hospitals} />
        <EditRow {...rowCtx} label="Destination" fieldKey="destinationHospital" options={hospitals} />
        <EditRow {...rowCtx} label="Items" fieldKey="itemsTransported" multi options={itemPicklist} />
        <EditRow {...rowCtx} label="No. of packages" fieldKey="numPackages" type="number" />
      </CollapsibleSection>
      {(sc.contactName || sc.contactPhone || sc.pickupAddress || sc.dropOffAddress) && (
        <CollapsibleSection title="Contact" locked={locked}>
          {sc.contactName    && <EditRow {...rowCtx} label="Contact name"     fieldKey="contactName" />}
          {sc.contactPhone   && <EditRow {...rowCtx} label="Contact phone"    fieldKey="contactPhone" type="tel" />}
          {sc.pickupAddress  && <EditRow {...rowCtx} label="Pick-up address"  fieldKey="pickupAddress" />}
          {sc.dropOffAddress && <EditRow {...rowCtx} label="Drop-off address" fieldKey="dropOffAddress" />}
        </CollapsibleSection>
      )}
      <CollapsibleSection title="Crew & vehicle" locked={locked}>
        <EditRow {...rowCtx} label="Rider(s)"     fieldKey="riders"         options={riderNames}   arrayWrap />
        <EditRow {...rowCtx} label="Duty status"  fieldKey="riderDutyStatus" options={dutyStatuses} />
        <EditRow {...rowCtx} label="Vehicle"      fieldKey="vehicleUsed"    options={vehicleList}  />
        {!hasGroup && <EditRow {...rowCtx} label="Second rider" fieldKey="rider2" options={rider2Options} onChanged={(v) => { if (v) patchField(sc.id, "meetOtherGroup", []); else patchField(sc.id, "rider2MeetupTime", ""); }} />}
        {!hasGroup && sc.rider2 && <EditRow {...rowCtx} label="Rider 2 meet-up time" fieldKey="rider2MeetupTime" type="time" fmt={fmtTime} />}
        {!hasRider2 && <EditRow {...rowCtx} label="Meet other group" fieldKey="meetOtherGroup" multi options={meetups} onChanged={(arr) => { if (arr.length) { patchField(sc.id, "rider2", ""); patchField(sc.id, "rider2MeetupTime", ""); } }} />}
        {!hasRider2 && hasGroup && <EditRow {...rowCtx} label="Meet-up date" fieldKey="scheduledMeetupDate" type="date" fmt={fmtDate} />}
        {!hasRider2 && hasGroup && <EditRow {...rowCtx} label="Meet-up time" fieldKey="scheduledMeetupTime" type="time" fmt={fmtTime} />}
        <EditRow {...rowCtx} label="Green lights" fieldKey="greenLights" bool />
      </CollapsibleSection>
      <CollapsibleSection title="Notes" locked={locked}>
        <NotesList notes={sc.notes} />
        {!locked && <ControllerNoteBox sc={sc} patchField={patchField} notify={notify} />}
      </CollapsibleSection>
    </div>
  );
}
