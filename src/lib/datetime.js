// Date/time helpers — all times in Europe/Dublin, 24h.

const TZ = "Europe/Dublin";
const timeOpts = { timeZone: TZ, hour: "2-digit", minute: "2-digit", hour12: false };

export const nowTime = () => new Date().toLocaleTimeString("en-IE", timeOpts);

export const nowDate = () =>
  new Date()
    .toLocaleDateString("en-IE", { timeZone: TZ })
    .split("/").reverse().join("-")
    .replace(/(\d{4})-(\d{1,2})-(\d{1,2})/, (_, y, m, d) => `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`);

export const nowDT = () => `${nowDate()} ${nowTime()}`;

export const fmtTime = (v) => {
  if (!v) return "—";
  const s = String(v);
  if (/^\d{2}:\d{2}$/.test(s)) return s;
  if (s.includes("T")) { const d = new Date(s); if (!isNaN(d)) return d.toLocaleTimeString("en-IE", timeOpts); }
  if (s.startsWith("1899-12-30") || s.startsWith("1899-12-31")) { const d = new Date(s); if (!isNaN(d)) return d.toLocaleTimeString("en-IE", timeOpts); }
  return s.slice(0, 5);
};

export const fmtDate = (v) => {
  if (!v) return "—";
  const s = String(v);
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  if (s.includes("T")) return s.slice(0, 10);
  return s.slice(0, 10);
};

export const fmtDT = (v) => {
  if (!v) return "—";
  const s = String(v);
  if (s.includes("T") || s.includes("Z")) {
    const d = new Date(s);
    if (!isNaN(d)) return `${d.toLocaleDateString("en-IE", { timeZone: TZ })} ${d.toLocaleTimeString("en-IE", timeOpts)}`;
  }
  return s;
};
