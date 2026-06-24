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
  if (v === null || v === undefined) return "—";
  const s = String(v).trim();
  if (!s) return "—";
  if (/^\d{1,2}:\d{2}$/.test(s)) return s.length === 4 ? "0" + s : s;            // H:MM / HH:MM
  if (s.includes("T")) {                                                          // ISO / sheet time-serial
    const t = s.split("T")[1] || "";
    const m = t.match(/^(\d{2}):(\d{2})/);
    if (m) return `${m[1]}:${m[2]}`;                                              // take clock time literally
  }
  const d = new Date(s);
  if (!isNaN(d)) return d.toLocaleTimeString("en-IE", timeOpts);
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
