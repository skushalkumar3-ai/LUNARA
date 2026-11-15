import { AlertTriangle, Shield, Zap } from "lucide-react";
import { useMissionStore } from "../store/missionStore";
import CommandLog from "./CommandLog";

/**
 * MissionControlPanel — right-side 35% panel for phase-04-control.
 * Shows emergency info, 3 decision options, and command log.
 */
export default function MissionControlPanel() {
  const emergency = useMissionStore((s) => s.activeEmergency);
  const applyDecision = useMissionStore((s) => s.applyDecision);
  const selectedDecision = useMissionStore((s) => s.selectedDecision);
  const crewSafety = useMissionStore((s) => s.crewSafety);

  if (!emergency) return null;

  const decisionIcons = [Shield, Zap, AlertTriangle];

  return (
    <div className="mission-control-panel">
      {/* Header */}
      <div className="mission-control-panel__header">
        <div className="mission-control-panel__phase">PHASE 04 — ACTIVE MISSION CONTROL</div>
        <div className="mission-control-panel__title">LUNARA</div>
        <div className="mission-control-panel__subtitle">MISSION COORDINATION INTERFACE</div>
      </div>

      {/* Emergency status */}
      <div className="mission-control-panel__emergency-card">
        <div className="mb-1 text-[9px] tracking-[0.14em] text-amber-300">
          LUNARA SIMULATION EVENT
        </div>
        <div className="mission-control-panel__emergency-header">
          <AlertTriangle size={13} className="text-red-400" />
          <span className="mission-control-panel__emergency-title">{emergency.title}</span>
          <span className="mission-control-panel__emergency-severity">
            {emergency.severity}
          </span>
        </div>
        <p className="mission-control-panel__emergency-desc">{emergency.description}</p>
        <div className="mission-control-panel__crew-row">
          <Shield size={11} />
          <span>CREW SAFETY: </span>
          <span className={`mission-control-panel__crew-value ${crewSafety < 60 ? "text-red-400" : crewSafety < 80 ? "text-orange-400" : "text-emerald-400"}`}>
            {crewSafety}%
          </span>
        </div>
      </div>

      {/* Decisions */}
      <div className="mission-control-panel__decisions-label">
        {selectedDecision ? "DECISION EXECUTED" : "SELECT RESPONSE"}
      </div>

      <div className="mission-control-panel__decisions">
        {emergency.decisions.map((decision, i) => {
          const Icon = decisionIcons[i % decisionIcons.length];
          const isSelected = selectedDecision?.id === decision.id;
          const isLocked = !!selectedDecision && !isSelected;

          return (
            <button
              key={decision.id}
              type="button"
              disabled={!!selectedDecision}
              onClick={() => applyDecision(decision)}
              className={`decision-option decision-option--${decision.outcome} ${isSelected ? "decision-option--selected" : ""} ${isLocked ? "decision-option--locked" : ""}`}
            >
              <div className="decision-option__header">
                <Icon size={13} className="shrink-0" />
                <span className="decision-option__label">{decision.label}</span>
              </div>
              <p className="decision-option__desc">{decision.description}</p>
              <div className="decision-option__consequences">
                <span>OUTCOME:</span> {decision.consequences}
              </div>
            </button>
          );
        })}
      </div>

      {/* Command log */}
      <CommandLog />
    </div>
  );
}
