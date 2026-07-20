import { useC } from "../lib/theme.jsx";
import { RunGroups } from "../components/RunCard.jsx";

export default function RunLog({ pending, onOpen, onNewCall, onComplete, vehicles }) {
  const C = useC();
  const empty = pending.length === 0;
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflowY: "auto" }}>
      {/* + NEW CALL button — centred at top of run log */}
      {onNewCall && (
        <div style={{ padding: "16px 16px 0", display: "flex", justifyContent: "center" }}>
          <button onClick={onNewCall}
            style={{ background: C.accent, border: "none", color: "#fff", padding: "14px 32px", borderRadius: 10, fontSize: 14, cursor: "pointer", fontFamily: "'Atkinson Hyperlegible','IBM Plex Sans',sans-serif", fontWeight: 700, letterSpacing: 0.5, boxShadow: `0 0 20px ${C.accent}44`, width: "100%", maxWidth: 400 }}>
            + NEW CALL
          </button>
        </div>
      )}
      <div style={{ flex: 1, padding: 16, overflowY: "auto" }}>
        {empty ? (
          <div style={{ textAlign: "center", paddingTop: 60 }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📋</div>
            <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 12, letterSpacing: 2, color: C.muted }}>NO ACTIVE RUNS</div>
          </div>
        ) : <RunGroups active={pending} onOpen={onOpen} onComplete={onComplete} vehicles={vehicles} />}
      </div>
    </div>
  );
}
