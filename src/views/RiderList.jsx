import { useC } from "../lib/theme.jsx";
import { RunGroups } from "../components/RunCard.jsx";

export default function RiderList({ active, onOpen }) {
  const C = useC();
  const empty = active.length === 0;
  return (
    <div style={{ flex: 1, padding: 16, overflowY: "auto" }}>
      {empty ? (
        <div style={{ textAlign: "center", paddingTop: 80 }}>
          <div style={{ fontSize: 48, marginBottom: 10 }}>🏍</div>
          <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 12, letterSpacing: 2, color: C.muted }}>NO ACTIVE RUNS</div>
        </div>
      ) : <RunGroups active={active} onOpen={onOpen} />}
    </div>
  );
}
