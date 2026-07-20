import { useState, useEffect, useCallback } from "react";
import { useC } from "./lib/theme.jsx";
import { api } from "./lib/api.js";
import { clearSession, normalizePhone } from "./lib/session.js";
import { nowTime, nowDate, nowDT } from "./lib/datetime.js";
import { EMPTY_CALL, REQUIRED_CALL_FIELDS, COMPLETE_REQUIRED_FIELDS, FIELD_LABELS } from "./constants.js";

import RunLog from "./views/RunLog.jsx";
import NewCallForm from "./views/NewCallForm.jsx";
import CallDetail from "./views/CallDetail.jsx";
import RiderList from "./views/RiderList.jsx";
import RiderDetail from "./components/RiderDetail.jsx";
import InstallPrompt from "./components/InstallPrompt.jsx";

const NavBtn = ({ v, children, view, setView, C }) => (
  <button onClick={() => setView(v)}
    style={{ background: view === v ? C.navActive : "none", border: "none", borderBottom: `2px solid ${view === v ? C.accent : "transparent"}`, color: view === v ? C.accentText : C.muted, padding: "14px 18px", fontSize: 11, cursor: "pointer", fontFamily: "'IBM Plex Mono',monospace", letterSpacing: 1, whiteSpace: "nowrap" }}>
    {children}
  </button>
);

// Silently fetch vehicle GPS coords from Velocity Fleet.
// Returns { lat, lng } or null — never throws.
async function fetchVehicleCoords(vehicleReg) {
  if (!vehicleReg || String(vehicleReg).trim() === "") return null;
  try {
    const res = await api("getVehicleLocation", { reg: vehicleReg });
    if (res.ok && res.lat && res.lng) return { lat: res.lat, lng: res.lng };
  } catch { /* silent */ }
  return null;
}

// Switch role warning dialog — shown when DU switches while on newcall view.
function SwitchWarning({ targetLabel, onConfirm, onCancel, C }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 9998, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ background: C.card, border: `1px solid ${C.borderHi}`, borderRadius: 12, padding: 28, maxWidth: 360, width: "100%", boxShadow: "0 8px 40px rgba(0,0,0,0.4)" }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: C.text, marginBottom: 10, fontFamily: "'Atkinson Hyperlegible','IBM Plex Sans',sans-serif" }}>Switch to {targetLabel}?</div>
        <div style={{ fontSize: 13, color: C.muted, marginBottom: 24, lineHeight: 1.6 }}>You're in the middle of logging a call. Switching role will discard this call.</div>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onConfirm} style={{ flex: 1, background: C.orange, border: "none", color: "#000", padding: "11px", borderRadius: 8, fontSize: 13, cursor: "pointer", fontFamily: "'IBM Plex Mono',monospace", fontWeight: 700 }}>SWITCH & DISCARD</button>
          <button onClick={onCancel} style={{ flex: 1, background: "none", border: `1px solid ${C.borderHi}`, color: C.muted, padding: "11px", borderRadius: 8, fontSize: 13, cursor: "pointer", fontFamily: "'IBM Plex Mono',monospace" }}>CANCEL</button>
        </div>
      </div>
    </div>
  );
}

