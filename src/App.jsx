import { useState, useEffect } from "react";
import { ThemeProvider, useC } from "./lib/theme.jsx";
import { loadSession, clearSession } from "./lib/session.js";
import LoginScreen from "./components/LoginScreen.jsx";
import MainApp from "./MainApp.jsx";

// Global, app-wide accessibility styles (covers login, loading, and main app):
//  - visible keyboard focus everywhere (overrides any inline outline:none)
//  - mobile (<=520px) reading mode for dyslexic users: Atkinson Hyperlegible,
//    relaxed line-height, no letter-spacing, no CSS uppercasing, 16px controls
//    (also stops iOS auto-zoom on focus)
//  - respects prefers-reduced-motion
function GlobalA11yStyles() {
  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible:ital,wght@0,400;0,700;1,400&display=swap" rel="stylesheet" />
      <style>{`
        .sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}
        :focus-visible{outline:3px solid #4d8aff !important;outline-offset:2px !important;border-radius:3px}
        @media (prefers-reduced-motion: reduce){*,*::before,*::after{transition:none !important;animation:none !important}}
        @media (max-width:520px){
          #root,#root *{font-family:'Atkinson Hyperlegible',sans-serif !important;letter-spacing:normal !important;text-transform:none !important;line-height:1.6}
          #root button{min-height:40px}
          #root input,#root select,#root textarea{font-size:16px !important}
        }
      `}</style>
    </>
  );
}

function AppGate() {
  const C = useC();
  const [session, setSession] = useState(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    try {
      const saved = loadSession();
      if (saved && saved.role && saved.name) {
        setSession(saved);
      } else {
        clearSession();
      }
    } catch {
      clearSession();
    }
    setChecking(false);
  }, []);

  return (
    <>
      <GlobalA11yStyles />
      {checking ? (
        <div role="status" aria-live="polite" style={{ background: C.bg, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'IBM Plex Mono',monospace", color: C.muted, fontSize: 12, letterSpacing: 2 }}>
          <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400&display=swap" rel="stylesheet" />
          LOADING…
        </div>
      ) : !session ? (
        <LoginScreen onLogin={setSession} />
      ) : (
        <MainApp session={session} onLogout={() => setSession(null)} />
      )}
    </>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppGate />
    </ThemeProvider>
  );
}
