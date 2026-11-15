import { useEffect, useState } from "react";

import { MISSION_EVENTS } from "./MissionEvents";
import CountdownOverlay from "./CountdownOverlay";
import { useMissionStore } from "../store/missionStore";

export default function MissionTimer() {
  const missionPhase = useMissionStore((state) => state.missionPhase);
  const currentEventIndex = useMissionStore((state) => state.currentEventIndex);
  const hasPriorEmergency = useMissionStore(
    (state) => state.eventHistory.length > 0
  );
  const countdownStartedAt = useMissionStore((state) => state.countdownStartedAt);
  const countdownSeconds = useMissionStore((state) => state.countdownSeconds);
  const triggerEmergency = useMissionStore((state) => state.triggerEmergency);
  const [now, setNow] = useState(() => Date.now());
  const effectiveNow = Math.max(now, countdownStartedAt ?? now);

  const isCountingDown =
    missionPhase === "phase-01-normal" &&
    countdownStartedAt !== null &&
    currentEventIndex < MISSION_EVENTS.length;
  const remainingSeconds = isCountingDown
    ? Math.max(
        0,
        Math.ceil(
          (countdownStartedAt + countdownSeconds * 1000 - effectiveNow) / 1000
        )
      )
    : null;

  useEffect(() => {
    if (!isCountingDown) return;
    const intervalId = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(intervalId);
  }, [countdownStartedAt, isCountingDown]);

  useEffect(() => {
    if (remainingSeconds !== 0) return;
    const event = MISSION_EVENTS[currentEventIndex];
    if (!event) {
      throw new Error(`No mission event exists at index ${currentEventIndex}.`);
    }
    triggerEmergency(event, currentEventIndex);
  }, [currentEventIndex, remainingSeconds, triggerEmergency]);

  if (remainingSeconds === null) return null;
  return (
    <CountdownOverlay
      seconds={remainingSeconds}
      exploration={hasPriorEmergency}
    />
  );
}
