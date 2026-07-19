// Session persistence — shared cross-subdomain cookie scoped to
// .bloodbikewest.ie so Hub, Rota, and Command Centre all share one identity.
// Falls back to a host-only cookie on any other origin (e.g. local dev).
//
// Cookie payload is kept lean (name, phone, role, token only) — including
// full controller/rider roster arrays would exceed the ~4KB cookie limit.
// Each app fetches its own roster data separately on load.

export const normalizePhone = (p) => String(p).replace(/[\s\-()+]/g, "").trim();

const SESSION_COOKIE = "bbw_session";
const COOKIE_DAYS    = 365; // persistent until explicit sign-out

function cookieDomain() {
  return typeof window !== "undefined" &&
    window.location.hostname.endsWith("bloodbikewest.ie")
    ? ".bloodbikewest.ie"
    : "";
}

function setCookie(name, value, days) {
  const domain = cookieDomain();
  let str = `${name}=${encodeURIComponent(value)}; path=/; max-age=${days * 24 * 60 * 60}; SameSite=Lax; Secure`;
  if (domain) str += `; domain=${domain}`;
  document.cookie = str;
}

function getCookie(name) {
  const m = document.cookie.match(new RegExp("(?:^|; )" + name + "=([^;]*)"));
  return m ? decodeURIComponent(m[1]) : null;
}

function deleteCookie(name) {
  const domain = cookieDomain();
  let str = `${name}=; path=/; max-age=0; SameSite=Lax; Secure`;
  if (domain) str += `; domain=${domain}`;
  document.cookie = str;
}

// Save session — only stores lean payload in cookie.
// controllers/riders are NOT stored here; MainApp fetches them via getLists.
export const saveSession = (data) => {
  const payload = {
    name:  data.name,
    phone: data.phone,
    role:  data.role,
    token: data.token || null,
  };
  setCookie(SESSION_COOKIE, JSON.stringify(payload), COOKIE_DAYS);
};

export const loadSession = () => {
  try {
    const raw = getCookie(SESSION_COOKIE);
    if (!raw) return null;
    const s = JSON.parse(raw);
    if (!s || !s.role || !s.name) return null;
    return s;
  } catch { return null; }
};

// Clears the shared cookie — logs out of Hub, Rota, and Command Centre.
export const clearSession = () => deleteCookie(SESSION_COOKIE);
