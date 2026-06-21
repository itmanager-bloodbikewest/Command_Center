import { useC } from "../lib/theme.jsx";
import { RunGroups } from "../components/RunCard.jsx";

export default function DispatcherLog({ pending, completed, onOpen }) {
  const C = useC();
  const empty = pending.length === 0 && completed.length === 0;
  return (
    <div style={{ flex: 1, padding: 16, overflowY: "auto" }}>
      {empty ? (
        <div style={{ textAlign: "center", paddingTop: 80 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>📋</div>
          <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 12, letterSpacing: 2, color: C.muted }}>NO RUNS LOGGED TODAY</div>
          <div style={{ fontSize: 12, color: C.muted, marginTop: 6 }}>Press <strong style={{ color: C.accentText }}>+ NEW CALL</strong> to begin</div>
        </div>
      ) : <RunGroups active={pending} completed={completed} onOpen={onOpen} />}
    </div>
  );
}
