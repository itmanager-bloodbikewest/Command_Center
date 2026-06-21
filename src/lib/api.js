// Backend access (Google Apps Script) + Firebase push registration.

const APPS_SCRIPT_URL = import.meta.env.VITE_APPS_SCRIPT_URL;
const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY;
const FIREBASE_CONFIG = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
};

// Run data is routed by the address the app is served from: dev hosts use the
// TEST tabs, everything else is production. Default is production so a real run
// is never silently written to a test tab.
const DEV_HOSTS = ["dev.app.bloodbikewest.ie", "dev--bloodbwcommandcenter.netlify.app"];
const RUN_ENV =
  typeof window !== "undefined" && DEV_HOSTS.includes(window.location.hostname)
    ? "dev"
    : "production";

export async function api(action, payload = {}) {
  const url = new URL(APPS_SCRIPT_URL);
  url.searchParams.set("action", action);
  if (Object.keys(payload).length > 0) url.searchParams.set("data", JSON.stringify(payload));
  url.searchParams.set("env", RUN_ENV);
  const res = await fetch(url.toString(), { method: "GET", redirect: "follow" });
  const text = await res.text();
  try { return JSON.parse(text); }
  catch { throw new Error("Invalid response: " + text.slice(0, 100)); }
}

export async function registerPushNotifications(phone) {
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
