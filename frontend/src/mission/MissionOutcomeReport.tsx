import { useEffect } from "react";
import {
  ArrowRight,
  CheckCircle2,
  Minus,
  TrendingDown,
  TrendingUp,
} from "lucide-react";

import { useMissionStore } from "../store/missionStore";

function DeltaRow({ label, value, before, after }: { label: string; value: number; before: number; after: number }) {
  if (value === 0) {
    return (
      <div className="outcome-delta outcome-delta--neutral">
        <Minus size={11} className="shrink-0" />
        <span className="outcome-delta__label">{label}</span>
        <span className="outcome-delta__value">{before}% → {after}% · unchanged</span>
      </div>
    );
  }
  if (value > 0) {
    return (
      <div className="outcome-delta outcome-delta--pos">
        <TrendingUp size={11} className="shrink-0" />
        <span className="outcome-delta__label">{label}</span>
        <span className="outcome-delta__value">{before}% → {after}% · +{value}%</span>
      </div>
    );
  }
  return (
    <div className="outcome-delta outcome-delta--neg">
      <TrendingDown size={11} className="shrink-0" />
      <span className="outcome-delta__label">{label}</span>
      <span className="outcome-delta__value">{before}% → {after}% · {value}%</span>
    </div>
  );
}

export default function MissionOutcomeReport() {
  const emergency = useMissionStore((state) => state.activeEmergency);
  const decision = useMissionStore((state) => state.selectedDecision);
  const delta = useMissionStore((state) => state.appliedResourceDelta);
  const crewSafety = useMissionStore((state) => state.crewSafety);
  const resources = useMissionStore((state) => state.resources);
  const recoveryComplete = useMissionStore((state) => state.recoveryComplete);
  const recoveryDurationMs = useMissionStore((state) => state.recoveryDurationMs);
  const setRecoveryComplete = useMissionStore((state) => state.setRecoveryComplete);
  const resumeOperations = useMissionStore((state) => state.resumeOperations);

  useEffect(() => {
    if (!decision) return;
    const timerId = window.setTimeout(
      setRecoveryComplete,
      recoveryDurationMs
    );
    return () => window.clearTimeout(timerId);
  }, [decision, recoveryDurationMs, setRecoveryComplete]);

  if (!decision || !delta || !emergency) return null;

  const emergencyStatus =
    decision.outcome === "negative"
      ? "UNRESOLVED — ELEVATED RISK"
      : recoveryComplete
        ? "MITIGATED — RECOVERY COMPLETE"
        : "MITIGATED — RECOVERY IN PROGRESS";

  return (
    <div className="outcome-report">
      <div className="outcome-report__header">
        <CheckCircle2
          size={18}
          className={
            decision.outcome === "negative"
              ? "text-orange-400"
              : "text-emerald-400"
          }
        />
        <div>
          <div className="outcome-report__title">MISSION OUTCOME REPORT</div>
          <div className="outcome-report__phase">{emergency.title}</div>
        </div>
      </div>

      <div className="outcome-report__decision">
          <div className="outcome-report__decision-label">{emergency.severity} EMERGENCY · {emergency.detectedAt}</div>
        <div className="outcome-report__decision-value">{decision.shortLabel}</div>
          <p className="outcome-report__explanation">{decision.description}</p>
        <p className="outcome-report__explanation">{decision.consequences}</p>
      </div>

      <section className="outcome-report__event-context">
        <div className="outcome-report__section-label">WHAT HAPPENED</div>
        <p>{emergency.description}</p>
        <div><span>CREW CONDITION</span><strong>{emergency.crewStatus}</strong></div>
        <div><span>AFFECTED SYSTEMS</span><strong>{emergency.affectedSystems.join(" · ")}</strong></div>
        <div><span>DECISION OUTCOME</span><strong>{decision.outcome.toUpperCase()} · CREW SAFETY {decision.crewSafetyDelta > 0 ? "+" : ""}{decision.crewSafetyDelta}%</strong></div>
      </section>

      <div className="outcome-report__section-label">RESOURCE CHANGES</div>
      <div className="outcome-report__deltas">
        {([ ["Oxygen", "oxygen"], ["Water", "water"], ["Power", "power"], ["Food", "food"], ["Radiation safety", "radiationSafety"] ] as const).map(([label, key]) => <DeltaRow key={key} label={label} value={delta[key]} before={Math.max(0, Math.min(100, resources[key] - delta[key]))} after={resources[key]} />)}
      </div>

      <div className="outcome-report__status-grid">
        <div className="outcome-report__status-item">
          <div className="outcome-report__status-label">CREW SAFETY · {crewSafety - decision.crewSafetyDelta}% → {crewSafety}%</div>
          <div
            className={`outcome-report__status-value ${
              crewSafety < 60
                ? "text-red-400"
                : crewSafety < 80
                  ? "text-orange-400"
                  : "text-emerald-400"
            }`}
          >
            {crewSafety}%
          </div>
        </div>
        <div className="outcome-report__status-item">
          <div className="outcome-report__status-label">EVENT STATUS</div>
          <div
            className={`outcome-report__status-value text-xs ${
              decision.outcome === "negative"
                ? "text-red-400"
                : "text-emerald-400"
            }`}
          >
            {emergencyStatus}
          </div>
        </div>
      </div>

      <div
        className={`recovery-progress ${
          recoveryComplete ? "recovery-progress--complete" : ""
        }`}
        role="status"
        aria-live="polite"
      >
        {recoveryComplete
          ? "OUTPOST SYSTEMS READY"
          : "RECOVERY AND SYSTEM CHECKS IN PROGRESS"}
      </div>

      <button
        type="button"
        className="outcome-report__resume"
        onClick={resumeOperations}
        disabled={!recoveryComplete}
      >
        RESUME OPERATIONS
        <ArrowRight size={14} />
      </button>
    </div>
  );
}
