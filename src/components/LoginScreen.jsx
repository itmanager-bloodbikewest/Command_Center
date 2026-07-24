import { useState } from "react";
import { useC, isDark } from "../lib/theme.jsx";
import { Label, inp } from "../ui/primitives.jsx";
import { api } from "../lib/api.js";
import { normalizePhone, saveSession } from "../lib/session.js";

const ROTA_URL = import.meta.env.VITE_ROTA_APPS_SCRIPT_URL;

// Call Rota's Apps Script login action (phone + password → token + user).
// Rota expects flat GET params: action=login&phone=...&password=...&env=...
async function rotaLogin(phone, password) {
  const url = new URL(ROTA_URL);
  url.searchParams.set("action", "login");
  url.searchParams.set("phone", phone);
  url.searchParams.set("password", password);
  url.searchParams.set("env", window.location.hostname.startsWith("dev.") ? "dev" : "prod");
  const res = await fetch(url.toString(), { method: "GET", redirect: "follow" });
  const text = await res.text();
  try { return JSON.parse(text); }
  catch { throw new Error("Invalid response from auth server"); }
}

export default function LoginScreen({ onLogin }) {
  const C = useC();
  const [phone,    setPhone]    = useState("");
  const [password, setPassword] = useState("");
  const [errMsg,   setErrMsg]   = useState("");
  const [loading,  setLoading]  = useState(false);

  const handleLogin = async () => {
    const normalized = normalizePhone(phone);
    if (!normalized)    { setErrMsg("Please enter your phone number."); return; }
    if (!password.trim()) { setErrMsg("Please enter your password.");     return; }
    setLoading(true); setErrMsg("");
    try {
      // Step 1 — authenticate via Rota's backend (password check + token)
      const auth = await rotaLogin(normalized, password.trim());
      if (!auth.success) {
        setErrMsg(auth.message || "Incorrect phone number or password.");
        setLoading(false); return;
      }

      // Step 2 — get CC role + roster data from CC's own backend
      const roleRes = await api("getUserRole", { phone: normalized });
      if (!roleRes.found) {
        setErrMsg("Authenticated but no Command Centre role found. Contact your administrator.");
        setLoading(false); return;
      }

      // Step 3 — build session and write shared cookie
      const session = {
        phone:        normalized,
        name:         roleRes.name  || auth.user?.name || normalized,
        role:         roleRes.role,
        token:        auth.token    || null,
        isController: !!roleRes.isController,
        isRider:      !!roleRes.isRider,
        isAdmin:      !!roleRes.isAdmin,
        // controllers/riders intentionally omitted — fetched at runtime
      };
      saveSession(session);
      onLogin(session);
    } catch (e) {
      setErrMsg("Could not connect to server. Please try again.");
    }
    setLoading(false);
  };

  const onKey = (e) => { if (e.key === "Enter") handleLogin(); };

  return (
    <div style={{ background: C.bg, minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24, fontFamily: "'Atkinson Hyperlegible','IBM Plex Sans',sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
      <div style={{ textAlign: "center", marginBottom: 40 }}>
        <img src="/logo.png" alt="Blood Bike West" style={{ width: 80, marginBottom: 8 }} />
        <h1 style={{ fontSize: 20, fontWeight: 700, letterSpacing: 2, fontFamily: "'IBM Plex Mono',monospace", color: C.text, margin: 0 }}>BLOOD BIKE WEST</h1>
        <div style={{ fontSize: 10, color: C.muted, letterSpacing: 4, marginTop: 2 }}>COMMAND CENTRE</div>
      </div>
      <div style={{ background: C.card, border: `1px solid ${C.borderHi}`, borderRadius: 12, padding: 32, width: "100%", maxWidth: 380, boxShadow: "0 4px 24px rgba(0,0,0,0.15)" }}>
        <div style={{ fontSize: 13, color: C.muted, marginBottom: 24, lineHeight: 1.7, textAlign: "center" }}>
          Sign in with your Blood Bike West credentials.
        </div>
        {errMsg && (
          <div role="alert" style={{ background: C.errorBg, border: `1px solid ${C.red}`, borderRadius: 7, padding: "10px 14px", marginBottom: 16, fontSize: 12, color: C.errorText }}>
            {errMsg}
          </div>
        )}
        <div style={{ marginBottom: 14 }}>
          <Label>Phone number</Label>
          <input type="tel" aria-label="Phone number" value={phone} onChange={(e) => setPhone(e.target.value)}
            onKeyDown={onKey} placeholder="e.g. 087 123 4567"
            style={{ ...inp(C), width: "100%", fontSize: 15 }} />
        </div>
        <div style={{ marginBottom: 20 }}>
          <Label>Password</Label>
          <input type="password" aria-label="Password" value={password} onChange={(e) => setPassword(e.target.value)}
            onKeyDown={onKey} placeholder="Your team password"
            style={{ ...inp(C), width: "100%", fontSize: 15 }} />
        </div>
        <button onClick={handleLogin} disabled={loading}
          style={{ width: "100%", background: loading ? (isDark(C) ? "#1a2a4a" : "#9ab0e8") : C.accent, border: "none", color: "#fff", padding: "13px", borderRadius: 8, fontSize: 13, cursor: loading ? "default" : "pointer", fontFamily: "'IBM Plex Mono',monospace", fontWeight: 700, letterSpacing: 1 }}>
          {loading ? "CHECKING…" : "SIGN IN"}
        </button>
      </div>
      <div style={{ marginTop: 20, fontSize: 11, color: C.muted, textAlign: "center" }}>
        Not registered? Contact your Blood Bike West administrator.
      </div>
    </div>
  );
}
