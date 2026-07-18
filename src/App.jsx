// =============================================================================
// BLOOD BIKE WEST — COMMAND CENTRE
// Phone number login + Google Sheets via Apps Script
// WCAG AA compliant — light & dark theme via prefers-color-scheme
// Velocity Fleet / Kinesis live location integration
// =============================================================================

import { useState, useEffect, useCallback } from "react";

const APPS_SCRIPT_URL = import.meta.env.VITE_APPS_SCRIPT_URL;
const VAPID_KEY       = import.meta.env.VITE_FIREBASE_VAPID_KEY;
const FIREBASE_CONFIG = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
};

async function registerPushNotifications(phone) {
  try {
    if (!("serviceWorker" in navigator) || !("Notification" in window)) return;
    if (Notification.permission === "denied") return;
    const reg = await navigator.serviceWorker.register("/firebase-messaging-sw.js");
    const permission = await Notification.requestPermission();
    if (permission !== "granted") return;
    const { initializeApp, getApps } = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js");
    const { getMessaging, getToken } = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging.js");
    const app = getApps().length ? getApps()[0] : initializeApp(FIREBASE_CONFIG);
    const messaging = getMessaging(app);
    const token = await getToken(messaging, { vapidKey: VAPID_KEY, serviceWorkerRegistration: reg });
    if (token) await api("saveFcmToken", { phone, token });
  } catch (e) {
    console.warn("Push notification setup failed:", e.message);
  }
}

async function api(action, payload = {}) {
  const url = new URL(APPS_SCRIPT_URL);
  url.searchParams.set("action", action);
  if (Object.keys(payload).length > 0) url.searchParams.set("data", JSON.stringify(payload));
  const res = await fetch(url.toString(), { method: "GET", redirect: "follow" });
  const text = await res.text();
  try { return JSON.parse(text); }
  catch { throw new Error("Invalid response: " + text.slice(0, 100)); }
}

const normalizePhone = (p) => String(p).replace(/[\s\-\(\)\+]/g, "").trim();

const SESSION_KEY = "bbw_session";
const SESSION_TTL = 2 * 60 * 60 * 1000;
const saveSession = (data) => localStorage.setItem(SESSION_KEY, JSON.stringify({...data, savedAt: Date.now()}));
const loadSession = () => {
  try {
    const s = JSON.parse(localStorage.getItem(SESSION_KEY));
    if (!s) return null;
    if (Date.now() - s.savedAt > SESSION_TTL) { localStorage.removeItem(SESSION_KEY); return null; }
    const { savedAt, ...session } = s;
    return session;
  } catch { return null; }
};
const clearSession = () => localStorage.removeItem(SESSION_KEY);

const nowTime = () => new Date().toLocaleTimeString("en-IE",{timeZone:"Europe/Dublin",hour:"2-digit",minute:"2-digit",hour12:false});
const nowDate = () => new Date().toLocaleDateString("en-IE",{timeZone:"Europe/Dublin"}).split("/").reverse().join("-").replace(/(\d{4})-(\d{1,2})-(\d{1,2})/,(_,y,m,d)=>`${y}-${m.padStart(2,"0")}-${d.padStart(2,"0")}`);
const nowDT   = () => `${nowDate()} ${nowTime()}`;

const fmtTime = (v) => {
  if (!v) return "—";
  const s = String(v);
  if (/^\d{2}:\d{2}$/.test(s)) return s;
  if (s.includes("T")) { const d = new Date(s); if (!isNaN(d)) return d.toLocaleTimeString("en-IE",{timeZone:"Europe/Dublin",hour:"2-digit",minute:"2-digit",hour12:false}); }
  if (s.startsWith("1899-12-30") || s.startsWith("1899-12-31")) { const d = new Date(s); if (!isNaN(d)) return d.toLocaleTimeString("en-IE",{timeZone:"Europe/Dublin",hour:"2-digit",minute:"2-digit",hour12:false}); }
  return s.slice(0,5);
};
const fmtDate = (v) => {
  if (!v) return "—";
  const s = String(v);
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  if (s.includes("T")) return s.slice(0,10);
  return s.slice(0,10);
};
const fmtDT = (v) => {
  if (!v) return "—";
  const s = String(v);
  if (s.includes("T") || s.includes("Z")) {
    const d = new Date(s);
    if (!isNaN(d)) return `${d.toLocaleDateString("en-IE",{timeZone:"Europe/Dublin"})} ${d.toLocaleTimeString("en-IE",{timeZone:"Europe/Dublin",hour:"2-digit",minute:"2-digit",hour12:false})}`;
  }
  return s;
};

const EMPTY_CALL = {
  timestamp:"", timeOfCall:"", dateOfCallFromHospital:"", controllerName:"",
  transportDate:"", dateCallReceived:"",
  originHospital:"", destinationHospital:"",
  itemsTransported:[], numPackages:"", riders:[], riderDutyStatus:"",
  greenLights:null, meetOtherGroup:[], vehicleUsed:"", vehicleReg:"", riderCalled:"", notes:"",
  contactName:"", contactPhone:"", pickupAddress:"", dropOffAddress:"",
  scheduledMeetupDate:"", scheduledMeetupTime:"",
  pickupTime:"", pickupLat:"", pickupLng:"",
  meetupTime:"", deliveryTime:"", dropoffLat:"", dropoffLng:"",
  riderHome:"", riderHomeLat:"", riderHomeLng:"",
  completedAt:"", overrides:{}, status:"pending-pickup", id:"",
};

// =============================================================================
// THEME — WCAG AA compliant, light + dark
// =============================================================================
const THEME = {
  dark: {
    bg:"#090910", panel:"#0f0f1a", card:"#13131f", border:"#1e1e30",
    borderHi:"#2a2a42", text:"#e2e2f0", muted:"#9898b8", accent:"#4d8aff",
    accentText:"#7aabff", green:"#4ade80", orange:"#fbbf24", red:"#f87171",
    purple:"#c084fc", white:"#ffffff", inputBg:"#13131f", inputBorder:"#2a2a42",
    completedBg:"#111120", sectionBg:"#13131f", navActive:"#2060ff22",
    successBg:"#14281a", errorBg:"#2a1010", errorText:"#fca5a5",
    confirmBg:"#1a1028", hintBg:"#1a1a28", tableAlt:"#111120",
  },
  light: {
    bg:"#f4f4f8", panel:"#ffffff", card:"#ffffff", border:"#d1d1e0",
    borderHi:"#b0b0cc", text:"#111128", muted:"#4a4a6a", accent:"#1a4fd6",
    accentText:"#1a4fd6", green:"#166534", orange:"#92400e", red:"#991b1b",
    purple:"#6b21a8", white:"#ffffff", inputBg:"#ffffff", inputBorder:"#9898b8",
    completedBg:"#f0f0f8", sectionBg:"#ffffff", navActive:"#1a4fd622",
    successBg:"#f0fdf4", errorBg:"#fef2f2", errorText:"#991b1b",
    confirmBg:"#faf5ff", hintBg:"#f8f8ff", tableAlt:"#f0f0f8",
  }
};

