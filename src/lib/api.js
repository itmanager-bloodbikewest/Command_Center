// Backend access (Google Apps Script).

const APPS_SCRIPT_URL = import.meta.env.VITE_APPS_SCRIPT_URL;

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
