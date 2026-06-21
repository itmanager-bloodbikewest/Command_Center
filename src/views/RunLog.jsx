import { useC } from "../lib/theme.jsx";
import { RunGroups } from "../components/RunCard.jsx";

export default function RunLog({ pending, onOpen, onNewCall }) {
  const C = useC();
  const empty = pending.length === 0;
  return (
    <div style={{ flex: 1, padding: 16, overflowY: "auto" }}>
      {empty ? (
        <div style={{ textAlign: "center", paddingTop: 80 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>📋</div>
          <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 12, letterSpacing: 2, color: C.muted }}>NO RUNS LOGGED TODAY</div>
          {onNewCall && <div style={{ fontSize: 12, color: C.muted, marginTop: 6 }}>Press <button onClick={onNewCall} style={{ background: "none", border: "none", padding: 0, font: "inherit", color: C.accentText, fontWeight: 700, cursor: "pointer", textDecoration: "underline" }}>+ NEW CALL</button> to begin</div>}
        </div>
      ) : <RunGroups active={pending} onOpen={onOpen} />}
    </div>
  );
}
