import { useState } from "react";
import { useC } from "../lib/theme.jsx";
import { Label, inp } from "../ui/primitives.jsx";
import { isDark } from "../lib/theme.jsx";
import { api, registerPushNotifications } from "../lib/api.js";
import { normalizePhone, saveSession } from "../lib/session.js";

export default function LoginScreen({ onLogin }) {
  const C = useC();
  const [phone, setPhone] = useState("");
  const [errMsg, setErrMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    const normalized = normalizePhone(phone);
    if (!normalized) { setErrMsg("Please enter your phone number."); return; }
    setLoading(true); setErrMsg("");
    try {
      const res = await api("getUserRole", { phone: normalized });
      if (!res.found) { setErrMsg("Phone number not recognised. Please contact your administrator."); setLoading(false); return; }
      const session = { phone: normalized, role: res.role, name: res.name, controllers: res.controllers || [], riders: res.riders || [], isController: !!res.isController, isRider: !!res.isRider, isAdmin: !!res.isAdmin };
      saveSession(session);
      onLogin(session);
      registerPushNotifications(normalized).catch(() => {});
    } catch {
      setErrMsg("Could not connect to server. Please try again.");
    }
    setLoading(false);
  };

  return (
    <div style={{ background: C.bg, minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24, fontFamily: "'IBM Plex Sans',sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
      <div style={{ textAlign: "center", marginBottom: 40 }}>
        <img src="/logo.png" alt="Blood Bike West" style={{ width: 80, marginBottom: 8 }} />
        <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: 2, fontFamily: "'IBM Plex Mono',monospace", color: C.text }}>BLOOD BIKE WEST</div>
        <div style={{ fontSize: 10, color: C.muted, letterSpacing: 4, marginTop: 2 }}>COMMAND CENTRE</div>
      </div>
      <div style={{ background: C.card, border: `1px solid ${C.borderHi}`, borderRadius: 12, padding: 32, width: "100%", maxWidth: 380, boxShadow: "0 4px 24px rgba(0,0,0,0.15)" }}>
        <div style={{ fontSize: 13, color: C.muted, marginBottom: 24, lineHeight: 1.7, textAlign: "center" }}>Enter your phone number to sign in.</div>
        {errMsg && <div style={{ background: C.errorBg, border: `1px solid ${C.red}`, borderRadius: 7, padding: "10px 14px", marginBottom: 16, fontSize: 12, color: C.errorText }}>{errMsg}</div>}
        <Label>Phone Number</Label>
        <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleLogin()} placeholder="e.g. 087 123 4567" style={{ ...inp(C), width: "100%", marginBottom: 14, fontSize: 15 }} />
        <button onClick={handleLogin} disabled={loading} style={{ width: "100%", background: loading ? (isDark(C) ? "#1a2a4a" : "#9ab0e8") : C.accent, border: "none", color: "#fff", padding: "13px", borderRadius: 8, fontSize: 13, cursor: loading ? "default" : "pointer", fontFamily: "'IBM Plex Mono',monospace", fontWeight: 700, letterSpacing: 1 }}>
          {loading ? "CHECKING…" : "SIGN IN"}
        </button>
      </div>
      <div style={{ marginTop: 20, fontSize: 11, color: C.muted, textAlign: "center" }}>Not registered? Contact your Blood Bike West administrator.</div>
      {/iphone|ipad|ipod/i.test(navigator.userAgent) && !window.navigator.standalone && (
        <div style={{ marginTop: 20, background: C.hintBg, border: `1px solid ${C.borderHi}`, borderRadius: 10, padding: "14px 18px", maxWidth: 380, width: "100%", textAlign: "center" }}>
          <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.7 }}>
            📲 <strong style={{ color: C.text }}>Enable notifications on iPhone:</strong><br />
            Tap <strong style={{ color: C.text }}>Share</strong> → <strong style={{ color: C.text }}>Add to Home Screen</strong><br />
            Then open the app from your home screen.
          </div>
        </div>
      )}
    </div>
  );
}