export default function MainApp({ session, onLogout }) {
  const C = useC();
  const { role, name, controllers, riders } = session;

  const canControl = session.isController ?? (role === "controller" || role === "dual user");
  const canRide    = session.isRider    ?? (role === "rider"       || role === "dual user");
  const canAdmin   = session.isAdmin    ?? (role === "admin");
  const isDual     = canControl && canRide;

  const dashboards = [
    canControl && ["control", "CTL"],
    canRide    && ["rider",   "RDR"],
    canAdmin   && ["admin",   "ADM"],
  ].filter(Boolean);
  const defaultDash = canControl ? "control" : canRide ? "rider" : "admin";
  const dashHome = (d) => (d === "control" ? "log" : d === "rider" ? "rider-list" : "admin-list");

  const [dash, setDash]               = useState(defaultDash);
  const [view, setView]               = useState(dashHome(defaultDash));
  const [pendingDB, setPendingDB]     = useState([]);
  const [form, setForm]               = useState({ ...EMPTY_CALL });
  const [hospitals,    setHospitals]    = useState([]);
  const [vehicles,     setVehicles]     = useState([]);
  const [meetups,      setMeetups]      = useState([]);
  const [itemPicklist, setItems]        = useState([]);
  const [dutyStatuses, setDutyStatuses] = useState([]);
  const [detailId,   setDetailId]   = useState(null);
  const [toast,      setToast]      = useState(null);
  const [confirmComplete, setConfirmComplete] = useState(false);
  const [dbLoading,  setDbLoading]  = useState(false);
  const [switchTarget, setSwitchTarget] = useState(null); // pending dash switch for DU warning

  const notify = (msg, color = C.green) => { setToast({ msg, color }); setTimeout(() => setToast(null), 3000); };
  const selectedCall = pendingDB.find((x) => x.id === detailId) || null;

  useEffect(() => {
    api("getLists").then((res) => {
      if (res.hospitals)    setHospitals(res.hospitals);
      if (res.items)        setItems(res.items);
      if (res.meetups)      setMeetups(res.meetups);
      if (res.vehicles)     setVehicles(res.vehicles);
      if (res.dutyStatuses) setDutyStatuses(res.dutyStatuses);
    }).catch(() => {});
  }, []);

  const loadCalls = useCallback(async () => {
    setDbLoading(true);
    try {
      const pending = await api("getPendingCalls");
      setPendingDB(pending.rows || []);
    } catch { notify("Could not load calls", C.red); }
    setDbLoading(false);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { loadCalls(); }, [loadCalls]);
  useEffect(() => { const t = setInterval(loadCalls, 30000); return () => clearInterval(t); }, [loadCalls]);

  const patchCall = async (id, patch) => {
    setPendingDB((prev) => prev.map((x) => x.id === id ? { ...x, ...patch } : x));
    try { await api("updateCall", { id, ...patch }); }
    catch { notify("Sync error — saved locally", C.orange); }
  };
  const patchField = (id, k, v) => patchCall(id, { [k]: v });

  const initiateNewCall = () => {
    const td = nowDate();
    setForm({ ...EMPTY_CALL, timestamp: nowDT(), riderCalled: nowTime(), transportDate: td, dateCallReceived: td, dateOfCallFromHospital: td, scheduledMeetupDate: td, controllerName: name, meetOtherGroup: [], overrides: {} });
    setView("newcall");
  };

  const fset = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const ftog = (k, v) => setForm((f) => ({ ...f, [k]: f[k].includes(v) ? f[k].filter((x) => x !== v) : [...f[k], v] }));

  useEffect(() => { if (!form.overrides?.dateCallReceived) setForm((f) => ({ ...f, dateCallReceived: f.transportDate })); }, [form.transportDate]); // eslint-disable-line react-hooks/exhaustive-deps

  const onAddLocation = (v) => {
    setHospitals((p) => [...p, v].sort());
    api("addToList", { sheet: "OriginDestination", value: v }).catch(() => {});
    notify(`"${v}" added`);
  };

  const onAddMeetup = (v) => {
    setMeetups((p) => [...p, v].sort());
    api("addToList", { sheet: "Meetups", value: v }).catch(() => {});
    notify(`"${v}" added`);
  };

  const missingMsg = (head, keys) => head + "\n" + keys.map((k) => "• " + FIELD_LABELS[k]).join("\n");

  const submitCall = async () => {
    const missing = REQUIRED_CALL_FIELDS.filter((k) => {
      if (k === "numPackages") return !(Number(form.numPackages) >= 1);
      return !form[k] || (Array.isArray(form[k]) && !form[k].length);
    });
    if (missing.length) { notify(missingMsg("Can't open call — missing required:", missing), C.red); return; }
    const id = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
    const record = { ...form, id, status: "pending-pickup", controllerPhone: session.phone };
    setPendingDB((prev) => [record, ...prev]);
    setDetailId(id); setView("detail");
    notify("Run logged");
    try { await api("addCall", { record }); }
    catch { notify("Logged locally — sync error", C.orange); }
  };

  // Milestone triggers — capture vehicle GPS coords from Velocity Fleet if available
  const triggerPickup = async (id) => {
    const call = pendingDB.find((x) => x.id === id);
    const patch = { pickupTime: nowTime(), status: "in-transit" };
    if (call?.vehicleReg) {
      const coords = await fetchVehicleCoords(call.vehicleReg);
      if (coords) { patch.pickupLat = coords.lat; patch.pickupLng = coords.lng; }
    }
    patchCall(id, patch);
    notify("Pickup recorded", C.accent);
  };

  const triggerDropoff = async (id) => {
    const call = pendingDB.find((x) => x.id === id);
    const patch = { meetupTime: nowTime(), deliveryTime: nowTime(), status: "delivered" };
    if (call?.vehicleReg) {
      const coords = await fetchVehicleCoords(call.vehicleReg);
      if (coords) { patch.dropoffLat = coords.lat; patch.dropoffLng = coords.lng; }
    }
    patchCall(id, patch);
    notify("Delivery recorded ✓");
  };

  const triggerRiderHome = async (id) => {
    const call = pendingDB.find((x) => x.id === id);
    const patch = { riderHome: nowTime() };
    if (call?.vehicleReg) {
      const coords = await fetchVehicleCoords(call.vehicleReg);
      if (coords) { patch.riderHomeLat = coords.lat; patch.riderHomeLng = coords.lng; }
    }
    patchCall(id, patch);
    notify("Rider home recorded");
  };

  const completeMissing = (call) => COMPLETE_REQUIRED_FIELDS.filter((k) => !call[k] || (Array.isArray(call[k]) && !call[k].length));

  const tryComplete = () => {
    if (!selectedCall) return;
    const missing = completeMissing(selectedCall);
    if (missing.length) { notify(missingMsg("Can't complete — missing required:", missing), C.red); return; }
    setConfirmComplete(true);
  };

  const markComplete = async (id) => {
    const call = pendingDB.find((x) => x.id === id); if (!call) return;
    const missing = completeMissing(call);
    if (missing.length) { setConfirmComplete(false); notify(missingMsg("Can't complete — missing required:", missing), C.red); return; }
    const completedAt = nowDT();
    setPendingDB((prev) => prev.filter((x) => x.id !== id));
    setConfirmComplete(false); setView("log");
    notify("Run completed", C.purple);
    try { await api("completeCall", { id, completedAt }); }
    catch { notify("Complete saved locally — sync error", C.orange); }
  };

  const completeFromLog = async (id, vehicleChoice) => {
    const call = pendingDB.find((x) => x.id === id); if (!call) return;
    const merged = { ...call, ...(vehicleChoice ? { vehicleUsed: vehicleChoice } : {}) };
    const missing = completeMissing(merged);
    if (missing.length) { notify(missingMsg("Can't complete — missing required:", missing), C.red); return; }
    if (vehicleChoice && vehicleChoice !== call.vehicleUsed) { await patchCall(id, { vehicleUsed: vehicleChoice }); }
    const completedAt = nowDT();
    setPendingDB((prev) => prev.filter((x) => x.id !== id));
    notify("Run completed", C.purple);
    try { await api("completeCall", { id, completedAt }); }
    catch { notify("Complete saved locally — sync error", C.orange); }
  };

  // Dual user role switch — warn if mid-form, otherwise switch immediately
  const handleDashSwitch = (targetDash) => {
    if (targetDash === dash) return;
    if (view === "newcall") {
      setSwitchTarget(targetDash);
    } else {
      setDash(targetDash);
      setView(dashHome(targetDash));
    }
  };

  const confirmSwitch = () => {
    setDash(switchTarget);
    setView(dashHome(switchTarget));
    setSwitchTarget(null);
  };

  const isControl   = dash === "control";
  const isAdminView = dash === "admin";

  const loggedByMe  = (rc) => !!rc.controllerPhone && normalizePhone(rc.controllerPhone) === normalizePhone(session.phone);
  const myControlRun = (rc) =>
    (!!rc.controllerName  && rc.controllerName.trim() === name.trim()) ||
    (!!rc.controllerPhone && normalizePhone(rc.controllerPhone) === normalizePhone(session.phone));

  const lists = { controllers, riders, hospitals, vehicles, meetups, itemPicklist, dutyStatuses };

  const isMyRun = (rc) => {
    const assigned = Array.isArray(rc.riders) ? rc.riders : typeof rc.riders === "string" ? [rc.riders] : [];
    return assigned.some((r) => r.trim() === name.trim());
  };

  const vehicleNames = vehicles.map((v) => (typeof v === "object" ? v.name : v));

  // Switch button label for dual users
  const switchLabel  = isControl ? "Switch to Rider" : "Switch to Controller";
  const switchTarget_ = isControl ? "rider" : "control";

  return (
    <div style={{ fontFamily: "'Atkinson Hyperlegible','IBM Plex Sans',sans-serif", background: C.bg, minHeight: "100vh", color: C.text, display: "flex", flexDirection: "column" }}>
      <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
      <style>{`
        .bbw-header{display:flex;align-items:center;gap:8px;height:56px;padding:0 16px;flex-shrink:0}
        .bbw-brand{order:0;margin-right:auto}
        .bbw-account{order:1}
        .bbw-break{display:none;order:2}
        @media (max-width:520px){
          .bbw-header{height:auto;flex-wrap:wrap;row-gap:8px;padding-top:8px;padding-bottom:8px}
          .bbw-brand{order:1;margin-right:auto}
          .bbw-account{order:2}
          .bbw-break{display:block;order:3;flex-basis:100%;height:0;margin:0}
          .bbw-brand-title{font-size:11px;letter-spacing:1px}
        }
      `}</style>

      {toast && <div role="alert" style={{ position: "fixed", top: 16, right: 16, background: toast.color, color: "#fff", padding: "10px 20px", borderRadius: 7, fontSize: 13, zIndex: 9999, boxShadow: "0 4px 24px rgba(0,0,0,0.3)", fontFamily: "'IBM Plex Mono',monospace", whiteSpace: "pre-line", maxWidth: 300, lineHeight: 1.6 }}>{toast.msg}</div>}

      {switchTarget && (
        <SwitchWarning
          targetLabel={switchTarget === "control" ? "Controller" : "Rider"}
          onConfirm={confirmSwitch}
          onCancel={() => setSwitchTarget(null)}
          C={C}
        />
      )}

      <InstallPrompt />

      {/* Header */}
      <header className="bbw-header" role="banner" style={{ background: C.panel, borderBottom: `1px solid ${C.border}` }}>
        <div className="bbw-brand" style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
          <img src="/logo.png" alt="Blood Bike West logo" style={{ width: 32, height: 32, objectFit: "contain", flexShrink: 0 }} />
          <div style={{ minWidth: 0 }}>
            <h1 className="bbw-brand-title" style={{ fontSize: 13, fontWeight: 700, letterSpacing: 2, fontFamily: "'IBM Plex Mono',monospace", color: C.text, whiteSpace: "nowrap", margin: 0 }}>BLOOD BIKE WEST</h1>
            <div style={{ fontSize: 8, color: C.muted, letterSpacing: 3 }}>COMMAND CENTRE</div>
          </div>
        </div>

        <div className="bbw-account" style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          {isDual && (
            <button onClick={() => handleDashSwitch(switchTarget_)}
              style={{ background: C.card, border: `1px solid ${C.borderHi}`, color: C.text, fontSize: 11, cursor: "pointer", fontFamily: "'Atkinson Hyperlegible','IBM Plex Sans',sans-serif", fontWeight: 600, padding: "6px 12px", borderRadius: 6 }}>
              {switchLabel}
            </button>
          )}
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 11, color: C.text, maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{name}</div>
            <button onClick={() => { clearSession(); onLogout(); }} style={{ background: C.card, border: `1px solid ${C.borderHi}`, color: C.muted, fontSize: 10, cursor: "pointer", fontFamily: "'IBM Plex Mono',monospace", padding: "5px 12px", borderRadius: 6, letterSpacing: 1, marginTop: 4 }}>SIGN OUT</button>
          </div>
        </div>
      </header>

      {/* Control sub-nav */}
      {isControl && view !== "newcall" && view !== "detail" && (
        <nav aria-label="Views" style={{ background: C.panel, borderBottom: `1px solid ${C.border}`, display: "flex", paddingLeft: 8, flexShrink: 0 }}>
          <NavBtn v="log" view={view} setView={setView} C={C}>RUN LOG</NavBtn>
          {dbLoading && <div style={{ marginLeft: "auto", padding: "14px 18px", fontSize: 10, color: C.muted, fontFamily: "'IBM Plex Mono',monospace" }}>⟳ syncing…</div>}
        </nav>
      )}

      {isControl && view === "log" && (
        <RunLog pending={pendingDB.filter(myControlRun)} onOpen={(id) => { setDetailId(id); setView("detail"); }} onNewCall={initiateNewCall} onComplete={completeFromLog} vehicles={vehicleNames} />
      )}

      {isControl && view === "newcall" && (
        <NewCallForm
          form={form} fset={fset} ftog={ftog}
          lists={{ ...lists, vehicles: vehicleNames, vehicleObjects: vehicles }}
          onAddLocation={onAddLocation} onAddMeetup={onAddMeetup}
          onSubmit={submitCall} onCancel={() => setView("log")}
        />
      )}

      {isControl && view === "detail" && selectedCall && (
        <CallDetail
          sc={selectedCall} allCalls={pendingDB} patchField={patchField} notify={notify} vehicles={vehicleNames} lists={lists}
          confirmComplete={confirmComplete} setConfirmComplete={setConfirmComplete}
          markComplete={markComplete} onTryComplete={tryComplete} onBack={() => setView("log")}
        />
      )}

      {dash === "rider" && view === "rider-list" && (
        <RiderList active={pendingDB.filter(isMyRun)} onOpen={(id) => { setDetailId(id); setView("rider-detail"); }} />
      )}

      {dash === "rider" && view === "rider-detail" && selectedCall && (
        <RiderDetail
          call={selectedCall}
          onBack={() => setView("rider-list")}
          onPickup={() => triggerPickup(selectedCall.id)}
          onDropoff={() => triggerDropoff(selectedCall.id)}
          onRiderHome={() => triggerRiderHome(selectedCall.id)}
          onNote={(note) => {
            const updated = (selectedCall.notes ? selectedCall.notes + "\n\n" : "") + `[Rider ${nowDT()}]: ` + note;
            patchCall(selectedCall.id, { notes: updated });
          }}
        />
      )}

      {isAdminView && view === "admin-list" && (
        <RunLog pending={pendingDB} onOpen={(id) => { setDetailId(id); setView("admin-detail"); }} onNewCall={null} />
      )}

      {isAdminView && view === "admin-detail" && selectedCall && (
        <CallDetail
          sc={selectedCall} allCalls={pendingDB} patchField={patchField} notify={notify} vehicles={vehicleNames} lists={lists}
          confirmComplete={confirmComplete} setConfirmComplete={setConfirmComplete}
          markComplete={markComplete} onTryComplete={tryComplete} onBack={() => setView("admin-list")}
          readOnly={!loggedByMe(selectedCall)}
        />
      )}
    </div>
  );
}
