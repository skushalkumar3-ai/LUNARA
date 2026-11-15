import { CheckCircle, Info, AlertTriangle, XCircle } from "lucide-react";
import { useMissionStore, type CommandEntry } from "../store/missionStore";

function EntryIcon({ type }: { type: CommandEntry["type"] }) {
  if (type === "success") return <CheckCircle size={11} className="text-emerald-400 shrink-0 mt-0.5" />;
  if (type === "warning") return <AlertTriangle size={11} className="text-orange-400 shrink-0 mt-0.5" />;
  if (type === "critical") return <XCircle size={11} className="text-red-400 shrink-0 mt-0.5" />;
  return <Info size={11} className="text-cyan-400 shrink-0 mt-0.5" />;
}

export default function CommandLog() {
  const log = useMissionStore((s) => s.commandLog);

  return (
    <div className="command-log">
      <div className="command-log__header">
        <div className="command-log__title">COMMAND LOG</div>
        <div className="command-log__count">{log.length} ENTRIES</div>
      </div>
      <div className="command-log__entries">
        {log.map((entry, i) => (
          <div key={i} className={`command-log__entry command-log__entry--${entry.type}`}>
            <EntryIcon type={entry.type} />
            <div className="command-log__entry-body">
              <div className="command-log__entry-action">{entry.action}</div>
              <div className="command-log__entry-result">{entry.result}</div>
              <div className="command-log__entry-time">{entry.timestamp}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
