import { useState, useEffect, useCallback } from "react";
import { useC } from "./lib/theme.jsx";
import { api } from "./lib/api.js";
import { clearSession } from "./lib/session.js";
import { nowTime, nowDate, nowDT } from "./lib/datetime.js";
import { EMPTY_CALL, REQUIRED_CALL_FIELDS } from "./constants.js";

import RunLog from "./views/RunLog.jsx";
import NewCallForm from "./views/NewCallForm.jsx";
import CallDetail from "./views/CallDetail.jsx";
import RiderList from "./views/RiderList.jsx";
import RiderDetail from "./components/RiderDetail.jsx";

const NavBtn = ({ v, children, view, setView, C }) => (
  <button onClick={() => setView(v)}
    style={{ background: view === v ? C.navActive : "none", border: "none", borderBottom: `2px solid ${view === v ? C.accent : "transparent"}`, color: view === v ? C.accentText : C.muted, padding: "14px 18px", fontSize: 11, cursor: "pointer", fontFamily: "'IBM Plex Mono',monospace", letterSpacing: 1, whiteSpace: "nowrap" }}>
    {children}
  </button>
);

export default function MainApp({ session, onLogout }) {
  const C = useC();
  const { role, name, controllers, riders } = session;

  const [dash, setDash] = useState(role === "rider" ? "rider" : "control");
  const [view, setView] = useState(role === "rider" ? "rider-list" : "log");
  const [pendingDB, setPendingDB] = useState([]);
  const [form, setForm] = useState({ ...EMPTY_CALL });
  const [hospitals, setHospitals] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [meetups, setMeetups] = useState([]);
  const [itemPicklist, setItems] = useState([]);
  const [dutyStatuses, setDutyStatuses] = useState([]);
  const [itemQuery, setItemQ] = useState("");
  const [itemSugg, setItemSugg] = useState([]);
  const [confirmItem, setCI] = useState(null);
  const [detailId, setDetailId] = useState(null);
  const [toast, setToast] = useState(null);
  const [confirmComplete, setConfirmComplete] = useState(false);
  const [dbLoading, setDbLoading] = useState(false);

  const notify = (msg, color = C.green) => { setToast({ msg, color }); setTimeout(() => setToast(null), 3000); };
  const selectedCall = pendingDB.find((x) => x.id === detailId) || null;

  useEffect(() => {
    api("getLists").then((res) => {
      if (res.hospitals) setHospitals(res.hospitals);
      if (res.items) setItems(res.items);
      if (res.meetups) setMeetups(res.meetups);
      if (res.vehicles) setVehicles(res.vehicles);
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
    setForm({ ...EMPTY_CALL, timestamp: nowDT(), riderCalled: nowTime(), transportDate: td, dateCallReceived: td, dateOfCallFromHospital: td, controllerName: name, meetOtherGroup: [], overrides: {} });
    setItemQ(""); setItemSugg([]); setCI(null);
    setView("newcall");
  };

  const fset = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const ftog = (k, v) => setForm((f) => ({ ...f, [k]: f[k].includes(v) ? f[k].filter((x) => x !== v) : [...f[k], v] }));
  const handleOverride = (fk, val) => {
    setForm((f) => {
      const ov = { ...f.overrides };
      if (val === null) { delete ov[fk]; return { ...f, overrides: ov }; }
      return { ...f, [fk]: val, overrides: { ...ov, [fk]: true } };
    });
  };
  useEffect(() => { if (!form.overrides?.dateCallReceived) setForm((f) => ({ ...f, dateCallReceived: f.transportDate })); }, [form.transportDate]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!itemQuery.trim()) { setItemSugg([]); return; }
    const q = itemQuery.toLowerCase();
    setItemSugg(itemPicklist.filter((i) => i.toLowerCase().includes(q) && !form.itemsTransported.includes(i)));
    setCI(null);
  }, [itemQuery, itemPicklist, form.itemsTransported]);

  const addItem = () => {
    const v = itemQuery.trim(); if (!v) return;
    const match = itemPicklist.find((i) => i.toLowerCase() === v.toLowerCase());
    if (match) { if (!form.itemsTransported.includes(match)) ftog("itemsTransported", match); setItemQ(""); }
    else setCI(v);
  };
  const confirmAdd = () => {
    setItems((p) => [...p, confirmItem]);
    setForm((f) => ({ ...f, itemsTransported: [...f.itemsTransported, confirmItem] }));
    setItemQ(""); setCI(null);
    notify(`"${confirmItem}" added to picklist`);
  };

  const onAddLocation = (v) => {
    setHospitals((p) => [...p, v].sort());
    api("addToList", { sheet: "OriginDestination", value: v }).catch(() => {});
    notify(`"${v}" added`);
  };

  const submitCall = async () => {
    const missing = REQUIRED_CALL_FIELDS.filter((k) => !form[k] || (Array.isArray(form[k]) && !form[k].length));
    if (missing.length) { notify("Please complete all required fields", C.red); return; }
    const id = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
    const record = { ...form, id, status: "pending-pickup" };
    setPendingDB((prev) => [record, ...prev]);
    setDetailId(id); setView("detail");
    notify("Run logged");
    try { await api("addCall", { record }); }
    catch { notify("Logged locally — sync error", C.orange); }
  };

  const triggerPickup = (id) => { patchCall(id, { pickupTime: nowTime(), status: "in-transit" }); notify("Pickup recorded", C.accent); };
  const triggerDropoff = (id) => { patchCall(id, { meetupTime: nowTime(), deliveryTime: nowTime(), status: "delivered" }); notify("Delivery recorded ✓"); };
  const triggerRiderHome = (id) => { patchCall(id, { riderHome: nowTime() }); notify("Rider home recorded"); };

  const markComplete = async (id) => {
    const call = pendingDB.find((x) => x.id === id); if (!call) return;
    const completedAt = nowDT();
    setPendingDB((prev) => prev.filter((x) => x.id !== id));
    setConfirmComplete(false); setView("log");
    notify("Run completed", C.purple);
    try { await api("completeCall", { id, completedAt }); }
    catch { notify("Complete saved locally — sync error", C.orange); }
  };

  const isControl = dash === "control";

  const lists = { controllers, riders, hospitals, vehicles, meetups, itemPicklist, dutyStatuses };

  // Rider list is filtered to runs assigned to this rider (or unassigned).
  const isMyRun = (rc) => {
    const assigned = Array.isArray(rc.riders) ? rc.riders : typeof rc.riders === "string" ? [rc.riders] : [];
    return assigned.length === 0 || assigned.some((r) => r.trim() === name.trim());
  };

  return (
    <div style={{ fontFamily: "'IBM Plex Sans',sans-serif", background: C.bg, minHeight: "100vh", color: C.text, display: "flex", flexDirection: "column" }}>
      <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />

      {toast && <div role="alert" style={{ position: "fixed", top: 16, right: 16, background: toast.color, color: "#fff", padding: "10px 20px", borderRadius: 7, fontSize: 13, zIndex: 9999, boxShadow: "0 4px 24px rgba(0,0,0,0.3)", fontFamily: "'IBM Plex Mono',monospace" }}>{toast.msg}</div>}

      {/* Header */}
      <div style={{ background: C.panel, borderBottom: `1px solid ${C.border}`, padding: "0 16px", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0, gap: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
          <img src="/logo.png" alt="Blood Bike West logo" style={{ width: 32, height: 32, objectFit: "contain", flexShrink: 0 }} />
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: 2, fontFamily: "'IBM Plex Mono',monospace", color: C.text, whiteSpace: "nowrap" }}>BLOOD BIKE WEST</div>
            <div style={{ fontSize: 8, color: C.muted, letterSpacing: 3 }}>COMMAND CENTRE</div>
          </div>
        </div>
        {isControl && <button onClick={initiateNewCall} style={{ background: C.accent, border: "none", color: "#fff", padding: "8px 14px", borderRadius: 7, fontSize: 11, cursor: "pointer", fontFamily: "'IBM Plex Mono',monospace", fontWeight: 700, letterSpacing: 1, flexShrink: 0 }}>+ NEW CALL</button>}
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          {role === "dual user" && (
            <div style={{ display: "flex", background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: 3, gap: 3 }}>
              {[["control", "CTL"], ["rider", "RDR"]].map(([d, label]) => (
                <button key={d} onClick={() => { setDash(d); setView(d === "control" ? "log" : "rider-list"); }}
                  style={{ background: dash === d ? C.accent : "transparent", color: dash === d ? "#fff" : C.muted, border: "none", borderRadius: 6, padding: "6px 10px", fontSize: 10, cursor: "pointer", fontFamily: "'IBM Plex Mono',monospace", letterSpacing: 1, fontWeight: 600 }}>
                  {label}
                </button>
              ))}
            </div>
          )}
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 11, color: C.text, maxWidth: 80, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{name}</div>
            <button onClick={() => { clearSession(); onLogout(); }} style={{ background: "none", border: "none", color: C.muted, fontSize: 10, cursor: "pointer", fontFamily: "'IBM Plex Mono',monospace", padding: 0, letterSpacing: 1 }}>SIGN OUT</button>
          </div>
        </div>
      </div>

      {/* Control sub-nav */}
      {isControl && view !== "newcall" && view !== "detail" && (
        <div style={{ background: C.panel, borderBottom: `1px solid ${C.border}`, display: "flex", paddingLeft: 8, flexShrink: 0 }}>
          <NavBtn v="log" view={view} setView={setView} C={C}>RUN LOG</NavBtn>
          {dbLoading && <div style={{ marginLeft: "auto", padding: "14px 18px", fontSize: 10, color: C.muted, fontFamily: "'IBM Plex Mono',monospace" }}>⟳ syncing…</div>}
        </div>
      )}

      {isControl && view === "log" && (
        <RunLog pending={pendingDB} onOpen={(id) => { setDetailId(id); setView("detail"); }} onNewCall={initiateNewCall} />
      )}

      {isControl && view === "newcall" && (
        <NewCallForm
          form={form} fset={fset} ftog={ftog} handleOverride={handleOverride}
          lists={lists} onAddLocation={onAddLocation}
          itemQuery={itemQuery} setItemQ={setItemQ} itemSugg={itemSugg} addItem={addItem}
          confirmItem={confirmItem} setCI={setCI} confirmAdd={confirmAdd}
          onSubmit={submitCall} onCancel={() => setView("log")}
        />
      )}

      {isControl && view === "detail" && selectedCall && (
        <CallDetail
          sc={selectedCall} allCalls={pendingDB} patchField={patchField} notify={notify}
          confirmComplete={confirmComplete} setConfirmComplete={setConfirmComplete}
          markComplete={markComplete} onBack={() => setView("log")}
        />
      )}

      {!isControl && view === "rider-list" && (
        <RiderList active={pendingDB.filter(isMyRun)} onOpen={(id) => { setDetailId(id); setView("rider-detail"); }} />
      )}

      {!isControl && view === "rider-detail" && selectedCall && (
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
    </div>
  );
}
