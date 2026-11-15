import { useEffect, useState } from "react";
import { Radio, Shield, User } from "lucide-react";
import { useMissionStore } from "../store/missionStore";

/**
 * ArjunIntroPanel — left-side profile + briefing shown during phase-03-arjun.
 * Fades in after camera focus completes.
 */
interface Props {
  visible: boolean;
}

export default function ArjunIntroPanel({ visible }: Props) {
  const acceptCommand = useMissionStore((s) => s.acceptCommand);
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    if (!visible) return;
    const id = setTimeout(() => setEntered(true), 80);
    return () => clearTimeout(id);
  }, [visible]);

  if (!visible) return null;

  function handleTakeCommand() {
    acceptCommand();
  }

  return (
    <div data-screen-obstacle="true" className={`arjun-panel transition-all duration-700 ${entered ? "arjun-panel--visible" : "arjun-panel--hidden"}`}>
      {/* Header */}
      <div className="arjun-panel__header">
        <Radio size={11} />
        MISSION COMMUNICATOR ACTIVE
      </div>

      {/* Avatar / identifier */}
      <div className="arjun-panel__avatar-row">
        <div className="arjun-panel__avatar">
          <User size={28} className="text-cyan-200" />
        </div>
        <div>
          <div className="arjun-panel__name">ARJUN SHARMA</div>
          <div className="arjun-panel__role">Mission Communicator</div>
          <div className="arjun-panel__status">
            <span className="arjun-panel__status-dot" />
            STATION ACTIVE
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="arjun-panel__divider" />

      {/* Responsibilities */}
      <div className="arjun-panel__section-label">RESPONSIBILITIES</div>
      <p className="arjun-panel__responsibilities">
        Responsible for monitoring outpost communications, coordinating mission information, and
        supporting communication between the lunar crew and mission operations.
      </p>

      {/* Divider */}
      <div className="arjun-panel__divider" />

      {/* Briefing */}
      <div className="arjun-panel__briefing">
        <Shield size={13} className="arjun-panel__briefing-icon" />
        <p className="arjun-panel__briefing-text">
          "You are now responsible for coordinating the emergency response. The crew is depending on
          your decisions. Assess the situation carefully and select the appropriate response."
        </p>
      </div>

      {/* CTA */}
      <button
        type="button"
        className="arjun-panel__cta"
        onClick={handleTakeCommand}
      >
        TAKE COMMAND
      </button>

      <div className="arjun-panel__footer">
        Mission Day 001 · Shackleton Rim · Site 04
      </div>
    </div>
  );
}
