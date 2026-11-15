import { ArrowLeft, CheckCircle2, RotateCcw, Trophy } from "lucide-react";
import { useState } from "react";

import { MISSION_EVENTS } from "./MissionEvents";
import { CREW_ROSTER } from "../scenes/crewRoster";
import { useMissionStore, type ResourceLevels } from "../store/missionStore";

const RESOURCE_ROWS: ReadonlyArray<[keyof ResourceLevels, string]> = [
  ["oxygen", "OXYGEN"],
  ["water", "WATER"],
  ["power", "POWER"],
  ["food", "FOOD"],
  ["radiationSafety", "RADIATION SAFETY"],
];

function formatDelta(value: number | undefined): string {
  if (value === undefined || value === 0) return "—";
  return `${value > 0 ? "+" : ""}${value}%`;
}

export default function MissionCompletionReport() {
  const resources = useMissionStore((state) => state.resources);
  const crewSafety = useMissionStore((state) => state.crewSafety);
  const history = useMissionStore((state) => state.eventHistory);
  const commandLog = useMissionStore((state) => state.commandLog);
  const systemStatus = useMissionStore((state) => state.systemStatus);
  const missionTestMode = useMissionStore((state) => state.missionTestMode);
  const resetMission = useMissionStore((state) => state.resetMission);
  const [celebrating, setCelebrating] = useState(false);

  const resolvedEvents = history.filter((record) => record.decision !== null);
  const outcomeCounts = resolvedEvents.reduce(
    (counts, record) => {
      if (record.decision) counts[record.decision.outcome] += 1;
      return counts;
    },
    { positive: 0, neutral: 0, negative: 0 }
  );
  const systemStatuses = [
    ["HABITAT / THERMAL", systemStatus.temperatureMode.toUpperCase()],
    ["RADIATION MITIGATION", systemStatus.habitatShield ? "HABITAT SHIELD ACTIVE" : systemStatus.crewSheltered ? "CREW SHELTERED" : systemStatus.astronautExposure ? "EXPOSURE REMAINS" : "NO ACTIVE MITIGATION"],
    ["POWER", systemStatus.backupPower ? "BACKUP POWER ACTIVE" : systemStatus.criticalSystemsMode ? "CRITICAL LOADS PRIORITIZED" : systemStatus.solarArrayUnstable ? "ARRAY INSTABILITY REMAINS" : "NO ACTIVE MITIGATION"],
    ["WATER", systemStatus.waterReserve ? "EMERGENCY RESERVE ACTIVE" : systemStatus.waterRepair ? "REPAIR MODE ACTIVE" : systemStatus.waterRationing ? "RATIONING ACTIVE" : "NO ACTIVE MITIGATION"],
    ["OXYGEN", systemStatus.oxygenReserve ? "EMERGENCY RESERVE ACTIVE" : systemStatus.oxygenRepair ? "GENERATOR REPAIR ACTIVE" : systemStatus.oxygenConservation ? "CONSERVATION ACTIVE" : "NO ACTIVE MITIGATION"],
    ["SOLAR ARRAY", systemStatus.solarArrayUnstable ? "UNSTABLE" : "NO ACTIVE FAULT TRACKED"],
    ["ROVER / COMMUNICATIONS", "NO OPERATIONAL TELEMETRY TRACKED"],
  ];

  function returnToOutpost() {
    setCelebrating(false);
    resetMission();
    window.dispatchEvent(new Event("lunara:return-to-outpost-camera"));
  }

  function restartMission() {
    resetMission();
    window.dispatchEvent(new Event("lunara:restart-mission-flow"));
  }

  return (
    <section className={`mission-finish-screen ${celebrating ? "mission-finish-screen--celebration" : ""}`} aria-label={celebrating ? "Mission celebration" : "Full mission report"}>
      {celebrating ? (
        <div className="mission-celebration" role="status">
          <div className="mission-celebration__stars" />
          <div className="mission-celebration__content">
            <Trophy className="mission-celebration__icon" size={42} />
            <p className="mission-celebration__eyebrow">LUNARA · LUNAR RESEARCH OUTPOST</p>
            <h1>{missionTestMode ? "MISSION EVENT COMPLETE" : "MISSION COMPLETE"}</h1>
            <p className="mission-celebration__edition">FLIGHT OPERATIONS · FINAL CREW ACKNOWLEDGEMENT</p>
            <p className="mission-celebration__thanks">Thank you for being part of the mission.</p>
            <div className="mission-celebration__summary">
              <span>{resolvedEvents.length} {missionTestMode ? "EVENT" : "EMERGENCIES"} RESOLVED</span>
              <span>{resolvedEvents.filter((record) => record.decision).length} DECISIONS RECORDED</span>
              <span>CREW SAFETY {crewSafety}%</span>
            </div>
            <button className="mission-finish-primary" type="button" onClick={returnToOutpost}><ArrowLeft size={18} /> RETURN TO OUTPOST</button>
            <button className="mission-finish-secondary" type="button" onClick={() => setCelebrating(false)}>VIEW MISSION REPORT</button>
            {!missionTestMode && <button className="mission-finish-secondary" type="button" onClick={restartMission}><RotateCcw size={15} /> RESTART MISSION</button>}
          </div>
        </div>
      ) : (
        <div className="full-mission-report">
          <header className="full-mission-report__header">
            <div><p>LUNARA · LUNAR RESEARCH OUTPOST</p><h1>{missionTestMode ? "MISSION EVENT REPORT" : "MISSION COMPLETION REPORT"}</h1><span>{resolvedEvents.length} of {missionTestMode ? "1 test event" : `${MISSION_EVENTS.length} scheduled emergencies`} resolved · {resolvedEvents.length} decisions recorded</span></div>
            <div className="full-mission-report__complete"><CheckCircle2 size={22} /> {missionTestMode ? "TEST COMPLETE" : "MISSION COMPLETE"}</div>
          </header>

          <section className="full-report-hero">
            <div><span>MISSION OUTCOME</span><strong>{outcomeCounts.positive} PROTECTIVE · {outcomeCounts.neutral} MIXED · {outcomeCounts.negative} ADVERSE</strong></div>
            <div><span>CREW SAFETY SIMULATION</span><strong>{crewSafety}%</strong></div>
            <div><span>MISSION DURATION</span><strong>NOT TRACKED</strong></div>
          </section>

          <section className="full-report-section">
            <h2>FINAL RESOURCE TELEMETRY <small>LUNARA SIMULATION VALUES</small></h2>
            <div className="full-report-resource-grid">{RESOURCE_ROWS.map(([key, label]) => <article className="full-report-resource" key={key}><div><span>{label}</span><strong>{resources[key]}%</strong></div><div className="full-report-resource__track"><i style={{ width: `${resources[key]}%` }} /></div><small>FINAL STORED LEVEL</small></article>)}</div>
          </section>

          <section className="full-report-section">
            <h2>CREW REPORT <small>FIVE CREW MEMBERS · AGGREGATE STATUS ONLY</small></h2>
            <div className="full-report-crew-grid">{CREW_ROSTER.map((member) => <article key={member.id}><span className="full-report-crew__dot" /><div><strong>{member.name}</strong><small>{member.role}</small><p>{member.responsibilities}</p></div></article>)}</div>
            <p className="full-report-note">Crew safety is the tracked simulation value shown above. Individual crew health telemetry is not modeled.</p>
          </section>

          <section className="full-report-section">
            <h2>OUTPOST SYSTEMS AT END OF MISSION</h2>
            <div className="full-report-system-grid">{systemStatuses.map(([system, status]) => <div key={system}><span>{system}</span><strong>{status}</strong></div>)}</div>
          </section>

          <section className="full-report-section">
            <h2>EMERGENCY HISTORY & DECISIONS</h2>
            <div className="full-report-table-wrap"><table className="full-report-table"><thead><tr><th># / EVENT DETAILS</th><th>RESPONSE & CONSEQUENCES</th><th>OUTCOME</th><th>RESOURCE DELTA · O₂ / H₂O / PWR / FOOD / RAD</th><th>CREW SAFETY AFTER</th></tr></thead><tbody>{history.map((record, index) => { const event = MISSION_EVENTS.find((item) => item.id === record.eventId); return <tr key={record.eventId}><td><strong>{String(index + 1).padStart(2, "0")} · {record.eventTitle}</strong><small>{commandLog.find((entry) => entry.action.includes(record.eventTitle))?.timestamp ?? event?.detectedAt ?? "TIME NOT RECORDED"}</small><p>{event?.description ?? "Event details unavailable."}</p><small>AFFECTED: {event?.affectedSystems.join(" · ") ?? "NOT RECORDED"}</small></td><td>{record.decision ? <><strong>{record.decision.shortLabel}</strong><p>{record.decision.description}</p><small>{record.decision.consequences}</small></> : "No response recorded"}</td><td><strong>{record.decision?.outcome.toUpperCase() ?? "PENDING"}</strong></td><td>{record.resourceDelta ? `${formatDelta(record.resourceDelta.oxygen)} / ${formatDelta(record.resourceDelta.water)} / ${formatDelta(record.resourceDelta.power)} / ${formatDelta(record.resourceDelta.food)} / ${formatDelta(record.resourceDelta.radiationSafety)}` : "—"}</td><td>{record.crewSafetyAfter === null ? "—" : `${record.crewSafetyAfter}%`}</td></tr>; })}</tbody></table></div>
          </section>

          <section className="full-report-section">
            <h2>MISSION LOG <small>{commandLog.length} RECORDED ENTRIES</small></h2>
            <div className="full-report-log">{commandLog.length ? commandLog.slice().reverse().map((entry, index) => <article key={`${entry.timestamp}-${index}`}><time>{entry.timestamp}</time><strong>{entry.action}</strong><p>{entry.result}</p></article>) : <p className="full-report-note">No mission log entries were recorded.</p>}</div>
          </section>

          <footer className="full-report-footer"><p>Review the complete report before ending the mission.</p><button className="mission-finish-primary" type="button" onClick={() => setCelebrating(true)}>END MISSION <ArrowLeft size={17} /></button>{!missionTestMode && <button className="mission-finish-secondary" type="button" onClick={restartMission}><RotateCcw size={15} /> RESTART MISSION</button>}</footer>
        </div>
      )}
    </section>
  );
}
