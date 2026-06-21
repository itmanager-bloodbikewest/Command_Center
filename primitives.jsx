import { useC } from "../lib/theme.jsx";

// Parse a notes blob into { author, stamp, text } entries.
// New entries are stored as "[Rider|Controller <datetime>]: text"; older rider
// notes carry a time-only stamp; the original call-logging note has none.
function parseNotes(notes) {
  if (!notes) return [];
  return String(notes)
    .split("\n\n")
    .map((chunk) => chunk.trim())
    .filter(Boolean)
    .map((chunk) => {
      const m = chunk.match(/^\[(Rider|Controller)\s+(.+?)\]:\s*([\s\S]*)$/);
      if (m) return { author: m[1], stamp: m[2], text: m[3].trim() };
      return { author: null, stamp: null, text: chunk };
    });
}

export default function NotesList({ notes }) {
  const C = useC();
  const entries = parseNotes(notes);
  if (entries.length === 0) return null;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {entries.map((e, i) => {
        const tint = e.author === "Rider" ? C.accentText : C.purple;
        return (
          <div key={i} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: "10px 12px" }}>
            {(e.author || e.stamp) && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
                {e.author && <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: 1, fontFamily: "'IBM Plex Mono',monospace", color: tint, background: tint + "22", padding: "2px 7px", borderRadius: 6 }}>{e.author.toUpperCase()}</span>}
                {e.stamp && <span style={{ fontSize: 10, color: C.muted, fontFamily: "'IBM Plex Mono',monospace" }}>{e.stamp}</span>}
              </div>
            )}
            <div style={{ fontSize: 13, color: C.text, lineHeight: 1.6, whiteSpace: "pre-line" }}>{e.text}</div>
          </div>
        );
      })}
    </div>
  );
}
