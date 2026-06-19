// Phone normalisation + session persistence (localStorage, 2h TTL).

export const normalizePhone = (p) => String(p).replace(/[\s\-()+]/g, "").trim();

const SESSION_KEY = "bbw_session";
const SESSION_TTL = 2 * 60 * 60 * 1000;

export const saveSession = (data) =>
  localStorage.setItem(SESSION_KEY, JSON.stringify({ ...data, savedAt: Date.now() }));

export const loadSession = () => {
  try {
    const s = JSON.parse(localStorage.getItem(SESSION_KEY));
    if (!s) return null;
    if (Date.now() - s.savedAt > SESSION_TTL) { localStorage.removeItem(SESSION_KEY); return null; }
    const { savedAt, ...session } = s;
    return session;
  } catch { return null; }
};

export const clearSession = () => localStorage.removeItem(SESSION_KEY);