function useTheme() {
  const [dark, setDark] = useState(() =>
    typeof window !== "undefined" ? window.matchMedia("(prefers-color-scheme: dark)").matches : true
  );
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = e => setDark(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  return dark ? THEME.dark : THEME.light;
}

let C = THEME.dark;

const inp = (hi=false,ro=false) => ({
  width:"100%", boxSizing:"border-box",
  background: hi ? (C===THEME.dark?"#4d8aff0f":"#1a4fd610") : C.inputBg,
  border:`1px solid ${hi?(C===THEME.dark?"#4d8aff55":"#1a4fd655"):C.inputBorder}`,
  color:ro?C.muted:C.text, padding:"9px 12px", borderRadius:7,
  fontSize:13, fontFamily:"'IBM Plex Sans',sans-serif",
  outline:"none", cursor:ro?"default":"text",
});
const sel = () => ({...inp(), appearance:"none", cursor:"pointer"});

const Label = ({children,auto,optional,note}) => (
  <div style={{display:"flex",alignItems:"baseline",gap:6,marginBottom:5}}>
    <span style={{fontSize:9,letterSpacing:2,color:C.muted,fontFamily:"'IBM Plex Mono',monospace",textTransform:"uppercase"}}>{children}</span>
    {auto     && <span style={{fontSize:8,background:C===THEME.dark?"#4d8aff22":"#1a4fd618",color:C.accentText,borderRadius:3,padding:"1px 5px",letterSpacing:1}}>AUTO</span>}
    {optional && <span style={{fontSize:8,background:C===THEME.dark?"#fbbf2422":"#92400e18",color:C.orange,borderRadius:3,padding:"1px 5px",letterSpacing:1}}>OPTIONAL</span>}
    {note     && <span style={{fontSize:8,color:C.muted,fontStyle:"italic"}}>{note}</span>}
  </div>
);
const Section = ({title,children,style={}}) => (
  <div style={{background:C.sectionBg,border:`1px solid ${C.borderHi}`,borderRadius:10,padding:"18px 20px",marginBottom:16,...style}}>
    <div style={{fontSize:9,letterSpacing:3,color:C.muted,fontFamily:"'IBM Plex Mono',monospace",marginBottom:14}}>{title}</div>
    {children}
  </div>
);
const Grid = ({cols=2,children,gap=14}) => (
  <div style={{display:"grid",gridTemplateColumns:`repeat(${cols},1fr)`,gap}}>{children}</div>
);
const Chip = ({active,children,onClick,color}) => {
  const ac=color||(active?C.accent:"#2a2a42");
  return <button onClick={onClick} style={{padding:"5px 12px",borderRadius:20,border:`1px solid ${active?ac:C.borderHi}`,background:active?ac+"22":C.card,color:active?ac:C.muted,fontSize:11,cursor:"pointer",fontFamily:"'IBM Plex Sans',sans-serif",whiteSpace:"nowrap"}}>{children}</button>;
};
const AutoTime = ({label,value,fieldKey,overrides,onOverride,note}) => {
  const ov=!!overrides[fieldKey];
  return (
    <div>
      <Label auto note={note}>{label}</Label>
      <div style={{display:"flex",gap:6}}>
        <input type="time" value={value} readOnly={!ov} onChange={e=>ov&&onOverride(fieldKey,e.target.value)}
          style={{...inp(ov,!ov),flex:1,color:value?C.text:C.muted}}/>
        <button onClick={()=>onOverride(fieldKey,ov?null:(value||nowTime()))}
          style={{background:ov?(C===THEME.dark?"#4d8aff22":"#1a4fd618"):C.card,border:`1px solid ${ov?C.accent:C.borderHi}`,color:ov?C.accentText:C.muted,borderRadius:6,padding:"0 10px",cursor:"pointer",fontSize:10,whiteSpace:"nowrap"}}>
          {ov?"✎ on":"✎"}
        </button>
      </div>
    </div>
  );
};
const STATUS = {
  "pending-pickup":{label:"Pending Pickup",colorKey:"orange"},
  "in-transit":    {label:"In Transit",    colorKey:"accent"},
  "delivered":     {label:"Delivered",     colorKey:"green"},
  "complete":      {label:"Transport Complete",colorKey:"purple"},
};
const Badge = ({s}) => {
  const m=STATUS[s]||{label:s,colorKey:"muted"};
  const col=C[m.colorKey]||C.muted;
  return <span style={{fontSize:9,color:col,background:col+"33",padding:"2px 8px",borderRadius:10,letterSpacing:1,fontFamily:"'IBM Plex Mono',monospace"}}>● {m.label.toUpperCase()}</span>;
};
const DB_COLS = [
  {key:"id",label:"Run ID"},{key:"timestamp",label:"Timestamp"},
  {key:"dateOfCallFromHospital",label:"Date of Call"},
  {key:"controllerName",label:"Controller"},
  {key:"originHospital",label:"Origin"},{key:"destinationHospital",label:"Destination"},
  {key:"riders",label:"Rider(s)",fmt:v=>Array.isArray(v)?v.join(", "):v},
  {key:"vehicleUsed",label:"Vehicle"},
  {key:"itemsTransported",label:"Items",fmt:v=>Array.isArray(v)?v.join(", "):v},
  {key:"numPackages",label:"Pkgs"},
  {key:"greenLights",label:"Green Lights",fmt:v=>v===true?"Yes":v===false?"No":"—"},
  {key:"riderCalled",label:"Rider Called"},{key:"pickupTime",label:"Pickup"},
  {key:"meetupTime",label:"Meet-up"},{key:"deliveryTime",label:"Delivery"},
  {key:"riderHome",label:"Rider Home"},{key:"completedAt",label:"Completed At"},
  {key:"contactName",label:"Contact"},{key:"contactPhone",label:"Phone"},
  {key:"notes",label:"Notes"},
];
const SheetTable = ({rows,emptyMsg}) => (
  <div style={{overflowX:"auto"}}>
    {rows.length===0
      ? <div style={{textAlign:"center",padding:"48px 0",color:C.muted,fontFamily:"'IBM Plex Mono',monospace",fontSize:11,letterSpacing:2}}>{emptyMsg}</div>
      : <table style={{width:"100%",borderCollapse:"collapse",fontSize:12,fontFamily:"'IBM Plex Sans',sans-serif"}}>
          <thead><tr style={{background:C.panel,borderBottom:`2px solid ${C.borderHi}`}}>
            {DB_COLS.map(col=><th key={col.key} style={{padding:"8px 12px",textAlign:"left",fontSize:9,letterSpacing:2,color:C.muted,fontFamily:"'IBM Plex Mono',monospace",whiteSpace:"nowrap",fontWeight:600}}>{col.label.toUpperCase()}</th>)}
          </tr></thead>
          <tbody>
            {rows.map((row,i)=>(
              <tr key={row.id} style={{background:i%2===0?C.card:C.tableAlt,borderBottom:`1px solid ${C.border}`}}>
                {DB_COLS.map(col=>{
                  const raw=row[col.key];
                  const val=col.fmt?col.fmt(raw??[]):raw||"—";
                  const isId=col.key==="id";
                  return <td key={col.key} style={{padding:"8px 12px",whiteSpace:col.key==="notes"?"normal":"nowrap",color:isId?C.accentText:C.text,fontFamily:isId?"'IBM Plex Mono',monospace":"inherit",fontSize:isId?11:12,maxWidth:col.key==="notes"?240:undefined}}>{val}</td>;
                })}
              </tr>
            ))}
          </tbody>
        </table>
    }
  </div>
);

// =============================================================================
// LOCATION FIELD
// =============================================================================
function LocationField({ label, value, onChange, options, exclude=[], onAdd }) {
  const [adding, setAdding] = useState(false);
  const [query,  setQuery]  = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [confirmVal, setConfirmVal] = useState(null);

  useEffect(()=>{
    if (!query.trim()) { setSuggestions([]); return; }
    const q = query.toLowerCase();
    setSuggestions(options.filter(o=>o.toLowerCase().includes(q) && !exclude.includes(o)));
  },[query, options, exclude]);

  const handleAdd = () => {
    const v = query.trim(); if (!v) return;
    const exact = options.find(o=>o.toLowerCase()===v.toLowerCase());
    if (exact) { onChange(exact); setAdding(false); setQuery(""); return; }
    setConfirmVal(v);
  };
  const confirmAdd = () => {
    onAdd(confirmVal); onChange(confirmVal);
    setAdding(false); setQuery(""); setConfirmVal(null);
  };

  return (
    <div>
      <Label>{label}</Label>
      {!adding ? (
        <div style={{display:"flex",gap:6}}>
          <select value={value} onChange={e=>onChange(e.target.value)} style={{...sel(),flex:1,width:"auto"}}>
            <option value="">— Select —</option>
            {options.filter(o=>!exclude.includes(o)).map(h=><option key={h}>{h}</option>)}
          </select>
          <button onClick={()=>setAdding(true)} style={{background:C.card,border:`1px solid ${C.borderHi}`,color:C.muted,borderRadius:6,padding:"0 12px",fontSize:11,cursor:"pointer",fontFamily:"'IBM Plex Mono',monospace",whiteSpace:"nowrap"}}>+ ADD</button>
        </div>
      ) : (
        <div>
          {confirmVal ? (
            <div style={{background:C.successBg,border:`1px solid ${C.green}`,borderRadius:7,padding:"10px 14px",display:"flex",justifyContent:"space-between",alignItems:"center",gap:8}}>
              <span style={{fontSize:13,color:C.text}}>Add <strong>"{confirmVal}"</strong> to the list?</span>
              <div style={{display:"flex",gap:6,flexShrink:0}}>
                <button onClick={confirmAdd} style={{background:C.green,color:C===THEME.dark?"#000":"#fff",border:"none",borderRadius:5,padding:"5px 12px",fontSize:11,cursor:"pointer",fontFamily:"'IBM Plex Mono',monospace",fontWeight:700}}>CONFIRM</button>
                <button onClick={()=>setConfirmVal(null)} style={{background:"none",border:`1px solid ${C.borderHi}`,color:C.muted,borderRadius:5,padding:"5px 8px",fontSize:11,cursor:"pointer"}}>✕</button>
              </div>
            </div>
          ) : (
            <div style={{position:"relative"}}>
              <div style={{display:"flex",gap:6}}>
                <input value={query} onChange={e=>setQuery(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleAdd()} placeholder="Type location name…" autoFocus style={{...inp(),flex:1,width:"auto"}}/>
                <button onClick={handleAdd} style={{background:C.accent,border:"none",color:"#fff",borderRadius:6,padding:"0 12px",fontSize:11,cursor:"pointer",fontFamily:"'IBM Plex Mono',monospace"}}>ADD</button>
                <button onClick={()=>{setAdding(false);setQuery("");setSuggestions([]);}} style={{background:"none",border:`1px solid ${C.borderHi}`,color:C.muted,borderRadius:6,padding:"0 10px",fontSize:11,cursor:"pointer"}}>✕</button>
              </div>
              {suggestions.length>0&&(
                <div style={{position:"absolute",top:"100%",left:0,right:80,background:C.panel,border:`1px solid ${C.borderHi}`,borderRadius:6,zIndex:50,marginTop:4,boxShadow:"0 4px 16px rgba(0,0,0,0.2)"}}>
                  <div style={{padding:"6px 14px",fontSize:10,color:C.muted,letterSpacing:1}}>SIMILAR EXISTING OPTIONS:</div>
                  {suggestions.map(s=>(
                    <div key={s} onClick={()=>{onChange(s);setAdding(false);setQuery("");setSuggestions([]);}}
                      style={{padding:"9px 14px",cursor:"pointer",fontSize:13,borderBottom:`1px solid ${C.border}`,color:C.text}}
                      onMouseEnter={e=>e.currentTarget.style.background=C===THEME.dark?"#2a2a40":"#eeeef8"}
                      onMouseLeave={e=>e.currentTarget.style.background="transparent"}>{s}</div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// =============================================================================
// RIDER DETAIL
// =============================================================================
function RiderDetail({ call:c, onBack, onPickup, onDropoff, onRiderHome, onNote }) {
  const [riderNote, setRiderNote] = useState("");
  const [noteSaved, setNoteSaved] = useState(false);

  const canPickup  = c.status==="pending-pickup";
  const canDropoff = c.status==="in-transit";
  const canHome    = c.status==="delivered";

  const InfoRow = ({label,value}) => value ? (
    <div style={{padding:"10px 0",borderBottom:`1px solid ${C.border}`}}>
      <div style={{fontSize:9,color:C.muted,letterSpacing:2,fontFamily:"'IBM Plex Mono',monospace",marginBottom:4}}>{label.toUpperCase()}</div>
      <div style={{fontSize:14,color:C.text,fontWeight:500}}>{value}</div>
    </div>
  ) : null;

  const TimeRow = ({label,val}) => (
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderBottom:`1px solid ${C.border}`}}>
      <span style={{fontSize:11,color:C.muted,fontFamily:"'IBM Plex Mono',monospace",letterSpacing:1}}>{label.toUpperCase()}</span>
      <span style={{fontSize:13,fontWeight:600,fontFamily:"'IBM Plex Mono',monospace",color:val?C.green:C.borderHi}}>{val?fmtTime(val):"—"}</span>
    </div>
  );

  const saveNote = () => {
    if (!riderNote.trim()) return;
    onNote(riderNote.trim());
    setRiderNote(""); setNoteSaved(true); setTimeout(()=>setNoteSaved(false),2000);
  };

  return (
    <div style={{flex:1,overflowY:"auto",display:"flex",flexDirection:"column"}}>
      <div style={{background:C.panel,borderBottom:`1px solid ${C.border}`,padding:"14px 24px",flexShrink:0}}>
        <button onClick={onBack} style={{background:"none",border:"none",color:C.muted,fontSize:12,cursor:"pointer",fontFamily:"'IBM Plex Mono',monospace",padding:0,marginBottom:6}}>← BACK</button>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div>
            <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:16,color:C.accentText,fontWeight:700}}>{c.id}</div>
            <div style={{marginTop:4}}><Badge s={c.status}/></div>
          </div>
          {c.greenLights===true&&(
            <div style={{background:C.green+"18",border:`1px solid ${C.green}55`,borderRadius:8,padding:"8px 14px"}}>
              <span style={{color:C.green,fontFamily:"'IBM Plex Mono',monospace",fontSize:11,fontWeight:700,letterSpacing:2}}>🟢 GREEN LIGHTS AUTH.</span>
            </div>
          )}
        </div>
      </div>
      <div style={{flex:1,overflowY:"auto",padding:24}}>
        <div style={{marginBottom:24,display:"flex",flexDirection:"column",gap:12}}>
          {canPickup&&<button onClick={onPickup} style={{background:C.accent,border:"none",color:"#fff",padding:"20px",borderRadius:12,fontSize:17,cursor:"pointer",fontFamily:"'IBM Plex Mono',monospace",fontWeight:700,letterSpacing:2,boxShadow:`0 0 30px ${C.accent}55`}}>⬆  PICKED UP</button>}
          {canDropoff&&<button onClick={onDropoff} style={{background:C.green,border:"none",color:C===THEME.dark?"#000":"#fff",padding:"20px",borderRadius:12,fontSize:17,cursor:"pointer",fontFamily:"'IBM Plex Mono',monospace",fontWeight:700,letterSpacing:2,boxShadow:`0 0 30px ${C.green}55`}}>✓  DROPPED OFF</button>}
          {(canHome||c.riderHome)&&<button onClick={canHome?onRiderHome:undefined} disabled={!!c.riderHome} style={{background:c.riderHome?C.card:C.orange,border:`1px solid ${c.riderHome?C.borderHi:"transparent"}`,color:c.riderHome?C.muted:C===THEME.dark?"#000":"#fff",padding:"20px",borderRadius:12,fontSize:17,cursor:c.riderHome?"default":"pointer",fontFamily:"'IBM Plex Mono',monospace",fontWeight:700,letterSpacing:2,boxShadow:c.riderHome?"none":`0 0 30px ${C.orange}55`}}>🏠  RIDER HOME{c.riderHome?` — ${fmtTime(c.riderHome)}`:""}</button>}
          {c.status==="delivered"&&<div style={{background:C.card,border:`1px solid ${C.borderHi}`,borderRadius:12,padding:"14px",textAlign:"center",color:C.muted,fontFamily:"'IBM Plex Mono',monospace",fontSize:12,letterSpacing:2}}>Waiting for controller to mark complete</div>}
        </div>
        <Section title="Run Details">
          <InfoRow label="Origin" value={c.originHospital}/>
          <InfoRow label="Destination" value={c.destinationHospital}/>
          <InfoRow label="Items Transported" value={Array.isArray(c.itemsTransported)?c.itemsTransported.join(", "):c.itemsTransported||null}/>
          <InfoRow label="Pick-up Address" value={c.pickupAddress||null}/>
          <InfoRow label="Drop-off Address" value={c.dropOffAddress||null}/>
          <InfoRow label="Vehicle" value={c.vehicleUsed||null}/>
        </Section>
        {((Array.isArray(c.meetOtherGroup)?c.meetOtherGroup.length>0:c.meetOtherGroup)||c.scheduledMeetupTime)&&(
          <Section title="Meet-up">
            <InfoRow label="Meet with" value={Array.isArray(c.meetOtherGroup)?c.meetOtherGroup.join(", ")||null:c.meetOtherGroup||null}/>
            <InfoRow label="Scheduled Meet-up Time" value={c.scheduledMeetupTime||null}/>
          </Section>
        )}
        {(c.contactName||c.contactPhone)&&(
          <Section title="Contact">
            <InfoRow label="Contact Name" value={c.contactName||null}/>
            <InfoRow label="Contact Phone" value={c.contactPhone?<a href={`tel:${c.contactPhone}`} style={{color:C.accentText,textDecoration:"none"}}>{c.contactPhone}</a>:null}/>
          </Section>
        )}
        <Section title="Timing">
          <TimeRow label="Rider Called" val={c.riderCalled}/>
          <TimeRow label="Picked Up"    val={c.pickupTime}/>
          <TimeRow label="Delivered"    val={c.deliveryTime}/>
          <TimeRow label="Rider Home"   val={c.riderHome}/>
        </Section>
        {c.notes&&<Section title="Dispatcher Notes"><div style={{fontSize:13,color:C.text,lineHeight:1.8,whiteSpace:"pre-line"}}>{c.notes}</div></Section>}
        <Section title="Add Note">
          <Label optional>Visible to controller</Label>
          <textarea value={riderNote} onChange={e=>setRiderNote(e.target.value)} rows={3}
            placeholder="Add a note for this run…"
            style={{...inp(),width:"100%",boxSizing:"border-box",resize:"vertical",lineHeight:1.7}}/>
          <div style={{display:"flex",gap:8,marginTop:10,alignItems:"center"}}>
            <button onClick={saveNote} style={{background:C.accent,border:"none",color:"#fff",padding:"8px 18px",borderRadius:6,fontSize:11,cursor:"pointer",fontFamily:"'IBM Plex Mono',monospace",fontWeight:700}}>SAVE NOTE</button>
            {noteSaved&&<span style={{fontSize:11,color:C.green,fontFamily:"'IBM Plex Mono',monospace"}}>✓ Saved</span>}
          </div>
        </Section>
      </div>
    </div>
  );
}

// =============================================================================
// ROLE SELECTION — shown to dual users after login
// =============================================================================
function RoleSelectScreen({ name, onSelect, onLogout }) {
  return (
    <div style={{background:C.bg,minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:24,fontFamily:"'IBM Plex Sans',sans-serif"}}>
      <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@400;500;600;700&display=swap" rel="stylesheet"/>
      <div style={{textAlign:"center",marginBottom:40}}>
        <img src="/logo.png" alt="Blood Bike West" style={{width:80,marginBottom:16}}/>
        <div style={{fontSize:20,fontWeight:700,letterSpacing:2,fontFamily:"'IBM Plex Mono',monospace",color:C.text}}>BLOOD BIKE WEST</div>
        <div style={{fontSize:10,color:C.muted,letterSpacing:4,marginTop:2}}>COMMAND CENTRE</div>
      </div>
      <div style={{background:C.card,border:`1px solid ${C.borderHi}`,borderRadius:12,padding:32,width:"100%",maxWidth:380,boxShadow:"0 4px 24px rgba(0,0,0,0.15)"}}>
        <div style={{fontSize:14,color:C.text,textAlign:"center",marginBottom:8,fontWeight:600}}>Welcome, {name}</div>
        <div style={{fontSize:12,color:C.muted,textAlign:"center",marginBottom:28}}>How would you like to access the app today?</div>
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          <button onClick={()=>onSelect("dispatcher")}
            style={{background:C.accent,border:"none",color:"#fff",padding:"18px",borderRadius:10,fontSize:14,cursor:"pointer",fontFamily:"'IBM Plex Mono',monospace",fontWeight:700,letterSpacing:1,boxShadow:`0 0 20px ${C.accent}44`}}>
            🎛  ACCESS AS CONTROLLER
          </button>
          <button onClick={()=>onSelect("rider")}
            style={{background:C===THEME.dark?"#1a1a2e":"#f0f0f8",border:`2px solid ${C.borderHi}`,color:C.text,padding:"18px",borderRadius:10,fontSize:14,cursor:"pointer",fontFamily:"'IBM Plex Mono',monospace",fontWeight:700,letterSpacing:1}}>
            🏍  ACCESS AS RIDER
          </button>
        </div>
      </div>
      <button onClick={onLogout} style={{marginTop:24,background:"none",border:"none",color:C.muted,fontSize:11,cursor:"pointer",fontFamily:"'IBM Plex Mono',monospace",letterSpacing:1}}>SIGN OUT</button>
    </div>
  );
}

// =============================================================================
// LOGIN SCREEN
// =============================================================================
function LoginScreen({ onLogin }) {
  const [phone,   setPhone]   = useState("");
  const [errMsg,  setErrMsg]  = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    const normalized = normalizePhone(phone);
    if (!normalized) { setErrMsg("Please enter your phone number."); return; }
    setLoading(true); setErrMsg("");
    try {
      const res = await api("getUserRole", { phone: normalized });
      if (!res.found) { setErrMsg("Phone number not recognised. Please contact your administrator."); setLoading(false); return; }
      const session = { phone: normalized, role: res.role, name: res.name, controllers: res.controllers||[], riders: res.riders||[] };
      saveSession(session);
      onLogin(session);
      registerPushNotifications(normalized).catch(()=>{});
    } catch(e) {
      setErrMsg("Could not connect to server. Please try again.");
    }
    setLoading(false);
  };

  return (
    <div style={{background:C.bg,minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:24,fontFamily:"'IBM Plex Sans',sans-serif"}}>
      <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@400;500;600;700&display=swap" rel="stylesheet"/>
      <div style={{textAlign:"center",marginBottom:40}}>
        <img src="/logo.png" alt="Blood Bike West" style={{width:80,marginBottom:8}}/>
        <div style={{fontSize:20,fontWeight:700,letterSpacing:2,fontFamily:"'IBM Plex Mono',monospace",color:C.text}}>BLOOD BIKE WEST</div>
        <div style={{fontSize:10,color:C.muted,letterSpacing:4,marginTop:2}}>COMMAND CENTRE</div>
      </div>
      <div style={{background:C.card,border:`1px solid ${C.borderHi}`,borderRadius:12,padding:32,width:"100%",maxWidth:380,boxShadow:"0 4px 24px rgba(0,0,0,0.15)"}}>
        <div style={{fontSize:13,color:C.muted,marginBottom:24,lineHeight:1.7,textAlign:"center"}}>Enter your phone number to sign in.</div>
        {errMsg&&<div style={{background:C.errorBg,border:`1px solid ${C.red}`,borderRadius:7,padding:"10px 14px",marginBottom:16,fontSize:12,color:C.errorText}}>{errMsg}</div>}
        <Label>Phone Number</Label>
        <input type="tel" value={phone} onChange={e=>setPhone(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleLogin()} placeholder="e.g. 087 123 4567" style={{...inp(),width:"100%",marginBottom:14,fontSize:15}}/>
        <button onClick={handleLogin} disabled={loading} style={{width:"100%",background:loading?(C===THEME.dark?"#1a2a4a":"#9ab0e8"):C.accent,border:"none",color:"#fff",padding:"13px",borderRadius:8,fontSize:13,cursor:loading?"default":"pointer",fontFamily:"'IBM Plex Mono',monospace",fontWeight:700,letterSpacing:1}}>
          {loading?"CHECKING…":"SIGN IN"}
        </button>
      </div>
      <div style={{marginTop:20,fontSize:11,color:C.muted,textAlign:"center"}}>Not registered? Contact your Blood Bike West administrator.</div>
      {/iphone|ipad|ipod/i.test(navigator.userAgent) && !window.navigator.standalone && (
        <div style={{marginTop:20,background:C.hintBg,border:`1px solid ${C.borderHi}`,borderRadius:10,padding:"14px 18px",maxWidth:380,width:"100%",textAlign:"center"}}>
          <div style={{fontSize:12,color:C.muted,lineHeight:1.7}}>
            📲 <strong style={{color:C.text}}>Enable notifications on iPhone:</strong><br/>
            Tap <strong style={{color:C.text}}>Share</strong> → <strong style={{color:C.text}}>Add to Home Screen</strong><br/>
            Then open the app from your home screen.
          </div>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// MAIN APP
// =============================================================================
function MainApp({ session, onLogout }) {
  const { role, name, controllers, riders } = session;
  const [dash, setDash]               = useState(role==="rider"?"rider":"dispatcher");
  const [view, setView]               = useState(role==="rider"?"rider-list":"log");
  const [pendingDB, setPendingDB]     = useState([]);
  const [completedDB, setCompletedDB] = useState([]);
  const [form, setForm]               = useState({...EMPTY_CALL});
  const [hospitals,    setHospitals]    = useState([]);
  const [vehicles,     setVehicles]     = useState([]);
  const [meetups,      setMeetups]      = useState([]);
  const [itemPicklist, setItems]        = useState([]);
  const [dutyStatuses, setDutyStatuses] = useState([]);
  const [itemQuery,  setItemQ]    = useState("");
  const [itemSugg,   setItemSugg] = useState([]);
  const [confirmItem, setCI]      = useState(null);
  const [detailId,   setDetailId] = useState(null);
  const [toast,      setToast]    = useState(null);
  const [confirmComplete, setConfirmComplete] = useState(false);
  const [dbLoading,  setDbLoading] = useState(false);
  const [locLoading, setLocLoading] = useState(false);

  const notify = (msg,color=C.green) => { setToast({msg,color}); setTimeout(()=>setToast(null),3500); };
  const allCalls = [...pendingDB,...completedDB];
  const selectedCall = allCalls.find(x=>x.id===detailId)||null;

  useEffect(()=>{
    api("getLists").then(res=>{
      if(res.hospitals)    setHospitals(res.hospitals);
      if(res.items)        setItems(res.items);
      if(res.meetups)      setMeetups(res.meetups);
      if(res.vehicles)     setVehicles(res.vehicles);
      if(res.dutyStatuses) setDutyStatuses(res.dutyStatuses);
    }).catch(()=>{});
  },[]);

  const loadCalls = useCallback(async()=>{
    setDbLoading(true);
    try {
      const [pending,completed] = await Promise.all([api("getPendingCalls"),api("getCompletedCalls")]);
      setPendingDB(pending.rows||[]);
      setCompletedDB(completed.rows||[]);
    } catch(e){ notify("Could not load calls",C.red); }
    setDbLoading(false);
  },[]);

  useEffect(()=>{ loadCalls(); },[loadCalls]);
  useEffect(()=>{ const t=setInterval(loadCalls,30000); return ()=>clearInterval(t); },[loadCalls]);

  const patchCall = async(id,patch)=>{
    setPendingDB(prev=>prev.map(x=>x.id===id?{...x,...patch}:x));
    setCompletedDB(prev=>prev.map(x=>x.id===id?{...x,...patch}:x));
    try { await api("updateCall",{id,...patch}); }
    catch(e){ notify("Sync error — saved locally",C.orange); }
  };
  const patchField = (id,k,v) => patchCall(id,{[k]:v});

  const initiateNewCall = () => {
    const td=nowDate();
    setForm({...EMPTY_CALL,timestamp:nowDT(),riderCalled:nowTime(),transportDate:td,dateCallReceived:td,dateOfCallFromHospital:td,controllerName:name,meetOtherGroup:[],overrides:{}});
    setItemQ(""); setItemSugg([]); setCI(null);
    setView("newcall");
  };

  const fset = (k,v) => setForm(f=>({...f,[k]:v}));
  const ftog = (k,v) => setForm(f=>({...f,[k]:f[k].includes(v)?f[k].filter(x=>x!==v):[...f[k],v]}));
  const handleOverride = (fk,val) => {
    setForm(f=>{
      const ov={...f.overrides};
      if(val===null){delete ov[fk];return {...f,overrides:ov};}
      return {...f,[fk]:val,overrides:{...ov,[fk]:true}};
    });
  };
  useEffect(()=>{ if(!form.overrides?.dateCallReceived) setForm(f=>({...f,dateCallReceived:f.transportDate})); },[form.transportDate]);
  useEffect(()=>{
    if(!itemQuery.trim()){setItemSugg([]);return;}
    const q=itemQuery.toLowerCase();
    setItemSugg(itemPicklist.filter(i=>i.toLowerCase().includes(q)&&!form.itemsTransported.includes(i)));
    setCI(null);
  },[itemQuery,itemPicklist,form.itemsTransported]);

  const addItem = () => {
    const v=itemQuery.trim(); if(!v) return;
    const match=itemPicklist.find(i=>i.toLowerCase()===v.toLowerCase());
    if(match){if(!form.itemsTransported.includes(match))ftog("itemsTransported",match);setItemQ("");}
    else setCI(v);
  };
  const confirmAdd = () => {
    setItems(p=>[...p,confirmItem]);
    setForm(f=>({...f,itemsTransported:[...f.itemsTransported,confirmItem]}));
    setItemQ(""); setCI(null);
    notify(`"${confirmItem}" added to picklist`);
  };

  const REQUIRED = ["controllerName","originHospital","destinationHospital","riders","vehicleUsed"];
  const submitCall = async() => {
    const missing=REQUIRED.filter(k=>!form[k]||(Array.isArray(form[k])&&!form[k].length));
    if(missing.length){notify("Please complete all required fields",C.red);return;}
    const id=`RUN-${String(pendingDB.length+completedDB.length+1).padStart(4,"0")}`;
    const record={...form,id,status:"pending-pickup"};
    setPendingDB(prev=>[record,...prev]);
    setDetailId(id); setView("detail");
    notify(`${id} logged`);
    try { await api("addCall",{record}); }
    catch(e){ notify("Logged locally — sync error",C.orange); }
  };

  // Milestone triggers — get vehicle location from Velocity Fleet if vehicleReg present
  const getVehicleCoords = async (id) => {
    const call = allCalls.find(x=>x.id===id);
    if (!call || !call.vehicleReg || String(call.vehicleReg).trim()==="") return null;
    try {
      const res = await api("getVehicleLocation", { reg: call.vehicleReg });
      if (res.ok && res.lat && res.lng) return { lat: res.lat, lng: res.lng };
    } catch(e) {}
    return null;
  };

  const triggerPickup = async id => {
    const patch = {pickupTime:nowTime(), status:"in-transit"};
    const coords = await getVehicleCoords(id);
    if (coords) { patch.pickupLat = coords.lat; patch.pickupLng = coords.lng; }
    patchCall(id, patch);
    notify("Pickup recorded", C.accent);
  };

  const triggerDropoff = async id => {
    const patch = {meetupTime:nowTime(), deliveryTime:nowTime(), status:"delivered"};
    const coords = await getVehicleCoords(id);
    if (coords) { patch.dropoffLat = coords.lat; patch.dropoffLng = coords.lng; }
    patchCall(id, patch);
    notify("Delivery recorded ✓");
  };

  const triggerRiderHome = async id => {
    const patch = {riderHome:nowTime()};
    const coords = await getVehicleCoords(id);
    if (coords) { patch.riderHomeLat = coords.lat; patch.riderHomeLng = coords.lng; }
    patchCall(id, patch);
    notify("Rider home recorded");
  };

  // Live location — fetch from Velocity Fleet via Apps Script
  const openLiveLocation = async (vehicleReg) => {
    if (!vehicleReg) return;
    setLocLoading(true);
    try {
      const res = await api("getVehicleLocation", { reg: vehicleReg });
      if (res.error) {
        notify("Location unavailable: " + res.error, C.red);
      } else if (res.lat && res.lng) {
        window.open(`https://maps.google.com/?q=${res.lat},${res.lng}`, "_blank");
      } else {
        notify("No position data returned for this vehicle", C.orange);
      }
    } catch(e) {
      notify("Location fetch failed", C.red);
    }
    setLocLoading(false);
  };

  const markComplete = async(id) => {
    const call=pendingDB.find(x=>x.id===id); if(!call) return;
    const completedAt=nowDT();
    setPendingDB(prev=>prev.filter(x=>x.id!==id));
    setCompletedDB(prev=>[{...call,status:"complete",completedAt},...prev]);
    setConfirmComplete(false); setView("log");
    notify(`${id} → Completed`,C.purple);
    try { await api("completeCall",{id,completedAt}); }
    catch(e){ notify("Complete saved locally — sync error",C.orange); }
  };

  const isDispatcher = dash==="dispatcher";
  const NavBtn = ({v,children}) => (
    <button onClick={()=>setView(v)}
      style={{background:view===v?C.navActive:"none",border:"none",borderBottom:`2px solid ${view===v?C.accent:"transparent"}`,color:view===v?C.accentText:C.muted,padding:"14px 18px",fontSize:11,cursor:"pointer",fontFamily:"'IBM Plex Mono',monospace",letterSpacing:1,whiteSpace:"nowrap"}}>
      {children}
    </button>
  );

  const RunCard = ({rc, color, onClickView}) => (
    <div onClick={onClickView}
      style={{background:rc.status==="complete"?C.completedBg:C.card,border:`1px solid ${rc.status==="complete"?C.border:C.borderHi}`,borderRadius:10,padding:"13px 18px",marginBottom:8,cursor:"pointer",opacity:rc.status==="complete"?0.85:1}}
      onMouseEnter={e=>{e.currentTarget.style.opacity="1";e.currentTarget.style.borderColor=C.accent+"88";}}
      onMouseLeave={e=>{e.currentTarget.style.opacity=rc.status==="complete"?"0.85":"1";e.currentTarget.style.borderColor=rc.status==="complete"?C.border:C.borderHi;}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
        <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:12,color:color||C.accentText}}>{rc.id}</div>
        <Badge s={rc.status}/>
      </div>
      <div style={{fontSize:14,fontWeight:600,marginBottom:2,color:C.text}}>{rc.originHospital} <span style={{color:C.muted,fontWeight:400}}>→</span> {rc.destinationHospital}</div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:6}}>
        <div style={{fontSize:11,color:C.muted}}>{Array.isArray(rc.itemsTransported)?rc.itemsTransported.join(", "):rc.itemsTransported||"—"}</div>
        <div style={{fontSize:11,color:C.muted,textAlign:"right"}}>{Array.isArray(rc.riders)?rc.riders.join(", "):rc.riders||"—"}</div>
      </div>
      <div style={{fontSize:10,color:C.muted,marginTop:4,fontFamily:"'IBM Plex Mono',monospace"}}>{fmtDT(rc.status==="complete"?rc.completedAt:rc.timestamp)}</div>
    </div>
  );

  const vehicleNames = vehicles.map(v=>v.name);

  return (
    <div style={{fontFamily:"'IBM Plex Sans',sans-serif",background:C.bg,minHeight:"100vh",color:C.text,display:"flex",flexDirection:"column"}}>
      <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@400;500;600;700&display=swap" rel="stylesheet"/>

      {toast&&<div role="alert" style={{position:"fixed",top:16,right:16,background:toast.color,color:"#fff",padding:"10px 20px",borderRadius:7,fontSize:13,zIndex:9999,boxShadow:"0 4px 24px rgba(0,0,0,0.3)",fontFamily:"'IBM Plex Mono',monospace"}}>{toast.msg}</div>}

      {/* Header */}
      <div style={{background:C.panel,borderBottom:`1px solid ${C.border}`,padding:"0 16px",height:56,display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0,gap:8}}>
        <div style={{display:"flex",alignItems:"center",gap:8,minWidth:0}}>
          <img src="/logo.png" alt="Blood Bike West logo" style={{width:32,height:32,objectFit:"contain",flexShrink:0}}/>
          <div style={{minWidth:0}}>
            <div style={{fontSize:13,fontWeight:700,letterSpacing:2,fontFamily:"'IBM Plex Mono',monospace",color:C.text,whiteSpace:"nowrap"}}>BLOOD BIKE WEST</div>
            <div style={{fontSize:8,color:C.muted,letterSpacing:3}}>COMMAND CENTRE</div>
          </div>
        </div>
        {isDispatcher&&<button onClick={initiateNewCall} style={{background:C.accent,border:"none",color:"#fff",padding:"8px 14px",borderRadius:7,fontSize:11,cursor:"pointer",fontFamily:"'IBM Plex Mono',monospace",fontWeight:700,letterSpacing:1,flexShrink:0}}>+ NEW CALL</button>}
        <div style={{display:"flex",alignItems:"center",gap:8,flexShrink:0}}>
          <div style={{textAlign:"right"}}>
            <div style={{fontSize:11,color:C.text,maxWidth:80,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{name}</div>
            <button onClick={()=>{clearSession();onLogout();}} style={{background:"none",border:"none",color:C.muted,fontSize:10,cursor:"pointer",fontFamily:"'IBM Plex Mono',monospace",padding:0,letterSpacing:1}}>SIGN OUT</button>
          </div>
        </div>
      </div>

      {/* Dispatcher sub-nav */}
      {isDispatcher&&view!=="newcall"&&view!=="detail"&&(
        <div style={{background:C.panel,borderBottom:`1px solid ${C.border}`,display:"flex",paddingLeft:8,flexShrink:0}}>
          <NavBtn v="log">RUN LOG</NavBtn>
          {dbLoading&&<div style={{marginLeft:"auto",padding:"14px 18px",fontSize:10,color:C.muted,fontFamily:"'IBM Plex Mono',monospace"}}>⟳ syncing…</div>}
        </div>
      )}

      {/* ── RUN LOG ── */}
      {isDispatcher&&view==="log"&&(
        <div style={{flex:1,padding:16,overflowY:"auto"}}>
          {pendingDB.length===0?(
            <div style={{textAlign:"center",paddingTop:80}}>
              <div style={{fontSize:48,marginBottom:12}}>📋</div>
              <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:12,letterSpacing:2,color:C.muted}}>NO ACTIVE RUNS</div>
              <div style={{fontSize:12,color:C.muted,marginTop:6}}>Press <strong style={{color:C.accent}}>+ NEW CALL</strong> to begin</div>
            </div>
          ):(
            <>
              <div style={{fontSize:9,letterSpacing:3,color:C.orange,fontFamily:"'IBM Plex Mono',monospace",marginBottom:10}}>ACTIVE — {pendingDB.length} RUN{pendingDB.length!==1?"S":""}</div>
              {pendingDB.map(rc=><RunCard key={rc.id} rc={rc} color={C.accentText} onClickView={()=>{setDetailId(rc.id);setView("detail");}}/>)}
            </>
          )}
        </div>
      )}

      {/* ── NEW CALL FORM ── */}
      {isDispatcher&&view==="newcall"&&(
        <div style={{flex:1,overflowY:"auto",padding:16,maxWidth:920,margin:"0 auto",width:"100%",boxSizing:"border-box"}}>
          {confirmItem&&(
            <div style={{background:C.successBg,border:`1px solid ${C.green}`,borderRadius:8,padding:"12px 16px",marginBottom:16,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <span style={{fontSize:13,color:C.text}}>Add <strong>"{confirmItem}"</strong> to the picklist?</span>
              <div style={{display:"flex",gap:8}}>
                <button onClick={confirmAdd} style={{background:C.green,color:C===THEME.dark?"#000":"#fff",border:"none",borderRadius:5,padding:"6px 16px",fontSize:11,cursor:"pointer",fontFamily:"'IBM Plex Mono',monospace",fontWeight:700}}>CONFIRM & ADD</button>
                <button onClick={()=>setCI(null)} style={{background:"none",border:`1px solid ${C.borderHi}`,color:C.muted,borderRadius:5,padding:"6px 12px",fontSize:11,cursor:"pointer",fontFamily:"'IBM Plex Mono',monospace"}}>CANCEL</button>
              </div>
            </div>
          )}
          <div style={{fontSize:10,color:C.muted,fontFamily:"'IBM Plex Mono',monospace",letterSpacing:2,marginBottom:18}}>NEW CALL — * REQUIRED FIELDS</div>

          <Section title="Call Metadata">
            <Grid cols={2}>
              <div><Label auto>Timestamp</Label><input value={form.timestamp} readOnly style={{...inp(false,true),width:"100%"}}/></div>
              <div><Label>Time of Call from Hospital *</Label><input type="time" value={form.timeOfCall} onChange={e=>fset("timeOfCall",e.target.value)} style={{...inp(),width:"100%"}}/></div>
              <div><Label note="defaults to today">Date of Call from Hospital</Label><input type="date" value={form.dateOfCallFromHospital} onChange={e=>fset("dateOfCallFromHospital",e.target.value)} style={{...inp(),width:"100%"}}/></div>
              <div><Label>Controller Name *</Label>
                <select value={form.controllerName} onChange={e=>fset("controllerName",e.target.value)} style={{...sel(),width:"100%"}}>
                  <option value="">— Select —</option>
                  {controllers.map((ctrl,i)=><option key={i}>{String(ctrl.name||ctrl)}</option>)}
                </select>
              </div>
              <div><Label>Transport Date *</Label><input type="date" value={form.transportDate} onChange={e=>fset("transportDate",e.target.value)} style={{...inp(),width:"100%"}}/></div>
              <div>
                <Label auto note="syncs to transport date">Date Call Received</Label>
                <input type="date" value={form.dateCallReceived} onChange={e=>fset("dateCallReceived",e.target.value)} style={{...inp(),width:"100%"}}/>
              </div>
            </Grid>
          </Section>

          <Section title="Route">
            <Grid cols={1}>
              <LocationField label="Origin *" value={form.originHospital} onChange={v=>fset("originHospital",v)} options={hospitals} exclude={[form.destinationHospital]} onAdd={v=>{ setHospitals(p=>[...p,v].sort()); api("addToList",{sheet:"OriginDestination",value:v}).catch(()=>{}); notify(`"${v}" added`); }}/>
              <LocationField label="Destination *" value={form.destinationHospital} onChange={v=>fset("destinationHospital",v)} options={hospitals} exclude={[form.originHospital]} onAdd={v=>{ setHospitals(p=>[...p,v].sort()); api("addToList",{sheet:"OriginDestination",value:v}).catch(()=>{}); notify(`"${v}" added`); }}/>
            </Grid>
          </Section>

          <Section title="Items Transported">
            <div style={{display:"flex",flexWrap:"wrap",gap:7,marginBottom:14}}>
              {itemPicklist.map(item=><Chip key={item} active={form.itemsTransported.includes(item)} onClick={()=>ftog("itemsTransported",item)}>{form.itemsTransported.includes(item)?"✓ ":""}{item}</Chip>)}
            </div>
            <div style={{position:"relative"}}>
              <Label optional note="type to search or add new">Custom Item</Label>
              <div style={{display:"flex",gap:6}}>
                <input value={itemQuery} onChange={e=>setItemQ(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addItem()} placeholder="Type item name…" style={{...inp(),flex:1,width:"auto"}}/>
                <button onClick={addItem} style={{background:C.card,border:`1px solid ${C.borderHi}`,color:C.muted,borderRadius:6,padding:"0 14px",fontSize:11,cursor:"pointer",fontFamily:"'IBM Plex Mono',monospace"}}>ADD</button>
              </div>
              {itemSugg.length>0&&(
                <div style={{position:"absolute",top:"100%",left:0,right:70,background:C.panel,border:`1px solid ${C.borderHi}`,borderRadius:6,zIndex:50,marginTop:4,boxShadow:"0 4px 16px rgba(0,0,0,0.2)"}}>
                  {itemSugg.map(s=><div key={s} onClick={()=>{ftog("itemsTransported",s);setItemQ("");}} style={{padding:"9px 14px",cursor:"pointer",fontSize:13,borderBottom:`1px solid ${C.border}`,color:C.text}} onMouseEnter={e=>e.currentTarget.style.background=C===THEME.dark?"#2a2a40":"#eeeef8"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>{s}</div>)}
                </div>
              )}
            </div>
            {form.itemsTransported.length>0&&<div style={{marginTop:10,display:"flex",flexWrap:"wrap",gap:6}}>{form.itemsTransported.map(i=><span key={i} style={{background:C.accent+"22",color:C.accentText,border:`1px solid ${C.accent}44`,borderRadius:12,padding:"3px 10px",fontSize:11}}>{i} <span onClick={()=>ftog("itemsTransported",i)} style={{cursor:"pointer",marginLeft:4,color:C.red}}>×</span></span>)}</div>}
            <div style={{marginTop:14}}><Label>Number of Packages</Label><input type="number" min="0" value={form.numPackages} onChange={e=>fset("numPackages",e.target.value)} placeholder="0" style={{...inp(),width:120}}/></div>
          </Section>

          <Section title="Crew & Vehicle">
            <Grid cols={1} gap={12}>
              <div><Label>Rider *</Label>
                <select value={form.riders[0]||""} onChange={e=>fset("riders",e.target.value?[e.target.value]:[])} style={{...sel(),width:"100%"}}>
                  <option value="">— Select Rider —</option>
                  {riders.map((r,i)=><option key={i}>{String(r.name||r)}</option>)}
                </select>
              </div>
              <div><Label>Rider Duty Status</Label><select value={form.riderDutyStatus} onChange={e=>fset("riderDutyStatus",e.target.value)} style={{...sel(),width:"100%"}}><option value="">— Select —</option>{dutyStatuses.map(s=><option key={s}>{s}</option>)}</select></div>
              <div><Label>Vehicle Used *</Label>
                <select value={form.vehicleUsed} onChange={e=>{
                  const selectedName = e.target.value;
                  const v = vehicles.find(x=>x.name===selectedName);
                  fset("vehicleUsed", selectedName);
                  fset("vehicleReg", v ? v.reg : "");
                }} style={{...sel(),width:"100%"}}>
                  <option value="">— Select Vehicle —</option>
                  {vehicleNames.map(v=><option key={v}>{v}</option>)}
                </select>
              </div>
              <div>
                <Label>Meet with Other Group</Label>
                <div style={{display:"flex",flexWrap:"wrap",gap:7,marginTop:4}}>
                  {meetups.map(g=>{
                    const active=Array.isArray(form.meetOtherGroup)&&form.meetOtherGroup.includes(g);
                    return <Chip key={g} active={active} onClick={()=>{
                      const cur=Array.isArray(form.meetOtherGroup)?form.meetOtherGroup:[];
                      fset("meetOtherGroup",active?cur.filter(x=>x!==g):[...cur,g]);
                    }}>{active?"✓ ":""}{g}</Chip>;
                  })}
                </div>
              </div>
              <Grid cols={2}>
                <div><Label optional>Scheduled Meet-up Date</Label><input type="date" value={form.scheduledMeetupDate||nowDate()} onChange={e=>fset("scheduledMeetupDate",e.target.value)} style={{...inp(),width:"100%"}}/></div>
                <div><Label optional>Scheduled Meet-up Time</Label><input type="time" value={form.scheduledMeetupTime} onChange={e=>fset("scheduledMeetupTime",e.target.value)} style={{...inp(),width:"100%"}}/></div>
              </Grid>
            </Grid>
          </Section>

          <Section title="Authorisation">
            <Label>Green Lights Authorised *</Label>
            <div style={{display:"flex",gap:10,marginTop:4}}>
              {[true,false].map(val=><button key={String(val)} onClick={()=>fset("greenLights",val)} style={{padding:"8px 24px",borderRadius:7,border:`1px solid ${form.greenLights===val?(val?C.green:C.red):C.borderHi}`,background:form.greenLights===val?(val?C.green+"22":C.red+"22"):C.card,color:form.greenLights===val?(val?C.green:C.red):C.muted,fontSize:12,cursor:"pointer",fontFamily:"'IBM Plex Mono',monospace",fontWeight:700}}>{val?"✓  YES":"✕  NO"}</button>)}
            </div>
          </Section>

          <Section title="Optional Details">
            <Grid cols={1} gap={12}>
              <div><Label optional>Contact Name</Label><input value={form.contactName} onChange={e=>fset("contactName",e.target.value)} placeholder="Name of contact" style={{...inp(),width:"100%"}}/></div>
              <div><Label optional>Contact Phone Number</Label><input type="tel" value={form.contactPhone} onChange={e=>fset("contactPhone",e.target.value)} placeholder="+353…" style={{...inp(),width:"100%"}}/></div>
              <div><Label optional>Pick-up Address</Label><input value={form.pickupAddress} onChange={e=>fset("pickupAddress",e.target.value)} placeholder="Street address / dept" style={{...inp(),width:"100%"}}/></div>
              <div><Label optional>Drop-off Address</Label><input value={form.dropOffAddress} onChange={e=>fset("dropOffAddress",e.target.value)} placeholder="Street address / dept" style={{...inp(),width:"100%"}}/></div>
            </Grid>
          </Section>

          <Section title="Timing — Auto-Captured (Override Available)">
            <Grid cols={2}>
              <AutoTime label="Rider Called" value={form.riderCalled} fieldKey="riderCalled" overrides={form.overrides} onOverride={handleOverride} note="auto on New Call"/>
              <AutoTime label="Pickup Time" value={form.pickupTime} fieldKey="pickupTime" overrides={form.overrides} onOverride={handleOverride} note="auto on Picked Up"/>
              <AutoTime label="Meet-up Time (actual)" value={form.meetupTime} fieldKey="meetupTime" overrides={form.overrides} onOverride={handleOverride} note="auto on Dropped Off"/>
              <AutoTime label="Delivery Time" value={form.deliveryTime} fieldKey="deliveryTime" overrides={form.overrides} onOverride={handleOverride} note="auto on Dropped Off"/>
              <AutoTime label="Rider Home" value={form.riderHome} fieldKey="riderHome" overrides={form.overrides} onOverride={handleOverride} note="auto on Rider Home"/>
            </Grid>
          </Section>

          <Section title="Other Details / Notes">
            <textarea value={form.notes} onChange={e=>fset("notes",e.target.value)} rows={3} placeholder="Additional details, special instructions, observations…" style={{...inp(),width:"100%",boxSizing:"border-box",resize:"vertical",lineHeight:1.7}}/>
          </Section>

          <div style={{display:"flex",gap:10,marginBottom:40}}>
            <button onClick={submitCall} style={{flex:1,background:C.accent,border:"none",color:"#fff",padding:"14px",borderRadius:8,fontSize:13,cursor:"pointer",fontFamily:"'IBM Plex Mono',monospace",fontWeight:700,letterSpacing:1}}>LOG CALL & OPEN RUN</button>
            <button onClick={()=>setView("log")} style={{background:"none",border:`1px solid ${C.borderHi}`,color:C.muted,padding:"14px 22px",borderRadius:8,fontSize:12,cursor:"pointer",fontFamily:"'IBM Plex Mono',monospace"}}>CANCEL</button>
          </div>
        </div>
      )}

      {/* ── DISPATCHER DETAIL ── */}
      {isDispatcher&&view==="detail"&&selectedCall&&(()=>{
        const sc=selectedCall;
        const isCompleted=sc.status==="complete";
        const showLocationBtn = !isCompleted && sc.vehicleReg && String(sc.vehicleReg).trim() !== "";

        const EditRow=({label,fieldKey,type="text",children,readOnly:ro=false,fmt})=>{
          const [editing,setEditing]=useState(false);
          const [val,setVal]=useState(sc[fieldKey]||"");
          useEffect(()=>setVal(sc[fieldKey]||""),[sc[fieldKey]]);
          const save=()=>{patchField(sc.id,fieldKey,val);setEditing(false);notify("Saved",C.accent);};
          if(children||ro) return <div style={{display:"flex",gap:12,padding:"9px 0",borderBottom:`1px solid ${C.border}`,alignItems:"center"}}><div style={{width:160,fontSize:10,color:C.muted,letterSpacing:1,fontFamily:"'IBM Plex Mono',monospace",flexShrink:0}}>{label.toUpperCase()}</div><div style={{fontSize:13,color:C.text,flex:1}}>{children||(fmt?fmt(sc[fieldKey]):sc[fieldKey])||"—"}</div></div>;
          return <div style={{display:"flex",gap:12,padding:"9px 0",borderBottom:`1px solid ${C.border}`,alignItems:"center"}}>
            <div style={{width:160,fontSize:10,color:C.muted,letterSpacing:1,fontFamily:"'IBM Plex Mono',monospace",flexShrink:0}}>{label.toUpperCase()}</div>
            {editing
              ?<div style={{display:"flex",gap:6,flex:1}}><input type={type} value={type==="date"?fmtDate(val):type==="time"?fmtTime(val):val} onChange={e=>setVal(e.target.value)} autoFocus style={{...inp(true),flex:1,width:"auto"}} onKeyDown={e=>{if(e.key==="Enter")save();if(e.key==="Escape")setEditing(false);}}/><button onClick={save} style={{background:C.green,color:C===THEME.dark?"#000":"#fff",border:"none",borderRadius:5,padding:"0 12px",cursor:"pointer",fontSize:11,fontFamily:"'IBM Plex Mono',monospace"}}>SAVE</button><button onClick={()=>setEditing(false)} style={{background:"none",border:`1px solid ${C.borderHi}`,color:C.muted,borderRadius:5,padding:"0 10px",cursor:"pointer",fontSize:11}}>✕</button></div>
              :<div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"space-between"}}><span style={{fontSize:13,color:val?C.text:C.muted}}>{fmt?fmt(val):val||"—"}</span>{!isCompleted&&<button onClick={()=>setEditing(true)} style={{background:"none",border:`1px solid ${C.borderHi}`,color:C.muted,borderRadius:5,padding:"3px 10px",cursor:"pointer",fontSize:10,fontFamily:"'IBM Plex Mono',monospace"}}>✎ edit</button>}</div>}
          </div>;
        };
        const TimingRow=({label,fieldKey,note})=>{
          const val=allCalls.find(x=>x.id===sc.id)?.[fieldKey]||"";
          const [ov,setOv]=useState(false);
          const [ovVal,setOvVal]=useState(val);
          useEffect(()=>setOvVal(val),[val]);
          const saveOv=()=>{patchField(sc.id,fieldKey,ovVal);setOv(false);notify("Override saved",C.accent);};
          return <div style={{display:"flex",gap:12,padding:"9px 0",borderBottom:`1px solid ${C.border}`,alignItems:"center"}}>
            <div style={{width:160,fontSize:10,color:C.muted,letterSpacing:1,fontFamily:"'IBM Plex Mono',monospace",flexShrink:0}}>{label.toUpperCase()}</div>
            {ov?<div style={{display:"flex",gap:6,flex:1}}><input type="time" value={ovVal} onChange={e=>setOvVal(e.target.value)} autoFocus style={{...inp(true),width:120}}/><button onClick={saveOv} style={{background:C.green,color:C===THEME.dark?"#000":"#fff",border:"none",borderRadius:5,padding:"0 12px",cursor:"pointer",fontSize:11,fontFamily:"'IBM Plex Mono',monospace"}}>SAVE</button><button onClick={()=>setOv(false)} style={{background:"none",border:`1px solid ${C.borderHi}`,color:C.muted,borderRadius:5,padding:"0 10px",cursor:"pointer",fontSize:11}}>✕</button></div>
            :<div style={{display:"flex",alignItems:"center",gap:10,flex:1}}><span style={{fontSize:14,fontWeight:600,fontFamily:"'IBM Plex Mono',monospace",color:val?C.text:C.borderHi}}>{val?fmtTime(val):"pending…"}</span>{val&&<span style={{fontSize:9,color:C.green,background:C.green+"22",padding:"1px 6px",borderRadius:8}}>RECORDED</span>}{note&&!val&&<span style={{fontSize:9,color:C.muted,fontStyle:"italic"}}>{note}</span>}{!isCompleted&&<button onClick={()=>setOv(true)} style={{marginLeft:"auto",background:"none",border:`1px solid ${C.borderHi}`,color:C.muted,borderRadius:5,padding:"3px 10px",cursor:"pointer",fontSize:10,fontFamily:"'IBM Plex Mono',monospace"}}>✎ override</button>}</div>}
          </div>;
        };
        return (
          <div style={{flex:1,overflowY:"auto",padding:16,maxWidth:900,margin:"0 auto",width:"100%",boxSizing:"border-box"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:20,gap:12}}>
              <div><button onClick={()=>setView("log")} style={{background:"none",border:"none",color:C.muted,fontSize:12,cursor:"pointer",fontFamily:"'IBM Plex Mono',monospace",padding:0,marginBottom:6}}>← BACK TO LOG</button><div style={{fontSize:22,fontWeight:700,fontFamily:"'IBM Plex Mono',monospace",color:isCompleted?C.purple:C.accentText}}>{sc.id}</div><div style={{marginTop:6}}><Badge s={sc.status}/></div>{isCompleted&&<div style={{fontSize:11,color:C.muted,marginTop:4}}>Completed {sc.completedAt}</div>}</div>
              {!isCompleted&&(!confirmComplete
                ?<button onClick={()=>setConfirmComplete(true)} style={{background:C.purple,border:"none",color:"#fff",padding:"10px 16px",borderRadius:8,fontSize:11,cursor:"pointer",fontFamily:"'IBM Plex Mono',monospace",fontWeight:700,letterSpacing:1,boxShadow:`0 0 20px ${C.purple}44`,flexShrink:0}}>✓ MARK COMPLETE</button>
                :<div style={{background:C.confirmBg,border:`1px solid ${C.purple}`,borderRadius:10,padding:"14px 18px",textAlign:"center",minWidth:200}}><div style={{fontSize:12,color:C.text,marginBottom:10,fontFamily:"'IBM Plex Mono',monospace"}}>Move to Completed Calls?</div><div style={{fontSize:11,color:C.muted,marginBottom:14}}>This will archive the record.</div><div style={{display:"flex",gap:8}}><button onClick={()=>markComplete(sc.id)} style={{flex:1,background:C.purple,border:"none",color:"#fff",padding:"8px",borderRadius:6,fontSize:12,cursor:"pointer",fontFamily:"'IBM Plex Mono',monospace",fontWeight:700}}>CONFIRM</button><button onClick={()=>setConfirmComplete(false)} style={{flex:1,background:"none",border:`1px solid ${C.borderHi}`,color:C.muted,padding:"8px",borderRadius:6,fontSize:12,cursor:"pointer",fontFamily:"'IBM Plex Mono',monospace"}}>CANCEL</button></div></div>
              )}
            </div>
            <Section title="Call Metadata">
              <EditRow label="Timestamp" readOnly><span>{fmtDT(sc.timestamp)}</span></EditRow>
              <EditRow label="Time of Call" fieldKey="timeOfCall" type="time" fmt={fmtTime}/>
              <EditRow label="Date of Call" fieldKey="dateOfCallFromHospital" type="date" fmt={fmtDate}/>
              <EditRow label="Controller" fieldKey="controllerName"/>
              <EditRow label="Transport Date" fieldKey="transportDate" type="date" fmt={fmtDate}/>
              <EditRow label="Date Call Received" fieldKey="dateCallReceived" type="date" fmt={fmtDate}/>
              <EditRow label="Rider Called" readOnly><span style={{fontFamily:"'IBM Plex Mono',monospace"}}>{fmtTime(sc.riderCalled)}</span></EditRow>
            </Section>
            <Section title="Route">
              <EditRow label="Origin" readOnly><span>{sc.originHospital}</span></EditRow>
              <EditRow label="Destination" readOnly><span>{sc.destinationHospital}</span></EditRow>
              <EditRow label="Items" readOnly><span>{Array.isArray(sc.itemsTransported)?sc.itemsTransported.join(", "):sc.itemsTransported||"—"}</span></EditRow>
              <EditRow label="No. of Packages" fieldKey="numPackages" type="number"/>
              <EditRow label="Pick-up Address" fieldKey="pickupAddress"/>
              <EditRow label="Drop-off Address" fieldKey="dropOffAddress"/>
            </Section>
            <Section title="Contact">
              <EditRow label="Contact Name" fieldKey="contactName"/>
              <EditRow label="Contact Phone" fieldKey="contactPhone" type="tel"/>
            </Section>
            <Section title="Crew & Vehicle">
              <EditRow label="Rider(s)" readOnly><span>{Array.isArray(sc.riders)?sc.riders.join(", "):sc.riders||"—"}</span></EditRow>
              <EditRow label="Duty Status" readOnly><span>{sc.riderDutyStatus||"—"}</span></EditRow>
              <EditRow label="Vehicle" readOnly><span>{sc.vehicleUsed||"—"}</span></EditRow>
              {showLocationBtn&&(
                <div style={{display:"flex",gap:12,padding:"9px 0",borderBottom:`1px solid ${C.border}`,alignItems:"center"}}>
                  <div style={{width:160,fontSize:10,color:C.muted,letterSpacing:1,fontFamily:"'IBM Plex Mono',monospace",flexShrink:0}}>LIVE LOCATION</div>
                  <button
                    onClick={()=>openLiveLocation(sc.vehicleReg)}
                    disabled={locLoading}
                    style={{background:locLoading?C.card:C.accent,border:`1px solid ${locLoading?C.borderHi:C.accent}`,color:locLoading?C.muted:"#fff",borderRadius:7,padding:"8px 16px",fontSize:12,cursor:locLoading?"default":"pointer",fontFamily:"'IBM Plex Mono',monospace",fontWeight:700,letterSpacing:1}}>
                    {locLoading?"⟳ FETCHING…":"📍 VIEW ON MAP"}
                  </button>
                </div>
              )}
              <EditRow label="Meet Other Group" readOnly><span>{Array.isArray(sc.meetOtherGroup)?sc.meetOtherGroup.join(", ")||"—":sc.meetOtherGroup||"—"}</span></EditRow>
              <EditRow label="Meet-up Date" fieldKey="scheduledMeetupDate" type="date" fmt={fmtDate}/>
              <EditRow label="Meet-up Time" fieldKey="scheduledMeetupTime" type="time" fmt={fmtTime}/>
              <EditRow label="Green Lights" readOnly><span style={{color:sc.greenLights===true?C.green:sc.greenLights===false?C.red:C.muted}}>{sc.greenLights===true?"✓ YES":sc.greenLights===false?"✕ NO":"—"}</span></EditRow>
            </Section>
            <Section title="Timing Log">
              <TimingRow label="Rider Called"   fieldKey="riderCalled"/>
              <TimingRow label="Pickup Time"    fieldKey="pickupTime"    note="triggers on rider Picked Up"/>
              <EditRow   label="Scheduled Meet-up" fieldKey="scheduledMeetupTime" type="time" fmt={fmtTime}/>
              <TimingRow label="Actual Meet-up" fieldKey="meetupTime"    note="triggers on rider Dropped Off"/>
              <TimingRow label="Delivery Time"  fieldKey="deliveryTime"  note="triggers on rider Dropped Off"/>
              <TimingRow label="Rider Home"     fieldKey="riderHome"     note="triggers on rider Rider Home"/>
              {isCompleted&&<TimingRow label="Completed At" fieldKey="completedAt"/>}
            </Section>
            {sc.notes&&<Section title="Notes"><div style={{fontSize:13,color:C.text,lineHeight:1.8}}>{sc.notes}</div></Section>}
          </div>
        );
      })()}

      {/* ── RIDER LIST ── */}
      {!isDispatcher&&view==="rider-list"&&(()=>{
        const isMyRun=rc=>{
          const assigned=Array.isArray(rc.riders)?rc.riders:typeof rc.riders==="string"?[rc.riders]:[];
          return assigned.length===0||assigned.some(r=>r.trim()===name.trim());
        };
        const myActive=pendingDB.filter(isMyRun);
        return (
          <div style={{flex:1,padding:16,overflowY:"auto"}}>
            {myActive.length===0?(
              <div style={{textAlign:"center",paddingTop:80}}>
                <div style={{fontSize:48,marginBottom:10}}>🏍</div>
                <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:12,letterSpacing:2,color:C.muted}}>NO ACTIVE RUNS</div>
              </div>
            ):(
              <>
                <div style={{fontSize:9,letterSpacing:3,color:C.orange,fontFamily:"'IBM Plex Mono',monospace",marginBottom:10}}>ACTIVE — {myActive.length} RUN{myActive.length!==1?"S":""}</div>
                {myActive.map(rc=><RunCard key={rc.id} rc={rc} color={C.accentText} onClickView={()=>{setDetailId(rc.id);setView("rider-detail");}}/>)}
              </>
            )}
          </div>
        );
      })()}

      {/* ── RIDER DETAIL ── */}
      {!isDispatcher&&view==="rider-detail"&&selectedCall&&(
        <RiderDetail
          call={selectedCall}
          onBack={()=>setView("rider-list")}
          onPickup={()=>triggerPickup(selectedCall.id)}
          onDropoff={()=>triggerDropoff(selectedCall.id)}
          onRiderHome={()=>triggerRiderHome(selectedCall.id)}
          onNote={(note)=>{
            const updated=(selectedCall.notes?selectedCall.notes+"\n\n":"")+`[Rider ${nowTime()}]: `+note;
            patchCall(selectedCall.id,{notes:updated});
          }}
        />
      )}
    </div>
  );
}

// =============================================================================
// ROOT
// =============================================================================
export default function App() {
  const theme = useTheme();
  C = theme;

  const [session, setSession] = useState(null);
  const [checking, setChecking] = useState(true);
  const [selectedRole, setSelectedRole] = useState(null);

  useEffect(()=>{
    try {
      const saved = loadSession();
      if (saved && saved.role && saved.name) {
        setSession(saved);
        if (saved.phone) registerPushNotifications(saved.phone).catch(()=>{});
      } else {
        clearSession();
      }
    } catch(e) {
      clearSession();
    }
    setChecking(false);
  },[]);

  if (checking) return (
    <div style={{background:theme.bg,minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'IBM Plex Mono',monospace",color:theme.muted,fontSize:12,letterSpacing:2}}>
      <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400&display=swap" rel="stylesheet"/>
      LOADING…
    </div>
  );

  if (!session) return <LoginScreen onLogin={setSession}/>;

  // Dual users must choose their role each session
  if (session.role === "dual user" && !selectedRole) {
    return (
      <RoleSelectScreen
        name={session.name}
        onSelect={setSelectedRole}
        onLogout={()=>{ clearSession(); setSession(null); }}
      />
    );
  }

  // Determine effective role: dual users use their selection, others use their assigned role
  const effectiveSession = session.role === "dual user"
    ? { ...session, role: selectedRole === "dispatcher" ? "controller" : "rider" }
    : session;

  return <MainApp session={effectiveSession} onLogout={()=>{ clearSession(); setSession(null); setSelectedRole(null); }}/>;
}
