// =============================================================================
// BLOOD BIKE WEST — COMMAND CENTRE — Entry point
// Thin shell: session handling + theme + routing to LoginScreen / MainApp
// All app logic lives in src/MainApp.jsx and supporting files.
// =============================================================================

import { useState, useEffect } from "react";
import { ThemeProvider, useC } from "./lib/theme.jsx";
import { loadSession, clearSession, saveSession } from "./lib/session.js";
import { api } from "./lib/api.js";
import LoginScreen from "./components/LoginScreen.jsx";
import MainApp from "./MainApp.jsx";

async function registerPushNotifications(phone) {
  try {
    if (!("serviceWorker" in navigator) || !("Notification" in window)) return;
    if (Notification.permission === "denied") return;
    const reg = await navigator.serviceWorker.register("/firebase-messaging-sw.js");
    const permission = await Notification.requestPermission();
    if (permission !== "granted") return;
    const { initializeApp, getApps } = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js");
    const { getMessaging, getToken } = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging.js");
    const FIREBASE_CONFIG = {
      apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
      authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
      projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
      appId:             import.meta.env.VITE_FIREBASE_APP_ID,
    };
    const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY;
    const app = getApps().length ? getApps()[0] : initializeApp(FIREBASE_CONFIG);
    const messaging = getMessaging(app);
    const token = await getToken(messaging, { vapidKey: VAPID_KEY, serviceWorkerRegistration: reg });
    if (token) await api("saveFcmToken", { phone, token });
  } catch (e) {
    console.warn("Push notification setup failed:", e.message);
  }
}

// Role selection screen — shown to dual users before entering the app.
function RoleSelectScreen({ name, onSelect, onLogout }) {
  const C = useC();
  const isDk = C.bg === "#090910";
  return (
    <div style={{ background: C.bg, minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24, fontFamily: "'Atkinson Hyperlegible','IBM Plex Sans',sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
      <div style={{ textAlign: "center", marginBottom: 40 }}>
        <img src="/logo.png" alt="Blood Bike West" style={{ width: 80, marginBottom: 16 }} />
        <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: 2, fontFamily: "'IBM Plex Mono',monospace", color: C.text }}>BLOOD BIKE WEST</div>
        <div style={{ fontSize: 10, color: C.muted, letterSpacing: 4, marginTop: 2 }}>COMMAND CENTRE</div>
      </div>
      <div style={{ background: C.card, border: `1px solid ${C.borderHi}`, borderRadius: 12, padding: 32, width: "100%", maxWidth: 380, boxShadow: "0 4px 24px rgba(0,0,0,0.15)" }}>
        <div style={{ fontSize: 14, color: C.text, textAlign: "center", marginBottom: 8, fontWeight: 700 }}>Welcome, {name}</div>
        <div style={{ fontSize: 13, color: C.muted, textAlign: "center", marginBottom: 28 }}>How would you like to access the app today?</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <button onClick={() => onSelect("control")}
            style={{ background: C.accent, border: "none", color: "#fff", padding: "18px", borderRadius: 10, fontSize: 15, cursor: "pointer", fontFamily: "'Atkinson Hyperlegible','IBM Plex Sans',sans-serif", fontWeight: 700, boxShadow: `0 0 20px ${C.accent}44` }}>
            🎛  Access as Controller
          </button>
          <button onClick={() => onSelect("rider")}
            style={{ background: isDk ? "#1a1a2e" : "#f0f0f8", border: `2px solid ${C.borderHi}`, color: C.text, padding: "18px", borderRadius: 10, fontSize: 15, cursor: "pointer", fontFamily: "'Atkinson Hyperlegible','IBM Plex Sans',sans-serif", fontWeight: 700 }}>
            🏍  Access as Rider
          </button>
        </div>
      </div>
      <button onClick={onLogout} style={{ marginTop: 24, background: "none", border: "none", color: C.muted, fontSize: 11, cursor: "pointer", fontFamily: "'IBM Plex Mono',monospace", letterSpacing: 1 }}>SIGN OUT</button>
    </div>
  );
}

function AppGate() {
  const C = useC();
  const [session,      setSession]      = useState(null);
  const [checking,     setChecking]     = useState(true);
  const [selectedDash, setSelectedDash] = useState(null); // for dual users

  useEffect(() => {
    try {
      const saved = loadSession();
      if (saved && saved.role && saved.name) {
        setSession(saved);
        if (saved.phone) registerPushNotifications(saved.phone).catch(() => {});
      } else {
        clearSession();
      }
    } catch {
      clearSession();
    }
    setChecking(false);
  }, []);

  const handleLogin = (sess) => {
    saveSession(sess);
    setSession(sess);
    if (sess.phone) registerPushNotifications(sess.phone).catch(() => {});
  };

  const handleLogout = () => {
    clearSession();
    setSession(null);
    setSelectedDash(null);
  };

  if (checking) return (
    <div style={{ background: C.bg, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'IBM Plex Mono',monospace", color: C.muted, fontSize: 12, letterSpacing: 2 }}>
      <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400&display=swap" rel="stylesheet" />
      LOADING…
    </div>
  );

  if (!session) return <LoginScreen onLogin={handleLogin} />;

  // Dual users choose their role fresh each session
  const isDual = session.role === "dual user";
  if (isDual && !selectedDash) {
    return (
      <RoleSelectScreen
        name={session.name}
        onSelect={setSelectedDash}
        onLogout={handleLogout}
      />
    );
  }

  // Build an effective session with explicit capability flags
  const effectiveSession = isDual
    ? {
        ...session,
        role:         selectedDash === "control" ? "controller" : "rider",
        isController: selectedDash === "control",
        isRider:      selectedDash === "rider",
        isAdmin:      false,
      }
    : {
        ...session,
        isController: session.isController ?? (session.role === "controller"),
        isRider:      session.isRider      ?? (session.role === "rider"),
        isAdmin:      session.isAdmin      ?? (session.role === "admin"),
      };

  return <MainApp session={effectiveSession} onLogout={handleLogout} />;
}

export default function App() {
  return (
    <ThemeProvider>
      <AppGate />
    </ThemeProvider>
  );
}
