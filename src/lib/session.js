// Phone normalisation + session persistence (localStorage, until sign-out).

export const normalizePhone = (p) => String(p).replace(/[\s\-()+]/g, "").trim();

const SESSION_KEY = "bbw_session";

export const saveSession = (data) =>
  localStorage.setItem(SESSION_KEY, JSON.stringify(data));

export const loadSession = () => {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY)) || null;
  } catch { return null; }
};

export const clearSession = () => localStorage.removeItem(SESSION_KEY);
