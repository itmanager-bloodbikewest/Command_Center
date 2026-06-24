import { useState, useEffect } from "react";
import { useC } from "../lib/theme.jsx";

const DISMISS_KEY = "bbw_install_dismissed";

const isStandalone = () =>
  (window.matchMedia && window.matchMedia("(display-mode: standalone)").matches) ||
  window.navigator.standalone === true;

const isIOS = () =>
  /iphone|ipad|ipod/i.test(window.navigator.userAgent || "") && !window.MSStream;

// One-time "Add to home screen" prompt, shown after sign-in.
// - Android/Chrome: a working button that triggers the native install dialog
//   (via the captured beforeinstallprompt event).
// - iOS/Safari: manual Share -> Add to Home Screen instructions (no API exists).
// - Desktop / already-installed / previously-dismissed: nothing is shown.
// Dismissal is remembered per-device in localStorage.
export default function InstallPrompt() {
  const C = useC();
  const [deferred, setDeferred] = useState(null);
  const [platform, setPlatform] = useState(null); // 'android' | 'ios'
  const [show, setShow] = useState(false);

  useEffect(() => {
    let dismissed = false;
    try { dismissed = localStorage.getItem(DISMISS_KEY) === "1"; } catch { /* ignore */ }
    if (dismissed || isStandalone()) return;

    if (isIOS()) {
      setPlatform("ios");
      setShow(true);
      return;
    }

    const onBeforeInstall = (e) => {
      e.preventDefault();
      setDeferred(e);
      setPlatform("android");
      setShow(true);
    };
    const onInstalled = () => { remember(); setShow(false); };

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const remember = () => { try { localStorage.setItem(DISMISS_KEY, "1"); } catch { /* ignore */ } };
  const dismiss = () => { remember(); setShow(false); };

  const install = async () => {
    if (!deferred) return;
    deferred.prompt();
    try { await deferred.userChoice; } catch { /* ignore */ }
    dismiss();
  };

  if (!show || !platform) return null;

  const btn = {
    width: "100%", border: "none", borderRadius: 8, padding: "13px",
    fontSize: 15, fontWeight: 700, cursor: "pointer",
    fontFamily: "'Atkinson Hyperlegible','IBM Plex Sans',sans-serif",
  };

  return (
    <div role="dialog" aria-modal="true" aria-label="Add to home screen"
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 4000, padding: 18 }}>
      <div style={{ background: C.panel, border: `1px solid ${C.borderHi}`, borderRadius: 16, padding: "22px 20px 18px", width: "100%", maxWidth: 380, boxShadow: "0 12px 48px rgba(0,0,0,0.45)" }}>
        <div style={{ textAlign: "center", fontSize: 34, marginBottom: 8 }} aria-hidden="true">📲</div>
        <div style={{ textAlign: "center", fontSize: 18, fontWeight: 700, color: C.text, marginBottom: 10, fontFamily: "'Atkinson Hyperlegible','IBM Plex Sans',sans-serif" }}>
          Add to home screen
        </div>

        {platform === "android" ? (
          <>
            <p style={{ fontSize: 14, color: C.text, textAlign: "center", lineHeight: 1.6, margin: "0 0 18px" }}>
              Install the Command Centre for one-tap, full-screen access — it opens just like an app.
            </p>
            <button onClick={install} style={{ ...btn, background: C.accent, color: "#fff", marginBottom: 8 }}>
              Add to home screen
            </button>
          </>
        ) : (
          <>
            <p style={{ fontSize: 14, color: C.text, textAlign: "center", lineHeight: 1.6, margin: "0 0 14px" }}>
              For one-tap, full-screen access, add the Command Centre to your home screen:
            </p>
            <ol style={{ fontSize: 14, color: C.text, lineHeight: 1.7, margin: "0 0 18px", paddingLeft: 20 }}>
              <li>Tap the Share button <span aria-hidden="true">（↑）</span> in Safari's toolbar.</li>
              <li>Scroll down and tap <strong>Add to Home Screen</strong>.</li>
              <li>Tap <strong>Add</strong>.</li>
            </ol>
          </>
        )}

        <button onClick={dismiss} style={{ ...btn, background: "none", border: `1px solid ${C.borderHi}`, color: C.muted }}>
          Maybe later
        </button>
      </div>
    </div>
  );
}
