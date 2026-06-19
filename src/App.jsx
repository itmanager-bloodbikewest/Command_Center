import { useState, useEffect } from "react";
import { ThemeProvider, useC } from "./lib/theme.jsx";
import { loadSession, clearSession } from "./lib/session.js";
import { registerPushNotifications } from "./lib/api.js";
import LoginScreen from "./components/LoginScreen.jsx";
import MainApp from "./MainApp.jsx";

function AppGate() {
  const C = useC();
  const [session, setSession] = useState(null);
  const [checking, setChecking] = useState(true);

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

  if (checking)
    return (
      <div style={{ background: C.bg, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'IBM Plex Mono',monospace", color: C.muted, fontSize: 12, letterSpacing: 2 }}>
        <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400&display=swap" rel="stylesheet" />
        LOADING…
      </div>
    );

  if (!session) return <LoginScreen onLogin={setSession} />;
  return <MainApp session={session} onLogout={() => setSession(null)} />;
}

export default function App() {
  return (
    <ThemeProvider>
      <AppGate />
    </ThemeProvider>
  );
}
