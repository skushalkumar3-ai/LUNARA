import { useEffect, useRef, useState } from "react";
import { AlertTriangle, Radio, Shield, Zap } from "lucide-react";
import { useMissionStore } from "../store/missionStore";

/**
 * EmergencyAlert — cinematic overlay shown during phase-02-emergency.
 * Does NOT replace the 3D scene; sits on top with semi-transparency.
 */
export default function EmergencyAlert() {
  const emergency = useMissionStore((s) => s.activeEmergency);
  const beginEmergencyAssessment = useMissionStore(
    (s) => s.beginEmergencyAssessment
  );
  const [visible, setVisible] = useState(false);
  const [blink, setBlink] = useState(true);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Fade in
  useEffect(() => {
    const id = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(id);
  }, []);

  // Warning blink
  useEffect(() => {
    const id = setInterval(() => setBlink((b) => !b), 650);
    return () => clearInterval(id);
  }, []);

  // Web Audio API warning tone (no external file needed)
  useEffect(() => {
    try {
      const ctx = new AudioContext();
      audioCtxRef.current = ctx;

      function beep(freq: number, start: number, duration: number, vol = 0.18) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = freq;
        osc.type = "sine";
        gain.gain.setValueAtTime(0, ctx.currentTime + start);
        gain.gain.linearRampToValueAtTime(vol, ctx.currentTime + start + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + duration);
        osc.start(ctx.currentTime + start);
        osc.stop(ctx.currentTime + start + duration + 0.05);
      }

      // Three-pulse alert tone
      beep(880, 0.0, 0.18);
      beep(880, 0.28, 0.18);
      beep(1100, 0.56, 0.3);
    } catch {
      // Audio not available; skip silently
    }

    return () => {
      audioCtxRef.current?.close().catch(() => {});
    };
  }, []);

  if (!emergency) return null;

  function handleAssess() {
    beginEmergencyAssessment();
  }

  const severityColors: Record<NonNullable<typeof emergency>["severity"], string> = {
    LOW: "text-yellow-300",
    MEDIUM: "text-orange-300",
    HIGH: "text-red-400",
    CRITICAL: "text-red-300",
  };

  return (
    <div
      data-screen-obstacle="true"
      className={`emergency-overlay transition-opacity duration-700 ${visible ? "opacity-100" : "opacity-0"}`}
      role="alert"
      aria-live="assertive"
    >
      {/* Scan line effect */}
      <div className="emergency-scanlines" />

      {/* Top alert bar */}
      <div className={`emergency-top-bar ${blink ? "emergency-top-bar--on" : "emergency-top-bar--off"}`}>
        <AlertTriangle size={14} />
        <span>EMERGENCY ALERT — {emergency.title}</span>
        <AlertTriangle size={14} />
      </div>

      {/* Main card — centered */}
      <div className="emergency-card">
        {/* Header */}
        <div className="emergency-card__header">
          <div className="emergency-card__icon-wrap">
            <Zap size={28} className="text-red-400" />
          </div>
          <div>
            <div className="text-[9px] tracking-[0.14em] text-amber-300">
              LUNARA SIMULATION EVENT
            </div>
            <div className="emergency-card__title">{emergency.title}</div>
            <div className={`emergency-card__severity ${severityColors[emergency.severity]}`}>
              SEVERITY: {emergency.severity}
            </div>
          </div>
        </div>

        {/* Detection time */}
        <div className="emergency-card__time">
          <Radio size={11} />
          DETECTED AT: {emergency.detectedAt}
        </div>

        {/* Description */}
        <p className="emergency-card__desc">{emergency.description}</p>

        {/* Crew status */}
        <div className="emergency-card__crew-status">
          <Shield size={13} />
          <div>
            <div className="emergency-card__crew-label">CREW STATUS</div>
            <div className="emergency-card__crew-value">{emergency.crewStatus}</div>
          </div>
        </div>

        {/* Affected systems */}
        <div className="emergency-card__systems">
          <div className="emergency-card__systems-label">AFFECTED SYSTEMS</div>
          <div className="emergency-card__systems-list">
            {emergency.affectedSystems.map((sys) => (
              <span key={sys} className="emergency-card__system-chip">
                {sys}
              </span>
            ))}
          </div>
        </div>

        {/* CTA */}
        <button
          type="button"
          className="emergency-card__cta"
          onClick={handleAssess}
        >
          ASSESS SITUATION
        </button>
      </div>

      {/* Corner decorations */}
      <div className="emergency-corner emergency-corner--tl" />
      <div className="emergency-corner emergency-corner--tr" />
      <div className="emergency-corner emergency-corner--bl" />
      <div className="emergency-corner emergency-corner--br" />
    </div>
  );
}
